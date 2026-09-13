/**
 * Talents — your profile and OS preferences laid out as a talent tree.
 */
import { h, session, store, bus, xpToLevel, fmtDuration, type AppDef } from '../os/kernel';
import { icon } from '../os/icons';
import { achievements } from '../os/achievements';
import { sound } from '../os/sound';
import { classIcon, wallpaper } from '../os/shell';
import { bindTooltip, notify } from '../os/ui';

const TITLES = ['', 'the Explorer', 'Jenkins', 'the Insane', 'of the Riverglades', 'Forever Ready', 'the Patient', 'Hand of Zephras', 'the Night Owl', 'Loremaster', 'Sleeper of Barrow Deeps', 'Champion of the Hearth'];
interface Talent { id: string; name: string; desc: string; icon: string; tier: number; col: number; unlockLevel: number; apply?: (on: boolean) => void; state?: () => boolean; }

const TALENTS: Talent[] = [
  { id: 'living-vista', name: 'Living Vista', desc: 'Slow drift and floating light motes over the vista.', icon: 'gallery', tier: 1, col: 0, unlockLevel: 1, apply: on => wallpaper?.setAnimate(on), state: () => wallpaper?.animate ?? true },
  { id: 'tavern-sounds', name: 'Tavern Sounds', desc: 'Play interface sounds.', icon: 'audio', tier: 1, col: 1, unlockLevel: 1, apply: on => { sound.muted = !on; }, state: () => !sound.muted },
  { id: 'classic-ui', name: 'Classic Preset', desc: 'Sharper, denser, more 2004. Squares off the corners and dims the glow.', icon: 'settings', tier: 1, col: 2, unlockLevel: 1, apply: on => { document.documentElement.classList.toggle('classic', on); store.set('ui.classic', on); }, state: () => store.get('ui.classic', false) },
  { id: 'tooltips', name: 'Item Tooltips', desc: 'Show WoW-style tooltips on hover.', icon: 'faq', tier: 2, col: 0, unlockLevel: 3, apply: on => { document.documentElement.classList.toggle('no-tips', !on); store.set('ui.tips', on); }, state: () => store.get('ui.tips', true) },
  { id: 'whispers', name: 'Whispers', desc: 'Let NPCs send you the occasional letter or whisper.', icon: 'mail', tier: 2, col: 1, unlockLevel: 3, apply: on => store.set('ui.whispers', on), state: () => store.get('ui.whispers', true) },
  { id: 'rested', name: 'Rested Experience', desc: 'Earn XP while idle in an inn (the Camp app).', icon: 'camp', tier: 2, col: 2, unlockLevel: 5, apply: on => store.set('ui.rested', on), state: () => store.get('ui.rested', true) },
  { id: 'big-text', name: 'Large Runes', desc: 'Bigger interface text.', icon: 'scribe', tier: 3, col: 0, unlockLevel: 8, apply: on => { document.documentElement.style.fontSize = on ? '16px' : ''; store.set('ui.big', on); }, state: () => store.get('ui.big', false) },
  { id: 'reduced-motion', name: 'Steady Hand', desc: 'Reduce animations and window bounce.', icon: 'sword', tier: 3, col: 1, unlockLevel: 8, apply: on => { document.documentElement.classList.toggle('reduced', on); store.set('ui.reduced', on); }, state: () => store.get('ui.reduced', false) },
  { id: 'hardcore', name: 'Hardcore', desc: 'One life. Closing a window asks for confirmation. Log out resets nothing, but it feels riskier.', icon: 'dungeon', tier: 3, col: 2, unlockLevel: 12, apply: on => store.set('ui.hardcore', on), state: () => store.get('ui.hardcore', false) },
];

export function applySavedTalents() {
  TALENTS.forEach(t => { if (t.apply && t.state) t.apply(t.state()); });
}

export const talentsApp: AppDef = {
  id: 'talents', name: 'Talents & Profile', subtitle: 'Who you are, how the OS behaves', icon: 'talents', category: 'system', width: 900, height: 600,
  mount(ctx) {
    const u = session.user!;
    const render = () => {
      ctx.body.innerHTML = '';
      const portrait = h('div', { style: { width: '84px', height: '84px', borderRadius: '50%', border: '2px solid var(--gold-400)', background: 'radial-gradient(circle at 40% 35%, var(--ink-400), var(--ink-900))', display: 'grid', placeItems: 'center', padding: '0', overflow: 'hidden', boxShadow: 'var(--glow-gold)' }, html: icon(classIcon(u.cls)) });
      const titleSel = h('select', { class: 'input', style: { width: '220px' }, onchange: (e: Event) => { u.title = (e.target as HTMLSelectElement).value; session.save(); if (u.title) { achievements.unlock('jenkins-title'); sound.coin(); bus.emit('title:set', u.title); } bus.emit('user:change'); } }, ...TITLES.map(t => h('option', { value: t, selected: t === u.title || undefined }, t || '(no title)')));
      const header = h('div', { class: 'row', style: { padding: '18px 22px', gap: '18px', borderBottom: '1px solid var(--gold-700)', background: 'linear-gradient(180deg, rgba(0,0,0,.25), transparent)' } },
        portrait,
        h('div', { class: 'grow' },
          h('div', { class: 'eyebrow' }, `${u.faction} · ${u.race}`),
          h('h2', { class: 'display', style: { fontSize: '26px' } }, `${u.name}${u.title ? ' ' + u.title : ''}`),
          h('div', { class: 'dim' }, `Level ${u.level} ${u.cls} · ${achievements.points()} achievement points · played ${fmtDuration(session.playedTotal).split(',').slice(0, 2).join(',')}`),
          h('div', { class: 'bar', style: { marginTop: '8px', width: '360px' } }, h('i', { style: { width: (100 * u.xp / xpToLevel(u.level)) + '%' } }), h('span', {}, u.level >= 60 ? 'MAX LEVEL' : `${u.xp} / ${xpToLevel(u.level)} XP`))),
        h('div', { class: 'col' }, h('div', { class: 'eyebrow' }, 'Title'), titleSel));
      const tree = h('div', { style: { padding: '22px', position: 'relative' } });
      tree.append(h('div', { class: 'eyebrow', style: { marginBottom: '12px' } }, 'Interface talents — unlock more as you level'));
      const grid = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px 40px', maxWidth: '760px', margin: '0 auto', position: 'relative' } });
      for (const t of TALENTS) {
        const locked = u.level < t.unlockLevel; const on = t.state?.() ?? false;
        const cell = h('div', { class: 'row', style: { gap: '12px', opacity: locked ? .45 : 1 } },
          h('div', { style: { width: '52px', height: '52px', flex: 'none', border: '2px solid ' + (on && !locked ? 'var(--gold-300)' : 'var(--gold-700)'), background: '#0a1d26', padding: '3px', borderRadius: '4px', cursor: locked ? 'not-allowed' : 'pointer', boxShadow: on && !locked ? '0 0 12px rgba(233,200,116,.5)' : 'none', filter: locked ? 'grayscale(1)' : on ? 'none' : 'saturate(.4) brightness(.7)', transition: 'all .15s' }, html: icon(t.icon) }),
          h('div', { class: 'grow' }, h('div', { style: { fontFamily: 'var(--font-display)', fontWeight: '700', color: on && !locked ? 'var(--gold-200)' : 'var(--parch-300)' } }, t.name), h('div', { class: 'small dim' }, locked ? `Requires level ${t.unlockLevel}` : t.desc)));
        const box = cell.firstChild as HTMLElement;
        bindTooltip(box, { name: t.name, sub: locked ? `Requires level ${t.unlockLevel}` : on ? 'Rank 1/1 · Active' : 'Rank 0/1', lines: [t.desc], quality: locked ? 'poor' : on ? 'uncommon' : 'common' });
        box.addEventListener('click', () => { if (locked) { sound.error(); return; } t.apply?.(!on); sound.click(); render(); });
        grid.append(cell);
      }
      tree.append(grid);
      const stats = h('div', { style: { padding: '0 22px 22px' } },
        h('div', { class: 'eyebrow', style: { marginBottom: '8px' } }, 'Character sheet'),
        h('table', { class: 'table' }, h('tbody', {},
          ...[['Name', u.name], ['Race', u.race], ['Class', u.cls], ['Faction', u.faction], ['Level', String(u.level)], ['Created', new Date(u.created).toLocaleDateString()], ['Achievements', `${achievements.unlocked().length} / ${achievements.all.length}`], ['Vista', wallpaper.current.name]].map(([k, v]) => h('tr', {}, h('td', { class: 'gold', style: { width: '160px', fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '.08em' } }, k), h('td', {}, v))))),
        h('div', { class: 'row', style: { marginTop: '12px' } },
          h('button', { class: 'btn sm ghost', onclick: () => { bus.emit('logout'); } }, 'Switch character'),
          h('button', { class: 'btn sm ghost', onclick: () => { navigator.clipboard?.writeText(`${u.name} — Level ${u.level} ${u.race} ${u.cls} — ${achievements.points()} pts — GeekOS`); notify('Copied', 'Character line copied to clipboard.', 'scribe'); } }, 'Copy character line')));
      ctx.body.append(header, tree, stats);
    };
    render();
    const off = bus.on('xp', render);
    return () => off();
  },
};
