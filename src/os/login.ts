/**
 * Character select: pick a saved hero or roll a new one. Faction, race, class.
 */
import { h, store, session, LAUNCH_UTC, esc, uid, type User, type Faction } from './kernel';
import { icon, LOGO_URL } from './icons';
import { sound } from './sound';
import { WALLPAPERS } from './wallpaper';
import { achievements } from './achievements';
import { classIcon } from './shell';

export const RACES: Record<string, { faction: Faction; classes: string[] }> = {
  Human: { faction: 'alliance', classes: ['Warrior', 'Paladin', 'Rogue', 'Priest', 'Mage', 'Warlock'] },
  Dwarf: { faction: 'alliance', classes: ['Warrior', 'Paladin', 'Hunter', 'Rogue', 'Priest', 'Shaman'] },
  'Night Elf': { faction: 'alliance', classes: ['Warrior', 'Hunter', 'Rogue', 'Priest', 'Druid'] },
  Gnome: { faction: 'alliance', classes: ['Warrior', 'Rogue', 'Mage', 'Warlock'] },
  Orc: { faction: 'horde', classes: ['Warrior', 'Hunter', 'Rogue', 'Shaman', 'Warlock'] },
  Forsaken: { faction: 'horde', classes: ['Warrior', 'Paladin', 'Rogue', 'Priest', 'Mage', 'Warlock'] },
  Tauren: { faction: 'horde', classes: ['Warrior', 'Hunter', 'Shaman', 'Druid'] },
  Troll: { faction: 'horde', classes: ['Warrior', 'Hunter', 'Rogue', 'Priest', 'Shaman', 'Mage'] },
  'Skyborne (Windshaper)': { faction: 'horde', classes: ['Warrior', 'Hunter', 'Rogue', 'Druid', 'Shaman'] },
  'Skyborne (High Order)': { faction: 'alliance', classes: ['Warrior', 'Hunter', 'Rogue', 'Druid', 'Mage'] },
};

const PRESETS: Omit<User, 'created' | 'played' | 'gold' | 'xp'>[] = [
  { name: 'Geek', race: 'Forsaken', cls: 'Paladin', faction: 'horde', level: 1, title: '' },
  { name: 'Brannoc', race: 'Dwarf', cls: 'Shaman', faction: 'alliance', level: 1, title: '' },
  { name: 'Aelyra', race: 'Skyborne (High Order)', cls: 'Mage', faction: 'alliance', level: 1, title: '' },
];

export function runLogin(root: HTMLElement): Promise<User> {
  return new Promise(resolve => {
    const saved = store.get<User[]>('characters', []);
    const chars: User[] = saved.length ? saved : PRESETS.map(p => ({ ...p, xp: 0, created: Date.now(), played: 0, gold: 0 }));
    let selected = chars[store.get('lastChar', 0)] ?? chars[0];

    const scene = h('div', { class: 'scene' });
    const canvas = document.createElement('canvas'); scene.append(canvas);
    const ctx = canvas.getContext('2d')!; let raf = 0; const t0 = performance.now();
    const wp = WALLPAPERS.find(w => w.id === 'masthead')!;
    const draw = () => { const dpr = 1; canvas.width = (innerWidth - 380) * dpr; canvas.height = innerHeight * dpr; wp.draw(ctx, canvas.width, canvas.height, (performance.now() - t0) / 1000); raf = requestAnimationFrame(() => setTimeout(draw, 1000 / 20)); };
    draw(); addEventListener('resize', draw);

    scene.append(h('div', { class: 'hero' },
      h('div', { class: 'eyebrow' }, 'Included with your adventure'),
      h('h1', {}, 'Carve A New Path'),
      h('p', {}, 'Azeroth, an untamed frontier begging to be explored. GeekOS is a desktop built for the Forever era: quests, hearths, codices, and a few secrets tucked between the vistas.')));

    const list = h('div', { class: 'chars' });
    const renderList = () => {
      list.innerHTML = '';
      for (const c of chars) {
        const el = h('div', { class: 'char' + (c === selected ? ' sel' : '') },
          h('div', { class: 'portrait', html: icon(classIcon(c.cls)) }),
          h('div', { class: 'grow' }, h('div', { class: 'name' }, c.name), h('div', { class: 'meta' }, `Level ${c.level} ${c.race} ${c.cls}`)),
          h('span', { class: 'badge ' + c.faction }, c.faction === 'horde' ? 'Horde' : 'Alliance'));
        el.addEventListener('click', () => { selected = c; sound.click(); renderList(); });
        el.addEventListener('dblclick', () => enter());
        list.append(el);
      }
    };
    const enter = () => {
      if (!selected) return;
      store.set('characters', chars); store.set('lastChar', chars.indexOf(selected));
      session.user = selected; session.bootedAt = Date.now(); store.set('user', selected);
      sound.horn();
      el.classList.add('out'); cancelAnimationFrame(raf);
      setTimeout(() => { el.remove(); resolve(selected); }, 700);
    };

    const create = h('div', { class: 'col', style: { display: 'none' } });
    const showCreate = () => {
      create.style.display = ''; create.innerHTML = '';
      let faction: Faction = 'horde'; let race = 'Orc'; let cls = 'Warrior';
      const name = h('input', { class: 'input', placeholder: 'Character name', maxlength: 12 });
      const raceSel = h('select', { class: 'input' }); const clsSel = h('select', { class: 'input' });
      const fill = () => {
        raceSel.innerHTML = ''; Object.entries(RACES).filter(([, r]) => r.faction === faction).forEach(([n]) => raceSel.append(h('option', { value: n }, n)));
        if (!RACES[race] || RACES[race].faction !== faction) race = raceSel.value; raceSel.value = race;
        clsSel.innerHTML = ''; RACES[race].classes.forEach(c => clsSel.append(h('option', { value: c }, c)));
        if (!RACES[race].classes.includes(cls)) cls = clsSel.value; clsSel.value = cls;
      };
      raceSel.addEventListener('change', () => { race = raceSel.value; fill(); }); clsSel.addEventListener('change', () => { cls = clsSel.value; });
      const fac = h('div', { class: 'row' },
        h('button', { class: 'btn grow danger', onclick: () => { faction = 'horde'; fill(); sound.click(); } }, 'Horde'),
        h('button', { class: 'btn grow primary', style: { background: 'linear-gradient(180deg,#4d8bff,#1f4aa8 60%,#0a1e4d)', borderColor: '#0a1e4d' }, onclick: () => { faction = 'alliance'; fill(); sound.click(); } }, 'Alliance'));
      fill();
      create.append(h('div', { class: 'eyebrow' }, 'Roll a new hero'), name, fac, raceSel, clsSel,
        h('div', { class: 'row' },
          h('button', { class: 'btn gold grow', onclick: () => {
            const n = name.value.trim().replace(/[^a-zA-Z' ]/g, ''); if (n.length < 2) { sound.error(); name.focus(); return; }
            const u: User = { name: n[0].toUpperCase() + n.slice(1), race, cls, faction, level: 1, xp: 0, title: '', created: Date.now(), played: 0, gold: 0 };
            chars.push(u); selected = u; store.set('characters', chars); create.style.display = 'none'; renderList(); sound.quest();
            if (race === 'Forsaken' && cls === 'Paladin') setTimeout(() => achievements.unlock('forsaken-paladin'), 800);
            if (race === 'Dwarf' && cls === 'Shaman') setTimeout(() => achievements.unlock('dwarf-shaman'), 800);
            if (race.startsWith('Skyborne')) setTimeout(() => achievements.unlock('skyborne'), 800);
          } }, 'Create'),
          h('button', { class: 'btn ghost', onclick: () => { create.style.display = 'none'; } }, 'Cancel')));
      setTimeout(() => name.focus(), 20);
    };

    const cd = h('div', { class: 'cd' });
    const tickCd = () => { const ms = LAUNCH_UTC - Date.now(); if (ms <= 0) { cd.textContent = 'FOREVER IS LIVE'; return; } const d = Math.floor(ms / 864e5), hh = Math.floor(ms / 36e5) % 24, mm = Math.floor(ms / 6e4) % 60, ss = Math.floor(ms / 1e3) % 60; cd.textContent = `${d}d ${hh}h ${mm}m ${ss}s`; };
    tickCd(); const cdI = setInterval(tickCd, 1000);

    const side = h('div', { class: 'side' },
      h('img', { class: 'logo', src: LOGO_URL, alt: 'World of Warcraft: Forever', draggable: 'false' }),
      h('h2', {}, 'GeekOS'),
      h('div', { class: 'realm' }, h('span', { class: 'row' }, h('span', { class: 'dot' }), 'Realm: Zephras (Normal)'), h('span', { class: 'dim' }, 'Latency: 23 ms')),
      list, create,
      h('div', { class: 'row' },
        h('button', { class: 'btn primary grow', onclick: enter }, 'Enter World'),
        h('button', { class: 'btn ghost', onclick: showCreate }, 'New')),
      h('div', { class: 'foot' }, h('b', {}, 'WORLD OF WARCRAFT: FOREVER LAUNCHES IN'), cd, h('div', { class: 'dim', style: { marginTop: '6px' } }, 'November 4, 2026 · 3:00 PM PST')));
    const el = h('div', { class: 'login' }, scene, side);
    root.append(el);
    renderList();
    const key = (e: KeyboardEvent) => { if (e.key === 'Enter' && !(e.target as HTMLElement).matches('input,select')) enter(); };
    addEventListener('keydown', key);
    const cleanup = () => { removeEventListener('keydown', key); clearInterval(cdI); removeEventListener('resize', draw); };
    el.addEventListener('animationend', () => { if (el.classList.contains('out')) cleanup(); }, { once: false });
    void esc; void uid;
  });
}
