/**
 * Shared Battle.net proxy logic used by the Vite dev server, the Vercel
 * function and the Electron main process. Holds the client secret server-side,
 * exchanges it for a token (cached), and forwards read-only GET requests.
 */
const tokens = new Map<string, { token: string; exp: number }>();

export interface Creds { id?: string; secret?: string }

async function getToken(region: string, creds: Creds): Promise<string> {
  const key = region + ':' + creds.id;
  const cached = tokens.get(key); if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const host = region === 'cn' ? 'https://oauth.battlenet.com.cn' : 'https://oauth.battle.net';
  const res = await fetch(host + '/token', { method: 'POST', headers: { authorization: 'Basic ' + Buffer.from(`${creds.id}:${creds.secret}`).toString('base64'), 'content-type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' });
  if (!res.ok) throw new Error(`Battle.net OAuth refused the client (${res.status}). Check Client ID / Secret.`);
  const j = await res.json() as { access_token: string; expires_in: number };
  tokens.set(key, { token: j.access_token, exp: Date.now() + j.expires_in * 1000 });
  return j.access_token;
}

export async function bnetHandler(q: Record<string, string>, creds: Creds): Promise<{ status: number; body: any }> {
  try {
    const region = (q.region ?? 'eu').toLowerCase(); const path = q.path ?? ''; const namespace = q.namespace ?? `profile-${region}`; const locale = q.locale ?? 'en_US';
    if (!['us', 'eu', 'kr', 'tw', 'cn'].includes(region)) return { status: 400, body: { error: 'Unknown region' } };
    if (!/^\/(profile|data)\/wow\/[A-Za-z0-9\-_/%.']+$/.test(path)) return { status: 400, body: { error: 'Path must be a /profile/wow or /data/wow route' } };
    if (!creds.id || !creds.secret) return { status: 401, body: { error: 'No Battle.net API client configured. Add BNET_CLIENT_ID / BNET_CLIENT_SECRET to .env.local, or enter them in Settings → Battle.net.' } };
    const token = await getToken(region, creds);
    const host = region === 'cn' ? 'https://gateway.battlenet.com.cn' : `https://${region}.api.blizzard.com`;
    const url = `${host}${path}?namespace=${encodeURIComponent(namespace)}&locale=${encodeURIComponent(locale)}`;
    const res = await fetch(url, { headers: { authorization: 'Bearer ' + token } });
    const text = await res.text(); let body: any; try { body = JSON.parse(text); } catch { body = { raw: text }; }
    if (!res.ok) return { status: res.status, body: { error: body?.detail ?? body?.error ?? `Blizzard answered ${res.status}`, ...body } };
    return { status: 200, body };
  } catch (e: any) { return { status: 502, body: { error: e?.message ?? String(e) } }; }
}
