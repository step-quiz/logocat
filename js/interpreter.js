// ════════════════════════════════════════════════════════
// interpreter.js — Intèrpret (generadors JS)
//
// Depèn de: tokenizer.js (LogoSyntaxError, findSuggestion),
//           constants.js (MAX_DEPTH, MAX_STEPS, CMD_MAP, KW_MAP)
//
// Yield objectes { type:'cmd', ... } per a cada acció.
// FIX: quan un IDENT no és procediment, comprova si és una
// comanda mal escrita i suggereix l'alternativa amb Levenshtein.
// ════════════════════════════════════════════════════════

if (!L?.findSuggestion) throw new Error('interpreter.js requereix tokenizer.js carregat abans');

function* interpret(ast) {
  const S = L.state;
  const procs = {};
  for (const n of ast) {
    if (n.type === 'procdef') procs[n.name] = n.body;
  }

  let steps = 0;

  function* exec(node, depth) {
    if (depth > L.MAX_DEPTH) {
      throw new L.LogoSyntaxError('too_deep', { line: node.line });
    }
    if (++steps > L.MAX_STEPS) {
      throw new L.LogoSyntaxError('max_steps', { line: node.line });
    }

    switch (node.type) {
      case 'cmd':
        yield node;
        break;

      case 'repeat':
        for (let i = 0; i < node.count; i++) {
          for (const child of node.body) yield* exec(child, depth + 1);
        }
        break;

      case 'call':
        if (!procs[node.name]) {
          // FIX: comprovar si la paraula s'assembla a una comanda
          const suggestion = L.findSuggestion(node.name, S.currentCodeLang);
          const allCmds = Object.keys(L.CMD_MAP[S.currentCodeLang] || {});
          const allKws  = Object.keys(L.KW_MAP[S.currentCodeLang] || {});
          const allWords = [...allCmds, ...allKws];

          // Si la paraula s'assembla a una comanda/keyword, error de tipografia
          const dist = L.levenshtein(node.name.toLowerCase(), suggestion);
          if (dist <= Math.max(3, Math.ceil(node.name.length / 2)) && allWords.includes(suggestion)) {
            throw new L.LogoSyntaxError('unknown_word', {
              line: node.line, col: node.col || 0,
              word: node.name, suggestion,
            });
          }
          // Si no, error de procediment desconegut
          throw new L.LogoSyntaxError('unknown_proc', {
            line: node.line, col: node.col || 0, name: node.name,
          });
        }
        for (const child of procs[node.name]) yield* exec(child, depth + 1);
        break;

      case 'procdef':
        break; // les definicions es processen al build
    }
  }

  for (const node of ast) {
    if (node.type !== 'procdef') yield* exec(node, 0);
  }
}


// ── Exporta ──

L.interpret = interpret;
