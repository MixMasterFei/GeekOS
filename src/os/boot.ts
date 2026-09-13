/**
 * Boot sequence: official Forever logo, gold loading bar, loading tips.
 */
import { h, VERSION, BUILD, rand } from './kernel';
import { LOGO_URL } from './icons';
import { sound } from './sound';

const TIPS = [
  'World of Warcraft: Forever launches November 4, 2026 at 3:00 PM PST. GeekOS keeps count on the desktop.',
  'The Skyborne are windswept elves. Horde Skyborne walk the Windshaper path; Alliance Skyborne follow the High Order.',
  'Forsaken Paladins and Dwarf Shamans are new race and class combinations in Forever. GeekOS lets you roll them at login.',
  'Nine new dungeons, two new raids, three new zones, and more than a thousand new quests. The level cap stays at 60.',
  'The Legacy system rewards account-wide benefits every time a character makes progress. GeekOS grants XP for using it.',
  'The Camping system lets you pitch a crafted campfire outdoors and share buffs with friends. Try the Camp app.',
  'No flying mounts. No level scaling. The journey matters as much as the destination.',
  'Press Alt+Space to open the Hearth menu. Alt+` opens the Command Console.',
  'Type /help in the Command Console to see everything it can do. Some commands are not listed.',
  'Right-click the desktop to change the vista. F7 cycles through all of them.',
  'Hyjal Summit is a 20-player raid. Barrow Deeps is a 10-player max-level challenge.',
  'The Darkspear Islands battleground is 15 versus 15, mixing control points with flag captures.',
  'Beta runs September 17 through October 21. Early name reservation opens October 27.',
  'The first raid unlocks December 9. The Calendar app has the whole roadmap.',
  'Hidden achievements exist. Some are in the trash. Some are in the clock. One is in an old code.',
  'GeekOS levels you up as you use it. Reach 60 and something changes.',
  'Mount Hyjal is set after the Third War. Darkwhisper Gorge is still smouldering.',
  'Riverglades: frontier rivers, grasslands, trade routes, and more than 150 new quests.',
  "Shen'dralas hides between Mulgore and Desolace and ties to Eldre'Thalas and Dire Maul.",
  'Modern and Classic visual presets can be toggled in-game. GeekOS has a Classic UI mode in Settings.',
];
const STEPS = ['Waking the hearth…', 'Loading fonts of the old world…', 'Unrolling vistas…', 'Polishing icons…', 'Tuning the war horn…', 'Reading the Forever Codex…', 'Counting down to November 4…', 'Hiding secrets…', 'Gilding the frames…', 'Opening the gates…'];

export function runBoot(root: HTMLElement, fast = false): Promise<void> {
  return new Promise(resolve => {
    const bar = h('div', { class: 'loadbar' }, h('i'));
    const status = h('div', { class: 'status' }, 'Waking the hearth…');
    const tip = h('div', { class: 'tip' }, h('b', {}, 'LOADING TIP'), rand(TIPS));
    const el = h('div', { class: 'boot' },
      h('img', { class: 'logo', src: LOGO_URL, alt: 'World of Warcraft: Forever', draggable: 'false' }),
      h('div', {}, h('div', { class: 'title display' }, 'GeekOS'), h('div', { class: 'sub' }, 'Adventure. Forever.')),
      bar, status, tip,
      h('div', { class: 'ver' }, `v${VERSION} · build ${BUILD}`),
      h('button', { class: 'btn sm ghost skip', onclick: () => finish() }, 'Skip'));
    root.append(el);
    let done = false;
    const finish = () => { if (done) return; done = true; el.classList.add('out'); setTimeout(() => { el.remove(); resolve(); }, 800); };
    const total = fast ? 700 : 3600; const t0 = performance.now(); let lastStep = -1; let tipTimer = 0;
    const tick = () => {
      if (done) return;
      const p = Math.min(1, (performance.now() - t0) / total);
      const eased = p < 0.9 ? p * 0.92 : 0.83 + (p - 0.9) * 1.7;
      (bar.firstChild as HTMLElement).style.width = (Math.min(1, eased) * 100).toFixed(1) + '%';
      const step = Math.min(STEPS.length - 1, Math.floor(p * STEPS.length));
      if (step !== lastStep) { lastStep = step; status.textContent = STEPS[step]; sound.tick(); }
      if (!fast && performance.now() - tipTimer > 1800) { tipTimer = performance.now(); tip.lastChild!.textContent = rand(TIPS); }
      if (p >= 1) { status.textContent = 'Welcome.'; setTimeout(finish, 350); } else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
