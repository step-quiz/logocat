// Tokenitzador de LogoCat (docs/LANGUAGE-SPEC.md §1).
// Tokens: { t: 'num'|'word'|'quote'|'var'|'list'|'op'|'lp'|'rp', v, ... }
import { LogoError } from './missatges.js';

const DELIMS = '[]()+*/=<>';
const isSpace = (c) => c === ' ' || c === '\t' || c === ' ';

function atom(text) {
  if (/^(\d+(\.\d+)?|\.\d+)$/.test(text)) return { t: 'num', v: Number(text) };
  if (/^\d+,\d+$/.test(text)) throw new LogoError('comma_decimal', { text });
  if (text[0] === '"') return { t: 'quote', v: text.slice(1).toUpperCase() };
  if (text[0] === ':' && text.length > 1) return { t: 'var', v: text.slice(1).toUpperCase() };
  return { t: 'word', v: text.toUpperCase() };
}

export function tokenize(line) {
  let i = 0;
  const n = line.length;

  function readList(depth) {
    const out = [];
    let prevEnd = -1;                       // posició on acaba el token anterior
    while (i < n) {
      const c = line[i];
      if (isSpace(c)) { i++; continue; }
      if (c === '[') {
        const start = i++;
        const inner = readList(depth + 1);
        if (line[i] !== ']') throw new LogoError('missing_bracket');
        i++;
        out.push({ t: 'list', v: inner, src: line.slice(start + 1, i - 1).trim().replace(/\s+/g, ' ').toUpperCase() });
        prevEnd = i; continue;
      }
      if (c === ']') {
        if (depth === 0) throw new LogoError('stray_bracket');
        return out;
      }
      if (c === '(') { out.push({ t: 'lp' }); i++; prevEnd = -1; continue; }
      if (c === ')') { out.push({ t: 'rp' }); i++; prevEnd = i; continue; }
      if (c === '-') {
        const glued = prevEnd === i;                               // «a-b»
        const next = line[i + 1];
        const spaceAfter = next === undefined || isSpace(next);
        const prev = out[out.length - 1];
        const afterValue = prev && prev.t !== 'op' && prev.t !== 'lp';
        const unary = !(afterValue && (glued || spaceAfter));
        out.push({ t: 'op', v: '-', unary });
        i++; prevEnd = -1; continue;
      }
      if (DELIMS.includes(c)) { out.push({ t: 'op', v: c }); i++; prevEnd = -1; continue; }
      const start = i;
      while (i < n && !isSpace(line[i]) && !DELIMS.includes(line[i]) && line[i] !== '-') i++;
      if (i === start) { i++; continue; }
      out.push(atom(line.slice(start, i)));
      prevEnd = i;
    }
    if (depth > 0) throw new LogoError('missing_bracket');
    return out;
  }

  return readList(0);
}
