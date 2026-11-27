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
      { id: 'what', image: '/art/key-art-wide.jpg', name: 'What is Forever?', sub: 'A new permanent home', text: 'World of Warcraft: Forever is Blizzard\'s third permanent way to play WoW, alongside modern and Classic. It anchors the game in its first age: the original continents, a level cap of 60, and a world built to be the main character. It launched worldwide on November 4, 2026, and is included with any active subscription or Game Time.', tags: ['launch'] },
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
    id: 'dungeons', title: 'Nine New Dungeons', icon: 'dungeon', blurb: 'Five-player dungeons for levels 13 through 60, each with its own storyline: reclamation, investigation, titan mysteries, naga and pirates, corruption.',
    entries: [
      { id: 'thanes', image: '/art/hall-of-thanes.jpg', name: 'Hall of Thanes', sub: 'Levels 13–18 · Beneath Ironforge, Dun Morogh', level: '13–18', text: 'Dark Iron intruders have broken into the dwarven monarchs\' resting place beneath Ironforge. Alliance groups can reach the entrance easily from their capital; Horde groups have to brave Alliance territory to get there.' },
      { id: 'lordaeron', image: '/art/tirisfal-fog.jpg', name: 'Ruins of Lordaeron', sub: 'Levels 15–20 · Tirisfal Glades', level: '15–20', text: 'The Forsaken work to reclaim the ruined city above the Undercity while a necromancer gathers power among the Scourge-haunted remains. Horde groups reach it easily from the Undercity; Alliance groups must venture into Horde territory.' },
      { id: 'whelgar', image: '/art/whelgar-dusk.jpg', name: 'Excavation Site', sub: 'Levels 24–29 · Wetlands', level: '24–29', text: "Above Whelgar's Excavation near Thelgen Rock and Dun Algaz, a strange mist and flashes of light mark a place seemingly frozen in time, where errant titan constructs and dangerous wildlife guard secrets sought by the Explorers' League." },
      { id: 'dalaran', image: '/art/moonlit-grove.jpg', name: 'City of Dalaran', sub: 'Levels 28–33 · Alterac Mountains', level: '28–33', text: "Dalaran's magical barrier has fallen, leaving its streets alive with arcane chaos, backfiring enchantments and wild constructs. After earning the Kirin Tor's trust, groups enter through the sewers and choose among multiple paths toward the source of the disruption." },
      { id: 'blackmaw', image: '/art/blackmaw-hold.jpg', name: 'Blackmaw Hold', sub: 'Levels 55–60 · Azshara', level: '55–60', text: "Beyond a long-sealed gate in Azshara, the Blackmaw furbolg clan struggles against a corruption spreading through its groves and tunnels. A substantial max-level adventure with multiple routes and bosses — and perhaps a path leading even farther below Azeroth." },
      { id: 'drowned', image: '/art/drowned-city.jpg', name: 'The Drowned City', sub: 'Levels 35–40 · Off the coast of Stranglethorn Vale', level: '35–40', text: 'Ancient troll ruins have risen from the waves off Stranglethorn Vale, now roamed by trolls and naga beside the wreck of an unlucky pirate ship. Dive below the water to find the entrance, then watch mist and rain build into a full storm before the final confrontation.' },
      { id: 'kroldok', image: '/art/kroldok.jpg', name: "Krol'dok Stronghold", sub: 'Levels 40–45 · Riverglades', level: '40–45', text: 'Ogre outrunners kidnapping travelers across the Riverglades lead back to this sprawling fortress of workshops, encampments and guarded passages — and strange chanting heard from within after nightfall.' },
      { id: 'alcaz', image: '/art/alcaz-jungle.jpg', name: 'Alcaz Prison', sub: 'Levels 48–53 · Alcaz Island, Dustwallow Marsh', level: '48–53', text: 'The long-rumored prison on Alcaz Island finally opens its doors, where the Defias Brotherhood and naga are locked in conflict amid a familiar mystery about its high-ranking prisoners.' },
      { id: 'shaper', image: '/art/whelgar-cave.jpg', name: "Shaper's Terrace", sub: 'Levels 58–60 · Un\'Goro Crater', level: '58–60', text: "An ancient titan facility overlooking Un'Goro Crater, where dinosaurs, tar pits and power crystals share the grounds with the machinery that shaped the world. Crystals gathered outdoors carry into consoles within the terrace." },
    ],
  },
  {
    id: 'raids', title: 'Raids & Battlegrounds', icon: 'guild', blurb: 'Three new raids opening December 9, one new battleground.',
    entries: [
      { id: 'summit', image: '/art/hyjal-summit.jpg', name: 'Hyjal Summit', sub: '20-player raid · Tier sets · Legendary reward', text: 'The first new raid, at the top of Mount Hyjal. 20-player encounters, tier sets, and a legendary reward whose details are still pending. It opens December 9 alongside Barrow Deeps and Onyxia\'s Lair.' },
      { id: 'barrow', image: '/art/alcaz-hall.jpg', name: 'Barrow Deeps', sub: '10-player max-level challenge', text: 'A tighter, harder 10-player raid for level 60 groups beneath the roots of Hyjal.' },
      { id: 'onyxia', name: "Onyxia's Lair", sub: 'Raid · Opens December 9', text: 'The third level-60 raid arriving alongside Hyjal Summit and Barrow Deeps. Entering it for the first time asks something of a group beyond just showing up — Blizzard has promised to detail what that takes.' },
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
    ],
  },
  {
    id: 'systems', title: 'Systems', icon: 'talents', blurb: 'Legacy, Camping, professions, honor, and quality of life.',
    entries: [
      { id: 'legacy', image: '/art/ui-legacy.jpg', name: 'Legacy', sub: 'Account-wide progression', text: 'Every time a character makes progress, the account earns benefits. Alt-friendly by design. GeekOS mirrors this with its own XP bar: using the OS levels you up.' },
      { id: 'camping', image: '/art/camping.jpg', name: 'Camping', sub: 'Crafted campfires outdoors', text: 'The Cooking profession\'s Basic Campfire becomes a shared campsite: nearby players can each add one of up to three profession-crafted Camp Features, and sitting or crafting there for at least a minute grants their buffs. The Camp app in GeekOS is a focus timer built on the same idea.' },
      { id: 'rulesets', image: '/art/roadmap.jpg', name: 'Rulesets', sub: 'Chosen instead of a realm', text: 'Forever replaces realm selection with a Ruleset, a broad shared player ecosystem rather than a single server. Normal lets you choose when to fight other players; PvP keeps you almost always at risk of attack; Roleplay and Roleplay PvP add strict naming and behavior rules for in-character play. A Hardcore ruleset, for players who want permanent consequences, is coming after launch.' },
      { id: 'presets', image: '/art/feat-paths.jpg', name: 'Experience Presets', sub: 'Classic or Enhanced, chosen at first login', text: 'Before picking a Ruleset, first-time Forever players choose an Experience Preset. Classic starts with Standard Definition models, quest markers, one-bag, and transmog switched off for a cleaner, more original feel. Enhanced starts with High Definition models and those conveniences switched on. Either is just a starting point — every setting can be changed afterward.' },
      { id: 'twonames', image: '/art/feat-stories.jpg', name: 'Two-Name Characters', sub: 'Built for a realmless Azeroth', text: 'With Rulesets replacing individual realms, each character now carries two names instead of one, together forming a full name unique within its region. It gives players more room to find a name that fits their character\'s fantasy or history.' },
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
      { id: 'dates', image: '/art/roadmap.jpg', name: 'Key Dates', sub: 'All times Pacific', text: 'September 12: reveal. September 17: beta begins (through October 21). October 20: Invite-A-Friend codes begin arriving. October 27 – November 3: early name reservation. November 4, 3:00 PM PST: global launch. November 4–11: Invite-A-Friend access window. December 9: Hyjal Summit, Barrow Deeps, and Onyxia\'s Lair raid unlock. January 11, 2027: Warcraft Forever Collection ends.' },
    ],
  },
];

export const CODEX_COUNT = CODEX.reduce((n, s) => n + s.entries.length, 0);
