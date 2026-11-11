// Proves del capítol 7 tal com es publica: procediments amb dues variables, polígons i estrelles.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Interpreter } from '../../js/logo/interpret.js';
import { describe } from '../../js/logo/missatges.js';
import { compareDrawings, comparePose } from '../../js/logo/compara.js';

function drawing(code) {
  const I = new Interpreter({ rng: () => 0.5 });
  const r = I.runSync(code);
  assert.equal(r.error, null, 'ha de funcionar: ' + code);
  return { I, segments: I.turtle.segments, pose: I.turtle.pose() };
}
function runPanel(panel, line) {
  const I = new Interpreter({ rng: () => 0.5 });
  I.defineAll(panel);
  const r = I.runSync(line);
  return { I, error: r.error, segments: I.turtle.segments, pose: I.turtle.pose() };
}
const msg = (d) => describe(d.error, d.I.knownWords());
const read = (f) => readFileSync(new URL('../../' + f, import.meta.url), 'utf8');
const html = read('curs/capitol-7.html');
const sims = [...html.matchAll(/<div class="simulador"([^>]*)>([\s\S]*?)<\/div>/g)].map((m) => ({
  attrs: m[1],
  solutions: [...m[2].matchAll(/<script type="text\/logo">([\s\S]*?)<\/script>/g)].map((s) => s[1]),
  panel: ((m[2].match(/<script type="text\/logo-panell">([\s\S]*?)<\/script>/) || [])[1] || '').replace(/^\n+|\s+$/g, ''),
}));
const sim = (id) => sims.find((s) => s.attrs.includes(id));
const attr = (s, name) => (s.attrs.match(new RegExp(name + '="([^"]*)"')) || [])[1];
const inField = (segs) => segs.every((s) => [s.x1, s.x2].every((x) => x >= -140 && x < 140) && [s.y1, s.y2].every((y) => y >= -120 && y < 120));
const PO = 'PROC POLÍGON :N :COSTAT\n  REPETEIX :N [AVANÇA :COSTAT GIRA.D 360 / :N]\nFI';
const ES = 'PROC ESTRELLA :N :VOLTES\n  REPETEIX :N [AVANÇA 80 GIRA.D 360 * :VOLTES / :N]\nFI';

test('capítol 7: 3 simuladors d\'exemple i 3 exercicis; decisions de la revisió 9', () => {
  assert.equal(sims.length, 6);
  const ex = sims.filter((s) => s.solutions.length > 0);
  assert.equal(ex.length, 3);
  for (const s of ex) {
    for (const code of s.solutions) { assert.ok(inField(drawing(code).segments)); assert.ok(code.trim().endsWith(attr(s, 'data-executa'))); }
    assert.ok(html.includes(`farà <code>${attr(s, 'data-executa')}</code>`));
  }
  for (const s of sims) if (s.panel) new Interpreter().defineAll(s.panel);
  const text = html.replace(/<p class="peu">[\s\S]*?<\/p>/, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
  assert.ok(!/\bentrad|\bcaps[ae]/i.test(text));
  assert.ok(!/cercle|circumfer/i.test(text.replace('dibuixaràs cercles i arcs', '')), 'cap polígon «sembla un cercle» (owner)');
  assert.ok(!/divisor|divideixen/i.test(text), 'sense teoria de divisors (owner)');
  assert.ok(text.includes("De vegades l'estrella no surt sencera."));                         // frase de l'owner
  assert.ok(html.includes(':VOLTES') && !html.includes(':SALT'));
  assert.ok(html.includes('POLÍGON 8 10') && html.includes('POLÍGON 10 8'));                  // exemple de l'owner
  assert.ok(Math.max(...html.split('\n').filter((l) => /^(PROC |  [A-ZÀ-Ú]|FI$)/.test(l)).map((l) => l.length)) <= 52);
});

test('POLÍGON: tots els exemples del capítol tanquen i caben; l\'ordre dels valors importa', () => {
  const noQuiz = html.replace(/<div class="quiz"[\s\S]*?<\/div>/, '');                         // les respostes falses del qüestionari no es dibuixen
  for (const m of new Set([...noQuiz.matchAll(/POLÍGON \d+ \d+/g)].map((x) => x[0]))) {
    const d = runPanel(PO, m);
    assert.equal(d.error, null, m);
    assert.ok(inField(d.segments) && Math.hypot(d.pose.x, d.pose.y) < 1e-6, m);
  }
  assert.equal(runPanel(PO, 'POLÍGON 8 10').segments.length, 8);
  assert.equal(runPanel(PO, 'POLÍGON 10 8').segments.length, 10);
  assert.ok(compareDrawings(runPanel(PO, 'POLÍGON 4 50').segments, drawing('REPETEIX 4 [AVANÇA 50 GIRA.D 90]').segments).ok);
});

test('capítol 7: «El polígon» i «El pentàgon petit» — POLÍGON 5 40', () => {
  const ex = sim('cap7-poligon');
  const [right, left] = ex.solutions.map(drawing);
  assert.equal(compareDrawings(right.segments, left.segments).ok, false);
  const other = runPanel('PROC POLÍGON :COSTATS :MIDA\n  REPETEIX :COSTATS [AVANÇA :MIDA GIRA.D 360 / :COSTATS]\nFI', 'POLÍGON 5 40');
  assert.ok(compareDrawings(other.segments, right.segments).ok);
  assert.deepEqual(comparePose(other.pose, right.pose), { position: true, heading: true });
  const bug = sim('cap7-error');
  const given = runPanel(bug.panel, attr(bug, 'data-executa'));
  assert.equal(given.error, null);
  assert.equal(compareDrawings(given.segments, drawing(bug.solutions[0]).segments).ok, false);
  const fixed = runPanel(bug.panel.replace('REPETEIX :COSTAT [AVANÇA :N', 'REPETEIX :N [AVANÇA :COSTAT'), 'POLÍGON 5 40');
  assert.ok(compareDrawings(fixed.segments, right.segments).ok);
});

test('estrelles: 5 × 144 = 720; «L\'estrella» amb ESTRELLA 7 3, a dreta o a esquerra', () => {
  assert.ok(compareDrawings(runPanel(ES, 'ESTRELLA 5 2').segments, drawing('REPETEIX 5 [AVANÇA 80 GIRA.D 144]').segments).ok);
  for (const line of ['ESTRELLA 5 2', 'ESTRELLA 7 2', 'ESTRELLA 7 3']) assert.ok(inField(runPanel(ES, line).segments), line);
  const ex = sim('cap7-estrella');
  assert.ok(ex.attrs.includes('data-clau') && ex.attrs.includes('dibuix+tortuga'));
  const [right, left] = ex.solutions.map(drawing);
  assert.equal(compareDrawings(right.segments, left.segments).ok, false);
  const good = runPanel(ES, 'ESTRELLA 7 3');
  assert.deepEqual(comparePose(good.pose, right.pose), { position: true, heading: true });
  assert.deepEqual(comparePose(good.pose, { x: 0, y: 0, heading: 0 }), { position: true, heading: true });   // 3 voltes senceres = mirant amunt
  const copied = runPanel('PROC ESTRELLA :N :VOLTES\n  REPETEIX :N [AVANÇA 80 GIRA.D 144]\nFI', 'ESTRELLA 7 3');
  assert.equal(compareDrawings(copied.segments, right.segments).ok, false);                   // copiar el 144 no serveix
});

test('capítol 7: «Què dibuixarà?» — hexàgon, pentàgon i triangle', () => {
  const block = html.match(/<div class="prediu"[\s\S]*?<\/div>/)[0];
  const opts = [...block.matchAll(/<script type="text\/logo"( data-correcta)?[^>]*>([\s\S]*?)<\/script>/g)].map((m) => ({ ok: !!m[1], d: drawing(m[2]) }));
  assert.deepEqual(opts.map((o) => o.d.segments.length), [6, 5, 3]);
  assert.equal(opts.filter((o) => o.ok).length, 1);
});

test('missatge quan falta un valor (owner): la línia PROC i un exemple amb els valors de l\'alumne', () => {
  assert.deepEqual(msg(runPanel(PO, 'POLÍGON 5')), { line1: "EL PROCEDIMENT 'POLÍGON' NECESSITA 2 VALORS",
    hints: ['Mira la seva línia PROC: PROC POLÍGON :N :COSTAT', 'Per exemple: POLÍGON 5 20'] });
  assert.deepEqual(msg(runPanel(PO, 'POLÍGON')).hints, ['Mira la seva línia PROC: PROC POLÍGON :N :COSTAT']);   // sense valor escrit, sense exemple (owner, cap. 8)
  for (const m of html.matchAll(/<span class="p">  ([^<]+)<\/span>/g)) assert.ok(msg(runPanel(PO, 'POLÍGON 5')).hints.includes(m[1]), m[1]);   // el capítol cita el missatge real
});
