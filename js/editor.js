// ════════════════════════════════════════════════════════
// editor.js — Ressaltat sintàctic, numeració, autocompletat
//
// FIX: Undo/redo preservat amb document.execCommand
// MILLORA: Regex precompilats per al syntax highlighting
// MILLORA: Posicionament d'autocompletat amb measureText
// ════════════════════════════════════════════════════════

// ── Cache de regex per al syntax highlighting ──

let _hlCache = { lang: null, cmdRegexes: [], kwRegexes: [] };

function rebuildHighlightCache() {
  const lang = L.state.currentCodeLang;
  if (_hlCache.lang === lang) return;
  const cmds = Object.keys(L.CMD_MAP[lang] || {});
  const kws  = Object.keys(L.KW_MAP[lang] || {});
  _hlCache = {
    lang,
    cmdRegexes: cmds.map(c => ({ re: new RegExp('(?<![\\w.])' + L.escRegex(c) + '(?![\\w])', 'gi'), cls: 'hl-cmd' })),
    kwRegexes:  kws.map(k  => ({ re: new RegExp('\\b' + L.escRegex(k) + '\\b', 'gi'), cls: 'hl-kw' })),
  };
}


// ── Ressaltat sintàctic ──

function highlightCode(code) {
  rebuildHighlightCache();
  return code.split('\n').map(line => {
    const ci = line.indexOf('//');
    let main    = ci >= 0 ? line.substring(0, ci) : line;
    let comment = ci >= 0 ? line.substring(ci) : '';

    main = L.escHtml(main);

    // Números
    main = main.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="hl-num">$1</span>');

    // Keywords (primer, perquè són menys)
    for (const { re, cls } of _hlCache.kwRegexes) {
      main = main.replace(re, `<span class="${cls}">$&</span>`);
    }

    // Comandes
    for (const { re, cls } of _hlCache.cmdRegexes) {
      main = main.replace(re, `<span class="${cls}">$&</span>`);
    }

    // Brackets
    main = main.replace(/([{}()])/g, '<span class="hl-br">$1</span>');

    if (comment) {
      comment = '<span class="hl-cm">' + L.escHtml(comment) + '</span>';
    }

    return main + comment;
  }).join('\n');
}


// ── Marcatge de línies ──

function highlightLine(n) {
  const lb = document.getElementById('line-bg');
  if (!lb) return;
  lb.innerHTML = '';
  if (n < 1) return;

  const ta = document.getElementById('code-editor');
  if (!ta) return;
  const lineH = parseFloat(getComputedStyle(ta).lineHeight) || 20;

  const d = document.createElement('div');
  d.className = 'line-mark exec';
  d.style.top = ((n - 1) * lineH) + 'px';
  d.style.height = lineH + 'px';
  lb.appendChild(d);
}

function markErrorLine(n) {
  const lb = document.getElementById('line-bg');
  if (!lb || n < 1) return;

  const ta = document.getElementById('code-editor');
  const lineH = parseFloat(getComputedStyle(ta).lineHeight) || 20;

  const d = document.createElement('div');
  d.className = 'line-mark err';
  d.style.top = ((n - 1) * lineH) + 'px';
  d.style.height = lineH + 'px';
  lb.appendChild(d);
}

function clearLineMarks() {
  const lb = document.getElementById('line-bg');
  if (lb) lb.innerHTML = '';
}


// ── Actualitzar editor ──

function updateEditor() {
  const ta = document.getElementById('code-editor');
  const hl = document.getElementById('code-highlight');
  const ln = document.getElementById('line-numbers');
  if (!ta) return;

  const code = ta.value;
  if (hl) hl.innerHTML = highlightCode(code);
  if (ln) ln.innerHTML = code.split('\n').map((_, i) => `<div>${i + 1}</div>`).join('');
  localStorage.setItem(L.LS_CODE, code);
  L.hideErrorHelp();
}

function syncEditorScroll() {
  const ta = document.getElementById('code-editor');
  const hl = document.getElementById('code-highlight');
  const ln = document.getElementById('line-numbers');
  const lb = document.getElementById('line-bg');
  if (ta && hl) { hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; }
  if (ta && ln) ln.scrollTop = ta.scrollTop;
  if (ta && lb) lb.style.top = -ta.scrollTop + 'px';
  hideAutocomplete();
}


// ── Inserció undo-safe ──
// FIX: Usa execCommand per preservar Ctrl+Z/Y natiu

function insertText(ta, text) {
  ta.focus();
  // execCommand('insertText') preserva l'undo stack del navegador
  if (document.execCommand) {
    document.execCommand('insertText', false, text);
  } else {
    // Fallback per si execCommand desapareix
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    ta.value = ta.value.substring(0, start) + text + ta.value.substring(end);
    ta.selectionStart = ta.selectionEnd = start + text.length;
  }
}

function replaceRange(ta, start, end, text) {
  ta.selectionStart = start;
  ta.selectionEnd   = end;
  insertText(ta, text);
}


// ── Keydown de l'editor (Tab, Enter, auto-close) ──

function handleEditorKeydown(e) {
  const ta    = e.target;
  const start = ta.selectionStart;
  const end   = ta.selectionEnd;

  // Tab / Shift+Tab
  if (e.key === 'Tab') {
    e.preventDefault();
    if (e.shiftKey) {
      const before = ta.value.substring(0, start);
      const ls     = before.lastIndexOf('\n') + 1;
      const indent = ta.value.substring(ls, start).match(/^ {1,2}/);
      if (indent) {
        replaceRange(ta, ls, ls + indent[0].length, '');
      }
    } else {
      insertText(ta, '  ');
    }
    updateEditor();
    return;
  }

  // Enter — auto-indentació
  if (e.key === 'Enter') {
    const before = ta.value.substring(0, start);
    const ls     = before.lastIndexOf('\n') + 1;
    const cl     = before.substring(ls);
    const indent = cl.match(/^(\s*)/)[1];
    const extra  = cl.trimEnd().endsWith('{') ? '  ' : '';
    e.preventDefault();
    insertText(ta, '\n' + indent + extra);
    updateEditor();
    return;
  }

  // Auto-close parèntesis i claus
  const pairs = { '(': ')', '{': '}' };
  if (pairs[e.key]) {
    e.preventDefault();
    const close = pairs[e.key];
    insertText(ta, e.key + close);
    // Moure cursor entre els parèntesis
    ta.selectionStart = ta.selectionEnd = ta.selectionStart - 1;
    updateEditor();
    return;
  }

  // Saltar over closing bracket
  if ((e.key === ')' || e.key === '}') && ta.value[start] === e.key) {
    e.preventDefault();
    ta.selectionStart = ta.selectionEnd = start + 1;
    return;
  }

  // Trigger autocompletat
  if (e.key.length === 1 && /[a-zA-ZàèéíòóúïüçñÀÈÉÍÒÓÚÏÜÇÑ_.]/.test(e.key)) {
    setTimeout(showAutocomplete, 10);
  }

  if (e.key === 'Escape') hideAutocomplete();
}


// ── Autocompletat ──

let _acCanvas = null;

function getWordAtCursor() {
  const ta = document.getElementById('code-editor');
  if (!ta) return { word: '', start: 0 };
  const pos  = ta.selectionStart;
  const text = ta.value;
  let start  = pos;
  while (start > 0 && /[a-zA-ZàèéíòóúïüçñÀÈÉÍÒÓÚÏÜÇÑ_.]/.test(text[start - 1])) start--;
  return { word: text.substring(start, pos), start };
}

function getAutocompleteItems(prefix) {
  if (!prefix || prefix.length < 1) return [];
  const lang    = L.state.currentCodeLang;
  const allCmds = L.I18N[lang]?.commands || [];
  const allKws  = L.I18N[lang]?.keywords || [];
  const low     = prefix.toLowerCase();
  const items   = [];
  for (const c of allCmds) if (c.toLowerCase().startsWith(low)) items.push({ label: c, kind: 'cmd' });
  for (const k of allKws)  if (k.toLowerCase().startsWith(low)) items.push({ label: k, kind: 'kw' });
  return items;
}

function showAutocomplete() {
  const { word } = getWordAtCursor();
  const items    = getAutocompleteItems(word);
  const panel    = document.getElementById('autocomplete-panel');
  if (!panel) return;

  if (items.length === 0 || (items.length === 1 && items[0].label.toLowerCase() === word.toLowerCase())) {
    hideAutocomplete();
    return;
  }

  L.state.acSelectedIdx = 0;
  panel.innerHTML = items.map((it, i) =>
    `<div class="ac-item${i === 0 ? ' selected' : ''}" data-idx="${i}" data-label="${L.escHtml(it.label)}" data-kind="${it.kind}">` +
    `<span class="ac-kind ac-${it.kind}">${it.kind === 'kw' ? '⚙' : '🐢'}</span>` +
    `<span class="ac-label">${L.escHtml(it.label)}</span></div>`
  ).join('');
  panel.style.display = 'block';

  // MILLORA: Posicionar amb measureText en comptes de hardcodejar 7.8px
  const ta = document.getElementById('code-editor');
  const editorInner = ta?.closest('.editor-inner');
  if (editorInner && ta) {
    const style = getComputedStyle(ta);
    const lineH = parseFloat(style.lineHeight) || 20;
    const before = ta.value.substring(0, ta.selectionStart);
    const lines  = before.split('\n');
    const lineNum = lines.length - 1;
    const colText = lines[lines.length - 1];

    // Mesura real de l'ample del text
    _acCanvas = _acCanvas || document.createElement('canvas');
    const ctx = _acCanvas.getContext('2d');
    ctx.font = `${style.fontSize} ${style.fontFamily}`;
    const colPx = ctx.measureText(colText).width;

    panel.style.top  = ((lineNum + 1) * lineH - ta.scrollTop + 8) + 'px';
    panel.style.left = Math.min(colPx + 10, editorInner.clientWidth - 180) + 'px';
  }

  panel.onclick = e => {
    const item = e.target.closest('.ac-item');
    if (item) acceptAutocomplete(item.dataset.label);
  };
}

function hideAutocomplete() {
  const panel = document.getElementById('autocomplete-panel');
  if (panel) panel.style.display = 'none';
}

function acceptAutocomplete(label) {
  const ta = document.getElementById('code-editor');
  if (!ta) return;

  const { word, start } = getWordAtCursor();
  const pos = ta.selectionStart;
  const cmdMap       = L.CMD_MAP[L.state.currentCodeLang] || {};
  const internalName = cmdMap[label.toLowerCase()];
  const suffix       = internalName && L.NEEDS_ARG.has(internalName) ? '()' : '';

  replaceRange(ta, start, pos, label + suffix);

  // Si hi ha suffix (), posar cursor entre parèntesis
  if (suffix) {
    ta.selectionStart = ta.selectionEnd = start + label.length + 1;
  }

  ta.focus();
  hideAutocomplete();
  updateEditor();
}

function handleAutocompleteNav(e) {
  const panel = document.getElementById('autocomplete-panel');
  if (!panel || panel.style.display === 'none') return false;

  const items = panel.querySelectorAll('.ac-item');
  if (items.length === 0) return false;

  const S = L.state;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    items[S.acSelectedIdx]?.classList.remove('selected');
    S.acSelectedIdx = (S.acSelectedIdx + 1) % items.length;
    items[S.acSelectedIdx]?.classList.add('selected');
    items[S.acSelectedIdx]?.scrollIntoView({ block: 'nearest' });
    return true;
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    items[S.acSelectedIdx]?.classList.remove('selected');
    S.acSelectedIdx = (S.acSelectedIdx - 1 + items.length) % items.length;
    items[S.acSelectedIdx]?.classList.add('selected');
    items[S.acSelectedIdx]?.scrollIntoView({ block: 'nearest' });
    return true;
  }

  if (e.key === 'Enter' || e.key === 'Tab') {
    const sel = items[S.acSelectedIdx];
    if (sel) { e.preventDefault(); acceptAutocomplete(sel.dataset.label); return true; }
  }

  if (e.key === 'Escape') { hideAutocomplete(); return true; }

  return false;
}


// ── Inicialització (cridada des de main.js) ──

function initEditor() {
  const ta = document.getElementById('code-editor');
  if (!ta) return;

  ta.addEventListener('input', updateEditor);
  ta.addEventListener('scroll', syncEditorScroll);
  ta.addEventListener('keydown', e => {
    if (handleAutocompleteNav(e)) return;
    handleEditorKeydown(e);
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#autocomplete-panel') && !e.target.closest('#code-editor')) {
      hideAutocomplete();
    }
  });
}


// ── Exporta ──

L.updateEditor      = updateEditor;
L.highlightLine     = highlightLine;
L.markErrorLine     = markErrorLine;
L.clearLineMarks    = clearLineMarks;
L.hideAutocomplete  = hideAutocomplete;
L.initEditor        = initEditor;
L.rebuildHighlightCache = rebuildHighlightCache;
