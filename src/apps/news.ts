/**
 * Herald — official World of Warcraft news, refreshed automatically from
 * Blizzard's site by the content cron. Forever posts are highlighted.
 */
import { h, esc, bus, grantXp, type AppDef } from '../os/kernel';
import { content, type NewsItem } from '../os/content';
import { launch } from '../os/shell';
import { sound } from '../os/sound';
import { notify } from '../os/ui';

const rel = (iso: string | null) => { if (!iso) return ''; const d = (Date.now() - Date.parse(iso)) / 864e5; if (d < 1) return 'today'; if (d < 2) return 'yesterday'; if (d < 30) return `${Math.floor(d)} days ago`; return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); };

export const newsApp: AppDef = {
  id: 'news', name: 'Herald', subtitle: 'Official news, auto-refreshed', icon: 'bell', category: 'adventure', width: 900, height: 620, minWidth: 640, noScroll: true,
  mount(ctx) {
    let onlyForever = true; let sel: NewsItem | null = null;
    const head = h('div', { class: 'row', style: { padding: '8px 12px', borderBottom: '1px solid var(--gold-700)', background: 'rgba(0,0,0,.25)' } });
    const list = h('div', { class: 'col', style: { width: '340px', flex: 'none', borderRight: '1px solid var(--gold-700)', overflow: 'auto', gap: '0', background: 'rgba(0,0,0,.2)' } });
    const pane = h('div', { class: 'grow scroll' });
    ctx.body.append(head, h('div', { class: 'row grow', style: { alignItems: 'stretch', gap: '0', minHeight: '0' } }, list, pane));
    const status = () => { const m = content.manifest; ctx.setStatus(`<span>${m ? m.news.length + ' articles' : 'No content yet'}</span><span class="dim">Checked ${content.lastChecked ? rel(new Date(content.lastChecked).toISOString()) : 'never'} · source: ${content.source}</span><span class="dim" style="margin-left:auto">${m?.checkedAt ? 'Manifest ' + new Date(m.checkedAt).toLocaleString() : ''}</span>`); };
    const renderHead = () => { head.innerHTML = ''; head.append(
      h('button', { class: 'btn sm ' + (onlyForever ? 'gold' : 'ghost'), onclick: () => { onlyForever = true; render(); } }, 'Forever'),
      h('button', { class: 'btn sm ' + (!onlyForever ? 'gold' : 'ghost'), onclick: () => { onlyForever = false; render(); } }, 'All WoW news'),
      h('span', { class: 'grow' }),
      h('button', { class: 'btn sm', onclick: async () => { sound.click(); const r = await content.refresh(true); notify(r.error && r.manifest ? 'Using cached content' : 'Herald refreshed', r.fresh.length ? `${r.fresh.length} new article${r.fresh.length > 1 ? 's' : ''}.` : (r.error ?? 'Nothing new from Azeroth.'), 'bell', { sound: false, timeout: 3500 }); render(); } }, 'Refresh now'),
      h('button', { class: 'btn sm ghost', onclick: () => launch('settings', { tab: 'updates' }) }, 'Update settings')); };
    const renderList = () => {
      list.innerHTML = '';
      const items = content.news(onlyForever);
      if (!items.length) { list.append(h('div', { class: 'dim small', style: { padding: '14px' } }, content.manifest ? 'No articles in this view.' : 'Fetching the latest from Blizzard…')); return; }
      for (const n of items) {
        const el = h('div', { class: 'list-item' + (sel?.id === n.id ? ' active' : ''), style: { borderRadius: '0', borderBottom: '1px solid rgba(233,200,116,.08)', alignItems: 'flex-start', gap: '10px', padding: '10px' } },
          n.thumb ? h('img', { src: n.thumb, alt: '', loading: 'lazy', draggable: 'false', style: { width: '84px', height: '48px', objectFit: 'cover', border: '1px solid var(--gold-700)', flex: 'none' } }) : h('div', { style: { width: '84px', height: '48px', background: 'rgba(0,0,0,.4)', flex: 'none' } }),
          h('div', { class: 'grow', style: { minWidth: '0' } }, h('div', { style: { fontWeight: '700', fontSize: '12.5px', color: n.forever ? 'var(--gold-200)' : 'var(--parch-200)', lineHeight: '1.25' } }, n.title), h('div', { class: 'dim small', style: { marginTop: '3px' } }, rel(n.publishedAt), n.forever ? h('span', { class: 'badge teal', style: { marginLeft: '6px', fontSize: '9px' } }, 'Forever') : null)));
        el.addEventListener('click', () => { sel = n; sound.click(); renderList(); renderPane(); });
        list.append(el);
      }
    };
    const renderPane = () => {
      pane.innerHTML = '';
      const n = sel ?? content.news(onlyForever)[0]; if (!n) return; sel = n;
      pane.append(
        n.header ? h('div', { class: 'art-hero', style: { height: '280px' } }, h('img', { src: n.header, alt: '', draggable: 'false' }), h('div', { class: 'cap' }, h('div', { class: 'eyebrow' }, n.forever ? 'World of Warcraft: Forever' : 'World of Warcraft'), h('h2', { class: 'display', style: { fontSize: '24px' } }, n.title))) : h('div', { style: { padding: '18px 22px 0' } }, h('h2', { class: 'display', style: { fontSize: '24px' } }, n.title)),
        h('div', { style: { padding: '16px 22px' } },
          h('div', { class: 'dim small', style: { marginBottom: '10px' } }, `Published ${n.publishedAt ? new Date(n.publishedAt).toLocaleString() : 'recently'} on worldofwarcraft.blizzard.com`),
          h('p', { class: 'quest-font', style: { fontSize: '15.5px', lineHeight: '1.7', color: 'var(--parch-100)' } }, n.summary || 'Open the article to read it.'),
          h('div', { class: 'row', style: { marginTop: '16px' } },
            h('button', { class: 'btn gold', onclick: () => { window.open(n.url, '_blank', 'noopener'); grantXp(4, 'news'); bus.emit('news:read', n.id); } }, 'Read on Blizzard.com'),
            h('button', { class: 'btn ghost', onclick: () => { launch('portal', { url: n.url }); bus.emit('news:read', n.id); } }, 'Open in Portal'))));
    };
    const render = () => { renderHead(); renderList(); renderPane(); status(); };
    render(); content.markNewsSeen();
    const off = bus.on('content:update', () => { render(); content.markNewsSeen(); });
    return () => off();
    void esc;
  },
};
