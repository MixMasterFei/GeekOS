/**
 * Portal — a small browser for the sites that allow being framed, with an
 * "open externally" escape hatch for the ones that do not.
 */
import { h, store, type AppDef } from '../os/kernel';
import { glyph } from '../os/icons';
import { sound } from '../os/sound';

const MARKS: { name: string; url: string; external?: boolean }[] = [
  { name: 'Wikipedia: World of Warcraft', url: 'https://en.wikipedia.org/wiki/World_of_Warcraft' },
  { name: 'Wikipedia: Warcraft universe', url: 'https://en.wikipedia.org/wiki/Warcraft' },
  { name: 'WoW: Forever (official) ↗', url: 'https://worldofwarcraft.blizzard.com/en-us/forever', external: true },
  { name: 'Warcraft Wiki ↗', url: 'https://warcraft.wiki.gg/wiki/World_of_Warcraft:_Forever', external: true },
  { name: 'Battle.net developer portal ↗', url: 'https://develop.battle.net/', external: true },
];

export const portalApp: AppDef = {
  id: 'portal', name: 'Portal', subtitle: 'A window to the outside world', icon: 'portal', category: 'tools', width: 980, height: 660, singleton: false, noScroll: true,
  mount(ctx) {
    let url = ctx.args?.url ?? store.get('portal.last', MARKS[0].url);
    const addr = h('input', { class: 'input', value: url, spellcheck: 'false', style: { fontFamily: 'var(--font-mono)', fontSize: '12.5px' } });
    const frame = h('iframe', { src: url, style: { flex: '1', border: 'none', background: '#fff', minHeight: '0' }, sandbox: 'allow-scripts allow-same-origin allow-forms allow-popups', referrerpolicy: 'no-referrer' }) as HTMLIFrameElement;
    const nav = (u: string) => { if (!/^https?:\/\//i.test(u)) u = 'https://' + u; url = u; addr.value = u; frame.src = u; store.set('portal.last', u); ctx.setTitle('Portal — ' + u.replace(/^https?:\/\//, '').slice(0, 60)); sound.click(); };
    const marks = h('select', { class: 'input', style: { width: '230px' }, onchange: (e: Event) => { const v = (e.target as HTMLSelectElement).value; const m = MARKS.find(x => x.url === v); if (m?.external) window.open(m.url, '_blank', 'noopener'); else if (v) nav(v); (e.target as HTMLSelectElement).value = ''; } }, h('option', { value: '' }, 'Bookmarks… (↗ opens outside)'), ...MARKS.map(m => h('option', { value: m.url }, m.name)));
    const tb = h('div', { class: 'row', style: { padding: '6px 8px', borderBottom: '1px solid var(--gold-700)', background: 'rgba(0,0,0,.25)' } },
      h('button', { class: 'btn sm icon', html: glyph.back, title: 'Back', onclick: () => { try { frame.contentWindow?.history.back(); } catch {} } }),
      h('button', { class: 'btn sm icon', html: glyph.refresh, title: 'Reload', onclick: () => { frame.src = url; } }),
      addr, marks,
      h('button', { class: 'btn sm', onclick: () => window.open(url, '_blank', 'noopener') }, 'Open outside'));
    addr.addEventListener('keydown', (e) => { if (e.key === 'Enter') nav(addr.value.trim()); });
    ctx.body.append(tb, frame, h('div', { class: 'dim small', style: { padding: '4px 10px', borderTop: '1px solid var(--gold-700)', background: 'rgba(0,0,0,.25)' } }, 'Some realms refuse portals (they block being framed) and will show blank. Use "Open outside" for those.'));
    ctx.setTitle('Portal — ' + url.replace(/^https?:\/\//, '').slice(0, 60));
  },
};
