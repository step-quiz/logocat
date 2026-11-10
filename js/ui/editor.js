// L'Editor lliure: panell de procediments a l'esquerra, monitor a la dreta.
// Disseny aprovat: docs/DECISIONS.md §7 (maqueta «Editor lliure» i «Pas a pas»).
import { Monitor } from './monitor.js';
import { initTheme } from './tema.js';
import { LogoError, describe, fmtNum } from '../logo/missatges.js';

const KEY = 'logocat-editor-procediments';
const SPEEDS = [3, 1.7, 1, 0.5, 0.2, 0];             // posicions 1–6 del control de velocitat
const COLORS = ['negre', 'blanc', 'verd', 'violeta', 'taronja', 'blau'];
const PENS = { down: 'a baix', up: 'a dalt', erase: 'goma' };
const KEYWORDS = new Set(['PROC', 'FI', 'REPETEIX', 'SI']);
const $ = (id) => document.getElementById(id);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function init() {
  initTheme();
  const area = $('procediments'), layer = $('capa'), gutter = $('numeros');
  const warn = $('avis'), saved = $('desat'), info = $('pas-info');
  let marks = {};            // línia del panell → [{ from, to, cls }]
  let tint = {};             // línia del panell → 'ara' | 'err'
  let dirty = false, timer = null;

  try { area.value = localStorage.getItem(KEY) || ''; } catch (e) { /* sense emmagatzematge */ }

  const monitor = new Monitor($('monitor'), {
    toolbar: false, maxHeight: 460, stepOnBefore: true,
    speed: () => SPEEDS[Number($('velocitat').value) - 1],
    beforeRun: () => { tint = {}; flush(); },
    onBusy: (busy, stepping) => {
      area.readOnly = busy;
      $('b-atura').setAttribute('aria-disabled', String(!busy));
      $('b-continua').hidden = !(busy && stepping);
      $('b-desfes').disabled = busy; $('b-reinicia').disabled = busy;
      const st = $('estat');
      st.dataset.estat = busy ? (stepping ? 'pas' : 'treballant') : 'apunt';
      st.lastElementChild.textContent = busy ? (stepping ? 'pas a pas' : 'treballant') : 'a punt';
      if (!busy) { marks = {}; info.hidden = true; render(); if (dirty) flush(); }
    },
    onBefore: (ev) => {
      marks = {}; tint = {};
      if (!ev) { render(); return; }
      if (ev.panelLine != null) {
        tint[ev.panelLine] = 'ara';
        (marks[ev.panelLine] = marks[ev.panelLine] || []).push({ from: ev.from, to: ev.to, cls: 'seguent' });
      }
      for (const c of ev.callers) (marks[c.panelLine] = marks[c.panelLine] || []).push({ from: c.from, to: c.to, cls: 'crida' });
      const s = monitor.I.stepInfo();
      $('pas-ara').textContent = ev.text;
      $('pas-on').textContent = s.path || 'a la línia que has escrit';
      $('pas-valors').textContent = s.values.join('   ');
      $('pas-valors-fila').hidden = $('pas-valors-etq').hidden = s.values.length === 0;
      info.hidden = false;
      render(); reveal(ev.panelLine);
    },
    onEvent: (ev) => {
      if (ev.type === 'defined') {
        area.value = area.value.replace(/\s*$/, '') + (area.value.trim() ? '\n\n' : '') + ev.source + '\n';
        changed(true);
      } else if (ev.type === 'forget' && ev.span) {
        const lines = area.value.split('\n');
        lines.splice(ev.span[0], ev.span[1] - ev.span[0] + 1);
        area.value = lines.join('\n').replace(/\n{3,}/g, '\n\n').replace(/^\n+/, '');
        changed(true);
      } else if (ev.type === 'edit') {
        focusProc(ev.name);
      }
    },
    onError: (err) => { if (err.where && err.where.panelLine != null) { tint[err.where.panelLine] = 'err'; render(); reveal(err.where.panelLine); } },
    afterRestore: () => define(),
    onDraw: (m) => {
      const T = m.I.turtle;
      $('e-orientacio').textContent = fmtNum(Math.round(T.heading * 10) / 10) + '°';
      $('e-llapis').textContent = PENS[T.pen];
      $('e-color').textContent = COLORS[T.color] || String(T.color);
    },
  });

  // ── Panell → intèrpret ──
  function define() {
    try {
      monitor.I.defineAll(area.value);
      warn.hidden = true; warn.textContent = '';
    } catch (e) {
      if (!(e instanceof LogoError)) throw e;
      const m = describe(e, monitor.I.knownWords());
      warn.textContent = [m.line1, ...m.hints].join(' · ');
      warn.hidden = false;
    }
  }
  function flush() {
    clearTimeout(timer); timer = null;
    if (monitor.busy) { dirty = true; return; }
    dirty = false;
    define();
    try { localStorage.setItem(KEY, area.value); saved.textContent = 'desat'; }
    catch (e) { saved.textContent = 'no s\'ha pogut desar'; }
    render();
  }
  function changed(now) {
    tint = {};
    saved.textContent = 'desant…';
    render();
    clearTimeout(timer);
    if (now && !monitor.busy) flush(); else { dirty = true; timer = setTimeout(flush, 400); }
  }

  // ── Colors del codi ──
  function paint(text) {
    return text.split(/(\s+|[\[\]()+*\/=<>])/).map((chunk) => {
      if (!chunk) return '';
      const up = chunk.toUpperCase();
      let cls = '';
      if (KEYWORDS.has(up)) cls = 'k';
      else if (chunk[0] === ':') cls = 'v';
      else if (/^\d+(\.\d+)?$/.test(chunk)) cls = 'n';
      else if (monitor.I.prims[up]) cls = 'p';
      else if (monitor.I.procs.has(up) || names.has(up)) cls = 'u';
      return cls ? `<span class="${cls}">${esc(chunk)}</span>` : esc(chunk);
    }).join('');
  }
  let names = new Set();
  function render() {
    const lines = area.value.split('\n');
    names = new Set(lines.map((l) => (l.match(/^\s*PROC\s+(\S+)/i) || [])[1]).filter(Boolean).map((n) => n.toUpperCase()));
    gutter.textContent = lines.map((_, i) => i + 1).join('\n');
    layer.innerHTML = lines.map((line, i) => {
      const ms = (marks[i] || []).slice().sort((a, b) => a.from - b.from);
      let html = '', at = 0;
      for (const m of ms) {
        if (m.from < at) continue;
        html += paint(line.slice(at, m.from)) + `<mark class="${m.cls}">${paint(line.slice(m.from, m.to))}</mark>`;
        at = m.to;
      }
      html += paint(line.slice(at));
      return `<div class="l${tint[i] ? ' l--' + tint[i] : ''}">${html || ' '}</div>`;
    }).join('');
    layer.scrollTop = gutter.scrollTop = area.scrollTop; layer.scrollLeft = area.scrollLeft;
  }
  function reveal(line) {
    if (line == null) return;
    const lh = parseFloat(getComputedStyle(area).lineHeight) || 26;
    const top = line * lh;
    if (top < area.scrollTop || top > area.scrollTop + area.clientHeight - 2 * lh) area.scrollTop = Math.max(0, top - area.clientHeight / 3);
    layer.scrollTop = gutter.scrollTop = area.scrollTop;
  }
  function focusProc(name) {
    flush();
    let p = monitor.I.procs.get(name);
    if (!p) {
      area.value = area.value.replace(/\s*$/, '') + (area.value.trim() ? '\n\n' : '') + `PROC ${name}\n  \nFI\n`;
      flush(); p = monitor.I.procs.get(name);
    }
    if (!p) return;
    const lines = area.value.split('\n');
    const line = Math.min(p.span[0] + 1, lines.length - 1);
    const offset = lines.slice(0, line).reduce((n, l) => n + l.length + 1, 0) + lines[line].length;
    area.focus(); area.setSelectionRange(offset, offset); reveal(line);
  }

  area.addEventListener('input', () => changed(false));
  area.addEventListener('scroll', () => { layer.scrollTop = gutter.scrollTop = area.scrollTop; layer.scrollLeft = area.scrollLeft; });
  area.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || e.shiftKey || area.readOnly) return;
    e.preventDefault();
    area.setRangeText('  ', area.selectionStart, area.selectionEnd, 'end');
    changed(false);
  });

  $('b-pas').addEventListener('click', () => monitor.onStep());
  $('b-continua').addEventListener('click', () => monitor.onContinue());
  $('b-atura').addEventListener('click', () => { if (monitor.busy) monitor.onStop(); });
  $('b-desfes').addEventListener('click', () => monitor.onUndo());
  $('b-reinicia').addEventListener('click', () => monitor.onReset());

  define(); render(); monitor.draw();
  window.logocatEditor = { monitor };      // per a les proves al navegador
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
