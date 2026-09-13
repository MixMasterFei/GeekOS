/**
 * GeekOS kernel: event bus, persistent store, app registry, user session.
 */

export type Handler = (...args: any[]) => void;

export class Bus {
  private map = new Map<string, Set<Handler>>();
  on(ev: string, fn: Handler): () => void {
    if (!this.map.has(ev)) this.map.set(ev, new Set());
    this.map.get(ev)!.add(fn);
    return () => this.map.get(ev)?.delete(fn);
  }
  once(ev: string, fn: Handler) { const off = this.on(ev, (...a) => { off(); fn(...a); }); return off; }
  emit(ev: string, ...args: any[]) { this.map.get(ev)?.forEach(fn => { try { fn(...args); } catch (e) { console.error(`[bus:${ev}]`, e); } }); }
}

/** Namespaced JSON store over localStorage. */
export const store = {
  prefix: 'geekos:',
  get<T>(key: string, fallback: T): T {
    try { const raw = localStorage.getItem(this.prefix + key); return raw == null ? fallback : (JSON.parse(raw) as T); } catch { return fallback; }
  },
  set(key: string, value: unknown) { try { localStorage.setItem(this.prefix + key, JSON.stringify(value)); } catch { /* quota */ } },
  del(key: string) { localStorage.removeItem(this.prefix + key); },
  keys(): string[] { return Object.keys(localStorage).filter(k => k.startsWith(this.prefix)).map(k => k.slice(this.prefix.length)); },
  wipe() { this.keys().forEach(k => this.del(k)); },
};

export type Faction = 'horde' | 'alliance' | 'neutral';
export interface User {
  name: string;
  race: string;
  cls: string;
  faction: Faction;
  level: number;
  xp: number;
  title: string;
  created: number;
  played: number; // seconds
  gold: number;
}

export type AppCategory = 'adventure' | 'tools' | 'social' | 'games' | 'system';

export interface AppContext {
  id: string;
  body: HTMLElement;
  win: import('./wm').Win;
  args: any;
  setTitle(t: string): void;
  setStatus(html: string): void;
  close(): void;
  onClose(fn: () => void): void;
}

export interface AppDef {
  id: string;
  name: string;
  subtitle?: string;
  icon: string;             // key into icons
  category: AppCategory;
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  singleton?: boolean;
  hidden?: boolean;         // not shown in menus (easter eggs / internal)
  desktop?: boolean;        // pinned as desktop icon
  pinned?: boolean;         // pinned to action bar
  hotkey?: string;
  noScroll?: boolean;
  mount(ctx: AppContext): void | (() => void);
}

export const bus = new Bus();
export const apps = new Map<string, AppDef>();
export function registerApp(def: AppDef) { apps.set(def.id, def); }
export function appList(): AppDef[] { return [...apps.values()]; }

export const session = {
  user: null as User | null,
  bootedAt: Date.now(),
  frozen: false, // set before a reload that must not re-save the in-memory user (wipe, import)
  get playedTotal(): number { const u = this.user; return u ? u.played + Math.floor((Date.now() - this.bootedAt) / 1000) : 0; },
  save() { if (this.frozen) return; if (this.user) { this.user.played = this.playedTotal; this.bootedAt = Date.now(); store.set('user', this.user); const chars = store.get<User[]>('characters', []); const i = store.get<number>('lastChar', 0); if (chars[i]) { chars[i] = this.user; store.set('characters', chars); } } },
};

/** XP curve loosely inspired by the old 1–60 curve; the OS levels you up as you use it. */
export function xpToLevel(level: number): number { return Math.floor(40 * level + 8 * level * level); }
export function grantXp(amount: number, reason?: string) {
  const u = session.user; if (!u) return;
  u.xp += amount;
  let leveled = false;
  while (u.level < 60 && u.xp >= xpToLevel(u.level)) { u.xp -= xpToLevel(u.level); u.level++; leveled = true; }
  bus.emit('xp', { amount, reason, level: u.level, xp: u.xp });
  if (leveled) bus.emit('levelup', u.level);
  session.save();
}

export const VERSION = '1.0.1';
export const BUILD = '60.0.0 (Nov 4, 2026)';
export const LAUNCH_UTC = Date.UTC(2026, 10, 4, 23, 0, 0); // Nov 4 2026, 3:00 PM PST (UTC-8) => 23:00 UTC

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, any> = {}, ...children: (Node | string | null | undefined | false)[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else el.setAttribute(k, String(v));
  }
  for (const c of children) { if (c == null || c === false) continue; el.append(typeof c === 'string' ? document.createTextNode(c) : c); }
  return el;
}
export const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export const pad2 = (n: number) => String(n).padStart(2, '0');
export const fmtTime = (d = new Date()) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
export const fmtDate = (d = new Date()) => d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
export const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
export const uid = () => Math.random().toString(36).slice(2, 10);
export const fmtDuration = (s: number) => { const d = Math.floor(s / 86400), hh = Math.floor((s % 86400) / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60; return (d ? `${d} day${d > 1 ? 's' : ''}, ` : '') + `${hh} hour${hh !== 1 ? 's' : ''}, ${mm} minute${mm !== 1 ? 's' : ''}, ${ss} second${ss !== 1 ? 's' : ''}`; };
