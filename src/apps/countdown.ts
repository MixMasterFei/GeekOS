/**
 * Countdown — the days until World of Warcraft: Forever, with milestones.
 */
import { h, pad2, type AppDef } from '../os/kernel';
import { content } from '../os/content';
import { LOGO_URL } from '../os/icons';
import { launch } from '../os/shell';
import { FOREVER_EVENTS } from './calendar';

export const countdownApp: AppDef = {
  id: 'countdown', name: 'Forever Countdown', subtitle: 'November 4, 2026 · 3:00 PM PST', icon: 'countdown', category: 'adventure', width: 640, height: 520, noScroll: true,
  mount(ctx) {
    const nums = ['days', 'hours', 'minutes', 'seconds'].map(k => h('div', { style: { textAlign: 'center', minWidth: '110px' } }, h('div', { class: 'display', dataset: { k }, style: { fontSize: '52px', lineHeight: '1' } }, '00'), h('div', { class: 'eyebrow', style: { marginTop: '6px' } }, k)));
    const ring = h('img', { src: LOGO_URL, alt: 'World of Warcraft: Forever', draggable: 'false', style: { width: '300px', maxWidth: '80%', height: 'auto', margin: '0 auto', display: 'block', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,.85))' } });
    const status = h('div', { class: 'dim', style: { textAlign: 'center' } });
    const bar = h('div', { class: 'bar gold', style: { height: '18px', margin: '14px 40px 0' } }, h('i'), h('span'));
    const upcoming = h('div', { class: 'col', style: { gap: '4px', margin: '14px 40px 0' } });
    ctx.body.append(h('div', { style: { padding: '26px 20px', textAlign: 'center', background: 'linear-gradient(180deg, rgba(4,20,27,.55), rgba(4,20,27,.92) 60%), url(/art/key-art-wide.jpg) center 20% / cover' } },
      ring,
      h('div', { class: 'eyebrow', style: { marginTop: '14px' } }, 'World of Warcraft: Forever launches in'),
      h('div', { class: 'row', style: { justifyContent: 'center', gap: '18px', marginTop: '12px' } }, ...nums),
      status, bar, upcoming,
      h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '18px', gap: '10px' } },
        h('button', { class: 'btn primary', onclick: () => launch('calendar', { date: '2026-11-04' }) }, 'Open Calendar'),
        h('button', { class: 'btn', onclick: () => launch('codex', { section: 'editions', entry: 'dates' }) }, 'Key Dates'))));

    const reveal = Date.UTC(2026, 8, 12, 17, 0, 0);
    const tick = () => {
      const LAUNCH_UTC = content.launchUtc(); const now = Date.now(); const ms = LAUNCH_UTC - now;
      if (ms <= 0) { nums.forEach(n => (n.firstChild as HTMLElement).textContent = '00'); status.innerHTML = '<b class="gold">FOREVER IS LIVE.</b> Azeroth is calling. Why are you still here?'; (bar.firstChild as HTMLElement).style.width = '100%'; (bar.lastChild as HTMLElement).textContent = 'Launched'; return; }
      const d = Math.floor(ms / 864e5), hh = Math.floor(ms / 36e5) % 24, mm = Math.floor(ms / 6e4) % 60, ss = Math.floor(ms / 1e3) % 60;
      [d, hh, mm, ss].forEach((v, i) => { const el = nums[i].firstChild as HTMLElement; const t = i === 0 ? String(v) : pad2(v); if (el.textContent !== t) { el.textContent = t; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = 'pop .3s ease'; } });
      const local = new Date(content.launchUtc()).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' });
      status.innerHTML = `Launch in your time zone: <b class="gold">${local}</b>`;
      const p = Math.min(1, Math.max(0, (now - reveal) / (content.launchUtc() - reveal)));
      (bar.firstChild as HTMLElement).style.width = (p * 100).toFixed(2) + '%'; (bar.lastChild as HTMLElement).textContent = `${(p * 100).toFixed(1)}% of the road from reveal to launch`;
    };
    const renderUpcoming = () => {
      upcoming.innerHTML = '';
      const today = new Date().toISOString().slice(0, 10);
      const next = FOREVER_EVENTS.filter(e => e.date >= today).slice(0, 3);
      if (next.length) upcoming.append(h('div', { class: 'eyebrow', style: { marginBottom: '4px' } }, 'Next on the roadmap'));
      next.forEach(e => { const dd = Math.ceil((new Date(e.date + 'T12:00:00').getTime() - Date.now()) / 864e5); upcoming.append(h('div', { class: 'row small', style: { justifyContent: 'space-between', padding: '4px 8px', border: '1px solid rgba(233,200,116,.15)', background: 'rgba(0,0,0,.25)' } }, h('span', { style: { color: e.kind === 'launch' ? 'var(--q-legendary)' : 'var(--parch-100)' } }, e.title), h('span', { class: 'dim' }, dd <= 0 ? 'today' : `in ${dd} day${dd > 1 ? 's' : ''}`))); });
    };
    tick(); renderUpcoming();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  },
};
