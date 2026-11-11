// Proves de la correcció de dibuixos i del capítol 1 (solucions, activitats, estructura).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Interpreter } from '../../js/logo/interpret.js';
import { compareDrawings, comparePose } from '../../js/logo/compara.js';

function drawing(code) {
  const I = new Interpreter({ rng: () => 0.5 });
  const r = I.runSync(code);
  assert.equal(r.error, null, 'el codi de prova ha de funcionar: ' + code);
  return { segments: I.turtle.segments, pose: I.turtle.pose() };
}
const SQUARE = 'REPETEIX 4 [AVANÇA 50 GIRA.D 90]';

test('el mateix dibuix fet d\'una altra manera és correcte', () => {
  const a = drawing(SQUARE);
  const b = drawing('GIRA.D 90 AVANÇA 50 GIRA.E 90 AVANÇA 50 GIRA.E 90 AVANÇA 50 GIRA.E 90 AVANÇA 50');
  assert.ok(compareDrawings(b.segments, a.segments).ok);
});

test('un traç fet a trossos o repassat compta igual', () => {
  const a = drawing('AVANÇA 60');
  const b = drawing('AVANÇA 20 AVANÇA 20 AVANÇA 20 RECULA 60 AVANÇA 60');
  assert.ok(compareDrawings(b.segments, a.segments).ok);
});

test('diu què sobra i què falta (quadrat en lloc de rectangle)', () => {
  const target = drawing('REPETEIX 2 [AVANÇA 40 GIRA.D 90 AVANÇA 80 GIRA.D 90]');
  const student = drawing('REPETEIX 4 [AVANÇA 80 GIRA.D 90]');
  const r = compareDrawings(student.segments, target.segments);
  assert.equal(r.ok, false);
  assert.equal(r.extra.length, 3);
  assert.equal(r.missing.length, 1);
  // Les mides surten una mica escurçades per la tolerància (menys d'1 pas per extrem).
  const len = (s) => Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
  const extra = r.extra.map(len).sort((x, y) => x - y);
  [40, 40, 80].forEach((want, i) => assert.ok(Math.abs(extra[i] - want) < 2, `${extra[i]} ≉ ${want}`));
  assert.ok(Math.abs(len(r.missing[0]) - 80) < 2);
});

test('una mida diferent no és correcta', () => {
  const r = compareDrawings(drawing('REPETEIX 4 [AVANÇA 48 GIRA.D 90]').segments, drawing(SQUARE).segments);
  assert.equal(r.ok, false);
});

test('la goma esborra tinta', () => {
  const a = drawing('AVANÇA 30');
  const b = drawing('AVANÇA 60 GOMA RECULA 30');
  assert.ok(compareDrawings(b.segments, a.segments).ok);
});

test('estat final de la tortuga', () => {
  const full = drawing(SQUARE).pose;
  const noTurn = drawing('REPETEIX 3 [AVANÇA 50 GIRA.D 90] AVANÇA 50').pose;
  assert.deepEqual(comparePose(noTurn, full), { position: true, heading: false });
  assert.deepEqual(comparePose(drawing('AVANÇA 50').pose, full), { position: false, heading: true });
});

// ── El capítol 1 tal com es publica ──
const html = readFileSync(new URL('../../curs/capitol-1.html', import.meta.url), 'utf8');
const sims = [...html.matchAll(/<div class="simulador"([^>]*)>([\s\S]*?)<\/div>/g)].map((m) => ({
  attrs: m[1],
  solutions: [...m[2].matchAll(/<script type="text\/logo">([\s\S]*?)<\/script>/g)].map((s) => s[1]),
}));

test('capítol 1: 6 simuladors lliures i 2 exercicis', () => {
  assert.equal(sims.filter((s) => s.solutions.length === 0).length, 6);
  assert.equal(sims.filter((s) => s.solutions.length > 0).length, 2);
});

test('capítol 1: totes les solucions de referència funcionen', () => {
  for (const s of sims) for (const code of s.solutions) drawing(code);
});

test('capítol 1: «L\'escala» — la solució passa i l\'error previst es detecta', () => {
  const ex = sims.find((s) => s.attrs.includes('cap1-escala'));
  const target = drawing(ex.solutions[0]);
  assert.equal(target.segments.length, 6);
  assert.ok(compareDrawings(drawing('REPETEIX 3 [AVANÇA 30 GIRA.D 90 AVANÇA 30 GIRA.E 90]').segments, target.segments).ok);
  const wrong = compareDrawings(drawing('REPETEIX 3 [AVANÇA 30 GIRA.D 90 AVANÇA 30 GIRA.D 90]').segments, target.segments);
  assert.equal(wrong.ok, false);
});

test('capítol 1: «El quadrat» — accepta els dos sentits i exigeix l\'últim gir', () => {
  const ex = sims.find((s) => s.attrs.includes('cap1-quadrat'));
  assert.ok(ex.attrs.includes('data-clau'));
  assert.ok(ex.attrs.includes('dibuix+tortuga'));
  assert.equal(ex.solutions.length, 2);
  const [right, left] = ex.solutions.map(drawing);
  assert.equal(compareDrawings(left.segments, right.segments).ok, false);
  const student = drawing('AVANÇA 50 GIRA.E 90 AVANÇA 50 GIRA.E 90 AVANÇA 50 GIRA.E 90 AVANÇA 50');
  assert.ok(compareDrawings(student.segments, left.segments).ok);
  assert.deepEqual(comparePose(student.pose, left.pose), { position: true, heading: false });
});

test('capítol 1: «Què dibuixarà?» té una sola opció correcta i és la del codi mostrat', () => {
  const block = html.match(/<div class="prediu"[\s\S]*?<\/div>/)[0];
  const shown = block.match(/<pre class="codi">([\s\S]*?)<\/pre>/)[1];
  const opts = [...block.matchAll(/<script type="text\/logo"([^>]*)>([\s\S]*?)<\/script>/g)];
  assert.equal(opts.length, 3);
  const good = opts.filter((o) => o[1].includes('data-correcta'));
  assert.equal(good.length, 1);
  assert.ok(compareDrawings(drawing(good[0][2]).segments, drawing(shown).segments).ok);
  for (const o of opts) if (!o[1].includes('data-correcta')) {
    assert.equal(compareDrawings(drawing(o[2]).segments, drawing(shown).segments).ok, false);
  }
});

test('capítol 1: el qüestionari té 3 preguntes amb resposta i explicació', () => {
  const qs = [...html.matchAll(/<fieldset class="pregunta" data-correcta="(\d)">([\s\S]*?)<\/fieldset>/g)];
  assert.equal(qs.length, 3);
  for (const q of qs) {
    const labels = [...q[2].matchAll(/<label>/g)].length;
    assert.equal(labels, 3);
    assert.ok(Number(q[1]) < labels);
    assert.ok(q[2].includes('class="explicacio"'));
  }
});

test('cap petició a tercers a les pàgines publicades', () => {
  for (const f of ['curs/capitol-1.html', 'curs/capitol-2.html', 'curs/capitol-3.html', 'curs/capitol-4.html', 'curs/capitol-5.html', 'curs/capitol-6.html', 'curs/capitol-7.html', 'curs/capitol-8.html', 'index.html', 'simulador.html', '404.html', 'css/logocat.css']) {
    const text = readFileSync(new URL('../../' + f, import.meta.url), 'utf8');
    assert.equal(/https?:\/\//.test(text.replace(/http:\/\/www\.w3\.org\/2000\/svg/g, '')), false, f);
  }
});
