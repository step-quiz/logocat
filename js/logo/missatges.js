// Missatges de LogoCat (docs/LANGUAGE-SPEC.md §8).
// Línia 1: veu curta, com l'original. Línies següents: pistes.
// Els textos marcats (owner) els va escriure el propietari: no s'han de retocar.

export class LogoError extends Error {
  constructor(code, params = {}) {
    super(code);
    this.code = code;
    this.params = params;
    this.where = null;          // { proc, line } si ha passat dins d'un procediment
  }
}

export function fmtNum(n) {
  if (Number.isInteger(n)) return String(n);
  const r = Math.round(n * 1e4) / 1e4;
  return Object.is(r, -0) ? '0' : String(r);
}

export function fmtValue(v, brackets = false) {
  if (typeof v === 'number') return fmtNum(v);
  if (typeof v === 'boolean') return v ? 'CERT' : 'FALS';
  if (v && v.list) return brackets ? '[' + v.src + ']' : v.src;
  return String(v);
}

const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/·/g, '.');

function distance(a, b) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 3;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/** La paraula coneguda més semblant a `word`, o null. */
export function nearest(word, known) {
  const w = strip(word);
  let best = null, bestD = 3;
  for (const k of known) {
    const s = strip(k);
    if (s === w) return k;                       // només hi faltava l'accent o la ç
    const d = distance(w, s);
    const limit = Math.min(2, Math.floor(s.length / 3));
    if (d <= limit && d < bestD) { best = k; bestD = d; }
  }
  return best;
}

/**
 * Converteix un LogoError en { line1, hints }.
 * `known`: paraules que LOGO coneix ara (primitives + procediments), per a «Volies dir…?».
 */
export function describe(err, known = []) {
  const p = err.params;
  let line1, hints = [];
  switch (err.code) {
    case 'unknown': {
      line1 = `NO SÉ COM FER ${p.word}`;
      // Variables sense els dos punts, o amb un espai després dels dos punts (owner, 2026-11-11).
      if (p.isVar) { hints = [`Volies dir :${p.word}? Les variables s'escriuen amb dos punts al davant.`]; break; }
      if (p.colonName) { hints = [`Els dos punts van enganxats al nom, sense espai: :${p.colonName}`]; break; }
      // Els signes de classe per dividir i multiplicar (owner, 2026-11-11).
      const N = '(\\d+(\\.\\d+)?)?';
      if (new RegExp(`^${N}[:÷]${N}$`).test(p.word)) { hints = ['Per dividir, fes servir el signe /. Per exemple: 360 / 5']; break; }
      if (new RegExp(`^${N}[·×]${N}$`).test(p.word) || /^\d+(\.\d+)?X\d+(\.\d+)?$/.test(p.word) || (p.word === 'X' && p.between)) {
        hints = ['Per multiplicar, fes servir el signe *. Per exemple: 3 * 120']; break;
      }
      const y = nearest(p.word, known);
      if (y) hints = [`Volies dir ${y}?`];
      break;
    }
    case 'spaced': line1 = `NO SÉ COM FER ${p.text}`; hints = [`Volies dir ${p.word}? S'escriu amb un punt i sense espai.`]; break;   // (owner)
    case 'missing_input':
      if (p.want === 'l' && p.word === 'REPETEIX') { line1 = 'REPETEIX NECESSITA SABER QUÈ HA DE REPETIR'; hints = [`Per exemple: ${p.example}`]; }   // (owner)
      else if (p.want === 'l') { line1 = `${p.word} NECESSITA UNA LLISTA`; hints = [`Per exemple: ${p.example}`]; }
      else { line1 = `${p.word} NECESSITA UN NOMBRE`; hints = [`Per exemple: ${p.example}`]; }
      break;
    case 'unused':
      line1 = `NO SÉ QUÈ FER AMB ${p.value}`;
      hints = ['Escriu una ordre, com per exemple AVANÇA 50'];
      break;
    case 'bad_input':
      line1 = `A ${p.word} NO LI AGRADA ${p.value}`;
      hints = [p.want === 'c' ? 'Els colors van del 0 al 5'                    // (owner)
        : p.want === 'l' ? `${p.word} vol una llista entre claudàtors`
        : p.want === 'b' ? `${p.word} vol una condició, com ara :N > 10`
          : p.isList ? `${p.word} vol un nombre, sense claudàtor` : `${p.word} vol un nombre`];
      break;
    case 'missing_bracket': line1 = 'FALTA TANCAR UN CLAUDÀTOR'; hints = ['Cada [ necessita el seu ]']; break;
    case 'stray_bracket': line1 = 'SOBRA UN CLAUDÀTOR'; hints = ['Hi ha un ] sense el seu [']; break;
    case 'missing_paren': line1 = 'FALTA TANCAR UN PARÈNTESI'; hints = ['Cada ( necessita el seu )']; break;
    case 'stray_paren': line1 = 'SOBRA UN PARÈNTESI'; hints = ['Hi ha un ) sense el seu (']; break;
    case 'no_value': line1 = `:${p.name} NO TÉ CAP VALOR`; hints = ['És una variable del procediment? Mira la línia PROC']; break;   // (owner: «variable», mai «entrada»)
    case 'no_output': line1 = `${p.word} NO HA RETORNAT RES`; hints = [`${p.word} fa una acció, però no dona cap valor`]; break;
    case 'only_in_proc': line1 = `${p.word} NOMÉS ES POT FER DINS D'UN PROCEDIMENT`; break;
    case 'already_defined': line1 = `${p.word} JA ESTÀ DEFINIT`; hints = ['El pots canviar al panell de procediments']; break;
    case 'is_primitive': line1 = `${p.word} ÉS UNA ORDRE DE LOGO`; hints = ['Tria un altre nom per al teu procediment']; break;
    case 'proc_inputs':
      line1 = `EL PROCEDIMENT '${p.word}' NECESSITA ${p.n} ${p.n === 1 ? 'VALOR' : 'VALORS'}`;
      hints = [`Per exemple: ${p.word} ${Array(p.n).fill(50).join(' ')}`];
      break;
    case 'bad_title': line1 = 'A PROC LI FALTA EL NOM'; hints = ['Per exemple: PROC QUADRAT']; break;
    case 'bad_inputs': line1 = 'LES VARIABLES DE PROC PORTEN DOS PUNTS'; hints = ['Per exemple: PROC QUADRAT :COSTAT']; break;   // (owner)
    case 'div_zero': line1 = 'NO PUC DIVIDIR ENTRE ZERO'; break;
    case 'fence':
      line1 = 'LA TORTUGA NO POT SORTIR DE LA PANTALLA';
      hints = ['Estàs en mode barrera.', 'Si vols suprimir el mode barrera, fes servir M.CÍCLIC'];
      break;
    case 'stopped': line1 = 'ATURADA!'; break;
    case 'limit':
      line1 = 'ATURADA!';
      hints = ['Hem hagut d\'aturar el programa perquè sembla que no acaba mai. Revisa les teves ordres.'];
      break;
    case 'comma_decimal': line1 = `NO ENTENC ${p.text}`; hints = [`Els decimals s'escriuen amb punt: ${p.text.replace(',', '.')}`]; break;
    case 'missing_fi': line1 = 'FALTA FI'; hints = ['Cada PROC acaba amb FI']; break;
    case 'stray_fi': line1 = 'SOBRA FI'; hints = ['Cada PROC acaba amb FI']; break;
    case 'outside_proc':
      line1 = `${p.text.length > 24 ? p.text.slice(0, 24) + '…' : p.text} NO ÉS DINS DE CAP PROCEDIMENT`;
      hints = ['Aquí només hi van procediments (PROC … FI).'];     // (owner: sense «les ordres soltes…»)
      break;
    default: line1 = 'HI HA ALGUNA COSA QUE NO ENTENC';
  }
  if (err.where) line1 += ` A LA LÍNIA ${err.where.line} DEL PROCEDIMENT '${err.where.proc}'`;
  return { line1, hints };
}
