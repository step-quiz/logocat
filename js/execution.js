// ════════════════════════════════════════════════════════
// execution.js — Control d'execució (run, step, stop, reset)
// ════════════════════════════════════════════════════════

function handleError(e) {
  const lineStr = e.line ? `L${e.line}` : '?';
  const colStr  = e.col ? `:${e.col}` : '';
  const msg     = e.msg || e.message || String(e);
  L.log(`✗ Error (${lineStr}${colStr}): ${msg}`, 'err');
  L.setStateUI('error');
  if (e.line) L.markErrorLine(e.line);
  L.showErrorHelp(e);
}

function runProgram() {
  const S = L.state;
  if (S.running) return;
  L.hideErrorHelp();

  const code = document.getElementById('code-editor')?.value || '';
  try {
    const tokens = L.tokenize(code, S.currentCodeLang);
    const ast    = L.parse(tokens);
    S.iterator   = L.interpret(ast);
    S.running    = true;
    S.stepping   = false;
    L.setStateUI('running');
    L.log(L.t('log.running'), 'ok');
    tick();
  } catch (e) {
    handleError(e);
  }
}

function tick() {
  const S = L.state;
  if (!S.running || !S.iterator) return;

  try {
    const res = S.iterator.next();
    if (res.done) { finishRun(); return; }
    if (res.value?.line) L.highlightLine(res.value.line);
    L.executeCommand(res.value);
    S.runTimer = setTimeout(tick, L.getSpeedMs());
  } catch (e) {
    handleError(e);
    S.running  = false;
    S.iterator = null;
  }
}

function stepProgram() {
  const S = L.state;
  if (!S.iterator) {
    L.hideErrorHelp();
    const code = document.getElementById('code-editor')?.value || '';
    try {
      const tokens = L.tokenize(code, S.currentCodeLang);
      const ast    = L.parse(tokens);
      S.iterator   = L.interpret(ast);
      S.running    = true;
      S.stepping   = true;
      L.setStateUI('step');
      L.log(L.t('log.step_mode'), 'ok');
    } catch (e) {
      handleError(e);
      return;
    }
  }

  try {
    const res = S.iterator.next();
    if (res.done) { finishRun(); return; }
    if (res.value?.line) L.highlightLine(res.value.line);
    L.executeCommand(res.value);
  } catch (e) {
    handleError(e);
    S.running  = false;
    S.iterator = null;
  }
}

function stopProgram() {
  const S = L.state;
  clearTimeout(S.runTimer);
  S.running  = false;
  S.stepping = false;
  S.iterator = null;
  L.clearLineMarks();
  L.setStateUI('idle');
}

function finishRun() {
  const S = L.state;
  S.running  = false;
  S.iterator = null;
  L.clearLineMarks();
  L.setStateUI('idle');
  L.log(L.t('log.done'), 'ok');
  L.checkChallengeSuccess();
}

function resetCanvas() {
  stopProgram();
  const S = L.state;
  S.turtle = { x: 0, y: 0, heading: 0, penDown: true };
  S.drawHistory = [];
  L.redrawAll();
  L.updateStatus();
  L.log(L.t('log.reset'), 'ok');
  L.hideErrorHelp();
}


// ── Exporta ──

L.runProgram  = runProgram;
L.stepProgram = stepProgram;
L.stopProgram = stopProgram;
L.resetCanvas = resetCanvas;

// Globals per a HTML onclick
window.runProgram  = runProgram;
window.stepProgram = stepProgram;
window.stopProgram = stopProgram;
window.resetCanvas = resetCanvas;
