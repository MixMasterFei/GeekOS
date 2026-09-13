/**
 * Vistas — official World of Warcraft: Forever key art and screenshots,
 * rendered on canvas with a slow Ken Burns drift, a soft vignette and
 * floating light motes so the desktop feels alive.
 */
import { store, bus } from './kernel';

export interface Wallpaper { id: string; name: string; sub: string; src: string; group: 'Key Art' | 'New Zones' | 'Dungeons & Raids' | 'Azeroth Reborn'; motes?: string; focus?: [number, number]; draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void; }

const cache = new Map<string, HTMLImageElement>();
export function loadImage(src: string): HTMLImageElement { let im = cache.get(src); if (!im) { im = new Image(); im.decoding = 'async'; im.src = src; cache.set(src, im); } return im; }

function prng(seed: number) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

function drawCover(ctx: CanvasRenderingContext2D, im: HTMLImageElement, w: number, h: number, t: number, focus: [number, number] = [0.5, 0.5], drift = true) {
  if (!im.complete || !im.naturalWidth) { ctx.fillStyle = '#071c26'; ctx.fillRect(0, 0, w, h); return false; }
  const zoom = drift ? 1.06 + Math.sin(t * 0.05) * 0.03 : 1;
  const s = Math.max(w / im.naturalWidth, h / im.naturalHeight) * zoom;
  const dw = im.naturalWidth * s, dh = im.naturalHeight * s;
  const px = drift ? Math.sin(t * 0.04) * 0.5 + 0.5 : focus[0], py = drift ? Math.cos(t * 0.03) * 0.5 + 0.5 : focus[1];
  const fx = focus[0] * 0.7 + px * 0.3, fy = focus[1] * 0.7 + py * 0.3;
  ctx.drawImage(im, -(dw - w) * fx, -(dh - h) * fy, dw, dh);
  return true;
}
function motes(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, n: number, color: string, t: number, speed = 9) {
  const r = prng(seed);
  for (let i = 0; i < n; i++) { const x0 = r() * w, y0 = r() * h, s = r() * 2 + 0.8, ph = r() * 100; const x = (x0 + Math.sin(t * 0.3 + ph) * 22 + w) % w; const y = ((y0 - t * speed * (0.4 + r())) % h + h) % h; const a = 0.25 + 0.3 * Math.sin(t + ph); ctx.fillStyle = color.replace('A', Math.max(0, a).toFixed(2)); ctx.beginPath(); ctx.arc(x, y, s, 0, 6.28); ctx.fill(); }
}
const mk = (id: string, name: string, sub: string, file: string, group: Wallpaper['group'], motesColor = 'rgba(233,200,116,A)', focus: [number, number] = [0.5, 0.5]): Wallpaper => ({
  id, name, sub, src: `/art/${file}`, group, motes: motesColor, focus,
  draw(ctx, w, h, t) {
    const ok = drawCover(ctx, loadImage(this.src), w, h, t, focus);
    if (ok && this.motes) motes(ctx, w, h, id.length * 131, Math.round(w / 40), this.motes, t);
  },
});

export const WALLPAPERS: Wallpaper[] = [
  mk('key-art', 'Carve A New Path', 'Official key art — World of Warcraft: Forever', 'key-art-wide.jpg', 'Key Art', 'rgba(255,220,150,A)', [0.5, 0.4]),
  mk('masthead', 'Adventure. Forever.', 'Official key art — the road to the tower', 'masthead-art.jpg', 'Key Art', 'rgba(255,220,150,A)', [0.5, 0.35]),
  mk('skyborne-bg', 'Gales Guide You', 'The Skyborne, above Zephras Isle', 'skyborne-bg.jpg', 'Key Art', 'rgba(200,240,255,A)', [0.55, 0.3]),
  mk('cinematic', 'The Long Road', 'From the announcement cinematic', 'cinematic.jpg', 'Key Art', 'rgba(255,240,200,A)'),
  mk('prideclaw', 'Cerulean Prideclaw', 'Warcraft Forever Collection mount', 'collection.jpg', 'Key Art', 'rgba(150,220,255,A)'),
  mk('zephras', 'Zephras Isle', 'Skyborne starting zone · Lv 1–12', 'zephras-isle.jpg', 'New Zones', 'rgba(200,240,255,A)'),
  mk('riverglades', 'The Riverglades', 'Frontier rivers and ruined keeps · Lv 30s–40s', 'riverglades.jpg', 'New Zones'),
  mk('riverglades-harbor', 'Riverglades Harbor', 'Trade routes on the water', 'riverglades-harbor.jpg', 'New Zones'),
  mk('riverglades-ruins', 'Ruins at Dusk', 'The Riverglades, old keeps', 'riverglades-ruins.jpg', 'New Zones', 'rgba(255,200,180,A)'),
  mk('riverglades-road', 'The Trade Road', 'Riverglades caravans', 'riverglades-road.jpg', 'New Zones'),
  mk('hyjal', 'Mount Hyjal', 'The mountain after the Third War · Lv 40s–50s', 'hyjal-summit.jpg', 'New Zones', 'rgba(255,240,200,A)'),
  mk('shendralas', "Shen'dralas", 'A hidden hollow between Mulgore and Desolace', 'shendralas.jpg', 'New Zones', 'rgba(200,160,255,A)'),
  mk('moonlit', 'Moonlit Grove', 'New lighting in the old forests', 'moonlit-grove.jpg', 'New Zones', 'rgba(180,220,255,A)'),
  mk('darkspear', 'Darkspear Islands', '15 vs 15 battleground', 'darkspear-zeppelin.jpg', 'Dungeons & Raids', 'rgba(255,220,150,A)'),
  mk('pirates', 'Pirates of the Drowned Coast', 'Naga, pirates, and a city under the tide', 'darkspear-pirates.jpg', 'Dungeons & Raids', 'rgba(255,200,120,A)'),
  mk('thanes', 'Hall of Thanes', 'Beneath Ironforge', 'hall-of-thanes.jpg', 'Dungeons & Raids', 'rgba(255,160,80,A)'),
  mk('whelgar', "Whelgar's Excavation", 'Bones in the Wetlands', 'whelgar-dusk.jpg', 'Dungeons & Raids', 'rgba(200,180,255,A)'),
  mk('drowned', 'The Drowned City', 'A city under the tide', 'drowned-city.jpg', 'Dungeons & Raids', 'rgba(150,220,255,A)'),
  mk('alcaz', 'Alcaz Prison', 'The island prison opens its cells', 'alcaz-jungle.jpg', 'Dungeons & Raids', 'rgba(200,255,180,A)'),
  mk('kroldok', "Krol'dok Stronghold", 'A fortress that did not surrender', 'kroldok.jpg', 'Dungeons & Raids', 'rgba(255,200,120,A)'),
  mk('blackmaw', 'Blackmaw Hold', 'Corruption below', 'blackmaw-hold.jpg', 'Dungeons & Raids', 'rgba(120,255,160,A)'),
  mk('mulgore', 'Mulgore', 'The plains in a new light', 'mulgore.jpg', 'Azeroth Reborn', 'rgba(255,230,170,A)'),
  mk('barrens', 'The Barrens', 'Sunset over the savannah', 'barrens.jpg', 'Azeroth Reborn', 'rgba(255,200,120,A)'),
  mk('ashenvale', 'Ashenvale', 'Moonlight through the canopy', 'ashenvale-1.jpg', 'Azeroth Reborn', 'rgba(200,160,255,A)'),
  mk('ashenvale-2', 'Ashenvale Deep', 'Purple dusk', 'ashenvale-2.jpg', 'Azeroth Reborn', 'rgba(200,160,255,A)'),
  mk('ashenvale-sun', 'Ashenvale Sunbeams', 'Global illumination in the old forest', 'ashenvale-sunbeams.jpg', 'Azeroth Reborn', 'rgba(255,255,220,A)'),
  mk('felwood', 'Felwood', 'Corruption, in volumetric green', 'felwood.jpg', 'Azeroth Reborn', 'rgba(120,255,120,A)'),
  mk('darkshore', 'Darkshore', 'Water mist on the coast', 'darkshore.jpg', 'Azeroth Reborn', 'rgba(220,230,240,A)'),
  mk('dustwallow', 'Dustwallow Marsh', 'Real-time shadows in the swamp', 'dustwallow.jpg', 'Azeroth Reborn', 'rgba(200,220,180,A)'),
  mk('tirisfal', 'Tirisfal Glades', 'Fog over Lordaeron', 'tirisfal-fog.jpg', 'Azeroth Reborn', 'rgba(120,255,160,A)'),
];

export class WallpaperEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private raf = 0; private t0 = performance.now();
  private cur: Wallpaper;
  animate = store.get('wall.animate', true);
  private seen = new Set<string>(store.get<string[]>('wall.seen', []));
  constructor(host: HTMLElement) {
    this.canvas = document.createElement('canvas'); host.append(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
    const id = store.get('wall.id', 'key-art');
    this.cur = WALLPAPERS.find(x => x.id === id) ?? WALLPAPERS[0];
    this.seen.add(this.cur.id);
    this.resize(); addEventListener('resize', () => this.resize());
    const im = loadImage(this.cur.src); im.addEventListener('load', () => this.render(), { once: true });
    WALLPAPERS.slice(0, 6).forEach(w => loadImage(w.src)); // warm the first few
    this.loop();
  }
  get current() { return this.cur; }
  set(id: string) {
    const wp = WALLPAPERS.find(x => x.id === id); if (!wp) return;
    this.cur = wp; store.set('wall.id', id);
    this.seen.add(id); store.set('wall.seen', [...this.seen]);
    if (this.seen.size >= WALLPAPERS.length) bus.emit('wall:all-seen');
    bus.emit('wall:change', wp);
    const im = loadImage(wp.src); if (!im.complete) im.addEventListener('load', () => this.render(), { once: true });
    this.render();
  }
  next() { const i = WALLPAPERS.findIndex(x => x.id === this.cur.id); this.set(WALLPAPERS[(i + 1) % WALLPAPERS.length].id); }
  setAnimate(v: boolean) { this.animate = v; store.set('wall.animate', v); if (v) this.loop(); else { cancelAnimationFrame(this.raf); this.render(); } }
  private resize() { const dpr = Math.min(devicePixelRatio || 1, 1.5); this.canvas.width = innerWidth * dpr; this.canvas.height = innerHeight * dpr; this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.render(); }
  private render() { const t = this.animate ? (performance.now() - this.t0) / 1000 : 0; this.cur.draw(this.ctx, innerWidth, innerHeight, t); }
  private loop = () => { if (!this.animate) return; this.render(); this.raf = requestAnimationFrame(() => setTimeout(this.loop, 1000 / 24)); };
}
