// Proves del capítol 9 tal com es publica: girar una figura i fer-ne el mirall.
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
const html = read('curs/capitol-9.html');
const sims = [...html.matchAll(/<div class="simulador"([^>]*)>([\s\S]*?)<\/div>/g)].map((m) => ({
  attrs: m[1],
  solutions: [...m[2].matchAll(/<script type="text\/logo">([\s\S]*?)<\/script>/g)].map((s) => s[1]),
  panel: ((m[2].match(/<script type="text\/logo-panell">([\s\S]*?)<\/script>/) || [])[1] || '').replace(/^\n+|\s+$/g, ''),
}));
const sim = (id) => sims.find((s) => s.attrs.includes(id));
const attr = (s, name) => (s.attrs.match(new RegExp(name + '="([^"]*)"')) || [])[1];
const inField = (segs) => segs.every((s) => [s.x1, s.x2].every((x) => x >= -140 && x < 140) && [s.y1, s.y2].every((y) => y >= -120 && y < 120));
const home = (pose) => comparePose(pose, { x: 0, y: 0, heading: 0 });
const BD = 'PROC BANDERA.D\n  AVANÇA 50 GIRA.D 90 AVANÇA 25 GIRA.D 90\n  AVANÇA 15 GIRA.D 90 AVANÇA 25 GIRA.E 90\n  AVANÇA 35 GIRA.D 180\nFI';
const swap = (s) => s.replace(/GIRA\.([DE])/g, (m, c) => 'GIRA.' + (c === 'D' ? 'E' : 'D'));
const ESC = 'REPETEIX 4 [AVANÇA 20 GIRA.D 90 AVANÇA 20 GIRA.E 90]';

test('capítol 9: 2 simuladors d\'exemple i 3 exercicis; decisions de la revisió 11', () => {
  assert.equal(sims.length, 5);
  const ex = sims.filter((s) => s.solutions.length > 0);
  assert.equal(ex.length, 3);
  for (const s of ex) {
    for (const code of s.solutions) { assert.ok(inField(drawing(code).segments)); assert.ok(code.trim().endsWith(attr(s, 'data-executa'))); }
    assert.ok(html.includes(`farà <code>${attr(s, 'data-executa')}</code>`));
  }
  for (const s of sims) if (s.panel) new Interpreter().defineAll(s.panel);
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
  assert.ok(!/\bentrad|\bcaps[ae]/i.test(text));
  assert.ok(!/mosaic|tessel/i.test(text), 'mosaics, al capítol de reptes (owner, G3)');
  assert.ok(!/polígon|assembl|\bpi\b|π/i.test(text));
  assert.ok(!/anys 80|1985|198\d/.test(text));
  for (const w of ['gir', 'eix de simetria', 'La translació, el gir i la simetria mouen una figura sense canviar-ne la forma ni la mida.']) assert.ok(text.includes(w), w);   // G2, opció A
  assert.ok(Math.max(...html.split('\n').filter((l) => /^(PROC |  [A-ZÀ-Ú]|FI$)/.test(l)).map((l) => l.length)) <= 52);
});

test('BANDERA.D torna on era; els molinets del text tanquen', () => {
  const b = runPanel(BD, 'BANDERA.D');
  assert.deepEqual(home(b.pose), { position: true, heading: true });
  assert.ok(html.includes(BD));
  const first = sims[0];
  for (const line of ['REPETEIX 6 [PÈTAL 1 GIRA.D 60]', 'REPETEIX 4 [BANDERA.D GIRA.D 90]', 'REPETEIX 8 [BANDERA.D GIRA.D 45]']) {
    assert.ok(html.includes(line), line);
    const d = runPanel(first.panel, line);
    assert.equal(d.error, null, line);
    assert.ok(inField(d.segments), line);
    assert.deepEqual(home(d.pose), { position: true, heading: true }, line);
  }
});

test('«Què dibuixarà?»: tres, quatre i tres amuntegades', () => {
  const block = html.match(/<div class="prediu"[\s\S]*?<\/div>/)[0];
  const opts = [...block.matchAll(/<script type="text\/logo"( data-correcta)?[^>]*>([\s\S]*?)<\/script>/g)].map((m) => ({ ok: !!m[1], d: drawing(m[2]) }));
  assert.equal(opts.length, 3);
  assert.deepEqual(opts.map((o) => o.ok), [true, false, false]);
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.equal(compareDrawings(opts[i].d.segments, opts[j].d.segments).ok, false);
});

test('«El molinet torçat»: a BANDERA.D li falta l\'última línia', () => {
  const bug = sim('cap9-error');
  assert.equal(attr(bug, 'data-executa'), 'MOLINET');
  const flag = runPanel(bug.panel, 'BANDERA.D');
  assert.ok(compareDrawings(flag.segments, runPanel(BD, 'BANDERA.D').segments).ok, 'una bandera sola es veu bé');
  assert.equal(home(flag.pose).position, false, 'però la tortuga no torna');
  const target = drawing(bug.solutions[0]).segments;
  assert.equal(compareDrawings(runPanel(bug.panel, 'MOLINET').segments, target).ok, false);
  const fixed = bug.panel.replace('AVANÇA 25 GIRA.E 90\nFI', 'AVANÇA 25 GIRA.E 90\n  AVANÇA 35 GIRA.D 180\nFI');
  assert.ok(compareDrawings(runPanel(fixed, 'MOLINET').segments, target).ok);
});

test('El mirall: l\'escala i «La bandera del mirall»', () => {
  assert.ok(html.includes(ESC) && html.includes(swap(ESC)));
  const right = drawing(ESC), left = drawing(swap(ESC));
  assert.ok(Math.abs(right.pose.x + left.pose.x) < 1e-6 && Math.abs(right.pose.y - left.pose.y) < 1e-6);   // simètriques respecte de l'eix vertical
  const ex = sim('cap9-mirall');
  assert.equal(ex.panel, BD);
  const target = drawing(ex.solutions[0]);
  assert.deepEqual(home(target.pose), { position: true, heading: true });
  const mirror = (segs) => segs.map((s) => ({ ...s, x1: -s.x1, x2: -s.x2 }));
  assert.ok(compareDrawings(target.segments, mirror(runPanel(BD, 'BANDERA.D').segments)).ok, 'BANDERA.E és el mirall de BANDERA.D');
  const naive = runPanel(BD.replaceAll('GIRA.D', 'GIRA.E').replace('PROC BANDERA.D', 'PROC BANDERA.E'), 'BANDERA.E');
  assert.equal(naive.error, null);
  assert.equal(compareDrawings(naive.segments, target.segments).ok, false, 'canviar només les D per E no fa el mirall');
  assert.equal(compareDrawings(runPanel(BD, 'GIRA.D 180 BANDERA.D').segments, target.segments).ok, false, 'el mirall no és un gir de 180');
});

test('«El molinet» (clau): MOLINET 5 amb BANDERA.D', () => {
  const ex = sim('cap9-molinet');
  assert.ok(ex.attrs.includes('data-clau') && ex.attrs.includes('dibuix+tortuga') && attr(ex, 'data-exigeix') === 'BANDERA.D');
  assert.equal(ex.panel, BD);
  const good = drawing(ex.solutions[0]);
  assert.ok(good.I.procUses('MOLINET', 'BANDERA.D'));
  assert.deepEqual(home(good.pose), { position: true, heading: true });
  const left = runPanel(BD + '\nPROC MOLINET :N\n  REPETEIX :N [BANDERA.D GIRA.E 360 / :N]\nFI', 'MOLINET 5');
  assert.ok(compareDrawings(left.segments, good.segments).ok, 'girant a l\'esquerra surt el mateix dibuix');
  const four = runPanel(BD + '\nPROC MOLINET :N\n  REPETEIX :N [BANDERA.D GIRA.D 90]\nFI', 'MOLINET 5');
  assert.equal(compareDrawings(four.segments, good.segments).ok, false);
});

test('pistes noves (owner, revisió 11)', () => {
  const m = (line, panel = '') => msg(runPanel(panel, line));
  assert.deepEqual(m('GIRA.I 90'), { line1: 'NO SÉ COM FER GIRA.I', hints: ["Volies dir GIRA.E? E d'esquerra."] });
  assert.deepEqual(m('GIRA 90').hints, ['Volies dir GIRA.D o GIRA.E?']);
  assert.deepEqual(m('GIRA.DRETA 90').hints, ['Volies dir GIRA.D?']);
  assert.deepEqual(m('GIRA.ESQUERRA 90').hints, ['Volies dir GIRA.E?']);
  assert.deepEqual(m('BANDERA D', BD), { line1: 'NO SÉ COM FER BANDERA D', hints: ["Volies dir BANDERA.D? S'escriu amb un punt i sense espai."] });
  assert.deepEqual(m('BANDERA.E', BD), { line1: 'NO SÉ COM FER BANDERA.E', hints: ["Si és un procediment teu, primer l'has de definir amb PROC … FI."] });   // cap pista cap a BANDERA.D; revisió 19 (E8): la general
  assert.deepEqual(m('BANDERA', BD).hints, ['Volies dir BANDERA.D?']);
  assert.deepEqual(m('NO LLAPIS'), { line1: 'NO SÉ COM FER NO LLAPIS', hints: ["Volies dir NO.LLAPIS? S'escriu amb un punt i sense espai."] });
});
