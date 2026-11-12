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

/** Les dues paraules són iguals si no es miren els accents ni la ç (POLIGON i POLÍGON). */
export const sameLetters = (a, b) => strip(a) === strip(b);

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

// Una paraula desconeguda que no s'assembla a cap (owner, revisió 19, E8: canvia la regla 1 del catàleg).
const OWN_PROC = "Si és un procediment teu, primer l'has de definir amb PROC … FI.";

// Paraules del LOGO en anglès, en castellà i altres maneres de dir-ho en català (owner, revisió 19, E1–E3).
const OTHER_WORDS = Object.fromEntries([
  ['AVANÇA', 'FD FORWARD ADELANTE AVANZA'], ['RECULA', 'BK BACK ATRAS ATRÁS RETROCEDE'],
  ['GIRA.D', 'RT RIGHT DERECHA GIRA.DERECHA'], ['GIRA.E', 'LT LEFT IZQUIERDA GIRA.IZQUIERDA'],
  ['REPETEIX', 'REPEAT REPITE'], ['INI.DIB', 'CS CLEARSCREEN BORRAR LIMPIAR BORRA LIMPIA ESBORRA.TOT'],
  ['NO.LLAPIS', 'PU PENUP SUBE.LAPIZ AIXECA AIXECA.LLAPIS PUJA.LLAPIS'], ['LLAPIS', 'PD PENDOWN BAJA.LAPIZ BAIXA.LLAPIS'],
  ['DESAPAREIX', 'HT HIDETURTLE AMAGA AMAGA.TORTUGA OCULTA ESCONDE'], ['APAREIX', 'ST SHOWTURTLE MOSTRA.TORTUGA MUESTRA APARECE'],
  ['CENTRE', 'HOME CENTRO'], ['ESCRIU', 'PRINT ESCRIBE'], ['PROC', 'TO PROCEDIMIENTO'], ['FI', 'END FIN'], ['ATZAR', 'RANDOM AZAR'],
].flatMap(([w, list]) => list.split(' ').map((x) => [x, `Volies dir ${w}?`])));

// Colors escrits amb el nom (revisió 18, P5).
const COLOR_NAMES = new Set(['NEGRE', 'BLANC', 'VERD', 'VIOLETA', 'TARONJA', 'BLAU', 'VERMELL', 'GROC', 'ROSA', 'LILA', 'MARRÓ', 'GRIS', 'MORAT', 'ROIG']);

// «COLOR 2», «FONS 1», «ORIENTACIÓ 90»: el valor que sobra ve d'una paraula que diu com està la tortuga (owner, revisió 18, B4).
const SETTER_HINT = {
  'COLOR': (n) => `Per canviar el color del llapis: FES.COLOR ${n || 2}`,
  'FONS': (n) => `Per canviar el color de la pantalla: FES.FONS ${n || 1}`,
  'ORIENTACIÓ': (n) => `Per canviar cap on mira la tortuga: FES.ORIENTACIÓ ${n || 90}`,
};

// Un procediment que es crida a si mateix sense parar (owner, cap. 12).
const recursionHint = (p) => `${p.recursive} es fa servir a si mateix i no s'atura mai. ` +
  (p.input ? `Li cal una regla, com ara SI :${p.input} > 100 [ACABA]` : 'Li cal una regla amb SI i ACABA.');

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
      // Una lletra dins d'un nombre, o un punt al final (owner, revisió 19, E4).
      if (/\d/.test(p.word) && /^[\dOLI]+(\.[\dOLI]+)?$/.test(p.word) && /[OLI]/.test(p.word)) {
        const n = p.word.replace(/O/g, '0').replace(/[LI]/g, '1');
        const letter = /O/.test(p.word) ? 'la lletra O en lloc del zero' : /L/.test(p.word) ? "la lletra L en lloc de l'u" : "la lletra I en lloc de l'u";
        hints = [`Volies dir ${n}? Hi has escrit ${letter}.`]; break;
      }
      const dot = /^(\d+(?:\.\d+)?)\.$/.exec(p.word);
      if (dot) { hints = [`Volies dir ${dot[1]}? Els nombres no acaben amb punt.`]; break; }
      // Revisió 18 (owner): claus en lloc de claudàtors (B1), i comes entre ordres (P5).
      if (p.brace || /[{}]/.test(p.word)) { hints = ['Els claudàtors són [ i ], no { i }']; break; }
      if (/[,;]/.test(p.word)) { hints = ['Les ordres se separen amb un espai, sense comes.']; break; }
      // Colors amb nom: FES.COLOR VERD (revisió 18, P5; la pista és la del capítol 4).
      if (COLOR_NAMES.has(p.word)) { hints = ['Els colors van del 0 al 5']; break; }
      if (p.colonName) { hints = [`Els dos punts van enganxats al nom, sense espai: :${p.colonName}`]; break; }
      // Els signes de classe per dividir i multiplicar (owner, 2026-11-11).
      const N = '(\\d+(\\.\\d+)?)?';
      if (new RegExp(`^${N}[:÷]${N}$`).test(p.word)) { hints = ['Per dividir, fes servir el signe /. Per exemple: 360 / 5']; break; }
      if (new RegExp(`^${N}[·×]${N}$`).test(p.word) || /^\d+(\.\d+)?X\d+(\.\d+)?$/.test(p.word) || (p.word === 'X' && p.between)) {
        hints = ['Per multiplicar, fes servir el signe *. Per exemple: 3 * 120']; break;
      }
      // Girs (owner, cap. 9): GIRA.I (castellà «izquierda»), GIRA sol, GIRA.DRETA, GIRA.ESQUERRA.
      // «50²»: per elevar al quadrat, es multiplica (owner, cap. 10).
      const sq = /^(\d+(?:\.\d+)?)²$/.exec(p.word);
      if (sq) { hints = [`Per elevar al quadrat, multiplica: ${sq[1]} * ${sq[1]}`]; break; }
      const turn = { 'GIRA.I': "Volies dir GIRA.E? E d'esquerra.", 'GIRA': 'Volies dir GIRA.D o GIRA.E?',
        'GIRA.DRETA': 'Volies dir GIRA.D?', 'GIRA.ESQUERRA': 'Volies dir GIRA.E?',
        // Capítol 11 (owner): el «si no», signes que LOGO no té, i paraules d'altres llengües.
        'SINO': "No cal escriure SINO: la segona llista ja és el que es fa si no es compleix.",
        'SI.NO': "No cal escriure SINO: la segona llista ja és el que es fa si no es compleix.",
        '≥': 'LOGO només coneix els signes <, > i =', '≤': 'LOGO només coneix els signes <, > i =', '≠': 'LOGO només coneix els signes <, > i =',
        'IF': 'Volies dir SI?', 'ALEATORI': 'Volies dir ATZAR?',
        'ATURA': 'Volies dir ACABA?', 'PARA': 'Volies dir ACABA?', 'STOP': 'Volies dir ACABA?',
        // Revisió 18 (owner, P5): paraules del català de cada dia.
        'DRETA': 'Volies dir GIRA.D?', 'ESQUERRA': 'Volies dir GIRA.E?', 'ENDAVANT': 'Volies dir AVANÇA?',
        'ENRERE': 'Volies dir RECULA?', 'ENDARRERE': 'Volies dir RECULA?',
        'ESBORRA': 'Volies dir INI.DIB?', 'NETEJA': 'Volies dir INI.DIB?',
        ...OTHER_WORDS }[p.word];
      if (turn) { hints = [turn]; break; }
      // BANDERA.E quan només hi ha BANDERA.D (o al revés): cap pista, que no faci dubtar (owner, cap. 9).
      const de = /^(.+)\.([DE])$/.exec(p.word);
      if (de && known.includes(de[1] + '.' + (de[2] === 'D' ? 'E' : 'D'))) { hints = [OWN_PROC]; break; }
      // «AVANÇA50», «GIRA.D90»: una paraula que LOGO coneix, enganxada a un nombre (revisió 18, P4).
      const glued = /^(.*[^\d.])(\d+(?:\.\d+)?)$/.exec(p.word);
      const w = glued && known.find((k) => sameLetters(k, glued[1]));
      if (w) { hints = [`Falta un espai entre ${w} i ${glued[2]}: ${w} ${glued[2]}`]; break; }
      const y = nearest(p.word, known);
      // Sense cap paraula semblant: després d'ESCRIU, les cometes (E7); si no, la pista general (E8) (owner, revisió 19).
      hints = [y ? `Volies dir ${y}?` : p.printWord ? `Per escriure una paraula, posa-hi cometes al davant: ${p.printWord} "${p.word}` : OWN_PROC];
      break;
    }
    case 'spaced': line1 = `NO SÉ COM FER ${p.text}`; hints = [`Volies dir ${p.word}? S'escriu amb un punt i sense espai.`]; break;   // (owner)
    case 'missing_input':
      if (p.brackets) {      // «REPETEIX 4 AVANÇA 50» (revisió 18, B1; la primera línia de REPETEIX és la de l'owner)
        line1 = p.word === 'REPETEIX' ? 'REPETEIX NECESSITA SABER QUÈ HA DE REPETIR' : `${p.word} NECESSITA UNA LLISTA`;
        hints = [`Posa les ordres entre claudàtors: ${p.brackets}`];
      } else if (p.bareStop != null && p.want === 'l') { line1 = `${p.word} NECESSITA UNA LLISTA`; hints = [`Posa ACABA entre claudàtors: ${p.word} ${p.bareStop}${p.bareStop ? ' ' : ''}[ACABA]`]; }   // (owner, cap. 12)
      else if (p.want === 'l' && p.word === 'REPETEIX') { line1 = 'REPETEIX NECESSITA SABER QUÈ HA DE REPETIR'; hints = [`Per exemple: ${p.example}`]; }   // (owner)
      else if (p.want === 'l') { line1 = `${p.word} NECESSITA UNA LLISTA`; hints = [`Per exemple: ${p.example}`]; }
      else { line1 = `${p.word} NECESSITA UN NOMBRE`; hints = [`Per exemple: ${p.example}`]; }
      break;
    case 'unused':
      line1 = `NO SÉ QUÈ FER AMB ${p.value}`;
      hints = [p.twoLists ? 'REPETEIX només repeteix una llista: posa totes les ordres dins dels mateixos claudàtors.'   // (owner, revisió 19, E5)
        : p.setter ? SETTER_HINT[p.setter.word](p.setter.value)                       // (owner, revisió 18, B4)
        : p.minus ? `Per restar, posa un espai a cada costat del signe menys: ${p.minus.left} - ${p.minus.right}`   // (owner, cap. 10)
        : p.sign ? 'LOGO només coneix els signes <, > i ='                               // «>=», «==», «<>» (owner, cap. 11)
        : 'Escriu una ordre, com per exemple AVANÇA 50'];
      break;
    case 'bad_input':
      line1 = `A ${p.word} NO LI AGRADA ${p.value}`;
      hints = [p.want === 'c' ? 'Els colors van del 0 al 5'                    // (owner)
        : p.negative ? `${p.word} no pot repetir un nombre negatiu de vegades`   // (owner, cap. 8)
        : p.root ? "ARREL2 no pot fer l'arrel d'un nombre negatiu"                 // (owner, cap. 10)
        : p.paren ? `Posa ${p.word} ${p.paren.left} entre parèntesis: (${p.word} ${p.paren.left}) ${p.paren.op} ${p.paren.right}`   // (owner, cap. 11)
        : p.min1 ? `${p.word} vol un nombre més gran que 0`                            // (owner, cap. 11)
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
    case 'duplicate_proc': line1 = `${p.word} JA ESTÀ DEFINIT`; hints = [`Hi ha dos PROC ${p.word} al panell: esborra'n un.`]; break;   // (owner, revisió 18, B2)
    case 'is_primitive': line1 = `${p.word} ÉS UNA ORDRE DE LOGO`; hints = ['Tria un altre nom per al teu procediment']; break;
    case 'proc_inputs':
      line1 = `EL PROCEDIMENT '${p.word}' NECESSITA ${p.n} ${p.n === 1 ? 'VALOR' : 'VALORS'}`;
      // (owner) La línia PROC amb els noms de les variables, i un exemple fet amb els valors que l'alumne ja ha escrit.
      // Sense cap valor escrit, no hi ha exemple: un 50 inventat pot ser un mal exemple (CERCLE 50; owner, cap. 8).
      { const given = p.given || [];
        const example = [...given, ...Array(Math.max(0, p.n - given.length)).fill(20)];
        hints = given.length ? [`Per exemple: ${p.word} ${example.join(' ')}`] : [];
        if (p.inputs) hints.unshift(`Mira la seva línia PROC: PROC ${p.word} ${p.inputs.map((v) => ':' + v).join(' ')}`); }
      break;
    case 'bad_title': line1 = 'A PROC LI FALTA EL NOM'; hints = ['Per exemple: PROC QUADRAT']; break;
    case 'bad_inputs': line1 = 'LES VARIABLES DE PROC PORTEN DOS PUNTS'; hints = ['Per exemple: PROC QUADRAT :COSTAT'];   // (owner)
      if (p.namePart) hints.push(`Si ${p.namePart} és part del nom, ha de ser una sola paraula: PROC ${p.name}.${p.namePart}`);   // (owner, revisió 19, E6)
      break;
    case 'div_zero': line1 = 'NO PUC DIVIDIR ENTRE ZERO'; break;
    case 'fence':
      line1 = 'LA TORTUGA NO POT SORTIR DE LA PANTALLA';
      hints = ['Estàs en mode barrera.', 'Si vols suprimir el mode barrera, fes servir M.CÍCLIC'];
      break;
    case 'stopped':
      line1 = 'ATURADA!';
      if (p.recursive) hints = [recursionHint(p)];
      break;
    case 'limit':
      line1 = 'ATURADA!';
      hints = ['Hem hagut d\'aturar el programa perquè sembla que no acaba mai. Revisa les teves ordres.'];
      if (p.recursive) hints.push(recursionHint(p));
      break;
    case 'comma_decimal': line1 = `NO ENTENC ${p.text}`; hints = [`Els decimals s'escriuen amb punt: ${p.text.replace(/[,'’]/, '.')}`]; break;
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
