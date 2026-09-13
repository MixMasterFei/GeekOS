/**
 * Armory — look up a real character through the Battle.net API and mirror it
 * onto your GeekOS character.
 */
import { h, esc, session, store, bus, type AppDef } from '../os/kernel';
import { bnetConfig, fetchCharacter, VERSIONS, hasBackend, type CharacterSummary } from '../os/bnet';
import { sound } from '../os/sound';
import { notify, confirm, bindTooltip } from '../os/ui';
import { launch } from '../os/shell';
import { icon } from '../os/icons';

const SAMPLE: CharacterSummary = { name: 'Sample', level: 60, race: 'Forsaken', cls: 'Paladin', faction: 'horde', guild: 'Forever Ready', realm: 'Zephras', ilvl: 63, achievementPoints: 1150, title: 'Sample the Explorer', spec: 'Holy', equipment: [{ slot: 'Head', name: 'Crown of the Summit', quality: 'epic', ilvl: 66 }, { slot: 'Chest', name: 'Breastplate of the Undying Light', quality: 'rare', ilvl: 60 }, { slot: 'Main Hand', name: 'Blackmaw Fang', quality: 'epic', ilvl: 65 }, { slot: 'Trinket', name: 'Bell of Silent Lordaeron', quality: 'epic', ilvl: 62 }] };

export const armoryApp: AppDef = {
  id: 'armory', name: 'Armory', subtitle: 'Your real characters, via Battle.net', icon: 'legacy', category: 'social', width: 860, height: 600, noScroll: true,
  mount(ctx) {
    const last = store.get<{ realm: string; name: string; version: string } | null>('armory.last', null);
    const realm = h('input', { class: 'input', placeholder: 'Realm (e.g. Hyjal, Zephras…)', value: last?.realm ?? '', style: { width: '200px' } });
    const name = h('input', { class: 'input', placeholder: 'Character name', value: last?.name ?? '', style: { width: '180px' } });
    const version = h('select', { class: 'input', style: { width: '240px' } }, ...VERSIONS.map(v => h('option', { value: v.id, selected: v.id === (last?.version ?? 'retail') || undefined }, v.label)));
    const go = h('button', { class: 'btn gold' }, 'Look up');
    const form = h('div', { class: 'row', style: { padding: '10px 14px', borderBottom: '1px solid var(--gold-700)', background: 'rgba(0,0,0,.25)', flexWrap: 'wrap' } }, realm, name, version, go, h('button', { class: 'btn ghost sm', onclick: () => launch('settings', { tab: 'bnet' }) }, 'Battle.net settings'));
    const pane = h('div', { class: 'grow scroll', style: { padding: '18px 22px' } });
    ctx.body.append(form, pane);
    const cfg = bnetConfig();
    const renderChar = (c: CharacterSummary, sample = false) => {
      pane.innerHTML = '';
      if (sample) pane.append(h('div', { class: 'frame', style: { padding: '10px 14px', marginBottom: '14px', borderColor: 'var(--q-legendary)' } }, h('div', { class: 'eyebrow', style: { color: 'var(--q-legendary)' } }, 'Sample character'), h('div', { class: 'small', style: { color: 'var(--parch-200)' } }, cfg.clientId ? 'Look up a real character above.' : 'Add your Battle.net API client in Settings → Battle.net, then look up any character. This card shows the layout with placeholder data.')));
      const head = h('div', { class: 'row', style: { gap: '18px', alignItems: 'flex-start' } },
        c.avatar ? h('img', { src: c.avatar, style: { width: '84px', height: '84px', border: '2px solid var(--gold-400)', borderRadius: '4px', boxShadow: 'var(--glow-gold)' } }) : h('div', { style: { width: '84px', height: '84px', border: '2px solid var(--gold-400)', borderRadius: '4px', background: '#0a1d26', padding: '10px' }, html: icon(c.faction === 'horde' ? 'horde' : 'alliance') }),
        h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, `${c.realm} · ${c.faction}`), h('h2', { class: 'display', style: { fontSize: '28px' } }, c.title ?? c.name), h('div', { class: 'dim' }, `Level ${c.level} ${c.race} ${c.spec ? c.spec + ' ' : ''}${c.cls}${c.guild ? ' · <' + c.guild + '>' : ''}`),
          h('div', { class: 'row', style: { marginTop: '8px', flexWrap: 'wrap' } }, c.ilvl ? h('span', { class: 'badge teal' }, `Item level ${c.ilvl}`) : null, c.achievementPoints != null ? h('span', { class: 'badge' }, `${c.achievementPoints} achievement points`) : null, c.lastLogin ? h('span', { class: 'badge' }, `Last seen ${new Date(c.lastLogin).toLocaleDateString()}`) : null)),
        h('button', { class: 'btn primary', disabled: sample || undefined, onclick: async () => { if (await confirm('Mirror this character?', `${session.user!.name} becomes ${c.name}: level ${c.level} ${c.race} ${c.cls}. Your GeekOS XP is kept.`, 'Mirror', 'Cancel')) { const u = session.user!; u.name = c.name; u.level = Math.min(60, c.level); u.race = c.race; u.cls = c.cls; u.faction = c.faction === 'neutral' ? u.faction : c.faction; session.save(); const chars = store.get<any[]>('characters', []); const i = store.get('lastChar', 0); if (chars[i]) { chars[i] = u; store.set('characters', chars); } sound.levelup(); notify('Character mirrored', `${c.name} now lives on this desktop.`, 'legacy'); } } }, 'Mirror to GeekOS'));
      pane.append(head, h('div', { class: 'hr orn' }));
      if (c.render) pane.append(h('img', { src: c.render, style: { maxWidth: '100%', maxHeight: '320px', display: 'block', margin: '0 auto 14px', borderRadius: '4px', border: '1px solid var(--gold-700)' } }));
      pane.append(h('div', { class: 'eyebrow', style: { marginBottom: '6px' } }, `Equipment (${c.equipment.length})`));
      const grid = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '6px' } });
      for (const it of c.equipment) { const row = h('div', { class: 'row', style: { padding: '6px 10px', border: `1px solid var(--q-${it.quality})`, background: 'rgba(0,0,0,.3)' } }, h('span', { class: 'dim small', style: { width: '80px', flex: 'none' } }, it.slot), h('span', { class: 'q-' + it.quality, style: { fontWeight: '700', fontSize: '12.5px' } }, it.name), it.ilvl ? h('span', { class: 'dim small', style: { marginLeft: 'auto' } }, String(it.ilvl)) : null); bindTooltip(row, { name: it.name, quality: it.quality, sub: it.slot, lines: it.ilvl ? [`Item level ${it.ilvl}`] : [] }); grid.append(row); }
      if (!c.equipment.length) grid.append(h('div', { class: 'dim small' }, 'No equipment data returned.'));
      pane.append(grid);
    };
    const lookup = async () => {
      if (!realm.value.trim() || !name.value.trim()) { sound.error(); return; }
      if (!hasBackend() && !window.geekos?.bnet) { notify('No proxy', 'Run GeekOS via npm run dev, the Electron build, or Vercel to reach Battle.net.', 'faq'); return; }
      go.setAttribute('disabled', ''); pane.innerHTML = ''; pane.append(h('div', { class: 'dim', style: { textAlign: 'center', paddingTop: '60px' } }, h('div', { style: { width: '60px', margin: '0 auto 10px', animation: 'spin 2s linear infinite' }, html: icon('atlas') }), 'Consulting the Armory…'));
      try { const c = await fetchCharacter(realm.value, name.value, version.value); store.set('armory.last', { realm: realm.value, name: name.value, version: version.value }); renderChar(c); sound.quest(); bus.emit('armory:lookup', c.name); ctx.setStatus(`<span>${esc(c.name)} · ${esc(c.realm)}</span><span class="dim">Data refreshes when the character logs out in-game</span>`); }
      catch (e: any) { sound.error(); pane.innerHTML = ''; pane.append(h('div', { class: 'frame', style: { padding: '16px', borderColor: 'var(--horde)' } }, h('div', { class: 'eyebrow', style: { color: 'var(--horde-bright)' } }, 'The Armory did not answer'), h('div', { style: { marginTop: '6px' } }, String(e?.message ?? e)), h('div', { class: 'dim small', style: { marginTop: '8px' } }, 'Check: region, realm spelling, character name, that the API client is valid, and that the game version has a namespace (Forever does not yet).'))); }
      go.removeAttribute('disabled');
    };
    go.addEventListener('click', lookup); [realm, name].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') lookup(); }));
    renderChar(SAMPLE, true);
    ctx.setStatus(`<span>${cfg.clientId ? 'API client configured' : 'No API client'}</span><span class="dim">Official Battle.net Profile API · read-only</span>`);
  },
};
