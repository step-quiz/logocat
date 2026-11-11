// Intèrpret de LogoCat (docs/LANGUAGE-SPEC.md §2–§6).
// Avalua directament la llista de tokens, amb generadors: cada ordre de la tortuga
// fa un `yield` d'un esdeveniment, i qui l'executa decideix el ritme (animació, pas a pas).
//
// Esdeveniments:
//   { type: 'turtle', kind: 'move'|'turn'|'state', from, to, segs }
//   { type: 'print', text, newline }      { type: 'note', key, text }
//   { type: 'wait', ms }                  { type: 'prompt', value: '?'|'>' }
//   { type: 'edit', name }                { type: 'defined', name, source }
//   { type: 'forget', name, span }
//   { type: 'before', word, text, panelLine, from, to, callers }   abans de cada acció:
//     és on s'atura el pas a pas («Ara farà…»). `panelLine` és la línia del panell de
//     procediments (o null si la instrucció ve de la línia «?»).
import { tokenize } from './lexer.js';
import { Turtle } from './tortuga.js';
import { LogoError, fmtNum, fmtValue } from './missatges.js';

export const MAX_STEPS = 200000;
export const MAX_DEPTH = 500;

class StopSignal { constructor(value) { this.value = value; } }

const PREC = { '=': 1, '<': 1, '>': 1, '+': 2, '-': 2, '*': 3, '/': 3 };
const OPPOSITE = { 'AVANÇA': 'RECULA', 'RECULA': 'AVANÇA', 'GIRA.D': 'GIRA.E', 'GIRA.E': 'GIRA.D' };

export class Interpreter {
  constructor({ rng = Math.random } = {}) {
    this._scanned = new WeakSet();   // llistes ja revisades per _schoolSigns
    this.rng = rng;
    this.turtle = new Turtle();
    this.procs = new Map();       // nom → { name, inputs, lines: [tokens], source: [text] }
    this.globals = new Map();
    this.frames = [];             // crides en curs: { proc, vars, line, panelLine, site }
    this.trail = [];              // camí actual: { proc } i { loop, k, n } (per al pas a pas)
    this.pending = null;          // definició a mig escriure a la línia «?»
    this.steps = 0;
    this.prims = buildPrimitives(this);
  }

  /** Paraules que LOGO coneix ara mateix (per a les pistes «Volies dir…?»). */
  knownWords() { return [...Object.keys(this.prims), ...this.procs.keys(), 'PROC', 'FI', 'CERT', 'FALS']; }

  snapshot() {
    return { turtle: this.turtle.snapshot(), globals: new Map(this.globals), procs: new Map(this.procs) };
  }
  restore(s) {
    this.turtle.restore(s.turtle); this.globals = new Map(s.globals); this.procs = new Map(s.procs);
    this.frames = []; this.trail = []; this.pending = null;
  }
  /** Botó «Reinicia»: tot com al principi. */
  resetAll() { this.turtle.reset(); this.globals.clear(); this.procs.clear(); this.frames = []; this.trail = []; this.pending = null; }

  /** El procediment `name` fa servir directament la paraula `word`? (exercicis que exigeixen una peça) */
  procUses(name, word) {
    const p = this.procs.get(name);
    const has = (ts) => ts.some((t) => (t.t === 'word' && t.v === word) || (t.t === 'list' && has(t.v)));
    return !!p && p.lines.some(has);
  }

  /** On som i quant valen les variables, per al requadre del pas a pas. */
  stepInfo() {
    const parts = [];
    for (const t of this.trail) {
      if (t.proc) parts.push(t.proc);
      else if (parts.length) parts[parts.length - 1] += `, volta ${t.k} de ${t.n}`;
      else parts.push(`volta ${t.k} de ${t.n}`);
    }
    const frame = this.frames[this.frames.length - 1];
    const values = frame ? [...frame.vars].map(([k, v]) => `:${k} = ${fmtValue(v, true)}`) : [];
    return { path: parts.join(' → '), values };
  }

  // ── Execució d'una línia del mode directe ──────────────────
  *runLine(text) {
    this.steps = 0; this.frames = []; this.trail = [];
    if (this.pending) { yield* this._collect(text); return; }
    const tokens = tokenize(text);
    if (tokens.length && tokens[0].t === 'word' && tokens[0].v === 'PROC') {
      const head = this._title(tokens, true);
      this.pending = { ...head, lines: [], source: [text.trim().toUpperCase()] };
      yield { type: 'prompt', value: '>' };
      return;
    }
    yield* this.runList(tokens);
  }

  /** Executa un text de diverses línies (solucions de referència, tests). */
  *runScript(text) {
    for (const line of text.split('\n')) if (line.trim()) yield* this.runLine(line);
    if (this.pending) { this.pending = null; throw new LogoError('missing_fi'); }
  }

  /** Executa sense animació. Retorna { prints, notes, error }. */
  runSync(text) {
    const prints = [], notes = [];
    let error = null, buf = '';
    try {
      for (const ev of this.runScript(text)) {
        if (ev.type === 'print') { buf += ev.text; if (ev.newline) { prints.push(buf); buf = ''; } }
        else if (ev.type === 'note') notes.push(ev.text);
      }
    } catch (e) {
      if (!(e instanceof LogoError)) throw e;
      error = e; this.pending = null;
    }
    if (buf) prints.push(buf);
    return { prints, notes, error };
  }

  _title(tokens, atPrompt) {
    const nameTok = tokens[1];
    if (!nameTok || nameTok.t !== 'word') throw new LogoError('bad_title');
    const name = nameTok.v;
    if (this.prims[name] || ['PROC', 'FI', 'CERT', 'FALS'].includes(name)) throw new LogoError('is_primitive', { word: name });
    if (atPrompt && this.procs.has(name)) throw new LogoError('already_defined', { word: name });
    const inputs = [];
    for (const t of tokens.slice(2)) {
      if (t.t !== 'var') throw new LogoError('bad_inputs');
      inputs.push(t.v);
    }
    return { name, inputs };
  }

  *_collect(text) {
    const p = this.pending;
    let tokens;
    try { tokens = tokenize(text); } catch (e) { this.pending = null; throw e; }
    if (tokens.length === 1 && tokens[0].t === 'word' && tokens[0].v === 'FI') {
      this.pending = null;
      p.source.push('FI');
      this.procs.set(p.name, { name: p.name, inputs: p.inputs, lines: p.lines, source: p.source });
      yield { type: 'prompt', value: '?' };
      yield { type: 'defined', name: p.name, source: p.source.join('\n') };
      yield { type: 'print', text: `${p.name} DEFINIT`, newline: true };
      return;
    }
    p.lines.push(tokens);
    p.source.push('  ' + text.trim().toUpperCase());
    yield { type: 'prompt', value: '>' };
  }

  /** Substitueix tots els procediments pels del text (panell de procediments). */
  defineAll(text) {
    const procs = new Map();
    let cur = null, n = -1;
    for (const raw of text.split('\n')) {
      n++;
      if (!raw.trim()) continue;
      const tokens = tokenize(raw);
      const first = tokens[0];
      if (first && first.t === 'word' && first.v === 'PROC') {
        if (cur) throw new LogoError('missing_fi');
        cur = { ...this._title(tokens, false), lines: [], source: [raw.trim().toUpperCase()], span: [n, n], lineNos: [] };
      } else if (tokens.length === 1 && first.t === 'word' && first.v === 'FI') {
        if (!cur) throw new LogoError('stray_fi');
        cur.source.push('FI'); cur.span[1] = n; procs.set(cur.name, cur); cur = null;
      } else {
        if (!cur) throw new LogoError('outside_proc', { text: raw.trim().toUpperCase() });
        cur.lines.push(tokens); cur.lineNos.push(n); cur.source.push('  ' + raw.trim().toUpperCase());
      }
    }
    if (cur) throw new LogoError('missing_fi');
    this.procs = procs;
  }

  // ── Avaluació ──────────────────────────────────────────────
  /** Signes de classe (: ÷ · × i la ics entre nombres): l'error surt abans d'executar res de la línia. */
  _schoolSigns(tokens) {
    if (this._scanned.has(tokens)) return;
    tokens.forEach((t, i) => {
      if (t.t === 'list') this._schoolSigns(t.v);
      else if (t.t === 'word' && !this.prims[t.v] && !this.procs.has(t.v)) {
        const a = tokens[i - 1], b = tokens[i + 1];
        const between = !!(a && a.t === 'num' && b && b.t === 'num');
        if (t.v === ':' && b && b.t === 'word') throw new LogoError('unknown', { word: ':', colonName: b.v });   // «: COSTAT»
        if (/[:÷·×]/.test(t.v) || /^\d+(\.\d+)?X\d+(\.\d+)?$/.test(t.v) || (t.v === 'X' && between)) throw new LogoError('unknown', { word: t.v, between });
      }
    });
    this._scanned.add(tokens);
  }

  *runList(tokens) {
    this._schoolSigns(tokens);
    const cur = { toks: tokens, pos: 0, last: null, src: tokens.src || '' };
    while (cur.pos < tokens.length) {
      const v = yield* this.expr(cur, 0);
      if (v !== undefined) throw new LogoError('unused', { value: fmtValue(v, true) });
    }
  }

  *expr(cur, minPrec) {
    let left = yield* this.primary(cur);
    for (;;) {
      const tok = cur.toks[cur.pos];
      if (!tok || tok.t !== 'op' || tok.unary || PREC[tok.v] === undefined || PREC[tok.v] < minPrec) break;
      if (left === undefined) throw new LogoError('no_output', { word: cur.last });
      cur.pos++;
      if (cur.pos >= cur.toks.length) throw new LogoError('missing_input', { word: tok.v, example: '3 ' + tok.v + ' 2' });
      const right = yield* this.expr(cur, PREC[tok.v] + 1);
      if (right === undefined) throw new LogoError('no_output', { word: cur.last });
      left = this.infix(tok.v, left, right);
    }
    return left;
  }

  infix(op, a, b) {
    if (op === '=') {
      if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-9;
      return fmtValue(a) === fmtValue(b);
    }
    for (const v of [a, b]) {
      if (typeof v !== 'number') throw new LogoError('bad_input', { word: op, value: fmtValue(v, true), isList: !!(v && v.list) });
    }
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': if (b === 0) throw new LogoError('div_zero'); return a / b;
      case '<': return a < b;
      default: return a > b;
    }
  }

  *primary(cur) {
    const tok = cur.toks[cur.pos++];
    switch (tok.t) {
      case 'num': return tok.v;
      case 'quote': return tok.v;
      case 'list': return { list: tok.v, src: tok.src };
      case 'var': return this.lookup(tok.v);
      case 'lp': {
        if (cur.pos >= cur.toks.length) throw new LogoError('missing_paren');
        const v = yield* this.expr(cur, 0);
        const close = cur.toks[cur.pos];
        if (!close || close.t !== 'rp') throw new LogoError('missing_paren');
        cur.pos++;
        return v;
      }
      case 'rp': throw new LogoError('stray_paren');
      case 'op': {
        if (tok.v !== '-') throw new LogoError('unused', { value: tok.v });
        if (cur.pos >= cur.toks.length) throw new LogoError('unused', { value: '-' });
        const v = yield* this.primary(cur);
        if (typeof v !== 'number') throw new LogoError('bad_input', { word: '-', value: fmtValue(v, true), isList: !!(v && v.list) });
        return -v;
      }
      default: return yield* this.call(tok.v, cur);
    }
  }

  lookup(name) {
    for (let i = this.frames.length - 1; i >= 0; i--) {
      if (this.frames[i].vars.has(name)) return this.frames[i].vars.get(name);
    }
    if (this.globals.has(name)) return this.globals.get(name);
    throw new LogoError('no_value', { name });
  }

  assign(name, value) {
    for (let i = this.frames.length - 1; i >= 0; i--) {
      if (this.frames[i].vars.has(name)) { this.frames[i].vars.set(name, value); return; }
    }
    this.globals.set(name, value);
  }

  *args(word, n, cur, onMissing) {
    const out = [];
    for (let k = 0; k < n; k++) {
      const next = cur.toks[cur.pos];
      if (!next || next.t === 'rp') throw onMissing(k, out);
      const v = yield* this.expr(cur, 0);
      if (v === undefined) throw new LogoError('no_output', { word: cur.last });
      out.push(v);
    }
    cur.last = word;
    return out;
  }

  *call(word, cur) {
    if (word === 'CERT') return true;
    if (word === 'FALS') return false;
    if (word === 'FI') throw new LogoError('stray_fi');
    if (word === 'PROC') throw new LogoError('stray_fi');

    const startTok = cur.toks[cur.pos - 1];
    const prim = this.prims[word];
    // «NO LLAPIS», «GIRA D 90»: una paraula amb punt escrita amb un espai al mig.
    const next = cur.toks[cur.pos];
    if (next && next.t === 'word' && this.prims[word + '.' + next.v] && (word === 'NO' || (!prim && !this.procs.has(word)))) {
      throw new LogoError('spaced', { text: word + ' ' + next.v, word: word + '.' + next.v });
    }
    if (prim) {
      const types = prim.types || '';
      const argv = yield* this.args(word, types.length, cur, (k) => new LogoError('missing_input', {
        word, want: types[k], example: prim.example || `${word} 50`,
      }));
      argv.forEach((v, k) => check(word, types[k], v));
      if (prim.opt && cur.toks[cur.pos] && cur.toks[cur.pos].t === 'list') {
        argv.push({ list: cur.toks[cur.pos].v, src: cur.toks[cur.pos].src }); cur.pos++;
      }
      if (++this.steps > MAX_STEPS) throw new LogoError('limit');
      if (prim.step) yield this._before(word, cur, startTok);
      const result = yield* prim.run(argv, word);
      cur.last = word;
      return result;
    }

    const proc = this.procs.get(word);
    if (!proc) {
      // «3 X 120»: una ics entre dos nombres és una multiplicació escrita com a classe.
      const before = cur.toks[cur.pos - 2];
      const between = !!(before && before.t === 'num' && next && next.t === 'num');
      const frame = this.frames[this.frames.length - 1];
      throw new LogoError('unknown', { word, between, isVar: !!(frame && frame.vars.has(word)) });   // «AVANÇA COSTAT»
    }
    const argv = yield* this.args(word, proc.inputs.length, cur,
      (k, got) => new LogoError('proc_inputs', { word, n: proc.inputs.length, inputs: proc.inputs.slice(), given: got.map((v) => fmtValue(v)) }));
    if (this.frames.length >= MAX_DEPTH) throw new LogoError('limit');
    const caller = this.frames[this.frames.length - 1];
    const endTok = cur.toks[cur.pos - 1];
    const frame = {
      proc: word, vars: new Map(proc.inputs.map((name, k) => [name, argv[k]])), line: 1, panelLine: null,
      site: { panelLine: caller ? caller.panelLine : null, from: startTok.pos ? startTok.pos[0] : 0, to: endTok.pos ? endTok.pos[1] : 0 },
    };
    this.frames.push(frame); this.trail.push({ proc: word });
    const mark = this.trail.length;
    let result;
    try {
      for (let i = 0; i < proc.lines.length; i++) {
        // La línia 1 és la del PROC. Amb línies en blanc al panell, compta la línia real.
        frame.panelLine = proc.lineNos ? proc.lineNos[i] : null;
        frame.line = proc.lineNos ? proc.lineNos[i] - proc.span[0] + 1 : i + 2;
        yield* this.runList(proc.lines[i]);
      }
    } catch (e) {
      if (e instanceof StopSignal) result = e.value;
      else {
        if (e instanceof LogoError && !e.where && e.code !== 'limit' && e.code !== 'stopped') {
          e.where = { proc: word, line: frame.line, panelLine: frame.panelLine };
        }
        throw e;
      }
    } finally {
      this.frames.pop(); this.trail.length = mark - 1;
    }
    cur.last = word;
    return result;
  }
}

Interpreter.prototype._before = function (word, cur, startTok) {
  const endTok = cur.toks[cur.pos - 1];
  const from = startTok.pos ? startTok.pos[0] : 0, to = endTok.pos ? endTok.pos[1] : 0;
  const frame = this.frames[this.frames.length - 1];
  return {
    type: 'before', word, text: cur.src.slice(from, to).trim().replace(/\s+/g, ' ').toUpperCase(),
    panelLine: frame ? frame.panelLine : null, from, to,
    callers: this.frames.filter((f) => f.site.panelLine != null).map((f) => f.site),
  };
};

function check(word, type, v) {
  const bad = () => new LogoError('bad_input', { word, value: fmtValue(v, true), want: type, isList: !!(v && v.list) });
  if (type === 'n' && typeof v !== 'number') throw bad();
  if (type === 'l' && !(v && v.list)) throw bad();
  if (type === 'b' && typeof v !== 'boolean') throw bad();
  if (type === 'w' && typeof v !== 'string') throw bad();
}

// ── Primitives ───────────────────────────────────────────────
// types: una lletra per entrada — n nombre, l llista, b condició, w paraula, a qualsevol.
function buildPrimitives(I) {
  const T = I.turtle;
  const P = {};
  const cmd = (names, types, fn, extra = {}) => {
    for (const name of [].concat(names)) P[name] = { types, run: fn, step: true, ...extra };
  };
  const op = (name, types, fn) => { P[name] = { types, *run(a) { return fn(...a); } }; };
  const state = function* (fn) { const from = T.pose(); fn(); yield { type: 'turtle', kind: 'state', from, to: T.pose(), segs: [] }; };

  function* move(dist, word, shown) {
    if (shown < 0) yield { type: 'note', key: 'negatiu', text: `${word} ${fmtNum(shown)} és el mateix que ${OPPOSITE[word]} ${fmtNum(-shown)}` };
    const from = T.pose();
    const segs = T.forward(dist);
    yield { type: 'turtle', kind: 'move', from, to: T.pose(), segs, path: T.path.slice(), dist };
  }
  function* turn(deg, word, shown) {
    if (shown < 0) yield { type: 'note', key: 'negatiu', text: `${word} ${fmtNum(shown)} és el mateix que ${OPPOSITE[word]} ${fmtNum(-shown)}` };
    const from = T.pose();
    T.turn(deg);
    yield { type: 'turtle', kind: 'turn', from, to: T.pose(), segs: [], delta: deg };
  }

  cmd('AVANÇA', 'n', function* ([n], w) { yield* move(n, w, n); });
  cmd('RECULA', 'n', function* ([n], w) { yield* move(-n, w, n); });
  cmd('GIRA.D', 'n', function* ([n], w) { yield* turn(n, w, n); }, { example: 'GIRA.D 90' });
  cmd('GIRA.E', 'n', function* ([n], w) { yield* turn(-n, w, n); }, { example: 'GIRA.E 90' });
  cmd('INI.DIB', '', function* () { yield* state(() => { T.clean(); T.home(); }); });
  cmd('ESB.DIB', '', function* () { yield* state(() => T.clean()); });
  cmd('CENTRE', '', function* () { yield* state(() => T.home()); });
  cmd('APAREIX', '', function* () { yield* state(() => { T.visible = true; }); });
  cmd('DESAPAREIX', '', function* () { yield* state(() => { T.visible = false; }); });
  cmd('LLAPIS', '', function* () { yield* state(() => { T.pen = 'down'; }); });
  cmd('NO.LLAPIS', '', function* () { yield* state(() => { T.pen = 'up'; }); });
  cmd('GOMA', '', function* () { yield* state(() => { T.pen = 'erase'; }); });
  const colour = (word, n) => {
    if (!Number.isInteger(n) || n < 0 || n > 5) throw new LogoError('bad_input', { word, value: fmtNum(n), want: 'c' });
    return n;
  };
  cmd('FES.COLOR', 'n', function* ([n], w) { yield* state(() => { T.color = colour(w, n); }); }, { example: 'FES.COLOR 2' });
  cmd('FES.FONS', 'n', function* ([n], w) { yield* state(() => { T.bg = colour(w, n); }); }, { example: 'FES.FONS 5' });
  op('COLOR', '', () => T.color);
  op('FONS', '', () => T.bg);
  cmd('M.CÍCLIC', '', function* () { T.mode = 'wrap'; });
  cmd('M.BARRERA', '', function* () { T.mode = 'fence'; });
  cmd('M.FINESTRA', '', function* () { T.mode = 'window'; });

  cmd('FES.XY', 'nn', function* ([x, y]) { const from = T.pose(); const segs = T.moveTo(x, y); yield { type: 'turtle', kind: 'move', from, to: T.pose(), segs, path: T.path.slice(), dist: Math.hypot(x - from.x, y - from.y) }; }, { example: 'FES.XY 30 40' });
  cmd('FES.X', 'n', function* ([x]) { const from = T.pose(); const segs = T.moveTo(x, T.y); yield { type: 'turtle', kind: 'move', from, to: T.pose(), segs, path: T.path.slice(), dist: Math.abs(x - from.x) }; });
  cmd('FES.Y', 'n', function* ([y]) { const from = T.pose(); const segs = T.moveTo(T.x, y); yield { type: 'turtle', kind: 'move', from, to: T.pose(), segs, path: T.path.slice(), dist: Math.abs(y - from.y) }; });
  cmd('FES.ORIENTACIÓ', 'n', function* ([a]) { const from = T.pose(); T.setHeading(a); yield { type: 'turtle', kind: 'turn', from, to: T.pose(), segs: [], delta: a - from.heading }; }, { example: 'FES.ORIENTACIÓ 90' });
  op('COOR.X', '', () => T.x);
  op('COOR.Y', '', () => T.y);
  op('ORIENTACIÓ', '', () => T.heading);
  op('VERS.A', 'nn', (x, y) => ((Math.atan2(x - T.x, y - T.y) * 180 / Math.PI) + 360) % 360);

  cmd('REPETEIX', 'nl', function* ([n, body], w) {
    if (n < 0) throw new LogoError('bad_input', { word: w, value: fmtNum(n), want: 'n', negative: true });
    const times = Math.trunc(n), entry = { loop: true, k: 0, n: times };
    I.trail.push(entry);
    const mark = I.trail.length;
    try {
      for (let k = 0; k < times; k++) { entry.k = k + 1; yield* I.runList(body.list); }
    } finally { I.trail.length = mark - 1; }
  }, { step: false, example: 'REPETEIX 4 [AVANÇA 50 GIRA.D 90]' });
  cmd('SI', 'bl', function* ([cond, yes, no]) {
    if (cond) yield* I.runList(yes.list); else if (no) yield* I.runList(no.list);
  }, { opt: true, step: false, example: 'SI :N > 100 [ACABA]' });
  cmd('ACABA', '', function* (_, w) { if (!I.frames.length) throw new LogoError('only_in_proc', { word: w }); throw new StopSignal(undefined); }, { step: false });
  cmd('RETORNA', 'a', function* ([v], w) { if (!I.frames.length) throw new LogoError('only_in_proc', { word: w }); throw new StopSignal(v); }, { step: false, example: 'RETORNA 50' });
  cmd('ESPERA', 'n', function* ([n]) { yield { type: 'wait', ms: Math.max(0, n) * 1000 / 60 }; }, { example: 'ESPERA 60' });

  cmd('POSA.A', 'wa', function* ([name, v]) { I.assign(name, v); }, { example: 'POSA.A "COSTAT 50' });
  op('CONTINGUT', 'w', (name) => I.lookup(name));
  cmd('LOCAL', 'w', function* ([name], w) {
    if (!I.frames.length) throw new LogoError('only_in_proc', { word: w });
    I.frames[I.frames.length - 1].vars.set(name, 0);
  }, { example: 'LOCAL "COSTAT' });

  op('NO', 'b', (p) => !p);
  op('CERTS.TOTS', 'bb', (p, q) => p && q);
  op('CERT.ALGUN', 'bb', (p, q) => p || q);
  P.ATZAR = { types: 'n', example: 'ATZAR 6', *run([n], w) { if (n < 1) throw new LogoError('bad_input', { word: w, value: fmtNum(n), want: 'n' }); return Math.floor(I.rng() * Math.floor(n)); } };
  P.ARREL2 = { types: 'n', example: 'ARREL2 25', *run([n], w) { if (n < 0) throw new LogoError('bad_input', { word: w, value: fmtNum(n), want: 'n' }); return Math.sqrt(n); } };
  op('SIN', 'n', (a) => Math.sin(a * Math.PI / 180));
  op('COS', 'n', (a) => Math.cos(a * Math.PI / 180));
  op('ATAN', 'n', (n) => Math.atan(n) * 180 / Math.PI);
  op('ENTER', 'n', (n) => Math.trunc(n));
  op('APROX', 'n', (n) => Math.round(n));
  const intDiv = (word, f) => ({ types: 'nn', example: `${word} 7 2`, *run([a, b]) { if (Math.trunc(b) === 0) throw new LogoError('div_zero'); return f(Math.trunc(a), Math.trunc(b)); } });
  P.QUOCIENT = intDiv('QUOCIENT', (a, b) => Math.trunc(a / b));
  P['RESTA.DIV'] = intDiv('RESTA.DIV', (a, b) => a % b);

  cmd('ESCRIU', 'a', function* ([v]) { yield { type: 'print', text: fmtValue(v), newline: true }; }, { example: 'ESCRIU 3 + 4' });
  cmd('ESCRIU.S', 'a', function* ([v]) { yield { type: 'print', text: fmtValue(v), newline: false }; }, { example: 'ESCRIU.S 3 + 4' });
  cmd('MOSTRA', 'a', function* ([v]) { yield { type: 'print', text: fmtValue(v, true), newline: true }; }, { example: 'MOSTRA [A B]' });

  const listing = function* (procs, full) {
    for (const p of procs) {
      for (const line of full ? p.source : [p.source[0]]) yield { type: 'print', text: line, newline: true };
    }
  };
  cmd('PROCS?', '', function* () { yield* listing(I.procs.values(), true); });
  cmd('N.PROCS?', '', function* () { yield* listing(I.procs.values(), false); });
  const named = (name) => { const p = I.procs.get(name); if (!p) throw new LogoError('unknown', { word: name }); return p; };
  cmd('PROC?', 'w', function* ([name]) { yield* listing([named(name)], true); }, { example: 'PROC? "QUADRAT' });
  cmd('OBLIDA.PROC', 'w', function* ([name]) { const p = named(name); I.procs.delete(name); yield { type: 'forget', name, span: p.span || null }; }, { example: 'OBLIDA.PROC "QUADRAT' });
  cmd('EDITA', 'w', function* ([name]) { yield { type: 'edit', name }; }, { example: 'EDITA "QUADRAT' });
  return P;
}
