/**
 * Achievements — earned, unearned, and hidden (with hints).
 */
import { h, bus, type AppDef } from '../os/kernel';
import { achievements, ACHIEVEMENTS } from '../os/achievements';
import { icon } from '../os/icons';

export const achievementsApp: AppDef = {
  id: 'achievements', name: 'Achievements', subtitle: 'Feats of strength and desk', icon: 'achievements', category: 'adventure', width: 820, height: 560,
  mount(ctx) {
    let tab: 'all' | 'earned' | 'hidden' = 'all';
    const render = () => {
      ctx.body.innerHTML = '';
      const pts = achievements.points(), total = achievements.totalPoints(); const earned = ACHIEVEMENTS.filter(a => achievements.has(a.id));
      ctx.body.append(h('div', { style: { padding: '18px 22px', borderBottom: '1px solid var(--gold-700)', background: 'linear-gradient(180deg, rgba(0,0,0,.25), transparent)', display: 'flex', gap: '18px', alignItems: 'center' } },
        h('div', { style: { width: '64px', height: '64px', flex: 'none' }, html: icon('achievements') }),
        h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, 'Achievement points'), h('div', { class: 'display', style: { fontSize: '34px', lineHeight: '1' } }, `${pts}`), h('div', { class: 'dim small' }, `of ${total} · ${earned.length} / ${ACHIEVEMENTS.length} earned`)),
        h('div', { style: { width: '260px' } }, h('div', { class: 'bar gold', style: { height: '16px' } }, h('i', { style: { width: (100 * pts / total) + '%' } }), h('span', {}, `${Math.round(100 * pts / total)}%`)))));
      const tabs = h('div', { class: 'tabs' }, ...(['all', 'earned', 'hidden'] as const).map(t => h('div', { class: 'tab' + (tab === t ? ' active' : ''), onclick: () => { tab = t; render(); } }, t === 'all' ? 'All' : t === 'earned' ? 'Earned' : 'Hidden')));
      ctx.body.append(tabs);
      const list = h('div', { style: { padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '8px' } });
      const items = ACHIEVEMENTS.filter(a => tab === 'all' ? true : tab === 'earned' ? achievements.has(a.id) : a.hidden);
      for (const a of items) {
        const has = achievements.has(a.id); const secret = a.hidden && !has;
        list.append(h('div', { class: 'frame', style: { padding: '10px 12px', display: 'flex', gap: '12px', alignItems: 'center', opacity: has ? 1 : .7, borderColor: has ? 'var(--gold-400)' : undefined } },
          h('div', { style: { width: '44px', height: '44px', flex: 'none', border: '1px solid ' + (has ? 'var(--gold-300)' : 'var(--gold-700)'), background: '#0a1d26', padding: '3px', filter: has ? 'none' : 'grayscale(1) brightness(.6)' }, html: icon(secret ? 'faq' : a.icon ?? 'achievements') }),
          h('div', { class: 'grow' }, h('div', { style: { fontFamily: 'var(--font-display)', fontWeight: '700', color: has ? 'var(--gold-200)' : 'var(--parch-300)' } }, secret ? 'Hidden achievement' : a.name), h('div', { class: 'small', style: { color: 'var(--text-dim)' } }, secret ? (a.hint ? `Hint: ${a.hint}` : 'Keep exploring.') : a.desc)),
          h('div', { style: { width: '36px', height: '36px', flex: 'none', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: '900', fontSize: '13px', color: has ? 'var(--gold-100)' : 'var(--text-dim)', background: has ? 'radial-gradient(circle, var(--gold-500), var(--gold-700))' : 'rgba(0,0,0,.4)', border: '2px solid ' + (has ? 'var(--gold-300)' : 'var(--gold-700)'), borderRadius: '50%' } }, String(a.points))));
      }
      if (!items.length) list.append(h('div', { class: 'dim', style: { padding: '30px', textAlign: 'center', gridColumn: '1/-1' } }, 'Nothing here yet. Go do something legendary.'));
      ctx.body.append(list);
    };
    render();
    const off = bus.on('achievement', render);
    return () => off();
  },
};
