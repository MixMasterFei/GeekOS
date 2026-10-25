/**
 * Forever Codex data — compiled from Blizzard's public announcements
 * (Sept 12–13, 2026: reveal post, What's Next panel recap, official Forever page).
 * Text is original prose summarising public facts; nothing is copied verbatim.
 */
export interface CodexEntry { id: string; name: string; sub?: string; text: string; tags?: string[]; level?: string; icon?: string; faction?: 'horde' | 'alliance' | 'neutral'; image?: string; }
export interface CodexSection { id: string; title: string; icon: string; blurb: string; entries: CodexEntry[]; }

export const CODEX: CodexSection[] = [
  {
    id: 'overview', title: 'The Promise', icon: 'legacy', blurb: 'What World of Warcraft: Forever is, and what it is not.',
    entries: [
      { id: 'what', image: '/art/key-art-wide.jpg', name: 'What is Forever?', sub: 'A new permanent home', text: 'World of Warcraft: Forever is Blizzard\'s third permanent way to play WoW, alongside modern and Classic. It anchors the game in its first age: the original continents, a level cap of 60, and a world built to be the main character. It is included with any active subscription or Game Time. It launches worldwide on November 4, 2026 at 3:00 PM PST.', tags: ['launch'] },
      { id: 'pillars', image: '/art/riverglades-road.jpg', name: 'Four Pillars', sub: 'Design principles from the What\'s Next panel', text: 'Approachable and familiar. The world as the main character. The journey over the destination. Protect social gameplay. In practice: no flying mounts, no level scaling, deliberate challenge, and convenience features chosen only when they bring players together.' },
      { id: 'when', image: '/art/tirisfal-fog.jpg', name: 'Where in the Timeline', sub: 'After Forsaken Kingdom, before Molten Core', text: 'Forever is set after the events of Warcraft III Reforged: Forsaken Kingdom and before the opening of Molten Core. Old threats are still fresh; new ones stalk the edges of familiar zones.' },
      { id: 'quote', image: '/art/cinematic.jpg', name: '"Not a mode, not a season"', sub: 'The team\'s own words', text: 'Blizzard framed Forever as a promise rather than a product line: not a mode, a season, or another version of Classic, but a commitment to keep building this version of the world with the community, through regular content updates for years.' },
      { id: 'team', image: '/art/news-carve-1.jpg', name: 'The People', sub: 'Named at the reveal', text: 'Senior Game Director Ion Hazzikostas, Lead Classic Designer Tim Jones, Lead Software Engineer Nora Mills, and Associate Production Director Clay Stone presented the reveal and the What\'s Next panel at BlizzCon 2026.' },
    ],
  },
  {
    id: 'zones', title: 'New Zones', icon: 'atlas', blurb: 'Three new regions, one hidden hollow, and more than a thousand new quests.',
    entries: [
      { id: 'zephras', image: '/art/zephras-isle.jpg', name: 'Zephras Isle', sub: 'Levels 1–12 · Skyborne starting zone', level: '1–12', faction: 'neutral', text: 'A once-secluded island oasis in the sky, with Skywall-inspired aesthetics and an elemental, skybound feel. It is the starting experience for the Skyborne, and the place their future is decided. Access to the Zephras Isle questline requires the Skyborne Heroic Pack or higher.', tags: ['starting zone', 'skyborne'] },
      { id: 'riverglades', image: '/art/riverglades.jpg', name: 'The Riverglades', sub: 'Levels 30s–40s · Eastern Kingdoms', level: '30–40', text: 'A sprawling landscape of frontier rivers, grasslands, and old trade routes, shifting from lush hillsides to the ruined keeps of old. More than 150 new quests explore community and conflict along the water.' },
      { id: 'hyjal', image: '/art/hyjal-summit.jpg', name: 'Mount Hyjal', sub: 'Levels 40s–50s · Kalimdor', level: '40–50', text: 'The mountain after Archimonde. Threats both old and new stalk its slopes, eager to claim its power. Expect the aftermath of the Third War, the restoration of scorched land, and Darkwhisper Gorge. Hyjal Summit, a 20-player raid, sits at the top.' },
      { id: 'shendralas', image: '/art/shendralas.jpg', name: "Shen'dralas", sub: 'Mid-level · Hidden between Mulgore and Desolace', level: '20–35', text: "A hidden mystery zone connecting to the Shen'dralar, Eldre'Thalas, Dire Maul, and the centaur tribes. Lower on the marketing, higher on the secrets." },
      { id: 'expanded', image: '/art/ashenvale-sunbeams.jpg', name: 'Expanded Classic Zones', sub: 'New stories in familiar places', text: 'Existing vanilla zones receive new quests, stories, and secrets across the whole 1–60 bracket. Lighting and environment upgrades add flowing rivers in Elwynn, mist over Darkshore, and moonlight in Ashenvale, while keeping the Classic silhouette intact.' },
    ],
  },
  {
    id: 'dungeons', title: 'Nine New Dungeons', icon: 'dungeon', blurb: 'Nine five-player dungeons across the Eastern Kingdoms and Kalimdor, for levels 13 through 60. Each carries its own storyline: reclamation, investigation, titan mysteries, naga and pirates, corruption.',
    entries: [
      { id: 'thanes', image: '/art/hall-of-thanes.jpg', name: 'Hall of Thanes', sub: 'Beneath Ironforge, Dun Morogh', level: '13–18', text: 'A dwarven hall under the mountain city. Alliance players reach the entrance easily from Ironforge, while Horde groups must brave the journey into Alliance territory. Forges, thanes, and the things sealed below them.' },
      { id: 'lordaeron', image: '/art/tirisfal-fog.jpg', name: 'Ruins of Lordaeron', sub: 'Above the Undercity, Tirisfal Glades', level: '15–20', text: 'The Forsaken reclaim what is theirs in the shattered capital above their own city. The throne room is not as quiet as it should be.' },
      { id: 'whelgar', image: '/art/whelgar-dusk.jpg', name: 'Excavation Site', sub: "Above Whelgar's Excavation, Wetlands", level: '24–29', text: 'The dig site becomes a dungeon, near Thelgen Rock and Dun Algaz. Titan mysteries, awakened guardians, and a lot of dust.' },
      { id: 'dalaran', image: '/art/moonlit-grove.jpg', name: 'City of Dalaran', sub: 'Alterac Mountains', level: '28–33', text: "The domed city of mages, explored from the inside after earning the Kirin Tor's trust. Magical investigations gone wrong." },
      { id: 'blackmaw', image: '/art/blackmaw-hold.jpg', name: 'Blackmaw Hold', sub: 'Azshara', level: '55–60', text: 'A furbolg city beyond a long-sealed gate in Azshara. Expect corruption themes, multiple routes and bosses, and a path that may lead even farther below Azeroth.' },
      { id: 'drowned', image: '/art/drowned-city.jpg', name: 'The Drowned City', sub: 'Off the coast of Stranglethorn Vale', level: '35–40', text: 'Naga, pirates, and a city under the tide, west of Grom’gol. Bring a swim speed potion for the story, not the mechanics.' },
      { id: 'kroldok', image: '/art/kroldok.jpg', name: "Krol'dok Stronghold", sub: 'Riverglades', level: '40–45', text: 'A fortress that did not surrender, raiding travelers throughout the Riverglades. Warlords, war drums, and a siege in reverse.' },
      { id: 'alcaz', image: '/art/alcaz-jungle.jpg', name: 'Alcaz Prison', sub: 'Alcaz Island, Dustwallow Marsh', level: '48–53', text: 'The island prison finally opens its cells. Some of the inmates were put there for a reason.' },
      { id: 'shaper', image: '/art/whelgar-cave.jpg', name: "Shaper's Terrace", sub: "Un'Goro Crater", level: '58–60', text: 'A terrace of the makers above Un’Goro Crater, with the machinery that shaped the world still humming.' },
    ],
  },
  {
    id: 'raids', title: 'Raids & Battlegrounds', icon: 'guild', blurb: 'Two new raids at launch cadence, one new battleground.',
    entries: [
      { id: 'summit', image: '/art/hyjal-summit.jpg', name: 'Hyjal Summit', sub: '20-player raid · Tier sets · Legendary reward', text: 'The first new raid, at the top of Mount Hyjal. 20-player encounters, tier sets, and a legendary reward whose details are still pending. The first raid unlock is scheduled for December 9.' },
      { id: 'barrow', image: '/art/alcaz-hall.jpg', name: 'Barrow Deeps', sub: '10-player max-level challenge', text: 'A tighter, harder 10-player raid for level 60 groups beneath the roots of Hyjal.' },
      { id: 'darkspear', image: '/art/darkspear-zeppelin.jpg', name: 'Darkspear Islands', sub: '15 vs 15 battleground', text: 'A hybrid battleground: strategic control points meet Arathi Basin-style flag captures and defence, on the islands of the Darkspear trolls.' },
      { id: 'iconic', image: '/art/darkspear-pirates.jpg', name: 'A Revamped Iconic Raid', sub: 'Roadmap', text: 'Blizzard listed a revamped iconic raid among post-launch content, alongside Hardcore mode and expanded 1–60 questing. Which raid is not yet announced.' },
    ],
  },
  {
    id: 'races', title: 'Races & Classes', icon: 'skyborne', blurb: 'One new race, two new combinations, and revamps to every class.',
    entries: [
      { id: 'skyborne', image: '/art/skyborne.jpg', name: 'The Skyborne', sub: 'New neutral elven race', faction: 'neutral', text: 'Windswept elves, High Elf exiles, whose secluded home faces an existential threat. Horde-aligned Skyborne follow the Windshaper path with Shaman and elemental traditions; Alliance-aligned Skyborne follow the High Order with Mage and arcane legacy. Both may be Warrior, Hunter, Rogue, or Druid, with exclusive Skyborne druid forms, racials, customisations, voices, and dances. Requires the Skyborne Heroic Pack or higher.' },
      { id: 'forsakenpal', image: '/art/forsaken-paladin.jpg', name: 'Forsaken Paladin', sub: 'New combination', faction: 'horde', text: 'The Light, undying. The reveal trailer showed a Forsaken Paladin. GeekOS lets you roll one at the character screen.' },
      { id: 'dwarfsham', image: '/art/dwarf-shaman.jpg', name: 'Dwarf Shaman', sub: 'New combination', faction: 'alliance', text: 'Stone and storm. Wildhammer traditions finally reach the Alliance roster in the Forever era.' },
      { id: 'classes', image: '/art/feat-power.jpg', name: 'Class Revamps', sub: 'Every class and specialisation', text: 'Preserve identity, add meaningful abilities, and update talents to fill gaps without erasing what makes each class unique. Rediscover a favourite or play someone entirely different.' },
      { id: 'talent-system', image: '/art/ui-talents.jpg', name: 'Talent Trees', sub: 'Level 10 and up', text: "Talents open up at level 10 with the familiar row structure, including one-point milestone talents at 11, 21 and 31 points, now joined by a new 16-point milestone. Visit a class trainer in a major city to respec, including Legacy talents, and Dual Specialization unlocks at level 40. Blizzard notes abilities and talents may keep evolving through the beta." },
      { id: 'priest-dive', name: 'Priest Deep Dive', sub: 'Light and Shadow', text: 'Fear Ward and Devouring Plague become baseline for every Priest at level 20, Divine Spirit joins the baseline kit at level 30, and Shadow Word: Death arrives at level 32 as a new baseline finisher. Discipline also gains Penance, a channelled spell that can heal allies or strike enemies.' },
      { id: 'warrior-dive', name: 'Warrior Deep Dive', sub: 'Rage, reworked', text: 'Rage generation is being reworked on both sides: Rage from taking damage now ignores Armor entirely, and Rage from dealing damage scales with weapon speed while rewarding critical strikes with 75% extra Rage.' },
      { id: 'hunter-dive', name: 'Hunter Deep Dive', sub: 'Pets and precision', text: 'Aimed Shot becomes a baseline ability at level 20, traps can now be used in combat, and Foxes join the stable as a new pet family.' },
      { id: 'druid-dive', name: 'Druid Deep Dive', sub: 'Shapeshifting, smoothed', text: 'Shapeshifted Druids can use potions and most other consumables without dropping form, Revive grants an out-of-combat resurrection spell at level 12, and the bleed ability Lacerate joins the Feral toolkit at level 42.' },
      { id: 'mage-dive', name: 'Mage Deep Dive', sub: 'Frostfire Bolt', text: 'A new spell, Frostfire Bolt, arrives at level 40 counting as both Fire and Frost damage, so talents from either school benefit it and open the door to hybrid Fire/Frost builds.' },
      { id: 'shaman-dive', name: 'Shaman Deep Dive', sub: 'Totems, tracked', text: 'Totems gain a tracking UI and weapon imbues now last 60 minutes instead of 5. The new Totemic Projection ability, learned at level 22, lets a Shaman teleport every active totem to a new spot within 30 yards.' },
    ],
  },
  {
    id: 'systems', title: 'Systems', icon: 'talents', blurb: 'Legacy, Camping, professions, honor, and quality of life.',
    entries: [
      { id: 'legacy', image: '/art/ui-legacy.jpg', name: 'Legacy', sub: 'Account-wide progression', text: 'Every time a character makes progress, the account earns benefits. Alt-friendly by design. GeekOS mirrors this with its own XP bar: using the OS levels you up.' },
      { id: 'camping', image: '/art/camping.jpg', name: 'Camping', sub: 'Crafted campfires outdoors', text: 'Pitch a crafted campfire in the open world, let professions contribute, and share buffs with the people around you. The Camp app in GeekOS is a focus timer built on the same idea.' },
      { id: 'transmog', image: '/art/feat-paths.jpg', name: 'Opt-in Transmog', sub: 'Quality of life', text: 'Transmogrification is available and optional. Modern and Classic visual presets let each player choose how the world looks.' },
      { id: 'models', image: '/art/dwarf-hd.jpg', name: 'HD and SD Models', sub: 'Toggle any time', text: 'Switch between original (SD) and updated (HD) character models, including NPCs, with restored Classic animations on the HD set.' },
      { id: 'gamepad', image: '/art/feat-stories.jpg', name: 'Gamepad Support', sub: 'Official', text: 'Official controller support arrives with Forever.' },
      { id: 'hardcore', image: '/art/felwood.jpg', name: 'Hardcore', sub: 'Post-launch', text: 'Dedicated Hardcore realms are on the roadmap. One life, one story.' },
      { id: 'graphics', image: '/art/feat-expanses.jpg', name: 'Rendering Upgrades', sub: 'New lighting, water, shadows', text: 'New lighting and global illumination, volumetric particles, a new water renderer, and real-time shadows, all tuned to preserve the Classic aesthetic.' },
    ],
  },
  {
    id: 'editions', title: 'Editions & Dates', icon: 'calendar', blurb: 'What is included, and when things happen.',
    entries: [
      { id: 'heroic', image: '/art/heroic-comp.jpg', name: 'Skyborne Heroic Pack', sub: 'Optional upgrade', text: 'Skyborne race access, the Zephras Isle starting experience, the Cerulean Prideclaw mount, early name reservation, cosmetics, housing decor, and one Invite-A-Friend code.' },
      { id: 'epic', image: '/art/epic-comp.jpg', name: 'Skyborne Epic Pack', sub: 'Optional upgrade', text: 'Everything in Heroic, plus beta access from September 17, 30 days of Game Time, extra cosmetics, pets, tabards, and three Invite-A-Friend codes.' },
      { id: 'collection', image: '/art/collection.jpg', name: 'Warcraft Forever Collection', sub: 'Limited time · through January 11, 2027', text: 'Everything in Epic, plus Warcraft III: Reforged, the Forsaken Kingdom campaign, and Forsaken and Human figurine housing decor. Made in celebration of BlizzCon 2026.' },
      { id: 'ce', image: '/art/ce-7.jpg', name: "Collector's Edition", sub: 'Blizzard Gear Store', text: 'A 13-inch Dwarf and Bear statue, a Zephras Isle mousepad, art prints, collectible pins, a companion journal, and the Warcraft Forever Collection code. While supplies last.' },
      { id: 'names', image: '/art/roadmap.jpg', name: 'Claim Your Name', sub: 'Early Name Reservation · Oct 27–Nov 3', text: 'Reservation opens region by region: North America October 27 at 1:00 PM PDT, Europe October 27 at 18:00 CET, and Korea and Taiwan October 28 at 07:00 local. Eligible players can create and reserve up to three characters total across all Rulesets; names are first-come, first-served and cannot be guaranteed.' },
      { id: 'dates', image: '/art/roadmap.jpg', name: 'Key Dates', sub: 'All times Pacific', text: 'September 12: reveal. September 17: beta begins (through October 21). October 20: Invite-A-Friend codes begin arriving. October 27 – November 3: early name reservation. November 4, 3:00 PM PST: global launch. November 4–11: Invite-A-Friend access window. December 9: first raid unlock. January 11, 2027: Warcraft Forever Collection ends.' },
    ],
  },
];

export const CODEX_COUNT = CODEX.reduce((n, s) => n + s.entries.length, 0);
