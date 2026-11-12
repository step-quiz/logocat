// Proves del capítol 10 tal com es publica: els paral·lelograms i la diagonal del quadrat.
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
  return { I, r, segments: I.turtle.segments, pose: I.turtle.pose() };
}
function runPanel(panel, line) {
  const I = new Interpreter({ rng: () => 0.5 });
  I.defineAll(panel);
  const r = I.runSync(line);
  return { I, error: r.error, segments: I.turtle.segments, pose: I.turtle.pose() };
}
const msg = (d) => describe(d.error, d.I.knownWords());
const read = (f) => readFileSync(new URL('../../' + f, import.meta.url), 'utf8');
const html = read('curs/capitol-10.html');
const sims = [...html.matchAll(/<div class="simulador"([^>]*)>([\s\S]*?)<\/div>/g)].map((m) => ({
  attrs: m[1],
  solutions: [...m[2].matchAll(/<script type="text\/logo">([\s\S]*?)<\/script>/g)].map((s) => s[1]),
  panel: ((m[2].match(/<script type="text\/logo-panell">([\s\S]*?)<\/script>/) || [])[1] || '').replace(/^\n+|\s+$/g, ''),
}));
const sim = (id) => sims.find((s) => s.attrs.includes(id));
const attr = (s, name) => (s.attrs.match(new RegExp(name + '="([^"]*)"')) || [])[1];
const inField = (segs) => segs.every((s) => [s.x1, s.x2].every((x) => x >= -140 && x < 140) && [s.y1, s.y2].every((y) => y >= -120 && y < 120));
const home = (pose) => comparePose(pose, { x: 0, y: 0, heading: 0 });
const RO = 'PROC ROMBOIDE :BASE :COSTAT\n  AVANÇA :BASE GIRA.D 60 AVANÇA :COSTAT GIRA.D 120\n  AVANÇA :BASE GIRA.D 60 AVANÇA :COSTAT GIRA.D 120\nFI';
const fam = (a, b, g1, g2) => `REPETEIX 2 [AVANÇA ${a} GIRA.D ${g1} AVANÇA ${b} GIRA.D ${g2}]`;

test('capítol 10: 3 simuladors d\'exemple i 3 exercicis; decisions de la revisió 12', () => {
  assert.equal(sims.length, 6);
  const ex = sims.filter((s) => s.solutions.length > 0);
  assert.equal(ex.length, 3);
  for (const s of ex) {
    for (const code of s.solutions) { assert.ok(inField(drawing(code).segments)); assert.ok(code.trim().endsWith(attr(s, 'data-executa'))); }
    assert.ok(html.includes(`farà <code>${attr(s, 'data-executa')}</code>`));
  }
  for (const s of sims) if (s.panel) new Interpreter().defineAll(s.panel);
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
  assert.ok(/<h1>Quadrilàters<\/h1>/.test(html), 'títol (owner, G2)');
  assert.ok(!/isòsceles|estel|triangle rectangle|PARAL·LELOGRAM :|:GIR\b/i.test(html), 'només paral·lelograms, sense angle variable (G2, G4)');
  assert.ok(!/\bentrad|\bcaps[ae]/i.test(text));
  assert.ok(!/anys 80|1985|198\d|\bpi\b|π/.test(text));
  for (const w of ["L'angle exterior i l'angle interior sempre sumen 180°.", 'És el teorema de Pitàgores: la diagonal al quadrat és igual a la suma dels dos costats al quadrat.', 'El quadrat és alhora un rectangle i un rombe.', 'El trapezi només té dos costats paral·lels: no és un paral·lelogram.']) assert.ok(text.includes(w), w);
  assert.ok(Math.max(...html.split('\n').filter((l) => /^(PROC |  [A-ZÀ-Ú]|FI$)/.test(l)).map((l) => l.length)) <= 52);
});

test('el romboide de la primera secció tanca, i la família del text', () => {
  const r = drawing(fam(80, 50, 60, 120));
  assert.ok(html.includes(fam(80, 50, 60, 120)));
  assert.deepEqual(home(r.pose), { position: true, heading: true });
  assert.ok(compareDrawings(r.segments, runPanel(RO, 'ROMBOIDE 80 50').segments).ok, 'la línia i el procediment fan el mateix');
  const fam2 = sims.find((s) => s.panel === RO && s.solutions.length === 0);
  assert.ok(fam2);
  const rect = RO.replaceAll('GIRA.D 60', 'GIRA.D 90').replaceAll('GIRA.D 120', 'GIRA.D 90');
  assert.ok(compareDrawings(runPanel(rect, 'ROMBOIDE 80 50').segments, drawing('REPETEIX 2 [AVANÇA 80 GIRA.D 90 AVANÇA 50 GIRA.D 90]').segments).ok);
  assert.ok(compareDrawings(runPanel(rect, 'ROMBOIDE 60 60').segments, drawing('REPETEIX 4 [AVANÇA 60 GIRA.D 90]').segments).ok);
  for (const line of ['ROMBOIDE 60 60', 'ROMBOIDE 80 50']) { const d = runPanel(RO, line); assert.ok(inField(d.segments)); assert.deepEqual(home(d.pose), { position: true, heading: true }); }
});

test('«Què dibuixarà?»: rombe de 45, quadrat i rombe de 60', () => {
  const block = html.match(/<div class="prediu"[\s\S]*?<\/div>/)[0];
  const opts = [...block.matchAll(/<script type="text\/logo"( data-correcta)?[^>]*>([\s\S]*?)<\/script>/g)].map((m) => ({ ok: !!m[1], d: drawing(m[2]) }));
  assert.deepEqual(opts.map((o) => o.ok), [true, false, false]);
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.equal(compareDrawings(opts[i].d.segments, opts[j].d.segments).ok, false);
});

test('«El romboide»: ROMBOIDE 70 40, a dreta o a esquerra; amb REPETEIX 2 també', () => {
  const ex = sim('cap10-romboide');
  const [right, left] = ex.solutions.map(drawing);
  assert.equal(compareDrawings(right.segments, left.segments).ok, false);
  const longLine = runPanel('PROC ROMBOIDE :BASE :COSTAT\n  REPETEIX 2 [AVANÇA :BASE GIRA.D 60 AVANÇA :COSTAT GIRA.D 120]\nFI', 'ROMBOIDE 70 40');
  assert.ok(compareDrawings(longLine.segments, right.segments).ok);
  const swapped = runPanel(RO, 'ROMBOIDE 40 70');
  assert.equal(compareDrawings(swapped.segments, right.segments).ok, false, 'l\'ordre dels valors importa');
});

test('«El romboide que no tanca»: dos girs de 60', () => {
  const bug = sim('cap10-error');
  assert.equal(bug.panel, RO.replaceAll('GIRA.D 120', 'GIRA.D 60'));
  const target = drawing(bug.solutions[0]).segments;
  assert.equal(compareDrawings(runPanel(bug.panel, 'ROMBOIDE 80 50').segments, target).ok, false);
  assert.ok(compareDrawings(runPanel(RO, 'ROMBOIDE 80 50').segments, target).ok);
});

test('La diagonal del quadrat: ARREL2 i la cantonada', () => {
  for (const l of ['REPETEIX 4 [AVANÇA 50 GIRA.D 90]', 'GIRA.D 45', 'ESCRIU ARREL2 (50 * 50 + 50 * 50)', 'AVANÇA ARREL2 (50 * 50 + 50 * 50)']) assert.ok(html.includes(l), l);
  assert.deepEqual(drawing('ESCRIU ARREL2 (50 * 50 + 50 * 50)').r.prints, ['70.7107']);
  assert.ok(html.includes('Surt 70.7107'));
  const d = drawing('REPETEIX 4 [AVANÇA 50 GIRA.D 90] GIRA.D 45 AVANÇA ARREL2 (50 * 50 + 50 * 50)');
  assert.ok(Math.abs(d.pose.x - 50) < 1e-6 && Math.abs(d.pose.y - 50) < 1e-6, 'arriba just a la cantonada');
  for (const n of [70, 71]) { const e = drawing(`REPETEIX 4 [AVANÇA 50 GIRA.D 90] GIRA.D 45 AVANÇA ${n}`); assert.ok(Math.abs(e.pose.x - 50) > 0.1); }
});

test('«El rombe de 70 graus» (clau): ROMBE 60', () => {
  const ex = sim('cap10-rombe');
  assert.ok(ex.attrs.includes('data-clau') && ex.attrs.includes('dibuix+tortuga'));
  const [right, left] = ex.solutions.map(drawing);
  assert.deepEqual(home(right.pose), { position: true, heading: true });
  assert.ok(right.I.procs.get('ROMBE'));
  const order = runPanel('PROC ROMBE :COSTAT\n  AVANÇA :COSTAT GIRA.D 110 AVANÇA :COSTAT GIRA.D 70\n  AVANÇA :COSTAT GIRA.D 110 AVANÇA :COSTAT GIRA.D 70\nFI', 'ROMBE 60');
  assert.equal(compareDrawings(order.segments, right.segments).ok, false, 'primer 70: l\'enunciat ho diu');
  assert.equal(compareDrawings(left.segments, right.segments).ok, false);
  const open = runPanel('PROC ROMBE :COSTAT\n  REPETEIX 4 [AVANÇA :COSTAT GIRA.D 70]\nFI', 'ROMBE 60');
  assert.equal(compareDrawings(open.segments, right.segments).ok, false);
});

test('pistes noves (owner, revisió 12)', () => {
  assert.deepEqual(msg(runPanel('PROC P :GIR\n  AVANÇA 50 GIRA.D 180 -:GIR\nFI', 'P 60')).hints, ['Per restar, posa un espai a cada costat del signe menys: 180 - :GIR']);
  assert.deepEqual(msg(runPanel('', 'GIRA.D 180 -60')).hints, ['Per restar, posa un espai a cada costat del signe menys: 180 - 60']);
  assert.equal(runPanel('', 'AVANÇA -50 AVANÇA 2').error, null);
  assert.equal(runPanel('', 'GIRA.D 180 - 60').error, null);
  assert.equal(runPanel('', 'AVANÇA -50').error, null, 'un negatiu sol continua sent un nombre');
  assert.deepEqual(msg(runPanel('', 'ESCRIU ARREL2 -4')), { line1: 'A ARREL2 NO LI AGRADA -4', hints: ["ARREL2 no pot fer l'arrel d'un nombre negatiu"] });
  assert.deepEqual(msg(runPanel('', 'ESCRIU 50²')), { line1: 'NO SÉ COM FER 50²', hints: ['Per elevar al quadrat, multiplica: 50 * 50'] });
  assert.deepEqual(msg(runPanel('', 'ESCRIU 2.5²')).hints, ['Per elevar al quadrat, multiplica: 2.5 * 2.5']);
});
