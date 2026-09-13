/**
 * Quest Log — story and daily quests tracked by the system, plus your own to-dos.
 */
import { h, bus, type AppDef } from '../os/kernel';
import { sound } from '../os/sound';
import { prompt, confirm, contextMenu, bindTooltip } from '../os/ui';
import { icon, glyph } from '../os/icons';
import { questEngine, type Quest } from '../os/quests';

const ZONES = ['Player', 'Home', 'Work', 'Study', 'Errands', 'Guild'];
const pcol = (q: Quest) => q.done ? 'var(--q-uncommon)' : q.priority === 'legendary' ? 'var(--q-legendary)' : q.priority === 'elite' ? 'var(--q-epic)' : '#ffe14d';

export const questlogApp: AppDef = {
  id: 'questlog', name: 'Quest Log', subtitle: 'Story, dailies, and your own tasks', icon: 'quest', category: 'adventure', width: 880, height: 580, noScroll: true,
  mount(ctx) {
    let sel: string | null = questEngine.active()[0]?.id ?? null; let showDone = false;
    const left = h('div', { class: 'col', style: { width: '300px', borderRight: '1px solid var(--gold-700)', padding: '10px', overflow: 'auto', background: 'rgba(0,0,0,.2)', gap: '2px' } });
    const right = h('div', { class: 'grow scroll', style: { padding: '16px' } });
    ctx.body.append(h('div', { class: 'row grow', style: { alignItems: 'stretch', gap: '0', height: '100%' } }, left, right));
    const q$ = () => questEngine.all().find(x => x.id === sel) ?? null;

    const item = (q: Quest) => {
      const done = q.objectives.filter(o => o.done).length;
      const el = h('div', { class: 'list-item' + (q.id === sel ? ' active' : '') },
        h('span', { style: { width: '14px', textAlign: 'center', color: pcol(q), fontWeight: '700' } }, q.done ? '✓' : q.kind === 'daily' ? '!' : '!'),
        h('span', { class: 'grow', style: { textDecoration: q.done ? 'line-through' : 'none', opacity: q.done ? .6 : 1 } }, q.title),
        h('span', { class: 'dim small' }, `${done}/${q.objectives.length}`));
      el.addEventListener('click', () => { sel = q.id; renderList(); renderDetail(); });
      el.addEventListener('contextmenu', (e) => { e.preventDefault(); contextMenu(e.clientX, e.clientY, [
        ...(q.kind === 'player' ? [{ label: q.done ? 'Reopen quest' : 'Complete quest', icon: 'check', action: () => { questEngine.completePlayer(q); } }] : []),
        { label: q.kind === 'player' ? 'Delete quest' : 'Abandon quest', icon: 'trash', action: () => abandon(q) },
      ]); });
      bindTooltip(el, { name: q.title, sub: `${q.kind === 'story' ? 'Story quest' : q.kind === 'daily' ? 'Daily quest' : 'Your quest'} · ${q.xp} XP`, lines: q.objectives.map(o => `<span style="color:${o.done ? 'var(--q-uncommon)' : 'var(--parch-300)'}">${o.done ? '✓' : '–'} ${o.text}</span>`), quality: q.priority === 'legendary' ? 'legendary' : q.priority === 'elite' ? 'epic' : 'common' });
      return el;
    };
    const section = (label: string, qs: Quest[]) => { if (!qs.length) return; left.append(h('div', { class: 'eyebrow', style: { margin: '10px 4px 2px' } }, label)); qs.forEach(q => left.append(item(q))); };
    const renderList = () => {
      left.innerHTML = '';
      left.append(h('div', { class: 'row' }, h('button', { class: 'btn sm gold', onclick: newQuest, html: glyph.plus + ' My Quest' }), h('label', { class: 'check small dim', style: { marginLeft: 'auto' } }, h('input', { type: 'checkbox', checked: showDone || undefined, onchange: (e: Event) => { showDone = (e.target as HTMLInputElement).checked; renderList(); } }), 'Completed')));
      const all = questEngine.all(); const active = all.filter(q => !q.done);
      section(`Story (${active.filter(q => q.kind === 'story').length})`, active.filter(q => q.kind === 'story'));
      section(`Daily (${active.filter(q => q.kind === 'daily').length}) · resets at midnight`, active.filter(q => q.kind === 'daily'));
      const mine = active.filter(q => q.kind === 'player'); const byZone = new Map<string, Quest[]>(); mine.forEach(q => { if (!byZone.has(q.zone)) byZone.set(q.zone, []); byZone.get(q.zone)!.push(q); });
      for (const [z, qs] of byZone) section(`${z} (${qs.length})`, qs);
      if (!active.length) left.append(h('div', { class: 'dim small', style: { padding: '10px' } }, 'No active quests. Suspiciously quiet.'));
      if (showDone) section(`Completed (${all.filter(q => q.done).length})`, all.filter(q => q.done).sort((a, b) => (b.completed ?? 0) - (a.completed ?? 0)));
      ctx.setStatus(`<span>${active.length} active quests</span><span class="dim">Story and daily objectives complete themselves as you use GeekOS</span>`);
    };
    const renderDetail = () => {
      right.innerHTML = '';
      const q = q$();
      if (!q) { right.append(h('div', { class: 'dim', style: { textAlign: 'center', paddingTop: '80px' } }, h('div', { style: { width: '80px', height: '80px', margin: '0 auto 12px', opacity: .6 }, html: icon('quest') }), 'Select a quest.')); return; }
      const system = q.kind !== 'player';
      const objs = h('div', { class: 'col', style: { gap: '4px', margin: '10px 0' } });
      q.objectives.forEach((o, i) => {
        const prog = o.track?.count && o.track.count > 1 ? ` (${Math.min(o.progress ?? 0, o.track.count)}/${o.track.count})` : '';
        const row = h('label', { class: 'check', style: { fontFamily: 'var(--font-quest)', fontSize: '15px', color: o.done ? '#7a6238' : '#2e2010', textDecoration: o.done ? 'line-through' : 'none' } },
          h('input', { type: 'checkbox', checked: o.done || undefined, disabled: system || undefined, onchange: () => { questEngine.toggleObjective(q, i); } }), o.text + prog,
          system ? null : h('button', { class: 'btn sm ghost', style: { marginLeft: 'auto', padding: '2px 6px' }, title: 'Remove objective', html: glyph.close, onclick: (e: Event) => { e.preventDefault(); questEngine.removeObjective(q, i); } }));
        objs.append(row);
      });
      const addObj = system ? null : h('input', { class: 'input', placeholder: 'Add an objective and press Enter…', style: { background: 'rgba(255,255,255,.4)', color: '#2e2010', borderColor: '#a3874e', fontFamily: 'var(--font-quest)' } });
      addObj?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && addObj.value.trim()) { questEngine.addObjective(q, addObj.value.trim()); addObj.value = ''; sound.click(); } });
      const desc = h('div', { contenteditable: system ? undefined : 'true', style: { whiteSpace: 'pre-wrap', outline: 'none', minHeight: '40px', margin: '8px 0' }, spellcheck: 'false' }, q.text || (system ? '' : 'Click to write the quest description…'));
      desc.addEventListener('blur', () => { if (!system) questEngine.update(q, { text: desc.textContent ?? '' }); });
      right.append(h('div', { class: 'parchment' },
        h('div', { class: 'row', style: { alignItems: 'flex-start' } },
          h('div', { class: 'grow' }, h('h3', {}, q.title), h('div', { class: 'small', style: { color: '#7a6238', fontFamily: 'var(--font-body)' } }, `${q.kind === 'story' ? 'Story' : q.kind === 'daily' ? 'Daily' : q.zone} · ${q.priority === 'legendary' ? 'Legendary' : q.priority === 'elite' ? 'Elite' : 'Normal'} · Reward: ${q.xp} XP${q.giver ? ' · From ' + q.giver : ''}${q.expires && !q.done ? ' · Expires ' + new Date(q.expires).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}`)),
          h('span', { style: { color: pcol(q), fontSize: '28px', fontWeight: '700', lineHeight: '1' } }, q.done ? '✓' : '!')),
        h('div', { class: 'hr', style: { background: 'linear-gradient(90deg,transparent,#a3874e,transparent)' } }),
        h('div', { class: 'eyebrow', style: { color: '#5a3a08' } }, 'Description'), desc,
        h('div', { class: 'eyebrow', style: { color: '#5a3a08' } }, system ? 'Objectives · tracked automatically' : 'Objectives'), objs, addObj,
        h('div', { class: 'hr', style: { background: 'linear-gradient(90deg,transparent,#a3874e,transparent)' } }),
        h('div', { class: 'row', style: { fontFamily: 'var(--font-body)' } },
          system ? h('span', { class: 'small', style: { color: '#7a6238' } }, q.done ? `Completed ${new Date(q.completed ?? 0).toLocaleString()}` : 'GeekOS completes this quest when the objectives are met.') : h('select', { class: 'input', style: { width: '150px', background: 'rgba(255,255,255,.4)', color: '#2e2010', borderColor: '#a3874e' }, onchange: (e: Event) => { questEngine.update(q, { zone: (e.target as HTMLSelectElement).value }); } }, ...ZONES.map(z => h('option', { value: z, selected: z === q.zone || undefined }, z))),
          system ? null : h('select', { class: 'input', style: { width: '130px', background: 'rgba(255,255,255,.4)', color: '#2e2010', borderColor: '#a3874e' }, onchange: (e: Event) => { const p = (e.target as HTMLSelectElement).value as Quest['priority']; questEngine.update(q, { priority: p, xp: p === 'legendary' ? 250 : p === 'elite' ? 120 : 60 }); } }, ...(['normal', 'elite', 'legendary'] as const).map(p => h('option', { value: p, selected: p === q.priority || undefined }, p[0].toUpperCase() + p.slice(1)))),
          h('span', { class: 'grow' }),
          h('button', { class: 'btn sm danger', onclick: () => abandon(q) }, q.kind === 'player' ? 'Delete' : 'Abandon'),
          system ? null : h('button', { class: 'btn sm ' + (q.done ? 'ghost' : 'gold'), onclick: () => questEngine.completePlayer(q) }, q.done ? 'Reopen' : 'Complete Quest'))));
    };
    const abandon = async (q: Quest) => { if (await confirm(q.kind === 'player' ? 'Delete quest?' : 'Abandon quest?', `"${q.title}" will be removed from your log.${q.kind === 'story' ? ' It will be offered again.' : ''}`, q.kind === 'player' ? 'Delete' : 'Abandon', 'Keep')) { questEngine.abandon(q); if (sel === q.id) sel = questEngine.active()[0]?.id ?? null; } };
    const newQuest = async () => { const title = await prompt('New Quest', 'Quest title…'); if (!title) return; const q = questEngine.addPlayerQuest(title); sel = q.id; };
    const rerender = () => { if (!q$()) sel = questEngine.active()[0]?.id ?? null; renderList(); renderDetail(); };
    rerender();
    if (ctx.args?.new) newQuest();
    const off1 = bus.on('quests:change', rerender); const off2 = bus.on('app:args', ({ win, args }: any) => { if (win === ctx.win && args?.new) newQuest(); });
    return () => { off1(); off2(); };
  },
};
