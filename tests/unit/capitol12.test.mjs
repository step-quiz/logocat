// Proves del capítol 12 tal com es publica: recursivitat, ACABA, espirals i l'arbre.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Interpreter } from '../../js/logo/interpret.js';
import { describe, LogoError } from '../../js/logo/missatges.js';
import { compareDrawings } from '../../js/logo/compara.js';

function drawing(code) {
  const I = new Interpreter({ rng: () => 0.5 });
  const r = I.runSync(code);
  assert.equal(r.error, null, 'ha de funcionar: ' + code);
  return { I, r, segments: I.turtle.segments, pose: I.turtle.pose() };
}
function runPanel(panel, line) {
  const I = new Interpreter({ rng: () => 0.5 });
  I.defineAll(panel);
  const r = I.runSync(line);
  return { I, r, error: r.error, segments: I.turtle.segments, pose: I.turtle.pose() };
}
const msg = (d) => describe(d.error, d.I.knownWords());
const read = (f) => readFileSync(new URL('../../' + f, import.meta.url), 'utf8');
const html = read('curs/capitol-12.html');
const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const sims = [...html.matchAll(/<div class="simulador"([^>]*)>([\s\S]*?)<\/div>/g)].map((m) => ({
  attrs: m[1],
  solutions: [...m[2].matchAll(/<script type="text\/logo">([\s\S]*?)<\/script>/g)].map((s) => s[1]),
  panel: ((m[2].match(/<script type="text\/logo-panell">([\s\S]*?)<\/script>/) || [])[1] || '').replace(/^\n+|\s+$/g, ''),
}));
const sim = (id) => sims.find((s) => s.attrs.includes(id));
const attr = (s, name) => (s.attrs.match(new RegExp(name + '="([^"]*)"')) || [])[1];
const inField = (segs) => segs.every((s) => [s.x1, s.x2].every((x) => x >= -140 && x < 140) && [s.y1, s.y2].every((y) => y >= -120 && y < 120));
const text = unescape(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' '));
const ES = 'PROC ESPIRAL :COSTAT\n  SI :COSTAT > 100 [ACABA]\n  AVANÇA :COSTAT GIRA.D 90\n  ESPIRAL :COSTAT + 5\nFI';
const AR = 'PROC ARBRE :MIDA\n  SI :MIDA < 5 [ACABA]\n  AVANÇA :MIDA\n  GIRA.E 30 ARBRE :MIDA / 2\n  GIRA.D 60 ARBRE :MIDA / 2\n  GIRA.E 30 RECULA :MIDA\nFI';

test('capítol 12: 2 simuladors d\'exemple i 3 exercicis; decisions de la revisió 14', () => {
  assert.equal(sims.length, 5);
  const ex = sims.filter((s) => s.solutions.length > 0);
  assert.equal(ex.length, 3);
  for (const s of ex) {
    for (const code of s.solutions) { assert.ok(inField(drawing(code).segments)); assert.ok(code.trim().endsWith(attr(s, 'data-executa'))); }
    assert.ok(html.includes(`farà <code>${attr(s, 'data-executa')}</code>`));
  }
  for (const s of sims) if (s.panel) new Interpreter().defineAll(s.panel);
  for (const w of ["Els costats formen una successió: cada nombre s'obté sumant 5 al nombre anterior.",   // owner, G3
    'Un procediment que es fa servir a si mateix necessita una regla per aturar-se. Sense la regla, no acabaria mai.',
    'Cada branca és un arbre més petit. Una figura així es diu fractal.',
    "Has acabat el curs. Ara ja pots inventar els teus dibuixos a l' Editor lliure"]) assert.ok(text.replace(/\s+/g, ' ').includes(w), w);
  assert.ok(!/progressió|diferència|capítol 13/i.test(text), 'G3 A i G6 A');
  // Revisió 18 (P3): el capítol 12 avisa que ja es poden fer els reptes del nivell 3.
  assert.ok(html.includes('<p><a href="reptes-3.html">Ja pots fer els reptes del nivell 3 →</a></p>'));
  assert.ok(html.includes('· <a href="reptes-3.html">Reptes · Nivell 3 →</a> · <a href="../simulador.html">Editor lliure →</a></p>'));
  assert.ok(!/\bentrad|\bcaps[ae]/i.test(text));
  assert.ok(!/anys 80|1985|198\d/.test(text));
  assert.ok(html.includes('href="../simulador.html"'));
  assert.ok(Math.max(...html.split('\n').filter((l) => /^(PROC |  [A-ZÀ-Ú]|FI$)/.test(l)).map((l) => l.length)) <= 52);
});

test('ESPIRAL i l\'ARBRE del text', () => {
  const first = sims[0];
  assert.equal(first.panel, ES);
  for (const line of ['ESPIRAL 5', 'ESPIRAL 50']) { const d = runPanel(ES, line); assert.equal(d.error, null); assert.ok(inField(d.segments), line); }
  assert.equal(runPanel(ES, 'ESPIRAL 5').segments.length, 20, '5, 10, …, 100: vint costats');
  const tree = sims.find((s) => s.panel === AR);
  assert.ok(tree);
  for (const line of ['ARBRE 60', 'ARBRE 40']) {
    const d = runPanel(AR, line);
    assert.equal(d.error, null); assert.ok(inField(d.segments), line);
    assert.ok(Math.hypot(d.pose.x, d.pose.y) < 1e-6 && Math.abs(d.pose.heading) < 1e-6, 'l\'arbre torna on havia començat');
  }
  const noRule = runPanel(ES.replace('  SI :COSTAT > 100 [ACABA]\n', ''), 'ESPIRAL 5');
  assert.deepEqual(msg(noRule), { line1: 'ATURADA!', hints: ["Hem hagut d'aturar el programa perquè sembla que no acaba mai. Revisa les teves ordres.", "ESPIRAL es fa servir a si mateix i no s'atura mai. Li cal una regla, com ara SI :COSTAT > 100 [ACABA]"] });
});

test('«Què dibuixarà?»: tres costats', () => {
  const block = html.match(/<div class="prediu"[\s\S]*?<\/div>/)[0];
  const CA = unescape(block.match(/<pre class="codi">([\s\S]*?)<\/pre>/)[1]);
  const truth = runPanel(CA, 'CAMÍ 1');
  assert.equal(truth.segments.length, 3);
  const opts = [...block.matchAll(/<script type="text\/logo"( data-correcta)?[^>]*>([\s\S]*?)<\/script>/g)].map((m) => ({ ok: !!m[1], d: drawing(m[2]) }));
  assert.deepEqual(opts.map((o) => o.ok), [true, false, false]);
  assert.ok(compareDrawings(opts[0].d.segments, truth.segments).ok);
  assert.equal(compareDrawings(opts[1].d.segments, truth.segments).ok, false);
  assert.equal(compareDrawings(opts[2].d.segments, truth.segments).ok, false);
});

test('«L\'espiral que no surt»: el signe girat', () => {
  const bug = sim('cap12-error');
  assert.equal(bug.panel, ES.replace('> 100', '< 100'));
  assert.equal(runPanel(bug.panel, 'ESPIRAL 5').segments.length, 0, 'no dibuixa res');
  assert.ok(compareDrawings(runPanel(ES, 'ESPIRAL 5').segments, drawing(bug.solutions[0]).segments).ok);
});

test('«L\'espiral triangular» i «L\'espiral que s\'encongeix» (clau)', () => {
  const tri = sim('cap12-tri');
  const [r, l] = tri.solutions.map(drawing);
  assert.equal(compareDrawings(r.segments, l.segments).ok, false);
  const key = sim('cap12-in');
  assert.ok(key.attrs.includes('data-clau'));
  const [good] = key.solutions.map(drawing);
  assert.equal(good.segments.length, 20, '100, 95, …, 5');
  const zero = runPanel('PROC ESPIRAL.IN :COSTAT\n  SI :COSTAT = 0 [ACABA]\n  AVANÇA :COSTAT GIRA.D 90\n  ESPIRAL.IN :COSTAT - 5\nFI', 'ESPIRAL.IN 100');
  assert.ok(compareDrawings(zero.segments, good.segments).ok, 'amb = 0 també funciona');
  const never = runPanel('PROC ESPIRAL.IN :COSTAT\n  SI :COSTAT > 100 [ACABA]\n  AVANÇA :COSTAT GIRA.D 90\n  ESPIRAL.IN :COSTAT - 5\nFI', 'ESPIRAL.IN 100');
  assert.equal(msg(never).line1, 'ATURADA!');
  assert.deepEqual(drawing('PROC P :C\n  SI :C < 5 [ACABA]\n  AVANÇA :C\n  P :C - 5\nFI\nP 20').segments.length, 4, 'pregunta 3 del qüestionari: 4 costats');
});

test('missatges nous (owner, revisió 14)', () => {
  const bare = runPanel(ES.replace('[ACABA]', 'ACABA'), 'ESPIRAL 5');
  assert.deepEqual(msg(bare), { line1: "SI NECESSITA UNA LLISTA A LA LÍNIA 2 DEL PROCEDIMENT 'ESPIRAL'", hints: ['Posa ACABA entre claudàtors: SI :COSTAT > 100 [ACABA]'] });
  for (const w of ['ATURA', 'PARA', 'STOP']) assert.deepEqual(msg(runPanel(ES.replace('[ACABA]', `[${w}]`), 'ESPIRAL 5')).hints, ['Volies dir ACABA?'], w);
  assert.deepEqual(msg(runPanel('PROC B\n  B\nFI', 'B')).hints[1], "B es fa servir a si mateix i no s'atura mai. Li cal una regla amb SI i ACABA.");
  assert.equal(runPanel(ES, 'ESPIRAL 5').error, null);
  // «Atura» enmig d'una recursivitat sense fi: la mateixa pista; sense recursivitat, cap.
  const I = new Interpreter(); I.defineAll(ES.replace('  SI :COSTAT > 100 [ACABA]\n', ''));
  const gen = I.runLine('ESPIRAL 5'); while (I.frames.length < 3) gen.next();
  assert.deepEqual(describe(new LogoError('stopped', I.recursion(2, true) || {})).hints, ["ESPIRAL es fa servir a si mateix i no s'atura mai. Li cal una regla, com ara SI :COSTAT > 100 [ACABA]"]);
  const J = new Interpreter(); J.defineAll(ES); const g2 = J.runLine('ESPIRAL 5'); while (J.frames.length < 5) g2.next();
  assert.equal(J.recursion(2, true), null, 'una ESPIRAL amb ACABA, aturada a mitges, no rep la pista');
  assert.deepEqual(describe(new LogoError('stopped', {})).hints, []);
});
