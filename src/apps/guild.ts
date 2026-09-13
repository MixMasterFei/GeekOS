/**
 * Guild Hall — a living chat with NPC guildmates who react to what you say.
 */
import { h, esc, session, rand, store, grantXp, bus, type AppDef } from '../os/kernel';
import { writeLine } from './console';
import { sound } from '../os/sound';
import { achievements } from '../os/achievements';
import { icon } from '../os/icons';

interface Member { name: string; cls: string; level: number; note: string; online: boolean; }
const MEMBERS: Member[] = [
  { name: 'Pixelbrand', cls: 'Mage', level: 60, note: 'Guild Recruiter · Portal service', online: true }, { name: 'Grimtotem', cls: 'Warrior', level: 58, note: 'Main tank · Hyjal Summit', online: true },
  { name: 'Velaria', cls: 'Priest', level: 60, note: 'Healer · Windshaper', online: true }, { name: 'Sundershot', cls: 'Hunter', level: 44, note: 'Riverglades enjoyer', online: true },
  { name: 'Morrigane', cls: 'Paladin', level: 31, note: 'Forsaken Paladin. Yes, really.', online: false }, { name: 'Bramblefoot', cls: 'Druid', level: 52, note: 'Camping enthusiast', online: true },
  { name: 'Kazzrik', cls: 'Rogue', level: 60, note: 'Lockpicking 300', online: false }, { name: 'Thundorin', cls: 'Shaman', level: 12, note: 'Dwarf Shaman, leveling', online: true },
];
const IDLE = ['anyone up for Hall of Thanes?', 'Forever hype is real', 'camped a fire in the Riverglades, buffs for all', 'reminder: raid unlock Dec 9', 'who needs a summon?', 'my Dwarf Shaman hit 12 tonight', 'is Barrow Deeps 10-man confirmed? yes', 'gz!', 'lol', 'brb hearthing', 'anyone got the Zephras compass?', 'Skyborne druid forms look incredible', 'name reservation Oct 27, set your alarms', 'the Drowned City has pirates AND naga. yes.'];
const REPLIES: [RegExp, string[]][] = [
  [/\b(hi|hello|hey|yo|hail)\b/i, ['hey {u}!', 'o/ {u}', 'hail, {u}', 'welcome back {u}']],
  [/\b(lf[gm]|group|dungeon|run)\b/i, ['I can tank in 10', 'heals here, inv me', 'what dungeon? Thanes or Whelgar?', 'summon at the stone?']],
  [/\b(forever|launch|nov)\b/i, ['Nov 4, 3pm PST. carved into my desk.', 'I already took the day off', '52 days. not that I am counting', 'pre-purchased the Collection, no regrets']],
  [/\b(help|how)\b/i, ['try /help in the Console', 'right-click everything, trust me', 'the Codex has all the announced stuff']],
  [/\b(gz|grats|congrats)\b/i, ['ty!', 'thanks {u}', '<3']],
  [/\b(lol|haha|lmao)\b/i, ['lol', 'lmao', ':D']],
  [/\b(raid|summit|barrow)\b/i, ['Summit is 20-man, Barrow is 10', 'tier sets in Summit, legendary pending', 'Dec 9. be there.']],
  [/\b(skyborne|zephras)\b/i, ['Windshaper for life', 'High Order gang', 'the isle floats. it FLOATS.']],
  [/\b(murloc|mrgl)\b/i, ['MRGLGLGL', 'rwlrwlrwl', 'do not summon them']],
  [/\b(leeroy|jenkins)\b/i, ['at least I have chicken', 'TIME\'S UP LET\'S DO THIS']],
  [/\?$/, ['no idea tbh', 'ask Pixelbrand', 'probably', 'check the Codex']],
];

export const guildApp: AppDef = {
  id: 'guild', name: 'Guild Hall', subtitle: '<Forever Ready> guild chat', icon: 'guild', category: 'social', width: 820, height: 520, noScroll: true,
  mount(ctx) {
    const u = session.user!;
    const log = h('div', { class: 'log grow', style: { background: 'rgba(0,0,0,.3)' } });
    const input = h('input', { class: 'input', placeholder: 'Say something to the guild…', style: { borderRadius: '0', borderLeft: 'none', borderRight: 'none', borderBottom: 'none' } });
    const roster = h('div', { style: { width: '220px', borderLeft: '1px solid var(--gold-700)', padding: '10px', overflow: 'auto', background: 'rgba(0,0,0,.2)' } });
    ctx.body.append(h('div', { class: 'row grow', style: { alignItems: 'stretch', gap: '0', minHeight: '0' } }, h('div', { class: 'col grow', style: { gap: '0', minHeight: '0' } }, log, input), roster));
    const motd = store.get('guild.motd', 'MOTD: Forever launches Nov 4. Hyjal Summit Dec 9. Be kind, be ready.');
    writeLine(log, 'guild', `<b>Guild Message of the Day:</b> ${esc(motd)}`);
    writeLine(log, 'sys', `${MEMBERS.filter(m => m.online).length} guild members online.`);
    const renderRoster = () => { roster.innerHTML = ''; roster.append(h('div', { class: 'eyebrow' }, '<Forever Ready>'), h('div', { class: 'dim small', style: { marginBottom: '8px' } }, `${MEMBERS.length + 1} members`)); [{ name: u.name, cls: u.cls, level: u.level, note: 'You', online: true }, ...MEMBERS].forEach(m => roster.append(h('div', { class: 'row small', style: { padding: '4px 0', opacity: m.online ? 1 : .45 } }, h('span', { style: { width: '8px', height: '8px', borderRadius: '50%', background: m.online ? 'var(--q-uncommon)' : 'var(--q-poor)', flex: 'none' } }), h('span', { style: { color: `var(--c-${m.cls.toLowerCase()})`, fontWeight: '700' } }, m.name), h('span', { class: 'dim', style: { marginLeft: 'auto' } }, String(m.level))))); };
    renderRoster();
    const chat = (m: Member, text: string) => { writeLine(log, 'guild', `[Guild] [<span style="color:var(--c-${m.cls.toLowerCase()})">${m.name}</span>]: ${esc(text)}`); };
    const onlineM = () => MEMBERS.filter(m => m.online);
    let idle = window.setInterval(() => { if (Math.random() < 0.45) chat(rand(onlineM()), rand(IDLE)); if (Math.random() < 0.08) { const m = rand(MEMBERS); m.online = !m.online; writeLine(log, 'sys', `${m.name} has ${m.online ? 'come online' : 'gone offline'}.`); renderRoster(); } }, 9000);
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || !input.value.trim()) return;
      const text = input.value.trim(); input.value = '';
      if (text.startsWith('/motd ')) { store.set('guild.motd', text.slice(6)); writeLine(log, 'sys', `Guild MOTD set.`); return; }
      if (text.startsWith('/')) { writeLine(log, 'err', 'Slash commands live in the Command Console.'); return; }
      writeLine(log, 'guild', `[Guild] [<span style="color:var(--c-${u.cls.toLowerCase()})">${esc(u.name)}</span>]: ${esc(text)}`);
      grantXp(2, 'guild'); bus.emit('guild:say'); if (/leeroy|jenkins/i.test(text)) achievements.unlock('konami'); if (/mrgl|murloc/i.test(text)) sound.murloc();
      const hit = REPLIES.find(([re]) => re.test(text)); const n = hit ? 1 + Math.floor(Math.random() * 2) : Math.random() < 0.3 ? 1 : 0;
      for (let i = 0; i < n; i++) setTimeout(() => chat(rand(onlineM()), (hit ? rand(hit[1]) : rand(IDLE)).replace('{u}', u.name)), 800 + Math.random() * 2200 + i * 900);
    });
    setTimeout(() => input.focus(), 50);
    ctx.setStatus(`<span>${onlineM().length} online</span><span class="dim">/motd &lt;text&gt; sets the message of the day</span>`);
    const offFocus = bus.on('win:focus', (w: any) => { if (w === ctx.win) setTimeout(() => input.focus(), 30); });
    return () => { clearInterval(idle); offFocus(); };
    void icon;
  },
};
