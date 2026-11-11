// Proves del capítol 6 tal com es publica: procediments amb una variable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Interpreter } from '../../js/logo/interpret.js';
import { describe } from '../../js/logo/missatges.js';
import { compareDrawings, comparePose } from '../../js/logo/compara.js';

function run(code) {
  const I = new Interpreter({ rng: () => 0.5 });
  const r = I.runSync(code);
  return { I, r, segments: I.turtle.segments, pose: I.turtle.pose() };
}
function drawing(code) { const d = run(code); assert.equal(d.r.error, null, 'ha de funcionar: ' + code); return d; }
/** El que fa «Comprova»: defineix el panell i executa la línia de data-executa en net. */
function runPanel(panel, line) {
  const I = new Interpreter({ rng: () => 0.5 });
  let panelError = null;
  try { I.defineAll(panel); } catch (e) { panelError = e; }
  const r = panelError ? { error: panelError, prints: [] } : I.runSync(line);
  return { I, error: r.error, prints: r.prints, segments: I.turtle.segments, pose: I.turtle.pose() };
}
const msg = (d) => describe(d.error, d.I.knownWords());
const read = (f) => readFileSync(new URL('../../' + f, import.meta.url), 'utf8');
const html = read('curs/capitol-6.html');
const sims = [...html.matchAll(/<div class="simulador"([^>]*)>([\s\S]*?)<\/div>/g)].map((m) => ({
  attrs: m[1],
  solutions: [...m[2].matchAll(/<script type="text\/logo">([\s\S]*?)<\/script>/g)].map((s) => s[1]),
  panel: ((m[2].match(/<script type="text\/logo-panell">([\s\S]*?)<\/script>/) || [])[1] || '').replace(/^\n+|\s+$/g, ''),
}));
const sim = (id) => sims.find((s) => s.attrs.includes(id));
const attr = (s, name) => (s.attrs.match(new RegExp(name + '="([^"]*)"')) || [])[1];
const inField = (segs) => segs.every((s) => [s.x1, s.x2].every((x) => x >= -140 && x < 140) && [s.y1, s.y2].every((y) => y >= -120 && y < 120));
const Q = 'PROC QUADRAT :COSTAT\n  REPETEIX 4 [AVANÇA :COSTAT GIRA.D 90]\nFI';

test('capítol 6: 4 simuladors d\'exemple i 3 exercicis amb un sol valor; «variable» i mai «entrada» ni «capsa»', () => {
  assert.equal(sims.length, 7);
  const ex = sims.filter((s) => s.solutions.length > 0);
  assert.equal(ex.length, 3);
  for (const s of ex) {
    assert.match(attr(s, 'data-executa'), /^[A-ZÀ-Ú.]+ \d+$/);                                // «Comprova» amb un sol valor (owner)
    for (const code of s.solutions) { const d = drawing(code); assert.ok(inField(d.segments)); assert.ok(code.trim().endsWith(attr(s, 'data-executa'))); }
    assert.ok(html.includes(`farà <code>${attr(s, 'data-executa')}</code>`));                 // l'enunciat diu quin valor es provarà
  }
  for (const s of sims) if (s.panel) new Interpreter().defineAll(s.panel);
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
  assert.ok(!/\bentrad|\bcaps[ae]/i.test(text), 'ni «entrada» ni «capsa» al text');
  assert.ok(/<h1>Variables<\/h1>/.test(html));
  assert.ok(Math.max(...html.split('\n').filter((l) => /^(PROC |  [A-ZÀ-Ú]|FI$)/.test(l)).map((l) => l.length)) <= 43, 'cap línia de codi passa de 43 caràcters');
});

test('variables: el mateix procediment amb valors diferents; perímetre; pas d\'un procediment a un altre', () => {
  for (const n of [20, 30, 80]) {
    const d = runPanel(Q, `QUADRAT ${n}`);
    assert.ok(compareDrawings(d.segments, drawing(`REPETEIX 4 [AVANÇA ${n} GIRA.D 90]`).segments).ok);
  }
  const P = Q + '\nPROC PERÍMETRE :COSTAT\n  ESCRIU 4 * :COSTAT\nFI';
  assert.deepEqual(runPanel(P, 'PERÍMETRE 20').prints, ['80']);
  assert.deepEqual(runPanel(P, 'PERÍMETRE 40').prints, ['160']);
  for (const m of html.matchAll(/\? (PERÍMETRE \d+)\n(\d+)/g)) assert.deepEqual(runPanel(P, m[1]).prints, [m[2]]);   // el que cita el capítol
  const two = runPanel(Q + '\nPROC DOS.QUADRATS :MIDA\n  QUADRAT :MIDA\n  QUADRAT :MIDA / 2\nFI', 'DOS.QUADRATS 60');
  assert.ok(compareDrawings(two.segments, drawing('REPETEIX 4 [AVANÇA 60 GIRA.D 90] REPETEIX 4 [AVANÇA 30 GIRA.D 90]').segments).ok);
  // El pas a pas ensenya el valor de la variable del procediment on som.
  const I = new Interpreter(); I.defineAll(Q);
  const gen = I.runLine('QUADRAT 60'); let seen = null;
  for (const ev of gen) if (ev.type === 'before' && !seen) seen = I.stepInfo();
  assert.deepEqual(seen.values, [':COSTAT = 60']);
});

test('capítol 6: «El triangle de qualsevol mida» — TRIANGLE 70, a dreta o a esquerra; amb el 50 a dins, no', () => {
  const ex = sim('cap6-triangle');
  assert.ok(ex.attrs.includes('dibuix+tortuga'));
  const [right, left] = ex.solutions.map(drawing);
  assert.equal(compareDrawings(right.segments, left.segments).ok, false);
  const other = runPanel('PROC TRIANGLE :C\n  REPETEIX 3 [AVANÇA :C GIRA.D 360 / 3]\nFI', 'TRIANGLE 70');   // la variable es pot dir com es vulgui
  assert.ok(compareDrawings(other.segments, right.segments).ok);
  assert.deepEqual(comparePose(other.pose, right.pose), { position: true, heading: true });
  const fixed = runPanel('PROC TRIANGLE :COSTAT\n  REPETEIX 3 [AVANÇA 50 GIRA.D 120]\nFI', 'TRIANGLE 70');
  assert.equal(compareDrawings(fixed.segments, right.segments).ok, false);
  const none = new Interpreter(); none.defineAll('PROC TRIANGLE\n  REPETEIX 3 [AVANÇA 70 GIRA.D 120]\nFI');
  assert.equal(none.procs.get('TRIANGLE').inputs.length, 0);                                 // «TRIANGLE ha de tenir una variable»
});

test('capítol 6: «El quadrat que no creix» — amb el 50 a dins falla; amb :COSTAT passa', () => {
  const ex = sim('cap6-error');
  const t = drawing(ex.solutions[0]);
  const given = runPanel(ex.panel, attr(ex, 'data-executa'));
  assert.equal(given.error, null);
  assert.equal(compareDrawings(given.segments, t.segments).ok, false);
  const fixed = runPanel(ex.panel.replace('AVANÇA 50', 'AVANÇA :COSTAT'), 'QUADRAT 70');
  assert.ok(compareDrawings(fixed.segments, t.segments).ok);
});

test('capítol 6: «La casa de qualsevol mida» — les mides són la variable, el gir de 30 no', () => {
  const ex = sim('cap6-casa');
  assert.ok(ex.attrs.includes('data-clau') && ex.attrs.includes('dibuix+tortuga') && attr(ex, 'data-exigeix') === 'TRIANGLE');
  const t = drawing(ex.solutions[0]);
  const casa = (body, v = ':MIDA') => runPanel(ex.panel + `\n\nPROC CASA ${v}\n` + body + '\nFI', attr(ex, 'data-executa'));
  const good = casa('  QUADRAT :MIDA\n  AVANÇA :MIDA\n  GIRA.D 30\n  TRIANGLE :MIDA\n  GIRA.E 30\n  RECULA :MIDA');
  assert.ok(compareDrawings(good.segments, t.segments).ok);
  assert.deepEqual(comparePose(good.pose, t.pose), { position: true, heading: true });
  assert.equal(good.I.procUses('CASA', 'TRIANGLE'), true);
  const fifty = casa('  QUADRAT :MIDA\n  AVANÇA 50 GIRA.D 30\n  TRIANGLE :MIDA\n  GIRA.E 30 RECULA 50');
  assert.equal(compareDrawings(fifty.segments, t.segments).ok, false);                       // un 50 oblidat: la teulada queda separada
  const angle = casa('  QUADRAT :MIDA\n  AVANÇA :MIDA GIRA.D :MIDA\n  TRIANGLE :MIDA\n  GIRA.E :MIDA RECULA :MIDA');
  assert.equal(compareDrawings(angle.segments, t.segments).ok, false);                       // la variable al gir: teulada torta
});

test('capítol 6: «Què dibuixarà?» — tres dibuixos diferents', () => {
  const block = html.match(/<div class="prediu"[\s\S]*?<\/div>/)[0];
  const opts = [...block.matchAll(/<script type="text\/logo"( data-correcta)?[^>]*>([\s\S]*?)<\/script>/g)].map((m) => ({ ok: !!m[1], d: drawing(m[2]) }));
  assert.equal(opts.length, 3);
  assert.equal(opts.filter((o) => o.ok).length, 1);
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.equal(compareDrawings(opts[i].d.segments, opts[j].d.segments).ok, false);
});

test('missatges de les variables (owner): sense dos punts, amb espai, a la línia PROC, sense valor', () => {
  assert.deepEqual(msg(runPanel(Q, 'QUADRAT')), { line1: "EL PROCEDIMENT 'QUADRAT' NECESSITA 1 VALOR", hints: ['Mira la seva línia PROC: PROC QUADRAT :COSTAT', 'Per exemple: QUADRAT 50'] });
  assert.deepEqual(msg(runPanel('PROC QUADRAT :COSTAT\n  REPETEIX 4 [AVANÇA COSTAT GIRA.D 90]\nFI', 'QUADRAT 50')),
    { line1: "NO SÉ COM FER COSTAT A LA LÍNIA 2 DEL PROCEDIMENT 'QUADRAT'", hints: ["Volies dir :COSTAT? Les variables s'escriuen amb dos punts al davant."] });
  assert.deepEqual(msg(runPanel('PROC QUADRAT :COSTAT\n  REPETEIX 4 [AVANÇA : COSTAT GIRA.D 90]\nFI', 'QUADRAT 50')),
    { line1: "NO SÉ COM FER : A LA LÍNIA 2 DEL PROCEDIMENT 'QUADRAT'", hints: ['Els dos punts van enganxats al nom, sense espai: :COSTAT'] });
  for (const title of ['PROC QUADRAT COSTAT', 'PROC QUADRAT : COSTAT', 'PROC QUADRAT 50']) {
    assert.deepEqual(msg(runPanel(title + '\n  AVANÇA 10\nFI', 'QUADRAT 50')), { line1: 'LES VARIABLES DE PROC PORTEN DOS PUNTS', hints: ['Per exemple: PROC QUADRAT :COSTAT'] });
  }
  assert.deepEqual(msg(runPanel('PROC\n  AVANÇA 10\nFI', 'X')).line1, 'A PROC LI FALTA EL NOM');
  assert.deepEqual(msg(runPanel(Q, 'AVANÇA :COSTAT')), { line1: ':COSTAT NO TÉ CAP VALOR', hints: ['És una variable del procediment? Mira la línia PROC'] });
  assert.deepEqual(msg(runPanel(Q, 'ESCRIU 360 : 5')).hints, ['Per dividir, fes servir el signe /. Per exemple: 360 / 5']);   // els dos punts entre nombres continuen sent una divisió
});

test('portada: el número de versió de baix a la dreta és el de package.json', () => {
  const pkg = JSON.parse(read('package.json'));
  const shown = read('index.html').match(/<p class="versio"[^>]*>v([\d.]+)<\/p>/)[1];
  assert.equal(pkg.version, shown + '.0');
  assert.match(read('css/logocat.css'), /\.versio \{[^}]*position: fixed;[^}]*right:[^}]*bottom:/);
});
