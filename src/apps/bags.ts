/**
 * Bags — the file explorer. Folders are bags, files are items with quality colours.
 */
import { h, esc, bus, type AppDef } from '../os/kernel';
import { fs, type FsNode } from '../os/fs';
import { icon, glyph } from '../os/icons';
import { bindTooltip, contextMenu, prompt, confirm, notify } from '../os/ui';
import { sound } from '../os/sound';
import { launch, wallpaper } from '../os/shell';
import { achievements } from '../os/achievements';

const typeIcon = (n: FsNode) => n.type === 'folder' ? (n.id === 'trash' ? 'trash' : 'bag') : n.type === 'image' ? 'image' : n.type === 'audio' ? 'audio' : n.type === 'letter' ? 'mail' : n.type === 'app' ? (n.app ?? 'file') : 'file';

export function openNode(n: FsNode) {
  if (n.type === 'folder') return;
  if (n.type === 'text') launch('scribe', { file: n.id });
  else if (n.type === 'letter') { launch('scribe', { file: n.id, readonly: true }); if (n.id === 'scarlet') { setTimeout(() => achievements.unlock('secret-file'), 600); } }
  else if (n.type === 'image') { if (n.meta?.wall) { wallpaper.set(n.meta.wall); launch('gallery', { wall: n.meta.wall }); } }
  else if (n.type === 'audio') launch('jukebox', { track: n.meta?.track });
  else if (n.type === 'app') { if (n.id === 'murloc') { sound.murloc(); achievements.unlock('murloc'); notify('Mrglglglgl!', 'A murloc was living in your Grave. He seems happy about it.', 'murloc'); return; } launch(n.app ?? 'about'); }
}

export const bagsApp: AppDef = {
  id: 'bags', name: 'Bags', subtitle: 'Your files and folders', icon: 'bag', category: 'tools', width: 820, height: 520, singleton: false, noScroll: true,
  mount(ctx) {
    let cur = ctx.args?.folder ?? 'root'; let view: 'grid' | 'list' = 'grid'; let selId: string | null = null; let q = '';
    const crumbs = h('div', { class: 'row grow', style: { gap: '4px', overflow: 'hidden' } });
    const search = h('input', { class: 'input', placeholder: 'Search…', style: { width: '180px' }, oninput: (e: Event) => { q = (e.target as HTMLInputElement).value; render(); } });
    const toolbar = h('div', { class: 'row', style: { padding: '8px 10px', borderBottom: '1px solid var(--gold-700)', background: 'rgba(0,0,0,.25)' } },
      h('button', { class: 'btn sm icon', title: 'Up', html: glyph.up, onclick: () => { const n = fs.get(cur); if (n?.parent) { cur = n.parent; render(); } } }),
      crumbs,
      h('button', { class: 'btn sm icon', title: 'Grid', html: glyph.grid, onclick: () => { view = 'grid'; render(); } }),
      h('button', { class: 'btn sm icon', title: 'List', html: glyph.list, onclick: () => { view = 'list'; render(); } }),
      search);
    const side = h('div', { class: 'col', style: { width: '170px', flex: 'none', borderRight: '1px solid var(--gold-700)', padding: '10px 8px', gap: '2px', background: 'rgba(0,0,0,.15)' } });
    const main = h('div', { class: 'grow scroll', style: { padding: '12px' } });
    ctx.body.append(toolbar, h('div', { class: 'row grow', style: { alignItems: 'stretch', gap: '0' } }, side, main));

    const sideItem = (id: string, label: string, ic: string) => { const el = h('div', { class: 'list-item' + (cur === id ? ' active' : '') }, h('span', { style: { width: '20px', height: '20px' }, html: icon(ic) }), label); el.addEventListener('click', () => { cur = id; render(); }); return el; };
    const renderSide = () => { side.innerHTML = ''; side.append(h('div', { class: 'eyebrow', style: { margin: '2px 6px 6px' } }, 'Bags')); side.append(sideItem('root', 'Backpack', 'bag')); fs.children('root').filter(n => n.type === 'folder').forEach(n => side.append(sideItem(n.id, n.name, 'folder'))); side.append(h('div', { class: 'hr' })); side.append(sideItem('trash', 'Grave', 'trash')); };

    const tile = (n: FsNode) => {
      const el = view === 'grid'
        ? h('div', { class: 'dicon' + (selId === n.id ? ' sel' : ''), style: { width: '96px', height: '100px' } }, h('div', { class: 'ico', style: { borderColor: n.quality ? `var(--q-${n.quality})` : undefined }, html: icon(typeIcon(n)) }), h('div', { class: 'lbl ' + (n.quality ? 'q-' + n.quality : ''), style: { textShadow: 'none', color: n.quality ? undefined : 'var(--parch-100)' } }, n.name))
        : h('div', { class: 'list-item' + (selId === n.id ? ' active' : '') }, h('span', { style: { width: '22px', height: '22px' }, html: icon(typeIcon(n)) }), h('span', { class: 'grow ' + (n.quality ? 'q-' + n.quality : '') }, n.name), h('span', { class: 'dim small', style: { width: '80px' } }, n.type), h('span', { class: 'dim small', style: { width: '150px' } }, new Date(n.modified).toLocaleString()));
      el.addEventListener('click', () => { selId = n.id; render(); });
      el.addEventListener('dblclick', () => { if (n.type === 'folder') { cur = n.id; render(); } else openNode(n); });
      el.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); selId = n.id; render(); contextMenu(e.clientX, e.clientY, [
        { label: 'Open', icon: 'play', action: () => n.type === 'folder' ? (cur = n.id, render()) : openNode(n) },
        { label: 'Rename', icon: 'star', disabled: n.id === 'trash' || n.id === 'root', action: async () => { const v = await prompt('Rename', 'New name', n.name); if (v) { fs.rename(n.id, v); } } },
        { sep: true },
        ...(cur === 'trash' ? [{ label: 'Restore to Backpack', icon: 'up', action: () => fs.move(n.id, 'root') }, { label: 'Destroy forever', icon: 'trash', disabled: n.id === 'scarlet' || n.id === 'murloc', action: async () => { if (await confirm('Destroy item?', `${n.name} will be gone. Forever.`, 'Destroy', 'Keep')) fs.remove(n.id); } }]
          : [{ label: 'Move to Grave', icon: 'trash', disabled: n.id === 'trash' || n.parent === null, action: () => { fs.trash(n.id); sound.close(); } }]),
      ]); });
      const lines = [`<span class="dim">${n.type === 'folder' ? fs.children(n.id).length + ' items' : n.type}</span>`, `<span class="dim">Modified ${new Date(n.modified).toLocaleDateString()}</span>`];
      bindTooltip(el, { name: n.name, quality: n.quality, lines, flavor: n.meta?.flavor, bind: n.type === 'app' ? 'Binds when picked up' : undefined });
      return el;
    };
    const render = () => {
      renderSide();
      crumbs.innerHTML = '';
      fs.path(cur).forEach((p, i, arr) => { const b = h('span', { style: { cursor: 'pointer', color: i === arr.length - 1 ? 'var(--gold-200)' : 'var(--text-dim)', fontFamily: 'var(--font-display)', fontSize: '12px' } }, p.name); b.addEventListener('click', () => { cur = p.id; render(); }); crumbs.append(b); if (i < arr.length - 1) crumbs.append(h('span', { class: 'dim' }, '›')); });
      main.innerHTML = '';
      let items = q ? fs.find(q) : fs.children(cur);
      items = items.filter(n => !n.hidden);
      if (view === 'grid') { const g = h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '4px' } }); items.forEach(n => g.append(tile(n))); main.append(g); }
      else { const l = h('div', { class: 'list' }); l.append(h('div', { class: 'row small dim', style: { padding: '4px 10px' } }, h('span', { style: { width: '22px' } }), h('span', { class: 'grow' }, 'Name'), h('span', { style: { width: '80px' } }, 'Type'), h('span', { style: { width: '150px' } }, 'Modified'))); items.forEach(n => l.append(tile(n))); main.append(l); }
      if (!items.length) main.append(h('div', { class: 'dim', style: { textAlign: 'center', padding: '40px' } }, cur === 'trash' ? 'The Grave is empty. For now.' : 'This bag is empty.'));
      const name = fs.get(cur)?.name ?? 'Bags';
      ctx.setTitle(`Bags — ${name}`);
      ctx.setStatus(`<span>${items.length} item${items.length !== 1 ? 's' : ''}</span>${selId ? `<span class="gold">${esc(fs.get(selId)?.name ?? '')}</span>` : ''}<span class="dim" style="margin-left:auto">${fs.all().length} items in all bags</span>`);
    };
    main.addEventListener('contextmenu', (e) => { if ((e.target as HTMLElement).closest('.dicon,.list-item')) return; e.preventDefault(); contextMenu(e.clientX, e.clientY, [
      { label: 'New scroll', icon: 'plus', disabled: cur === 'trash', action: async () => { const v = await prompt('New scroll', 'Name', 'New scroll.txt'); if (v) { const n = fs.create(cur, v, 'text', ''); launch('scribe', { file: n.id }); } } },
      { label: 'New bag', icon: 'plus', disabled: cur === 'trash', action: async () => { const v = await prompt('New bag', 'Name', 'New bag'); if (v) fs.create(cur, v, 'folder'); } },
      { sep: true },
      ...(cur === 'trash' ? [{ label: 'Empty the Grave', icon: 'trash', action: async () => { if (await confirm('Empty the Grave?', 'Everything inside will be destroyed. Well. Almost everything.', 'Empty', 'Keep')) { fs.emptyTrash(); sound.boom(); notify('Grave emptied', 'Something in there refused to leave.', 'trash'); } } }] : []),
      { label: 'Refresh', icon: 'refresh', action: render },
    ]); });
    main.addEventListener('click', (e) => { if (e.target === main || (e.target as HTMLElement).parentElement === main) { selId = null; render(); } });
    const off = bus.on('fs:change', render);
    render();
    return () => off();
  },
};

/** The Grave: the Bags app opened straight at the trash folder. */
export const graveApp: AppDef = { ...bagsApp, id: 'grave', name: 'Grave', subtitle: 'What was thrown away', icon: 'trash', hidden: true, mount(ctx) { ctx.args = { ...(ctx.args ?? {}), folder: 'trash' }; return bagsApp.mount(ctx); } };
