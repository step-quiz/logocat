// Proves del capítol 8 tal com es publica: cercles i arcs, i la correcció per punts.
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
const html = read('curs/capitol-8.html');
const sims = [...html.matchAll(/<div class="simulador"([^>]*)>([\s\S]*?)<\/div>/g)].map((m) => ({
  attrs: m[1],
  solutions: [...m[2].matchAll(/<script type="text\/logo">([\s\S]*?)<\/script>/g)].map((s) => s[1]),
  panel: ((m[2].match(/<script type="text\/logo-panell">([\s\S]*?)<\/script>/) || [])[1] || '').replace(/^\n+|\s+$/g, ''),
}));
const sim = (id) => sims.find((s) => s.attrs.includes(id));
const attr = (s, name) => (s.attrs.match(new RegExp(name + '="([^"]*)"')) || [])[1];
const inField = (segs) => segs.every((s) => [s.x1, s.x2].every((x) => x >= -140 && x < 140) && [s.y1, s.y2].every((y) => y >= -120 && y < 120));
const CE = 'PROC CERCLE :PAS\n  REPETEIX 360 [AVANÇA :PAS GIRA.D 1]\nFI';
const AR = 'PROC ARC :PAS :GRAUS\n  REPETEIX :GRAUS [AVANÇA :PAS GIRA.D 1]\nFI';
const PE = 'PROC PÈTAL :PAS\n  REPETEIX 2 [ARC :PAS 90 GIRA.D 90]\nFI';

test('capítol 8: 4 simuladors d\'exemple i 3 exercicis; decisions de la revisió 10', () => {
  assert.equal(sims.length, 7);
  const ex = sims.filter((s) => s.solutions.length > 0);
  assert.equal(ex.length, 3);
  for (const s of ex) {
    for (const code of s.solutions) { assert.ok(inField(drawing(code).segments)); assert.ok(code.trim().endsWith(attr(s, 'data-executa'))); }
    assert.ok(html.includes(`farà <code>${attr(s, 'data-executa')}</code>`));
  }
  for (const s of sims) if (s.panel) new Interpreter().defineAll(s.panel);
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
  assert.ok(!/\bentrad|\bcaps[ae]/i.test(text));
  assert.ok(!/polígon|assembl|costats/i.test(text), 'el cercle no és un polígon (owner, G2: «la tortuga camina en rodó»)');
  assert.ok(!/\bpi\b|π|3[.,]14|diàmetre|radi\b/i.test(text), 'sense π (owner, G4 i S4)');
  assert.ok(!/anys 80|1985|198\d/.test(text));
  assert.ok(html.includes(':PAS') && !html.includes(':RADI'));                                     // G3
  assert.ok(Math.max(...html.split('\n').filter((l) => /^(PROC |  [A-ZÀ-Ú]|FI$)/.test(l)).map((l) => l.length)) <= 52);
});

test('CERCLE: tanca mirant amunt, i els exemples hi caben (CERCLE 2 no, com diu el text)', () => {
  for (const v of ['1', '0.5', '0.2']) {
    const d = runPanel(CE, 'CERCLE ' + v);
    assert.equal(d.error, null);
    assert.ok(inField(d.segments), v);
    assert.deepEqual(comparePose(d.pose, { x: 0, y: 0, heading: 0 }), { position: true, heading: true }, v);
  }
  assert.ok(runPanel(CE, 'CERCLE 2').segments.length > 360, 'CERCLE 2 surt per l\'altra banda (es parteix a les vores)');
  assert.ok(compareDrawings(drawing('REPETEIX 360 [AVANÇA 1 GIRA.D 1]').segments, runPanel(CE, 'CERCLE 1').segments).ok);
});

test('«El cercle»: CERCLE 0.5, a dreta o a esquerra; la correcció veu les corbes (G5)', () => {
  const ex = sim('cap8-cercle');
  const [right, left] = ex.solutions.map(drawing);
  assert.equal(compareDrawings(right.segments, left.segments).ok, false);
  const other = runPanel('PROC CERCLE :MIDA\n  REPETEIX 360 [AVANÇA :MIDA GIRA.D 1]\nFI', 'CERCLE 0.5');
  assert.ok(compareDrawings(other.segments, right.segments).ok);
  assert.deepEqual(comparePose(other.pose, right.pose), { position: true, heading: true });
  const no = (code, why) => assert.equal(compareDrawings(drawing(code).segments, right.segments).ok, false, why);
  no('GIRA.D 0', 'pantalla buida');
  no('REPETEIX 180 [AVANÇA 0.5 GIRA.D 1]', 'mig cercle');
  no('REPETEIX 350 [AVANÇA 0.5 GIRA.D 1]', 'li falten 10 graus');
  no('REPETEIX 360 [AVANÇA 0.6 GIRA.D 1]', 'una altra mida');
  const semi = compareDrawings(drawing('REPETEIX 180 [AVANÇA 0.5 GIRA.D 1]').segments, right.segments);   // el que falta es pinta sencer i seguit
  const L = semi.missing.reduce((t, s) => t + Math.hypot(s.x2 - s.x1, s.y2 - s.y1), 0);
  assert.ok(L > 85 && L <= 90, 'falta mig cercle: ' + L);
  assert.ok(semi.missing.every((s, i) => i === 0 || Math.hypot(semi.missing[i - 1].x2 - s.x1, semi.missing[i - 1].y2 - s.y1) < 1e-6));
  const erased = drawing('REPETEIX 360 [AVANÇA 0.5 GIRA.D 1] GOMA REPETEIX 90 [AVANÇA 0.5 GIRA.D 1]').segments;
  const rest = drawing('NO.LLAPIS REPETEIX 90 [AVANÇA 0.5 GIRA.D 1] LLAPIS REPETEIX 270 [AVANÇA 0.5 GIRA.D 1]').segments;
  assert.ok(compareDrawings(erased, rest).ok, 'la goma esborra corbes');
  assert.equal(compareDrawings(erased, right.segments).ok, false);
  for (const n of [8, 12, 18, 36]) no(`REPETEIX ${n} [AVANÇA ${180 / n} GIRA.D ${360 / n}]`, n + ' costats');
});

test('«El cercle que no tanca»: REPETEIX 36 en lloc de 360', () => {
  const bug = sim('cap8-error');
  assert.equal(attr(bug, 'data-executa'), 'CERCLE 1');
  const given = runPanel(bug.panel, 'CERCLE 1');
  assert.equal(given.error, null);
  assert.equal(compareDrawings(given.segments, drawing(bug.solutions[0]).segments).ok, false);
  const fixed = runPanel(bug.panel.replace('REPETEIX 36 ', 'REPETEIX 360 '), 'CERCLE 1');
  assert.ok(compareDrawings(fixed.segments, drawing(bug.solutions[0]).segments).ok);
});

test('ARC: els exemples del text; un arc no deixa la tortuga com l\'ha trobada', () => {
  assert.equal(sims.filter((s) => s.panel === AR).length, 2);                                       // secció Arcs i «El pètal»
  for (const [line, h] of [['ARC 1 90', 90], ['ARC 1 180', 180], ['ARC 0.5 270', 270]]) {
    const d = runPanel(AR, line);
    assert.equal(d.error, null);
    assert.ok(inField(d.segments), line);
    assert.ok(Math.abs(d.pose.heading - h) < 1e-6, line);
  }
  assert.ok(compareDrawings(runPanel(AR, 'ARC 1 360').segments, runPanel(CE, 'CERCLE 1').segments).ok);
});

test('«El pètal» (clau): PÈTAL 0.8 amb ARC; la flor del final', () => {
  const ex = sim('cap8-petal');
  assert.ok(ex.attrs.includes('data-clau') && ex.attrs.includes('dibuix+tortuga') && attr(ex, 'data-exigeix') === 'ARC');
  assert.equal(ex.panel, AR);
  const [good] = ex.solutions.map(drawing);
  assert.deepEqual(comparePose(good.pose, { x: 0, y: 0, heading: 0 }), { position: true, heading: true });
  assert.ok(good.I.procUses('PÈTAL', 'ARC'));
  const unrolled = runPanel(AR + '\nPROC PÈTAL :PAS\n  ARC :PAS 90 GIRA.D 90 ARC :PAS 90 GIRA.D 90\nFI', 'PÈTAL 0.8');
  assert.ok(compareDrawings(unrolled.segments, good.segments).ok);
  const noTurn = runPanel(AR + '\nPROC PÈTAL :PAS\n  REPETEIX 2 [ARC :PAS 90]\nFI', 'PÈTAL 0.8');   // sense el gir de 90: mig cercle
  assert.equal(compareDrawings(noTurn.segments, good.segments).ok, false);
  const last = sims[sims.length - 1];
  assert.equal(last.panel, AR + '\n\n' + PE);
  const flor = runPanel(last.panel, 'REPETEIX 6 [PÈTAL 1 GIRA.D 60]');
  assert.equal(flor.error, null);
  assert.ok(inField(flor.segments));
  assert.ok(html.includes('REPETEIX 6 [PÈTAL 1 GIRA.D 60]'));
});

test('capítol 8: «Què dibuixarà?» — mig cercle, cercle i quart', () => {
  const block = html.match(/<div class="prediu"[\s\S]*?<\/div>/)[0];
  const opts = [...block.matchAll(/<script type="text\/logo"( data-correcta)?[^>]*>([\s\S]*?)<\/script>/g)].map((m) => ({ ok: !!m[1], d: drawing(m[2]) }));
  assert.deepEqual(opts.map((o) => o.d.segments.length), [180, 360, 90]);
  assert.equal(opts.filter((o) => o.ok).length, 1);
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.equal(compareDrawings(opts[i].d.segments, opts[j].d.segments).ok, false);
});

test('missatges nous (owner, revisió 10)', () => {
  assert.deepEqual(msg(runPanel(CE, 'CERCLE')), { line1: "EL PROCEDIMENT 'CERCLE' NECESSITA 1 VALOR", hints: ['Mira la seva línia PROC: PROC CERCLE :PAS'] });
  assert.deepEqual(msg(runPanel(AR, 'ARC 1')).hints, ['Mira la seva línia PROC: PROC ARC :PAS :GRAUS', 'Per exemple: ARC 1 20']);
  assert.deepEqual(msg(runPanel(CE, "CERCLE 0'5")), { line1: "NO ENTENC 0'5", hints: ["Els decimals s'escriuen amb punt: 0.5"] });
  assert.deepEqual(msg(runPanel(CE, 'CERCLE 0,5')), { line1: 'NO ENTENC 0,5', hints: ["Els decimals s'escriuen amb punt: 0.5"] });
  assert.deepEqual(msg(runPanel(AR, 'ARC 1 -90')), { line1: "A REPETEIX NO LI AGRADA -90 A LA LÍNIA 2 DEL PROCEDIMENT 'ARC'", hints: ['REPETEIX no pot repetir un nombre negatiu de vegades'] });
});
