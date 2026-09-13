/**
 * Settings — vistas, sound, interface, Battle.net connection, data.
 */
import { h, store, bus, VERSION, BUILD, type AppDef } from '../os/kernel';
import { WALLPAPERS } from '../os/wallpaper';
import { wallpaper, launch } from '../os/shell';
import { sound } from '../os/sound';
import { confirm, notify } from '../os/ui';
import { fs } from '../os/fs';
import { achievements } from '../os/achievements';
import { bnetConfig, saveBnetConfig, REGIONS, hasBackend } from '../os/bnet';
import { content, CONTENT_URL } from '../os/content';
import { questEngine } from '../os/quests';

export const settingsApp: AppDef = {
  id: 'settings', name: 'Settings', subtitle: 'Vistas, sound, interface, Battle.net', icon: 'settings', category: 'system', width: 820, height: 580, noScroll: true,
  mount(ctx) {
    let tab: string = ctx.args?.tab ?? 'vista';
    const tabs = h('div', { class: 'tabs' }); const pane = h('div', { class: 'grow scroll', style: { padding: '18px 22px' } });
    ctx.body.append(tabs, pane);
    const TABS = [['vista', 'Vista'], ['sound', 'Sound'], ['interface', 'Interface'], ['bnet', 'Battle.net'], ['updates', 'Updates'], ['data', 'Data'], ['about', 'About']];
    const row = (label: string, ctl: HTMLElement, desc?: string) => h('div', { class: 'row', style: { padding: '10px 0', borderBottom: '1px solid rgba(233,200,116,.1)', gap: '16px' } }, h('div', { class: 'grow' }, h('div', { style: { fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '12.5px', color: 'var(--gold-200)' } }, label), desc ? h('div', { class: 'dim small' }, desc) : null), ctl);
    const toggle = (get: () => boolean, set: (v: boolean) => void) => { const i = h('input', { type: 'checkbox', checked: get() || undefined, style: { width: '18px', height: '18px', accentColor: 'var(--gold-400)' }, onchange: (e: Event) => { set((e.target as HTMLInputElement).checked); sound.click(); } }); return i; };
    const render = () => {
      tabs.innerHTML = ''; TABS.forEach(([id, l]) => tabs.append(h('div', { class: 'tab' + (tab === id ? ' active' : ''), onclick: () => { tab = id; render(); } }, l)));
      pane.innerHTML = '';
      if (tab === 'vista') {
        pane.append(h('div', { class: 'eyebrow', style: { marginBottom: '10px' } }, 'Choose a vista'));
        const grid = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' } });
        for (const wp of WALLPAPERS) { const c = h('img', { src: wp.src, alt: wp.name, loading: 'lazy', draggable: 'false' }); c.style.cssText = 'width:100%;aspect-ratio:16/9;object-fit:cover;display:block'; const card = h('div', { class: 'frame', style: { padding: '4px', cursor: 'pointer', borderColor: wallpaper.current.id === wp.id ? 'var(--gold-300)' : undefined } }, c, h('div', { style: { padding: '6px 6px 4px', fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: '700', color: wallpaper.current.id === wp.id ? 'var(--gold-200)' : 'var(--parch-200)' } }, wp.name), h('div', { class: 'dim small', style: { padding: '0 6px 4px' } }, wp.sub)); card.addEventListener('click', () => { wallpaper.set(wp.id); sound.coin(); render(); }); grid.append(card); }
        pane.append(grid, h('div', { class: 'hr' }), row('Living vista', toggle(() => wallpaper.animate, v => wallpaper.setAnimate(v)), 'Slow drift and floating light motes over the art (24 fps, light on the CPU).'), h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { class: 'btn', onclick: () => launch('gallery') }, 'Open Vistas app')));
      }
      if (tab === 'sound') {
        const vol = h('input', { type: 'range', min: '0', max: '1', step: '0.01', value: String(sound.volume), style: { width: '200px', accentColor: 'var(--gold-400)' }, oninput: (e: Event) => { sound.volume = +(e.target as HTMLInputElement).value; }, onchange: () => sound.click() });
        pane.append(row('Interface sounds', toggle(() => !sound.muted, v => { sound.muted = !v; }), 'Clicks, chimes, horns. All synthesized in real time.'), row('Volume', vol), h('div', { class: 'eyebrow', style: { margin: '18px 0 8px' } }, 'Preview'),
          h('div', { class: 'row', style: { flexWrap: 'wrap' } }, ...(['click', 'open', 'quest', 'achievement', 'levelup', 'hearth', 'horn', 'murloc', 'error'] as const).map(k => h('button', { class: 'btn sm ghost', onclick: () => (sound as any)[k]() }, k))));
      }
      if (tab === 'interface') {
        pane.append(
          row('Classic preset', toggle(() => document.documentElement.classList.contains('classic'), v => { document.documentElement.classList.toggle('classic', v); store.set('ui.classic', v); }), 'Squarer corners, denser text, dimmer glow. Also in Talents.'),
          row('Tooltips', toggle(() => !document.documentElement.classList.contains('no-tips'), v => { document.documentElement.classList.toggle('no-tips', !v); store.set('ui.tips', v); }), 'WoW-style item tooltips on hover.'),
          row('Large runes', toggle(() => store.get('ui.big', false), v => { document.documentElement.style.fontSize = v ? '16px' : ''; store.set('ui.big', v); }), 'Bigger interface text.'),
          row('Reduced motion', toggle(() => document.documentElement.classList.contains('reduced'), v => { document.documentElement.classList.toggle('reduced', v); store.set('ui.reduced', v); }), 'Fewer animations.'),
          row('NPC whispers', toggle(() => store.get('ui.whispers', true), v => store.set('ui.whispers', v)), 'Occasional letters and whispers from Azeroth.'),
          row('Reset window positions', h('button', { class: 'btn sm ghost', onclick: () => { store.keys().filter(k => k.startsWith('win.')).forEach(k => store.del(k)); notify('Windows reset', 'Next time they open, they will cascade.', 'settings'); } }, 'Reset')),
          h('div', { class: 'eyebrow', style: { margin: '18px 0 8px' } }, 'Keyboard'),
          h('table', { class: 'table' }, h('tbody', {}, ...[['Alt+Space', 'Hearth menu'], ['Alt+`', 'Command Console'], ['Alt+1…9', 'Action bar slots'], ['Alt+D', 'Show desktop'], ['Alt+F4', 'Close window'], ['F7', 'Next vista'], ['Esc', 'Close menus'], ['↑↑↓↓←→←→BA', '…']].map(([k, v]) => h('tr', {}, h('td', { style: { width: '160px' } }, h('kbd', {}, k)), h('td', {}, v))))));
      }
      if (tab === 'bnet') {
        const cfg = bnetConfig();
        const region = h('select', { class: 'input', style: { width: '160px' } }, ...REGIONS.map(r => h('option', { value: r.id, selected: r.id === cfg.region || undefined }, r.label)));
        const id = h('input', { class: 'input', placeholder: 'Client ID (from develop.battle.net)', value: cfg.clientId ?? '', autocomplete: 'off' });
        const secret = h('input', { class: 'input', type: 'password', placeholder: 'Client secret', value: cfg.clientSecret ?? '', autocomplete: 'off' });
        pane.append(
          h('div', { class: 'frame', style: { padding: '12px 14px', marginBottom: '14px' } },
            h('div', { class: 'eyebrow' }, 'Armory connection'),
            h('p', { class: 'small', style: { color: 'var(--parch-200)', margin: '6px 0 0' } }, 'GeekOS can pull real characters from the official Battle.net API. You create an API client yourself at develop.battle.net (it needs a Battle.net account with an authenticator), then paste the Client ID and Secret here. They are stored only on this machine and sent only to the GeekOS proxy that talks to Blizzard.'),
            h('p', { class: 'small dim', style: { margin: '6px 0 0' } }, hasBackend() ? '✓ A proxy is available in this build (Electron main process, Vite dev server, or Vercel function).' : '⚠ No proxy detected: run GeekOS through `npm run dev`, the Electron build, or a Vercel deployment.')),
          row('Region', region), row('Client ID', id), row('Client secret', secret),
          h('div', { class: 'row', style: { marginTop: '14px' } },
            h('button', { class: 'btn gold', onclick: () => { saveBnetConfig({ region: region.value, clientId: id.value.trim(), clientSecret: secret.value.trim() }); sound.coin(); notify('Battle.net settings saved', 'Open the Armory to look up a character.', 'legacy'); } }, 'Save'),
            h('button', { class: 'btn', onclick: () => launch('armory') }, 'Open Armory'),
            h('button', { class: 'btn ghost', onclick: () => { saveBnetConfig({ region: 'eu', clientId: '', clientSecret: '' }); render(); } }, 'Clear')),
          h('div', { class: 'dim small', style: { marginTop: '14px' } }, 'World of Warcraft: Forever does not have a published API namespace yet. Retail and Classic characters work today; Forever support depends on Blizzard shipping one after November 4.'));
      }
      if (tab === 'updates') {
        const m = content.manifest; const el = window.geekos;
        const appStatus = h('div', { class: 'small dim' }, el?.isElectron ? 'Desktop build: updates are downloaded automatically from GitHub Releases and installed on restart.' : 'Web build: you always run the latest deployed version. Reload to update.');
        pane.append(
          h('div', { class: 'frame', style: { padding: '12px 14px', marginBottom: '14px' } }, h('div', { class: 'eyebrow' }, 'Always updated'), h('p', { class: 'small', style: { color: 'var(--parch-200)', margin: '6px 0 0' } }, 'A cron job on GitHub checks Blizzard\'s official site every 6 hours and refreshes the Herald, launch dates and roadmap. A daily cloud agent reviews the announcements and proposes Codex updates. GeekOS pulls the result while it runs; no reinstall needed for content.')),
          row('Content source', h('span', { class: 'small', style: { maxWidth: '380px', wordBreak: 'break-all', color: 'var(--parch-300)' } }, CONTENT_URL)),
          row('Content last checked', h('span', { class: 'small' }, content.lastChecked ? new Date(content.lastChecked).toLocaleString() : 'never')),
          row('Manifest generated', h('span', { class: 'small' }, m?.checkedAt ? new Date(m.checkedAt).toLocaleString() + ` · ${m.news.length} articles` : 'not loaded'), `Source: ${content.source}`),
          row('Refresh content now', h('button', { class: 'btn sm gold', onclick: async () => { const r = await content.refresh(true); notify(r.error && r.manifest ? 'Using cached content' : 'Content refreshed', r.fresh.length ? `${r.fresh.length} new article(s).` : (r.error ?? 'Up to date.'), 'bell', { sound: false }); render(); } }, 'Refresh')),
          h('div', { class: 'hr' }),
          row('Application', h('span', { class: 'small' }, `GeekOS ${VERSION}${el?.version ? ' · Electron ' + el.version : ''}`), appStatus.textContent ?? ''),
          el?.isElectron ? row('Check for app updates', h('button', { class: 'btn sm', onclick: async () => { sound.click(); try { const r = await el!.checkUpdates!(); notify('Update check', r?.message ?? JSON.stringify(r), 'settings', { sound: false }); } catch (e: any) { notify('Update check failed', String(e?.message ?? e), 'faq', { sound: false }); } } }, 'Check now')) : null,
          h('div', { class: 'hr' }),
          row('Reset story and daily quests', h('button', { class: 'btn sm ghost', onclick: async () => { if (await confirm('Reset quests?', 'Story progress and dailies start over. Your own quests are kept.', 'Reset', 'Keep')) { questEngine.reset(); notify('Quests reset', 'Innkeeper Allison has a fresh quest for you.', 'quest'); } } }, 'Reset')));
      }
      if (tab === 'data') {
        pane.append(
          row('Export GeekOS data', h('button', { class: 'btn sm', onclick: () => { const data: Record<string, unknown> = {}; store.keys().forEach(k => data[k] = store.get(k, null)); const a = document.createElement('a'); a.download = 'geekos-backup.json'; a.href = 'data:application/json,' + encodeURIComponent(JSON.stringify(data, null, 2)); a.click(); } }, 'Export JSON'), 'Characters, quests, mail, bags, achievements, settings.'),
          row('Import GeekOS data', (() => { const i = h('input', { type: 'file', accept: '.json', style: { display: 'none' }, onchange: async (e: Event) => { const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return; try { const data = JSON.parse(await f.text()); Object.entries(data).forEach(([k, v]) => store.set(k, v)); notify('Imported', 'Reloading GeekOS…', 'bag'); setTimeout(() => location.reload(), 800); } catch { notify('Import failed', 'That was not a GeekOS backup.', 'faq'); } } }); const b = h('button', { class: 'btn sm', onclick: () => i.click() }, 'Import JSON'); b.append(i); return b; })()),
          row('Reset bags', h('button', { class: 'btn sm ghost', onclick: async () => { if (await confirm('Reset bags?', 'All scrolls and folders return to the starting set.', 'Reset', 'Keep')) { fs.reset(); notify('Bags reset', 'Fresh seed. The Grave keeps its secret.', 'bag'); } } }, 'Reset')),
          row('Reset achievements', h('button', { class: 'btn sm ghost', onclick: async () => { if (await confirm('Reset achievements?', 'All achievement progress will be lost.', 'Reset', 'Keep')) { achievements.reset(); bus.emit('achievement', null); notify('Achievements reset', 'Back to zero. Good luck.', 'achievements'); } } }, 'Reset')),
          row('Wipe everything', h('button', { class: 'btn sm danger', onclick: async () => { if (await confirm('Wipe GeekOS?', 'Characters, quests, mail, bags, achievements and settings. There is no undo.', 'Wipe', 'Keep')) { store.wipe(); location.reload(); } } }, 'Wipe'), 'Equivalent to /reset everything in the Console.'),
          h('div', { class: 'dim small', style: { marginTop: '14px' } }, `${store.keys().length} keys in local storage.`));
      }
      if (tab === 'about') { launch('about'); tab = 'vista'; render(); }
    };
    render();
    ctx.setStatus(`<span>GeekOS ${VERSION}</span><span class="dim">${BUILD}</span>`);
  },
};
