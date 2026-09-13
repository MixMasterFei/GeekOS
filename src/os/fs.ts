/**
 * Virtual filesystem ("Bags") persisted in the store. Seeded with lore-flavoured files.
 */
import { store, bus, uid } from './kernel';

export interface FsNode { id: string; name: string; type: 'folder' | 'text' | 'image' | 'audio' | 'letter' | 'app'; parent: string | null; content?: string; created: number; modified: number; hidden?: boolean; quality?: string; app?: string; meta?: Record<string, any>; }

const SEED: Omit<FsNode, 'id' | 'created' | 'modified'>[] = [];

function seed(): FsNode[] {
  const now = Date.now(); const nodes: FsNode[] = [];
  const mk = (n: Omit<FsNode, 'id' | 'created' | 'modified'> & { id?: string }) => { const node: FsNode = { id: n.id ?? uid(), created: now, modified: now, ...n }; nodes.push(node); return node; };
  const root = mk({ id: 'root', name: 'Backpack', type: 'folder', parent: null });
  const docs = mk({ id: 'docs', name: 'Scrolls', type: 'folder', parent: root.id });
  const pics = mk({ id: 'pics', name: 'Vistas', type: 'folder', parent: root.id });
  const music = mk({ id: 'music', name: 'Tavern Songs', type: 'folder', parent: root.id });
  const quests = mk({ id: 'questsdir', name: 'Quest Items', type: 'folder', parent: root.id });
  mk({ name: 'Welcome to GeekOS.txt', type: 'text', parent: docs.id, quality: 'uncommon', content: `Welcome, adventurer.

GeekOS is a desktop built as a love letter to the original world of Azeroth and to World of Warcraft: Forever, launching November 4, 2026.

A few things worth knowing:
- Alt+Space opens the Hearth menu. Alt+\` opens the Command Console.
- The Console understands slash commands. /help lists most of them.
- Right-click almost anything. Tooltips tell the truth.
- You gain experience for using the OS. Level 60 changes something.
- Hidden achievements are scattered around. Some are in this very bag.

Adventure. Forever.` });
  mk({ name: 'Forever launch checklist.txt', type: 'text', parent: docs.id, content: `[ ] Opt in to beta (Sep 17 – Oct 21)
[ ] Reserve name (Oct 27 – Nov 3)
[ ] Pick a faction (Windshaper or High Order if Skyborne)
[ ] Decide: Forsaken Paladin or Dwarf Shaman?
[ ] Clear the evening of November 4 (3:00 PM PST)
[ ] Stock up on snacks for Hyjal Summit on December 9` });
  mk({ name: 'Roadmap notes.txt', type: 'text', parent: docs.id, content: `Forever — what's next (from the What's Next panel)

Launch: November 4, 2026, 3:00 PM PST
First raid unlock: December 9
Then: more raids, dungeons, PvP updates, world content, expanded 1–60 quests, Hardcore mode, a revamped iconic raid, and major ongoing updates.

"This is not a mode, a season, or a new version of Classic. It is a promise to keep building this world with the community."` });
  mk({ name: 'Hearthstone', type: 'app', parent: quests.id, app: 'hearth', quality: 'common', meta: { flavor: 'Home is where the hearth is.' } });
  mk({ name: 'Zephras Compass', type: 'app', parent: quests.id, app: 'atlas', quality: 'rare' });
  mk({ name: 'Forever Codex', type: 'app', parent: quests.id, app: 'codex', quality: 'epic' });
  mk({ name: 'Crafted Campfire', type: 'app', parent: quests.id, app: 'camp', quality: 'uncommon' });
  mk({ name: 'Carve A New Path.vista', type: 'image', parent: pics.id, meta: { wall: 'key-art' } });
  mk({ name: 'Zephras Isle.vista', type: 'image', parent: pics.id, meta: { wall: 'zephras' } });
  mk({ name: 'Riverglades.vista', type: 'image', parent: pics.id, meta: { wall: 'riverglades' } });
  mk({ name: 'Tirisfal Glades.vista', type: 'image', parent: pics.id, meta: { wall: 'tirisfal' } });
  mk({ name: 'Hall of Thanes.vista', type: 'image', parent: pics.id, meta: { wall: 'thanes' } });
  mk({ name: 'Skyborne.vista', type: 'image', parent: pics.id, meta: { wall: 'skyborne-bg' } });
  mk({ name: 'Tavern in the Riverglades.song', type: 'audio', parent: music.id, meta: { track: 'tavern' } });
  mk({ name: 'Wind over Zephras.song', type: 'audio', parent: music.id, meta: { track: 'zephras' } });
  mk({ name: 'Beneath Ironforge.song', type: 'audio', parent: music.id, meta: { track: 'forge' } });
  mk({ name: 'Lordaeron Requiem.song', type: 'audio', parent: music.id, meta: { track: 'requiem' } });
  mk({ name: 'Rally at Hyjal.song', type: 'audio', parent: music.id, meta: { track: 'rally' } });
  // hidden easter egg: a letter that should not exist, in the trash
  const trash = mk({ id: 'trash', name: 'Grave', type: 'folder', parent: null });
  mk({ id: 'murloc', name: 'Something wet', type: 'app', parent: trash.id, app: 'murloc', quality: 'poor', meta: { flavor: 'It blinks. Mrgl.' } });
  mk({ id: 'scarlet', name: 'Unsent letter.letter', type: 'letter', parent: trash.id, quality: 'legendary', content: `To whoever opens this,

They said the throne room would be quiet after the bells fell silent. It is not. If you are reading this in the Grave, you have found the one thing that should have stayed buried.

Take the rune that was carved in the hearth. Say it in the Console.

— A.` });
  return nodes;
}

let nodes: FsNode[] = store.get<FsNode[]>('fs', []);
if (!nodes.length) { nodes = seed(); store.set('fs', nodes); }
const save = () => { store.set('fs', nodes); bus.emit('fs:change'); };

export const fs = {
  all: () => nodes,
  get: (id: string) => nodes.find(n => n.id === id),
  children: (parent: string) => nodes.filter(n => n.parent === parent).sort((a, b) => (a.type === 'folder' ? 0 : 1) - (b.type === 'folder' ? 0 : 1) || a.name.localeCompare(b.name)),
  path(id: string): FsNode[] { const out: FsNode[] = []; let cur = this.get(id); while (cur) { out.unshift(cur); cur = cur.parent ? this.get(cur.parent) : undefined; } return out; },
  create(parent: string, name: string, type: FsNode['type'], content = ''): FsNode { const n: FsNode = { id: uid(), name, type, parent, content, created: Date.now(), modified: Date.now() }; nodes.push(n); save(); return n; },
  rename(id: string, name: string) { const n = this.get(id); if (n) { n.name = name; n.modified = Date.now(); save(); } },
  write(id: string, content: string) { const n = this.get(id); if (n) { n.content = content; n.modified = Date.now(); save(); } },
  move(id: string, parent: string) { const n = this.get(id); if (n && id !== parent) { n.parent = parent; save(); } },
  trash(id: string) { this.move(id, 'trash'); },
  remove(id: string) { const kill = (x: string) => { nodes.filter(n => n.parent === x).forEach(c => kill(c.id)); nodes = nodes.filter(n => n.id !== x); }; kill(id); save(); },
  emptyTrash() { nodes.filter(n => n.parent === 'trash' && n.id !== 'scarlet' && n.id !== 'murloc').forEach(n => this.remove(n.id)); },
  reset() { nodes = seed(); save(); },
  find: (q: string) => nodes.filter(n => n.name.toLowerCase().includes(q.toLowerCase())),
};
void SEED;
