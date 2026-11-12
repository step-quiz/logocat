// Revisió 19 (owner, 2026-11-12): pistes dels exercicis dels capítols, més pistes per a errors freqüents, textos nous.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Interpreter } from '../../js/logo/interpret.js';
import { describe } from '../../js/logo/missatges.js';
import { HINTS } from './pistes19.data.mjs';

const read = (f) => readFileSync(new URL('../../' + f, import.meta.url), 'utf8');
const OWN = "Si és un procediment teu, primer l'has de definir amb PROC … FI.";
function msg(line, panel = '') {
  const I = new Interpreter({ rng: () => 0.5 });
  try { if (panel) I.defineAll(panel); } catch (e) { return describe(e, I.knownWords()); }
  const r = I.runSync(line);
  return r.error ? describe(r.error, I.knownWords()) : null;
}

test('A1–A34: cada exercici dels capítols té les dues pistes aprovades, just després del simulador', () => {
  const fix = (h) => h.replace(/<code>([\s\S]*?)<\/code>/g, (m, c) => '<code>' + c.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code>');
  assert.equal(HINTS.length, 34);
  for (const [id, cap, , p1, p2] of HINTS) {
    const html = read(`curs/capitol-${cap}.html`);
    const at = html.indexOf(`data-id="${id}"`);
    assert.ok(at > 0, id);
    const after = html.slice(html.indexOf('</div>', at) + 6);
    assert.ok(after.startsWith(`\n    <div class="pistes">\n      <p>${fix(p1)}</p>\n      <p>${fix(p2)}</p>\n    </div>`), id);
  }
  // Cap exercici sense pistes, ni als capítols ni als reptes.
  for (let n = 1; n <= 12; n++) {
    const html = read(`curs/capitol-${n}.html`);
    const ex = [...html.matchAll(/<div class="simulador" data-id="[^"]+"[^>]*>([\s\S]*?)<\/div>/g)].filter((m) => m[1].includes('type="text/logo"')).length;
    assert.equal((html.match(/class="pistes"/g) || []).length, ex, 'capítol ' + n);
  }
});

test('E1–E3: paraules en anglès, en castellà i altres maneres de dir-ho', () => {
  for (const [words, w] of [['FD FORWARD ADELANTE', 'AVANÇA'], ['BK BACK ATRAS ATRÁS RETROCEDE', 'RECULA'], ['RT RIGHT DERECHA GIRA.DERECHA', 'GIRA.D'],
    ['LT LEFT IZQUIERDA GIRA.IZQUIERDA', 'GIRA.E'], ['REPEAT REPITE', 'REPETEIX'], ['CS CLEARSCREEN BORRAR LIMPIAR ESBORRA.TOT', 'INI.DIB'],
    ['PU PENUP SUBE.LAPIZ AIXECA AIXECA.LLAPIS PUJA.LLAPIS', 'NO.LLAPIS'], ['PD PENDOWN BAJA.LAPIZ BAIXA.LLAPIS', 'LLAPIS'],
    ['HT HIDETURTLE AMAGA AMAGA.TORTUGA', 'DESAPAREIX'], ['ST SHOWTURTLE MOSTRA.TORTUGA', 'APAREIX'], ['HOME CENTRO', 'CENTRE'],
    ['PRINT', 'ESCRIU'], ['TO', 'PROC'], ['END FIN', 'FI'], ['RANDOM AZAR', 'ATZAR']]) {
    for (const x of words.split(' ')) assert.deepEqual(msg(x), { line1: 'NO SÉ COM FER ' + x, hints: [`Volies dir ${w}?`] }, x);
  }
});

test('E4–E8', () => {
  assert.deepEqual(msg('AVANÇA 5O').hints, ['Volies dir 50? Hi has escrit la lletra O en lloc del zero.']);
  assert.deepEqual(msg('AVANÇA l0').hints, ["Volies dir 10? Hi has escrit la lletra L en lloc de l'u."]);
  assert.deepEqual(msg('AVANÇA 50.').hints, ['Volies dir 50? Els nombres no acaben amb punt.']);
  assert.deepEqual(msg('REPETEIX 4 [AVANÇA 50] [GIRA.D 90]'),
    { line1: 'NO SÉ QUÈ FER AMB [GIRA.D 90]', hints: ['REPETEIX només repeteix una llista: posa totes les ordres dins dels mateixos claudàtors.'] });
  assert.deepEqual(msg('AVANÇA 50 [GIRA.D 90]').hints, ['Escriu una ordre, com per exemple AVANÇA 50']);
  assert.deepEqual(msg('X', 'PROC CASA GRAN\n  AVANÇA 10\nFI'), { line1: 'LES VARIABLES DE PROC PORTEN DOS PUNTS',
    hints: ['Per exemple: PROC QUADRAT :COSTAT', 'Si GRAN és part del nom, ha de ser una sola paraula: PROC CASA.GRAN'] });
  // Si GRAN es fa servir com a :GRAN, és una variable sense els dos punts: només la pista de sempre.
  assert.deepEqual(msg('X', 'PROC QUADRAT COSTAT\n  REPETEIX 4 [AVANÇA :COSTAT GIRA.D 90]\nFI').hints, ['Per exemple: PROC QUADRAT :COSTAT']);
  assert.deepEqual(msg('ESCRIU HOLA').hints, ['Per escriure una paraula, posa-hi cometes al davant: ESCRIU "HOLA']);
  assert.deepEqual(msg('ESCRIU ALEATORI 6').hints, ['Volies dir ATZAR?']);
  assert.deepEqual(msg('CERCLE 1'), { line1: 'NO SÉ COM FER CERCLE', hints: [OWN] });
});

test('T1, T2 i T4', () => {
  assert.ok(read('js/ui/panell.js').includes("'Segur que vols tornar a començar? Pensa que es perdrà tot el que has escrit al panell.'"));
  assert.ok(read('js/ui/editor.js').includes("'Segur que vols canviar els procediments que hi ha al panell pels que hi ha al fitxer? Pensa que perdràs el que tens ara escrit.'"));
  assert.ok(read('js/ui/tecles.js').includes(`const KEYS = ['[', ']', '(', ')', ':', '.', '"', '+', '-', '*', '/', '=', '<', '>'];`));
});
