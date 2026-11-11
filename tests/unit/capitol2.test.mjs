// Proves del capítol 2 tal com es publica.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Interpreter } from '../../js/logo/interpret.js';
import { compareDrawings, comparePose } from '../../js/logo/compara.js';

function drawing(code) {
  const I = new Interpreter({ rng: () => 0.5 });
  const r = I.runSync(code);
  assert.equal(r.error, null, 'ha de funcionar: ' + code);
  return { segments: I.turtle.segments, pose: I.turtle.pose() };
}
const html = readFileSync(new URL('../../curs/capitol-2.html', import.meta.url), 'utf8');
const sims = [...html.matchAll(/<div class="simulador"([^>]*)>([\s\S]*?)<\/div>/g)].map((m) => ({
  attrs: m[1], solutions: [...m[2].matchAll(/<script type="text\/logo">([\s\S]*?)<\/script>/g)].map((s) => s[1]),
}));
const sim = (id) => sims.find((s) => s.attrs.includes(id));

test('capítol 2: 4 simuladors lliures, 3 exercicis, i les solucions funcionen', () => {
  assert.equal(sims.filter((s) => s.solutions.length === 0).length, 4);
  assert.equal(sims.filter((s) => s.solutions.length > 0).length, 3);
  for (const s of sims) for (const code of s.solutions) drawing(code);
});

test('capítol 2: «El rectangle» fa 60 d\'ample i 30 d\'alt, exigeix REPETEIX i l\'estat final', () => {
  const ex = sim('cap2-rectangle');
  assert.ok(ex.attrs.includes('data-exigeix="REPETEIX"') && ex.attrs.includes('dibuix+tortuga'));
  const t = drawing(ex.solutions[0]);
  assert.ok(compareDrawings(drawing('AVANÇA 30 GIRA.D 90 AVANÇA 60 GIRA.D 90 AVANÇA 30 GIRA.D 90 AVANÇA 60 GIRA.D 90').segments, t.segments).ok);
  assert.equal(compareDrawings(drawing('REPETEIX 2 [AVANÇA 60 GIRA.D 90 AVANÇA 30 GIRA.D 90]').segments, t.segments).ok, false);
  assert.deepEqual(comparePose(t.pose, { x: 0, y: 0, heading: 0 }), { position: true, heading: true });
});

test('capítol 2: «Troba l\'error» — la línia donada falla i la corregida passa', () => {
  const ex = sim('cap2-error');
  const given = ex.attrs.match(/data-ordre="([^"]*)"/)[1];
  const t = drawing(ex.solutions[0]);
  assert.equal(compareDrawings(drawing(given).segments, t.segments).ok, false);
  assert.ok(compareDrawings(drawing(given.replace('GIRA.D 60', 'GIRA.D 90')).segments, t.segments).ok);
});

test('capítol 2: «L\'escala llarga» és l\'exercici clau i té 5 graons de 20', () => {
  const ex = sim('cap2-escala');
  assert.ok(ex.attrs.includes('data-clau') && ex.attrs.includes('data-exigeix="REPETEIX"'));
  const t = drawing(ex.solutions[0]);
  assert.equal(t.segments.length, 10);
  assert.ok(Math.abs(t.pose.x - 100) < 1e-6 && Math.abs(t.pose.y - 100) < 1e-6);
});

test('capítol 2: «Què dibuixarà?» i el qüestionari', () => {
  const block = html.match(/<div class="prediu"[\s\S]*?<\/div>/)[0];
  const shown = block.match(/<pre class="codi">([\s\S]*?)<\/pre>/)[1];
  const opts = [...block.matchAll(/<script type="text\/logo"([^>]*)>([\s\S]*?)<\/script>/g)];
  assert.equal(opts.filter((o) => o[1].includes('data-correcta')).length, 1);
  for (const o of opts) {
    assert.equal(compareDrawings(drawing(o[2]).segments, drawing(shown).segments).ok, o[1].includes('data-correcta'));
  }
  const qs = [...html.matchAll(/<fieldset class="pregunta" data-correcta="(\d)">([\s\S]*?)<\/fieldset>/g)];
  assert.deepEqual(qs.map((q) => Number(q[1])), [2, 1, 1]);
});
