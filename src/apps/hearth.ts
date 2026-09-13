/**
 * Hearthstone — "return home": minimizes everything, plays the swirl, and
 * puts the stone on a 30-minute cooldown. Reveals the rune after use.
 */
import { h, store, grantXp, bus, type AppDef } from '../os/kernel';
import { icon } from '../os/icons';
import { sound } from '../os/sound';
import { wm } from '../os/wm';
import { achievements } from '../os/achievements';
import { bindTooltip } from '../os/ui';

const CD = 30 * 60 * 1000;

export const hearthApp: AppDef = {
  id: 'hearth', name: 'Hearthstone', subtitle: 'Return home', icon: 'hearth', category: 'adventure', width: 380, height: 420, noScroll: true,
  mount(ctx) {
    const stone = h('div', { style: { width: '150px', height: '150px', margin: '20px auto 0', cursor: 'pointer', transition: 'transform .2s', filter: 'drop-shadow(0 0 18px rgba(62,199,176,.5))' }, html: icon('hearth') });
    const status = h('div', { class: 'eyebrow', style: { textAlign: 'center', marginTop: '14px' } });
    const cdEl = h('div', { class: 'display', style: { textAlign: 'center', fontSize: '30px', minHeight: '38px' } });
    const rune = h('div', { class: 'quest-font', style: { textAlign: 'center', marginTop: '12px', color: 'var(--teal-300)', opacity: '0', transition: 'opacity 2s', letterSpacing: '.3em', fontSize: '18px', textShadow: '0 0 10px var(--teal-300)' } }, "AR'MELDAN");
    const flavor = h('div', { class: 'dim small', style: { textAlign: 'center', padding: '10px 30px' } }, 'Home: Innkeeper Allison, GeekOS Desktop. Binds on pickup. 30 minute cooldown.');
    const btn = h('button', { class: 'btn gold', style: { display: 'block', margin: '10px auto 0' } }, 'Use Hearthstone');
    ctx.body.append(stone, status, cdEl, btn, rune, flavor);
    bindTooltip(stone, { name: 'Hearthstone', bind: 'Binds when picked up', sub: 'Use: Returns you to your home. Speak to an Innkeeper to change your home.', lines: ['<span class="dim">Something is carved on the underside.</span>'], flavor: 'Home is where the hearth is.' });
    const used = () => store.get<number>('hearth.used', 0);
    const upd = () => { const left = used() + CD - Date.now(); if (left > 0) { status.textContent = 'Cooldown'; cdEl.textContent = `${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`; btn.setAttribute('disabled', ''); stone.style.filter = 'grayscale(.8) brightness(.6)'; if (achievements.has('hearth')) rune.style.opacity = '.8'; } else { status.textContent = 'Ready'; cdEl.textContent = ''; btn.removeAttribute('disabled'); stone.style.filter = 'drop-shadow(0 0 18px rgba(62,199,176,.5))'; } };
    const use = () => {
      if (used() + CD - Date.now() > 0) { sound.error(); return; }
      store.set('hearth.used', Date.now()); sound.hearth(); stone.style.transform = 'rotate(720deg) scale(.2)'; status.textContent = 'Casting…';
      const veil = h('div', { style: { position: 'absolute', inset: '0', zIndex: '9000', background: 'radial-gradient(circle, rgba(62,199,176,.0), rgba(6,24,33,.0))', pointerEvents: 'none', transition: 'background 1.6s' } });
      document.getElementById('os')!.append(veil); requestAnimationFrame(() => veil.style.background = 'radial-gradient(circle, rgba(62,199,176,.35), rgba(6,24,33,.95))');
      setTimeout(() => { wm.list().forEach(w => { if (w.appId !== 'hearth') w.minimize(); }); veil.style.background = 'radial-gradient(circle, rgba(62,199,176,0), rgba(6,24,33,0))'; setTimeout(() => veil.remove(), 1600); stone.style.transform = ''; achievements.unlock('hearth'); grantXp(25, 'hearth'); bus.emit('hearth:use'); rune.style.opacity = '.8'; upd(); }, 1700);
    };
    btn.addEventListener('click', use); stone.addEventListener('click', use);
    upd(); const iv = setInterval(upd, 1000);
    return () => clearInterval(iv);
  },
};
