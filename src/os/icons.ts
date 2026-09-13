/**
 * GeekOS icon library — official World of Warcraft icons served from
 * Blizzard's own render CDN (render.worldofwarcraft.com), bundled locally
 * in /public/icons. Each key maps to an official icon file name.
 */

export const ICON_FILES: Record<string, string> = {
  hearth: 'inv_misc_rune_01', quest: 'inv_misc_note_01', mail: 'inv_letter_15', letter: 'inv_letter_02',
  bag: 'inv_misc_bag_10', folder: 'inv_misc_bag_08', trash: 'inv_misc_bone_humanskull_01',
  console: 'inv_misc_enggizmos_27', calendar: 'inv_misc_scrollunrolled02', atlas: 'inv_misc_map_01', codex: 'inv_misc_book_11',
  talents: 'spell_arcane_mindmastery', jukebox: 'inv_misc_drum_01', scribe: 'inv_inscription_tradeskill01', abacus: 'inv_misc_coin_01',
  dungeon: 'achievement_dungeon_classicdungeonmaster', sweeper: 'inv_misc_bomb_02', chess: 'spell_holy_championsbond', portal: 'spell_arcane_portaldalaran',
  settings: 'trade_engineering', achievements: 'achievement_general', countdown: 'spell_holy_borrowedtime', guild: 'achievement_guildperk_everybodysfriend',
  gallery: 'inv_misc_map08', clock: 'inv_misc_pocketwatch_01', power: 'spell_shadow_deathcoil', lock: 'inv_misc_lockbox_1',
  murloc: 'inv_misc_head_murloc_01', horde: 'achievement_pvp_h_h', alliance: 'achievement_pvp_a_a', skyborne: 'inv_feather_03',
  camp: 'spell_fire_fire', legacy: 'achievement_level_60', npc: 'inv_helmet_44', dice: 'inv_misc_dice_02',
  file: 'inv_misc_note_05', image: 'inv_misc_scrollunrolled03', audio: 'inv_misc_horn_02', faq: 'inv_misc_questionmark',
  sword: 'inv_sword_04', potion: 'inv_potion_54', sparkles: 'spell_holy_holybolt', armory: 'inv_chest_plate16',
  key: 'inv_misc_key_03', bell: 'inv_misc_bell_01', orb: 'inv_misc_orb_05', rune: 'inv_misc_rune_07', gem: 'inv_misc_gem_diamond_02',
  map2: 'inv_misc_map02', kalimdor: 'achievement_zone_kalimdor_01', easternkingdoms: 'achievement_zone_easternkingdoms_01',
  hordebanner: 'inv_bannerpvp_01', alliancebanner: 'inv_bannerpvp_02', bloodlust: 'spell_nature_bloodlust', time: 'spell_nature_timestop',
  book: 'inv_misc_book_09', tome: 'inv_misc_book_07', bomb: 'inv_misc_bomb_05', anvil: 'inv_hammer_20', flute: 'inv_misc_flute_01',
  'class:warrior': 'classicon_warrior', 'class:paladin': 'classicon_paladin', 'class:hunter': 'classicon_hunter', 'class:rogue': 'classicon_rogue',
  'class:priest': 'classicon_priest', 'class:shaman': 'classicon_shaman', 'class:mage': 'classicon_mage', 'class:warlock': 'classicon_warlock', 'class:druid': 'classicon_druid',
};

export function iconUrl(name: string): string { return `/icons/${ICON_FILES[name] ?? ICON_FILES.file}.jpg`; }

/** Returns an <img> tag for an official icon, sized by its container. */
export function icon(name: string, alt = ''): string {
  return `<img class="icon-img" src="${iconUrl(name)}" alt="${alt}" draggable="false" loading="lazy">`;
}

/** The official Forever mark (the "W" sigil) — used for the Hearth button and boot. */
export function sigil(size = 64): string {
  return `<img class="icon-img sigil-img" src="/art/forever-icon.png" width="${size}" height="${size}" alt="World of Warcraft: Forever" draggable="false">`;
}
export const LOGO_URL = '/art/forever-logo.png';

/** Minimal glyphs used by window controls and menus (no background). */
export const glyph = {
  close: `<svg viewBox="0 0 12 12"><path d="M2 2 L10 10 M10 2 L2 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  min: `<svg viewBox="0 0 12 12"><path d="M2 9 H10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  max: `<svg viewBox="0 0 12 12"><rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,
  restore: `<svg viewBox="0 0 12 12"><rect x="1.5" y="3.5" width="7" height="7" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4 3.5 V1.5 H10.5 V8 H8.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`,
  chev: `<svg viewBox="0 0 12 12"><path d="M4 2 L8 6 L4 10" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,
  search: `<svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10.5 10.5 L14 14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  plus: `<svg viewBox="0 0 12 12"><path d="M6 2 V10 M2 6 H10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  check: `<svg viewBox="0 0 12 12"><path d="M2 6.5 L5 9.5 L10 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  play: `<svg viewBox="0 0 12 12"><path d="M3 2 L10 6 L3 10z" fill="currentColor"/></svg>`,
  pause: `<svg viewBox="0 0 12 12"><rect x="2.5" y="2" width="2.5" height="8" fill="currentColor"/><rect x="7" y="2" width="2.5" height="8" fill="currentColor"/></svg>`,
  next: `<svg viewBox="0 0 12 12"><path d="M2 2 L8 6 L2 10z" fill="currentColor"/><rect x="8.5" y="2" width="2" height="8" fill="currentColor"/></svg>`,
  prev: `<svg viewBox="0 0 12 12"><path d="M10 2 L4 6 L10 10z" fill="currentColor"/><rect x="1.5" y="2" width="2" height="8" fill="currentColor"/></svg>`,
  back: `<svg viewBox="0 0 12 12"><path d="M8 2 L4 6 L8 10" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,
  up: `<svg viewBox="0 0 12 12"><path d="M2 8 L6 4 L10 8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`,
  refresh: `<svg viewBox="0 0 12 12"><path d="M10 6 A4 4 0 1 1 8.5 2.9" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 1 L9.5 3.2 L7 3.8z" fill="currentColor"/></svg>`,
  star: `<svg viewBox="0 0 12 12"><path d="M6 1 l1.5 3.2 3.5 .4 -2.6 2.4 .7 3.4 -3.1 -1.7 -3.1 1.7 .7 -3.4 -2.6 -2.4 3.5 -.4z" fill="currentColor"/></svg>`,
  trash: `<svg viewBox="0 0 12 12"><path d="M2 3 H10 M4 3 V2 H8 V3 M3 3 L3.6 10.5 H8.4 L9 3" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>`,
  grid: `<svg viewBox="0 0 12 12"><rect x="1.5" y="1.5" width="3.5" height="3.5" fill="currentColor"/><rect x="7" y="1.5" width="3.5" height="3.5" fill="currentColor"/><rect x="1.5" y="7" width="3.5" height="3.5" fill="currentColor"/><rect x="7" y="7" width="3.5" height="3.5" fill="currentColor"/></svg>`,
  list: `<svg viewBox="0 0 12 12"><path d="M2 3 H10 M2 6 H10 M2 9 H10" stroke="currentColor" stroke-width="1.6"/></svg>`,
};
