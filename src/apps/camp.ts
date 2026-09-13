/**
 * Camp — a focus timer built on Forever's Camping system: pitch a crafted
 * campfire, sit by it for a session, earn a "Well Fed" buff and rested XP.
 */
import { h, grantXp, store, pad2, bus, type AppDef } from '../os/kernel';
import { sound } from '../os/sound';
import { achievements } from '../os/achievements';
import { notify } from '../os/ui';
import { icon } from '../os/icons';
import { loadImage } from '../os/wallpaper';

const PRESETS = [{ name: 'Short rest', min: 5 }, { name: 'Campfire', min: 25 }, { name: 'Long rest', min: 50 }, { name: 'Night at the inn', min: 90 }];
const BUFFS = ['Well Fed', 'Rested', 'Warmth of the Fire', 'Song of the Riverglades', 'Windshaper\'s Focus', 'Stone and Storm'];

export const campApp: AppDef = {
  id: 'camp', name: 'Camp', subtitle: 'Focus timer by the campfire', icon: 'camp', category: 'tools', width: 560, height: 560, noScroll: true,
  mount(ctx) {
    let total = store.get('camp.min', 25) * 60; let left = total; let running = false; let timer = 0; let sessions = store.get<number>('camp.sessions', 0);
    const canvas = document.createElement('canvas'); canvas.width = 520; canvas.height = 220; canvas.style.cssText = 'width:100%;height:220px;display:block';
    const g = canvas.getContext('2d')!; const embers: { x: number; y: number; vy: number; life: number; s: number }[] = []; let raf = 0;
    const timeEl = h('div', { class: 'display', style: { fontSize: '64px', lineHeight: '1', textAlign: 'center' } });
    const label = h('div', { class: 'eyebrow', style: { textAlign: 'center', marginTop: '6px' } }, 'Pitch a campfire and sit');
    const bar = h('div', { class: 'bar gold', style: { margin: '14px 40px 0' } }, h('i'), h('span'));
    const presets = h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '14px', flexWrap: 'wrap' } });
    const startBtn = h('button', { class: 'btn gold', style: { minWidth: '150px' } }, 'Pitch Campfire');
    const resetBtn = h('button', { class: 'btn ghost' }, 'Douse');
    const buffs = h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap', minHeight: '24px' } });
    ctx.body.append(canvas, h('div', { style: { padding: '0 0 16px' } }, timeEl, label, bar, presets, h('div', { class: 'row', style: { justifyContent: 'center', marginTop: '14px' } }, startBtn, resetBtn), buffs));
    const fmt = (s: number) => `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`;
    const renderPresets = () => { presets.innerHTML = ''; PRESETS.forEach(p => presets.append(h('button', { class: 'btn sm ' + (total === p.min * 60 ? 'primary' : 'ghost'), disabled: running || undefined, onclick: () => { total = p.min * 60; left = total; store.set('camp.min', p.min); upd(); renderPresets(); } }, `${p.name} · ${p.min}m`))); };
    const renderBuffs = () => { buffs.innerHTML = ''; const list = store.get<string[]>('camp.buffs', []); list.slice(-4).forEach(b => buffs.append(h('span', { class: 'badge teal', title: 'Buff from a completed session' }, b))); };
    const upd = () => { timeEl.textContent = fmt(left); (bar.firstChild as HTMLElement).style.width = (100 * (total - left) / total) + '%'; (bar.lastChild as HTMLElement).textContent = running ? 'Sitting by the fire' : left === total ? 'Ready' : 'Paused'; startBtn.textContent = running ? 'Stand up (pause)' : left === total ? 'Pitch Campfire' : 'Sit back down'; ctx.setTitle(running ? `Camp — ${fmt(left)}` : 'Camp'); };
    const finish = () => { running = false; clearInterval(timer); sessions++; store.set('camp.sessions', sessions); const buff = BUFFS[sessions % BUFFS.length]; const list = store.get<string[]>('camp.buffs', []); list.push(buff); store.set('camp.buffs', list.slice(-10)); grantXp(Math.round(total / 60) * 4, 'camp'); if (store.get('ui.rested', true)) grantXp(20, 'rested'); sound.levelup(); notify('Session complete', `You gain <b>${buff}</b>. ${Math.round(total / 60)} minutes by the fire.`, 'camp', { sound: false, timeout: 8000 }); achievements.unlock('camp'); bus.emit('camp:session'); left = total; label.textContent = `${sessions} session${sessions !== 1 ? 's' : ''} camped`; upd(); renderBuffs(); renderPresets(); };
    startBtn.addEventListener('click', () => { running = !running; if (running) { sound.hearth(); achievements.unlock('camp'); bus.emit('camp:start'); timer = window.setInterval(() => { left--; if (left <= 0) finish(); else upd(); }, 1000); } else clearInterval(timer); sound.click(); upd(); renderPresets(); });
    resetBtn.addEventListener('click', () => { running = false; clearInterval(timer); left = total; upd(); renderPresets(); });
    // campfire painting
    const scene = loadImage('/art/camping.jpg');
    const draw = () => {
      raf = requestAnimationFrame(draw); const W = canvas.width, H = canvas.height; g.clearRect(0, 0, W, H);
      if (scene.complete && scene.naturalWidth) { const s = Math.max(W / scene.naturalWidth, H / scene.naturalHeight); const dw = scene.naturalWidth * s, dh = scene.naturalHeight * s; g.drawImage(scene, (W - dw) / 2, (H - dh) * 0.45, dw, dh); } else { g.fillStyle = '#071c26'; g.fillRect(0, 0, W, H); }
      if (!running) { g.fillStyle = 'rgba(4,20,27,.45)'; g.fillRect(0, 0, W, H); }
      const fx = W * 0.5, fy = H * 0.78; const flick = running ? 1 : 0.35;
      const glow = g.createRadialGradient(fx, fy - 10, 0, fx, fy - 10, 160 * flick + 40); glow.addColorStop(0, `rgba(255,150,60,${0.5 * flick + 0.1})`); glow.addColorStop(1, 'rgba(255,100,30,0)'); g.fillStyle = glow; g.fillRect(0, 0, W, H);
      const t = performance.now() / 1000;
      for (let i = 0; i < 3; i++) { const hgt = (running ? 46 : 16) + Math.sin(t * 9 + i * 2) * 8; const w = 22 - i * 5; const grd = g.createLinearGradient(0, fy, 0, fy - hgt); grd.addColorStop(0, i === 2 ? '#fff3a0' : i === 1 ? '#ffb300' : '#ff3d00'); grd.addColorStop(1, 'rgba(255,200,100,0)'); g.fillStyle = grd; g.beginPath(); g.moveTo(fx - w, fy); g.quadraticCurveTo(fx - w * 0.5 + Math.sin(t * 7 + i) * 6, fy - hgt * 0.6, fx + Math.sin(t * 5 + i) * 4, fy - hgt); g.quadraticCurveTo(fx + w * 0.5 + Math.cos(t * 6 + i) * 6, fy - hgt * 0.6, fx + w, fy); g.closePath(); g.fill(); }
      if (running && Math.random() < 0.4) embers.push({ x: fx + (Math.random() - 0.5) * 20, y: fy - 20, vy: 0.6 + Math.random(), life: 1, s: 1 + Math.random() * 2 });
      for (let i = embers.length - 1; i >= 0; i--) { const e = embers[i]; e.y -= e.vy; e.x += Math.sin(t * 3 + i) * 0.4; e.life -= 0.012; if (e.life <= 0) { embers.splice(i, 1); continue; } g.fillStyle = `rgba(255,${120 + 100 * e.life},60,${e.life})`; g.fillRect(e.x, e.y, e.s, e.s); }
      g.fillStyle = 'rgba(233,200,116,.8)'; g.font = '11px Cinzel'; g.fillText(running ? 'THE FIRE IS LIT' : 'THE FIRE WAITS', 12, 18);
    };
    draw();
    label.textContent = sessions ? `${sessions} session${sessions !== 1 ? 's' : ''} camped` : 'Pitch a campfire and sit';
    upd(); renderPresets(); renderBuffs();
    ctx.setStatus(`<span>${sessions} sessions</span><span class="dim">Completed sessions grant a buff and rested XP</span>`);
    return () => { cancelAnimationFrame(raf); clearInterval(timer); };
    void icon;
  },
};
