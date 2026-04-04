// ════════════════════════════════════════════════════════
// state.js — Estat centralitzat (substitueix les globals disperses)
// ════════════════════════════════════════════════════════

L.state = {
  // Idiomes
  currentCodeLang: localStorage.getItem('logo-codelang') || 'ca',
  currentUserLang: localStorage.getItem('logo-userlang') || 'ca',

  // Tortuga
  turtle: { x: 0, y: 0, heading: 0, penDown: true },
  drawHistory: [],

  // Canvas
  ctxDraw:   null,
  ctxTurtle: null,
  canvasW:   0,
  canvasH:   0,

  // Execució
  running:   false,
  stepping:  false,
  iterator:  null,
  runTimer:  null,

  // Repte actiu
  currentChallengeId: null,

  // Pistes
  hintIdx:         0,
  hintCountdownId: null,

  // UI
  refVisible:    false,
  onboardStep:   0,
  acSelectedIdx: 0,
};
