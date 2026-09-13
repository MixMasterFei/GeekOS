/**
 * Jukebox — a generative tavern band. Five original procedural tracks composed
 * in real time with WebAudio: no samples, no copyrighted music, never the same twice.
 */
import { h, store, bus, type AppDef } from '../os/kernel';
import { glyph, icon } from '../os/icons';
import { bindTooltip } from '../os/ui';
import { sound } from '../os/sound';

interface Track { id: string; name: string; sub: string; bpm: number; root: number; scale: number[]; prog: number[][]; mood: 'tavern' | 'air' | 'forge' | 'requiem' | 'rally'; color: string; }
const MAJ = [0, 2, 4, 5, 7, 9, 11], DOR = [0, 2, 3, 5, 7, 9, 10], MIN = [0, 2, 3, 5, 7, 8, 10], LYD = [0, 2, 4, 6, 7, 9, 11];
export const TRACKS: Track[] = [
  { id: 'tavern', name: 'Tavern in the Riverglades', sub: 'Lute, fiddle, a stomping floor', bpm: 104, root: 50, scale: DOR, prog: [[0, 2, 4], [5, 0, 2], [3, 5, 0], [4, 6, 1]], mood: 'tavern', color: '#e9c874' },
  { id: 'zephras', name: 'Wind over Zephras', sub: 'High pads, harp, distant chimes', bpm: 64, root: 57, scale: LYD, prog: [[0, 2, 4, 6], [3, 5, 0, 2], [1, 3, 5, 0], [4, 6, 1, 3]], mood: 'air', color: '#7fe6d3' },
  { id: 'forge', name: 'Beneath Ironforge', sub: 'Anvils, drones, deep brass', bpm: 76, root: 38, scale: MIN, prog: [[0, 2, 4], [0, 2, 4], [5, 0, 2], [3, 5, 0]], mood: 'forge', color: '#ff8a3d' },
  { id: 'requiem', name: 'Lordaeron Requiem', sub: 'Organ, choir, the bells that stopped', bpm: 56, root: 45, scale: MIN, prog: [[0, 2, 4], [5, 0, 2], [3, 5, 0], [4, 6, 1]], mood: 'requiem', color: '#a374ff' },
  { id: 'rally', name: 'Rally at Hyjal', sub: 'War drums, horns, a rising march', bpm: 120, root: 43, scale: MAJ, prog: [[0, 2, 4], [3, 5, 0], [4, 6, 1], [0, 2, 4]], mood: 'rally', color: '#ff4d4d' },
];
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

class Band {
  ctx: AudioContext; out: GainNode; analyser: AnalyserNode; conv: ConvolverNode; wet: GainNode;
  playing = false; track: Track | null = null; private timer = 0; private nextT = 0; private step = 0; private seed = 1;
  onStep?: (step: number) => void;
  constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.out = this.ctx.createGain(); this.out.gain.value = store.get('juke.vol', 0.5);
    this.analyser = this.ctx.createAnalyser(); this.analyser.fftSize = 128;
    this.conv = this.ctx.createConvolver(); this.conv.buffer = this.impulse(2.4, 2.5); this.wet = this.ctx.createGain(); this.wet.gain.value = 0.35;
    this.out.connect(this.analyser); this.analyser.connect(this.ctx.destination);
    this.out.connect(this.conv); this.conv.connect(this.wet); this.wet.connect(this.ctx.destination);
  }
  private impulse(sec: number, decay: number) { const r = this.ctx.sampleRate, len = r * sec, b = this.ctx.createBuffer(2, len, r); for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); } return b; }
  private rnd() { this.seed = (this.seed * 1664525 + 1013904223) >>> 0; return this.seed / 4294967296; }
  set volume(v: number) { this.out.gain.value = v; store.get('juke.vol', v); store.set('juke.vol', v); }
  get volume() { return this.out.gain.value; }
  play(t: Track) { this.track = t; this.seed = Date.now() & 0xffff; this.step = 0; if (this.ctx.state === 'suspended') this.ctx.resume(); this.playing = true; this.nextT = this.ctx.currentTime + 0.1; clearInterval(this.timer); this.timer = window.setInterval(() => this.schedule(), 60); }
  stop() { this.playing = false; clearInterval(this.timer); }
  destroy() { this.stop(); this.ctx.close(); }
  private schedule() { if (!this.track) return; const spb = 60 / this.track.bpm / 4; while (this.nextT < this.ctx.currentTime + 0.25) { this.playStep(this.step, this.nextT); this.onStep?.(this.step); this.step++; this.nextT += spb; } }

  // voices --------------------------------------------------------------
  private pluck(f: number, t: number, dur: number, g = 0.2, bright = 2400) { const o = this.ctx.createOscillator(), o2 = this.ctx.createOscillator(), fl = this.ctx.createBiquadFilter(), e = this.ctx.createGain(); o.type = 'sawtooth'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f * 2.003; fl.type = 'lowpass'; fl.frequency.setValueAtTime(bright, t); fl.frequency.exponentialRampToValueAtTime(300, t + dur); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g, t + 0.004); e.gain.exponentialRampToValueAtTime(0.0005, t + dur); o.connect(fl); o2.connect(fl); fl.connect(e); e.connect(this.out); o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05); }
  private pad(f: number, t: number, dur: number, g = 0.06, type: OscillatorType = 'sine') { const o = this.ctx.createOscillator(), o2 = this.ctx.createOscillator(), e = this.ctx.createGain(); o.type = type; o2.type = type; o.frequency.value = f; o2.frequency.value = f; o2.detune.value = 7; e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g, t + dur * 0.35); e.gain.setValueAtTime(g, t + dur * 0.7); e.gain.linearRampToValueAtTime(0, t + dur); o.connect(e); o2.connect(e); e.connect(this.out); o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05); }
  private bell(f: number, t: number, dur: number, g = 0.12) { [1, 2.76, 5.4].forEach((r, i) => { const o = this.ctx.createOscillator(), e = this.ctx.createGain(); o.type = 'sine'; o.frequency.value = f * r; const gg = g / (i * 2 + 1); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(gg, t + 0.005); e.gain.exponentialRampToValueAtTime(0.0005, t + dur / (i + 1)); o.connect(e); e.connect(this.out); o.start(t); o.stop(t + dur + 0.05); }); }
  private brass(f: number, t: number, dur: number, g = 0.08) { const o = this.ctx.createOscillator(), fl = this.ctx.createBiquadFilter(), e = this.ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.setValueAtTime(400, t); fl.frequency.linearRampToValueAtTime(1800, t + 0.12); fl.frequency.linearRampToValueAtTime(600, t + dur); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g, t + 0.06); e.gain.setValueAtTime(g, t + dur * 0.8); e.gain.linearRampToValueAtTime(0, t + dur); o.connect(fl); fl.connect(e); e.connect(this.out); o.start(t); o.stop(t + dur + 0.05); }
  private drum(t: number, kind: 'kick' | 'snare' | 'hat' | 'anvil' | 'stomp' | 'bigdrum', g = 0.5) {
    if (kind === 'kick' || kind === 'bigdrum' || kind === 'stomp') { const o = this.ctx.createOscillator(), e = this.ctx.createGain(); o.frequency.setValueAtTime(kind === 'bigdrum' ? 90 : 140, t); o.frequency.exponentialRampToValueAtTime(kind === 'bigdrum' ? 35 : 45, t + 0.25); e.gain.setValueAtTime(g, t); e.gain.exponentialRampToValueAtTime(0.001, t + (kind === 'bigdrum' ? 0.6 : 0.3)); o.connect(e); e.connect(this.out); o.start(t); o.stop(t + 0.7); }
    const len = this.ctx.sampleRate * 0.25, b = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** (kind === 'hat' ? 6 : 2.5);
    const s = this.ctx.createBufferSource(); s.buffer = b; const f = this.ctx.createBiquadFilter(); f.type = kind === 'hat' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'hat' ? 7000 : kind === 'anvil' ? 3200 : kind === 'snare' ? 1800 : 500; f.Q.value = kind === 'anvil' ? 12 : 1; const e = this.ctx.createGain(); e.gain.value = kind === 'hat' ? g * 0.25 : kind === 'anvil' ? g * 0.8 : kind === 'snare' ? g * 0.6 : g * 0.3; s.connect(f); f.connect(e); e.connect(this.out); s.start(t);
    if (kind === 'anvil') this.bell(mtof(88 + Math.floor(this.rnd() * 3)), t, 1.2, 0.05);
  }

  // arrangement --------------------------------------------------------
  private playStep(step: number, t: number) {
    const tr = this.track!; const spb = 60 / tr.bpm / 4; const bar = Math.floor(step / 16), beat = Math.floor((step % 16) / 4), sub = step % 4, s16 = step % 16;
    const chord = tr.prog[bar % tr.prog.length]; const deg = (d: number, oct = 0) => tr.root + 12 * oct + tr.scale[((d % tr.scale.length) + tr.scale.length) % tr.scale.length] + 12 * Math.floor(d / tr.scale.length);
    const section = Math.floor(bar / 8) % 3; // A A B feel
    switch (tr.mood) {
      case 'tavern': {
        if (sub === 0) this.drum(t, 'stomp', beat % 2 === 0 ? 0.5 : 0.3); if (sub === 2) this.drum(t, 'hat', 0.3); if (beat === 1 || beat === 3) if (sub === 0) this.drum(t, 'snare', 0.35);
        const arp = chord[(s16 + (bar % 2)) % chord.length]; if (sub !== 3 || this.rnd() < 0.4) this.pluck(mtof(deg(arp, 1)), t, 0.35, 0.16);
        if (sub === 0) this.pluck(mtof(deg(chord[0], 0)), t, 0.7, 0.14, 1200);
        if (section !== 1 && (sub === 0 || (sub === 2 && this.rnd() < 0.5))) { const m = chord[Math.floor(this.rnd() * chord.length)] + (this.rnd() < 0.3 ? 1 : 0); this.pluck(mtof(deg(m, 2)), t, 0.5, 0.1, 3600); }
        if (s16 === 0 && bar % 4 === 3) this.bell(mtof(deg(chord[0], 3)), t, 1.5, 0.06);
        break;
      }
      case 'air': {
        if (s16 === 0) chord.forEach((c, i) => this.pad(mtof(deg(c, i === 0 ? 0 : 1)), t, spb * 16 * 1.05, 0.045));
        if (sub === 0 && this.rnd() < 0.7) this.bell(mtof(deg(chord[Math.floor(this.rnd() * chord.length)], 2 + (this.rnd() < 0.3 ? 1 : 0))), t + this.rnd() * 0.08, 2.5, 0.07);
        if (s16 % 8 === 4 && this.rnd() < 0.5) this.pluck(mtof(deg(chord[1], 2)), t, 1.2, 0.05, 5000);
        if (bar % 8 === 7 && s16 === 12) this.drum(t, 'hat', 0.2);
        break;
      }
      case 'forge': {
        if (s16 === 0) { this.pad(mtof(deg(chord[0], -1)), t, spb * 16 * 1.02, 0.09, 'sawtooth'); this.pad(mtof(deg(chord[0], 0)), t, spb * 16, 0.05, 'triangle'); }
        if (sub === 0) this.drum(t, 'bigdrum', beat === 0 ? 0.7 : 0.4);
        if ((s16 === 6 || s16 === 14) || (section === 2 && s16 === 10)) this.drum(t, 'anvil', 0.6);
        if (s16 === 8 && section !== 0) this.brass(mtof(deg(chord[0], 0)), t, spb * 6, 0.07);
        if (s16 === 12 && bar % 2 === 1) this.brass(mtof(deg(chord[2], 0)), t, spb * 3, 0.06);
        break;
      }
      case 'requiem': {
        if (s16 === 0) chord.forEach((c, i) => { this.pad(mtof(deg(c, i === 0 ? -1 : 0)), t, spb * 16 * 1.08, 0.06, 'triangle'); this.pad(mtof(deg(c, 1)), t + 0.1, spb * 16, 0.03, 'sine'); });
        if (s16 === 0 && bar % 2 === 0) this.bell(mtof(deg(chord[0], 1)), t, 4, 0.1);
        if ((s16 === 8 && this.rnd() < 0.6) || (s16 === 12 && this.rnd() < 0.3)) this.pad(mtof(deg(chord[Math.floor(this.rnd() * 3)], 2)), t, spb * 4, 0.05, 'sine');
        if (bar % 4 === 3 && s16 === 0) this.drum(t, 'bigdrum', 0.35);
        break;
      }
      case 'rally': {
        if (sub === 0) this.drum(t, 'bigdrum', beat === 0 ? 0.7 : 0.45); if (sub === 2 && beat % 2 === 1) this.drum(t, 'snare', 0.4); if (s16 === 14 || s16 === 15) this.drum(t, 'snare', 0.3); if (sub === 1 || sub === 3) this.drum(t, 'hat', 0.25);
        if (s16 === 0 || s16 === 8) this.brass(mtof(deg(chord[0], 0)), t, spb * 7, 0.08);
        if (s16 === 4 || s16 === 12) this.brass(mtof(deg(chord[2], 0)), t, spb * 3, 0.06);
        if (section === 2 && sub === 0) this.brass(mtof(deg(chord[(beat) % chord.length], 1)), t, spb * 3.5, 0.05);
        if (s16 === 0) this.pad(mtof(deg(chord[0], -1)), t, spb * 16, 0.06, 'sawtooth');
        if (bar % 8 === 7 && s16 >= 12) this.brass(mtof(deg(chord[1], 1) + (s16 - 12)), t, spb, 0.06);
        break;
      }
    }
  }
}

let band: Band | null = null;

export const jukeboxApp: AppDef = {
  id: 'jukebox', name: 'Jukebox', subtitle: 'A generative tavern band', icon: 'jukebox', category: 'social', width: 720, height: 500, noScroll: true,
  mount(ctx) {
    if (!band) band = new Band();
    const b = band;
    let cur = TRACKS.find(t => t.id === (ctx.args?.track ?? store.get('juke.last', 'tavern'))) ?? TRACKS[0];
    const canvas = document.createElement('canvas'); canvas.style.cssText = 'width:100%;height:150px;display:block;background:rgba(0,0,0,.35)';
    const title = h('div', { class: 'display', style: { fontSize: '22px' } }); const sub = h('div', { class: 'dim small' });
    const playBtn = h('button', { class: 'btn gold icon', style: { width: '48px', height: '48px', borderRadius: '50%' }, html: glyph.play });
    const vol = h('input', { type: 'range', min: '0', max: '1', step: '0.01', value: String(b.volume), style: { width: '120px', accentColor: 'var(--gold-400)' }, oninput: (e: Event) => { b.volume = +(e.target as HTMLInputElement).value; } });
    const list = h('div', { class: 'list', style: { padding: '8px' } });
    const controls = h('div', { class: 'row', style: { padding: '14px 18px', gap: '14px', borderBottom: '1px solid var(--gold-700)' } },
      h('div', { style: { width: '56px', height: '56px', flex: 'none' }, html: icon('jukebox') }),
      h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, 'Now playing'), title, sub),
      h('button', { class: 'btn icon', html: glyph.prev, onclick: () => select(TRACKS[(TRACKS.indexOf(cur) + TRACKS.length - 1) % TRACKS.length], true) }),
      playBtn,
      h('button', { class: 'btn icon', html: glyph.next, onclick: () => select(TRACKS[(TRACKS.indexOf(cur) + 1) % TRACKS.length], true) }),
      h('div', { class: 'col', style: { gap: '2px', alignItems: 'center' } }, h('span', { class: 'eyebrow', style: { fontSize: '9px' } }, 'Volume'), vol));
    ctx.body.append(controls, canvas, h('div', { class: 'grow scroll' }, list));

    const renderList = () => {
      list.innerHTML = '';
      for (const t of TRACKS) {
        const el = h('div', { class: 'list-item' + (t === cur ? ' active' : '') }, h('span', { style: { width: '10px', height: '10px', borderRadius: '50%', background: t.color, boxShadow: `0 0 8px ${t.color}`, flex: 'none' } }), h('span', { class: 'grow' }, h('div', { style: { fontFamily: 'var(--font-display)', fontWeight: '700', fontSize: '12.5px' } }, t.name), h('div', { class: 'dim small' }, t.sub)), h('span', { class: 'dim small' }, `${t.bpm} bpm`), t === cur && b.playing ? h('span', { class: 'gold', html: glyph.pause }) : null);
        el.addEventListener('dblclick', () => select(t, true)); el.addEventListener('click', () => select(t, b.playing));
        bindTooltip(el, { name: t.name, sub: t.sub, lines: ['<span class="dim">Generated live. Never the same twice.</span>'], quality: 'uncommon' });
        list.append(el);
      }
    };
    const select = (t: Track, play: boolean) => { cur = t; store.set('juke.last', t.id); title.textContent = t.name; sub.textContent = t.sub; if (play) { b.play(t); sound.unlock(); bus.emit('jukebox:play', t.id); } updBtn(); renderList(); };
    const updBtn = () => { playBtn.innerHTML = b.playing && b.track === cur ? glyph.pause : glyph.play; ctx.setTitle(b.playing ? `Jukebox — ${cur.name}` : 'Jukebox'); };
    playBtn.addEventListener('click', () => { if (b.playing && b.track === cur) b.stop(); else { b.play(cur); bus.emit('jukebox:play', cur.id); } updBtn(); renderList(); });
    // visualiser
    const g = canvas.getContext('2d')!; const data = new Uint8Array(b.analyser.frequencyBinCount); let raf = 0; let lastStep = 0; b.onStep = (s) => { lastStep = s; };
    const draw = () => {
      raf = requestAnimationFrame(draw); const W = canvas.width = canvas.clientWidth, H = canvas.height = 150; g.clearRect(0, 0, W, H);
      b.analyser.getByteFrequencyData(data); const n = data.length; const bw = W / n;
      for (let i = 0; i < n; i++) { const v = data[i] / 255; const hgt = v * (H - 20); const grd = g.createLinearGradient(0, H, 0, H - hgt); grd.addColorStop(0, cur.color + '55'); grd.addColorStop(1, cur.color); g.fillStyle = grd; g.fillRect(i * bw + 1, H - hgt, bw - 2, hgt); }
      if (b.playing) { g.fillStyle = 'rgba(233,200,116,.7)'; g.font = '11px Cinzel'; g.fillText(`BAR ${Math.floor(lastStep / 16) + 1} · BEAT ${Math.floor((lastStep % 16) / 4) + 1}`, 10, 16); const s = lastStep % 16; for (let i = 0; i < 16; i++) { g.fillStyle = i === s ? cur.color : 'rgba(255,255,255,.15)'; g.fillRect(W - 16 * 8 - 10 + i * 8, 8, 6, 6); } }
      else { g.fillStyle = 'rgba(159,179,189,.6)'; g.font = '12px Open Sans'; g.fillText('Press play. The band is procedural: every performance is composed live.', 10, 20); }
    };
    draw();
    select(cur, !!ctx.args?.track);
    const offArgs = bus.on('app:args', ({ win, args }: any) => { if (win === ctx.win && args?.track) { const t = TRACKS.find(x => x.id === args.track); if (t) select(t, true); } });
    return () => { offArgs(); cancelAnimationFrame(raf); b.onStep = undefined; /* keep music playing after close */ };
  },
};
export function stopMusic() { band?.stop(); }
