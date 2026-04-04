// ════════════════════════════════════════════════════════
// help.js — Ajuda contextual d'errors (post-it)
// ════════════════════════════════════════════════════════

function showErrorHelp(error) {
  const panel = document.getElementById('error-help-panel');
  if (!panel) return;

  let helpHtml = '';
  if (error instanceof L.LogoSyntaxError) {
    helpHtml = error.help;
  } else if (error && error.help) {
    helpHtml = error.help;
  }

  if (!helpHtml) return;

  panel.innerHTML =
    `<div class="error-help-content">${L.sanitizeHtml(helpHtml)}</div>` +
    `<button class="error-help-close" onclick="L.hideErrorHelp()">✕</button>`;
  panel.classList.add('visible');
}

function hideErrorHelp() {
  const panel = document.getElementById('error-help-panel');
  if (panel) panel.classList.remove('visible');
}


// ── Exporta ──

L.showErrorHelp = showErrorHelp;
L.hideErrorHelp = hideErrorHelp;
