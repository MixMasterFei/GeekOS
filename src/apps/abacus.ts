/**
 * Goblin Abacus — a calculator with a gold/silver/copper mode.
 */
import { h, type AppDef } from '../os/kernel';
import { sound } from '../os/sound';

function safeEval(expr: string): number {
  const clean = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/[^0-9+\-*/().% ]/g, '');
  if (!clean.trim()) return 0;
  // shunting-yard evaluation, no eval()
  const out: (number | string)[] = []; const ops: string[] = []; const prec: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2, '~': 3 };
  const toks = clean.match(/\d*\.?\d+|\d+\.?|[+\-*/%()]/g) ?? []; let prev = '';
  if (toks.join('') !== clean.replace(/\s+/g, '')) return NaN; // stray characters or double dots
  if (toks.some(t => /\d/.test(t) && (t.match(/\./g) ?? []).length > 1)) return NaN;
  for (const t of toks) {
    if (/\d/.test(t)) out.push(+t);
    else if (t === '(') ops.push(t);
    else if (t === ')') { while (ops.length && ops[ops.length - 1] !== '(') out.push(ops.pop()!); if (!ops.length) return NaN; ops.pop(); }
    else if (t === '-' && (prev === '' || /[+\-*/%(]/.test(prev))) { out.push(0); ops.push('~'); } // unary minus: highest precedence
    else { while (ops.length && prec[ops[ops.length - 1]] >= prec[t]) out.push(ops.pop()!); ops.push(t); }
    prev = t;
  }
  while (ops.length) { const op = ops.pop()!; if (op === '(') return NaN; out.push(op); }
  const st: number[] = [];
  for (const t of out) { if (typeof t === 'number') st.push(t); else { if (st.length < 2) return NaN; const b = st.pop()!, a = st.pop()!; st.push(t === '+' ? a + b : t === '-' || t === '~' ? a - b : t === '*' ? a * b : t === '/' ? a / b : a % b); } }
  return st.length === 1 ? st[0] : NaN;
}
const toCoins = (copper: number) => { const neg = copper < 0; copper = Math.abs(Math.round(copper)); const g = Math.floor(copper / 10000), s = Math.floor((copper % 10000) / 100), c = copper % 100; return `${neg ? '−' : ''}<span style="color:#ffd700">${g}g</span> <span style="color:#c7c7c7">${s}s</span> <span style="color:#b87333">${c}c</span>`; };

export const abacusApp: AppDef = {
  id: 'abacus', name: 'Goblin Abacus', subtitle: 'Calculator with coin mode', icon: 'abacus', category: 'tools', width: 340, height: 480, minWidth: 300, noScroll: true,
  mount(ctx) {
    let expr = ''; let coins = false;
    const display = h('div', { style: { padding: '14px 16px', textAlign: 'right', background: 'rgba(0,0,0,.45)', borderBottom: '1px solid var(--gold-700)', minHeight: '86px', fontFamily: 'var(--font-mono)' } });
    const small = h('div', { class: 'dim small', style: { minHeight: '18px', wordBreak: 'break-all' } }); const big = h('div', { style: { fontSize: '28px', color: 'var(--gold-100)', wordBreak: 'break-all' } }, '0');
    display.append(small, big);
    const upd = () => { small.textContent = expr; try { const v = expr.trim() ? safeEval(expr) : 0; big.innerHTML = !Number.isFinite(v) ? 'Fizzle' : coins ? toCoins(v) : String(+v.toFixed(8)); } catch { big.textContent = 'Fizzle'; } };
    const keys = ['C', '(', ')', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '%', '='];
    const pad = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', padding: '10px', flex: '1' } });
    keys.forEach(k => { const b = h('button', { class: 'btn ' + (k === '=' ? 'gold' : /[÷×\-+%]/.test(k) ? 'primary' : k === 'C' ? 'danger' : ''), style: { fontSize: '16px', padding: '0' } }, k); b.addEventListener('click', () => press(k)); pad.append(b); });
    const press = (k: string) => { sound.click(); if (k === 'C') expr = ''; else if (k === '=') { try { const v = safeEval(expr); if (!Number.isFinite(v)) { sound.error(); upd(); return; } expr = String(+v.toFixed(8)); if (v === 60) big.style.animation = 'pulseGold .6s'; } catch { expr = ''; sound.error(); } } else expr += k; upd(); };
    const toggle = h('label', { class: 'check small', style: { padding: '6px 12px', borderTop: '1px solid var(--gold-700)', color: 'var(--text-dim)' } }, h('input', { type: 'checkbox', onchange: (e: Event) => { coins = (e.target as HTMLInputElement).checked; upd(); } }), 'Coin mode (result in copper → g/s/c)');
    ctx.body.append(display, pad, toggle);
    ctx.body.tabIndex = 0;
    ctx.body.addEventListener('keydown', (e) => { const k = e.key; if (/[0-9+\-*/().%]/.test(k) && k.length === 1) { press(k.replace('*', '×').replace('/', '÷')); e.preventDefault(); } else if (k === 'Enter' || k === '=') { press('='); e.preventDefault(); } else if (k === 'Backspace') { expr = expr.slice(0, -1); upd(); } else if (k === 'Escape') press('C'); });
    setTimeout(() => ctx.body.focus(), 30);
    upd();
  },
};
