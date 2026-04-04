// ════════════════════════════════════════════════════════
// challenges.js — Llistat, càrrega, validació, pistes, goal
//
// MILLORA: temporitzador de pistes implementat (abans era codi mort)
// ════════════════════════════════════════════════════════

// ── Llistar reptes ──

function openChallenges() {
  const S          = L.state;
  const challenges = L.I18N[S.currentUserLang].challenges;
  const list       = document.getElementById('challenges-list');
  if (!list) return;

  const groups = {};
  for (const ch of challenges) {
    const cat = ch.category || 'basic';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(ch);
  }

  function renderCards(arr) {
    return arr.map(ch => {
      const num = ch.id >= 100 ? `★ ${ch.id - 100}` : `${L.t('log.challenge')} ${ch.id}`;
      return `<div class="ch-card" data-challenge-id="${ch.id}" role="button" tabindex="0">` +
        `<div class="ch-num">${L.escHtml(num)}</div>` +
        `<div class="ch-title">${L.escHtml(ch.title)}</div>` +
        `<div class="ch-desc">${L.sanitizeHtml(ch.desc)}</div>` +
        `<div><span class="ch-tag ${L.escHtml(ch.level)}">${L.escHtml(L.t('ui.level_' + ch.level))}</span></div>` +
        `</div>`;
    }).join('');
  }

  const catOrder = ['basic', 'advanced'];
  let html = '';
  catOrder.forEach((cat, i) => {
    if (!groups[cat]) return;
    const label = L.t('ui.category_' + cat) || cat;
    html += `<details class="ch-details"${i === 0 ? ' open' : ''}>` +
      `<summary class="ch-summary">${L.escHtml(label)}<span class="ch-count">${groups[cat].length}</span></summary>` +
      `<div class="ch-grid">${renderCards(groups[cat])}</div></details>`;
  });

  list.innerHTML = html;
  list.onclick = e => {
    const card = e.target.closest('[data-challenge-id]');
    if (card) loadChallenge(+card.dataset.challengeId);
  };

  L.openModal('modal-challenges');
}


// ── Carregar un repte ──

function loadChallenge(id) {
  const S      = L.state;
  const chUI   = L.I18N[S.currentUserLang].challenges.find(c => c.id === id);
  const chCode = L.I18N[S.currentCodeLang].challenges.find(c => c.id === id);
  if (!chUI || !chCode) return;

  S.currentChallengeId = id;
  L.resetCanvas();

  const ta = document.getElementById('code-editor');
  if (ta) {
    ta.value = chCode.code;
    localStorage.setItem(L.LS_CODE, chCode.code);
    L.updateEditor();
  }

  L.closeModal('modal-challenges');

  const lbl = id >= 100 ? `★ ${id - 100}` : `${L.t('log.challenge')} ${id}`;
  L.log(`${lbl}: ${chUI.title}`, 'ok');

  // Botó Objectiu
  const btnGoal = document.getElementById('btn-goal');
  if (btnGoal) { btnGoal.style.display = ''; btnGoal.textContent = L.t('ui.goal_btn'); }

  // Botó Pista — amb temporitzador
  const btnHint = document.getElementById('btn-hint');
  if (btnHint) {
    btnHint.style.display = '';
    S.hintIdx = 0;
    startHintCountdown(btnHint);
  }

  document.getElementById('hint-panel')?.classList.remove('visible');
}


// ── Temporitzador de pistes ──
// FIX: el hint_locked amb {time} ara funciona de veritat

function startHintCountdown(btn) {
  const S = L.state;

  // Cancel·lar temporitzador anterior
  if (S.hintCountdownId) clearInterval(S.hintCountdownId);

  let remaining = L.HINT_DELAY_S;
  btn.disabled = true;
  btn.textContent = L.t('ui.hint_locked').replace('{time}', remaining + 's');

  S.hintCountdownId = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(S.hintCountdownId);
      S.hintCountdownId = null;
      btn.disabled = false;
      btn.textContent = L.t('ui.hint_btn');
    } else {
      btn.textContent = L.t('ui.hint_locked').replace('{time}', remaining + 's');
    }
  }, 1000);
}

function showNextHint() {
  const S  = L.state;
  const ch = L.I18N[S.currentUserLang]?.challenges?.find(c => c.id === S.currentChallengeId);
  if (!ch || !ch.hints) return;

  const panel = document.getElementById('hint-panel');
  if (S.hintIdx >= ch.hints.length) {
    if (panel) panel.textContent = '✓';
    return;
  }

  if (panel) {
    panel.textContent = ch.hints[S.hintIdx];
    panel.classList.add('visible');
  }
  S.hintIdx++;

  const btn = document.getElementById('btn-hint');
  if (btn) {
    btn.textContent = S.hintIdx < ch.hints.length ? (L.t('ui.hint_btn') + ' →') : '✓';
  }
}


// ── Objectiu (goal modal) ──

function showGoalModal() {
  const S  = L.state;
  if (!S.currentChallengeId) return;
  const ch = L.I18N[S.currentUserLang]?.challenges?.find(c => c.id === S.currentChallengeId);
  if (!ch) return;

  document.getElementById('modal-goal-title').textContent = L.t('ui.goal_title');

  const lbl = ch.id >= 100 ? `★ ${ch.id - 100}` : `${L.t('log.challenge')} ${ch.id}`;
  document.getElementById('goal-challenge-name').textContent = `${lbl}: ${ch.title}`;
  document.getElementById('goal-instructions').innerHTML     = L.sanitizeHtml(ch.desc);
  document.getElementById('goal-visual-label').textContent   = L.t('ui.goal_desc');
  document.getElementById('btn-goal-close').textContent      = L.t('ui.close');

  renderGoalPreview(ch.goal);
  L.openModal('modal-goal');
}

function renderGoalPreview(goalCode) {
  const canvas = document.getElementById('goal-canvas');
  if (!canvas || !goalCode) return;

  const ctx = canvas.getContext('2d');
  const w   = canvas.width;
  const h   = canvas.height;
  ctx.clearRect(0, 0, w, h);

  try {
    const segs = L.executeGoalCode(goalCode);
    if (segs.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const s of segs) {
      minX = Math.min(minX, s.x1, s.x2); maxX = Math.max(maxX, s.x1, s.x2);
      minY = Math.min(minY, s.y1, s.y2); maxY = Math.max(maxY, s.y1, s.y2);
    }

    const pad   = 20;
    const dw    = maxX - minX || 1;
    const dh    = maxY - minY || 1;
    const scale = Math.min((w - pad * 2) / dw, (h - pad * 2) / dh);
    const ox    = w / 2 - (minX + maxX) / 2 * scale;
    const oy    = h / 2 - (minY + maxY) / 2 * scale;

    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--pen-color').trim() || '#00e676';
    ctx.lineWidth = 2;
    ctx.lineCap   = 'round';

    for (const s of segs) {
      ctx.beginPath();
      ctx.moveTo(ox + s.x1 * scale, oy + s.y1 * scale);
      ctx.lineTo(ox + s.x2 * scale, oy + s.y2 * scale);
      ctx.stroke();
    }
  } catch (e) { /* silenciar errors de previsualització */ }
}


// ── Validació de repte (invariant a translació) ──

function normalizeSegments(segs) {
  if (segs.length === 0) return [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const s of segs) {
    minX = Math.min(minX, s.x1, s.x2); maxX = Math.max(maxX, s.x1, s.x2);
    minY = Math.min(minY, s.y1, s.y2); maxY = Math.max(maxY, s.y1, s.y2);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  return segs.map(s => {
    let x1 = Math.round((s.x1 - cx) * 10) / 10;
    let y1 = Math.round((s.y1 - cy) * 10) / 10;
    let x2 = Math.round((s.x2 - cx) * 10) / 10;
    let y2 = Math.round((s.y2 - cy) * 10) / 10;
    // Normalitzar direcció del segment
    if (x1 > x2 || (x1 === x2 && y1 > y2)) {
      [x1, y1, x2, y2] = [x2, y2, x1, y1];
    }
    return { x1, y1, x2, y2 };
  });
}

function checkChallengeSuccess() {
  const S = L.state;
  if (!S.currentChallengeId) return;

  const ch = L.I18N.en.challenges.find(c => c.id === S.currentChallengeId);
  if (!ch || !ch.goal) return;

  try {
    const goalSegs = L.executeGoalCode(ch.goal);
    const normGoal = normalizeSegments(goalSegs);
    const normUser = normalizeSegments(S.drawHistory);
    if (normGoal.length === 0 || normUser.length === 0) return;

    const tol = 3;
    function segMatch(a, b) {
      return Math.abs(a.x1 - b.x1) < tol && Math.abs(a.y1 - b.y1) < tol &&
             Math.abs(a.x2 - b.x2) < tol && Math.abs(a.y2 - b.y2) < tol;
    }

    let matched = 0;
    for (const gs of normGoal) {
      if (normUser.some(us => segMatch(gs, us))) matched++;
    }
    if (matched < normGoal.length * 0.85) return;
  } catch (e) { return; }

  // Repte superat!
  const chUI = L.I18N[S.currentUserLang].challenges.find(c => c.id === S.currentChallengeId);
  if (!chUI) return;
  L.log('🏆 ' + L.t('ui.success_title'), 'ok');

  setTimeout(() => {
    const icons = ['🎉', '🏆', '⭐', '🚀', '🌟', '🐢'];
    document.getElementById('success-icon').textContent = icons[S.currentChallengeId % icons.length];

    const lbl = chUI.id >= 100 ? `★ ${chUI.id - 100}` : `${L.t('log.challenge')} ${chUI.id}`;
    document.getElementById('success-challenge').textContent = lbl + ': ' + chUI.title;
    document.getElementById('success-title').textContent     = L.t('ui.success_title');
    document.getElementById('success-msg').textContent       = L.t('ui.success_msg');

    const bm = document.getElementById('btn-success-more');
    if (bm) bm.textContent = L.t('ui.success_more');
    const bc = document.getElementById('btn-success-close');
    if (bc) bc.textContent = L.t('ui.success_close');

    L.openModal('modal-success');
  }, 400);
}


// ── Exporta ──

L.openChallenges        = openChallenges;
L.loadChallenge         = loadChallenge;
L.showNextHint          = showNextHint;
L.showGoalModal         = showGoalModal;
L.checkChallengeSuccess = checkChallengeSuccess;

// Globals per a HTML onclick
window.openChallenges = openChallenges;
window.showNextHint   = showNextHint;
window.showGoalModal  = showGoalModal;
