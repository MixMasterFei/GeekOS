/**
 * Calendar — the Forever roadmap plus your own events.
 */
import { h, store, uid, pad2, bus, type AppDef } from '../os/kernel';
import { content } from '../os/content';
import { achievements } from '../os/achievements';
import { prompt, contextMenu, bindTooltip } from '../os/ui';
import { sound } from '../os/sound';

export interface CalEvent { id: string; date: string; /* YYYY-MM-DD */ title: string; kind: 'launch' | 'beta' | 'raid' | 'info' | 'mine'; desc?: string; endDate?: string; }

export const FOREVER_EVENTS: CalEvent[] = [
  { id: 'reveal', date: '2026-09-12', title: 'Forever revealed at BlizzCon', kind: 'info', desc: 'World of Warcraft: Forever announced. Pre-purchase opens.' },
  { id: 'panel', date: '2026-09-13', title: "What's Next & Deep Dive panels", kind: 'info', desc: 'Systems, rewards and future content detailed.' },
  { id: 'beta', date: '2026-09-17', endDate: '2026-10-21', title: 'Forever Beta', kind: 'beta', desc: 'Beta runs September 17 through October 21 (Epic Pack and Collection include access).' },
  { id: 'iaf', date: '2026-10-20', title: 'Invite-A-Friend codes arrive', kind: 'info', desc: 'Codes emailed to qualifying purchasers starting today.' },
  { id: 'names', date: '2026-10-27', endDate: '2026-11-03', title: 'Early name reservation', kind: 'info', desc: 'Reserve your character name before launch (Heroic Pack or higher).' },
  { id: 'launch', date: '2026-11-04', title: 'WORLD OF WARCRAFT: FOREVER LAUNCH', kind: 'launch', desc: 'Global launch at 3:00 PM PST. Included with subscription or Game Time.' },
  { id: 'iafwindow', date: '2026-11-04', endDate: '2026-11-11', title: 'Invite-A-Friend access window', kind: 'info', desc: 'Invitees can play Forever November 4–11.' },
  { id: 'raid1', date: '2026-12-09', title: 'First raid unlock: Hyjal Summit', kind: 'raid', desc: '20-player raid opens. Barrow Deeps follows.' },
  { id: 'collection-end', date: '2027-01-11', title: 'Warcraft Forever Collection ends', kind: 'info', desc: 'Last day for the limited-time collection.' },
];

const KIND_COLOR: Record<CalEvent['kind'], string> = { launch: 'var(--q-legendary)', beta: 'var(--teal-300)', raid: 'var(--q-epic)', info: 'var(--gold-300)', mine: 'var(--q-uncommon)' };
const toKey = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export const calendarApp: AppDef = {
  id: 'calendar', name: 'Calendar', subtitle: 'Roadmap and your own events', icon: 'calendar', category: 'tools', width: 900, height: 600, noScroll: true,
  mount(ctx) {
    let mine = store.get<CalEvent[]>('cal.mine', []);
    const today = new Date(); let y = today.getFullYear(), m = today.getMonth(); let selKey = toKey(today);
    if (ctx.args?.date) { const d = new Date(ctx.args.date); y = d.getFullYear(); m = d.getMonth(); selKey = toKey(d); if (selKey === '2026-11-04') { achievements.unlock('calendar-launch'); bus.emit('calendar:launch'); } }
    const save = () => store.set('cal.mine', mine);
    const remote = () => (content.manifest?.events ?? []).map(e => ({ ...e, id: 'r-' + e.id })) as CalEvent[];
    const all = () => [...FOREVER_EVENTS, ...remote(), ...mine];
    const eventsOn = (key: string) => all().filter(e => e.date === key || (e.endDate && key >= e.date && key <= e.endDate));

    const head = h('div', { class: 'row', style: { padding: '10px 14px', borderBottom: '1px solid var(--gold-700)', background: 'rgba(0,0,0,.25)' } });
    const grid = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(70px, 1fr)', gap: '2px', padding: '8px', flex: '1', minHeight: '0' } });
    const side = h('div', { class: 'col', style: { width: '280px', flex: 'none', borderLeft: '1px solid var(--gold-700)', padding: '12px', overflow: 'auto', background: 'rgba(0,0,0,.2)' } });
    ctx.body.append(head, h('div', { class: 'row grow', style: { alignItems: 'stretch', gap: '0', minHeight: '0' } }, h('div', { class: 'col grow', style: { gap: '0', minHeight: '0' } }, h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', padding: '6px 8px 0' } }, ...['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => h('div', { class: 'eyebrow', style: { textAlign: 'center', fontSize: '10px' } }, d))), grid), side));

    const render = () => {
      head.innerHTML = '';
      head.append(
        h('button', { class: 'btn sm icon', html: '‹', onclick: () => { m--; if (m < 0) { m = 11; y--; } render(); } }),
        h('h3', { style: { flex: '1', textAlign: 'center', fontSize: '18px' } }, new Date(y, m, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })),
        h('button', { class: 'btn sm icon', html: '›', onclick: () => { m++; if (m > 11) { m = 0; y++; } render(); } }),
        h('button', { class: 'btn sm ghost', onclick: () => { y = today.getFullYear(); m = today.getMonth(); selKey = toKey(today); render(); } }, 'Today'),
        h('button', { class: 'btn sm gold', onclick: () => { y = 2026; m = 10; selKey = '2026-11-04'; render(); achievements.unlock('calendar-launch'); bus.emit('calendar:launch'); } }, 'Launch Day'),
        h('button', { class: 'btn sm', onclick: () => showRoadmap() }, 'Official Roadmap'));
      grid.innerHTML = '';
      const first = new Date(y, m, 1); const startDow = (first.getDay() + 6) % 7; const days = new Date(y, m + 1, 0).getDate();
      for (let i = 0; i < startDow; i++) grid.append(h('div'));
      for (let d = 1; d <= days; d++) {
        const key = `${y}-${pad2(m + 1)}-${pad2(d)}`; const evs = eventsOn(key); const isToday = key === toKey(today); const isLaunch = key === '2026-11-04';
        const cell = h('div', { style: { border: '1px solid ' + (key === selKey ? 'var(--gold-300)' : 'rgba(233,200,116,.15)'), background: isLaunch ? 'linear-gradient(180deg, rgba(255,128,0,.25), rgba(255,128,0,.05))' : isToday ? 'rgba(35,168,147,.15)' : 'rgba(0,0,0,.2)', padding: '4px 6px', cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '2px', boxShadow: isLaunch ? '0 0 14px rgba(255,128,0,.35) inset' : 'none' } },
          h('div', { class: 'row' }, h('span', { style: { fontFamily: 'var(--font-display)', fontWeight: '700', color: isToday ? 'var(--teal-300)' : isLaunch ? 'var(--q-legendary)' : 'var(--parch-200)' } }, String(d)), isLaunch ? h('span', { style: { marginLeft: 'auto', fontSize: '14px' } }, '⚔') : null),
          ...evs.slice(0, 3).map(e => h('div', { class: 'small', style: { color: KIND_COLOR[e.kind], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '10.5px', borderLeft: '2px solid ' + KIND_COLOR[e.kind], paddingLeft: '4px' } }, e.title)),
          evs.length > 3 ? h('div', { class: 'dim small', style: { fontSize: '10px' } }, `+${evs.length - 3} more`) : null);
        cell.addEventListener('click', () => { selKey = key; sound.click(); render(); if (isLaunch) { achievements.unlock('calendar-launch'); bus.emit('calendar:launch'); } });
        cell.addEventListener('dblclick', () => addEvent(key));
        cell.addEventListener('contextmenu', (e) => { e.preventDefault(); contextMenu(e.clientX, e.clientY, [{ label: 'Add event…', icon: 'plus', action: () => addEvent(key) }]); });
        if (evs.length) bindTooltip(cell, { name: new Date(y, m, d).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }), lines: evs.map(e => `<span style="color:${KIND_COLOR[e.kind]}">• ${e.title}</span>`) });
        grid.append(cell);
      }
      renderSide();
    };
    const renderSide = () => {
      side.innerHTML = '';
      const d = new Date(selKey + 'T12:00:00'); const evs = eventsOn(selKey);
      side.append(h('div', { class: 'eyebrow' }, d.toLocaleDateString(undefined, { weekday: 'long' })), h('h3', { style: { fontSize: '20px' } }, d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })), h('div', { class: 'hr' }));
      if (!evs.length) side.append(h('div', { class: 'dim small' }, 'Nothing scheduled. A quiet day in Azeroth.'));
      for (const e of evs) {
        side.append(h('div', { class: 'frame', style: { padding: '10px 12px', marginBottom: '8px', borderLeft: '3px solid ' + KIND_COLOR[e.kind] } },
          h('div', { style: { fontFamily: 'var(--font-display)', fontWeight: '700', color: KIND_COLOR[e.kind], fontSize: '12.5px' } }, e.title),
          e.endDate ? h('div', { class: 'dim small' }, `${e.date} → ${e.endDate}`) : null,
          e.desc ? h('div', { class: 'small', style: { marginTop: '4px', color: 'var(--parch-200)' } }, e.desc) : null,
          e.kind === 'mine' ? h('button', { class: 'btn sm ghost', style: { marginTop: '6px' }, onclick: () => { mine = mine.filter(x => x !== e); save(); render(); } }, 'Remove') : null));
      }
      side.append(h('button', { class: 'btn sm gold', style: { marginTop: 'auto' }, onclick: () => addEvent(selKey) }, '+ Add event'));
      side.append(h('div', { class: 'hr' }), h('div', { class: 'eyebrow' }, 'Legend'), ...(['launch', 'beta', 'raid', 'info', 'mine'] as const).map(k => h('div', { class: 'row small', style: { color: KIND_COLOR[k] } }, h('span', { style: { width: '8px', height: '8px', background: KIND_COLOR[k], display: 'inline-block' } }), { launch: 'Launch', beta: 'Beta', raid: 'Raid', info: 'Roadmap', mine: 'Your events' }[k])));
    };
    const showRoadmap = () => { const bg = h('div', { class: 'modal-bg', onclick: (e: Event) => { if (e.target === bg) bg.remove(); } }, h('div', { class: 'modal frame', style: { width: '1100px', maxWidth: '94vw', padding: '10px' } }, h('img', { class: 'roadmap-img', src: '/art/roadmap.jpg', alt: 'World of Warcraft: Forever 2026–2027 roadmap', draggable: 'false' }), h('div', { class: 'row', style: { marginTop: '8px', justifyContent: 'space-between' } }, h('span', { class: 'dim small' }, 'Official 2026 | 2027 roadmap from the What\'s Next panel (BlizzCon 2026).'), h('button', { class: 'btn sm ghost', onclick: () => bg.remove() }, 'Close')))); document.getElementById('os')!.append(bg); };
    const addEvent = async (key: string) => { const t = await prompt('New event', 'Title', ''); if (!t) return; mine.push({ id: uid(), date: key, title: t, kind: 'mine' }); save(); selKey = key; sound.quest(); render(); };
    render();
    ctx.setStatus(`<span>${FOREVER_EVENTS.length} roadmap events</span><span class="dim">Double-click a day to add your own</span>`);
  },
};
