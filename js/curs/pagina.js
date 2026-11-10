// Posa en marxa una pàgina de capítol: tema, simuladors, activitats i progrés.
import { Monitor } from '../ui/monitor.js';
import { mountPredict, mountQuiz } from '../ui/activitats.js';
import { isDone, markDone } from './progres.js';

// ── Tema clar / fosc ──
const THEME_KEY = 'logocat-tema';
function applyTheme(t) { document.documentElement.dataset.theme = t; }
function initTheme() {
  let t = null;
  try { t = localStorage.getItem(THEME_KEY); } catch (e) { /* sense emmagatzematge */ }
  if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  applyTheme(t);
  const b = document.getElementById('boto-tema');
  if (!b) return;
  const label = () => b.setAttribute('aria-label', document.documentElement.dataset.theme === 'dark' ? 'Canvia a tema clar' : 'Canvia a tema fosc');
  label();
  b.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next); label();
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* sense emmagatzematge */ }
  });
}

function tick(host, id) {
  const mark = () => host.classList.toggle('es-fet', isDone(id));
  mark();
  document.addEventListener('logocat:progres', mark);
}

function init() {
  initTheme();

  document.querySelectorAll('.simulador').forEach((node) => {
    const id = node.dataset.id;
    const solutions = [...node.querySelectorAll('script[type="text/logo"]')].map((s) => s.textContent);
    const exercise = solutions.length > 0;
    const host = node.closest('section') || node;
    new Monitor(node, {
      exercise, solutions,
      checkPose: node.dataset.comprova === 'dibuix+tortuga',
      failText: node.dataset.siFalla, okText: node.dataset.siEncerta,
      onSolved: () => { if (id) markDone(id); },
    });
    if (exercise && id) tick(host, id);
  });

  document.querySelectorAll('.prediu').forEach((node) => {
    const id = node.dataset.id, host = node.closest('section') || node;
    mountPredict(node, { onSolved: () => id && markDone(id) });
    if (id) tick(host, id);
  });

  document.querySelectorAll('.quiz').forEach((node) => {
    const id = node.dataset.id, host = node.closest('section') || node;
    mountQuiz(node, { onSolved: () => id && markDone(id) });
    if (id) tick(host, id);
  });

  // ✓ del capítol: el dona l'exercici marcat amb data-clau.
  const key = document.querySelector('[data-clau]');
  const badge = document.getElementById('capitol-fet');
  if (key && badge) {
    const show = () => { badge.hidden = !isDone(key.dataset.id); };
    show(); document.addEventListener('logocat:progres', show);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
