/**
 * Command Console — a chat-frame-style terminal that speaks slash commands.
 */
import { h, esc, session, apps, appList, rand, fmtDuration, LAUNCH_UTC, VERSION, BUILD, grantXp, store, bus, type AppDef } from '../os/kernel';
import { achievements, ACHIEVEMENTS } from '../os/achievements';
import { sound } from '../os/sound';
import { launch, wallpaper } from '../os/shell';
import { wm } from '../os/wm';
import { WALLPAPERS } from '../os/wallpaper';
import { fs } from '../os/fs';
import { CODEX } from '../data/codex';



const DANCES: Record<string, string> = {
  Human: 'does the running man.', Dwarf: 'does a Cossack dance.', 'Night Elf': 'dances like nobody is watching.', Gnome: 'spins in circles, elegantly.',
  Orc: 'flexes and stomps to a drumbeat.', Forsaken: 'sways in a way that should not be anatomically possible.', Tauren: 'stomps a peace dance.', Troll: 'busts out a limbo.',
};
const JOKES = [
  'Why did the murloc cross the road? Mrglglglgl.', 'I asked a Forsaken for a hand. He gave me one.', 'A Tauren walks into a bar. It was low.',
  "Gnome engineers don't make mistakes. They make prototypes.", 'Level 60 is not the end. It is where the stories start.',
];
const FLIRTS = ['Is that a Hearthstone in your bag, or are you just happy to be home?', 'You had me at /invite.', 'I would follow you into Molten Core. Without a fire resist set.'];
const WHO: Record<string, string> = {
  thrall: 'Thrall — Level 60 Orc Shaman — Zone: Orgrimmar — Guild: <Warchief>',
  jaina: 'Jaina — Level 60 Human Mage — Zone: Theramore — Guild: <Kirin Tor>',
  sylvanas: 'Sylvanas — Level 60 Forsaken Hunter — Zone: Undercity — Guild: <The Forsaken>',
  leeroy: 'Leeroy — Level 60 Human Paladin — Zone: Blackrock Spire — Guild: <Pals for Life>',
  hogger: 'Hogger — Level 11 Gnoll — Zone: Elwynn Forest — Guild: <Riverpaw>',
  medivh: 'Medivh — Level ?? — Zone: Karazhan — Guild: <The Tower Still Plays>',
};

export function writeLine(log: HTMLElement, cls: string, html: string) {
  const ts = new Date(); const t = `${String(ts.getHours()).padStart(2, '0')}:${String(ts.getMinutes()).padStart(2, '0')}`;
  log.append(h('div', { class: 'ln ' + cls, html: `<span class="ts">[${t}]</span>${html}` }));
  log.scrollTop = log.scrollHeight;
}

export const consoleApp: AppDef = {
  id: 'console', name: 'Command Console', subtitle: 'Slash commands, chat frame style', icon: 'console', category: 'system', width: 760, height: 460, pinned: true, noScroll: true,
  mount(ctx) {
    const u = session.user!;
    const log = h('div', { class: 'log grow', style: { background: 'rgba(0,0,0,.35)' } });
    const input = h('input', { class: 'input', placeholder: 'Type a command… ( /help )', spellcheck: 'false', style: { borderRadius: '0', borderLeft: 'none', borderRight: 'none', borderBottom: 'none', fontFamily: 'var(--font-mono)' } });
    ctx.body.append(log, input);
    const say = (cls: string, html: string) => writeLine(log, cls, html);
    const sys = (html: string) => say('sys', html);
    const history: string[] = store.get('console.history', []); let hi = history.length;

    sys(`GeekOS Command Console v${VERSION} — build ${BUILD}`);
    sys(`Welcome back, <b>${esc(u.name)}</b>. Type <b>/help</b> for commands. Not every command is listed.`);
    say('guild', `[Guild] [Innkeeper Allison]: Rooms are 1s a night, but the stories are free.`);

    const cmds: Record<string, { help?: string; run: (args: string, raw: string) => void }> = {
      help: { help: 'Show this list', run() {
        achievements.unlock('terminal-help');
        sys('Available commands:');
        Object.entries(cmds).filter(([, c]) => c.help).sort().forEach(([k, c]) => say('say', `  <span class="gold">/${k}</span> <span class="dim">— ${c.help}</span>`));
        say('dim', `  <span class="dim">…and a few that are not listed. Emotes work too: /dance, /wave, /cheer, /cry, /flex, /roar, /bow, /salute, /kiss, /flirt, /joke, /chicken.</span>`);
      } },
      open: { help: 'Open an app: /open <name>', run(a) { const q = a.trim().toLowerCase(); const app = appList().find(x => x.id === q || x.name.toLowerCase().includes(q)); if (!app) { say('err', `No such app: ${esc(a)}. Try /apps.`); sound.error(); return; } launch(app.id); sys(`Casting <b>${esc(app.name)}</b>…`); } },
      apps: { help: 'List all apps', run() { appList().filter(x => !x.hidden).forEach(x => say('say', `  <span class="gold">${x.id}</span> — ${esc(x.name)} <span class="dim">(${x.category})</span>`)); } },
      close: { help: 'Close the focused window (or all: /close all)', run(a) { if (a.trim() === 'all') { wm.list().filter(w => w.appId !== 'console').forEach(w => w.close()); sys('All other windows closed.'); } else { const f = wm.list().filter(w => w.appId !== 'console').sort((x, y) => +y.el.style.zIndex - +x.el.style.zIndex)[0]; if (f) { f.close(); sys(`Closed ${esc(f.def.name)}.`); } else sys('Nothing to close.'); } } },
      played: { help: 'Total time played', run() { achievements.unlock('played'); sys(`Total time played: <b>${fmtDuration(session.playedTotal)}</b>`); sys(`Time played this level: <b>${fmtDuration(Math.floor((Date.now() - session.bootedAt) / 1000))}</b>`); } },
      time: { help: 'Realm time', run() { sys(`Realm time: <b>${new Date().toLocaleTimeString()}</b> — Local time: <b>${new Date().toLocaleString()}</b>`); } },
      launch: { help: 'Countdown to WoW: Forever', run() { const ms = LAUNCH_UTC - Date.now(); if (ms <= 0) sys('<b class="gold">World of Warcraft: Forever is live.</b> What are you doing here?'); else sys(`World of Warcraft: Forever launches in <b>${fmtDuration(Math.floor(ms / 1000))}</b> (November 4, 2026 · 3:00 PM PST).`); } },
      roll: { help: 'Roll dice: /roll [max]', run(a) { const max = Math.max(2, parseInt(a) || 100); const n = 1 + Math.floor(Math.random() * max); say('sys', `${esc(u.name)} rolls <b>${n}</b> (1-${max})`); if (max === 100 && n === 100) achievements.unlock('roll-100'); if (max === 100 && n === 1) achievements.unlock('roll-1'); } },
      who: { help: 'Look someone up: /who <name>', run(a) { const q = a.trim().toLowerCase(); if (!q) { sys(`1 player total: ${esc(u.name)} — Level ${u.level} ${u.race} ${u.cls} — Zone: GeekOS Desktop`); return; } if (WHO[q]) { sys(WHO[q]); if (q === 'thrall') achievements.unlock('who-thrall'); } else sys(`0 players total matching "${esc(a.trim())}". They may be in another realm.`); } },
      whoami: { help: 'Your character', run() { sys(`${esc(u.name)}${u.title ? ', ' + esc(u.title) : ''} — Level ${u.level} ${u.race} ${u.cls} (${u.faction}) — XP ${u.xp} — ${achievements.points()} achievement points.`); } },
      hearth: { help: 'Use your Hearthstone', run() { launch('hearth'); } },
      wall: { help: 'Change vista: /wall next | /wall <id> | /wall list', run(a) { const q = a.trim(); if (!q || q === 'next') { wallpaper.next(); sys(`Vista: <b>${esc(wallpaper.current.name)}</b>`); } else if (q === 'list') WALLPAPERS.forEach(w => say('say', `  <span class="gold">${w.id}</span> — ${esc(w.name)}`)); else { const w = WALLPAPERS.find(x => x.id === q || x.name.toLowerCase().includes(q.toLowerCase())); if (w) { wallpaper.set(w.id); sys(`Vista: <b>${esc(w.name)}</b>`); } else say('err', 'No such vista.'); } } },
      achievements: { help: 'Achievement summary', run() { const done = ACHIEVEMENTS.filter(x => achievements.has(x.id)); sys(`${done.length} / ${ACHIEVEMENTS.length} achievements — ${achievements.points()} / ${achievements.totalPoints()} points.`); done.forEach(x => say('say', `  <span class="gold">✓ ${esc(x.name)}</span> <span class="dim">${esc(x.desc)}</span>`)); } },
      lore: { help: 'Read a Codex entry: /lore <zone|dungeon|raid>', run(a) { const q = a.trim().toLowerCase(); const e = CODEX.flatMap(s => s.entries).find(x => x.name.toLowerCase().includes(q)); if (!q) { CODEX.forEach(s => say('say', `  <span class="gold">${esc(s.title)}</span>: ${s.entries.map(x => esc(x.name)).join(', ')}`)); return; } if (!e) { say('err', 'Nothing in the Codex matches.'); return; } sys(`<b>${esc(e.name)}</b> <span class="dim">${esc(e.sub ?? '')}</span>`); say('say', esc(e.text)); } },
      clear: { help: 'Clear the console', run() { log.innerHTML = ''; } },
      ls: { help: 'List your bags', run(a) { const dir = a.trim() ? fs.find(a.trim()).find(n => n.type === 'folder') : fs.get('root'); if (!dir) { say('err', 'No such bag.'); return; } fs.children(dir.id).forEach(n => say('say', `  ${n.type === 'folder' ? '<span class="gold">▸</span>' : '·'} ${esc(n.name)}`)); } },
      cat: { help: 'Read a scroll: /cat <name>', run(a) { const n = fs.find(a.trim()).find(x => x.type === 'text' || x.type === 'letter'); if (!n) { say('err', 'No such scroll.'); return; } say('say', `<pre style="white-space:pre-wrap;margin:0">${esc(n.content ?? '')}</pre>`); if (n.id === 'scarlet') achievements.unlock('secret-file'); } },
      level: { help: 'Show XP progress', run() { sys(`Level ${u.level}. ${u.level >= 60 ? 'You are Forever Ready.' : 'Keep adventuring.'}`); } },
      lock: { run() { bus.emit('lock'); } },
      logout: { help: 'Return to character select', run() { bus.emit('logout'); } },
      exit: { help: 'Exit GeekOS', run() { bus.emit('shutdown'); } },
      reload: { help: 'Reload the UI', run() { location.reload(); } },
      version: { run() { sys(`GeekOS ${VERSION} · ${BUILD} · ${navigator.userAgent}`); } },
      say: { help: 'Say something', run(a) { say('say', `${esc(u.name)} says: ${esc(a)}`); reply(a); } },
      yell: { run(a) { say('yell', `${esc(u.name)} yells: ${esc(a).toUpperCase()}`); reply(a); } },
      g: { help: 'Guild chat', run(a) { say('guild', `[Guild] [${esc(u.name)}]: ${esc(a)}`); setTimeout(() => say('guild', `[Guild] [${rand(['Grimtotem', 'Pixelbrand', 'Sundershot', 'Velaria'])}]: ${rand(['lol', 'gz', 'anyone for Hall of Thanes?', 'Forever hype', 'need a healer for Barrow Deeps', 'brb, camping'])}`), 900 + Math.random() * 1500); } },
      w: { run(a) { const [to, ...rest] = a.split(' '); say('whisper', `To [${esc(to)}]: ${esc(rest.join(' '))}`); setTimeout(() => { sound.whisper(); say('whisper', `[${esc(to)}] whispers: ${rand(['?', 'who dis', 'not now, raiding', 'mrgl', 'meet me in the Riverglades'])}`); }, 1200); } },
      joke: { run() { say('emote', `${esc(u.name)} tells a joke: "${rand(JOKES)}"`); } },
      flirt: { run() { say('emote', `${esc(u.name)} says: "${rand(FLIRTS)}"`); } },
      chicken: { run() { say('emote', `${esc(u.name)} flaps around like a chicken. Cluck cluck.`); sound.murloc(); achievements.unlock('chicken'); } },
      // ---------- unlisted ----------
      dance: { run() { say('emote', `${esc(u.name)} ${DANCES[u.race] ?? 'dances.'}`); achievements.unlock('console-dance'); grantXp(5, 'dance'); } },
      wave: { run() { say('emote', `${esc(u.name)} waves at everybody.`); } },
      cheer: { run() { say('emote', `${esc(u.name)} cheers! Forever!`); } },
      cry: { run() { say('emote', `${esc(u.name)} cries. It is 52 days until launch. That is a lot of days.`); } },
      flex: { run() { say('emote', `${esc(u.name)} flexes. ${u.cls === 'Warrior' ? 'Impressively.' : 'Sort of.'}`); } },
      roar: { run() { say('emote', `${esc(u.name)} roars with bloodthirst!`); sound.horn(); } },
      bow: { run() { say('emote', `${esc(u.name)} bows deeply.`); } },
      salute: { run() { say('emote', `${esc(u.name)} salutes.`); } },
      kiss: { run() { say('emote', `${esc(u.name)} blows a kiss. It lands on a murloc.`); } },
      leeroy: { run() { achievements.unlock('konami'); say('yell', 'LEEEEEEEEEEROY JENKINS!'); bus.emit('leeroy'); } },
      murloc: { run() { sound.murloc(); say('emote', 'Mrglglglglgl! RwlRwlRwlRwl!'); } },
      mrgl: { run() { cmds.murloc.run('', ''); } },
      armeldan: { run() { if (!achievements.has('secret-file')) { say('err', 'The word means nothing to you. Not yet.'); return; } achievements.unlock('rune'); say('whisper', '[A.] whispers: So you found it. The bells were never the point. Keep building. Adventure. Forever.'); sound.whisper(); } },
      sudo: { run() { say('err', `${esc(u.name)} is not in the sudoers file. This incident will be reported to the Warchief.`); } },
      rm: { run(a) { if (a.includes('-rf')) { say('err', 'Nice try. The Grave keeps its dead.'); sound.boom(); } else say('err', 'Use the Bags to move items to the Grave.'); } },
      xp: { run(a) { if (a.trim() === 'cheat') { say('err', 'No.'); return; } sys(`XP: ${u.xp}`); } },
      forever: { run() { say('gold', '<b>Adventure. Forever.</b>'); grantXp(20, 'forever'); } },
      fps: { run() { let f = 0; const t0 = performance.now(); const c = () => { f++; if (performance.now() - t0 < 1000) requestAnimationFrame(c); else sys(`~${f} FPS`); }; requestAnimationFrame(c); } },
      reset: { run(a) { if (a.trim() !== 'everything') { say('err', 'Type /reset everything to wipe GeekOS (characters, achievements, bags).'); return; } store.wipe(); location.reload(); } },
    };
    const reply = (text: string) => { const t = text.toLowerCase(); setTimeout(() => { if (t.includes('hello') || t.includes('hi')) say('say', `[Innkeeper Allison] says: Welcome, ${esc(u.name)}! Rooms upstairs.`); else if (t.includes('forever')) say('say', `[Innkeeper Allison] says: November 4. I have the date carved above the door.`); else if (t.includes('hogger')) say('yell', '[Hogger] yells: GRRR!'); }, 700); };

    let leeroyTimer: number | undefined;
    const runCmd = (raw: string) => {
      const line = raw.trim(); if (!line) return;
      history.push(line); if (history.length > 100) history.shift(); store.set('console.history', history); hi = history.length;
      say('say', `<span class="dim">&gt;</span> ${esc(line)}`);
      if (!line.startsWith('/')) { cmds.say.run(line, line); return; }
      const [name, ...rest] = line.slice(1).split(' '); const c = cmds[name.toLowerCase()];
      if (!c) { say('err', `Unknown command: /${esc(name)}. Type /help.`); sound.error(); return; }
      c.run(rest.join(' '), line); grantXp(1, 'console'); bus.emit('console:cmd', name.toLowerCase());
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { runCmd(input.value); input.value = ''; }
      else if (e.key === 'ArrowUp') { if (hi > 0) { hi--; input.value = history[hi]; } e.preventDefault(); }
      else if (e.key === 'ArrowDown') { if (hi < history.length - 1) { hi++; input.value = history[hi]; } else { hi = history.length; input.value = ''; } e.preventDefault(); }
      else if (e.key === 'Tab') { e.preventDefault(); const v = input.value; if (v.startsWith('/')) { const m = Object.keys(cmds).filter(k => cmds[k].help && k.startsWith(v.slice(1).toLowerCase())); if (m.length === 1) input.value = '/' + m[0] + ' '; else if (m.length) sys(m.map(x => '/' + x).join('  ')); } }
    });
    log.addEventListener('click', () => input.focus());
    setTimeout(() => input.focus(), 50);
    if (ctx.args?.cmd) setTimeout(() => runCmd(ctx.args.cmd), 100);
    const offLeeroy = bus.on('leeroy', () => { say('yell', 'Time\'s up, let\'s do this.'); });
    const offFocus = bus.on('win:focus', (w: any) => { if (w === ctx.win) setTimeout(() => input.focus(), 30); });
    return () => { offLeeroy(); offFocus(); clearTimeout(leeroyTimer); };
    void apps;
  },
};
