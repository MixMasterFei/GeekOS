/**
 * Battle.net API client. The client secret never leaves the user's machine
 * except to the GeekOS proxy the user runs themselves (Electron main process,
 * the Vite dev server middleware, or their own Vercel deployment).
 */
import { store } from './kernel';

export interface BnetConfig { region: string; clientId?: string; clientSecret?: string; }
export const REGIONS = [
  { id: 'us', label: 'Americas (US)', locale: 'en_US' }, { id: 'eu', label: 'Europe (EU)', locale: 'en_GB' },
  { id: 'kr', label: 'Korea (KR)', locale: 'ko_KR' }, { id: 'tw', label: 'Taiwan (TW)', locale: 'zh_TW' },
];
export const VERSIONS = [
  { id: 'retail', label: 'Modern WoW', ns: 'profile-{r}' },
  { id: 'classic', label: 'Classic (Anniversary / progression)', ns: 'profile-classic-{r}' },
  { id: 'classic1x', label: 'Classic Era', ns: 'profile-classic1x-{r}' },
  { id: 'forever', label: 'WoW: Forever (namespace unannounced)', ns: 'profile-forever-{r}' },
];

declare global { interface Window { geekos?: { bnet?: (opts: { region: string; path: string; namespace: string; locale?: string; clientId?: string; clientSecret?: string }) => Promise<any>; isElectron?: boolean; version?: string; checkUpdates?: () => Promise<any>; onUpdate?: (fn: (e: any) => void) => void; quit?: () => void } } }

export const bnetConfig = (): BnetConfig => store.get<BnetConfig>('bnet', { region: 'eu' });
export const saveBnetConfig = (c: BnetConfig) => store.set('bnet', c);
export const hasBackend = () => !!window.geekos?.bnet || !!(import.meta as any).env?.DEV || location.hostname.endsWith('vercel.app') || location.hostname !== 'localhost' && location.protocol.startsWith('http');

export async function bnet(path: string, version = 'retail', extra: Record<string, string> = {}): Promise<any> {
  const cfg = bnetConfig(); const region = cfg.region || 'eu'; const ver = VERSIONS.find(v => v.id === version) ?? VERSIONS[0];
  const namespace = ver.ns.replace('{r}', region); const locale = REGIONS.find(r => r.id === region)?.locale ?? 'en_US';
  if (window.geekos?.bnet) return window.geekos.bnet({ region, path, namespace, locale, clientId: cfg.clientId, clientSecret: cfg.clientSecret });
  const q = new URLSearchParams({ region, path, namespace, locale, ...extra });
  const res = await fetch('/api/bnet?' + q.toString(), { headers: cfg.clientId ? { 'x-bnet-id': cfg.clientId, 'x-bnet-secret': cfg.clientSecret ?? '' } : {} });
  if (!res.ok) { let msg = `${res.status} ${res.statusText}`; try { const j = await res.json(); msg = j.error ?? j.detail ?? msg; } catch {} throw new Error(msg); }
  return res.json();
}

export const slug = (s: string) => s.trim().toLowerCase().replace(/'/g, '').replace(/\s+/g, '-');

export interface CharacterSummary { name: string; level: number; race: string; cls: string; faction: 'horde' | 'alliance' | 'neutral'; guild?: string; realm: string; ilvl?: number; achievementPoints?: number; title?: string; spec?: string; avatar?: string; render?: string; lastLogin?: number; equipment: { slot: string; name: string; quality: string; ilvl?: number }[]; }

export async function fetchCharacter(realm: string, name: string, version = 'retail'): Promise<CharacterSummary> {
  const base = `/profile/wow/character/${slug(realm)}/${encodeURIComponent(name.toLowerCase())}`;
  const p = await bnet(base, version);
  const [equip, media] = await Promise.all([bnet(base + '/equipment', version).catch(() => null), bnet(base + '/character-media', version).catch(() => null)]);
  const assets: any[] = media?.assets ?? [];
  return {
    name: p.name, level: p.level, race: p.race?.name ?? '', cls: p.character_class?.name ?? '', faction: (p.faction?.type ?? 'NEUTRAL').toLowerCase(), guild: p.guild?.name, realm: p.realm?.name ?? realm,
    ilvl: p.equipped_item_level ?? p.average_item_level, achievementPoints: p.achievement_points, title: p.active_title?.display_string?.replace('{name}', p.name), spec: p.active_spec?.name,
    avatar: assets.find(a => a.key === 'avatar')?.value ?? media?.avatar_url, render: assets.find(a => a.key === 'main-raw')?.value ?? assets.find(a => a.key === 'main')?.value ?? media?.render_url, lastLogin: p.last_login_timestamp,
    equipment: (equip?.equipped_items ?? []).map((i: any) => ({ slot: i.slot?.name ?? '', name: i.name, quality: (i.quality?.type ?? 'COMMON').toLowerCase(), ilvl: i.level?.value })),
  };
}
