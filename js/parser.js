// ════════════════════════════════════════════════════════
// parser.js — Funció pura: tokens → AST
//
// Depèn de: tokenizer.js (LogoSyntaxError), constants.js (NEEDS_ARG)
// FIX: error clar per parèntesis buits avança()
// FIX: detecta paraules desconegudes (no procediments) i suggereix
// ════════════════════════════════════════════════════════

if (!L?.LogoSyntaxError) throw new Error('parser.js requereix tokenizer.js carregat abans');

function parse(tokens) {
  let pos = 0;

  function peek() { return tokens[pos]; }

  function eat(type) {
    if (pos >= tokens.length) {
      const lt = tokens[tokens.length - 1];
      if (type === '}') throw new L.LogoSyntaxError('missing_close_brace', { line: lt?.line || 1, col: lt?.col || 0 });
      throw new L.LogoSyntaxError('missing_open_brace', { line: lt?.line || 1, col: lt?.col || 0, word: '' });
    }
    if (tokens[pos].type !== type) {
      const tok = tokens[pos];
      if (type === '{') throw new L.LogoSyntaxError('missing_open_brace', { line: tok.line, col: tok.col, word: tok.raw || tok.name || '' });
      if (type === '}') throw new L.LogoSyntaxError('missing_close_brace', { line: tok.line, col: tok.col });
      throw new L.LogoSyntaxError('expect_num', { line: tok.line, col: tok.col, word: tok.raw || tok.name || '' });
    }
    return tokens[pos++];
  }

  function readNum(cmdRaw) {
    // FIX: detectar avança() — parèntesis buits
    if (peek()?.type === '(') {
      pos++;
      if (peek()?.type === ')') {
        // Parèntesis buits: avança()
        const tok = tokens[pos];
        throw new L.LogoSyntaxError('empty_parens', { line: tok.line, col: tok.col, word: cmdRaw || '' });
      }
      const n = readNum(cmdRaw);
      eat(')');
      return n;
    }
    if (peek()?.type === 'NUM') return tokens[pos++].value;
    const ctx = tokens[pos - 1];
    throw new L.LogoSyntaxError('expect_num', {
      line: peek()?.line || ctx?.line || 1,
      col:  peek()?.col || 0,
      word: cmdRaw || ctx?.raw || ctx?.name || '',
    });
  }

  function parseBlock() {
    eat('{');
    const body = [];
    while (pos < tokens.length && peek()?.type !== '}') {
      const s = parseStmt();
      if (s) body.push(s);
    }
    eat('}');
    return body;
  }

  function parseStmt() {
    const tok = peek();
    if (!tok) return null;

    // Comanda (forward, right, etc.)
    if (tok.type === 'CMD') {
      pos++;
      if (L.NEEDS_ARG.has(tok.name)) {
        return { type: 'cmd', name: tok.name, arg: readNum(tok.raw), line: tok.line };
      }
      return { type: 'cmd', name: tok.name, line: tok.line };
    }

    // Keyword: repeat
    if (tok.type === 'KW' && tok.name === 'repeat') {
      pos++;
      const count = readNum(tok.raw);
      if (count < 0 || count > 100000) {
        throw new L.LogoSyntaxError('max_steps', { line: tok.line, col: tok.col });
      }
      const body = parseBlock();
      return { type: 'repeat', count, body, line: tok.line };
    }

    // Keyword: procedure
    if (tok.type === 'KW' && tok.name === 'procedure') {
      pos++;
      const nt = peek();
      if (!nt || nt.type !== 'IDENT') {
        throw new L.LogoSyntaxError('missing_proc_name', { line: tok.line, col: tok.col });
      }
      pos++;
      const body = parseBlock();
      return { type: 'procdef', name: nt.name, body, line: tok.line };
    }

    // Identifier (procedure call o paraula desconeguda)
    if (tok.type === 'IDENT') {
      pos++;
      return { type: 'call', name: tok.name, line: tok.line, col: tok.col };
    }

    // Skip unrecognized tokens
    pos++;
    return null;
  }

  const program = [];
  while (pos < tokens.length) {
    const s = parseStmt();
    if (s) program.push(s);
  }
  return program;
}


// ── Exporta ──

L.parse = parse;
