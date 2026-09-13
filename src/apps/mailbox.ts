/**
 * Mailbox — letters from Azeroth, plus notes to yourself.
 */
import { h, esc, store, bus, uid, session, grantXp, type AppDef } from '../os/kernel';
import { sound } from '../os/sound';
import { icon, glyph } from '../os/icons';
import { confirm, contextMenu } from '../os/ui';
import { launch } from '../os/shell';

export interface Mail { id: string; from: string; subject: string; body: string; date: number; read: boolean; starred?: boolean; attachment?: { name: string; app?: string; args?: any; quality?: string }; }

const SEED: Mail[] = [
  { id: 'm1', from: 'Innkeeper Allison', subject: 'Welcome to GeekOS', read: false, date: Date.now() - 3600e3, body: `Welcome, adventurer.\n\nYour room is upstairs. The desktop is yours. A few pointers from someone who has seen a lot of travellers come through:\n\n• Alt+Space opens the Hearth menu.\n• Alt+\` opens the Command Console, which understands slash commands.\n• The Quest Log keeps your tasks. Completing quests grants experience.\n• The Forever Codex holds everything Blizzard has announced about World of Warcraft: Forever.\n\nWhatever you do, do not open the letter in the Grave. It is not mine.\n\n— Allison`, attachment: { name: 'Forever Codex', app: 'codex', quality: 'epic' } },
  { id: 'm2', from: 'Skyborne Emissary', subject: 'Gales guide you', read: false, date: Date.now() - 7200e3, body: `To ${session.user?.name ?? 'adventurer'},\n\nOur home was secluded for a long time. It is not anymore. Zephras Isle opens November 4, and the Windshaper and High Order both need hands.\n\nThe compass attached will show you where our island floats.\n\n— The Emissary`, attachment: { name: 'Zephras Compass', app: 'atlas', args: { zone: 'zephras' }, quality: 'rare' } },
  { id: 'm3', from: 'Guild Recruiter', subject: '<Forever Ready> is recruiting', read: false, date: Date.now() - 86400e3, body: `Hail!\n\n<Forever Ready> is a social guild forming for the November 4 launch. Hyjal Summit on December 9 is the goal. All classes, all races, Forsaken Paladins especially welcome.\n\nCome say hello in the Guild Hall.\n\n— Pixelbrand, Guild Recruiter`, attachment: { name: 'Guild Charter', app: 'guild', quality: 'uncommon' } },
  { id: 'm4', from: 'Auctioneer', subject: 'Auction won: Crafted Campfire', read: true, date: Date.now() - 2 * 86400e3, body: `Your bid was successful.\n\nItem: Crafted Campfire\nPrice: 3g 40s\n\nThe item has been placed in your Bags under Quest Items. Pitch it with the Camp app.`, attachment: { name: 'Crafted Campfire', app: 'camp', quality: 'uncommon' } },
];

export const mailboxApp: AppDef = {
  id: 'mailbox', name: 'Mailbox', subtitle: 'Letters and notes', icon: 'mail', category: 'social', width: 880, height: 540, noScroll: true,
  mount(ctx) {
    let mails = store.get<Mail[]>('mail', SEED);
    let sel: string | null = mails[0]?.id ?? null; let compose = false;
    const save = () => { store.set('mail', mails); bus.emit('mail:change'); };
    const list = h('div', { class: 'col', style: { width: '300px', flex: 'none', borderRight: '1px solid var(--gold-700)', overflow: 'auto', background: 'rgba(0,0,0,.2)', gap: '0' } });
    const pane = h('div', { class: 'grow scroll', style: { padding: '18px' } });
    ctx.body.append(h('div', { class: 'row grow', style: { alignItems: 'stretch', gap: '0', height: '100%' } }, list, pane));

    const renderList = () => {
      list.innerHTML = '';
      ctx.setStatus(`<span>${mails.filter(m => !m.read).length} unread</span><span class="dim">${mails.length} letters</span>`);
      list.append(h('div', { class: 'row', style: { padding: '8px' } }, h('button', { class: 'btn sm gold grow', onclick: () => { compose = true; renderPane(); }, html: glyph.plus + ' Write Letter' })));
      const sorted = [...mails].sort((a, b) => (b.starred ? 1 : 0) - (a.starred ? 1 : 0) || b.date - a.date);
      for (const m of sorted) {
        const el = h('div', { class: 'list-item' + (m.id === sel && !compose ? ' active' : ''), style: { borderRadius: '0', borderBottom: '1px solid rgba(233,200,116,.08)', alignItems: 'flex-start' } },
          h('div', { style: { width: '8px', paddingTop: '6px' } }, h('span', { style: { display: 'block', width: '7px', height: '7px', borderRadius: '50%', background: m.read ? 'transparent' : 'var(--teal-300)', boxShadow: m.read ? 'none' : '0 0 6px var(--teal-300)' } })),
          h('div', { class: 'grow', style: { minWidth: '0' } },
            h('div', { class: 'row' }, h('span', { style: { fontWeight: m.read ? '400' : '700', color: m.read ? 'var(--parch-200)' : '#fff' } }, m.from), m.starred ? h('span', { class: 'gold', style: { marginLeft: 'auto' }, html: glyph.star }) : h('span', { class: 'dim small', style: { marginLeft: 'auto' } }, new Date(m.date).toLocaleDateString())),
            h('div', { class: 'small', style: { color: m.read ? 'var(--text-dim)' : 'var(--gold-200)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }, m.subject),
            m.attachment ? h('div', { class: 'small', style: { color: `var(--q-${m.attachment.quality ?? 'common'})` } }, `📎 ${m.attachment.name}`) : null));
        el.addEventListener('click', () => { sel = m.id; compose = false; if (!m.read) { m.read = true; save(); } bus.emit('mail:read', m.id); renderList(); renderPane(); });
        el.addEventListener('contextmenu', (e) => { e.preventDefault(); contextMenu(e.clientX, e.clientY, [
          { label: m.starred ? 'Unstar' : 'Star', icon: 'star', action: () => { m.starred = !m.starred; save(); renderList(); } },
          { label: m.read ? 'Mark unread' : 'Mark read', icon: 'check', action: () => { m.read = !m.read; save(); renderList(); } },
          { sep: true }, { label: 'Delete', icon: 'trash', action: () => del(m) }]); });
        list.append(el);
      }
      if (!mails.length) list.append(h('div', { class: 'dim small', style: { padding: '14px' } }, 'No mail. Not even from the Auctioneer.'));
    };
    const del = async (m: Mail) => { if (await confirm('Delete letter?', `"${m.subject}" from ${m.from}.`, 'Delete', 'Keep')) { mails = mails.filter(x => x.id !== m.id); if (sel === m.id) sel = mails[0]?.id ?? null; save(); renderList(); renderPane(); } };
    const live = (m: Mail) => mails.find(x => x.id === m.id) ?? m;
    const renderPane = () => {
      pane.innerHTML = '';
      if (compose) {
        const to = h('input', { class: 'input', placeholder: 'To (yourself, a friend, the Warchief…)', value: session.user?.name ?? '' });
        const subj = h('input', { class: 'input', placeholder: 'Subject' });
        const body = h('textarea', { class: 'input', style: { minHeight: '220px', fontFamily: 'var(--font-quest)', fontSize: '15px' }, placeholder: 'Write your letter…' });
        pane.append(h('div', { class: 'col' }, h('h3', {}, 'Write a Letter'), to, subj, body,
          h('div', { class: 'row' }, h('span', { class: 'dim small grow' }, 'Postage: 30c · Delivery: instant (it is your own mailbox)'),
            h('button', { class: 'btn ghost', onclick: () => { compose = false; renderPane(); } }, 'Discard'),
            h('button', { class: 'btn primary', onclick: () => { if (!subj.value.trim() && !body.value.trim()) { sound.error(); return; } mails.unshift({ id: uid(), from: `${session.user?.name ?? 'You'} → ${to.value || 'Nobody'}`, subject: subj.value.trim() || '(no subject)', body: body.value.trim(), date: Date.now(), read: true }); save(); compose = false; sel = mails[0].id; sound.mail(); grantXp(10, 'mail'); bus.emit('mail:send'); renderList(); renderPane(); } }, 'Send'))));
        setTimeout(() => subj.focus(), 30); return;
      }
      const m = mails.find(x => x.id === sel);
      if (!m) { pane.append(h('div', { class: 'dim', style: { textAlign: 'center', paddingTop: '80px' } }, h('div', { style: { width: '80px', margin: '0 auto 12px', opacity: .5 }, html: icon('mail') }), 'Select a letter.')); return; }
      const att = m.attachment ? h('div', { class: 'row', style: { marginTop: '14px', padding: '10px', border: '1px solid #a3874e', background: 'rgba(255,255,255,.25)' } },
        h('div', { style: { width: '36px', height: '36px', border: `1px solid var(--q-${m.attachment.quality ?? 'common'})`, background: '#0a1d26', padding: '2px' }, html: icon(m.attachment.app ?? 'file') }),
        h('div', { class: 'grow' }, h('div', { style: { color: `var(--q-${m.attachment.quality ?? 'common'})`, fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '13px', textShadow: '0 1px 1px #000' } }, m.attachment.name), h('div', { class: 'small', style: { color: '#7a6238' } }, 'Attachment')),
        h('button', { class: 'btn sm gold', onclick: () => { if (m.attachment?.app) launch(m.attachment.app, m.attachment.args); sound.coin(); } }, 'Take')) : null;
      pane.append(h('div', { class: 'parchment' },
        h('div', { class: 'row', style: { alignItems: 'flex-start' } }, h('div', { class: 'grow' }, h('h3', {}, m.subject), h('div', { class: 'small', style: { color: '#7a6238', fontFamily: 'var(--font-body)' } }, `From ${m.from} · ${new Date(m.date).toLocaleString()}`)),
          h('button', { class: 'btn sm ghost', style: { color: '#5a3a08', borderColor: '#a3874e' }, html: glyph.star, title: 'Star', onclick: () => { const x = live(m); x.starred = !x.starred; save(); renderList(); } }),
          h('button', { class: 'btn sm ghost', style: { color: '#5a3a08', borderColor: '#a3874e' }, html: glyph.trash, title: 'Delete', onclick: () => del(m) })),
        h('div', { class: 'hr', style: { background: 'linear-gradient(90deg,transparent,#a3874e,transparent)' } }),
        h('div', { style: { whiteSpace: 'pre-wrap', lineHeight: '1.55' } }, m.body), att));
    };
    renderList(); renderPane();
    const off = bus.on('mail:change', () => { mails = store.get<Mail[]>('mail', mails); renderList(); if (!compose) renderPane(); });
    return () => off();
    void esc;
  },
};

/** Deliver a letter from an NPC (used by other apps / events). */
export function deliverMail(m: Omit<Mail, 'id' | 'date' | 'read'>) {
  const mails = store.get<Mail[]>('mail', SEED);
  mails.unshift({ ...m, id: uid(), date: Date.now(), read: false });
  store.set('mail', mails); bus.emit('mail:change');
}
