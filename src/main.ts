import './style/base.css';
import './style/shell.css';
import './style/modes.css';
import './style/art.css';
import { h, bus, session, store, grantXp, rand, VERSION } from './os/kernel';
import { runBoot } from './os/boot';
import { runLogin } from './os/login';
import { mountDesktop, mountActionBar, mountHotkeys, launch, closeStartMenu } from './os/shell';
import { registerAllApps } from './apps';
import { achievements } from './os/achievements';
import { notify, dialog } from './os/ui';
import { sound } from './os/sound';
import { wm } from './os/wm';
import { applySavedTalents } from './apps/talents';
import { deliverMail } from './apps/mailbox';
import { stopMusic } from './apps/jukebox';
import { icon } from './os/icons';
import { content } from './os/content';
import { questEngine } from './os/quests';

const root = document.getElementById('os')!;
registerAllApps();

const WHISPERS = [
  ['Innkeeper Allison', 'Your room is still upstairs. Rooms are 1s a night, stories are free.'],
  ['Pixelbrand', 'Portal to the Riverglades at the stone in 5. Bring water.'],
  ['Skyborne Emissary', 'The gales are restless tonight. Zephras drifts a little closer.'],
  ['Grimtotem', 'Barrow Deeps prep: 10 people, one healer short. Interested?'],
  ['A.', 'Have you looked in the Grave yet?'],
  ['Auctioneer', 'Your auction of 1 Crafted Campfire has sold.'],
  ['Thundorin', 'ding 12! Dwarf Shaman is real and I love it.'],
];

async function startSession(fastBoot = false) {
  root.innerHTML = '';
  await runBoot(root, fastBoot);
  const user = await runLogin(root);
  root.innerHTML = '';
  mountDesktop(root); mountActionBar(root); mountHotkeys();
  applySavedTalents();
  sound.unlock();
  questEngine.init();
  content.start();

  const first = !store.get('welcomed', false);
  setTimeout(() => {
    achievements.unlock('first-login');
    if (first) { store.set('welcomed', true); launch('countdown'); setTimeout(() => notify('Welcome to GeekOS', `Hail, <b>${user.name}</b>. Alt+Space opens the Hearth menu. Right-click the desktop to change the vista.`, 'sparkles', { timeout: 9000 }), 900); }
    else notify(`Welcome back, ${user.name}`, `Level ${user.level} ${user.race} ${user.cls}. ${rand(['The desk missed you.', 'Azeroth is where you left it.', 'Adventure. Forever.'])}`, 'hearth', { timeout: 5000 });
    if (user.level >= 60) document.documentElement.classList.add('maxlevel');
  }, 700);

  // occasional whispers & letters from NPCs (opt-out in Talents)
  const whisperTimer = setInterval(() => {
    if (!store.get('ui.whispers', true) || Math.random() > 0.35) return;
    const [from, text] = rand(WHISPERS); sound.whisper();
    notify(`${from} whispers`, text, 'mail', { onClick: () => launch('mailbox'), sound: false });
    if (Math.random() < 0.4) deliverMail({ from, subject: text.slice(0, 40) + (text.length > 40 ? '…' : ''), body: text + '\n\n— ' + from });
  }, 4 * 60 * 1000);

  // idle XP: rested experience while the desktop is open
  const restedTimer = setInterval(() => { if (document.visibilityState === 'visible') grantXp(2, 'rested'); }, 60 * 1000);
  const saveTimer = setInterval(() => session.save(), 30 * 1000);
  addEventListener('beforeunload', () => session.save());

  const offContent = bus.on('content:update', ({ fresh }: any) => { if (fresh?.length) { const f = fresh.filter((n: any) => n.forever); notify(f.length ? 'Forever news from Blizzard' : 'News from Azeroth', `<b>${(f[0] ?? fresh[0]).title}</b>${fresh.length > 1 ? ` and ${fresh.length - 1} more` : ''}`, 'bell', { onClick: () => launch('news'), timeout: 10000 }); } });
  const teardown = () => { offContent(); content.stop(); clearInterval(whisperTimer); clearInterval(restedTimer); clearInterval(saveTimer); session.save(); stopMusic(); wm.closeAll(); closeStartMenu(); };
  bus.once('logout', () => { teardown(); startSession(true); });
  bus.once('shutdown', async () => {
    teardown();
    root.innerHTML = '';
    const el = h('div', { class: 'boot' }, h('div', { class: 'sigil', html: icon('hearth'), style: { width: '120px', height: '120px', border: '2px solid var(--gold-500)', borderRadius: '6px', overflow: 'hidden' } }), h('div', { class: 'title display' }, 'Until next time'), h('div', { class: 'sub' }, 'Adventure. Forever.'), h('div', { class: 'status' }, `Time played this session: ${Math.floor((Date.now() - session.bootedAt) / 60000)} min`), h('button', { class: 'btn gold', style: { marginTop: '10px' }, onclick: () => startSession(true) }, 'Return to Azeroth'));
    root.append(el); sound.hearth();
    if (window.geekos?.isElectron) setTimeout(() => (window as any).geekos?.quit?.(), 2500);
  });
  bus.on('lock', () => lockScreen(user.name));
  bus.on('leeroy', () => { const el = h('div', { style: { position: 'absolute', inset: '0', zIndex: '9500', pointerEvents: 'none', display: 'grid', placeItems: 'center' } }, h('div', { class: 'display', style: { fontSize: '72px', animation: 'pop .6s cubic-bezier(.2,.9,.3,1.3)', textAlign: 'center' } }, 'LEEEEEROY', h('div', { style: { fontSize: '40px' } }, 'JENKINS!'))); root.append(el); sound.horn(); setTimeout(() => el.remove(), 2600); });
}

function lockScreen(name: string) {
  closeStartMenu();
  const t = h('div', { class: 'big' }); const d = h('div', { class: 'dd' });
  const upd = () => { const n = new Date(); t.textContent = n.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); d.textContent = n.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }); };
  upd(); const iv = setInterval(upd, 1000);
  const el = h('div', { class: 'lock' }, h('div', { class: 'card frame' }, h('div', { style: { width: '80px', height: '80px', margin: '0 auto 10px' }, html: icon('lock') }), t, d, h('div', { class: 'hr' }), h('div', { class: 'eyebrow' }, `${name} is away from keyboard`), h('button', { class: 'btn gold', style: { marginTop: '14px' }, onclick: () => { clearInterval(iv); el.remove(); sound.open(); } }, 'Return')));
  root.append(el);
  const key = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === 'Escape') { clearInterval(iv); el.remove(); removeEventListener('keydown', key); } }; addEventListener('keydown', key);
}

// global error surface (a fizzled spell should never take the desktop down)
addEventListener('error', (e) => { console.error(e.error); try { notify('A spell fizzled', String(e.message).slice(0, 120), 'faq', { sound: false }); } catch {} });
addEventListener('unhandledrejection', (e) => { console.error(e.reason); });
console.log(`%cGeekOS ${VERSION}%c — Adventure. Forever.  Type /help in the Console. Or try the old code.`, 'color:#e9c874;font-weight:bold;font-size:14px', 'color:#9fb3bd');
void dialog;
startSession(new URLSearchParams(location.search).has('fast'));
