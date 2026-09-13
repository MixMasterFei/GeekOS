/**
 * Vistas — browse the procedural wallpapers, set them, export a snapshot.
 */
import { h, type AppDef } from '../os/kernel';
import { WALLPAPERS } from '../os/wallpaper';
import { wallpaper } from '../os/shell';
import { sound } from '../os/sound';
import { notify } from '../os/ui';

export const galleryApp: AppDef = {
  id: 'gallery', name: 'Vistas', subtitle: 'Wallpapers of the Forever era', icon: 'gallery', category: 'system', width: 860, height: 600, noScroll: true,
  mount(ctx) {
    let cur = ctx.args?.wall ?? wallpaper.current.id;
    const big = document.createElement('canvas'); big.style.cssText = 'width:100%;height:100%;display:block';
    const view = h('div', { class: 'grow', style: { position: 'relative', minHeight: '0', background: '#000' } }, big);
    const cap = h('div', { style: { position: 'absolute', left: '0', right: '0', bottom: '0', padding: '14px 18px', background: 'linear-gradient(transparent, rgba(0,0,0,.85))' } });
    view.append(cap);
    const strip = h('div', { class: 'row', style: { padding: '10px', gap: '8px', overflowX: 'auto', borderTop: '1px solid var(--gold-700)', background: 'rgba(0,0,0,.3)', flex: 'none' } });
    ctx.body.append(view, strip);
    let raf = 0; const t0 = performance.now();
    const drawBig = () => { const wp = WALLPAPERS.find(w => w.id === cur)!; const r = view.getBoundingClientRect(); big.width = Math.max(1, r.width); big.height = Math.max(1, r.height); wp.draw(big.getContext('2d')!, big.width, big.height, (performance.now() - t0) / 1000); raf = requestAnimationFrame(() => setTimeout(drawBig, 1000 / 20)); };
    const renderCap = () => { const wp = WALLPAPERS.find(w => w.id === cur)!; cap.innerHTML = ''; cap.append(h('div', { class: 'row' }, h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, 'Vista'), h('div', { class: 'display', style: { fontSize: '24px' } }, wp.name), h('div', { class: 'dim small' }, `${wp.group} · ${wp.sub}`)),
      h('button', { class: 'btn ' + (wallpaper.current.id === cur ? 'ghost' : 'gold'), onclick: () => { wallpaper.set(cur); sound.coin(); renderCap(); renderStrip(); } }, wallpaper.current.id === cur ? 'Current vista' : 'Set as vista'),
      h('button', { class: 'btn', onclick: () => { const a = document.createElement('a'); a.download = wp.src.split('/').pop()!; a.href = wp.src; a.click(); notify('Vista saved', `${wp.name} at original resolution.`, 'gallery'); } }, 'Save original'))); };
    const renderStrip = () => { strip.innerHTML = ''; for (const wp of WALLPAPERS) { const c = h('img', { src: wp.src, alt: wp.name, loading: 'lazy', draggable: 'false' }); c.style.cssText = `width:160px;height:90px;object-fit:cover;flex:none;cursor:pointer;border:2px solid ${wp.id === cur ? 'var(--gold-300)' : wallpaper.current.id === wp.id ? 'var(--teal-400)' : 'var(--gold-700)'};border-radius:3px`; c.title = wp.name; c.addEventListener('click', () => { cur = wp.id; sound.click(); renderCap(); renderStrip(); }); c.addEventListener('dblclick', () => { wallpaper.set(wp.id); renderCap(); renderStrip(); }); strip.append(c); } };
    drawBig(); renderCap(); renderStrip();
    ctx.setStatus(`<span>${WALLPAPERS.length} vistas</span><span class="dim">Official Blizzard art. Double-click a thumbnail to set it.</span>`);
    return () => cancelAnimationFrame(raf);
  },
};
