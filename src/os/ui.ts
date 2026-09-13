/**
 * Shared UI primitives: tooltips, context menus, modal dialogs, toasts.
 */
import { h, esc, bus } from './kernel';
import { icon, glyph } from './icons';
import { sound } from './sound';

// ---------- Tooltip ----------
let tipEl: HTMLElement | null = null;
function tip(): HTMLElement {
  if (!tipEl) { tipEl = h('div', { class: 'tooltip' }); document.body.append(tipEl); }
  return tipEl;
}
export interface TipData { name: string; sub?: string; lines?: string[]; flavor?: string; quality?: string; bind?: string; }
export function bindTooltip(el: HTMLElement, data: TipData | (() => TipData)) {
  let raf = 0;
  const show = (e: MouseEvent) => {
    const d = typeof data === 'function' ? data() : data;
    const t = tip();
    t.innerHTML = `<div class="t-name ${d.quality ? 'q-' + d.quality : ''}">${esc(d.name)}</div>` +
      (d.bind ? `<div class="t-bind">${esc(d.bind)}</div>` : '') +
      (d.sub ? `<div class="t-sub">${esc(d.sub)}</div>` : '') +
      (d.lines ?? []).map(l => `<div>${l}</div>`).join('') +
      (d.flavor ? `<div class="t-flavor">"${esc(d.flavor)}"</div>` : '');
    t.classList.add('show');
    move(e);
  };
  const move = (e: MouseEvent) => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const t = tip(); const r = t.getBoundingClientRect();
      let x = e.clientX + 16, y = e.clientY + 18;
      if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 12;
      if (y + r.height > innerHeight - 8) y = e.clientY - r.height - 12;
      t.style.left = x + 'px'; t.style.top = y + 'px';
    });
  };
  const hide = () => tip().classList.remove('show');
  el.addEventListener('mouseenter', show);
  el.addEventListener('mousemove', move);
  el.addEventListener('mouseleave', hide);
  el.addEventListener('mousedown', hide);
}
export function hideTooltip() { tipEl?.classList.remove('show'); }

// ---------- Context menu ----------
export interface MenuItem { label?: string; icon?: string; key?: string; disabled?: boolean; sep?: boolean; action?: () => void; }
let ctxEl: HTMLElement | null = null;
export function closeContextMenu() { ctxEl?.remove(); ctxEl = null; }
export function contextMenu(x: number, y: number, items: MenuItem[]) {
  closeContextMenu();
  const el = h('div', { class: 'ctx frame' });
  for (const it of items) {
    if (it.sep) { el.append(h('div', { class: 'sep' })); continue; }
    const row = h('div', { class: 'it' + (it.disabled ? ' dis' : '') },
      h('span', { html: it.icon ? (glyph as any)[it.icon] ?? '' : '' }),
      h('span', {}, it.label ?? ''),
      it.key ? h('span', { class: 'k' }, it.key) : null);
    row.addEventListener('click', () => { closeContextMenu(); sound.click(); it.action?.(); });
    el.append(row);
  }
  document.body.append(el);
  const r = el.getBoundingClientRect();
  el.style.left = Math.min(x, innerWidth - r.width - 6) + 'px';
  el.style.top = Math.min(y, innerHeight - r.height - 6) + 'px';
  ctxEl = el;
  setTimeout(() => {
    const off = (e: Event) => { if (!el.contains(e.target as Node)) { closeContextMenu(); document.removeEventListener('mousedown', off); document.removeEventListener('keydown', off); } };
    document.addEventListener('mousedown', off); document.addEventListener('keydown', off);
  });
}

// ---------- Modal dialog ----------
export interface DialogOpts { title: string; message?: string; html?: string; buttons?: { label: string; kind?: 'primary' | 'gold' | 'danger' | 'ghost'; value: any }[]; input?: { placeholder?: string; value?: string }; }
const openDialogs = new Map<HTMLElement, { owner: Element | null; kill: () => void }>();
bus.on('win:close', (w: any) => { for (const [el, d] of openDialogs) if (d.owner && d.owner === w?.el) { d.kill(); el.remove(); openDialogs.delete(el); } });
export function dialog(opts: DialogOpts): Promise<any> {
  return new Promise(resolve => {
    const bg = h('div', { class: 'modal-bg' });
    const owner = document.querySelector('.win.focus');
    openDialogs.set(bg, { owner, kill: () => resolve(null) });
    const inputEl = opts.input ? h('input', { class: 'input', placeholder: opts.input.placeholder ?? '', value: opts.input.value ?? '' }) : null;
    const acts = h('div', { class: 'acts' });
    const done = (v: any) => { openDialogs.delete(bg); bg.remove(); resolve(inputEl && v !== null && v !== false ? (v === true ? inputEl.value : v) : v); };
    const buttons = opts.buttons ?? [{ label: 'Okay', kind: 'primary', value: true }];
    for (const b of buttons) {
      const btn = h('button', { class: 'btn ' + (b.kind ?? ''), onclick: () => { sound.click(); done(b.value); } }, b.label);
      acts.append(btn);
    }
    const m = h('div', { class: 'modal frame' },
      h('h3', {}, opts.title),
      opts.message ? h('p', {}, opts.message) : null,
      opts.html ? h('div', { html: opts.html, style: { marginBottom: '14px' } }) : null,
      inputEl ? h('div', { style: { marginBottom: '14px' } }, inputEl) : null,
      acts);
    bg.append(m);
    document.getElementById('os')!.append(bg);
    bg.addEventListener('keydown', e => { if (e.key === 'Escape') done(null); if (e.key === 'Enter' && inputEl) done(true); });
    setTimeout(() => (inputEl ?? (acts.firstElementChild as HTMLElement))?.focus(), 30);
  });
}
export const alert = (title: string, message: string) => dialog({ title, message });
export const confirm = (title: string, message: string, yes = 'Accept', no = 'Decline') =>
  dialog({ title, message, buttons: [{ label: yes, kind: 'primary', value: true }, { label: no, kind: 'ghost', value: false }] });
export const prompt = (title: string, placeholder = '', value = '') =>
  dialog({ title, input: { placeholder, value }, buttons: [{ label: 'Accept', kind: 'primary', value: true }, { label: 'Cancel', kind: 'ghost', value: null }] });

// ---------- Toasts ----------
let toastRoot: HTMLElement | null = null;
export function notify(title: string, message: string, iconName = 'mail', opts: { timeout?: number; onClick?: () => void; sound?: boolean } = {}) {
  if (!toastRoot || !toastRoot.isConnected) { toastRoot = h('div', { class: 'toasts' }); document.getElementById('os')!.append(toastRoot); }
  const t = h('div', { class: 'toast frame' },
    h('div', { class: 'ti', html: icon(iconName) }),
    h('div', { class: 'grow' }, h('div', { class: 'h' }, title), h('div', { class: 'm', html: message })));
  t.addEventListener('click', () => { opts.onClick?.(); kill(); });
  const kill = () => { t.classList.add('out'); setTimeout(() => t.remove(), 400); };
  toastRoot.append(t);
  if (opts.sound !== false) sound.mail();
  setTimeout(kill, opts.timeout ?? 6000);
  bus.emit('notify', { title, message });
}

/** Big centered "Achievement Earned" banner. */
export function achievementBanner(name: string, desc: string, points: number, iconName = 'achievements') {
  const el = h('div', { class: 'ach' },
    h('div', { class: 'shield', html: icon(iconName) }),
    h('div', {}, h('div', { class: 'k' }, 'ACHIEVEMENT EARNED'), h('div', { class: 'n' }, name), h('div', { class: 'd' }, desc)),
    h('div', { class: 'pts' }, String(points)));
  document.getElementById('os')!.append(el);
  sound.achievement();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 700); }, 4600);
}

/** Small helper: make a labelled section header with ornament. */
export function sectionHeader(text: string, sub?: string): HTMLElement {
  return h('div', { style: { textAlign: 'center', marginBottom: '8px' } },
    h('div', { class: 'eyebrow' }, text), sub ? h('div', { class: 'dim small' }, sub) : null);
}
