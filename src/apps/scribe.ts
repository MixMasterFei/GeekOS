/**
 * Scribe — a parchment text editor bound to the Bags filesystem.
 */
import { h, bus, type AppDef } from '../os/kernel';
import { fs, type FsNode } from '../os/fs';
import { prompt, notify, confirm } from '../os/ui';
import { sound } from '../os/sound';
import { grantXp } from '../os/kernel';

export const scribeApp: AppDef = {
  id: 'scribe', name: 'Scribe', subtitle: 'Write scrolls and letters', icon: 'scribe', category: 'tools', width: 760, height: 540, singleton: false, noScroll: true,
  mount(ctx) {
    let file: FsNode | undefined = ctx.args?.file ? fs.get(ctx.args.file) : undefined; let dirty = false; const readonly = !!ctx.args?.readonly;
    const ta = h('textarea', { class: 'input', spellcheck: 'false', readonly: readonly || undefined, style: { flex: '1', minHeight: '0', resize: 'none', borderRadius: '0', border: 'none', fontFamily: readonly ? 'var(--font-quest)' : 'var(--font-body)', fontSize: readonly ? '16px' : '14px', lineHeight: '1.6', padding: '22px 28px', background: 'radial-gradient(ellipse at 20% 10%, rgba(255,255,255,.35), transparent 50%), linear-gradient(180deg, #efe3c5, #e2d2a8 60%, #d9c79b)', color: '#3a2a12', boxShadow: 'inset 0 0 60px rgba(120,80,20,.25)' } });
    ta.value = file?.content ?? '';
    const name = () => file?.name ?? 'Untitled scroll';
    const upd = () => { ctx.setTitle(`Scribe — ${name()}${dirty ? ' •' : ''}`); const words = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0; ctx.setStatus(`<span>${words} words</span><span>${ta.value.length} runes</span><span class="dim">${readonly ? 'Read only' : dirty ? 'Unsaved' : 'Saved'}</span><span class="dim" style="margin-left:auto">Ctrl+S to save</span>`); };
    const save = async () => {
      if (readonly) return;
      if (!file) { const n = await prompt('Save scroll as', 'Name', 'New scroll.txt'); if (!n) return; file = fs.create('docs', n, 'text', ta.value); }
      else fs.write(file.id, ta.value);
      dirty = false; sound.coin(); grantXp(3, 'scribe'); bus.emit('scribe:save'); notify('Scroll saved', `${name()} is in your Bags.`, 'scribe', { timeout: 2000, sound: false }); upd();
    };
    const tb = h('div', { class: 'row', style: { padding: '6px 10px', borderBottom: '1px solid var(--gold-700)', background: 'rgba(0,0,0,.25)' } },
      h('button', { class: 'btn sm', onclick: async () => { if (dirty && !(await confirm('Discard changes?', 'The current scroll has unsaved runes.', 'Discard', 'Keep'))) return; file = undefined; ta.value = ''; dirty = false; upd(); ta.focus(); } }, 'New'),
      h('button', { class: 'btn sm gold', disabled: readonly || undefined, onclick: save }, 'Save'),
      h('button', { class: 'btn sm ghost', disabled: !file || readonly || undefined, onclick: async () => { if (!file) return; const n = await prompt('Rename scroll', 'Name', file.name); if (n) { fs.rename(file.id, n); upd(); } } }, 'Rename'),
      h('span', { class: 'grow' }),
      h('select', { class: 'input', style: { width: '150px' }, onchange: (e: Event) => { ta.style.fontFamily = (e.target as HTMLSelectElement).value; } }, h('option', { value: 'var(--font-body)' }, 'Plain script'), h('option', { value: 'var(--font-quest)' }, 'Quest script'), h('option', { value: 'var(--font-rune)' }, 'Rune script'), h('option', { value: 'var(--font-mono)' }, 'Engineer script')));
    ctx.body.append(tb, ta);
    ta.addEventListener('input', () => { dirty = true; upd(); });
    ta.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); } if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('  ', s, ta.selectionEnd, 'end'); } });
    const off = bus.on('fs:change', () => { if (file) { const f = fs.get(file.id); if (!f) { file = undefined; } else file = f; upd(); } });
    upd(); setTimeout(() => ta.focus(), 50);
    ctx.onClose(() => { if (dirty && file) fs.write(file.id, ta.value); });
    return () => off();
  },
};
