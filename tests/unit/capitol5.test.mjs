// Proves del capítol 5 tal com es publica: angle exterior, volta sencera, comptes dins d'una ordre.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Interpreter } from '../../js/logo/interpret.js';
import { describe } from '../../js/logo/missatges.js';
import { compareDrawings, comparePose } from '../../js/logo/compara.js';

function run(code) {
  const I = new Interpreter({ rng: () => 0.5 });
  const r = I.runSync(code);
  return { I, r, segments: I.turtle.segments, pose: I.turtle.pose(), pen: I.turtle.pen };
}
function drawing(code) { const d = run(code); assert.equal(d.r.error, null, 'ha de funcionar: ' + code); return d; }
function runPanel(panel, name) {
  const I = new Interpreter({ rng: () => 0.5 });
  I.defineAll(panel);
  const r = I.runSync(name);
  return { I, error: r.error, segments: I.turtle.segments, pose: I.turtle.pose() };
}
const message = (code) => { const d = run(code); return describe(d.r.error, d.I.knownWords()); };
const html = readFileSync(new URL('../../curs/capitol-5.html', import.meta.url), 'utf8');
const sims = [...html.matchAll(/<div class="simulador"([^>]*)>([\s\S]*?)<\/div>/g)].map((m) => ({
  attrs: m[1],
  solutions: [...m[2].matchAll(/<script type="text\/logo">([\s\S]*?)<\/script>/g)].map((s) => s[1]),
  panel: ((m[2].match(/<script type="text\/logo-panell">([\s\S]*?)<\/script>/) || [])[1] || '').replace(/^\n+|\s+$/g, ''),
}));
const sim = (id) => sims.find((s) => s.attrs.includes(id));
const attr = (s, name) => (s.attrs.match(new RegExp(name + '="([^"]*)"')) || [])[1];
const inField = (segs) => segs.every((s) => [s.x1, s.x2].every((x) => x >= -140 && x < 140) && [s.y1, s.y2].every((y) => y >= -120 && y < 120));
const closed = (d) => Math.hypot(d.pose.x, d.pose.y) < 1e-6 && Math.abs(d.pose.heading) < 1e-6;

test('capítol 5: 3 simuladors d\'exemple i 3 exercicis; les solucions i els exemples funcionen', () => {
  assert.equal(sims.length, 6);
  const ex = sims.filter((s) => s.solutions.length > 0);
  assert.equal(ex.length, 3);
  for (const s of ex) for (const code of s.solutions) assert.ok(inField(drawing(code).segments));
  for (const s of sims) if (s.panel) new Interpreter().defineAll(s.panel);
  // Els exemples del text: les línies de LOGO funcionen i les respostes citades són les reals.
  for (const m of html.matchAll(/<pre class="codi">\? (ESCRIU [^\n]+)\n(\d+)<\/pre>/g)) assert.deepEqual(run(m[1]).r.prints, [m[2]]);
  for (const m of html.matchAll(/<pre class="codi">(REPETEIX [^<]+)<\/pre>/g)) assert.ok(inField(drawing(m[1]).segments), m[1]);
  assert.ok(html.includes("L'angle exterior i l'angle interior sempre sumen 180°."));        // redacció de l'owner
  assert.ok(html.includes('regla de la volta sencera'));
});

test('volta sencera: amb 60 el triangle no tanca, amb 120 sí; 360 / n tanca qualsevol polígon', () => {
  assert.equal(closed(drawing('REPETEIX 3 [AVANÇA 60 GIRA.D 60]')), false);
  assert.equal(closed(drawing('REPETEIX 3 [AVANÇA 60 GIRA.D 120]')), true);
  for (const n of [3, 4, 5, 6, 7, 8, 10, 12]) {
    const d = drawing(`REPETEIX ${n} [AVANÇA 25 GIRA.D 360 / ${n}]`);
    assert.equal(d.segments.length, n);
    assert.ok(closed(d) && inField(d.segments), 'polígon de ' + n);
  }
});

test('taula del capítol 5: gir = 360 / n i angle interior = 180 - gir', () => {
  const rows = [...html.matchAll(/<tr><td>(\d+)<\/td><td>(\d+)<\/td><td>(\d+)<\/td><\/tr>/g)].map((m) => m.slice(1).map(Number));
  assert.equal(rows.length, 5);
  for (const [n, turn, inner] of rows) {
    assert.deepEqual(run(`ESCRIU 360 / ${n}`).r.prints, [String(turn)]);
    assert.deepEqual(run(`ESCRIU 180 - 360 / ${n}`).r.prints, [String(inner)]);
  }
});

test('capítol 5: «El triangle» — costat 50, cap a la dreta o cap a l\'esquerra, i la tortuga com l\'ha trobada', () => {
  const ex = sim('cap5-triangle');
  assert.ok(ex.attrs.includes('dibuix+tortuga') && attr(ex, 'data-executa') === 'TRIANGLE');
  const [right, left] = ex.solutions.map(drawing);
  assert.equal(compareDrawings(right.segments, left.segments).ok, false);
  const long = runPanel('PROC TRIANGLE\n  AVANÇA 50 GIRA.D 120\n  AVANÇA 50 GIRA.D 120\n  AVANÇA 50\nFI', 'TRIANGLE');
  assert.ok(compareDrawings(long.segments, right.segments).ok);
  assert.deepEqual(comparePose(long.pose, right.pose), { position: true, heading: false });   // falta l'últim gir
  const sixty = runPanel('PROC TRIANGLE\n  REPETEIX 3 [AVANÇA 50 GIRA.D 60]\nFI', 'TRIANGLE');
  assert.equal(compareDrawings(sixty.segments, right.segments).ok, false);
});

test('capítol 5: «Què dibuixarà?» — hexàgon, triangle i mig hexàgon', () => {
  const block = html.match(/<div class="prediu"[\s\S]*?<\/div>/)[0];
  const opts = [...block.matchAll(/<script type="text\/logo"( data-correcta)?[^>]*>([\s\S]*?)<\/script>/g)].map((m) => ({ ok: !!m[1], d: drawing(m[2]) }));
  assert.deepEqual(opts.map((o) => o.d.segments.length), [6, 3, 3]);
  assert.equal(opts.filter((o) => o.ok).length, 1);
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.equal(compareDrawings(opts[i].d.segments, opts[j].d.segments).ok, false);
});

test('capítol 5: «El pentàgon obert» — amb 360 / 6 no tanca; amb 360 / 5 o amb 72, sí', () => {
  const ex = sim('cap5-error');
  assert.equal(attr(ex, 'data-executa'), 'PENTÀGON');
  const t = drawing(ex.solutions[0]);
  const given = runPanel(ex.panel, 'PENTÀGON');
  assert.equal(given.error, null);
  assert.equal(compareDrawings(given.segments, t.segments).ok, false);
  for (const fix of ['360 / 5', '72']) {
    const fixed = runPanel(ex.panel.replace('360 / 6', fix), 'PENTÀGON');
    assert.ok(compareDrawings(fixed.segments, t.segments).ok, fix);
  }
});

test('capítol 5: «La casa» — cal girar 30 abans de la teulada, fer servir TRIANGLE i tornar', () => {
  const ex = sim('cap5-casa');
  assert.ok(ex.attrs.includes('data-clau') && ex.attrs.includes('dibuix+tortuga') && attr(ex, 'data-exigeix') === 'TRIANGLE');
  const t = drawing(ex.solutions[0]);
  assert.ok(closed(t));
  assert.ok(Math.abs(Math.max(...t.segments.flatMap((s) => [s.y1, s.y2])) - (50 + 25 * Math.sqrt(3))) < 1e-6);   // el cim de la teulada
  const casa = (body) => runPanel(ex.panel + '\n\nPROC CASA\n' + body + '\nFI', 'CASA');
  const good = casa('  QUADRAT\n  AVANÇA 50\n  GIRA.D 30\n  TRIANGLE\n  GIRA.E 30\n  RECULA 50');
  assert.ok(compareDrawings(good.segments, t.segments).ok);
  assert.deepEqual(comparePose(good.pose, t.pose), { position: true, heading: true });
  assert.equal(good.I.procUses('CASA', 'TRIANGLE'), true);
  const noTurn = casa('  QUADRAT\n  AVANÇA 50\n  TRIANGLE\n  RECULA 50');
  assert.equal(compareDrawings(noTurn.segments, t.segments).ok, false);                       // sense el gir, la teulada cau de costat
  const notBack = casa('  QUADRAT\n  AVANÇA 50 GIRA.D 30\n  TRIANGLE');
  assert.ok(compareDrawings(notBack.segments, t.segments).ok);
  assert.deepEqual(comparePose(notBack.pose, t.pose), { position: false, heading: false });   // dibuix bo, però no torna
  const byHand = casa('  QUADRAT\n  AVANÇA 50 GIRA.D 30\n  REPETEIX 3 [AVANÇA 50 GIRA.D 120]\n  GIRA.E 30 RECULA 50');
  assert.ok(compareDrawings(byHand.segments, t.segments).ok);
  assert.equal(byHand.I.procUses('CASA', 'TRIANGLE'), false);                                 // dibuix bo sense la peça: missatge d'ànim
});

test('missatges del capítol 5 (owner): els signes de classe per dividir i multiplicar', () => {
  const div = ['Per dividir, fes servir el signe /. Per exemple: 360 / 5'];
  const mul = ['Per multiplicar, fes servir el signe *. Per exemple: 3 * 120'];
  assert.deepEqual(message('ESCRIU 360 : 5'), { line1: 'NO SÉ COM FER :', hints: div });
  assert.deepEqual(message('ESCRIU 360:5').hints, div);
  assert.deepEqual(message('ESCRIU 360 ÷ 5').hints, div);
  assert.deepEqual(message('ESCRIU 3 X 120'), { line1: 'NO SÉ COM FER X', hints: mul });
  assert.deepEqual(message('ESCRIU 3 · 120').hints, mul);
  assert.deepEqual(message('ESCRIU 3x120').hints, mul);
  assert.deepEqual(message('X').hints, ["Si és un procediment teu, primer l'has de definir amb PROC … FI."]);   // revisió 19 (E8): la pista general                                                  // una X sola no és una multiplicació
  assert.deepEqual(run('PROC X\nAVANÇA 10\nFI\nX').r.error, null);                            // i X pot ser un procediment
  assert.deepEqual(run('ESCRIU 360/5').r.prints, ['72']);
  assert.equal(message('ESCRIU 360 / 0').line1, 'NO PUC DIVIDIR ENTRE ZERO');
});
