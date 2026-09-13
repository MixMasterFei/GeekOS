/**
 * Achievements & easter-egg tracker. Unlocks persist in the store.
 * Hidden achievements are the "mysteries & surprises" the community can hunt.
 */
import { store, bus, grantXp } from './kernel';
import { achievementBanner } from './ui';

export interface Achievement { id: string; name: string; desc: string; points: number; hidden?: boolean; icon?: string; hint?: string; }

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-login', icon: 'hearth', name: 'Welcome to Azeroth', desc: 'Log in to GeekOS for the first time.', points: 10 },
  { id: 'open-10', icon: 'portal', name: 'Window Shopping', desc: 'Open 10 windows in a single session.', points: 10 },
  { id: 'quest-first', icon: 'quest', name: 'Adventurer', desc: 'Complete your first quest in the Quest Log.', points: 10 },
  { id: 'quest-10', icon: 'book', name: 'Loremaster of the Desk', desc: 'Complete 10 quests.', points: 25 },
  { id: 'hearth', icon: 'hearth', name: 'Home Is Where the Hearth Is', desc: 'Use your Hearthstone.', points: 10 },
  { id: 'console-dance', icon: 'flute', name: 'Dance Dance Resolution', desc: 'Type /dance in the Command Console.', points: 10 },
  { id: 'played', icon: 'clock', name: 'Time Well Spent', desc: 'Check your /played time.', points: 5 },
  { id: 'sweeper-win', icon: 'sweeper', name: 'Gnomish Engineering', desc: 'Clear a Gnomish Sweeper field without exploding.', points: 25 },
  { id: 'level-10', icon: 'sparkles', name: 'Getting Started', desc: 'Reach level 10.', points: 10 },
  { id: 'level-60', icon: 'legacy', name: 'Forever Ready', desc: 'Reach level 60. The journey was the point.', points: 100 },
  { id: 'codex-all', icon: 'codex', name: 'Explorer', desc: 'Read every entry in the Forever Codex.', points: 25 },
  { id: 'chronicle-all', icon: 'tome', name: 'Loremaster', desc: 'Read every entry in the Chronicle. You remember now.', points: 25 },
  { id: 'calendar-launch', icon: 'calendar', name: 'Save the Date', desc: 'Find the Forever launch on the Calendar.', points: 10 },
  { id: 'camp', icon: 'camp', name: 'By the Fire', desc: 'Pitch a camp with the Camping app.', points: 10 },
  { id: 'night-owl', icon: 'time', name: 'Night Owl', desc: 'Use GeekOS between 3:00 and 4:00 in the morning.', points: 10, hidden: true, hint: 'Insomnia rewards the patient.' },
  { id: 'konami', icon: 'bloodlust', name: 'Leeeeeroy!', desc: 'At least you have chicken.', points: 25, hidden: true, hint: 'An old code, older than Azeroth.' },
  { id: 'murloc', icon: 'murloc', name: 'Mrglglglgl', desc: 'You found the murloc. He found you first.', points: 15, hidden: true, hint: 'Something is hiding in the trash.' },
  { id: 'who-thrall', icon: 'horde', name: 'For the Horde!', desc: 'Ask the console /who Thrall.', points: 10, hidden: true, hint: 'Wonder where the Warchief went.' },
  { id: 'roll-100', icon: 'dice', name: 'Natural 100', desc: 'Roll a 100 on /roll.', points: 15, hidden: true, hint: 'Luck favours the persistent.' },
  { id: 'roll-1', icon: 'bomb', name: 'Critically Unlucky', desc: 'Roll a 1 on /roll.', points: 5, hidden: true },
  { id: 'insane', icon: 'orb', name: 'The Insane', desc: 'Open 40 windows at once. Why.', points: 50, hidden: true, hint: 'More. More windows.' },
  { id: 'chicken', icon: 'potion', name: 'Cluck cluck', desc: 'Use /chicken. You know what you did.', points: 5, hidden: true },
  { id: 'wallpaper-all', icon: 'gallery', name: 'Vista Collector', desc: 'Cycle through every wallpaper.', points: 10, hidden: true, hint: 'Every vista deserves a look.' },
  { id: 'secret-file', icon: 'letter', name: 'The Scarlet Letter', desc: 'Open the hidden letter in the Bags.', points: 20, hidden: true, hint: 'A letter that should not exist.' },
  { id: 'eleven-eleven', icon: 'clock', name: 'Eleven Eleven', desc: 'Look at the clock at exactly 11:11.', points: 5, hidden: true },
  { id: 'launch-day', icon: 'legacy', name: 'Adventure. Forever.', desc: 'Be logged in on November 4, 2026.', points: 50, hidden: true, hint: 'The day everything begins.' },
  { id: 'forsaken-paladin', icon: 'class:paladin', name: 'Light, Undying', desc: 'Roll a Forsaken Paladin at the character screen.', points: 15, hidden: true, hint: 'A combination the Forever era made possible.' },
  { id: 'dwarf-shaman', icon: 'class:shaman', name: 'Stone and Storm', desc: 'Roll a Dwarf Shaman at the character screen.', points: 15, hidden: true },
  { id: 'skyborne', icon: 'skyborne', name: 'Gales Guide You', desc: 'Roll a Skyborne.', points: 15, hidden: true },
  { id: 'chess', icon: 'chess', name: 'Checkmate, Medivh', desc: 'Win a game of Karazhan Chess against the tower.', points: 30, hidden: true, hint: 'The tower still plays.' },
  { id: 'rune', icon: 'rune', name: 'Whisper of the Hearth', desc: 'Speak the rune carved under the Hearthstone.', points: 30, hidden: true, hint: 'The letter told you where to look.' },
  { id: 'jenkins-title', icon: 'gem', name: 'Titled', desc: 'Equip a title from the Talents app.', points: 5 },
  { id: 'terminal-help', icon: 'faq', name: 'Read the Manual', desc: 'Type /help in the Command Console.', points: 5 },
];

const unlocked = new Set<string>(store.get<string[]>('achievements', []));

export const achievements = {
  all: ACHIEVEMENTS,
  has: (id: string) => unlocked.has(id),
  unlocked: () => [...unlocked],
  points: () => ACHIEVEMENTS.filter(a => unlocked.has(a.id)).reduce((s, a) => s + a.points, 0),
  totalPoints: () => ACHIEVEMENTS.reduce((s, a) => s + a.points, 0),
  unlock(id: string) {
    if (unlocked.has(id)) return false;
    const a = ACHIEVEMENTS.find(x => x.id === id); if (!a) return false;
    unlocked.add(id); store.set('achievements', [...unlocked]);
    achievementBanner(a.name, a.desc, a.points, a.icon);
    grantXp(a.points * 6, `achievement:${id}`);
    bus.emit('achievement', a);
    return true;
  },
  reset() { unlocked.clear(); store.del('achievements'); },
};

/** Counter helper for "do X n times" achievements. */
export function bump(key: string, threshold: number, achievementId: string) {
  const n = store.get<number>('count.' + key, 0) + 1;
  store.set('count.' + key, n);
  if (n >= threshold) achievements.unlock(achievementId);
  return n;
}
