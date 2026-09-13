/**
 * Book factory — the in-world encyclopedia UI shared by the Forever Codex and the Chronicle.
 */
import { h, store, grantXp, bus, type AppDef, type AppCategory } from '../os/kernel';
import type { CodexSection, CodexEntry } from '../data/codex';
import { icon } from '../os/icons';
import { achievements } from '../os/achievements';
import { sound } from '../os/sound';


export interface BookOpts {
  id: string; name: string; subtitle: string; icon: string; category?: AppCategory; width?: number; height?: number;
  data: CodexSection[]; readKey: string; readEvent: string; achievement?: string; searchPlaceholder: string; footer: string; heading: string;
  /** Optional per-entry action button (label + handler) */
  action?: (sec: CodexSection, e: CodexEntry) => { label: string; run: () => void } | null;
}

export function makeBookApp(o: BookOpts): AppDef {
  const COUNT = o.data.reduce((n, s) => n + s.entries.length, 0);
  return {
    id: o.id, name: o.name, subtitle: o.subtitle, icon: o.icon, category: o.category ?? 'adventure', width: o.width ?? 940, height: o.height ?? 600, minWidth: 560, noScroll: true,
    mount(ctx) {
      const read = new Set<string>(store.get<string[]>(o.readKey, []));
      let secId = ctx.args?.section ?? o.data[0].id; let entryId: string | null = ctx.args?.entry ?? null; let q = '';
      const nav = h('div', { class: 'col', style: { width: '230px', flex: 'none', borderRight: '1px solid var(--gold-700)', padding: '10px', overflow: 'auto', background: 'rgba(0,0,0,.2)', gap: '2px' } });
      const page = h('div', { class: 'grow scroll', style: { padding: '20px 26px' } });
      ctx.body.append(h('div', { class: 'row grow', style: { alignItems: 'stretch', gap: '0', height: '100%' } }, nav, page));
      const findSec = (id: string) => o.data.find(s => s.id === id) ?? o.data[0];

      const progress = () => h('div', { class: 'bar gold', style: { marginTop: '6px' } }, h('i', { style: { width: (100 * read.size / COUNT) + '%' } }), h('span', {}, `${read.size} / ${COUNT} entries read`));
      const renderNav = () => {
        nav.innerHTML = '';
        const s = h('input', { class: 'input', placeholder: o.searchPlaceholder, value: q, oninput: (e: Event) => { q = (e.target as HTMLInputElement).value.toLowerCase(); entryId = null; renderPage(); } });
        nav.append(s, progress(), h('div', { class: 'hr' }));
        for (const sec of o.data) {
          const done = sec.entries.filter(e => read.has(e.id)).length;
          const el = h('div', { class: 'list-item' + (sec.id === secId && !q ? ' active' : '') }, h('span', { style: { width: '22px', height: '22px', flex: 'none' }, html: icon(sec.icon) }), h('span', { class: 'grow', style: { fontFamily: 'var(--font-display)', fontSize: '12px', letterSpacing: '.04em' } }, sec.title), h('span', { class: 'dim small' }, `${done}/${sec.entries.length}`));
          el.addEventListener('click', () => { secId = sec.id; entryId = null; q = ''; sound.click(); renderNav(); renderPage(); });
          nav.append(el);
        }
        nav.append(h('div', { class: 'dim small', style: { marginTop: 'auto', padding: '8px 4px' } }, o.footer));
      };
      const markRead = (id: string) => { if (!read.has(id)) { read.add(id); store.set(o.readKey, [...read]); grantXp(8, o.id); bus.emit(o.readEvent, id); if (o.achievement && read.size >= COUNT) achievements.unlock(o.achievement); renderNav(); } };
      const renderPage = () => {
        page.innerHTML = '';
        if (q) {
          const hits = o.data.flatMap(s => s.entries.map(e => ({ s, e }))).filter(({ e }) => (e.name + ' ' + (e.sub ?? '') + ' ' + e.text).toLowerCase().includes(q));
          page.append(h('div', { class: 'eyebrow' }, `${hits.length} result${hits.length !== 1 ? 's' : ''}`));
          hits.forEach(({ s, e }) => page.append(card(e, s.id)));
          return;
        }
        const sec = findSec(secId);
        if (entryId) {
          const e = sec.entries.find(x => x.id === entryId); if (!e) { entryId = null; renderPage(); return; }
          markRead(e.id);
          const act = o.action?.(sec, e) ?? null;
          page.append(h('div', { class: 'row small dim', style: { marginBottom: '10px', cursor: 'pointer' }, onclick: () => { entryId = null; renderPage(); } }, '‹ ', sec.title));
          page.append(h('div', { class: 'frame', style: { padding: '0 0 22px', animation: 'riseIn .25s ease', overflow: 'hidden' } },
            e.image ? h('div', { class: 'art-hero', style: { height: '260px' } }, h('img', { src: e.image, alt: e.name, draggable: 'false' })) : null,
            h('div', { class: 'row', style: { alignItems: 'flex-start', padding: '18px 26px 0' } },
              h('div', { style: { width: '64px', height: '64px', flex: 'none', border: '1px solid var(--gold-500)', background: '#0a1d26', padding: '4px' }, html: icon(e.icon ?? sec.icon) }),
              h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, sec.title), h('h2', { class: 'display', style: { fontSize: '26px' } }, e.name), e.sub ? h('div', { class: 'dim' }, e.sub) : null),
              e.faction ? h('span', { class: 'badge ' + e.faction }, e.faction) : null, e.level ? h('span', { class: 'badge teal' }, 'Lv ' + e.level) : null),
            h('div', { class: 'hr orn', style: { margin: '10px 26px' } }),
            h('p', { style: { fontSize: '15px', lineHeight: '1.7', color: 'var(--parch-100)', fontFamily: 'var(--font-quest)', margin: '0 26px' } }, e.text),
            (e.tags?.length ? h('div', { class: 'row', style: { margin: '10px 26px 0' } }, ...e.tags.map(t => h('span', { class: 'badge' }, t))) : null),
            h('div', { class: 'row', style: { margin: '18px 26px 0', justifyContent: 'space-between' } },
              (() => { const i = sec.entries.indexOf(e); const p = sec.entries[i - 1]; return h('button', { class: 'btn sm ghost', disabled: !p || undefined, onclick: () => { entryId = p.id; renderPage(); page.scrollTop = 0; } }, p ? '‹ ' + p.name : '‹'); })(),
              act ? h('button', { class: 'btn sm', onclick: act.run }, act.label) : h('span'),
              (() => { const i = sec.entries.indexOf(e); const n = sec.entries[i + 1]; return h('button', { class: 'btn sm ghost', disabled: !n || undefined, onclick: () => { entryId = n.id; renderPage(); page.scrollTop = 0; } }, n ? n.name + ' ›' : '›'); })())));
          return;
        }
        page.append(h('div', { style: { marginBottom: '14px' } }, h('div', { class: 'eyebrow' }, o.heading), h('h2', { class: 'display', style: { fontSize: '28px' } }, sec.title), h('div', { class: 'dim' }, sec.blurb)));
        const grid = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' } });
        sec.entries.forEach(e => grid.append(card(e, sec.id)));
        page.append(grid);
      };
      const card = (e: CodexEntry, sid: string) => {
        const sec = findSec(sid);
        const el = h('div', { class: 'frame', style: { padding: '0', cursor: 'pointer', display: 'flex', flexDirection: 'column', opacity: read.has(e.id) ? .85 : 1, overflow: 'hidden' }, tabindex: '0' },
          e.image ? h('img', { class: 'art-thumb', src: e.image, alt: '', loading: 'lazy', draggable: 'false', style: { border: 'none', borderRadius: '0', borderBottom: '1px solid var(--gold-700)' } }) : null,
          h('div', { style: { display: 'flex', gap: '12px', padding: '10px 12px' } },
            h('div', { style: { width: '40px', height: '40px', flex: 'none', border: '1px solid var(--gold-600)', background: '#0a1d26' }, html: icon(e.icon ?? sec.icon) }),
            h('div', { class: 'grow' }, h('div', { style: { fontFamily: 'var(--font-display)', fontWeight: '700', color: read.has(e.id) ? 'var(--parch-300)' : 'var(--gold-200)' } }, e.name), e.sub ? h('div', { class: 'small dim' }, e.sub) : null, h('div', { class: 'small', style: { color: 'var(--parch-300)', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' } }, e.text)),
            read.has(e.id) ? h('span', { class: 'gold', title: 'Read' }, '✓') : null));
        const open = () => { secId = sid; entryId = e.id; q = ''; sound.click(); renderNav(); renderPage(); page.scrollTop = 0; };
        el.addEventListener('click', open); el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); open(); } });
        return el;
      };
      renderNav(); renderPage();
      const offArgs = bus.on('app:args', ({ win, args }: any) => { if (win === ctx.win && (args?.section || args?.entry)) { secId = args.section ?? secId; entryId = args.entry ?? null; q = ''; renderNav(); renderPage(); } });
      ctx.setStatus(`<span>${o.data.length} chapters · ${COUNT} entries</span><span class="dim">${o.achievement ? 'Read them all for an achievement' : ''}</span>`);
      return () => offArgs();
    },
  };
}
