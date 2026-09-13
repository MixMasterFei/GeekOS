/* GeekOS desktop shell (Electron). Serves the built app over a private app:// scheme (so absolute
   asset paths and fetch work exactly like on the web), hosts the Battle.net proxy in the main
   process, and keeps itself updated from GitHub Releases (electron-updater). */
const { app, BrowserWindow, ipcMain, shell, safeStorage, protocol, net } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

const isDev = !!process.env.GEEKOS_DEV_URL;
const DIST = path.join(__dirname, '..', 'dist');
let win = null;
const tokens = new Map();

// ---------- app:// scheme serving ./dist ----------
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }]);
function serveDist() {
  protocol.handle('app', (req) => {
    const u = new URL(req.url);
    let p = decodeURIComponent(u.pathname); if (p === '/' || p === '') p = '/index.html';
    const file = path.normalize(path.join(DIST, p));
    if (!file.startsWith(DIST)) return new Response('forbidden', { status: 403 });
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) return new Response('not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
}

// ---------- Battle.net proxy ----------
function credsFile() { return path.join(app.getPath('userData'), 'bnet.cred'); }
function loadCreds() { try { const raw = fs.readFileSync(credsFile()); const txt = safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(raw) : raw.toString('utf8'); return JSON.parse(txt); } catch { return {}; } }
function saveCreds(c) { try { const txt = JSON.stringify(c); fs.writeFileSync(credsFile(), safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(txt) : txt); } catch {} }
async function token(region, id, secret) {
  const key = region + ':' + id; const c = tokens.get(key); if (c && c.exp > Date.now() + 60000) return c.token;
  const res = await fetch('https://oauth.battle.net/token', { method: 'POST', headers: { authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'), 'content-type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' });
  if (!res.ok) throw new Error(`Battle.net OAuth refused the client (${res.status}). Check Client ID / Secret.`);
  const j = await res.json(); tokens.set(key, { token: j.access_token, exp: Date.now() + j.expires_in * 1000 }); return j.access_token;
}
ipcMain.handle('bnet', async (_e, o) => {
  const stored = loadCreds(); const id = o.clientId || stored.id || process.env.BNET_CLIENT_ID; const secret = o.clientSecret || stored.secret || process.env.BNET_CLIENT_SECRET;
  if (o.clientId && o.clientSecret && (o.clientId !== stored.id || o.clientSecret !== stored.secret)) saveCreds({ id: o.clientId, secret: o.clientSecret });
  if (!id || !secret) throw new Error('No Battle.net API client configured. Enter it in Settings → Battle.net.');
  if (!/^\/(profile|data)\/wow\//.test(o.path)) throw new Error('Path must be a /profile/wow or /data/wow route');
  const t = await token(o.region, id, secret);
  const url = `https://${o.region}.api.blizzard.com${o.path}?namespace=${encodeURIComponent(o.namespace)}&locale=${encodeURIComponent(o.locale || 'en_US')}`;
  const res = await fetch(url, { headers: { authorization: 'Bearer ' + t } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.detail || body.error || `Blizzard answered ${res.status}`);
  return body;
});
ipcMain.on('quit', () => app.quit());

// ---------- Auto-update (GitHub Releases) ----------
let autoUpdater = null;
function setupUpdater() {
  if (isDev || !app.isPackaged) return;
  try {
    ({ autoUpdater } = require('electron-updater'));
    autoUpdater.autoDownload = true; autoUpdater.autoInstallOnAppQuit = true;
    const send = (payload) => { try { win?.webContents.send('update', payload); } catch {} };
    autoUpdater.on('checking-for-update', () => send({ state: 'checking' }));
    autoUpdater.on('update-available', (i) => send({ state: 'available', version: i.version }));
    autoUpdater.on('update-not-available', () => send({ state: 'none' }));
    autoUpdater.on('download-progress', (p) => send({ state: 'downloading', percent: Math.round(p.percent) }));
    autoUpdater.on('update-downloaded', (i) => send({ state: 'ready', version: i.version }));
    autoUpdater.on('error', (e) => send({ state: 'error', message: String(e?.message ?? e) }));
    autoUpdater.checkForUpdates().catch(() => {});
    setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 6 * 60 * 60 * 1000);
  } catch (e) { console.warn('updater unavailable', e); }
}
ipcMain.handle('update:check', async () => {
  if (!autoUpdater) return { message: isDev || !app.isPackaged ? 'Auto-update only runs in the packaged desktop build.' : 'Updater unavailable.' };
  const r = await autoUpdater.checkForUpdates();
  const v = r?.updateInfo?.version; const cur = app.getVersion();
  return { message: v && v !== cur ? `Version ${v} is available and will install on restart (you have ${cur}).` : `GeekOS ${cur} is the latest version.` };
});
ipcMain.handle('app:version', () => app.getVersion());

function create() {
  win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 960, minHeight: 600, show: false, backgroundColor: '#04141b', title: 'GeekOS — Adventure. Forever.',
    autoHideMenuBar: true, icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: false },
  });
  win.once('ready-to-show', () => { win.show(); if (!isDev && !process.env.GEEKOS_SMOKE) win.maximize(); setupUpdater(); });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('console-message', (_e, level, msg) => { if (level >= 2 || process.env.GEEKOS_SMOKE) console.log(`[renderer:${level}] ${msg}`); });
  if (isDev) win.loadURL(process.env.GEEKOS_DEV_URL); else win.loadURL('app://geekos/' + (process.env.GEEKOS_SMOKE ? '?fast' : ''));
  // Smoke mode (CI / self-test): capture a screenshot after boot and exit.
  if (process.env.GEEKOS_SMOKE) {
    const out = process.env.GEEKOS_SMOKE;
    setTimeout(async () => {
      try {
        const ok = await win.webContents.executeJavaScript(`(() => { const b = document.querySelector('.login,.boot,.desktop'); const imgs = [...document.images]; const broken = imgs.filter(i => i.complete && i.naturalWidth === 0).length; return { stage: b ? b.className : 'none', images: imgs.length, broken }; })()`);
        console.log('[smoke]', JSON.stringify(ok));
        const img = await win.webContents.capturePage(); fs.writeFileSync(out, img.toPNG()); console.log('[smoke] screenshot', out);
      } catch (e) { console.error('[smoke] failed', e); }
      app.quit();
    }, 7000);
  }
}
app.whenReady().then(() => { serveDist(); create(); });
app.on('window-all-closed', () => app.quit());
