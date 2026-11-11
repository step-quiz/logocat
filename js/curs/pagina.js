// Posa en marxa una pàgina de capítol: tema, simuladors, activitats i progrés.
import { Monitor } from '../ui/monitor.js';
import { mountPredict, mountQuiz } from '../ui/activitats.js';
import { isDone, markDone } from './progres.js';
import { initTheme } from '../ui/tema.js';

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
    // Amb data-panell, el simulador porta el panell de procediments; el text inicial és opcional.
    const given = node.querySelector('script[type="text/logo-panell"]');
    const panel = node.hasAttribute('data-panell') ? { initial: given ? given.textContent.replace(/^\n+|\s+$/g, '') + '\n' : '' } : null;
    const exercise = solutions.length > 0;
    const host = node.closest('section') || node;
    new Monitor(node, {
      exercise, solutions,
      checkPose: node.dataset.comprova === 'dibuix+tortuga',
      failText: node.dataset.siFalla, okText: node.dataset.siEncerta,
      require: node.dataset.exigeix, preload: node.dataset.ordre,
      panel, run: node.dataset.executa,
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
