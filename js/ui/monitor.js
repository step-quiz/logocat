// El «monitor»: dibuix de la tortuga, línies de text i línia d'ordres «?».
// És la pantalla dels simuladors incrustats als capítols i de l'Editor lliure.
// A partir del capítol 3, els simuladors porten també el panell de procediments (opts.panel).
// Disseny aprovat: docs/DECISIONS.md §7.
import { Interpreter } from '../logo/interpret.js';
import { LogoError, describe } from '../logo/missatges.js';
import { FIELD } from '../logo/tortuga.js';
import { compareDrawings, comparePose } from '../logo/compara.js';
import { ProcPanel } from './panell.js';

const PEN = ['#111214', '#f2f2ee', '#3ddc6a', '#d66bff', '#ff8a4c', '#4cc9ff'];   // colors 0–5
const BG = ['#232529', '#f2f2ee', '#1f5a34', '#4a2a5c', '#6b3a1e', '#1d4a66'];
const BULB = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const frame = () => new Promise((r) => requestAnimationFrame(r));
const DIRS = { 0: 'amunt', 90: 'cap a la dreta', 180: 'avall', 270: 'cap a l\'esquerra' };

/** Executa un text de LOGO en net i en retorna el dibuix i l'estat final. */
export function drawingOf(code) {
  const I = new Interpreter({ rng: () => 0.5 });
  const r = I.runSync(code);
  return { segments: I.turtle.segments.slice(), pose: I.turtle.pose(), pen: I.turtle.pen, error: r.error };
}

export class Monitor {
  /**
   * opts: { exercise, solutions: [text], checkPose, failText, okText, onSolved }
   *   require: 'REPETEIX'   l'exercici només es dona per fet si s'ha fet servir aquesta paraula
   *   preload: 'text'       línia que surt ja escrita a «?» (activitat «troba l'error»)
   *   panel: { initial }    simulador amb panell de procediments a l'esquerra (capítol 3 endavant)
   *   run: 'GRAÓ'           «Comprova» executa aquest procediment en una pantalla neta i en compara el resultat;
   *                         pot portar valors ('TRIANGLE 70'): llavors el procediment ha de tenir tantes variables;
   *                         amb `require`, el procediment `run` ha de fer servir aquesta paraula
   * Per a l'Editor lliure, que posa els seus propis botons i panell:
   *   toolbar: false     no construeix la barra de botons
   *   maxHeight          alçada màxima del dibuix, en píxels
   *   grid               quadrícula de 10 en 10 (reptes)
   *   fit: true          el dibuix s'adapta a l'espai lliure del contenidor (pantalla única)
   *   speed()            multiplicador del temps d'animació (0 = instantani)
   *   stepOnBefore       el pas a pas s'atura ABANS de cada acció (i avisa amb onBefore)
   *   onBusy(busy, stepping), onBefore(ev), onEvent(ev), onDraw(), onError(err), afterRestore()
   */
  constructor(root, opts = {}) {
    this.root = root;
    this.opts = opts;
    this.I = new Interpreter();
    this.undo = [];
    this.lines = [];                          // línies executades des de l'últim «Reinicia»
    this.history = []; this.histPos = 0;
    this.busy = false; this.stepping = false; this.abort = false; this.resume = null;
    this.shown = this.I.turtle.pose();        // on es dibuixa la tortuga ara (animació)
    this.partial = null;                      // traç a mig fer durant una animació
    this.hideFrom = null;                     // segments encara no mostrats
    this.diff = null; this.goalVisible = true;
    this.targets = (opts.solutions || []).map(drawingOf);
    this.reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.panel = null; this.lastError = null; this.checking = false;
    this.build();
    if (this.panel) this.panel.start(this);
    this.draw();
  }

  // ── Construcció ──
  build() {
    const r = this.root;
    r.classList.add('sim');
    if (this.opts.fit) r.classList.add('sim--ajusta');
    r.textContent = '';
    const withBar = this.opts.toolbar !== false;
    const bar = el('div', 'sim-barra');
    const btn = (label, cls, fn) => { const b = el('button', 'boto ' + (cls || ''), label); b.type = 'button'; b.addEventListener('click', fn); bar.appendChild(b); return b; };
    if (withBar) this.buildBar(r, bar, btn);
    let host = r;
    if (this.opts.panel) {
      r.classList.add('sim--panell');
      host = el('div', 'sim-cos');
      host.appendChild(this.buildPanel());
      r.appendChild(host);
    }
    this.buildScreen(host);
    this.result = el('div', 'sim-resultat'); this.result.setAttribute('role', 'status'); this.result.hidden = true;
    r.appendChild(this.result);
  }

  /** Columna esquerra dels simuladors amb panell: procediments i requadre del pas a pas. */
  buildPanel() {
    const side = el('div', 'sim-panell');
    const block = el('div', 'panell-bloc');
    side.appendChild(block);
    this.panel = new ProcPanel(block, { initial: this.opts.panel.initial || '' });
    const box = el('div', 'pas-info'); box.hidden = true;
    box.appendChild(el('h2', null, 'Pas a pas'));
    const dl = el('dl');
    const now = el('dd', 'pas-ara'), where = el('dd');
    dl.appendChild(el('dt', null, 'Ara farà')); dl.appendChild(now);
    dl.appendChild(el('dt', null, 'On som')); dl.appendChild(where);
    const valsLabel = el('dt', null, 'Valors'), vals = el('dd');
    dl.appendChild(valsLabel); dl.appendChild(vals);
    box.appendChild(dl); side.appendChild(box);
    const h = this.panel.hooks();
    this.opts = {
      ...this.opts, ...h,
      onBefore: (ev) => {
        h.onBefore(ev);
        if (!ev) return;
        now.textContent = ev.text;
        const info = this.I.stepInfo();
        where.textContent = info.path || 'a la línia que has escrit';
        vals.textContent = info.values.join('   ');
        valsLabel.hidden = vals.hidden = info.values.length === 0;
        box.hidden = false;
      },
      onBusy: (busy, stepping) => { if (!busy) box.hidden = true; h.onBusy(busy, stepping); },
    };
    return side;
  }

  buildBar(r, bar, btn) {
    if (this.opts.exercise) this.bCheck = btn('Comprova', 'boto--principal', () => this.check());
    this.bStep = btn('Pas', '', () => this.onStep());
    this.bCont = btn('Continua', '', () => this.onContinue()); this.bCont.hidden = true;
    this.bStop = btn('Atura', '', () => this.onStop()); this.bStop.hidden = true;
    this.bUndo = btn('Desfés', '', () => this.onUndo());
    this.bReset = btn('Reinicia', '', () => this.onReset());
    bar.appendChild(el('span', 'sim-espai'));
    if (this.opts.exercise) {
      this.bGoal = btn('Objectiu: visible', 'boto--estat', () => {
        this.goalVisible = !this.goalVisible;
        this.bGoal.textContent = 'Objectiu: ' + (this.goalVisible ? 'visible' : 'amagat');
        this.bGoal.setAttribute('aria-pressed', String(this.goalVisible));
        this.draw();
      });
      this.bGoal.setAttribute('aria-pressed', 'true');
    }
    if (r.requestFullscreen) btn('Pantalla completa', '', () => {
      if (document.fullscreenElement) document.exitFullscreen(); else r.requestFullscreen().catch(() => {});
    });
    r.appendChild(bar);
  }

  buildScreen(r) {
    const mon = el('div', 'sim-monitor');
    const wrap = el('div', 'sim-camp');
    this.canvas = el('canvas');
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', 'Dibuix de la tortuga');
    wrap.appendChild(this.canvas);
    mon.appendChild(wrap);

    this.legend = el('div', 'sim-llegenda');
    this.legend.innerHTML = '<span><i class="ll ll--ok"></i>coincideix</span><span><i class="ll ll--sobra"></i>sobra</span><span><i class="ll ll--falta"></i>falta</span>';
    this.legend.hidden = true;
    mon.appendChild(this.legend);

    this.log = el('div', 'sim-text');
    this.log.setAttribute('aria-live', 'polite');
    mon.appendChild(this.log);

    const row = el('div', 'sim-entrada');
    const id = 'ordre-' + Math.random().toString(36).slice(2, 8);
    this.promptLabel = el('label', 'sim-prompt', '?'); this.promptLabel.htmlFor = id;
    this.input = el('input'); this.input.id = id; this.input.type = 'text';
    this.input.autocomplete = 'off'; this.input.spellcheck = false;
    this.input.setAttribute('autocapitalize', 'characters'); this.input.setAttribute('autocorrect', 'off');
    this.input.setAttribute('aria-label', 'Línia d\'ordres');
    this.input.addEventListener('keydown', (e) => this.onKey(e));
    if (this.opts.preload) this.input.value = this.opts.preload;
    row.appendChild(this.promptLabel); row.appendChild(this.input);
    mon.appendChild(row);
    r.appendChild(mon);

    if (window.ResizeObserver) new ResizeObserver(() => this.draw()).observe(wrap);
    document.addEventListener('fullscreenchange', () => this.draw());
  }

  // ── Text ──
  line(text, cls) {
    const d = el('div', 'sim-linia ' + (cls || ''), text);
    this.log.appendChild(d);
    while (this.log.childElementCount > 200) this.log.firstElementChild.remove();
    this.log.scrollTop = this.log.scrollHeight;
    return d;
  }
  hint(text) {
    const d = el('div', 'sim-linia sim-pista');
    d.innerHTML = BULB; d.appendChild(el('span', null, text));
    this.log.appendChild(d); this.log.scrollTop = this.log.scrollHeight;
  }
  showError(err) {
    const m = describe(err, this.I.knownWords());
    this.line(m.line1, 'sim-error');
    m.hints.forEach((h) => this.hint(h));
    if (this.opts.onError) this.opts.onError(err);
  }

  // ── Entrada ──
  onKey(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const text = this.input.value;
      if (!text.trim() || this.busy) return;
      this.input.value = '';
      this.submit(text, false);
    } else if (e.key === 'ArrowUp') {
      if (this.histPos > 0) { this.histPos--; this.input.value = this.history[this.histPos]; e.preventDefault(); }
    } else if (e.key === 'ArrowDown') {
      if (this.histPos < this.history.length) { this.histPos++; this.input.value = this.history[this.histPos] || ''; e.preventDefault(); }
    }
  }

  setBusy(on) {
    this.busy = on;
    if (this.bStop) {
      this.bStop.hidden = !on;
      this.bCont.hidden = !(on && this.stepping);
      this.bUndo.disabled = on; this.bReset.disabled = on;
    }
    if (this.bCheck) this.bCheck.disabled = on;
    if (this.opts.onBusy) this.opts.onBusy(on, this.stepping);
    this.input.disabled = on;
    this.input.placeholder = on ? (this.stepping ? 'prem Pas o Continua' : 'la tortuga està treballant…') : '';
    if (!on) this.input.focus({ preventScroll: true });
  }

  /** Executa una línia. Retorna una promesa que es resol quan acaba. */
  async submit(text, stepMode) {
    if (this.busy) return;
    if (this.opts.beforeRun) this.opts.beforeRun();
    this.line(this.promptLabel.textContent + ' ' + text.toUpperCase(), 'sim-eco');
    this.history.push(text); if (this.history.length > 50) this.history.shift();
    this.histPos = this.history.length;
    this.undo.push(this.I.snapshot()); if (this.undo.length > 50) this.undo.shift();
    this.lines.push(text.toUpperCase()); if (this.lines.length > 50) this.lines.shift();
    this.clearFeedback();
    this.stepping = stepMode; this.abort = false; this.lastError = null;
    this.setBusy(true);
    let events = 0, printBuf = '';
    try {
      const gen = this.I.runLine(text);
      for (;;) {
        if (this.abort) throw new LogoError('stopped', this.I.recursion(2, true) || {});   // «Atura» enmig d'una recursivitat sense fi (owner, cap. 12)
        const { value: ev, done } = gen.next();
        if (done) break;
        if (ev.type === 'before') {
          if (this.stepping && this.opts.stepOnBefore) {
            this.draw();
            if (this.opts.onBefore) this.opts.onBefore(ev);
            await new Promise((r) => { this.resume = r; });
            this.resume = null;
            if (this.opts.onBefore) this.opts.onBefore(null);
          }
        } else if (ev.type === 'turtle') {
          events++;
          const user = this.opts.speed ? this.opts.speed() : 1;
          const auto = this.stepping ? 1 : events > 150 ? 0 : events > 40 ? 0.3 : 1;
          const factor = this.reduced ? 0 : user * auto * (this.checking ? 0.4 : 1);
          await this.animate(ev, factor);
          if (factor === 0 && events % 40 === 0) { this.draw(); await frame(); }
          if (this.stepping && !this.opts.stepOnBefore) {
            this.draw();
            await new Promise((r) => { this.resume = r; });
            this.resume = null;
          }
        } else if (ev.type === 'print') {
          printBuf += ev.text;
          if (ev.newline) { this.line(printBuf); printBuf = ''; }
        } else if (ev.type === 'note') {
          this.note(ev);
        } else if (ev.type === 'wait') {
          this.draw(); await sleep(Math.min(ev.ms, 5000));
        } else if (ev.type === 'prompt') {
          this.promptLabel.textContent = ev.value;
        } else if (this.opts.onEvent) {
          this.opts.onEvent(ev);
        }
      }
    } catch (e) {
      if (!(e instanceof LogoError)) { this.setBusy(false); throw e; }
      this.I.pending = null; this.promptLabel.textContent = '?';
      this.lastError = e;
      this.showError(e);
    }
    if (printBuf) this.line(printBuf);
    this.partial = null; this.hideFrom = null;
    this.shown = this.I.turtle.pose();
    this.stepping = false;
    this.setBusy(false);
    this.draw();
  }

  note(ev) {
    const key = 'logocat-nota-' + ev.key;
    try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch (e) { /* sense emmagatzematge */ }
    this.hint(ev.text);
  }

  // ── Botons ──
  onStep() {
    if (this.busy) { if (this.resume) this.resume(); return; }
    const text = this.input.value;
    if (!text.trim()) { this.hint('Escriu una ordre i prem Pas per veure-la instrucció a instrucció.'); return; }
    this.input.value = '';
    this.submit(text, true);
  }
  onContinue() {
    this.stepping = false;
    if (this.bCont) this.bCont.hidden = true;
    if (this.opts.onBusy) this.opts.onBusy(this.busy, false);
    if (this.resume) this.resume();
  }
  onStop() { this.abort = true; if (this.resume) this.resume(); }
  onUndo() {
    if (this.busy || !this.undo.length) return;
    this.I.restore(this.undo.pop()); this.lines.pop();
    if (this.opts.afterRestore) this.opts.afterRestore();
    this.promptLabel.textContent = '?';
    this.shown = this.I.turtle.pose();
    this.clearFeedback(); this.draw();
    this.line('(última línia desfeta)', 'sim-eco');
  }
  onReset() {
    if (this.busy) return;
    this.I.resetAll(); this.undo = []; this.lines = [];
    if (this.opts.preload) this.input.value = this.opts.preload;
    if (this.opts.afterRestore) this.opts.afterRestore();
    this.promptLabel.textContent = '?';
    this.log.textContent = '';
    this.shown = this.I.turtle.pose();
    this.clearFeedback(); this.draw();
  }
  clearFeedback() {
    this.diff = null; this.legend.hidden = true;
    this.result.hidden = true; this.result.textContent = '';
  }

  // ── Correcció ──
  say(kind, title, text) {
    this.result.className = 'sim-resultat sim-resultat--' + kind;
    this.result.textContent = '';
    this.result.appendChild(el('strong', null, title));
    this.result.appendChild(el('span', null, text));
    this.result.hidden = false;
  }

  /** «Comprova» d'un exercici de procediment: l'executa en una pantalla neta, a la vista de l'alumne. */
  async runForCheck() {
    const [name, ...given] = this.opts.run.trim().split(/\s+/);      // 'TRIANGLE 70' → TRIANGLE, amb un valor
    this.panel.flush();
    if (!this.panel.warn.hidden) { this.say('no', 'Encara no.', 'Al panell hi ha un error. Llegeix l\'avís de sota dels procediments i corregeix-lo.'); return false; }
    if (!this.I.procs.has(name)) { this.say('no', 'Encara no.', `Encara no has definit ${name}.`); return false; }
    if (this.I.procs.get(name).inputs.length !== given.length) {
      const want = given.length === 0 ? 'no ha de tenir variables' : given.length === 1 ? 'ha de tenir una variable' : `ha de tenir ${given.length} variables`;
      this.say('no', 'Encara no.', `${name} ${want}. Mira la línia PROC.`); return false;
    }
    this.I.turtle.reset(); this.I.globals.clear();
    this.undo = []; this.lines = []; this.log.textContent = '';
    this.shown = this.I.turtle.pose(); this.clearFeedback(); this.draw();
    this.checking = true;
    try { await this.submit(this.opts.run, false); } finally { this.checking = false; }
    if (this.lastError) {
      const stopped = this.lastError.code === 'stopped';
      this.say('no', 'Encara no.', stopped ? `Has aturat ${name} abans que acabés.` : `${name} s'ha aturat amb un error. Llegeix el missatge i corregeix el procediment.`);
      return false;
    }
    return true;
  }

  async check() {
    if (this.busy) return false;
    if (this.opts.run && !(await this.runForCheck())) return false;
    const T = this.I.turtle;
    const say = (kind, title, text) => this.say(kind, title, text);
    if (!T.segments.length) { say('no', 'Encara no.', this.opts.run ? `${this.opts.run} no ha dibuixat res.` : 'Encara no has dibuixat res.'); return false; }
    let best = null, target = null;
    for (const t of this.targets) {
      const r = compareDrawings(T.segments, t.segments);
      if (!best || r.error < best.error) { best = r; target = t; }
    }
    if (!best.ok) {
      this.diff = best; this.legend.hidden = false; this.draw();
      say('no', 'Encara no.', this.opts.failText || 'Mira quins traços sobren i quins falten.');
      return false;
    }
    if (this.opts.checkPose) {
      const p = comparePose(T.pose(), target.pose);
      if (!p.position) {
        const home = Math.hypot(target.pose.x, target.pose.y) < 1.5;
        say('quasi', 'Gairebé.', 'El dibuix és correcte. Només falta que la tortuga acabi ' + (home ? 'on ha començat.' : 'al final del dibuix.'));
        return false;
      }
      if (!p.heading) {
        const dir = DIRS[Math.round(target.pose.heading)] || 'com a l\'objectiu';
        say('quasi', 'Gairebé.', `El dibuix és correcte. Només falta que la tortuga acabi mirant ${dir}.`);
        return false;
      }
    }
    const need = this.opts.require;
    if (need && this.opts.run) {
      const procName = this.opts.run.trim().split(/\s+/)[0];
      if (!this.I.procUses(procName, need)) {
        say('si', 'Molt bé!', `El dibuix és correcte. Ara fes que ${procName} faci servir ${need}.`);
        return false;
      }
    } else if (need && !this.lines.some((l) => l.split(/[\s\[\]()]+/).includes(need))) {
      say('si', 'Molt bé!', `El dibuix és correcte. Ara prova de fer-lo amb ${need}: amb una sola línia n'hi ha prou.`);
      return false;
    }
    say('si', 'Correcte!', this.opts.okText || (this.opts.run ? `${this.opts.run} fa exactament el que es demanava.` : 'Has dibuixat exactament el que es demanava.'));
    if (this.opts.onSolved) this.opts.onSolved();
    return true;
  }

  // ── Animació ──
  async animate(ev, factor) {
    const T = this.I.turtle;
    if (factor === 0) { this.shown = ev.to; this.partial = null; this.hideFrom = null; return; }
    if (ev.kind === 'state') { this.shown = ev.to; this.draw(); return; }
    if (ev.kind === 'turn') {
      const ms = Math.min(450, Math.abs(ev.delta) * 3) * factor;
      await this.tween(ms, (p) => { this.shown = { x: ev.from.x, y: ev.from.y, heading: ev.from.heading + ev.delta * p }; });
      this.shown = ev.to; this.draw();
      return;
    }
    const path = ev.path || [];
    const lens = path.map((s) => Math.hypot(s.x2 - s.x1, s.y2 - s.y1));
    const total = lens.reduce((a, b) => a + b, 0);
    if (total < 1e-6) { this.shown = ev.to; this.draw(); return; }
    const drawing = ev.segs.length > 0;
    const pen = { color: T.color, erase: T.pen === 'erase' };
    this.hideFrom = T.segments.length - ev.segs.length;
    await this.tween(Math.min(700, total * 5) * factor, (p) => {
      let left = total * p; const done = [];
      let pos = { x: path[0].x1, y: path[0].y1 };
      for (let i = 0; i < path.length; i++) {
        const s = path[i];
        if (left >= lens[i]) { done.push(s); left -= lens[i]; pos = { x: s.x2, y: s.y2 }; continue; }
        const q = lens[i] ? left / lens[i] : 0;
        pos = { x: s.x1 + (s.x2 - s.x1) * q, y: s.y1 + (s.y2 - s.y1) * q };
        done.push({ x1: s.x1, y1: s.y1, x2: pos.x, y2: pos.y });
        break;
      }
      this.partial = drawing ? done.map((s) => ({ ...s, ...pen })) : null;
      this.shown = { x: pos.x, y: pos.y, heading: ev.from.heading };
    });
    this.partial = null; this.hideFrom = null; this.shown = ev.to; this.draw();
  }

  tween(ms, apply) {
    if (ms <= 0) { apply(1); return Promise.resolve(); }
    return new Promise((resolve) => {
      const t0 = performance.now();
      const tick = (now) => {
        const p = this.abort ? 1 : Math.min(1, (now - t0) / ms);
        apply(p); this.draw();
        if (p < 1) requestAnimationFrame(tick); else resolve();
      };
      requestAnimationFrame(tick);
    });
  }

  // ── Dibuix ──
  draw() {
    const c = this.canvas, box = c.parentElement;
    const full = document.fullscreenElement === this.root;
    const maxH = full ? Math.max(200, window.innerHeight - 260) : (this.opts.maxHeight || 320);
    const cssW = this.opts.fit && !full
      ? Math.max(120, Math.min(box.clientWidth - 16, (box.clientHeight - 16) * FIELD.w / FIELD.h))
      : Math.max(120, Math.min(box.clientWidth, maxH * FIELD.w / FIELD.h));
    const cssH = cssW * FIELD.h / FIELD.w;
    const dpr = window.devicePixelRatio || 1;
    if (c.width !== Math.round(cssW * dpr) || c.height !== Math.round(cssH * dpr)) {
      c.width = Math.round(cssW * dpr); c.height = Math.round(cssH * dpr);
      c.style.width = cssW + 'px'; c.style.height = cssH + 'px';
    }
    const g = c.getContext('2d');
    const k = c.width / FIELD.w;
    const X = (x) => (x - FIELD.xmin) * k, Y = (y) => (FIELD.ymax - y) * k;
    const T = this.I.turtle;
    const field = BG[T.bg] || BG[0];
    g.fillStyle = field; g.fillRect(0, 0, c.width, c.height);
    g.lineCap = 'round'; g.lineJoin = 'round';

    // Quadrícula dels reptes (owner, reptes G9): un quadret cada 10 passos, una mica més marcada cada 50.
    if (this.opts.grid) {
      const light = T.bg === 1;
      g.setLineDash([]); g.lineWidth = 1;
      for (let v = -140; v <= 140; v += 10) {
        g.strokeStyle = light ? (v % 50 ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.13)') : (v % 50 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.13)');
        g.beginPath(); g.moveTo(Math.round(X(v)) + 0.5, 0); g.lineTo(Math.round(X(v)) + 0.5, c.height); g.stroke();
        if (Math.abs(v) <= 120) { g.beginPath(); g.moveTo(0, Math.round(Y(v)) + 0.5); g.lineTo(c.width, Math.round(Y(v)) + 0.5); g.stroke(); }
      }
    }

    const stroke = (s, color, width, dash) => {
      g.beginPath(); g.setLineDash(dash || []);
      g.strokeStyle = color; g.lineWidth = width;
      g.moveTo(X(s.x1), Y(s.y1)); g.lineTo(X(s.x2), Y(s.y2)); g.stroke();
    };
    const base = Math.max(1.5, k * 1.1);

    if (this.opts.exercise && this.goalVisible && !this.diff && this.targets[0]) {
      for (const s of this.targets[0].segments) stroke(s, 'rgba(168,200,255,0.75)', base, [k * 3, k * 2.5]);
    }
    const segs = this.hideFrom == null ? T.segments : T.segments.slice(0, this.hideFrom);
    for (const s of segs.concat(this.partial || [])) {
      if (s.erase) stroke(s, field, base * 2.4); else stroke(s, PEN[s.color] || PEN[1], base);
    }
    if (this.diff) {
      // Els trams seguits es pinten com un sol camí, perquè el discontinu segueixi les corbes.
      const chain = (list, color, width, dash) => {
        let open = false, lx = NaN, ly = NaN;
        g.setLineDash(dash || []); g.strokeStyle = color; g.lineWidth = width; g.lineJoin = 'round';
        for (const s of list) {
          if (!open || Math.hypot(s.x1 - lx, s.y1 - ly) > 1e-6) {
            if (open) g.stroke();
            g.beginPath(); g.moveTo(X(s.x1), Y(s.y1)); open = true;
          }
          g.lineTo(X(s.x2), Y(s.y2)); lx = s.x2; ly = s.y2;
        }
        if (open) g.stroke();
      };
      chain(this.diff.extra, '#ff8f84', base * 2);
      chain(this.diff.missing, '#a8c8ff', base, [k * 3, k * 2.5]);
    }
    g.setLineDash([]);

    if (T.visible) {
      const p = this.shown, rad = p.heading * Math.PI / 180;
      const pt = (px, py) => [X(p.x + px * Math.cos(rad) + py * Math.sin(rad)), Y(p.y - px * Math.sin(rad) + py * Math.cos(rad))];
      g.beginPath();
      [[0, 11], [-6, -5], [6, -5]].forEach(([a, b], i) => { const [sx, sy] = pt(a, b); if (i) g.lineTo(sx, sy); else g.moveTo(sx, sy); });
      g.closePath();
      // La tortuga ensenya el llapis (owner, 2026-11-11): plena = a baix, buida = a dalt,
      // vora discontínua = goma; i pren el color del llapis. Si el color és el del fons, contrast.
      const ink = T.color === T.bg ? (T.bg === 1 ? PEN[0] : PEN[1]) : (PEN[T.color] || PEN[1]);
      g.fillStyle = T.pen === 'down' ? ink : field; g.fill();
      g.setLineDash(T.pen === 'erase' ? [k * 2.2, k * 1.8] : []);
      g.strokeStyle = ink; g.lineWidth = base; g.stroke(); g.setLineDash([]);
    }
    if (this.opts.onDraw) this.opts.onDraw(this);
  }
}
