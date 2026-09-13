/**
 * Gnomish Sweeper — minesweeper with gnomish engineering flavour.
 */
import { h, grantXp, store, bus, type AppDef } from '../os/kernel';
import { sound } from '../os/sound';
import { achievements } from '../os/achievements';
import { notify } from '../os/ui';

type Cell = { bomb: boolean; open: boolean; flag: boolean; n: number };
const SIZES = { Apprentice: [9, 9, 10], Journeyman: [16, 16, 40], Artisan: [30, 16, 99] } as const;

export const sweeperApp: AppDef = {
  id: 'sweeper', name: 'Gnomish Sweeper', subtitle: 'Do not step on the bombs', icon: 'sweeper', category: 'games', width: 420, height: 520, noScroll: true,
  mount(ctx) {
    let diff: keyof typeof SIZES = store.get('sweeper.diff', 'Apprentice'); let W = 9, H = 9, B = 10; let grid: Cell[][] = []; let started = false, over = false, timer = 0, secs = 0, flags = 0;
    const board = h('div', { style: { display: 'grid', gap: '2px', margin: '0 auto', userSelect: 'none' } });
    const info = h('div', { class: 'row', style: { padding: '8px 12px', borderBottom: '1px solid var(--gold-700)', background: 'rgba(0,0,0,.25)' } });
    const face = h('button', { class: 'btn gold', style: { fontSize: '16px', padding: '4px 12px' } }, '⚙');
    const bombsEl = h('span', { class: 'display', style: { fontSize: '20px', minWidth: '50px' } }); const timeEl = h('span', { class: 'display', style: { fontSize: '20px', minWidth: '50px', textAlign: 'right' } });
    const sel = h('select', { class: 'input', style: { width: '130px' }, onchange: (e: Event) => { diff = (e.target as HTMLSelectElement).value as any; store.set('sweeper.diff', diff); reset(); } }, ...Object.keys(SIZES).map(k => h('option', { value: k, selected: k === diff || undefined }, k)));
    info.append(bombsEl, h('span', { class: 'grow' }), face, h('span', { class: 'grow' }), timeEl, sel);
    ctx.body.append(info, h('div', { class: 'grow scroll', style: { padding: '12px', display: 'grid', placeItems: 'center' } }, board));
    face.addEventListener('click', reset);

    function reset() {
      [W, H, B] = SIZES[diff]; grid = Array.from({ length: H }, () => Array.from({ length: W }, () => ({ bomb: false, open: false, flag: false, n: 0 })));
      started = false; over = false; secs = 0; flags = 0; clearInterval(timer); face.textContent = '⚙'; ctx.win.resizeTo(Math.max(420, W * 26 + 60), Math.max(520, H * 26 + 140)); render();
    }
    function place(sx: number, sy: number) {
      let n = 0; while (n < B) { const x = Math.floor(Math.random() * W), y = Math.floor(Math.random() * H); if (grid[y][x].bomb || (Math.abs(x - sx) <= 1 && Math.abs(y - sy) <= 1)) continue; grid[y][x].bomb = true; n++; }
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (grid[y + dy]?.[x + dx]?.bomb) c++; grid[y][x].n = c; }
    }
    function open(x: number, y: number) {
      const c = grid[y]?.[x]; if (!c || c.open || c.flag || over) return;
      if (!started) { started = true; place(x, y); timer = window.setInterval(() => { secs++; timeEl.textContent = String(secs).padStart(3, '0'); }, 1000); }
      c.open = true;
      if (c.bomb) { over = true; clearInterval(timer); face.textContent = '💥'; sound.boom(); grid.flat().forEach(k => { if (k.bomb) k.open = true; }); notify('Kaboom', 'Gnomish engineering strikes again. Your eyebrows will grow back.', 'sweeper'); render(); return; }
      if (c.n === 0) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) open(x + dx, y + dy);
    }
    function check() { if (over) return; const closed = grid.flat().filter(c => !c.open).length; if (closed === B) { over = true; clearInterval(timer); face.textContent = '🏆'; sound.quest(); grantXp(diff === 'Artisan' ? 150 : diff === 'Journeyman' ? 80 : 40, 'sweeper'); achievements.unlock('sweeper-win'); bus.emit('sweeper:win', diff); const best = store.get<number>('sweeper.best.' + diff, 0); if (!best || secs < best) store.set('sweeper.best.' + diff, secs); notify('Field cleared', `${diff} in ${secs}s. The gnomes are impressed.`, 'sweeper'); } }
    function render() {
      board.style.gridTemplateColumns = `repeat(${W}, 24px)`; board.innerHTML = '';
      bombsEl.textContent = String(B - flags).padStart(3, '0'); timeEl.textContent = String(secs).padStart(3, '0');
      const colors = ['', '#4d8bff', '#1eff00', '#ff4d4d', '#a374ff', '#ff8000', '#3ec7b0', '#fff', '#9d9d9d'];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const c = grid[y][x];
        const el = h('div', { style: { width: '24px', height: '24px', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: '900', fontSize: '13px', cursor: 'pointer', border: '1px solid ' + (c.open ? 'rgba(233,200,116,.15)' : 'var(--gold-700)'), background: c.open ? (c.bomb ? '#6b1111' : 'rgba(0,0,0,.35)') : 'linear-gradient(180deg,#2a4a5a,#142d3a)', boxShadow: c.open ? 'inset 0 1px 3px #000' : 'inset 0 1px 0 rgba(255,255,255,.12)', color: colors[c.n] } },
          c.open ? (c.bomb ? '💣' : c.n ? String(c.n) : '') : c.flag ? '🚩' : '');
        el.addEventListener('click', () => { open(x, y); sound.tick(); check(); render(); });
        el.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); if (c.open || over) return; c.flag = !c.flag; flags += c.flag ? 1 : -1; sound.click(); render(); });
        el.addEventListener('dblclick', () => { if (!c.open || !c.n) return; let f = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (grid[y + dy]?.[x + dx]?.flag) f++; if (f === c.n) { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) open(x + dx, y + dy); check(); render(); } });
        board.append(el);
      }
      const best = store.get<number>('sweeper.best.' + diff, 0);
      ctx.setStatus(`<span>${W}×${H} · ${B} bombs</span><span class="dim">Best ${diff}: ${best ? best + 's' : '—'}</span><span class="dim" style="margin-left:auto">Right-click to flag · double-click to chord</span>`);
    }
    reset();
    return () => clearInterval(timer);
  },
};
