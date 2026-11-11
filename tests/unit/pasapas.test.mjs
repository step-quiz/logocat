// Proves del que necessita l'Editor lliure: pas a pas, panell de procediments.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Interpreter } from '../../js/logo/interpret.js';
import { describe } from '../../js/logo/missatges.js';

const PANEL = [
  'PROC QUADRAT :COSTAT',                           // línia 0 del panell
  '  REPETEIX 4 [AVANÇA :COSTAT GIRA.D 90]',        // 1
  'FI',                                             // 2
  '',                                               // 3
  'PROC ROSASSA',                                   // 4
  '  REPETEIX 12 [QUADRAT 50 GIRA.D 30]',           // 5
  'FI',                                             // 6
].join('\n');

function collect(I, line, type) {
  const out = [];
  for (const ev of I.runLine(line)) if (ev.type === type) out.push({ ...ev, info: I.stepInfo() });
  return out;
}

test('el panell: cada procediment sap a quines línies és', () => {
  const I = new Interpreter();
  I.defineAll(PANEL);
  assert.deepEqual(I.procs.get('QUADRAT').span, [0, 2]);
  assert.deepEqual(I.procs.get('ROSASSA').span, [4, 6]);
  assert.deepEqual(I.procs.get('ROSASSA').lineNos, [5]);
});

test('abans de cada acció: quina instrucció és, on és i què val cada entrada', () => {
  const I = new Interpreter();
  I.defineAll(PANEL);
  const evs = collect(I, 'ROSASSA', 'before');
  assert.equal(evs.length, 12 * 9);                          // 12 × (8 accions del quadrat + 1 gir)
  const first = evs[0];
  assert.equal(first.text, 'AVANÇA :COSTAT');
  assert.equal(first.panelLine, 1);
  assert.equal(PANEL.split('\n')[1].slice(first.from, first.to), 'AVANÇA :COSTAT');
  assert.equal(first.info.path, 'ROSASSA, volta 1 de 12 → QUADRAT, volta 1 de 4');
  assert.deepEqual(first.info.values, [':COSTAT = 50']);
  // La crida QUADRAT 50 queda assenyalada a la línia de ROSASSA.
  assert.equal(first.callers.length, 1);
  assert.equal(first.callers[0].panelLine, 5);
  assert.equal(PANEL.split('\n')[5].slice(first.callers[0].from, first.callers[0].to), 'QUADRAT 50');
  // La maqueta: tercer quadrat, tercer costat.
  const third = evs[2 * 9 + 4];
  assert.equal(third.text, 'AVANÇA :COSTAT');
  assert.equal(third.info.path, 'ROSASSA, volta 3 de 12 → QUADRAT, volta 3 de 4');
  // El gir de ROSASSA, fora de QUADRAT.
  const turn = evs[8];
  assert.equal(turn.text, 'GIRA.D 30');
  assert.equal(turn.panelLine, 5);
  assert.equal(turn.info.path, 'ROSASSA, volta 1 de 12');
  assert.deepEqual(turn.info.values, []);
});

test('pas a pas d\'una línia escrita a «?»', () => {
  const I = new Interpreter();
  const evs = collect(I, 'REPETEIX 2 [AVANÇA 10 GIRA.D 90]', 'before');
  assert.deepEqual(evs.map((e) => e.text), ['AVANÇA 10', 'GIRA.D 90', 'AVANÇA 10', 'GIRA.D 90']);
  assert.equal(evs[0].panelLine, null);
  assert.equal(evs[2].info.path, 'volta 2 de 2');
});

test('els errors dins del panell diuen la línia del procediment i la del panell', () => {
  const I = new Interpreter();
  I.defineAll('PROC A\n  AVANÇA 10\nFI\n\nPROC B\n\n  AVANSA 10\nFI');
  const r = I.runSync('B');
  assert.equal(describe(r.error, I.knownWords()).line1, 'NO SÉ COM FER AVANSA A LA LÍNIA 3 DEL PROCEDIMENT \'B\'');
  assert.equal(r.error.where.panelLine, 6);
});

test('errors del panell: FALTA FI, SOBRA FI, nom d\'una ordre', () => {
  const I = new Interpreter();
  const code = (text) => { try { I.defineAll(text); return null; } catch (e) { return e.code; } };
  assert.equal(code('PROC A\nAVANÇA 1'), 'missing_fi');
  assert.equal(code('AVANÇA 1'), 'outside_proc');
  assert.equal(code('FI'), 'stray_fi');
  assert.equal(code('PROC AVANÇA\nFI'), 'is_primitive');
  assert.equal(code(PANEL), null);
});

test('definir a «?» i OBLIDA.PROC avisen el panell', () => {
  const I = new Interpreter();
  const defined = [];
  for (const line of ['PROC TRI', 'REPETEIX 3 [AVANÇA 30 GIRA.D 120]', 'FI']) {
    for (const ev of I.runLine(line)) if (ev.type === 'defined') defined.push(ev);
  }
  assert.equal(defined.length, 1);
  assert.equal(defined[0].source, 'PROC TRI\n  REPETEIX 3 [AVANÇA 30 GIRA.D 120]\nFI');
  I.defineAll(defined[0].source);
  const forget = collect(I, 'OBLIDA.PROC "TRI', 'forget');
  assert.deepEqual(forget[0].span, [0, 2]);
  assert.equal(I.procs.has('TRI'), false);
});
