// Revisió 18 (revisió final, owner 2026-11-12): errors del motor, missatges nous i canvis de les pàgines.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Interpreter } from '../../js/logo/interpret.js';
import { describe } from '../../js/logo/missatges.js';
import { compareDrawings } from '../../js/logo/compara.js';

const read = (f) => readFileSync(new URL('../../' + f, import.meta.url), 'utf8');
const Q = 'PROC QUADRAT :C\n  REPETEIX 4 [AVANÇA :C GIRA.D 90]\nFI';
function run(line, panel = Q) {
  const I = new Interpreter({ rng: () => 0.5 });
  if (panel) I.defineAll(panel);
  const r = I.runSync(line);
  return { I, r, segments: I.turtle.segments, msg: r.error ? describe(r.error, I.knownWords()) : null };
}
const msg = (line, panel) => run(line, panel).msg;

test('B1: ordres sense claudàtors: cap traç, i el missatge diu on van els claudàtors', () => {
  for (const [line, hint] of [
    ['REPETEIX 4 AVANÇA 50 GIRA.D 90', 'REPETEIX 4 [AVANÇA 50 GIRA.D 90]'],
    ['repeteix 4 avança 50', 'REPETEIX 4 [AVANÇA 50]'],
    ['REPETEIX 4 (AVANÇA 50 GIRA.D 90)', 'REPETEIX 4 [AVANÇA 50 GIRA.D 90]'],
    ['REPETEIX 4 QUADRAT 20', 'REPETEIX 4 [QUADRAT 20]'],
    ['REPETEIX 2 [REPETEIX 4 AVANÇA 10 GIRA.D 90]', 'REPETEIX 4 [AVANÇA 10 GIRA.D 90]'],
  ]) {
    const d = run(line);
    assert.equal(d.segments.length, 0, line + ': no dibuixa res');
    assert.deepEqual(d.msg, { line1: 'REPETEIX NECESSITA SABER QUÈ HA DE REPETIR', hints: ['Posa les ordres entre claudàtors: ' + hint] }, line);
  }
  assert.deepEqual(msg('SI 3 > 2 AVANÇA 50'), { line1: 'SI NECESSITA UNA LLISTA', hints: ['Posa les ordres entre claudàtors: SI 3 > 2 [AVANÇA 50]'] });
  assert.deepEqual(msg('REPETEIX 4 {AVANÇA 50 GIRA.D 90}'), { line1: 'NO SÉ COM FER {AVANÇA', hints: ['Els claudàtors són [ i ], no { i }'] });
  // Els missatges d'abans no canvien.
  assert.deepEqual(msg('REPETEIX 4'), { line1: 'REPETEIX NECESSITA SABER QUÈ HA DE REPETIR', hints: ['Per exemple: REPETEIX 4 [AVANÇA 50 GIRA.D 90]'] });
  assert.equal(msg('SI 3 ≥ 5 [AVANÇA 50]').hints[0], 'LOGO només coneix els signes <, > i =');
  assert.equal(msg('REPETEIX 4 AVANSA 50').line1, 'NO SÉ COM FER AVANSA');
  assert.equal(run('REPETEIX 4 [AVANÇA 50 GIRA.D 90]').r.error, null);
});

test('B2: dos PROC amb el mateix nom al panell', () => {
  const I = new Interpreter();
  assert.throws(() => I.defineAll(Q + '\n\n' + Q.replace('AVANÇA :C', 'AVANÇA 20')), (e) => {
    assert.deepEqual(describe(e, []), { line1: 'QUADRAT JA ESTÀ DEFINIT', hints: ["Hi ha dos PROC QUADRAT al panell: esborra'n un."] });
    return true;
  });
});

test('B4: COLOR 2, FONS 1 i ORIENTACIÓ 90', () => {
  assert.deepEqual(msg('COLOR 2'), { line1: 'NO SÉ QUÈ FER AMB 1', hints: ['Per canviar el color del llapis: FES.COLOR 2'] });
  assert.deepEqual(msg('FONS 1'), { line1: 'NO SÉ QUÈ FER AMB 0', hints: ['Per canviar el color de la pantalla: FES.FONS 1'] });
  assert.deepEqual(msg('ORIENTACIÓ 90'), { line1: 'NO SÉ QUÈ FER AMB 0', hints: ['Per canviar cap on mira la tortuga: FES.ORIENTACIÓ 90'] });
  assert.equal(msg('GIRA.D 90 90').hints[0], 'Escriu una ordre, com per exemple AVANÇA 50');
});

test('B5: nombres molt grans', () => {
  const big = run('REPETEIX 1000000000 []');
  assert.equal(big.r.error.code, 'limit');
  const far = run('AVANÇA 99999999');
  assert.equal(far.r.error, null);
  assert.ok(far.segments.length <= 500, 'com a molt 500 traços');
  assert.deepEqual(far.I.turtle.pose(), { x: 0, y: -81, heading: 0 });   // (99999999 + 120) mod 240 − 120
  assert.deepEqual(run('AVANÇA 1000').I.turtle.pose(), { x: 0, y: 40, heading: 0 });
  // Un dibuix repassat moltes vegades es compara de pressa, i el traç repassat compta una vegada.
  const many = run('REPETEIX 1000 [QUADRAT 50]').segments, one = run('QUADRAT 50').segments;
  const t0 = Date.now();
  assert.ok(compareDrawings(many, one).ok);
  assert.ok(Date.now() - t0 < 1000, 'menys d\'un segon');
  // La goma continua manant: un traç esborrat i tornat a fer hi és; esborrat al final, no.
  const back = run('AVANÇA 50 GOMA RECULA 50 LLAPIS AVANÇA 50', '').segments;
  assert.ok(compareDrawings(back, run('AVANÇA 50', '').segments).ok);
  const gone = run('AVANÇA 50 RECULA 50 GOMA AVANÇA 50', '').segments;
  assert.equal(compareDrawings(gone, run('AVANÇA 50', '').segments).ok, false);
});

test('P4 i P5: pistes noves', () => {
  for (const [line, hint] of [
    ['AVANÇA50', 'Falta un espai entre AVANÇA i 50: AVANÇA 50'],
    ['GIRA.D90', 'Falta un espai entre GIRA.D i 90: GIRA.D 90'],
    ['REPETEIX4 [AVANÇA 10]', 'Falta un espai entre REPETEIX i 4: REPETEIX 4'],
    ['AVANCA50', 'Falta un espai entre AVANÇA i 50: AVANÇA 50'],
    ['QUADRAT50', 'Falta un espai entre QUADRAT i 50: QUADRAT 50'],
    ['AVANÇA 50, GIRA.D 90', 'Les ordres se separen amb un espai, sense comes.'],
    ['AVANÇA 50; GIRA.D 90', 'Les ordres se separen amb un espai, sense comes.'],
    ['FES.COLOR VERD', 'Els colors van del 0 al 5'],
    ['DRETA 90', 'Volies dir GIRA.D?'], ['ESQUERRA 90', 'Volies dir GIRA.E?'], ['ENDAVANT 50', 'Volies dir AVANÇA?'],
    ['ENRERE 50', 'Volies dir RECULA?'], ['ENDARRERE 50', 'Volies dir RECULA?'], ['ESBORRA', 'Volies dir INI.DIB?'], ['NETEJA', 'Volies dir INI.DIB?'],
  ]) assert.deepEqual(msg(line).hints, [hint], line);
  assert.deepEqual(msg('AVANÇA 0,5').hints, ["Els decimals s'escriuen amb punt: 0.5"]);
  assert.deepEqual(msg('AVANCA 50').hints, ['Volies dir AVANÇA?']);
});

test('U4: les cometes tipogràfiques de les tauletes valen com a "', () => {
  for (const line of ['POSA.A “X 5 ESCRIU :X', 'POSA.A «X» 5 ESCRIU :X', 'POSA.A "X 5 ESCRIU :X']) assert.deepEqual(run(line, '').r.prints, ['5'], line);
});

test('P2: l\'estrella del capítol 7 té tres variables', () => {
  const html = read('curs/capitol-7.html');
  assert.ok(html.includes('data-executa="ESTRELLA 7 3 60"'));
  assert.ok(html.includes("Defineix <code>ESTRELLA</code> amb tres variables: primer el nombre de puntes, després el nombre de voltes i després la mida del costat."));
  const sols = [...html.match(/data-id="cap7-estrella"[\s\S]*?<\/div>/)[0].matchAll(/<script type="text\/logo">\n([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const target = run(sols[0], '').segments;
  const mine = run('ESTRELLA 7 3 60', 'PROC ESTRELLA :N :VOLTES :COSTAT\n  REPETEIX :N [AVANÇA :COSTAT GIRA.D 360 * :VOLTES / :N]\nFI').segments;
  assert.ok(compareDrawings(mine, target).ok);
  assert.ok(target.every((s) => [s.x1, s.x2].every((x) => x >= -140 && x < 140) && [s.y1, s.y2].every((y) => y >= -120 && y < 120)));
  // La del text (dues variables, costats de 80) no té les tres variables: «Comprova» ho diu.
  const shown = new Interpreter(); shown.defineAll('PROC ESTRELLA :N :VOLTES\n  REPETEIX :N [AVANÇA 80 GIRA.D 360 * :VOLTES / :N]\nFI');
  assert.equal(shown.procs.get('ESTRELLA').inputs.length, 2);
});

test('P3, U1, U2, U3, M2, M3 i C1: pàgines', () => {
  assert.ok(read('curs/capitol-7.html').includes('<p><a href="reptes-1.html">Ja pots fer els reptes del nivell 1 →</a></p>'));
  assert.ok(read('curs/capitol-9.html').includes('<p><a href="reptes-2.html">Ja pots fer els reptes del nivell 2 →</a></p>'));
  for (const n of [1, 2, 3]) assert.ok(read(`curs/reptes-${n}.html`).includes(`<span class="barra-titol">Nivell ${n}</span>`));
  const ed = read('simulador.html');
  for (const id of ['b-desa', 'b-obre', 'b-dibuix', 'fitxer']) assert.ok(ed.includes(`id="${id}"`), id);
  assert.ok(ed.includes('<label for="velocitat" class="etq">Velocitat:</label>'));
  assert.equal((ed.match(/<span class="etq">/g) || []).length, 3);
  for (const f of ['index.html', 'glossari.html', '404.html']) assert.ok(read(f).includes('id="boto-tema"'), f);
  const idx = read('index.html');
  assert.ok(!/class="versio"[^>]*aria-label/.test(idx));
  // Cada capítol de la portada porta l'id del seu exercici clau.
  for (let n = 1; n <= 12; n++) {
    const clau = read(`curs/capitol-${n}.html`).match(/data-id="([^"]+)" data-clau/)[1];
    assert.ok(idx.includes(`href="curs/capitol-${n}.html" data-clau="${clau}"`), 'capítol ' + n);
  }
});
