// El panell de procediments: un textarea sota una capa amb colors i números de línia.
// El fan servir l'Editor lliure i els simuladors dels capítols (a partir del capítol 3).
import { LogoError, describe } from '../logo/missatges.js';

const KEYWORDS = new Set(['PROC', 'FI', 'REPETEIX', 'SI']);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

export class ProcPanel {
  /**
   * opts: { initial, storageKey, resettable, placeholder, ids: { area, layer, gutter, warn, saved } }
   *   resettable: botó «Torna a començar», que torna al text inicial (exercicis, revisió 18, M1)
   * Després de crear el Monitor amb `panel.hooks()`, cal fer `panel.monitor = monitor`.
   */
  constructor(root, opts = {}) {
    this.root = root; this.opts = opts; this.monitor = null;
    this.marks = {};           // línia → [{ from, to, cls }]
    this.tint = {};            // línia → 'ara' | 'err'
    this.dirty = false; this.timer = null; this.names = new Set();
    const ids = opts.ids || {};

    const cap = el('div', 'panell-cap');
    cap.appendChild(el('span', 'panell-titol', 'Procediments'));
    this.saved = el('span', null, opts.storageKey ? 'desat' : ''); if (ids.saved) this.saved.id = ids.saved;
    cap.appendChild(this.saved);
    if (opts.resettable) {
      const again = el('button', 'boto panell-torna', 'Torna a començar'); again.type = 'button';
      again.addEventListener('click', () => {
        if (this.monitor && this.monitor.busy) return;
        if (this.area.value === (opts.initial || '') || window.confirm('Vols tornar a començar? Es perdrà el que has escrit al panell.')) this.resetText();
      });
      cap.appendChild(again);
    }
    const code = el('div', 'panell-codi');
    this.gutter = el('pre', 'numeros', '1'); this.gutter.setAttribute('aria-hidden', 'true'); if (ids.gutter) this.gutter.id = ids.gutter;
    const stack = el('div', 'pila');
    this.layer = el('pre', 'capa'); this.layer.setAttribute('aria-hidden', 'true'); if (ids.layer) this.layer.id = ids.layer;
    this.area = el('textarea'); if (ids.area) this.area.id = ids.area;
    this.area.spellcheck = false; this.area.autocomplete = 'off'; this.area.wrap = 'off';
    this.area.setAttribute('autocapitalize', 'characters');
    this.area.setAttribute('autocorrect', 'off');          // l'iPad no ha de «corregir» les paraules de LOGO (revisió 18, U4)
    this.area.setAttribute('aria-label', 'Procediments: escriu-hi els teus PROC … FI');
    if (opts.placeholder) this.area.placeholder = opts.placeholder;
    stack.appendChild(this.layer); stack.appendChild(this.area);
    code.appendChild(this.gutter); code.appendChild(stack);
    this.warn = el('p', 'panell-avis'); this.warn.setAttribute('role', 'status'); this.warn.hidden = true; if (ids.warn) this.warn.id = ids.warn;
    root.appendChild(cap); root.appendChild(code); root.appendChild(this.warn);

    let text = opts.initial || '';
    if (opts.storageKey) { try { text = localStorage.getItem(opts.storageKey) || text; } catch (e) { /* sense emmagatzematge */ } }
    this.area.value = text;

    this.area.addEventListener('input', () => this.changed(false));
    this.area.addEventListener('scroll', () => this.syncScroll());
    this.area.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || e.shiftKey || this.area.readOnly) return;
      e.preventDefault();
      this.area.setRangeText('  ', this.area.selectionStart, this.area.selectionEnd, 'end');
      this.changed(false);
    });
  }

  get I() { return this.monitor.I; }
  get value() { return this.area.value; }

  /** Posa-ho en marxa quan el monitor ja existeix. */
  start(monitor) { this.monitor = monitor; this.define(); this.render(); }

  /** Torna al text inicial (botó «Reinicia» dels exercicis). */
  resetText() { this.area.value = this.opts.initial || ''; this.tint = {}; this.flush(); }

  // ── Panell → intèrpret ──
  define() {
    try {
      this.I.defineAll(this.area.value);
      this.warn.hidden = true; this.warn.textContent = '';
    } catch (e) {
      if (!(e instanceof LogoError)) throw e;
      const m = describe(e, this.I.knownWords());
      this.warn.textContent = [m.line1, ...m.hints].join(' · ');
      this.warn.hidden = false;
    }
  }
  flush() {
    clearTimeout(this.timer); this.timer = null;
    if (this.monitor.busy) { this.dirty = true; return; }
    this.dirty = false;
    this.define();
    if (this.opts.storageKey) {
      try { localStorage.setItem(this.opts.storageKey, this.area.value); this.saved.textContent = 'desat'; }
      catch (e) { this.saved.textContent = 'no s\'ha pogut desar'; }
    }
    this.render();
  }
  changed(now) {
    this.tint = {};
    if (this.opts.storageKey) this.saved.textContent = 'desant…';
    this.render();
    clearTimeout(this.timer);
    if (now && !this.monitor.busy) this.flush(); else { this.dirty = true; this.timer = setTimeout(() => this.flush(), 400); }
  }

  // ── Colors ──
  paint(text) {
    return text.split(/(\s+|[[\]()+*/=<>])/).map((chunk) => {
      if (!chunk) return '';
      const up = chunk.toUpperCase();
      let cls = '';
      if (KEYWORDS.has(up)) cls = 'k';
      else if (chunk[0] === ':') cls = 'v';
      else if (/^\d+(\.\d+)?$/.test(chunk)) cls = 'n';
      else if (this.I.prims[up]) cls = 'p';
      else if (this.I.procs.has(up) || this.names.has(up)) cls = 'u';
      return cls ? `<span class="${cls}">${esc(chunk)}</span>` : esc(chunk);
    }).join('');
  }
  render() {
    const lines = this.area.value.split('\n');
    this.names = new Set(lines.map((l) => (l.match(/^\s*PROC\s+(\S+)/i) || [])[1]).filter(Boolean).map((n) => n.toUpperCase()));
    this.gutter.textContent = lines.map((_, i) => i + 1).join('\n');
    this.layer.innerHTML = lines.map((line, i) => {
      const ms = (this.marks[i] || []).slice().sort((a, b) => a.from - b.from);
      let html = '', at = 0;
      for (const m of ms) {
        if (m.from < at) continue;
        html += this.paint(line.slice(at, m.from)) + `<mark class="${m.cls}">${this.paint(line.slice(m.from, m.to))}</mark>`;
        at = m.to;
      }
      html += this.paint(line.slice(at));
      return `<div class="l${this.tint[i] ? ' l--' + this.tint[i] : ''}">${html || ' '}</div>`;
    }).join('');
    this.syncScroll();
  }
  syncScroll() { this.layer.scrollTop = this.gutter.scrollTop = this.area.scrollTop; this.layer.scrollLeft = this.area.scrollLeft; }
  reveal(line) {
    if (line == null) return;
    const lh = parseFloat(getComputedStyle(this.area).lineHeight) || 26;
    const top = line * lh;
    if (top < this.area.scrollTop || top > this.area.scrollTop + this.area.clientHeight - 2 * lh) this.area.scrollTop = Math.max(0, top - this.area.clientHeight / 3);
    this.syncScroll();
  }
  focusProc(name) {
    this.flush();
    let p = this.I.procs.get(name);
    if (!p) {
      this.area.value = this.area.value.replace(/\s*$/, '') + (this.area.value.trim() ? '\n\n' : '') + `PROC ${name}\n  \nFI\n`;
      this.flush(); p = this.I.procs.get(name);
    }
    if (!p) return;
    const lines = this.area.value.split('\n');
    const line = Math.min(p.span[0] + 1, lines.length - 1);
    const offset = lines.slice(0, line).reduce((n, l) => n + l.length + 1, 0) + lines[line].length;
    this.area.focus(); this.area.setSelectionRange(offset, offset); this.reveal(line);
  }

  /** Les connexions que el Monitor necessita per treballar amb aquest panell. */
  hooks() {
    return {
      stepOnBefore: true,
      beforeRun: () => { this.tint = {}; this.flush(); },
      onBusy: (busy) => {
        this.area.readOnly = busy;
        if (!busy) { this.marks = {}; this.render(); if (this.dirty) this.flush(); }
      },
      onBefore: (ev) => {
        this.marks = {}; this.tint = {};
        if (ev) {
          if (ev.panelLine != null) {
            this.tint[ev.panelLine] = 'ara';
            (this.marks[ev.panelLine] = this.marks[ev.panelLine] || []).push({ from: ev.from, to: ev.to, cls: 'seguent' });
          }
          for (const c of ev.callers) (this.marks[c.panelLine] = this.marks[c.panelLine] || []).push({ from: c.from, to: c.to, cls: 'crida' });
        }
        this.render(); if (ev) this.reveal(ev.panelLine);
      },
      onEvent: (ev) => {
        if (ev.type === 'defined') {
          this.area.value = this.area.value.replace(/\s*$/, '') + (this.area.value.trim() ? '\n\n' : '') + ev.source + '\n';
          this.changed(true);
        } else if (ev.type === 'forget' && ev.span) {
          const lines = this.area.value.split('\n');
          lines.splice(ev.span[0], ev.span[1] - ev.span[0] + 1);
          this.area.value = lines.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+/, '');
          this.changed(true);
        } else if (ev.type === 'edit') {
          this.focusProc(ev.name);
        }
      },
      onError: (err) => {
        if (err.where && err.where.panelLine != null) { this.tint[err.where.panelLine] = 'err'; this.render(); this.reveal(err.where.panelLine); }
      },
      afterRestore: () => this.define(),
    };
  }
}
