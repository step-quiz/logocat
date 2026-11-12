// Posa en marxa una pàgina de capítol: tema, simuladors, activitats i progrés.
import { Monitor } from '../ui/monitor.js';
import { mountPredict, mountQuiz } from '../ui/activitats.js';
import { isDone, markDone } from './progres.js';
import { initTheme } from '../ui/tema.js';
import { initKeyBar } from '../ui/tecles.js';

function tick(host, id) {
  const mark = () => host.classList.toggle('es-fet', isDone(id));
  mark();
  document.addEventListener('logocat:progres', mark);
}

// Pistes dels reptes (owner, G6): «Una pista» i, després, «Una altra pista». Mai codi sencer.
function mountHints(box) {
  const hints = [...box.querySelectorAll('p')];
  hints.forEach((h) => { h.hidden = true; });
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'boto'; b.textContent = 'Una pista';
  let shown = 0;
  b.addEventListener('click', () => {
    hints[shown++].hidden = false;
    if (shown >= hints.length) b.remove(); else b.textContent = 'Una altra pista';
  });
  box.prepend(b);
}

function init() {
  initTheme();
  initKeyBar();

  document.querySelectorAll('.simulador').forEach((node) => {
    const id = node.dataset.id;
    const solutions = [...node.querySelectorAll('script[type="text/logo"]')].map((s) => s.textContent);
    // Amb data-panell, el simulador porta el panell de procediments; el text inicial és opcional.
    const given = node.querySelector('script[type="text/logo-panell"]');
    const exercise = solutions.length > 0;
    // Als exercicis, el panell es desa al navegador i porta «Torna a començar» (owner, revisió 18, M1).
    const panel = node.hasAttribute('data-panell') ? {
      initial: given ? given.textContent.replace(/^\n+|\s+$/g, '') + '\n' : '',
      storageKey: exercise && id ? 'logocat-panell-' + id : null, resettable: exercise && !!id,
    } : null;
    const host = node.closest('section') || node;
    new Monitor(node, {
      exercise, solutions,
      checkPose: node.dataset.comprova === 'dibuix+tortuga',
      failText: node.dataset.siFalla, okText: node.dataset.siEncerta,
      require: node.dataset.exigeix, preload: node.dataset.ordre,
      panel, run: node.dataset.executa, grid: node.hasAttribute('data-quadricula'),
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

  document.querySelectorAll('.pistes').forEach(mountHints);

  // ✓ del capítol: el donen els exercicis marcats amb data-clau (als reptes, els tres del nivell).
  const keys = [...document.querySelectorAll('[data-clau]')].map((k) => k.dataset.id);
  const badge = document.getElementById('capitol-fet');
  if (keys.length && badge) {
    const show = () => { badge.hidden = !keys.every(isDone); };
    show(); document.addEventListener('logocat:progres', show);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
