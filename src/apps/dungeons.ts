/**
 * Dungeon Journal — the nine new dungeons and two raids, with a loot-roll toy.
 */
import { h, grantXp, store, bus, type AppDef } from '../os/kernel';
import { CODEX } from '../data/codex';
import { icon } from '../os/icons';
import { sound } from '../os/sound';
import { launch } from '../os/shell';
import { bindTooltip } from '../os/ui';

const LOOT = [
  { name: 'Thane\'s Stonefist Gauntlets', q: 'rare', slot: 'Hands', src: 'thanes' }, { name: 'Bell of Silent Lordaeron', q: 'epic', slot: 'Trinket', src: 'lordaeron' }, { name: 'Whelgar\'s Dusted Spectacles', q: 'uncommon', slot: 'Head', src: 'whelgar' },
  { name: 'Violet Citadel Sash', q: 'rare', slot: 'Waist', src: 'dalaran' }, { name: 'Blackmaw Fang', q: 'epic', slot: 'Weapon', src: 'blackmaw' }, { name: 'Tidecaller\'s Drowned Pearl', q: 'rare', slot: 'Neck', src: 'drowned' },
  { name: 'Krol\'dok War Drum', q: 'uncommon', slot: 'Off-hand', src: 'kroldok' }, { name: 'Alcaz Warden\'s Keyring', q: 'rare', slot: 'Trinket', src: 'alcaz' }, { name: 'Shaper\'s Humming Core', q: 'epic', slot: 'Trinket', src: 'shaper' },
  { name: 'Crown of the Summit', q: 'epic', slot: 'Head', src: 'summit' }, { name: 'Unnamed Legendary', q: 'legendary', slot: '???', src: 'summit' }, { name: 'Root of the Barrow', q: 'epic', slot: 'Staff', src: 'barrow' },
];

export const dungeonsApp: AppDef = {
  id: 'dungeons', name: 'Dungeon Journal', subtitle: 'Nine dungeons, two raids', icon: 'dungeon', category: 'adventure', width: 880, height: 580, noScroll: true,
  mount(ctx) {
    const entries = [...CODEX.find(s => s.id === 'dungeons')!.entries.map(e => ({ ...e, kind: 'Dungeon' })), ...CODEX.find(s => s.id === 'raids')!.entries.filter(e => e.id === 'summit' || e.id === 'barrow').map(e => ({ ...e, kind: 'Raid' }))];
    let sel = ctx.args?.id ?? entries[0].id;
    const list = h('div', { class: 'list', style: { width: '260px', flex: 'none', borderRight: '1px solid var(--gold-700)', padding: '8px', overflow: 'auto', background: 'rgba(0,0,0,.2)' } });
    const pane = h('div', { class: 'grow scroll', style: { padding: '18px 22px' } });
    ctx.body.append(h('div', { class: 'row grow', style: { alignItems: 'stretch', gap: '0', height: '100%' } }, list, pane));
    const renderList = () => { list.innerHTML = ''; ['Dungeon', 'Raid'].forEach(k => { list.append(h('div', { class: 'eyebrow', style: { margin: '6px 6px 2px' } }, k + 's')); entries.filter(e => e.kind === k).forEach(e => { const el = h('div', { class: 'list-item' + (e.id === sel ? ' active' : '') }, h('span', { style: { width: '20px', height: '20px', flex: 'none' }, html: icon(k === 'Raid' ? 'guild' : 'dungeon') }), h('span', { class: 'grow' }, e.name)); el.addEventListener('click', () => { sel = e.id; sound.click(); renderList(); renderPane(); }); list.append(el); }); }); };
    const renderPane = () => {
      const e = entries.find(x => x.id === sel)!; const loot = LOOT.filter(l => l.src === e.id);
      pane.innerHTML = '';
      if (e.image) pane.append(h('div', { class: 'art-hero', style: { margin: '-18px -22px 16px', height: '230px' } }, h('img', { src: e.image, alt: e.name, draggable: 'false' })));
      pane.append(h('div', { class: 'row', style: { alignItems: 'flex-start', gap: '16px' } },
        h('div', { style: { width: '72px', height: '72px', flex: 'none', border: '1px solid var(--gold-500)', background: '#0a1d26', padding: '4px' }, html: icon(e.kind === 'Raid' ? 'guild' : 'dungeon') }),
        h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, e.kind), h('h2', { class: 'display', style: { fontSize: '26px' } }, e.name), h('div', { class: 'dim' }, e.sub ?? '')),
        h('span', { class: 'badge ' + (e.kind === 'Raid' ? 'legendary' : 'epic') }, e.kind === 'Raid' ? (e.id === 'barrow' ? '10 players' : '20 players') : '5 players')),
        h('div', { class: 'hr orn' }),
        h('p', { class: 'quest-font', style: { fontSize: '15px', lineHeight: '1.7', color: 'var(--parch-100)' } }, e.text),
        h('div', { class: 'eyebrow', style: { margin: '14px 0 8px' } }, 'Loot table (GeekOS flavour — not datamined)'),
        h('div', { class: 'col', style: { gap: '4px' } }, ...(loot.length ? loot : [{ name: 'Nothing catalogued yet', q: 'poor', slot: '—', src: '' }]).map(l => { const row = h('div', { class: 'row', style: { padding: '6px 10px', border: '1px solid rgba(233,200,116,.15)', background: 'rgba(0,0,0,.25)' } }, h('span', { style: { width: '10px', height: '10px', background: `var(--q-${l.q})`, borderRadius: '2px' } }), h('span', { class: 'q-' + l.q, style: { fontWeight: '700' } }, l.name), h('span', { class: 'dim small', style: { marginLeft: 'auto' } }, l.slot)); bindTooltip(row, { name: l.name, quality: l.q, bind: 'Binds when picked up', sub: l.slot, lines: ['<span class="dim">Drops from: ' + e.name + '</span>'], flavor: l.q === 'legendary' ? 'Details pending. Blizzard said so.' : undefined }); return row; })),
        h('div', { class: 'row', style: { marginTop: '16px' } },
          h('button', { class: 'btn gold', onclick: () => { const n = 1 + Math.floor(Math.random() * 100); const l = loot[Math.floor(Math.random() * loot.length)]; store.set('dj.kills.' + e.id, store.get<number>('dj.kills.' + e.id, 0) + 1); grantXp(15, 'dj'); sound.coin(); bus.emit('dj:roll', e.id); const res = h('div', { class: 'small', style: { marginTop: '8px' } }, `You roll ${n} (1-100) — `, h('span', { class: 'q-' + (l?.q ?? 'poor') }, n >= 50 && l ? `${l.name} is yours.` : 'Greed. Better luck next reset.')); pane.querySelector('.rollres')?.remove(); res.className += ' rollres'; pane.append(res); renderStatus(); } }, 'Roll for loot'),
          h('button', { class: 'btn', onclick: () => launch('atlas', { zone: e.id }) }, 'Find on Atlas'),
          h('button', { class: 'btn ghost', onclick: () => launch('codex', { section: e.kind === 'Raid' ? 'raids' : 'dungeons', entry: e.id }) }, 'Codex entry')));
      renderStatus();
    };
    const renderStatus = () => { const e = entries.find(x => x.id === sel)!; ctx.setStatus(`<span>${entries.length} instances</span><span class="dim">${store.get<number>('dj.kills.' + e.id, 0)} clears of ${e.name}</span>`); };
    renderList(); renderPane();
  },
};
