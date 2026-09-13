#!/usr/bin/env node
/**
 * GeekOS content updater.
 * Reads Blizzard's official World of Warcraft news listing (the page embeds full
 * article JSON: title, summary, publish time, header art) and the Forever page,
 * then writes public/data/manifest.json. Run by the GitHub Actions cron
 * (.github/workflows/content.yml) and by `npm run content`.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'public/data/manifest.json');
const UA = { 'user-agent': 'Mozilla/5.0 (GeekOS content updater; +https://github.com/MixMasterFei/GeekOS)', 'accept-language': 'en-US,en;q=0.9' };
const NEWS_URLS = ['https://worldofwarcraft.blizzard.com/en-us/news', 'https://worldofwarcraft.blizzard.com/en-us/news?page=2', 'https://worldofwarcraft.blizzard.com/en-us/news/classic'];
const FOREVER_URL = 'https://worldofwarcraft.blizzard.com/en-us/forever';
const FOREVER_RE = /forever|skyborne|zephras|riverglades|hyjal|classic\+|classic plus|blizzcon|forsaken kingdom/i;

const jstr = (s) => { try { return JSON.parse('"' + s + '"'); } catch { return s; } };

async function fetchText(url) { const r = await fetch(url, { headers: UA, redirect: 'follow' }); if (!r.ok) throw new Error(`${r.status} ${url}`); return r.text(); }

function parseNews(html) {
  const items = [];
  const anchors = [...html.matchAll(/"default_url":"https:\/\/worldofwarcraft\.com\/en-us\/news\/(\d+)"/g)];
  for (let i = 0; i < anchors.length; i++) {
    const id = anchors[i][1]; const at = anchors[i].index; const end = anchors[i + 1]?.index ?? Math.min(html.length, at + 60000);
    const seg = html.slice(at, end); // keys are alphabetical: header, publish, summary, thumbnail, title all follow default_url
    const summaryAt = seg.search(/"summary":"/);
    const summary = seg.match(/"summary":"((?:[^"\\]|\\.)*)"/);
    const title = summaryAt >= 0 ? seg.slice(summaryAt).match(/"title":"((?:[^"\\]|\\.)*)"/) : seg.match(/"title":"((?:[^"\\]|\\.)*)"/);
    const publish = seg.match(/"publish":(\d{12,14})/);
    const header = seg.match(/"header":\{"mediaId":\d+,"url":"(\/\/[^"]+)"/);
    const thumb = seg.match(/"thumbnail":\{"mediaId":\d+,"url":"(\/\/[^"]+)"/);
    if (!title) continue;
    const t = jstr(title[1]);
    items.push({ id, title: t, summary: summary ? jstr(summary[1]).replace(/<[^>]+>/g, '').trim() : '', url: `https://worldofwarcraft.blizzard.com/en-us/news/${id}`, publishedAt: publish ? new Date(+publish[1]).toISOString() : null, header: header ? 'https:' + header[1] : null, thumb: thumb ? 'https:' + thumb[1] : null, forever: FOREVER_RE.test(t) });
  }
  return items;
}

function parseForever(html) {
  // The page is client-rendered; its copy sits in a script JSON blob, so keep script text and decode escapes.
  const text = html.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/\\"/g, '"').replace(/<[^>]+>/g, ' ').replace(/&reg;|®/g, '').replace(/&#\d+;|&\w+;/g, ' ').replace(/\s+/g, ' ');
  const pick = (re) => text.match(re)?.[0]?.trim() ?? null;
  return {
    launchLine: pick(/World of Warcraft: Forever launches on [^.]+\./i) ?? pick(/Forever launches (?:globally )?on [^.]+\./i),
    betaLine: pick(/Forever Beta begins on [^.]+\./i) ?? pick(/Beta begins on [^.]+\./i),
    namesLine: pick(/Early Name Reservation will be available [^.]+\./i),
    collectionLine: pick(/Warcraft Forever Collection will be available through [^.]+\./i),
    heroLine: pick(/World of Warcraft: Forever is coming [^!.]+[!.]/i),
  };
}

async function main() {
  const prev = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
  const pages = await Promise.all(NEWS_URLS.map(u => fetchText(u).catch(e => { console.warn('skip', u, e.message); return ''; })));
  const seen = new Map();
  for (const html of pages) for (const it of parseNews(html)) if (!seen.has(it.id)) seen.set(it.id, it);
  const news = [...seen.values()].sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));
  const foreverHtml = await fetchText(FOREVER_URL).catch(() => '');
  const forever = foreverHtml ? parseForever(foreverHtml) : prev.forever ?? {};
  if (!news.length) throw new Error('No news parsed: Blizzard changed the page markup. Update scripts/update-content.mjs');

  const manifest = {
    version: 1,
    checkedAt: new Date().toISOString(),
    launchUtc: prev.launchUtc ?? '2026-11-04T23:00:00Z',
    news: news.slice(0, 40),
    forever,
    // Curated roadmap events (kept by maintainers / the cloud routine). Empty means "use the app's built-in roadmap".
    events: Array.isArray(prev.events) ? prev.events : [],
    notice: prev.notice ?? null,
  };
  const strip = (o) => JSON.stringify({ ...o, checkedAt: 0 });
  const changed = strip(manifest) !== strip(prev);
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`manifest.json: ${manifest.news.length} news (${manifest.news.filter(n => n.forever).length} Forever) · launch: ${forever.launchLine ?? 'n/a'} · ${changed ? 'CHANGED' : 'unchanged'}`);
  if (process.env.GITHUB_OUTPUT) writeFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`, { flag: 'a' });
}
main().catch(e => { console.error(e); process.exit(1); });
