/**
 * Window manager: drag, resize, focus, minimize, maximize, snapping, persistence.
 */
import { h, bus, store, type AppDef, type AppContext } from './kernel';
import { icon, glyph } from './icons';
import { sound } from './sound';
import { bump, achievements } from './achievements';
import { hideTooltip } from './ui';

let z = 20;
const wins: Win[] = [];
let openedThisSession = 0;

export class Win {
  id: string; appId: string; el: HTMLElement; body: HTMLElement; tt: HTMLElement; sb: HTMLElement;
  x = 80; y = 60; w = 720; h = 480;
  minimized = false; maximized = false;
  private restore = { x: 0, y: 0, w: 0, h: 0 };
  private closers: (() => void)[] = [];
  def: AppDef;

  constructor(def: AppDef, args: any) {
    this.def = def; this.appId = def.id; this.id = def.id + ':' + Math.random().toString(36).slice(2, 7);
    this.w = def.width ?? 720; this.h = def.height ?? 480;
    const saved = store.get<{ x: number; y: number; w: number; h: number } | null>('win.' + def.id, null);
    const cascade = (wins.length % 8) * 28;
    const maxW = innerWidth - 24, maxH = innerHeight - 64 - 24;
    if (saved) { this.x = saved.x; this.y = saved.y; this.w = Math.min(saved.w, maxW); this.h = Math.min(saved.h, maxH); }
    else { this.w = Math.min(this.w, maxW); this.h = Math.min(this.h, maxH); this.x = Math.max(12, (innerWidth - this.w) / 2 + cascade - 60); this.y = Math.max(12, (innerHeight - 64 - this.h) / 2 + cascade - 60); }
    this.x = Math.min(Math.max(0, this.x), innerWidth - 120); this.y = Math.min(Math.max(0, this.y), innerHeight - 100);

    this.tt = h('div', { class: 'tt' }, def.name);
    const ctl = h('div', { class: 'ctl' },
      h('button', { title: 'Minimize', html: glyph.min, onclick: (e: Event) => { e.stopPropagation(); this.minimize(); } }),
      h('button', { title: 'Maximize', class: 'mx', html: glyph.max, onclick: (e: Event) => { e.stopPropagation(); this.toggleMax(); } }),
      h('button', { title: 'Close', class: 'x', html: glyph.close, onclick: (e: Event) => { e.stopPropagation(); this.close(); } }));
    const tb = h('div', { class: 'tb' }, h('div', { class: 'ti', html: icon(def.icon) }), this.tt, ctl);
    this.body = h('div', { class: 'body' + (def.noScroll ? ' noscroll' : '') });
    this.sb = h('div', { class: 'sb', style: { display: 'none' } });
    this.el = h('div', { class: 'win', dataset: { app: def.id } }, tb, this.body, this.sb,
      h('div', { class: 'rs n' }), h('div', { class: 'rs e' }), h('div', { class: 'rs s' }), h('div', { class: 'rs w' }), h('div', { class: 'rs se' }));
    this.apply();
    this.el.addEventListener('mousedown', () => this.focus());
    this.drag(tb);
    tb.addEventListener('dblclick', (e) => { if ((e.target as HTMLElement).closest('.ctl')) return; this.toggleMax(); });
    this.resizers();

    document.querySelector('.desktop')!.append(this.el);
    wins.push(this);
    this.focus();
    sound.open();
    openedThisSession++;
    if (openedThisSession >= 10) achievements.unlock('open-10');
    if (wins.length >= 40) achievements.unlock('insane');
    bus.emit('win:open', this);

    const ctx: AppContext = {
      id: this.id, body: this.body, win: this, args,
      setTitle: (t) => { this.tt.textContent = t; bus.emit('win:title', this); },
      setStatus: (html) => { this.sb.style.display = html ? '' : 'none'; this.sb.innerHTML = html; },
      close: () => this.close(),
      onClose: (fn) => this.closers.push(fn),
    };
    try { const c = def.mount(ctx); if (typeof c === 'function') this.closers.push(c); }
    catch (e) { console.error(e); this.body.innerHTML = `<div class="pad"><h3>The spell fizzled.</h3><pre class="dim small">${String(e)}</pre></div>`; }
  }

  private apply() {
    const s = this.el.style;
    if (this.maximized) { s.left = '0'; s.top = '0'; s.width = '100%'; s.height = `calc(100% - var(--taskbar-h))`; }
    else { s.left = this.x + 'px'; s.top = this.y + 'px'; s.width = this.w + 'px'; s.height = this.h + 'px'; }
    this.el.classList.toggle('max', this.maximized);
    const mx = this.el.querySelector('.mx') as HTMLElement; if (mx) mx.innerHTML = this.maximized ? glyph.restore : glyph.max;
  }
  private persist() { if (!this.maximized) store.set('win.' + this.appId, { x: this.x, y: this.y, w: this.w, h: this.h }); }

  focus() {
    wins.forEach(w => w.el.classList.remove('focus'));
    this.el.classList.add('focus'); this.el.style.zIndex = String(++z);
    if (this.minimized) { this.minimized = false; this.el.classList.remove('min'); }
    bus.emit('win:focus', this);
  }
  minimize() { this.minimized = true; this.el.classList.add('min'); hideTooltip(); bus.emit('win:min', this); const next = wm.list().filter(w => !w.minimized).sort((a, b) => +b.el.style.zIndex - +a.el.style.zIndex)[0]; next?.focus(); }
  toggleMax() {
    if (!this.maximized) { this.restore = { x: this.x, y: this.y, w: this.w, h: this.h }; this.maximized = true; }
    else { this.maximized = false; Object.assign(this, this.restore); }
    this.apply(); sound.click(); bus.emit('win:max', this);
  }
  close() {
    this.closers.forEach(f => { try { f(); } catch {} });
    this.el.classList.add('closing'); hideTooltip();
    setTimeout(() => this.el.remove(), 170);
    const i = wins.indexOf(this); if (i >= 0) wins.splice(i, 1);
    sound.close(); bus.emit('win:close', this);
    const next = wins.filter(w => !w.minimized).sort((a, b) => +b.el.style.zIndex - +a.el.style.zIndex)[0]; next?.focus();
  }
  setTitle(t: string) { this.tt.textContent = t; }
  moveTo(x: number, y: number) { this.x = x; this.y = y; this.apply(); this.persist(); }
  resizeTo(w: number, h: number) { this.w = Math.max(this.def.minWidth ?? 320, w); this.h = Math.max(this.def.minHeight ?? 200, h); this.apply(); this.persist(); }

  private drag(handle: HTMLElement) {
    handle.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest('.ctl')) return;
      if (this.maximized && e.detail > 1) return; // let dblclick toggle maximize
      e.preventDefault();
      let sx = e.clientX, sy = e.clientY;
      if (this.maximized) { // un-maximize while dragging
        const ratio = e.clientX / innerWidth; this.maximized = false; Object.assign(this, this.restore); this.x = e.clientX - this.w * ratio; this.y = e.clientY - 16; this.apply();
      }
      const ox = this.x, oy = this.y;
      const snap = h('div', { style: { position: 'absolute', border: '2px dashed rgba(233,200,116,.6)', background: 'rgba(233,200,116,.06)', zIndex: '9', pointerEvents: 'none', display: 'none' } });
      document.querySelector('.desktop')!.append(snap);
      let edge: 'l' | 'r' | 't' | null = null;
      const mv = (ev: MouseEvent) => {
        this.x = Math.min(Math.max(ox + ev.clientX - sx, -this.w + 80), innerWidth - 80); this.y = Math.min(Math.max(0, oy + ev.clientY - sy), innerHeight - 64 - 34); this.apply();
        edge = ev.clientX <= 4 ? 'l' : ev.clientX >= innerWidth - 4 ? 'r' : ev.clientY <= 2 ? 't' : null;
        if (edge) { snap.style.display = ''; const half = innerWidth / 2; const H = innerHeight - 64; Object.assign(snap.style, edge === 'l' ? { left: '0', top: '0', width: half + 'px', height: H + 'px' } : edge === 'r' ? { left: half + 'px', top: '0', width: half + 'px', height: H + 'px' } : { left: '0', top: '0', width: '100%', height: H + 'px' }); }
        else snap.style.display = 'none';
      };
      const up = () => {
        removeEventListener('mousemove', mv); removeEventListener('mouseup', up); snap.remove();
        if (edge === 't') { this.maximized = false; this.toggleMax(); }
        else if (edge) { this.maximized = false; this.x = edge === 'l' ? 0 : innerWidth / 2; this.y = 0; this.w = innerWidth / 2; this.h = innerHeight - 64; this.apply(); }
        this.persist();
      };
      addEventListener('mousemove', mv); addEventListener('mouseup', up);
    });
  }
  private resizers() {
    this.el.querySelectorAll<HTMLElement>('.rs').forEach(rs => {
      rs.addEventListener('mousedown', (e) => {
        if (this.maximized) return; e.preventDefault(); e.stopPropagation(); this.focus();
        const dir = rs.classList[1]; const sx = e.clientX, sy = e.clientY; const o = { x: this.x, y: this.y, w: this.w, h: this.h };
        const minW = this.def.minWidth ?? 320, minH = this.def.minHeight ?? 200;
        const mv = (ev: MouseEvent) => {
          const dx = ev.clientX - sx, dy = ev.clientY - sy;
          if (dir.includes('e')) this.w = Math.max(minW, o.w + dx);
          if (dir.includes('s')) this.h = Math.max(minH, o.h + dy);
          if (dir === 'w') { const nw = Math.max(minW, o.w - dx); this.x = o.x + (o.w - nw); this.w = nw; }
          if (dir === 'n') { const nh = Math.min(o.y + o.h, Math.max(minH, o.h - dy)); this.y = Math.max(0, o.y + (o.h - nh)); this.h = nh; }
          this.apply();
        };
        const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); this.persist(); bus.emit('win:resize', this); };
        addEventListener('mousemove', mv); addEventListener('mouseup', up);
      });
    });
  }
}

export const wm = {
  open(def: AppDef, args?: any): Win {
    if (def.singleton !== false) { const ex = wins.find(w => w.appId === def.id); if (ex) { ex.focus(); if (args !== undefined) bus.emit('app:args', { win: ex, args }); return ex; } }
    bump('open-total', 1000, 'open-10');
    return new Win(def, args);
  },
  list(): Win[] { return [...wins]; },
  focused(): Win | undefined { return wins.filter(w => !w.minimized).sort((a, b) => +b.el.style.zIndex - +a.el.style.zIndex)[0]; },
  byApp(id: string) { return wins.filter(w => w.appId === id); },
  closeAll() { [...wins].forEach(w => w.close()); openedThisSession = 0; },
  minimizeAll() { wins.forEach(w => w.minimize()); },
  cascade() { wins.forEach((w, i) => { w.maximized = false; w.moveTo(40 + i * 30, 30 + i * 30); }); },
};
