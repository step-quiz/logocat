// ════════════════════════════════════════════════════════
// ui.js — Modals, tema, log, ref panel, onboarding, hamburger
//
// MILLORA: Log amb protecció d'overflow
// MILLORA: Log-resize amb suport tàctil
// MILLORA: Temporitzador de pistes implementat
// ════════════════════════════════════════════════════════

// ── Log ──

function log(msg, cls) {
  const el = document.getElementById('log');
  if (!el) return;
  const d = document.createElement('div');
  if (cls) d.className = 'log-' + cls;
  d.textContent = msg;
  el.appendChild(d);
  // MILLORA: protecció d'overflow
  while (el.children.length > 200) el.removeChild(el.firstChild);
  el.scrollTop = el.scrollHeight;
}

function clearLog() {
  const el = document.getElementById('log');
  if (el) el.innerHTML = '';
}


// ── Indicador d'estat ──

function setStateUI(state) {
  const dot = document.getElementById('state-dot');
  const lbl = document.getElementById('state-lbl');
  if (dot) dot.className = state === 'error' ? 'error' : state === 'idle' ? '' : 'running';
  if (lbl) lbl.textContent = L.t('state.' + state) || state;
}


// ── Modals ──

function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

function initModals() {
  document.querySelectorAll('.modal-bg').forEach(bg =>
    bg.addEventListener('click', e => { if (e.target === bg) bg.classList.remove('open'); })
  );
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-bg.open').forEach(m => m.classList.remove('open'));
    }
  });
}


// ── Tema ──

function toggleLight() {
  document.body.classList.toggle('light');
  localStorage.setItem(L.LS_LIGHT, document.body.classList.contains('light') ? '1' : '0');
  L.redrawAll();
}

function restoreTheme() {
  if (localStorage.getItem(L.LS_LIGHT) === '1') document.body.classList.add('light');
}


// ── Idioma ──

function setCodeLang(lang) {
  if (!L.I18N[lang]) return;
  L.state.currentCodeLang = lang;
  localStorage.setItem('logo-codelang', lang);
  L.rebuildHighlightCache();
  updateLangBtns();
  updateRefPanel();
}

function setUserLang(lang) {
  if (!L.I18N[lang]) return;
  L.state.currentUserLang = lang;
  localStorage.setItem('logo-userlang', lang);
  updateUI();
}

function updateLangBtns() {
  const normalize = t => t.trim().toLowerCase().replace('cast', 'es').replace('cat', 'ca').replace('eng', 'en');
  document.querySelectorAll('#codelang-switcher .lang-btn').forEach(b =>
    b.classList.toggle('active', normalize(b.textContent) === L.state.currentCodeLang)
  );
  document.querySelectorAll('#userlang-switcher .lang-btn').forEach(b =>
    b.classList.toggle('active', normalize(b.textContent) === L.state.currentUserLang)
  );
}

function updateUI() {
  updateLangBtns();

  const ids = {
    'btn-run': 'ui.run', 'btn-step': 'ui.step', 'btn-stop': 'ui.stop',
    'btn-reset': 'ui.reset', 'btn-clear': 'ui.clear_log', 'btn-ref': 'ui.ref_btn',
    'btn-challenges': 'ui.challenges', 'btn-modal-close': 'ui.close',
    'btn-goal': 'ui.goal_btn',
  };
  for (const [id, key] of Object.entries(ids)) {
    const el = document.getElementById(id);
    if (el) el.textContent = L.t(key);
  }

  const mct = document.getElementById('modal-challenges-title');
  if (mct) mct.textContent = L.t('ui.challenges_title');

  const lbls = {
    'lbl-codelang': 'ui.lbl_codelang', 'lbl-userlang': 'ui.lbl_userlang',
    'lbl-speed': 'ui.speed', 'lbl-pos': 'ui.pos',
    'lbl-heading': 'ui.heading', 'lbl-pen': 'ui.pen',
  };
  for (const [id, key] of Object.entries(lbls)) {
    const el = document.getElementById(id);
    if (el) el.textContent = L.t(key);
  }

  const btnTheme = document.getElementById('btn-theme');
  if (btnTheme) btnTheme.textContent = L.t('ui.toggle_theme');

  updateRefPanel();
  L.updateStatus();

  const sl = document.getElementById('speed');
  if (sl) {
    document.getElementById('speed-lbl').textContent =
      L.I18N[L.state.currentUserLang].speed[+sl.value - 1] || sl.value;
  }
}


// ── Ref panel ──

function toggleRef() {
  const S = L.state;
  S.refVisible = !S.refVisible;
  document.getElementById('ref-panel')?.classList.toggle('visible', S.refVisible);
  updateRefPanel();
}

function updateRefPanel() {
  const rp = document.getElementById('ref-panel');
  if (!rp || !L.state.refVisible) return;
  const cmds = L.I18N[L.state.currentCodeLang].commands;
  const kws  = L.I18N[L.state.currentCodeLang].keywords;
  rp.innerHTML =
    `<div class="ref-section-title">${L.escHtml(L.t('ui.ref_cmd'))}</div>` +
    cmds.map(c => `<div class="ref-item"><code>${L.escHtml(c)}</code></div>`).join('') +
    `<div class="ref-section-title">${L.escHtml(L.t('ui.ref_struct'))}</div>` +
    kws.map(k => `<div class="ref-item"><code>${L.escHtml(k)}</code></div>`).join('');
}


// ── Hamburger ──

function initHamburger() {
  const btn     = document.getElementById('topbar-hamburger');
  const actions = document.querySelector('.topbar-actions');
  if (!btn || !actions) return;

  btn.onclick = () => {
    const open = actions.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
  };

  actions.addEventListener('click', e => {
    if (e.target.closest('.btn') || e.target.closest('.lang-btn')) {
      actions.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}


// ── Log resize — amb suport tàctil ──

function initLogResize() {
  const wrap   = document.getElementById('log-wrap');
  const handle = document.getElementById('log-resize');
  if (!wrap || !handle) return;

  let startY, startH;

  function onMove(clientY) {
    const dh = startY - clientY;
    wrap.style.height = Math.max(40, Math.min(startH + dh, window.innerHeight * 0.6)) + 'px';
  }

  // Mouse
  handle.addEventListener('mousedown', e => {
    startY = e.clientY; startH = wrap.offsetHeight;
    e.preventDefault();
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
  function onMouseMove(e) { onMove(e.clientY); }
  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  // Touch (FIX: suport mòbil)
  handle.addEventListener('touchstart', e => {
    startY = e.touches[0].clientY; startH = wrap.offsetHeight;
    e.preventDefault();
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  });
  function onTouchMove(e) { e.preventDefault(); onMove(e.touches[0].clientY); }
  function onTouchEnd() {
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
  }
}


// ── Speed slider ──

function initSpeedSlider() {
  const sp = document.getElementById('speed');
  if (!sp) return;
  sp.addEventListener('input', () => {
    const lbl = document.getElementById('speed-lbl');
    if (lbl) lbl.textContent = L.I18N[L.state.currentUserLang].speed[+sp.value - 1] || sp.value;
  });
}

function getSpeedMs() {
  const v = parseInt(document.getElementById('speed')?.value || 3);
  return L.SPEED_MS[v - 1] ?? 80;
}


// ── Onboarding ──

function maybeShowOnboard() {
  if (!localStorage.getItem(L.LS_ONBOARD)) openOnboard();
}

function openOnboard() {
  L.state.onboardStep = 0;
  renderOnboardStep();
  openModal('modal-onboard');
}

function renderOnboardStep() {
  const S = L.state;
  const steps = L.I18N[S.currentUserLang].onboard;
  const s = steps[S.onboardStep];
  if (!s) return;

  document.getElementById('onboard-icon').textContent  = s.icon;
  document.getElementById('onboard-title').textContent = s.title;
  document.getElementById('onboard-body').innerHTML    = L.sanitizeHtml(s.body);

  document.getElementById('onboard-dots').innerHTML = steps.map((_, i) =>
    `<div class="onboard-dot${i === S.onboardStep ? ' active' : ''}"></div>`
  ).join('');

  const prev = document.getElementById('onboard-prev');
  const next = document.getElementById('onboard-next');
  prev.style.visibility = S.onboardStep === 0 ? 'hidden' : 'visible';
  next.textContent = S.onboardStep === steps.length - 1
    ? (L.t('ui.onboard_start') || '🚀')
    : (L.t('ui.onboard_next') || '→');

  document.getElementById('onboard-skip').textContent = L.t('ui.onboard_skip');
}

function onboardNext() {
  const steps = L.I18N[L.state.currentUserLang].onboard;
  if (L.state.onboardStep >= steps.length - 1) { onboardSkip(); return; }
  L.state.onboardStep++;
  renderOnboardStep();
}

function onboardPrev() {
  if (L.state.onboardStep > 0) {
    L.state.onboardStep--;
    renderOnboardStep();
  }
}

function onboardSkip() {
  closeModal('modal-onboard');
  localStorage.setItem(L.LS_ONBOARD, '1');
  setTimeout(L.openChallenges, 200);
}


// ── Exporta ──

L.log           = log;
L.clearLog      = clearLog;
L.setStateUI    = setStateUI;
L.openModal     = openModal;
L.closeModal    = closeModal;
L.toggleLight   = toggleLight;
L.restoreTheme  = restoreTheme;
L.setCodeLang   = setCodeLang;
L.setUserLang   = setUserLang;
L.toggleRef     = toggleRef;
L.updateUI      = updateUI;
L.getSpeedMs    = getSpeedMs;
L.maybeShowOnboard = maybeShowOnboard;

L.initModals     = initModals;
L.initHamburger  = initHamburger;
L.initLogResize  = initLogResize;
L.initSpeedSlider = initSpeedSlider;

// Globals per a HTML onclick
window.setCodeLang   = setCodeLang;
window.setUserLang   = setUserLang;
window.toggleRef     = toggleRef;
window.toggleLight   = toggleLight;
window.closeModal    = closeModal;
window.clearLog      = clearLog;
window.onboardNext   = onboardNext;
window.onboardPrev   = onboardPrev;
window.onboardSkip   = onboardSkip;
