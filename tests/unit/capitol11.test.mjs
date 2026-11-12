// Proves del capítol 11 tal com es publica: ATZAR, SI i freqüències.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Interpreter } from '../../js/logo/interpret.js';
import { describe } from '../../js/logo/missatges.js';
import { compareDrawings, comparePose } from '../../js/logo/compara.js';

const seeded = (n) => { let x = n; return () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; }; };
function drawing(code, rng = () => 0.5) {
  const I = new Interpreter({ rng });
  const r = I.runSync(code);
  assert.equal(r.error, null, 'ha de funcionar: ' + code);
  return { I, r, segments: I.turtle.segments, pose: I.turtle.pose() };
}
function runPanel(panel, line, rng = () => 0.5) {
  const I = new Interpreter({ rng });
  I.defineAll(panel);
  const r = I.runSync(line);
  return { I, r, error: r.error, segments: I.turtle.segments, pose: I.turtle.pose() };
}
const msg = (d) => describe(d.error, d.I.knownWords());
const read = (f) => readFileSync(new URL('../../' + f, import.meta.url), 'utf8');
const html = read('curs/capitol-11.html');
const sims = [...html.matchAll(/<div class="simulador"([^>]*)>([\s\S]*?)<\/div>/g)].map((m) => ({
  attrs: m[1],
  solutions: [...m[2].matchAll(/<script type="text\/logo">([\s\S]*?)<\/script>/g)].map((s) => s[1]),
  panel: ((m[2].match(/<script type="text\/logo-panell">([\s\S]*?)<\/script>/) || [])[1] || '').replace(/^\n+|\s+$/g, ''),
}));
const sim = (id) => sims.find((s) => s.attrs.includes(id));
const attr = (s, name) => (s.attrs.match(new RegExp(name + '="([^"]*)"')) || [])[1];
const inField = (segs) => segs.every((s) => [s.x1, s.x2].every((x) => x >= -140 && x < 140) && [s.y1, s.y2].every((y) => y >= -120 && y < 120));
const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

test('capítol 11: 4 simuladors d\'exemple i 2 exercicis sense atzar; decisions de la revisió 13', () => {
  assert.equal(sims.length, 6);
  const ex = sims.filter((s) => s.solutions.length > 0);
  assert.equal(ex.length, 2, 'dos exercicis (owner, G3)');
  for (const s of ex) {
    for (const code of s.solutions) { assert.ok(!/ATZAR/.test(code), 'els exercicis no fan servir ATZAR (G3)'); assert.ok(inField(drawing(code).segments)); assert.ok(code.trim().endsWith(attr(s, 'data-executa'))); }
    assert.ok(html.includes(`farà <code>${attr(s, 'data-executa')}</code>`));
  }
  for (const s of sims) if (s.panel) new Interpreter().defineAll(s.panel);
  assert.ok(!/POSA\.A|RETORNA|ACABA/.test(html), 'sense POSA.A, RETORNA ni ACABA (G2)');
  assert.ok(!/\bentrad|\bcaps[ae]/i.test(text));
  assert.ok(!/anys 80|1985|198\d/.test(text));
  assert.ok(Math.max(...html.split('\n').filter((l) => /^(PROC |  [A-ZÀ-Ú]|FI$)/.test(l)).map((l) => l.length)) <= 52);
});

test('ATZAR s\'explica primer, amb els N resultats, abans de SI (owner, G4 i S1)', () => {
  const atzar = text.indexOf('{0, 1, …, N − 1}'), si = text.indexOf('mira una condició');
  assert.ok(atzar > 0 && si > atzar, 'el conjunt de resultats surt abans de SI');
  for (const w of ['0, 1, 2, 3, 4 o 5', 'El 6 no surt mai', 'hi ha N resultats possibles, i el N no surt mai', 'només pot donar 0 o 1']) assert.ok(text.includes(w), w);
  const seen = new Set();
  const rng = seeded(5);
  for (let i = 0; i < 400; i++) seen.add(drawing('ESCRIU ATZAR 6', rng).r.prints[0]);
  assert.deepEqual([...seen].sort(), ['0', '1', '2', '3', '4', '5']);
  for (let i = 0; i < 50; i++) { const v = Number(drawing('ESCRIU 1 + ATZAR 6', rng).r.prints[0]); assert.ok(v >= 1 && v <= 6); }
});

test('SI: el text, el «Què dibuixarà?» i CERT/FALS', () => {
  assert.ok(text.includes('La segona llista és el que fa la tortuga si la condició no es compleix.'));
  assert.deepEqual(drawing('ESCRIU 3 > 5').r.prints, ['FALS']);
  assert.deepEqual(drawing('ESCRIU 3 = 3').r.prints, ['CERT']);
  const block = html.match(/<div class="prediu"[\s\S]*?<\/div>/)[0];
  const opts = [...block.matchAll(/<script type="text\/logo"( data-correcta)?[^>]*>([\s\S]*?)<\/script>/g)].map((m) => ({ ok: !!m[1], d: drawing(m[2]) }));
  assert.deepEqual(opts.map((o) => o.ok), [true, false, false]);
  assert.ok(compareDrawings(opts[0].d.segments, drawing('SI 3 > 5 [AVANÇA 50] [GIRA.D 90 AVANÇA 50]').segments).ok);
});

test('atzar: el passeig, la moneda i la cursa funcionen i hi caben', () => {
  const walk = drawing('REPETEIX 300 [AVANÇA 4 GIRA.D ATZAR 360]', seeded(3));
  assert.equal(walk.segments.length > 0, true);
  const moneda = sims.find((s) => /PROC MONEDA/.test(s.panel));
  assert.ok(moneda.panel.includes('SI (ATZAR 2) = 0 [GIRA.D 90] [GIRA.E 90]'));
  const m = runPanel(moneda.panel, 'REPETEIX 200 [MONEDA]', seeded(2));
  assert.equal(m.error, null);
  const cursa = sims.find((s) => /PROC CURSA/.test(s.panel));
  const rng = seeded(9);
  const c = runPanel(cursa.panel, 'REGLE CURSA 10 CURSA 20 CURSA 30 CURSA 40 CURSA 50', rng);
  assert.equal(c.error, null);
  assert.ok(inField(c.segments));
  assert.deepEqual(comparePose(c.pose, { x: 0, y: 0, heading: 0 }), { position: true, heading: true });
  // Cada barra fa tants passos com cares; de 100 tirades, entre 30 i 70 (gairebé segur).
  for (let k = 0; k < 20; k++) {
    const one = runPanel(cursa.panel, 'CURSA 10', rng);
    const len = one.segments.reduce((t, s) => t + Math.hypot(s.x2 - s.x1, s.y2 - s.y1), 0);
    assert.ok(len >= 30 && len <= 70, 'barra de ' + len);
  }
});

test('«El cercle que no hi cap»: el signe girat', () => {
  const bug = sim('cap11-error');
  assert.ok(bug.panel.includes('SI :PAS < 1 [CERCLE 1] [CERCLE :PAS]'));
  const target = drawing(bug.solutions[0]).segments;
  assert.equal(compareDrawings(runPanel(bug.panel, 'CERCLE.SEGUR 2').segments, target).ok, false);
  assert.ok(compareDrawings(runPanel(bug.panel.replace(':PAS < 1', ':PAS > 1'), 'CERCLE.SEGUR 2').segments, target).ok);
});

test('«El quadrat que hi cap» (clau): QUADRAT.SEGUR 150 amb SI', () => {
  const ex = sim('cap11-quadrat');
  assert.ok(ex.attrs.includes('data-clau') && ex.attrs.includes('dibuix+tortuga') && attr(ex, 'data-exigeix') === 'SI');
  const [right, left] = ex.solutions.map((c) => drawing(c));
  assert.ok(right.I.procUses('QUADRAT.SEGUR', 'SI') && left.I.procUses('QUADRAT.SEGUR', 'SI'));
  assert.ok(compareDrawings(right.segments, drawing('REPETEIX 4 [AVANÇA 100 GIRA.D 90]').segments).ok);
  assert.equal(compareDrawings(right.segments, left.segments).ok, false);
  const small = runPanel(ex.panel + '\nPROC QUADRAT.SEGUR :COSTAT\n  SI :COSTAT > 100 [QUADRAT 100] [QUADRAT :COSTAT]\nFI', 'QUADRAT.SEGUR 60');
  assert.ok(compareDrawings(small.segments, drawing('REPETEIX 4 [AVANÇA 60 GIRA.D 90]').segments).ok);
  const wrong = runPanel(ex.panel + '\nPROC QUADRAT.SEGUR :COSTAT\n  SI :COSTAT < 100 [QUADRAT 100] [QUADRAT :COSTAT]\nFI', 'QUADRAT.SEGUR 150');
  assert.equal(compareDrawings(wrong.segments, right.segments).ok, false);
});

test('pistes noves (owner, revisió 13)', () => {
  const m = (line) => msg(runPanel('', line));
  assert.deepEqual(m('SI ATZAR 2 = 0 [AVANÇA 50]'), { line1: 'A ATZAR NO LI AGRADA FALS', hints: ['Posa ATZAR 2 entre parèntesis: (ATZAR 2) = 0'] });
  assert.equal(runPanel('', 'SI (ATZAR 2) = 0 [AVANÇA 50]').error, null);
  assert.deepEqual(m('ESCRIU ATZAR 0').hints, ['ATZAR vol un nombre més gran que 0']);
  assert.deepEqual(m('SI 3 > 5 [AVANÇA 50] SINO [GIRA.D 90]').hints, ['No cal escriure SINO: la segona llista ja és el que es fa si no es compleix.']);
  assert.deepEqual(m('SI 3 > 5 [AVANÇA 50] SI.NO [GIRA.D 90]').hints, ['No cal escriure SINO: la segona llista ja és el que es fa si no es compleix.']);
  for (const l of ['SI 3 >= 5 [AVANÇA 50]', 'SI 3 == 5 [AVANÇA 50]', 'SI 3 <> 5 [AVANÇA 50]', 'SI 3 ≥ 5 [AVANÇA 50]', 'SI 3 ≠ 5 [AVANÇA 50]', 'SI 3 ≤ 5 [AVANÇA 50]']) assert.deepEqual(m(l).hints, ['LOGO només coneix els signes <, > i ='], l);
  assert.deepEqual(m('IF 3 > 5 [AVANÇA 50]').hints, ['Volies dir SI?']);
  assert.deepEqual(m('ESCRIU ALEATORI 6').hints, ['Volies dir ATZAR?']);
  assert.deepEqual(m('ESCRIU 5 5').hints, ['Escriu una ordre, com per exemple AVANÇA 50'], 'la pista de sempre no canvia');
});
