/**
 * Karazhan Chess — play against the tower. Full move generation (castling,
 * promotion, en passant), check/checkmate/stalemate, and a 3-ply alpha-beta AI.
 * Alliance pieces (white) vs Horde pieces (black).
 */
import { h, grantXp, bus, type AppDef } from '../os/kernel';
import { sound } from '../os/sound';
import { achievements } from '../os/achievements';
import { notify } from '../os/ui';

type Piece = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K' | 'p' | 'n' | 'b' | 'r' | 'q' | 'k' | '';
interface Move { from: number; to: number; promo?: Piece; castle?: 'K' | 'Q'; ep?: boolean; }
interface State { b: Piece[]; turn: 'w' | 'b'; castling: string; ep: number; half: number; }

const VAL: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
const isW = (p: Piece) => p !== '' && p === p.toUpperCase();
const PST_P = [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0];
const PST_N = [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50];

function initial(): State { const b: Piece[] = []; for (let i = 0; i < 64; i++) { const r = Math.floor(i / 8); b.push(r === 0 ? ('rnbqkbnr'[i] as Piece) : r === 1 ? 'p' : r === 6 ? 'P' : r === 7 ? ('RNBQKBNR'[i - 56] as Piece) : ''); } return { b, turn: 'w', castling: 'KQkq', ep: -1, half: 0 }; }
function attacked(b: Piece[], sq: number, byWhite: boolean): boolean {
  const r = Math.floor(sq / 8), c = sq % 8;
  const pawnDir = byWhite ? 1 : -1; for (const dc of [-1, 1]) { const rr = r + pawnDir, cc = c + dc; if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { const p = b[rr * 8 + cc]; if (p === (byWhite ? 'P' : 'p')) return true; } }
  for (const [dr, dc] of [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]]) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === (byWhite ? 'N' : 'n')) return true; }
  for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < 8 && cc >= 0 && cc < 8 && b[rr * 8 + cc] === (byWhite ? 'K' : 'k')) return true; }
  const slide = (dirs: number[][], pcs: string) => { for (const [dr, dc] of dirs) { let rr = r + dr, cc = c + dc; while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { const p = b[rr * 8 + cc]; if (p) { if (isW(p) === byWhite && pcs.includes(p.toLowerCase())) return true; break; } rr += dr; cc += dc; } } return false; };
  return slide([[1, 0], [-1, 0], [0, 1], [0, -1]], 'rq') || slide([[1, 1], [1, -1], [-1, 1], [-1, -1]], 'bq');
}
function kingSq(b: Piece[], white: boolean) { return b.indexOf(white ? 'K' : 'k'); }
function pseudo(s: State): Move[] {
  const ms: Move[] = []; const white = s.turn === 'w'; const b = s.b;
  const add = (from: number, to: number, extra: Partial<Move> = {}) => ms.push({ from, to, ...extra });
  for (let i = 0; i < 64; i++) {
    const p = b[i]; if (!p || isW(p) !== white) continue; const r = Math.floor(i / 8), c = i % 8; const t = p.toLowerCase();
    if (t === 'p') { const dir = white ? -1 : 1; const start = white ? 6 : 1; const last = white ? 0 : 7; const fr = r + dir;
      if (fr >= 0 && fr < 8 && !b[fr * 8 + c]) { if (fr === last) ['q', 'r', 'b', 'n'].forEach(q => add(i, fr * 8 + c, { promo: (white ? q.toUpperCase() : q) as Piece })); else { add(i, fr * 8 + c); if (r === start && !b[(fr + dir) * 8 + c]) add(i, (fr + dir) * 8 + c); } }
      for (const dc of [-1, 1]) { const cc = c + dc; if (cc < 0 || cc > 7 || fr < 0 || fr > 7) continue; const to = fr * 8 + cc; const q = b[to]; if (q && isW(q) !== white) { if (fr === last) ['q', 'r', 'b', 'n'].forEach(x => add(i, to, { promo: (white ? x.toUpperCase() : x) as Piece })); else add(i, to); } else if (to === s.ep) add(i, to, { ep: true }); }
    } else if (t === 'n' || t === 'k') {
      const d = t === 'n' ? [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
      for (const [dr, dc] of d) { const rr = r + dr, cc = c + dc; if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue; const q = b[rr * 8 + cc]; if (!q || isW(q) !== white) add(i, rr * 8 + cc); }
      if (t === 'k') { const rank = white ? 7 : 0; if (i === rank * 8 + 4 && !attacked(b, i, !white)) { if (s.castling.includes(white ? 'K' : 'k') && !b[rank * 8 + 5] && !b[rank * 8 + 6] && b[rank * 8 + 7] === (white ? 'R' : 'r') && !attacked(b, rank * 8 + 5, !white)) add(i, rank * 8 + 6, { castle: 'K' }); if (s.castling.includes(white ? 'Q' : 'q') && !b[rank * 8 + 3] && !b[rank * 8 + 2] && !b[rank * 8 + 1] && b[rank * 8] === (white ? 'R' : 'r') && !attacked(b, rank * 8 + 3, !white)) add(i, rank * 8 + 2, { castle: 'Q' }); } }
    } else {
      const d = t === 'r' ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : t === 'b' ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
      for (const [dr, dc] of d) { let rr = r + dr, cc = c + dc; while (rr >= 0 && rr < 8 && cc >= 0 && cc < 8) { const q = b[rr * 8 + cc]; if (!q) add(i, rr * 8 + cc); else { if (isW(q) !== white) add(i, rr * 8 + cc); break; } rr += dr; cc += dc; } }
    }
  }
  return ms;
}
function apply(s: State, m: Move): State {
  const b = s.b.slice(); const p = b[m.from]; const white = isW(p); b[m.to] = m.promo ?? p; b[m.from] = '';
  if (m.ep) b[m.to + (white ? 8 : -8)] = '';
  if (m.castle) { const rank = white ? 7 : 0; if (m.castle === 'K') { b[rank * 8 + 5] = b[rank * 8 + 7]; b[rank * 8 + 7] = ''; } else { b[rank * 8 + 3] = b[rank * 8]; b[rank * 8] = ''; } }
  let castling = s.castling; if (p === 'K') castling = castling.replace(/[KQ]/g, ''); if (p === 'k') castling = castling.replace(/[kq]/g, '');
  for (const [sq, ch] of [[63, 'K'], [56, 'Q'], [7, 'k'], [0, 'q']] as [number, string][]) if (m.from === sq || m.to === sq) castling = castling.replace(ch, '');
  const ep = p.toLowerCase() === 'p' && Math.abs(m.to - m.from) === 16 ? (m.from + m.to) / 2 : -1;
  return { b, turn: s.turn === 'w' ? 'b' : 'w', castling, ep, half: p.toLowerCase() === 'p' || s.b[m.to] ? 0 : s.half + 1 };
}
function legal(s: State): Move[] { const white = s.turn === 'w'; return pseudo(s).filter(m => { const n = apply(s, m); return !attacked(n.b, kingSq(n.b, white), !white); }); }
function evaluate(s: State): number { let v = 0; for (let i = 0; i < 64; i++) { const p = s.b[i]; if (!p) continue; const w = isW(p); const t = p.toLowerCase(); let sc = VAL[t]; if (t === 'p') sc += w ? PST_P[i] : PST_P[63 - i]; if (t === 'n') sc += w ? PST_N[i] : PST_N[63 - i]; v += w ? sc : -sc; } return v; }
function search(s: State, depth: number, alpha: number, beta: number, nodes: { n: number }): number {
  nodes.n++; if (depth === 0) return s.turn === 'w' ? evaluate(s) : -evaluate(s);
  const ms = legal(s); if (!ms.length) { const inCheck = attacked(s.b, kingSq(s.b, s.turn === 'w'), s.turn !== 'w'); return inCheck ? -100000 - depth : 0; }
  ms.sort((a, b2) => (VAL[(s.b[b2.to] || 'x').toLowerCase()] ?? 0) - (VAL[(s.b[a.to] || 'x').toLowerCase()] ?? 0));
  let best = -Infinity; for (const m of ms) { const v = -search(apply(s, m), depth - 1, -beta, -alpha, nodes); if (v > best) best = v; if (v > alpha) alpha = v; if (alpha >= beta) break; } return best;
}
function bestMove(s: State, depth = 3): Move | null { const ms = legal(s); if (!ms.length) return null; let best = ms[0], bv = -Infinity; const nodes = { n: 0 }; for (const m of ms) { const v = -search(apply(s, m), depth - 1, -Infinity, Infinity, nodes) + Math.random() * 6; if (v > bv) { bv = v; best = m; } } return best; }

const GLYPH: Record<string, string> = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙', k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const NAME: Record<string, string> = { k: 'King', q: 'Queen', r: 'Rook', b: 'Bishop', n: 'Knight', p: 'Pawn' };
const sqName = (i: number) => 'abcdefgh'[i % 8] + (8 - Math.floor(i / 8));

export const chessApp: AppDef = {
  id: 'chess', name: 'Karazhan Chess', subtitle: 'The tower still plays', icon: 'dice', category: 'games', width: 700, height: 560, noScroll: true,
  mount(ctx) {
    let s = initial(); let sel: number | null = null; let moves: Move[] = []; let last: Move | null = null; let thinking = false; let over = ''; const log: string[] = [];
    const board = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(8, 52px)', gridTemplateRows: 'repeat(8, 52px)', border: '3px solid var(--gold-600)', boxShadow: '0 0 0 1px #000, 0 10px 30px rgba(0,0,0,.6)', margin: '14px' } });
    const side = h('div', { class: 'col', style: { flex: '1', padding: '14px 14px 14px 0', minWidth: '0' } });
    const status = h('div', { class: 'gold', style: { fontFamily: 'var(--font-display)', fontWeight: '700' } });
    const logEl = h('div', { class: 'log grow', style: { background: 'rgba(0,0,0,.35)', border: '1px solid var(--gold-700)', fontSize: '12px', minHeight: '0' } });
    side.append(h('div', { class: 'eyebrow' }, 'Karazhan Chess'), status, h('div', { class: 'dim small' }, 'You play the Alliance (white). The tower plays the Horde.'), logEl,
      h('div', { class: 'row' }, h('button', { class: 'btn sm gold', onclick: () => { s = initial(); sel = null; last = null; over = ''; log.length = 0; logEl.innerHTML = ''; render(); } }, 'New game'), h('button', { class: 'btn sm ghost', onclick: () => { if (log.length >= 2 && history.length >= 2) { history.pop(); history.pop(); s = history[history.length - 1] ?? initial(); log.pop(); log.pop(); over = ''; renderLog(); render(); } } }, 'Undo')));
    ctx.body.append(h('div', { class: 'row grow', style: { alignItems: 'flex-start', gap: '0' } }, board, side));
    const history: State[] = [];
    const renderLog = () => { logEl.innerHTML = ''; for (let i = 0; i < log.length; i += 2) logEl.append(h('div', { class: 'ln' }, h('span', { class: 'dim' }, `${i / 2 + 1}. `), h('span', { class: 'say' }, log[i] + ' '), h('span', { class: 'whisper' }, log[i + 1] ?? ''))); logEl.scrollTop = logEl.scrollHeight; };
    const desc = (st: State, m: Move) => { const p = st.b[m.from]; const cap = st.b[m.to] || m.ep; return m.castle ? (m.castle === 'K' ? 'O-O' : 'O-O-O') : `${p.toLowerCase() === 'p' ? '' : p.toUpperCase()}${cap ? 'x' : ''}${sqName(m.to)}${m.promo ? '=' + m.promo.toUpperCase() : ''}`; };
    const endCheck = () => { const ms = legal(s); const inCheck = attacked(s.b, kingSq(s.b, s.turn === 'w'), s.turn !== 'w'); if (!ms.length) { over = inCheck ? (s.turn === 'w' ? 'Checkmate. The tower wins.' : 'Checkmate! Medivh concedes.') : 'Stalemate. The tower shrugs.'; if (s.turn === 'b' && inCheck) { achievements.unlock('chess'); grantXp(300, 'chess'); bus.emit('chess:win'); sound.achievement(); notify('Checkmate', 'The tower has not lost in a very long time.', 'dice'); } else sound.horn(); } else if (s.half >= 100) over = 'Draw by the fifty-move rule.'; return inCheck; };
    const play = (m: Move) => { history.push(s); log.push(desc(s, m)); if (s.turn === 'w') bus.emit('chess:move'); s = apply(s, m); last = m; sel = null; moves = []; sound.click(); const chk = endCheck(); if (chk && !over) log[log.length - 1] += '+'; renderLog(); render(); };
    const render = () => {
      board.innerHTML = '';
      const inCheck = attacked(s.b, kingSq(s.b, s.turn === 'w'), s.turn !== 'w');
      status.textContent = over || (thinking ? 'The tower is thinking…' : s.turn === 'w' ? (inCheck ? 'Your move — you are in check!' : 'Your move.') : 'Horde to move.');
      for (let i = 0; i < 64; i++) {
        const p = s.b[i]; const light = (Math.floor(i / 8) + i) % 2 === 0; const target = moves.find(m => m.to === i); const isLast = last && (last.from === i || last.to === i);
        const cell = h('div', { style: { display: 'grid', placeItems: 'center', fontSize: '36px', cursor: 'pointer', position: 'relative', background: light ? '#cdbf9d' : '#5b4415', boxShadow: sel === i ? 'inset 0 0 0 3px var(--teal-300)' : isLast ? 'inset 0 0 0 3px rgba(233,200,116,.6)' : 'none', color: p && isW(p) ? '#f6f0e0' : '#1a0d33', textShadow: p ? (isW(p) ? '0 1px 2px #000, 0 0 6px rgba(77,139,255,.6)' : '0 1px 2px #000, 0 0 6px rgba(255,59,59,.6)') : 'none', lineHeight: '1', userSelect: 'none' } }, p ? GLYPH[p] : '');
        if (target) cell.append(h('span', { style: { position: 'absolute', width: p ? '46px' : '14px', height: p ? '46px' : '14px', borderRadius: '50%', border: p ? '3px solid rgba(62,199,176,.8)' : 'none', background: p ? 'transparent' : 'rgba(62,199,176,.7)', pointerEvents: 'none' } }));
        if (i % 8 === 0) cell.append(h('span', { style: { position: 'absolute', left: '2px', top: '1px', fontSize: '9px', color: light ? '#5b4415' : '#cdbf9d', fontFamily: 'var(--font-display)' } }, String(8 - Math.floor(i / 8))));
        if (i >= 56) cell.append(h('span', { style: { position: 'absolute', right: '3px', bottom: '1px', fontSize: '9px', color: light ? '#5b4415' : '#cdbf9d', fontFamily: 'var(--font-display)' } }, 'abcdefgh'[i % 8]));
        cell.title = p ? `${isW(p) ? 'Alliance' : 'Horde'} ${NAME[p.toLowerCase()]} · ${sqName(i)}` : sqName(i);
        cell.addEventListener('click', () => {
          if (over || thinking || s.turn !== 'w') return;
          if (target) { const promo = moves.filter(m => m.to === i && m.promo); play(promo.length ? promo.find(m => m.promo === 'Q')! : target); if (!over) { thinking = true; render(); setTimeout(() => { const m = bestMove(s, 3); thinking = false; if (m) play(m); else render(); }, 120); } return; }
          if (p && isW(p)) { sel = i; moves = legal(s).filter(m => m.from === i); } else { sel = null; moves = []; }
          render();
        });
        board.append(cell);
      }
      ctx.setStatus(`<span>Move ${Math.floor(log.length / 2) + 1}</span><span class="dim">${legal(s).length} legal moves</span><span class="dim" style="margin-left:auto">3-ply alpha-beta · castling, en passant, promotion</span>`);
    };
    render();
  },
};
