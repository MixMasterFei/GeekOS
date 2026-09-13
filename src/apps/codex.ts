/**
 * Forever Codex — everything announced, as an in-world encyclopedia.
 * Chronicle — the spoiler-free refresher for returning players.
 */
import { CODEX } from '../data/codex';
import { CHRONICLE } from '../data/chronicle';
import { makeBookApp } from './book';
import { launch } from '../os/shell';

export const codexApp = makeBookApp({
  id: 'codex', name: 'Forever Codex', subtitle: 'Everything announced, in one book', icon: 'codex', data: CODEX,
  readKey: 'codex.read', readEvent: 'codex:read', achievement: 'codex-all', heading: 'Forever Codex',
  searchPlaceholder: 'Search the Codex…', footer: 'Compiled from Blizzard\'s public announcements of September 12–13, 2026. Updated by the content routine.',
  action: (sec, e) => sec.id === 'zones' ? { label: 'Show on Atlas', run: () => launch('atlas', { zone: e.id }) } : sec.id === 'editions' && e.id === 'dates' ? { label: 'Open Calendar', run: () => launch('calendar') } : null,
});

export const chronicleApp = makeBookApp({
  id: 'chronicle', name: 'Chronicle', subtitle: 'Spoiler-free refresher for returning players', icon: 'tome', data: CHRONICLE,
  readKey: 'chronicle.read', readEvent: 'chronicle:read', achievement: 'chronicle-all', heading: 'The Chronicle',
  searchPlaceholder: 'Search the Chronicle…', footer: 'Covers the first age only: after Warcraft III, before Molten Core. Nothing from later expansions is spoiled here.',
  action: (sec, e) => sec.id === 'ready' && e.id === 'r4' ? { label: 'Open Calendar', run: () => launch('calendar') } : sec.id === 'world' ? { label: 'Open Atlas', run: () => launch('atlas') } : sec.id === 'ready' && e.id === 'r1' ? { label: 'Editions in the Codex', run: () => launch('codex', { section: 'editions' }) } : null,
});
