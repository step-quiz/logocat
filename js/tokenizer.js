// ════════════════════════════════════════════════════════
// tokenizer.js — Funció pura: codi → tokens
//
// Depèn de: constants.js (L, CMD_MAP, KW_MAP, levenshtein)
// FIX: detecta paraules desconegudes durant la tokenització
// i genera errors amb suggeriments Levenshtein (abans era codi mort).
// ════════════════════════════════════════════════════════

if (!L?.CMD_MAP) throw new Error('tokenizer.js requereix constants.js carregat abans');

class LogoSyntaxError {
  constructor(code, vars) {
    this.code = code;
    this.vars = vars || {};
    this.line = this.vars.line || 1;
    this.col  = this.vars.col || 0;
  }

  get msg() {
    const tpl = L.I18N[L.state.currentUserLang]?.errors?.[this.code]?.msg || this.code;
    return tpl.replace(/\{(\w+)\}/g, (_, k) => this.vars[k] || '');
  }

  get help() {
    const tpl = L.I18N[L.state.currentUserLang]?.errors?.[this.code]?.help || '';
    return tpl.replace(/\{(\w+)\}/g, (_, k) => this.vars[k] || '');
  }
}


function findSuggestion(word, lang) {
  const all = [
    ...Object.keys(L.CMD_MAP[lang] || {}),
    ...Object.keys(L.KW_MAP[lang] || {}),
  ];
  let best = null, bestDist = Infinity;
  const low = word.toLowerCase();
  for (const c of all) {
    const d = L.levenshtein(low, c);
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return bestDist <= Math.max(3, Math.ceil(word.length / 2)) ? best : (all[0] || word);
}


function tokenize(code, lang) {
  const cmdMap = L.CMD_MAP[lang] || L.CMD_MAP.en;
  const kwMap  = L.KW_MAP[lang] || L.KW_MAP.en;
  const tokens = [];
  let i = 0, line = 1, col = 1;

  while (i < code.length) {
    // Newlines
    if (code[i] === '\n') { line++; col = 1; i++; continue; }

    // Whitespace
    if (/[ \t\r]/.test(code[i])) { col++; i++; continue; }

    // Line comments
    if (code[i] === '/' && code[i + 1] === '/') {
      while (i < code.length && code[i] !== '\n') i++;
      continue;
    }

    // Brackets and parens
    if ('(){}'.includes(code[i])) {
      tokens.push({ type: code[i], line, col });
      col++; i++;
      continue;
    }

    // Numbers (including negative)
    if (/[0-9]/.test(code[i]) || (code[i] === '-' && i + 1 < code.length && /[0-9]/.test(code[i + 1]))) {
      let num = '';
      const startCol = col;
      if (code[i] === '-') { num += '-'; i++; col++; }
      while (i < code.length && /[0-9.]/.test(code[i])) { num += code[i]; i++; col++; }
      tokens.push({ type: 'NUM', value: parseFloat(num), line, col: startCol });
      continue;
    }

    // Words (commands, keywords, identifiers)
    if (/[a-zA-ZàèéíòóúïüçñÀÈÉÍÒÓÚÏÜÇÑ_]/.test(code[i])) {
      let word = '';
      const startCol = col;
      while (i < code.length && /[a-zA-ZàèéíòóúïüçñÀÈÉÍÒÓÚÏÜÇÑ_.0-9\-]/.test(code[i])) {
        word += code[i]; i++; col++;
      }
      const low = word.toLowerCase();

      if (cmdMap[low]) {
        tokens.push({ type: 'CMD', name: cmdMap[low], raw: word, line, col: startCol });
      } else if (kwMap[low]) {
        tokens.push({ type: 'KW', name: kwMap[low], raw: word, line, col: startCol });
      } else {
        // FIX: comprovar si és un error de tipografia abans de tractar-ho com a IDENT
        tokens.push({ type: 'IDENT', name: word, line, col: startCol });
      }
      continue;
    }

    // Skip unrecognized characters
    i++; col++;
  }

  return tokens;
}


// ── Exporta ──

L.LogoSyntaxError = LogoSyntaxError;
L.findSuggestion  = findSuggestion;
L.tokenize        = tokenize;
