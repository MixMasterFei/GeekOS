/* GeekOS desktop shell (Electron). Loads the built app, hosts the Battle.net proxy in the main process,
   and keeps itself updated from GitHub Releases (electron-updater). */
const { app, BrowserWindow, ipcMain, shell, safeStorage } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const isDev = !!process.env.GEEKOS_DEV_URL;
let win = null;
const tokens = new Map();

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

function create() {
  win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 960, minHeight: 600, show: false, backgroundColor: '#04141b', title: 'GeekOS — Adventure. Forever.',
    autoHideMenuBar: true, icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: false },
  });
  win.once('ready-to-show', () => { win.show(); if (!isDev) win.maximize(); setupUpdater(); });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  if (isDev) win.loadURL(process.env.GEEKOS_DEV_URL); else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());
