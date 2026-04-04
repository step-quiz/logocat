// ════════════════════════════════════════════════════════
// main.js — Inicialització: connecta tots els mòduls
//
// Depèn de: tots els mòduls anteriors
// MILLORA: ResizeObserver + requestAnimationFrame
// en comptes de window.resize sense debounce
// ════════════════════════════════════════════════════════

// Validar que tots els mòduls s'han carregat correctament
const _required = ['state','I18N','tokenize','parse','interpret','setupCanvases',
  'initEditor','initModals','updateUI','maybeShowOnboard','openChallenges'];
for (const fn of _required) {
  if (!L[fn]) throw new Error(`main.js: L.${fn} no trobat — comprova l'ordre de càrrega dels scripts`);
}

(function init() {
  const S = L.state;

  // Tema
  L.restoreTheme();

  // Modals, hamburger, log-resize, speed slider
  L.initModals();
  L.initHamburger();
  L.initLogResize();
  L.initSpeedSlider();

  // Canvas
  L.setupCanvases();

  // MILLORA: ResizeObserver amb requestAnimationFrame (debounce natural)
  const canvasArea = document.getElementById('canvas-area');
  if (canvasArea) {
    let rafId = null;
    new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => { rafId = null; L.setupCanvases(); });
    }).observe(canvasArea);
  }

  // Editor
  L.initEditor();
  const ta = document.getElementById('code-editor');
  if (ta) {
    ta.value = localStorage.getItem(L.LS_CODE) ||
      '// Escriu el teu codi Logo aquí!\n// Prova: avança(100)\n\n';
    L.updateEditor();
  }

  // UI amb l'idioma actual
  L.updateUI();

  // Onboarding
  setTimeout(L.maybeShowOnboard, 500);
})();
