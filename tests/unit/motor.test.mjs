// Proves del motor: tokenitzador, intèrpret, tortuga i missatges.
// S'executen amb:  node --test tests/unit/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize } from '../../js/logo/lexer.js';
import { Interpreter } from '../../js/logo/interpret.js';
import { describe } from '../../js/logo/missatges.js';

function run(text, I = new Interpreter({ rng: () => 0.5 })) {
  const r = I.runSync(text);
  const msg = r.error ? describe(r.error, I.knownWords()) : null;
  return { I, T: I.turtle, ...r, msg };
}
const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) < tol, `${a} ≉ ${b}`);

test('tokenitzador: majúscules, accents i punts', () => {
  const t = tokenize('avança 50 gira.d 90');
  assert.deepEqual(t.map((x) => x.v), ['AVANÇA', 50, 'GIRA.D', 90]);
});

test('tokenitzador: el menys unari i el binari', () => {
  const kinds = (s) => tokenize(s).filter((x) => x.t === 'op').map((x) => !!x.unary);
  assert.deepEqual(kinds('AVANÇA -50'), [true]);
  assert.deepEqual(kinds('ESCRIU 7 - 2'), [false]);
  assert.deepEqual(kinds('ESCRIU 7-2'), [false]);
  assert.deepEqual(kinds('FES.XY -20 30'), [true]);
});

test('les sis ordres del capítol 1', () => {
  let r = run('AVANÇA 50');
  near(r.T.y, 50); near(r.T.x, 0); assert.equal(r.T.segments.length, 1);
  r = run('GIRA.D 90\nAVANÇA 30');
  near(r.T.x, 30); near(r.T.y, 0); assert.equal(r.T.heading, 90);
  r = run('GIRA.E 90\nAVANÇA 30');
  near(r.T.x, -30); assert.equal(r.T.heading, 270);
  r = run('RECULA 20');
  near(r.T.y, -20); assert.equal(r.T.heading, 0);
  r = run('AVANÇA 50 GIRA.D 45\nINI.DIB');
  assert.equal(r.T.segments.length, 0); near(r.T.y, 0); assert.equal(r.T.heading, 0);
});

test('CENTRE no dibuixa mai, encara que el llapis sigui a baix', () => {
  const r = run('AVANÇA 50 GIRA.D 90 AVANÇA 40\nCENTRE');
  assert.equal(r.T.segments.length, 2);
  near(r.T.x, 0); near(r.T.y, 0); assert.equal(r.T.heading, 0);
});

test('INI.DIB no canvia el llapis ni el color', () => {
  const r = run('NO.LLAPIS FES.COLOR 3\nINI.DIB');
  assert.equal(r.T.pen, 'up'); assert.equal(r.T.color, 3);
});

test('mode cíclic: AVANÇA 500 acaba a y = 20, com al manual', () => {
  const r = run('AVANÇA 500');
  near(r.T.y, 20); near(r.T.x, 0);
  assert.equal(r.T.segments.length, 3);
});

test('mode cíclic en diagonal i cap enrere', () => {
  let r = run('GIRA.D 90 AVANÇA 300');
  near(r.T.x, 20); near(r.T.y, 0);
  r = run('RECULA 130');
  near(r.T.y, 110);
});

test('mode barrera i mode finestra', () => {
  let r = run('M.BARRERA\nAVANÇA 500');
  assert.equal(r.msg.line1, 'LA TORTUGA NO POT SORTIR DE LA PANTALLA');
  assert.deepEqual(r.msg.hints, ['Estàs en mode barrera.', 'Si vols suprimir el mode barrera, fes servir M.CÍCLIC']);
  near(r.T.y, 0);
  r = run('M.FINESTRA\nAVANÇA 500');
  near(r.T.y, 500);
});

test('els tres missatges del primer dia', () => {
  let r = run('AVANCA 50');
  assert.equal(r.msg.line1, 'NO SÉ COM FER AVANCA');
  assert.deepEqual(r.msg.hints, ['Volies dir AVANÇA?']);
  r = run('AVANÇA');
  assert.equal(r.msg.line1, 'AVANÇA NECESSITA UN NOMBRE');
  assert.deepEqual(r.msg.hints, ['Per exemple: AVANÇA 50']);
  r = run('50');
  assert.equal(r.msg.line1, 'NO SÉ QUÈ FER AMB 50');
  assert.deepEqual(r.msg.hints, ['Escriu una ordre, com per exemple AVANÇA 50']);
});

test('pistes «Volies dir…?»', () => {
  assert.deepEqual(run('GIRAD 90').msg.hints, ['Volies dir GIRA.D?']);
  assert.deepEqual(run('AVANSA 10').msg.hints, ['Volies dir AVANÇA?']);
  assert.deepEqual(run('FES.ORIENTACIO 90').msg.hints, ['Volies dir FES.ORIENTACIÓ?']);
  assert.deepEqual(run('XYZZY').msg.hints, []);
});

test('errors d\'escriptura', () => {
  assert.equal(run('REPETEIX 4 [AVANÇA 50').msg.line1, 'FALTA TANCAR UN CLAUDÀTOR');
  assert.equal(run('AVANÇA 50]').msg.line1, 'SOBRA UN CLAUDÀTOR');
  let r = run('AVANÇA [50]');
  assert.equal(r.msg.line1, 'A AVANÇA NO LI AGRADA [50]');
  assert.deepEqual(r.msg.hints, ['AVANÇA vol un nombre, sense claudàtor']);
  assert.equal(run('ESCRIU 3 / 0').msg.line1, 'NO PUC DIVIDIR ENTRE ZERO');
  r = run('AVANÇA 3,5');
  assert.equal(r.msg.line1, 'NO ENTENC 3,5');
  assert.deepEqual(r.msg.hints, ['Els decimals s\'escriuen amb punt: 3.5']);
});

test('nombres negatius: funcionen i avisen', () => {
  const r = run('AVANÇA -50');
  near(r.T.y, -50);
  assert.deepEqual(r.notes, ['AVANÇA -50 és el mateix que RECULA 50']);
  assert.deepEqual(run('GIRA.D -90').notes, ['GIRA.D -90 és el mateix que GIRA.E 90']);
});

test('operacions i precedència', () => {
  assert.deepEqual(run('ESCRIU 2 + 3 * 4').prints, ['14']);
  assert.deepEqual(run('ESCRIU (2 + 3) * 4').prints, ['20']);
  assert.deepEqual(run('ESCRIU 7 / 2').prints, ['3.5']);
  assert.deepEqual(run('ESCRIU 90').prints, ['90']);
  assert.deepEqual(run('ESCRIU ARREL2 (60 * 60 + 80 * 80)').prints, ['100']);
  assert.deepEqual(run('ESCRIU 3 > 2').prints, ['CERT']);
  assert.deepEqual(run('ESCRIU QUOCIENT 7 2 ESCRIU RESTA.DIV 7 2').prints, ['3', '1']);
  assert.equal(run('GIRA.D 360 / 5').T.heading, 72);
  assert.deepEqual(run('ESCRIU [HOLA A TOTHOM]\nMOSTRA [A B]').prints, ['HOLA A TOTHOM', '[A B]']);
});

test('REPETEIX i SI', () => {
  const r = run('REPETEIX 4 [AVANÇA 50 GIRA.D 90]');
  assert.equal(r.T.segments.length, 4); near(r.T.x, 0); near(r.T.y, 0); assert.equal(r.T.heading, 0);
  assert.deepEqual(run('SI 3 > 2 [ESCRIU 1] [ESCRIU 2]\nSI 3 < 2 [ESCRIU 1] [ESCRIU 2]').prints, ['1', '2']);
  assert.equal(run('REPETEIX 4').msg.line1, 'REPETEIX NECESSITA SABER QUÈ HA DE REPETIR');
  assert.deepEqual(run('REPETEIX 4').msg.hints, ['Per exemple: REPETEIX 4 [AVANÇA 50 GIRA.D 90]']);
});

test('procediments: definir a «?», entrades i missatges', () => {
  const r = run('PROC QUADRAT :COSTAT\nREPETEIX 4 [AVANÇA :COSTAT GIRA.D 90]\nFI\nQUADRAT 30');
  assert.deepEqual(r.prints, ['QUADRAT DEFINIT']);
  assert.equal(r.T.segments.length, 4);
  let e = run('QUADRAT', r.I);
  assert.equal(e.msg.line1, 'EL PROCEDIMENT \'QUADRAT\' NECESSITA 1 VALOR');
  assert.deepEqual(e.msg.hints, ['Per exemple: QUADRAT 50']);
  e = run('PROC QUADRAT', r.I);
  assert.equal(e.msg.line1, 'QUADRAT JA ESTÀ DEFINIT');
  assert.equal(run('PROC AVANÇA').msg.line1, 'AVANÇA ÉS UNA ORDRE DE LOGO');
  assert.equal(run('PROC X\nAVANÇA 5').msg.line1, 'FALTA FI');
  assert.equal(run('FI').msg.line1, 'SOBRA FI');
});

test('errors dins d\'un procediment: diuen la línia', () => {
  const r = run('PROC QUADRAT\nAVANSA 50\nFI\nQUADRAT');
  assert.equal(r.msg.line1, 'NO SÉ COM FER AVANSA A LA LÍNIA 2 DEL PROCEDIMENT \'QUADRAT\'');
  assert.deepEqual(r.msg.hints, ['Volies dir AVANÇA?']);
});

test('variables, RETORNA i ACABA', () => {
  assert.deepEqual(run('POSA.A "N 5\nESCRIU :N * 2').prints, ['10']);
  assert.equal(run('ESCRIU :COSTAT').msg.line1, ':COSTAT NO TÉ CAP VALOR');
  assert.equal(run('ACABA').msg.line1, 'ACABA NOMÉS ES POT FER DINS D\'UN PROCEDIMENT');
  assert.deepEqual(run('PROC DOBLE :N\nRETORNA :N * 2\nFI\nESCRIU DOBLE 21').prints, ['DOBLE DEFINIT', '42']);
  const r = run('PROC Q\nAVANÇA 5\nFI\nESCRIU Q');
  assert.equal(r.msg.line1, 'Q NO HA RETORNAT RES');
});

test('recursivitat amb regla d\'aturada, i límits', () => {
  const r = run('PROC ESPIRAL :C\nSI :C > 30 [ACABA]\nAVANÇA :C\nGIRA.D 90\nESPIRAL :C + 5\nFI\nESPIRAL 5');
  assert.equal(r.error, null); assert.equal(r.T.segments.length, 6);
  const e = run('PROC BUCLE\nBUCLE\nFI\nBUCLE');
  assert.equal(e.msg.line1, 'ATURADA!');
  assert.deepEqual(e.msg.hints, ['Hem hagut d\'aturar el programa perquè sembla que no acaba mai. Revisa les teves ordres.']);
});

test('ATZAR amb generador fixat i espai de treball', () => {
  assert.deepEqual(run('ESCRIU ATZAR 6').prints, ['3']);
  const r = run('PROC A\nAVANÇA 1\nFI\nN.PROCS?\nOBLIDA.PROC "A\nA');
  assert.deepEqual(r.prints, ['A DEFINIT', 'PROC A']);
  assert.equal(r.msg.line1, 'NO SÉ COM FER A');
});

test('desfer: snapshot i restore', () => {
  const I = new Interpreter();
  I.runSync('AVANÇA 50');
  const snap = I.snapshot();
  I.runSync('GIRA.D 90 AVANÇA 30');
  I.restore(snap);
  assert.equal(I.turtle.segments.length, 1); near(I.turtle.y, 50); assert.equal(I.turtle.heading, 0);
});
