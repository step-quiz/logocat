// Reptes (revisió 17): tres nivells de tres reptes, amb quadrícula, dues pistes i comprovació del dibuix.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Interpreter } from '../../js/logo/interpret.js';
import { compareDrawings } from '../../js/logo/compara.js';

const read = (f) => readFileSync(new URL('../../' + f, import.meta.url), 'utf8');
const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const inField = (segs) => segs.every((s) => [s.x1, s.x2].every((x) => x >= -140 && x < 140) && [s.y1, s.y2].every((y) => y >= -120 && y < 120));
function run(panel, line) {
  const I = new Interpreter({ rng: () => 0.5 });
  if (panel) I.defineAll(panel);
  const r = I.runSync(line);
  return { error: r.error, segments: I.turtle.segments };
}
const pages = [1, 2, 3].map((n) => {
  const html = read(`curs/reptes-${n}.html`);
  const sims = [...html.matchAll(/<div class="simulador"( data-id[^>]*)>([\s\S]*?)<\/div>\s*<div class="pistes">([\s\S]*?)<\/div>/g)].map((m) => ({
    attrs: m[1],
    sol: unescape(m[2].match(/<script type="text\/logo">\n([\s\S]*?)\n<\/script>/)[1]),
    panel: unescape(((m[2].match(/<script type="text\/logo-panell">\n([\s\S]*?)\n<\/script>/) || [])[1] || '')),
    hints: [...m[3].matchAll(/<p>([\s\S]*?)<\/p>/g)].map((p) => p[1]),
  }));
  return { n, html, sims, text: unescape(html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ') };
});
const attr = (s, name) => (s.attrs.match(new RegExp(name + '="([^"]*)"')) || [])[1];
const target = (s) => run(null, s.sol).segments;
const check = (s, code) => {
  const d = run(code, attr(s, 'data-executa'));
  return !d.error && compareDrawings(d.segments, target(s)).ok;
};

test('tres nivells de tres reptes, tots clau, amb quadrícula i dues pistes (G1, G6, G7)', () => {
  const ids = new Set();
  for (const p of pages) {
    assert.equal(p.sims.length, 3, 'nivell ' + p.n);
    for (const s of p.sims) {
      for (const a of ['data-clau', 'data-quadricula', 'data-panell', 'data-comprova="dibuix"']) assert.ok(s.attrs.includes(a), a);
      assert.ok(!s.attrs.includes('data-exigeix'), 'cap repte demana paraules concretes');
      ids.add(attr(s, 'data-id'));
      assert.equal(s.hints.length, 2);
      const d = run(null, s.sol);
      assert.equal(d.error, null); assert.ok(inField(d.segments)); assert.ok(d.segments.length > 0);
      assert.ok(s.sol.endsWith('\n' + attr(s, 'data-executa')));
      assert.ok(p.html.includes(`farà <code>${attr(s, 'data-executa')}</code>`));
      const lines = (s.panel + '\n' + s.sol).split('\n');
      assert.ok(Math.max(...lines.map((l) => l.length)) <= 52);
    }
    assert.ok(/Recomanat després del capítol (7|9|12)\./.test(p.text));
    assert.ok(p.html.includes('<a href="../index.html#reptes" aria-current="page">Reptes</a>'));
    assert.ok(!/\bentrad|\bcaps[ae]|anys 80|198\d/i.test(p.text));
  }
  assert.equal(ids.size, 9);
});

test('G5: al nivell 2 hi ha la peça; als nivells 1 i 3, res. G9: el nivell 1 només diu «Reprodueix el dibuix»', () => {
  assert.ok(pages[0].sims.every((s) => !s.panel) && pages[2].sims.every((s) => !s.panel));
  assert.deepEqual(pages[1].sims.map((s) => s.panel.match(/PROC (\S+)/g).pop()), ['PROC QUADRAT', 'PROC CASA', 'PROC HEXÀGON']);
  for (const s of pages[0].sims) {
    const name = attr(s, 'data-executa');
    assert.ok(pages[0].html.includes(`Reprodueix el dibuix que veus aquí. Defineix <code>${name}</code>: quan premis «Comprova», la tortuga farà <code>${name}</code>.`));
  }
  assert.ok(pages[1].text.includes('REPETEIX 4 [REPETEIX 4 [AVANÇA 20 GIRA.D 90] GIRA.D 90]'), 'G8');
});

test('el panell sol no resol el repte, i la solució de referència sí', () => {
  for (const p of pages) for (const s of p.sims) {
    assert.ok(!check(s, s.panel), attr(s, 'data-id') + ': sense fer res');
    assert.ok(check(s, s.sol.replace(/\n[^\n]*$/, '')), attr(s, 'data-id'));
  }
});

const S = (n, i) => pages[n - 1].sims[i];
test('errors típics: no passen', () => {
  const Q50 = 'PROC QUADRAT\n  REPETEIX 4 [AVANÇA 50 GIRA.D 90]\nFI\n';
  assert.ok(!check(S(1, 0), Q50 + 'PROC FLOR\n  REPETEIX 8 [QUADRAT GIRA.D 40]\nFI'), 'gir de 40');
  assert.ok(check(S(1, 0), Q50 + 'PROC FLOR\n  REPETEIX 8 [QUADRAT GIRA.E 45]\nFI'), 'la flor girant a l\'esquerra és la mateixa figura');
  assert.ok(!check(S(1, 1), 'PROC QUADRAT\n  REPETEIX 4 [AVANÇA 20 GIRA.D 90]\nFI\nPROC CORONA\n  REPETEIX 12 [QUADRAT GIRA.D 30]\nFI'), 'sense el camí');
  assert.ok(!check(S(1, 2), 'PROC ESTRELLA\n  REPETEIX 9 [AVANÇA 90 GIRA.D 40]\nFI'), 'una volta sola: un polígon');
  assert.ok(!check(S(1, 2), 'PROC ESTRELLA\n  REPETEIX 9 [AVANÇA 90 GIRA.E 160]\nFI'), 'l\'estrella a l\'altre costat');
  const P2 = S(2, 0).panel + '\n';
  assert.ok(!check(S(2, 0), P2 + 'PROC MOSAIC\n  REPETEIX 4 [REPETEIX 5 [QUADRAT GIRA.D 90 AVANÇA 25 GIRA.E 90] AVANÇA 25]\nFI'), 'les files no tornen');
  assert.ok(check(S(2, 0), P2 + 'PROC MOSAIC\n  REPETEIX 4 [REPETEIX 5 [QUADRAT GIRA.D 90 AVANÇA 25 GIRA.E 90] GIRA.E 90 AVANÇA 125 GIRA.D 90 AVANÇA 25]\nFI'), 'amb un REPETEIX dins d\'un altre');
  const P5 = S(2, 1).panel + '\n';
  assert.ok(!check(S(2, 1), P5 + 'PROC CARRER\n  CASA 20 GIRA.D 90 AVANÇA 10 GIRA.E 90\n  CASA 30 GIRA.D 90 AVANÇA 10 GIRA.E 90\n  CASA 40\nFI'), 'només els 10 passos');
  assert.ok(!check(S(2, 2), S(2, 2).panel + '\nPROC RUSC\n  REPETEIX 6 [HEXÀGON GIRA.D 60]\nFI'), 'sense avançar: una flor');
  assert.ok(!check(S(3, 0), 'PROC ARBRE3 :MIDA\n  SI :MIDA < 5 [ACABA]\n  AVANÇA :MIDA\n  GIRA.E 40 ARBRE3 :MIDA / 2\n  GIRA.D 80 ARBRE3 :MIDA / 2\n  GIRA.E 40 RECULA :MIDA\nFI'), 'dues branques');
  assert.ok(!check(S(3, 1), 'PROC QUADRAT :C\n  REPETEIX 4 [AVANÇA :C GIRA.D 90]\nFI\nPROC QUADRATS :C\n  SI :C > 100 [ACABA]\n  QUADRAT :C\n  QUADRATS :C + 5\nFI'), 'sense el gir');
  assert.ok(!check(S(3, 2), S(3, 2).sol.replace(/\nFLOC 3$/, '').replace('KOCH 105 :NIVELL GIRA.D 120', 'KOCH 105 :NIVELL GIRA.E 120')), 'les puntes cap endins');
});

test('portada: secció Reptes, i «Reptes» a la barra de totes les pàgines', () => {
  const idx = read('index.html');
  assert.ok(idx.includes('id="reptes"'));
  for (const n of [1, 2, 3]) assert.ok(idx.includes(`href="curs/reptes-${n}.html"`));
  const ids = pages.flatMap((p) => p.sims.map((s) => attr(s, 'data-id')));
  assert.deepEqual([...idx.matchAll(/data-reptes="([^"]*)"/g)].flatMap((m) => m[1].split(' ')), ids);
  for (const f of ['index.html', 'glossari.html', 'simulador.html', ...Array.from({ length: 12 }, (_, i) => `curs/capitol-${i + 1}.html`)])
    assert.ok(/>Reptes<\/a>/.test(read(f)), f);
});
