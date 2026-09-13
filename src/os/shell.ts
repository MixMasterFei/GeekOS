/**
 * The shell: desktop, action bar (taskbar), Hearth menu (start menu), tray, clock, hotkeys.
 */
import { h, bus, apps, appList, session, store, fmtTime, fmtDate, xpToLevel, esc, type AppCategory } from './kernel';
import { icon, sigil } from './icons';
import { wm, type Win } from './wm';
import { sound } from './sound';
import { WallpaperEngine, WALLPAPERS } from './wallpaper';
import { bindTooltip, contextMenu, notify, confirm, closeContextMenu } from './ui';
import { achievements } from './achievements';
import { content } from './content';

export let wallpaper: WallpaperEngine;
const shellOffs: (() => void)[] = [];
/** Removes every bus listener / interval the shell registered for the current session. */
export function unmountShell() { shellOffs.splice(0).forEach(f => { try { f(); } catch {} }); closeStartMenu(); }

export function launch(id: string, args?: any): Win | undefined {
  const def = apps.get(id); if (!def) { notify('Unknown spell', `No app named <b>${esc(id)}</b>.`, 'faq'); sound.error(); return; }
  closeStartMenu();
  return wm.open(def, args);
}

const CATEGORIES: { id: AppCategory | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All Spells', icon: 'sparkles' },
  { id: 'adventure', label: 'Adventure', icon: 'quest' },
  { id: 'tools', label: 'Professions', icon: 'abacus' },
  { id: 'social', label: 'Social', icon: 'guild' },
  { id: 'games', label: 'Tavern Games', icon: 'dice' },
  { id: 'system', label: 'System', icon: 'settings' },
];

let startEl: HTMLElement | null = null;
export function closeStartMenu() { startEl?.remove(); startEl = null; document.querySelector('.hearth')?.classList.remove('active'); }
export function toggleStartMenu() { if (startEl) closeStartMenu(); else openStartMenu(); }

function openStartMenu() {
  closeContextMenu();
  const u = session.user!;
  let cat: AppCategory | 'all' = 'all'; let q = '';
  const grid = h('div', { class: 'apps' });
  const render = () => {
    grid.innerHTML = '';
    const rank = (a: any) => { const n = a.name.toLowerCase(), s = (a.subtitle ?? '').toLowerCase(); return n === q ? 0 : n.startsWith(q) ? 1 : n.includes(q) ? 2 : s.includes(q) ? 3 : 9; };
    const list = appList().filter(a => !a.hidden && (cat === 'all' || a.category === cat) && (!q || rank(a) < 9)).sort((a, b) => q ? rank(a) - rank(b) : 0);
    if (!list.length) grid.append(h('div', { class: 'dim', style: { gridColumn: '1/-1', textAlign: 'center', padding: '20px' } }, 'No spell matches. Try /help in the Console.'));
    for (const a of list) {
      const el = h('div', { class: 'app', tabindex: '0', role: 'button' }, h('div', { class: 'ico', html: icon(a.icon) }), h('div', { class: 'lbl' }, a.name, h('small', {}, a.subtitle ?? '')));
      el.addEventListener('click', () => launch(a.id));
      el.addEventListener('keydown', (e) => { const tiles = Array.from(grid.querySelectorAll('.app')) as HTMLElement[]; const i = tiles.indexOf(el); const go = (j: number) => { tiles[Math.max(0, Math.min(tiles.length - 1, j))]?.focus(); e.preventDefault(); }; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); launch(a.id); } else if (e.key === 'ArrowRight') go(i + 1); else if (e.key === 'ArrowLeft') go(i - 1); else if (e.key === 'ArrowDown') go(i + 4); else if (e.key === 'ArrowUp') { if (i < 4) { search.focus(); e.preventDefault(); } else go(i - 4); } });
      el.addEventListener('contextmenu', (e) => { e.preventDefault(); contextMenu(e.clientX, e.clientY, [
        { label: 'Open', icon: 'play', action: () => launch(a.id) },
        { label: pinned().includes(a.id) ? 'Unpin from action bar' : 'Pin to action bar', icon: 'star', action: () => togglePin(a.id) },
        { label: desktopIds().includes(a.id) ? 'Remove from desktop' : 'Add to desktop', icon: 'grid', action: () => toggleDesktop(a.id) },
      ]); });
      grid.append(el);
    }
  };
  const left = h('div', { class: 'left' },
    h('div', { class: 'me' }, h('div', { class: 'portrait', html: icon(classIcon(u.cls)) }), h('div', {}, h('div', { class: 'n' }, u.name), h('div', { class: 'l' }, `Level ${u.level} ${u.race} ${u.cls}`))),
    ...CATEGORIES.map(c => { const el = h('div', { class: 'cat' + (c.id === cat ? ' active' : ''), tabindex: '0', role: 'button', html: icon(c.icon) + `<span>${c.label}</span>` }); const pick = () => { cat = c.id; left.querySelectorAll('.cat').forEach(x => x.classList.remove('active')); el.classList.add('active'); render(); }; el.addEventListener('click', pick); el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } }); return el; }),
    h('div', { class: 'power' },
      h('button', { class: 'btn sm ghost', title: 'Lock', onclick: () => { closeStartMenu(); bus.emit('lock'); } }, 'Lock'),
      h('button', { class: 'btn sm ghost', title: 'Log out', onclick: () => { closeStartMenu(); bus.emit('logout'); } }, 'Logout'),
      h('button', { class: 'btn sm danger', title: 'Exit', onclick: async () => { closeStartMenu(); if (await confirm('Leave Azeroth?', 'Camp here for the night, or log out for good?', 'Exit', 'Stay')) bus.emit('shutdown'); } }, 'Exit')));
  const search = h('input', { class: 'input', placeholder: 'Search spells, apps, quests…', oninput: (e: Event) => { q = (e.target as HTMLInputElement).value.toLowerCase(); render(); } });
  search.addEventListener('keydown', (e) => { if (e.key === 'Enter') { const first = grid.querySelector('.app') as HTMLElement; first?.click(); } if (e.key === 'ArrowDown') { e.preventDefault(); (grid.querySelector('.app') as HTMLElement)?.focus(); } if (e.key === 'Escape') closeStartMenu(); });
  const right = h('div', { class: 'right' }, h('div', { class: 'search' }, search), grid,
    h('div', { class: 'dim small', style: { marginTop: 'auto', textAlign: 'center', fontSize: '10.5px' } }, `${achievements.points()} / ${achievements.totalPoints()} pts · ${WALLPAPERS.length} vistas · `, h('a', { href: '#', onclick: (e: Event) => { e.preventDefault(); launch('about'); } }, 'About GeekOS')));
  startEl = h('div', { class: 'startmenu frame' }, left, right);
  document.querySelector('.desktop')!.append(startEl);
  document.querySelector('.hearth')?.classList.add('active');
  render(); sound.click();
  setTimeout(() => search.focus(), 20);
  setTimeout(() => { const off = (e: MouseEvent) => { if (startEl && !startEl.contains(e.target as Node) && !(e.target as HTMLElement).closest('.hearth')) { closeStartMenu(); document.removeEventListener('mousedown', off); } }; document.addEventListener('mousedown', off); });
}

export function classIcon(cls: string): string {
  const k = 'class:' + cls.toLowerCase();
  return ['warrior', 'paladin', 'hunter', 'rogue', 'priest', 'shaman', 'mage', 'warlock', 'druid'].includes(cls.toLowerCase()) ? k : 'npc';
}

// ---------- pins & desktop icons ----------
const DEFAULT_PINS = ['console', 'questlog', 'news', 'bags', 'codex', 'mailbox', 'jukebox', 'atlas', 'countdown'];
const DEFAULT_DESKTOP = ['countdown', 'news', 'codex', 'chronicle', 'questlog', 'bags', 'mailbox', 'console', 'atlas', 'calendar', 'talents', 'achievements', 'sweeper', 'grave'];
export const pinned = () => store.get<string[]>('pins', DEFAULT_PINS).filter(id => apps.has(id));
export const desktopIds = () => store.get<string[]>('desktop', DEFAULT_DESKTOP).filter(id => apps.has(id));
export function togglePin(id: string) { const p = pinned(); const i = p.indexOf(id); if (i >= 0) p.splice(i, 1); else p.push(id); store.set('pins', p); bus.emit('pins:change'); }
export function toggleDesktop(id: string) { const p = desktopIds(); const i = p.indexOf(id); if (i >= 0) p.splice(i, 1); else p.push(id); store.set('desktop', p); bus.emit('desktop:change'); }

// ---------- Desktop ----------
export function mountDesktop(root: HTMLElement) {
  const wall = h('div', { class: 'wall' });
  const desk = h('div', { class: 'desktop' }, wall, h('div', { class: 'vignette' }));
  const iconsEl = h('div', { class: 'icons' });
  desk.append(iconsEl);
  root.append(desk);
  wallpaper = new WallpaperEngine(wall);

  const renderIcons = () => {
    iconsEl.innerHTML = '';
    for (const id of desktopIds()) {
      const a = apps.get(id)!;
      const el = h('div', { class: 'dicon', dataset: { app: id } }, h('div', { class: 'ico', html: icon(a.icon) }), h('div', { class: 'lbl' }, a.name));
      el.addEventListener('click', () => { iconsEl.querySelectorAll('.dicon').forEach(x => x.classList.remove('sel')); el.classList.add('sel'); });
      el.addEventListener('dblclick', () => launch(id));
      el.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); contextMenu(e.clientX, e.clientY, [
        { label: 'Open', icon: 'play', action: () => launch(id) },
        { label: pinned().includes(id) ? 'Unpin from action bar' : 'Pin to action bar', icon: 'star', action: () => togglePin(id) },
        { sep: true },
        { label: 'Remove from desktop', icon: 'trash', action: () => toggleDesktop(id) },
      ]); });
      bindTooltip(el, { name: a.name, sub: a.subtitle, lines: ['<span class="dim">Double-click to open</span>'] });
      iconsEl.append(el);
    }
  };
  renderIcons();
  shellOffs.push(bus.on('desktop:change', renderIcons));

  desk.addEventListener('mousedown', (e) => { if (e.target === desk || (e.target as HTMLElement).classList.contains('vignette') || e.target === iconsEl) { iconsEl.querySelectorAll('.dicon').forEach(x => x.classList.remove('sel')); closeStartMenu(); } });
  desk.addEventListener('contextmenu', (e) => {
    if (e.composedPath().some(n => n instanceof HTMLElement && n.matches('.win, .actionbar, .startmenu, .dicon, .ctx'))) return;
    e.preventDefault();
    contextMenu(e.clientX, e.clientY, [
      { label: 'Next vista', icon: 'refresh', key: 'F7', action: () => wallpaper.next() },
      { label: 'Choose vista…', icon: 'grid', action: () => launch('settings', { tab: 'vista' }) },
      { sep: true },
      { label: 'New quest…', icon: 'plus', action: () => launch('questlog', { new: true }) },
      { label: 'Open Console', icon: 'chev', key: 'Alt+`', action: () => launch('console') },
      { sep: true },
      { label: 'Cascade windows', icon: 'list', action: () => wm.cascade() },
      { label: 'Show desktop', icon: 'min', key: 'Alt+D', action: () => wm.minimizeAll() },
      { sep: true },
      { label: 'Personalize', icon: 'star', action: () => launch('settings') },
      { label: 'About GeekOS', icon: 'star', action: () => launch('about') },
    ]);
  });
}

// ---------- Action bar ----------
export function mountActionBar(root: HTMLElement) {
  const u = session.user!;
  const hearth = h('div', { class: 'hearth', html: sigil(46), title: 'Hearth menu' });
  hearth.addEventListener('click', toggleStartMenu);
  bindTooltip(hearth, { name: 'Hearthstone', sub: 'Open the Hearth menu', lines: ['<span class="dim">Alt+Space</span>'], flavor: 'Home is where the hearth is.' });

  const slots = h('div', { class: 'slots' });
  const running = h('div', { class: 'slots' });
  const renderSlots = () => {
    slots.innerHTML = '';
    pinned().forEach((id, i) => {
      const a = apps.get(id)!;
      const s = h('div', { class: 'slot', dataset: { app: id }, html: icon(a.icon) + `<span class="key">${i + 1}</span>` });
      s.addEventListener('click', () => { const ws = wm.byApp(id); if (ws.length) { const f = wm.focused(); if (f && f.appId === id && !f.minimized) f.minimize(); else ws[0].focus(); } else launch(id); });
      s.addEventListener('contextmenu', (e) => { e.preventDefault(); contextMenu(e.clientX, e.clientY, [{ label: 'Open new', icon: 'plus', action: () => launch(id) }, { label: 'Unpin', icon: 'trash', action: () => togglePin(id) }]); });
      bindTooltip(s, { name: a.name, sub: a.subtitle, lines: [`<span class="dim">Alt+${i + 1}</span>`] });
      slots.append(s);
    });
    renderRunning();
  };
  const renderRunning = () => {
    running.innerHTML = '';
    const pinnedIds = pinned();
    pinnedIds.forEach(id => { const s = slots.querySelector(`[data-app="${id}"]`); if (s) { s.classList.toggle('run', wm.byApp(id).length > 0); s.classList.toggle('active', wm.focused()?.appId === id); if (id === 'news') { s.querySelector('.badge-n')?.remove(); const n = content.unseenNews().filter(x => x.forever).length; if (n) s.append(h('span', { class: 'badge-n', title: `${n} new Forever article${n > 1 ? 's' : ''}` }, String(n))); } } });
    const others = wm.list().filter(w => !pinnedIds.includes(w.appId));
    if (others.length) running.append(h('div', { class: 'slot sep' }));
    for (const w of others) {
      const s = h('div', { class: 'slot run' + (wm.focused() === w ? ' active' : ''), html: icon(w.def.icon) });
      s.addEventListener('click', () => { if (wm.focused() === w && !w.minimized) w.minimize(); else w.focus(); });
      s.addEventListener('contextmenu', (e) => { e.preventDefault(); contextMenu(e.clientX, e.clientY, [{ label: 'Close', icon: 'close', action: () => w.close() }, { label: 'Pin to action bar', icon: 'star', action: () => togglePin(w.appId) }]); });
      bindTooltip(s, () => ({ name: w.tt.textContent ?? w.def.name, sub: w.def.subtitle }));
      running.append(s);
    }
  };
  ['win:open', 'win:close', 'win:focus', 'win:min', 'win:title', 'content:update'].forEach(ev => shellOffs.push(bus.on(ev, renderRunning)));
  shellOffs.push(bus.on('pins:change', renderSlots));

  const soundTray = h('div', { class: 'ti', html: icon('audio'), title: 'Sound' });
  const upd = () => soundTray.style.opacity = sound.muted ? '.35' : '1';
  soundTray.addEventListener('click', () => { sound.muted = !sound.muted; upd(); if (!sound.muted) sound.click(); notify(sound.muted ? 'Sound muted' : 'Sound on', sound.muted ? 'The tavern falls silent.' : 'The tavern is lively again.', 'audio', { sound: false, timeout: 2000 }); });
  upd(); shellOffs.push(bus.on('sound:change', upd));
  bindTooltip(soundTray, () => ({ name: sound.muted ? 'Sound: Muted' : 'Sound: On', sub: 'Click to toggle' }));
  const achTray = h('div', { class: 'ti', html: icon('achievements'), title: 'Achievements' });
  achTray.addEventListener('click', () => launch('achievements'));
  bindTooltip(achTray, () => ({ name: 'Achievements', sub: `${achievements.points()} points` }));
  const tray = h('div', { class: 'tray' }, soundTray, achTray);

  const clock = h('div', { class: 'clock' }, h('div', { class: 't' }, fmtTime()), h('div', { class: 'd' }, fmtDate()));
  clock.addEventListener('click', () => launch('calendar'));
  bindTooltip(clock, () => ({ name: new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), sub: `Realm time · ${Intl.DateTimeFormat().resolvedOptions().timeZone}`, lines: [`<span class="dim">Played this session: ${Math.floor((Date.now() - session.bootedAt) / 60000)} min</span>`] }));
  const clockIv = setInterval(() => { (clock.firstChild as HTMLElement).textContent = fmtTime(); (clock.lastChild as HTMLElement).textContent = fmtDate(); const d = new Date(); if (d.getHours() === 11 && d.getMinutes() === 11) achievements.unlock('eleven-eleven'); if (d.getHours() === 3) achievements.unlock('night-owl'); if (d.getFullYear() === 2026 && d.getMonth() === 10 && d.getDate() === 4) achievements.unlock('launch-day'); }, 1000);
  shellOffs.push(() => clearInterval(clockIv));

  const xp = h('div', { class: 'xpbar' }, h('i'));
  const updXp = () => { const uu = session.user!; (xp.firstChild as HTMLElement).style.width = (100 * uu.xp / xpToLevel(uu.level)).toFixed(1) + '%'; };
  updXp(); shellOffs.push(bus.on('xp', updXp));
  bindTooltip(xp, () => { const uu = session.user!; return { name: `Level ${uu.level}`, sub: `${uu.xp} / ${xpToLevel(uu.level)} XP`, lines: [uu.level >= 60 ? '<span class="gold">You are Forever Ready.</span>' : '<span class="dim">Use GeekOS to gain experience.</span>'] }; });

  const bar = h('div', { class: 'actionbar' }, xp, h('div', { class: 'end left' }, hearth), slots, running, h('div', { class: 'end right' }, tray, clock));
  bar.addEventListener('contextmenu', (e) => { if ((e.target as HTMLElement).closest('.slot')) return; e.preventDefault(); contextMenu(e.clientX, e.clientY, [{ label: 'Show desktop', icon: 'min', key: 'Alt+D', action: () => wm.minimizeAll() }, { label: 'Cascade windows', icon: 'list', action: () => wm.cascade() }, { sep: true }, { label: 'Settings', icon: 'star', action: () => launch('settings') }]); });
  root.append(bar);
  renderSlots();

  shellOffs.push(bus.on('levelup', (lvl: number) => { sound.levelup(); notify(`Level ${lvl}!`, `You feel more experienced. ${lvl >= 60 ? 'Welcome to the endgame.' : 'Keep adventuring.'}`, 'legacy', { sound: false, timeout: 5000 }); if (lvl >= 10) achievements.unlock('level-10'); if (lvl >= 60) achievements.unlock('level-60'); }));
  void u;
}

// ---------- Hotkeys & easter-egg listeners ----------
let hotkeysMounted = false;
export function mountHotkeys() {
  if (hotkeysMounted) return; hotkeysMounted = true;
  const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']; let ki = 0;
  addEventListener('keydown', (e) => {
    if (!document.querySelector('.actionbar') || document.querySelector('.lock') || document.querySelector('.modal-bg')) return; // no session, locked, or a dialog is up
    // konami
    if (e.key === konami[ki] || e.key.toLowerCase() === konami[ki]) { ki++; if (ki === konami.length) { ki = 0; achievements.unlock('konami'); bus.emit('leeroy'); } } else ki = e.key === konami[0] ? 1 : 0;

    const typing = (e.target as HTMLElement).matches('input, textarea, [contenteditable]');
    if (e.altKey && !e.ctrlKey) {
      if (e.code === 'Space') { e.preventDefault(); toggleStartMenu(); return; }
      if (e.key === '`' || e.code === 'Backquote') { e.preventDefault(); launch('console'); return; }
      if (e.key.toLowerCase() === 'd') { e.preventDefault(); wm.minimizeAll(); return; }
      if (/^[1-9]$/.test(e.key)) { e.preventDefault(); const id = pinned()[+e.key - 1]; if (id) { const ws = wm.byApp(id); ws.length ? ws[0].focus() : launch(id); } return; }
      if (e.key === 'F4') { e.preventDefault(); wm.focused()?.close(); return; }
    }
    if (e.key === 'F7') { e.preventDefault(); wallpaper.next(); return; }
    if (e.key === 'Escape') { if (startEl) closeStartMenu(); else if (!typing) closeContextMenu(); }
  });
  bus.on('wall:all-seen', () => achievements.unlock('wallpaper-all'));
}
