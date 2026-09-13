/**
 * Quest engine. Story quests and daily quests are tracked by the system:
 * objectives listen to real activity on the event bus and complete themselves.
 * Player-written quests keep manual objectives (they are a to-do list).
 */
import { store, bus, uid, grantXp, rand } from './kernel';
import { sound } from './sound';
import { notify } from './ui';
import { achievements, bump } from './achievements';

export interface Track { event: string; match?: string; count?: number; }
export interface Objective { text: string; done: boolean; track?: Track; progress?: number; }
export interface Quest { id: string; title: string; zone: string; text: string; objectives: Objective[]; done: boolean; created: number; completed?: number; xp: number; priority: 'normal' | 'elite' | 'legendary'; kind: 'story' | 'daily' | 'player'; giver?: string; next?: string; expires?: number; }

const T = (event: string, match?: string, count = 1): Track => ({ event, match, count });

/** Story chain, unlocked in order. */
const STORY: Omit<Quest, 'done' | 'created' | 'kind'>[] = [
  { id: 's1', title: 'Welcome to GeekOS', zone: 'Side Quests', giver: 'Innkeeper Allison', text: 'Every adventurer starts somewhere. Learn the lay of the land before the real work begins.', priority: 'normal', xp: 60, next: 's2',
    objectives: [{ text: 'Open the Command Console', done: false, track: T('win:open', 'console') }, { text: 'Type /help in the Console', done: false, track: T('console:cmd', 'help') }, { text: 'Change the vista (F7 or right-click the desktop)', done: false, track: T('wall:change') }] },
  { id: 's2', title: 'The Road to November', zone: 'Forever Prep', giver: 'Skyborne Emissary', text: 'World of Warcraft: Forever launches November 4, 2026. Know what is coming.', priority: 'elite', xp: 120, next: 's3',
    objectives: [{ text: 'Read 3 entries of the Forever Codex', done: false, track: T('codex:read', undefined, 3) }, { text: 'Find launch day on the Calendar', done: false, track: T('calendar:launch') }, { text: 'Open the Forever Countdown', done: false, track: T('win:open', 'countdown') }] },
  { id: 's3', title: 'Know Your Enemy', zone: 'Forever Prep', giver: 'Grimtotem', text: 'Nine dungeons and two raids. A tank likes to know the floor plan.', priority: 'normal', xp: 90, next: 's4',
    objectives: [{ text: 'Open the Dungeon Journal', done: false, track: T('win:open', 'dungeons') }, { text: 'Find 2 dungeons on the Atlas', done: false, track: T('atlas:pin', undefined, 2) }, { text: 'Roll for loot once', done: false, track: T('dj:roll') }] },
  { id: 's4', title: 'Hearth and Home', zone: 'Side Quests', giver: 'Innkeeper Allison', text: 'A hearthstone is worthless if you never use it.', priority: 'normal', xp: 80, next: 's5',
    objectives: [{ text: 'Use your Hearthstone', done: false, track: T('hearth:use') }, { text: 'Pitch a campfire in the Camp app', done: false, track: T('camp:start') }, { text: 'Play a song in the Jukebox', done: false, track: T('jukebox:play') }] },
  { id: 's5', title: 'Letters and Scrolls', zone: 'Side Quests', giver: 'Pixelbrand', text: 'The guild runs on mail. So does the desk.', priority: 'normal', xp: 80, next: 's6',
    objectives: [{ text: 'Read 2 letters in the Mailbox', done: false, track: T('mail:read', undefined, 2) }, { text: 'Send a letter', done: false, track: T('mail:send') }, { text: 'Save a scroll with the Scribe', done: false, track: T('scribe:save') }, { text: 'Say something in the Guild Hall', done: false, track: T('guild:say') }] },
  { id: 's6', title: 'Tavern Games', zone: 'Side Quests', giver: 'Kazzrik', text: 'Between raids, a rogue keeps sharp at the tables.', priority: 'elite', xp: 150, next: 's7',
    objectives: [{ text: 'Clear a Gnomish Sweeper field', done: false, track: T('sweeper:win') }, { text: 'Play 10 moves of Karazhan Chess', done: false, track: T('chess:move', undefined, 10) }, { text: 'Roll a /roll in the Console', done: false, track: T('console:cmd', 'roll') }] },
  { id: 's7', title: 'Herald of Azeroth', zone: 'Forever Prep', giver: 'Velaria', text: 'Blizzard keeps talking. GeekOS keeps listening. Stay informed until launch.', priority: 'normal', xp: 90, next: 's8',
    objectives: [{ text: 'Open the Herald', done: false, track: T('win:open', 'news') }, { text: 'Read the latest Forever article', done: false, track: T('news:read') }, { text: 'Equip a title in Talents', done: false, track: T('title:set') }] },
  { id: 's8', title: 'Forever Ready', zone: 'Forever Prep', giver: 'A.', text: 'Some things in this desk were buried on purpose. Dig.', priority: 'legendary', xp: 300,
    objectives: [{ text: 'Find what hides in the Grave', done: false, track: T('achievement', 'murloc') }, { text: 'Read the letter that should not exist', done: false, track: T('achievement', 'secret-file') }, { text: 'Speak the rune', done: false, track: T('achievement', 'rune') }, { text: 'Reach level 10', done: false, track: T('levelup:10') }] },
];

/** Daily pool: three are picked each day, tracked automatically, reset at midnight. */
const DAILIES: { title: string; text: string; objectives: Objective[]; xp: number }[] = [
  { title: 'Morning Reading', text: 'The Codex does not read itself.', xp: 40, objectives: [{ text: 'Read 2 Codex entries', done: false, track: T('codex:read', undefined, 2) }] },
  { title: 'Check the Herald', text: 'News from Azeroth arrives every few hours.', xp: 30, objectives: [{ text: 'Open the Herald', done: false, track: T('win:open', 'news') }] },
  { title: 'Sweep the Workshop', text: 'The gnomes left bombs again.', xp: 50, objectives: [{ text: 'Win a game of Gnomish Sweeper', done: false, track: T('sweeper:win') }] },
  { title: 'A Song for the Road', text: 'The band plays for anyone who listens.', xp: 30, objectives: [{ text: 'Play a song in the Jukebox', done: false, track: T('jukebox:play') }] },
  { title: 'By the Fire', text: 'Sit. Focus. Earn the buff.', xp: 60, objectives: [{ text: 'Complete a Camp session', done: false, track: T('camp:session') }] },
  { title: 'Guild Business', text: 'Pixelbrand wants signs of life.', xp: 30, objectives: [{ text: 'Say 3 things in the Guild Hall', done: false, track: T('guild:say', undefined, 3) }] },
  { title: 'Cartography', text: 'Every pin on the Atlas has a story.', xp: 40, objectives: [{ text: 'Click 3 pins on the Atlas', done: false, track: T('atlas:pin', undefined, 3) }] },
  { title: 'Dice Night', text: 'Luck is a stat.', xp: 30, objectives: [{ text: 'Use /roll 3 times', done: false, track: T('console:cmd', 'roll', 3) }] },
  { title: 'Loot Council', text: 'Somebody has to roll.', xp: 30, objectives: [{ text: 'Roll for loot in the Dungeon Journal twice', done: false, track: T('dj:roll', undefined, 2) }] },
  { title: 'Change of Scenery', text: 'A new vista, a new mood.', xp: 20, objectives: [{ text: 'Change the vista', done: false, track: T('wall:change') }] },
  { title: 'Correspondence', text: 'Write it down before you forget.', xp: 30, objectives: [{ text: 'Send yourself a letter', done: false, track: T('mail:send') }] },
  { title: 'The Tower Plays', text: 'Medivh is waiting.', xp: 60, objectives: [{ text: 'Play 20 moves of Karazhan Chess', done: false, track: T('chess:move', undefined, 20) }] },
];

let quests: Quest[] = store.get<Quest[]>('quests2', []);
const save = () => { store.set('quests2', quests); bus.emit('quests:change'); };
const dayKey = () => new Date().toISOString().slice(0, 10);

function offerStory(id: string) {
  if (quests.some(q => q.id === id)) return;
  const s = STORY.find(x => x.id === id); if (!s) return;
  const q: Quest = { ...structuredClone(s), done: false, created: Date.now(), kind: 'story' };
  quests.unshift(q); save();
  sound.quest(); notify('New quest', `<b>${q.title}</b> from ${q.giver ?? 'Azeroth'}.`, 'quest', { sound: false, timeout: 5000 });
}
function rollDailies() {
  const today = dayKey();
  if (store.get('quests2.dailyDay', '') === today && quests.some(q => q.kind === 'daily')) return;
  quests = quests.filter(q => q.kind !== 'daily' || q.done);
  const pool = [...DAILIES]; const picks: typeof DAILIES = [];
  while (picks.length < 3 && pool.length) picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  const end = new Date(); end.setHours(24, 0, 0, 0);
  picks.forEach(d => quests.push({ id: 'd-' + uid(), title: d.title, zone: 'Daily', text: d.text, objectives: structuredClone(d.objectives), done: false, created: Date.now(), xp: d.xp, priority: 'normal', kind: 'daily', giver: rand(['Innkeeper Allison', 'Pixelbrand', 'Bramblefoot', 'Thundorin']), expires: end.getTime() }));
  store.set('quests2.dailyDay', today); save();
}
function complete(q: Quest) {
  q.done = true; q.completed = Date.now(); q.objectives.forEach(o => o.done = true);
  save(); sound.quest(); grantXp(q.xp, 'quest:' + q.id);
  notify('Quest complete', `<b>${q.title}</b> · +${q.xp} XP`, 'quest', { sound: false, timeout: 5000 });
  achievements.unlock('quest-first'); bump('quests-done', 10, 'quest-10');
  if (q.next) setTimeout(() => offerStory(q.next!), 1500);
}
function onEvent(event: string, payload?: any) {
  const match = typeof payload === 'string' ? payload : payload?.id ?? payload?.appId ?? payload?.match ?? '';
  let changed = false;
  for (const q of quests) {
    if (q.done || q.kind === 'player') continue;
    let touched = false;
    for (const o of q.objectives) {
      if (o.done || !o.track || o.track.event !== event) continue;
      if (o.track.match && o.track.match !== match) continue;
      o.progress = (o.progress ?? 0) + 1; changed = true; touched = true;
      if (o.progress >= (o.track.count ?? 1)) { o.done = true; sound.tick(); }
    }
    if (touched && q.objectives.length && q.objectives.every(o => o.done)) complete(q);
  }
  if (changed) save();
}

let wired = false;
export const questEngine = {
  all: () => quests,
  active: () => quests.filter(q => !q.done),
  init() {
    quests = store.get<Quest[]>('quests2', []);
    if (!quests.length || !quests.some(q => q.kind === 'story')) offerStory('s1');
    rollDailies();
    if (wired) return; wired = true;
    // route real activity into objectives
    bus.on('win:open', (w: any) => onEvent('win:open', w?.appId));
    ['console:cmd', 'wall:change', 'codex:read', 'calendar:launch', 'atlas:pin', 'dj:roll', 'hearth:use', 'camp:start', 'camp:session', 'jukebox:play', 'mail:read', 'mail:send', 'scribe:save', 'guild:say', 'sweeper:win', 'chess:move', 'chess:win', 'news:read', 'title:set', 'armory:lookup'].forEach(ev => bus.on(ev, (p: any) => onEvent(ev, p)));
    bus.on('achievement', (a: any) => { if (a?.id) onEvent('achievement', a.id); });
    bus.on('levelup', (lvl: number) => { for (let l = 1; l <= lvl; l++) onEvent('levelup:' + l); });
    setInterval(rollDailies, 60 * 1000);
  },
  addPlayerQuest(title: string): Quest { const q: Quest = { id: uid(), title, zone: 'Player', text: '', objectives: [], done: false, created: Date.now(), xp: 60, priority: 'normal', kind: 'player' }; quests.unshift(q); save(); sound.quest(); return q; },
  toggleObjective(q: Quest, i: number) { if (q.kind !== 'player') return; const o = q.objectives[i]; o.done = !o.done; sound.click(); if (o.done) grantXp(5, 'objective'); if (q.objectives.length && q.objectives.every(x => x.done)) complete(q); else save(); },
  completePlayer(q: Quest) { if (q.kind !== 'player') return; if (q.done) { q.done = false; q.completed = undefined; q.objectives.forEach(o => o.done = false); save(); } else complete(q); },
  abandon(q: Quest) { quests = quests.filter(x => x !== q); save(); if (q.kind === 'story') offerStory(q.id); },
  update(q: Quest, patch: Partial<Quest>) { Object.assign(q, patch); save(); },
  addObjective(q: Quest, text: string) { if (q.kind !== 'player') return; q.objectives.push({ text, done: false }); save(); },
  removeObjective(q: Quest, i: number) { if (q.kind !== 'player') return; q.objectives.splice(i, 1); save(); },
  reset() { quests = []; store.del('quests2'); store.del('quests2.dailyDay'); offerStory('s1'); rollDailies(); },
};
