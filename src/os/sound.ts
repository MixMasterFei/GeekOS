/**
 * Procedural sound engine — every cue is synthesized with WebAudio.
 * Nothing here is sampled from any game; it evokes the idiom (wood clicks,
 * bell chimes, a low horn) with oscillators and noise.
 */
import { store } from './kernel';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = store.get('sound.muted', false);
let volume = store.get('sound.volume', 0.6);

function ac(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : volume;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.25, t0 = 0, detune = 0, attack = 0.005) {
  const c = ac(); const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.value = freq; o.detune.value = detune;
  const start = c.currentTime + t0;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g); g.connect(master!);
  o.start(start); o.stop(start + dur + 0.05);
}

function noise(dur: number, gain = 0.15, t0 = 0, filterHz = 1200, q = 0.7) {
  const c = ac(); const len = Math.floor(c.sampleRate * dur); const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = filterHz; f.Q.value = q;
  const g = c.createGain(); g.gain.value = gain;
  src.connect(f); f.connect(g); g.connect(master!);
  src.start(c.currentTime + t0);
}

export const sound = {
  get muted() { return muted; },
  set muted(v: boolean) { muted = v; store.set('sound.muted', v); if (master) master.gain.value = v ? 0 : volume; },
  get volume() { return volume; },
  set volume(v: number) { volume = v; store.set('sound.volume', v); if (master && !muted) master.gain.value = v; },
  unlock() { try { ac(); } catch { /* no audio */ } },

  /** Wooden UI tick, like a button press on a parchment frame. */
  click() { try { noise(0.05, 0.18, 0, 1800, 1.2); tone(320, 0.06, 'triangle', 0.08); } catch {} },
  /** Soft chime for a window opening. */
  open() { try { tone(660, 0.18, 'sine', 0.12); tone(990, 0.22, 'sine', 0.08, 0.05); noise(0.08, 0.06, 0, 3000); } catch {} },
  close() { try { tone(520, 0.15, 'sine', 0.1); tone(330, 0.2, 'sine', 0.08, 0.04); } catch {} },
  /** Quest accepted: two bright bells. */
  quest() { try { tone(880, 0.35, 'sine', 0.16); tone(1320, 0.45, 'sine', 0.12, 0.12); tone(1760, 0.5, 'sine', 0.05, 0.12); } catch {} },
  /** Achievement fanfare: rising triad on brassy squares + bell. */
  achievement() {
    try {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.55, 'square', 0.05, i * 0.11));
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.7, 'sine', 0.14, i * 0.11));
      tone(2093, 1.2, 'sine', 0.08, 0.45);
    } catch {}
  },
  levelup() { try { [392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, 0.9, 'sine', 0.13, i * 0.09)); noise(0.6, 0.08, 0.2, 4000, 0.5); } catch {} },
  error() { try { tone(140, 0.25, 'sawtooth', 0.12); tone(110, 0.3, 'sawtooth', 0.1, 0.05); } catch {} },
  /** Hearthstone: swirling whoosh then low bell. */
  hearth() { try { noise(0.9, 0.12, 0, 600, 0.4); noise(0.6, 0.1, 0.3, 2400, 0.4); tone(196, 1.4, 'sine', 0.18, 0.5); tone(392, 1.2, 'sine', 0.08, 0.55); } catch {} },
  mail() { try { tone(1046.5, 0.12, 'triangle', 0.12); tone(1396.9, 0.25, 'triangle', 0.1, 0.1); } catch {} },
  coin() { try { tone(2400, 0.08, 'sine', 0.1); tone(3200, 0.14, 'sine', 0.08, 0.05); } catch {} },
  /** Low war horn, for boot and log-in. */
  horn() { try { tone(98, 1.8, 'sawtooth', 0.06); tone(147, 1.8, 'sawtooth', 0.05, 0.02); tone(196, 1.6, 'triangle', 0.08, 0.05, 6); noise(1.2, 0.05, 0, 300, 0.3); } catch {} },
  murloc() { try { for (let i = 0; i < 9; i++) tone(700 + Math.random() * 500, 0.06, 'square', 0.05, i * 0.055); tone(420, 0.35, 'sawtooth', 0.06, 0.5); } catch {} },
  whisper() { try { tone(1567.98, 0.1, 'sine', 0.1); tone(2093, 0.18, 'sine', 0.08, 0.09); } catch {} },
  tick() { try { tone(1200, 0.03, 'square', 0.04); } catch {} },
  boom() { try { tone(55, 0.9, 'sine', 0.3); noise(0.7, 0.2, 0, 200, 0.3); } catch {} },
};
