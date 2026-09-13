/**
 * Atlas — a stylised, original map of Azeroth's two continents with the
 * Forever additions pinned. Shapes are hand-drawn approximations, not game assets.
 */
import { h, bus, type AppDef } from '../os/kernel';
import { bindTooltip } from '../os/ui';
import { launch } from '../os/shell';
import { sound } from '../os/sound';

interface Pin { id: string; name: string; kind: 'zone' | 'dungeon' | 'raid' | 'bg' | 'city'; x: number; y: number; sub: string; codex?: string; section?: string; approx?: boolean; }

const PINS: Pin[] = [
  { id: 'zephras', name: 'Zephras Isle', kind: 'zone', x: 500, y: 110, sub: 'Skyborne starting zone · Lv 1–12', codex: 'zephras', section: 'zones' },
  { id: 'hyjal', name: 'Mount Hyjal', kind: 'zone', x: 262, y: 170, sub: 'Lv 40s–50s · Hyjal Summit raid', codex: 'hyjal', section: 'zones' },
  { id: 'shendralas', name: "Shen'dralas", kind: 'zone', x: 215, y: 330, sub: 'Hidden hollow · mid-level', codex: 'shendralas', section: 'zones' },
  { id: 'riverglades', name: 'The Riverglades', kind: 'zone', x: 735, y: 205, sub: 'Lv 30s–40s · 150+ quests', codex: 'riverglades', section: 'zones' },
  { id: 'summit', name: 'Hyjal Summit', kind: 'raid', x: 278, y: 140, sub: '20-player raid · Dec 9', codex: 'summit', section: 'raids' },
  { id: 'barrow', name: 'Barrow Deeps', kind: 'raid', x: 240, y: 200, sub: '10-player raid', codex: 'barrow', section: 'raids' },
  { id: 'darkspear', name: 'Darkspear Islands', kind: 'bg', x: 372, y: 372, sub: '15 vs 15 battleground', codex: 'darkspear', section: 'raids' },
  { id: 'thanes', name: 'Hall of Thanes', kind: 'dungeon', x: 712, y: 300, sub: 'Beneath Ironforge', codex: 'thanes', section: 'dungeons' },
  { id: 'lordaeron', name: 'Ruins of Lordaeron', kind: 'dungeon', x: 700, y: 120, sub: 'Tirisfal Glades', codex: 'lordaeron', section: 'dungeons' },
  { id: 'whelgar', name: "Whelgar's Excavation", kind: 'dungeon', x: 745, y: 262, sub: 'Wetlands', codex: 'whelgar', section: 'dungeons' },
  { id: 'dalaran', name: 'City of Dalaran', kind: 'dungeon', x: 722, y: 160, sub: 'Alterac', codex: 'dalaran', section: 'dungeons' },
  { id: 'alcaz', name: 'Alcaz Prison', kind: 'dungeon', x: 372, y: 300, sub: 'Dustwallow Marsh', codex: 'alcaz', section: 'dungeons' },
  { id: 'drowned', name: 'The Drowned City', kind: 'dungeon', x: 640, y: 420, sub: 'Coastal · location approximate', codex: 'drowned', section: 'dungeons', approx: true },
  { id: 'kroldok', name: "Krol'dok Stronghold", kind: 'dungeon', x: 320, y: 250, sub: 'Location approximate', codex: 'kroldok', section: 'dungeons', approx: true },
  { id: 'blackmaw', name: 'Blackmaw Hold', kind: 'dungeon', x: 690, y: 370, sub: 'Location approximate', codex: 'blackmaw', section: 'dungeons', approx: true },
  { id: 'shaper', name: "Shaper's Terrace", kind: 'dungeon', x: 190, y: 250, sub: 'Location approximate', codex: 'shaper', section: 'dungeons', approx: true },
  { id: 'org', name: 'Orgrimmar', kind: 'city', x: 350, y: 232, sub: 'Horde capital' },
  { id: 'sw', name: 'Stormwind', kind: 'city', x: 672, y: 350, sub: 'Alliance capital' },
  { id: 'if', name: 'Ironforge', kind: 'city', x: 712, y: 288, sub: 'Alliance capital' },
  { id: 'uc', name: 'Undercity', kind: 'city', x: 690, y: 132, sub: 'Horde capital' },
  { id: 'tb', name: 'Thunder Bluff', kind: 'city', x: 262, y: 300, sub: 'Horde capital' },
  { id: 'darn', name: 'Darnassus', kind: 'city', x: 160, y: 90, sub: 'Alliance capital' },
];
const COLORS: Record<Pin['kind'], string> = { zone: '#3ec7b0', dungeon: '#a374ff', raid: '#ff8000', bg: '#ff4d4d', city: '#e9c874' };

export const atlasApp: AppDef = {
  id: 'atlas', name: 'Atlas of Azeroth', subtitle: 'Where the new things are', icon: 'atlas', category: 'adventure', width: 960, height: 620, noScroll: true,
  mount(ctx) {
    let filter: Pin['kind'] | 'all' = 'all'; let focus: string | null = ctx.args?.zone ?? null;
    const svgNS = 'http://www.w3.org/2000/svg';
    const wrap = h('div', { class: 'grow', style: { position: 'relative', overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 50%, #123a4a, #06171f 75%)' } });
    const legend = h('div', { class: 'row', style: { padding: '8px 12px', borderTop: '1px solid var(--gold-700)', background: 'rgba(0,0,0,.3)', gap: '6px', flexWrap: 'wrap' } });
    ctx.body.append(wrap, legend);
    const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('viewBox', '0 0 900 480'); svg.style.cssText = 'width:100%;height:100%;display:block;font-family:var(--font-display)';
    wrap.append(svg);
    const el = (tag: string, attrs: Record<string, string | number>) => { const e = document.createElementNS(svgNS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v)); return e; };
    // defs: parchment ocean pattern, land gradient
    svg.innerHTML = `<defs>
      <radialGradient id="ocean" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#1b5a6e"/><stop offset="1" stop-color="#0a2733"/></radialGradient>
      <linearGradient id="land" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c8f5a"/><stop offset=".5" stop-color="#5f7a46"/><stop offset="1" stop-color="#3f5a34"/></linearGradient>
      <linearGradient id="snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8eef2"/><stop offset="1" stop-color="#9fb3bd"/></linearGradient>
      <filter id="rough"><feTurbulence baseFrequency=".02" numOctaves="3" seed="4"/><feDisplacementMap in="SourceGraphic" scale="6"/></filter>
      <filter id="shadow"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000" flood-opacity=".6"/></filter>
      <pattern id="lines" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6 L6 0" stroke="rgba(255,255,255,.05)" stroke-width="1"/></pattern>
    </defs>
    <rect width="900" height="480" fill="url(#ocean)"/><image href="/art/background-art.png" x="-60" y="-40" width="1020" height="700" preserveAspectRatio="xMidYMid slice" opacity=".28"/><rect width="900" height="480" fill="url(#lines)"/>
    <g opacity=".25" stroke="#e9c874" fill="none" stroke-width=".6">${Array.from({ length: 9 }, (_, i) => `<line x1="0" y1="${i * 60}" x2="900" y2="${i * 60}"/>`).join('')}${Array.from({ length: 16 }, (_, i) => `<line x1="${i * 60}" y1="0" x2="${i * 60}" y2="480"/>`).join('')}</g>
    <!-- Kalimdor (west) -->
    <g filter="url(#shadow)"><path filter="url(#rough)" fill="url(#land)" stroke="#2a3a24" stroke-width="2" d="M150 60 L200 50 L235 70 L245 110 L290 130 L330 150 L370 175 L395 210 L400 250 L380 275 L395 310 L380 345 L340 360 L300 350 L270 380 L250 420 L200 425 L170 395 L160 350 L140 320 L120 290 L110 250 L130 210 L110 170 L120 120 Z"/></g>
    <path fill="url(#snow)" opacity=".9" d="M245 110 L280 118 L300 140 L270 160 L250 145 Z"/>
    <path fill="#6f5a3a" opacity=".8" d="M140 320 L170 300 L200 320 L190 360 L160 370 Z"/>
    <path fill="#a68a5a" opacity=".7" d="M330 150 L370 175 L395 210 L370 240 L340 225 Z"/>
    <!-- Eastern Kingdoms (east) -->
    <g filter="url(#shadow)"><path filter="url(#rough)" fill="url(#land)" stroke="#2a3a24" stroke-width="2" d="M660 70 L720 60 L760 90 L770 140 L790 190 L780 240 L800 280 L790 330 L760 370 L730 400 L700 430 L650 440 L620 410 L610 370 L630 330 L640 290 L620 250 L650 210 L660 160 Z"/></g>
    <path fill="url(#snow)" opacity=".9" d="M690 280 L720 270 L740 300 L710 320 L690 305 Z"/>
    <path fill="#7a3a2a" opacity=".7" d="M660 330 L700 320 L730 350 L700 380 L660 370 Z"/>
    <path fill="#5c7a3a" opacity=".8" d="M660 70 L720 60 L730 110 L690 130 L665 110 Z"/>
    <!-- Zephras Isle: floating -->
    <g id="zephrasIsle"><ellipse cx="500" cy="135" rx="60" ry="14" fill="#b9d7e4" opacity=".55"/><path d="M455 112 L545 112 L520 140 L480 140 Z" fill="url(#snow)" stroke="#fff" stroke-width="1"/><path d="M470 112 L500 80 L530 112 Z" fill="#7fe6d3" opacity=".9"/><ellipse cx="500" cy="150" rx="70" ry="8" fill="#fff" opacity=".18"/></g>
    <!-- Darkspear islands -->
    <circle cx="372" cy="372" r="12" fill="url(#land)" stroke="#2a3a24"/><circle cx="392" cy="385" r="7" fill="url(#land)" stroke="#2a3a24"/>
    <!-- labels -->
    <text x="240" y="470" fill="#e9c874" font-size="18" letter-spacing="6" opacity=".7">KALIMDOR</text>
    <text x="600" y="470" fill="#e9c874" font-size="18" letter-spacing="6" opacity=".7">EASTERN KINGDOMS</text>
    <text x="440" y="240" fill="#e9c874" font-size="12" letter-spacing="4" opacity=".45" transform="rotate(-90 440 240)">THE GREAT SEA</text>
    <g id="compass" transform="translate(70 400)"><circle r="34" fill="rgba(0,0,0,.35)" stroke="#b8933f"/><path d="M0 -30 L6 0 L0 -6 L-6 0Z" fill="#e9c874"/><path d="M0 30 L6 0 L0 6 L-6 0Z" fill="#8a6a25"/><path d="M-30 0 L0 6 L-6 0 L0 -6Z" fill="#8a6a25"/><path d="M30 0 L0 6 L6 0 L0 -6Z" fill="#8a6a25"/><text y="-38" text-anchor="middle" fill="#e9c874" font-size="10">N</text></g>`;
    const pinsG = el('g', {}); svg.append(pinsG);
    const renderPins = () => {
      pinsG.innerHTML = '';
      for (const p of PINS.filter(p => filter === 'all' || p.kind === filter)) {
        const g = el('g', { transform: `translate(${p.x} ${p.y})`, style: 'cursor:pointer' }) as SVGGElement;
        const c = COLORS[p.kind];
        if (p.kind === 'city') { g.append(el('rect', { x: -4, y: -4, width: 8, height: 8, fill: c, stroke: '#000', transform: 'rotate(45)' })); }
        else {
          const ring = el('circle', { r: 11, fill: 'none', stroke: c, 'stroke-width': 1.5, opacity: .8 }); ring.innerHTML = `<animate attributeName="r" values="9;15;9" dur="2.6s" repeatCount="indefinite"/><animate attributeName="opacity" values=".8;.1;.8" dur="2.6s" repeatCount="indefinite"/>`; g.append(ring);
          g.append(el('circle', { r: 6, fill: c, stroke: '#000', 'stroke-width': 1.2 }));
          const glyph = p.kind === 'zone' ? '!' : p.kind === 'raid' ? '☠' : p.kind === 'bg' ? '⚔' : '▣';
          const t = el('text', { y: 3.5, 'text-anchor': 'middle', 'font-size': 8, fill: '#000', 'font-weight': 700 }); t.textContent = glyph; g.append(t);
          if (p.approx) g.append(el('circle', { r: 6, fill: 'none', stroke: '#fff', 'stroke-dasharray': '2 2', 'stroke-width': .8 }));
        }
        const label = el('text', { x: 10, y: -8, 'font-size': p.kind === 'city' ? 8 : 10, fill: p.kind === 'city' ? '#cdbf9d' : '#fff', stroke: '#000', 'stroke-width': 2.5, 'paint-order': 'stroke', 'font-weight': 700, 'letter-spacing': .5 }); label.textContent = p.name; g.append(label);
        if (focus === p.id) { const f = el('circle', { r: 22, fill: 'none', stroke: '#fff', 'stroke-width': 2 }); f.innerHTML = `<animate attributeName="r" values="30;18" dur="1s" repeatCount="indefinite"/>`; g.append(f); }
        bindTooltip(g as unknown as HTMLElement, { name: p.name, sub: p.sub, quality: p.kind === 'raid' ? 'legendary' : p.kind === 'dungeon' ? 'epic' : p.kind === 'zone' ? 'rare' : undefined, lines: p.codex ? ['<span class="dim">Click to open in the Codex</span>'] : [] });
        g.addEventListener('click', () => { sound.click(); focus = p.id; bus.emit('atlas:pin', p.id); renderPins(); if (p.codex) launch('codex', { section: p.section, entry: p.codex }); });
        pinsG.append(g);
      }
    };
    const renderLegend = () => {
      legend.innerHTML = '';
      (['all', 'zone', 'dungeon', 'raid', 'bg', 'city'] as const).forEach(k => { const b = h('button', { class: 'btn sm ' + (filter === k ? 'gold' : 'ghost'), onclick: () => { filter = k; renderPins(); renderLegend(); } }, k === 'all' ? 'Everything' : k === 'bg' ? 'Battleground' : k[0].toUpperCase() + k.slice(1) + 's'); if (k !== 'all') b.style.borderColor = COLORS[k]; legend.append(b); });
      legend.append(h('span', { class: 'dim small', style: { marginLeft: 'auto' } }, 'Dashed pins: location not yet announced. Map is a stylised approximation.'));
    };
    renderPins(); renderLegend();
    // pan & zoom
    let vb = { x: 0, y: 0, w: 900, h: 480 }; const applyVb = () => svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
    wrap.addEventListener('wheel', (e) => { e.preventDefault(); const f = e.deltaY > 0 ? 1.12 : 0.89; const nw = Math.min(900, Math.max(200, vb.w * f)); const nh = nw * 480 / 900; const r = wrap.getBoundingClientRect(); const mx = (e.clientX - r.left) / r.width, my = (e.clientY - r.top) / r.height; vb.x = Math.max(0, Math.min(900 - nw, vb.x + (vb.w - nw) * mx)); vb.y = Math.max(0, Math.min(480 - nh, vb.y + (vb.h - nh) * my)); vb.w = nw; vb.h = nh; applyVb(); }, { passive: false });
    wrap.addEventListener('mousedown', (e) => { if (e.button !== 0) return; const sx = e.clientX, sy = e.clientY, ox = vb.x, oy = vb.y; const r = wrap.getBoundingClientRect(); const mv = (ev: MouseEvent) => { vb.x = Math.max(0, Math.min(900 - vb.w, ox - (ev.clientX - sx) * vb.w / r.width)); vb.y = Math.max(0, Math.min(480 - vb.h, oy - (ev.clientY - sy) * vb.h / r.height)); applyVb(); }; const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); }; addEventListener('mousemove', mv); addEventListener('mouseup', up); });
    ctx.setStatus(`<span>${PINS.filter(p => p.kind !== 'city').length} Forever locations</span><span class="dim">Scroll to zoom · drag to pan · click a pin</span>`);
  },
};
