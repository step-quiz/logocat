// L'Editor lliure: panell de procediments, monitor i columna de botons.
// Disseny aprovat: docs/DECISIONS.md §7.
import { Monitor } from './monitor.js';
import { ProcPanel } from './panell.js';
import { initTheme } from './tema.js';
import { initKeyBar } from './tecles.js';
import { fmtNum } from '../logo/missatges.js';

const KEY = 'logocat-editor-procediments';
const SPEEDS = [3, 1.7, 1, 0.5, 0.2, 0];             // posicions 1–6 del control de velocitat
const COLORS = ['negre', 'blanc', 'verd', 'violeta', 'taronja', 'blau'];
const PENS = { down: 'a baix', up: 'a dalt', erase: 'goma' };
const $ = (id) => document.getElementById(id);

/** Descarrega un fitxer fet al navegador, sense cap servidor. */
function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function init() {
  initTheme();
  initKeyBar();
  const info = $('pas-info');
  const panel = new ProcPanel($('panell'), {
    storageKey: KEY,
    placeholder: 'Aquí van els teus procediments. Per exemple:\n\nPROC QUADRAT\n  REPETEIX 4 [AVANÇA 50 GIRA.D 90]\nFI',
    ids: { area: 'procediments', layer: 'capa', gutter: 'numeros', warn: 'avis', saved: 'desat' },
  });
  const h = panel.hooks();

  const monitor = new Monitor($('monitor'), {
    ...h, toolbar: false, fit: true,
    speed: () => SPEEDS[Number($('velocitat').value) - 1],
    onBusy: (busy, stepping) => {
      $('b-atura').setAttribute('aria-disabled', String(!busy));
      $('b-continua').hidden = !(busy && stepping);
      $('b-desfes').disabled = busy; $('b-reinicia').disabled = busy;
      const st = $('estat');
      st.dataset.estat = busy ? (stepping ? 'pas' : 'treballant') : 'apunt';
      st.lastElementChild.textContent = busy ? (stepping ? 'pas a pas' : 'treballant') : 'a punt';
      if (!busy) info.hidden = true;
      h.onBusy(busy, stepping);
    },
    onBefore: (ev) => {
      h.onBefore(ev);
      if (!ev) return;
      const s = monitor.I.stepInfo();
      $('pas-ara').textContent = ev.text;
      $('pas-on').textContent = s.path || 'a la línia que has escrit';
      $('pas-valors').textContent = s.values.join('   ');
      $('pas-valors-fila').hidden = $('pas-valors-etq').hidden = s.values.length === 0;
      info.hidden = false;
    },
    onDraw: (m) => {
      const T = m.I.turtle;
      $('e-orientacio').textContent = fmtNum(Math.round(T.heading * 10) / 10) + '°';
      $('e-llapis').textContent = PENS[T.pen];
      $('e-color').textContent = COLORS[T.color] || String(T.color);
    },
  });
  panel.start(monitor);

  $('b-pas').addEventListener('click', () => monitor.onStep());
  $('b-continua').addEventListener('click', () => monitor.onContinue());
  $('b-atura').addEventListener('click', () => { if (monitor.busy) monitor.onStop(); });
  $('b-desfes').addEventListener('click', () => monitor.onUndo());
  $('b-reinicia').addEventListener('click', () => monitor.onReset());

  // Desar i obrir els procediments en un fitxer, i desar el dibuix (owner, revisió 18, M2 i M3).
  $('b-desa').addEventListener('click', () => {
    panel.flush();
    download(new Blob([panel.value], { type: 'text/plain;charset=utf-8' }), 'logocat-procediments.txt');
  });
  const file = $('fitxer');
  $('b-obre').addEventListener('click', () => { if (!monitor.busy) file.click(); });
  file.addEventListener('change', () => {
    const f = file.files && file.files[0];
    file.value = '';
    if (!f) return;
    f.text().then((text) => {
      if (panel.value.trim() && !window.confirm('Vols canviar els procediments del panell pels del fitxer?')) return;
      panel.area.value = text.replace(/\r\n?/g, '\n');
      panel.changed(true);
    });
  });
  $('b-dibuix').addEventListener('click', () => {
    monitor.draw();
    monitor.canvas.toBlob((blob) => { if (blob) download(blob, 'logocat-dibuix.png'); }, 'image/png');
  });

  monitor.draw();
  // «Prova-ho» del glossari: la línia surt ja escrita a «?», a punt de prémer Retorn (owner, revisió 15, G4).
  try {
    const prova = new URLSearchParams(location.search).get('prova');
    if (prova) { monitor.input.value = prova; monitor.input.focus(); }
  } catch (e) { /* sense paràmetres */ }
  window.logocatEditor = { monitor, panel };      // per a les proves al navegador
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
