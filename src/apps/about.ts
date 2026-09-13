/**
 * About GeekOS — credits, version, the promise.
 */
import { h, VERSION, BUILD, grantXp, type AppDef } from '../os/kernel';
import { LOGO_URL } from '../os/icons';
import { achievements, ACHIEVEMENTS } from '../os/achievements';
import { WALLPAPERS } from '../os/wallpaper';
import { appList } from '../os/kernel';
import { sound } from '../os/sound';

export const aboutApp: AppDef = {
  id: 'about', name: 'About GeekOS', subtitle: 'A love letter, in software', icon: 'sparkles', category: 'system', width: 620, height: 560, hidden: true,
  mount(ctx) {
    let clicks = 0;
    const logo = h('img', { src: LOGO_URL, alt: 'World of Warcraft: Forever', draggable: 'false', style: { width: '220px', height: 'auto', margin: '0 auto', display: 'block', cursor: 'pointer', transition: 'transform .3s', filter: 'drop-shadow(0 6px 18px rgba(0,0,0,.7))' } });
    logo.addEventListener('click', () => { clicks++; logo.style.transform = `scale(${1 + Math.sin(clicks) * 0.06}) rotate(${(clicks % 2 ? 1 : -1) * 2}deg)`; sound.tick(); if (clicks === 8) { sound.achievement(); grantXp(50, 'about-spin'); logo.style.filter = 'drop-shadow(0 0 30px var(--gold-300))'; } });
    ctx.body.append(h('div', { style: { padding: '26px 30px', textAlign: 'center', background: 'radial-gradient(ellipse at 50% 20%, rgba(62,199,176,.12), transparent 60%)' } },
      logo,
      h('h1', { class: 'display', style: { fontSize: '40px', marginTop: '12px', lineHeight: '1' } }, 'GeekOS'),
      h('div', { class: 'eyebrow', style: { marginTop: '6px' } }, 'Adventure. Forever.'),
      h('div', { class: 'dim small', style: { marginTop: '10px', fontFamily: 'var(--font-mono)' } }, `v${VERSION} · build ${BUILD}`),
      h('div', { class: 'hr orn', style: { margin: '18px 0' } }),
      h('p', { class: 'quest-font', style: { fontSize: '15px', lineHeight: '1.7', color: 'var(--parch-100)', textAlign: 'left' } }, 'GeekOS is a fan-made desktop built as a love letter to the original world of Azeroth and to World of Warcraft: Forever, launching November 4, 2026. The vistas, logo and icons are Blizzard\'s official World of Warcraft art, used non-commercially under Blizzard\'s fan content guidelines; the interface, sounds and music are original. It is unofficial, made by fans, for the community.'),
      h('table', { class: 'table', style: { marginTop: '10px', textAlign: 'left' } }, h('tbody', {},
        ...[['Apps', String(appList().filter(a => !a.hidden).length)], ['Vistas', String(WALLPAPERS.length)], ['Achievements', `${ACHIEVEMENTS.length} (${ACHIEVEMENTS.filter(a => a.hidden).length} hidden)`], ['Your points', `${achievements.points()} / ${achievements.totalPoints()}`], ['Art', 'Official Blizzard key art, screenshots and game icons (render.worldofwarcraft.com)'], ['Type', 'Cinzel · Open Sans · MedievalSharp · Uncial Antiqua (SIL Open Font License)'], ['Engine', 'Vite + TypeScript, zero frameworks, WebAudio, Canvas 2D, SVG'], ['Runs as', 'Web app, or Electron desktop executable']].map(([k, v]) => h('tr', {}, h('td', { class: 'gold', style: { width: '130px', fontFamily: 'var(--font-display)', fontSize: '11px', letterSpacing: '.08em' } }, k), h('td', { class: 'small' }, v))))),
      h('div', { class: 'dim small', style: { marginTop: '16px' } }, 'World of Warcraft, Warcraft, Blizzard and related marks are trademarks of Blizzard Entertainment, Inc. GeekOS is not affiliated with or endorsed by Blizzard.'),
      h('div', { class: 'dim small', style: { marginTop: '4px', opacity: .5 } }, 'The logo has a secret if you insist.')));
  },
};
