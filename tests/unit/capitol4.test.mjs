// Proves del capítol 4 tal com es publica: llapis, goma, colors i sanefes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Interpreter } from '../../js/logo/interpret.js';
import { describe } from '../../js/logo/missatges.js';
import { compareDrawings } from '../../js/logo/compara.js';

function drawing(code) {
  const I = new Interpreter({ rng: () => 0.5 });
  const r = I.runSync(code);
  assert.equal(r.error, null, 'ha de funcionar: ' + code);
  return { segments: I.turtle.segments, pose: I.turtle.pose(), pen: I.turtle.pen };
}
function runPanel(panel, name) {
  const I = new Interpreter({ rng: () => 0.5 });
  I.defineAll(panel);
  const r = I.runSync(name);
  return { I, error: r.error, segments: I.turtle.segments, pose: I.turtle.pose() };
}
const message = (code) => { const I = new Interpreter(); const r = I.runSync(code); return describe(r.error, I.knownWords()); };
const html = readFileSync(new URL('../../curs/capitol-4.html', import.meta.url), 'utf8');
const sims = [...html.matchAll(/<div class="simulador"([^>]*)>([\s\S]*?)<\/div>/g)].map((m) => ({
  attrs: m[1],
  solutions: [...m[2].matchAll(/<script type="text\/logo">([\s\S]*?)<\/script>/g)].map((s) => s[1]),
  panel: ((m[2].match(/<script type="text\/logo-panell">([\s\S]*?)<\/script>/) || [])[1] || '').replace(/^\n+|\s+$/g, ''),
}));
const sim = (id) => sims.find((s) => s.attrs.includes(id));
const attr = (s, name) => (s.attrs.match(new RegExp(name + '="([^"]*)"')) || [])[1];
const inField = (segs) => segs.every((s) => [s.x1, s.x2].every((x) => x >= -140 && x < 140) && [s.y1, s.y2].every((y) => y >= -120 && y < 120));

test('capítol 4: 4 simuladors d\'exemple i 3 exercicis; tot es pot definir i executar', () => {
  assert.equal(sims.length, 7);
  assert.ok(sims.every((s) => s.attrs.includes('data-panell')));
  const ex = sims.filter((s) => s.solutions.length > 0);
  assert.equal(ex.length, 3);
  for (const s of ex) { assert.ok(attr(s, 'data-executa')); assert.equal(attr(s, 'data-comprova'), 'dibuix'); }   // el llapis final no es corregeix (owner)
  for (const s of ex) for (const code of s.solutions) assert.ok(inField(drawing(code).segments), 'la figura no surt de la pantalla');
  for (const s of sims) if (s.panel) new Interpreter().defineAll(s.panel);
  for (const m of html.matchAll(/<pre class="codi">([\s\S]*?)<\/pre>/g)) {                 // tots els exemples del text funcionen
    const code = m[1].replace(/&gt;/g, '>').replace(/&lt;/g, '<');
    const I = new Interpreter();
    I.defineAll('PROC QUADRAT\n REPETEIX 4 [AVANÇA 20 GIRA.D 90]\nFI');
    assert.equal(I.runSync(code).error, null, code);
  }
  assert.ok(!/M\.C[ÍI]CLIC|M\.BARRERA|M\.FINESTRA/.test(html));                           // els modes de vora, fora del capítol
  assert.ok(!/anys 80/i.test(html));
});

test('llapis: NO.LLAPIS no deixa traç, LLAPIS torna a dibuixar, GOMA esborra', () => {
  const d = drawing('AVANÇA 30 NO.LLAPIS AVANÇA 30 LLAPIS AVANÇA 30');
  assert.ok(compareDrawings(d.segments, drawing('AVANÇA 30 NO.LLAPIS AVANÇA 30 LLAPIS AVANÇA 30').segments).ok);
  assert.equal(compareDrawings(d.segments, drawing('AVANÇA 90').segments).ok, false);
  assert.equal(drawing('NO.LLAPIS AVANÇA 50').segments.length, 0);
  // L'exemple de «La goma»: un quadrat menys un costat.
  const erased = drawing('REPETEIX 4 [AVANÇA 50 GIRA.D 90]\nGOMA\nAVANÇA 50\nLLAPIS');
  assert.ok(compareDrawings(erased.segments, drawing('NO.LLAPIS AVANÇA 50 LLAPIS GIRA.D 90 AVANÇA 50 GIRA.D 90 AVANÇA 50 GIRA.D 90 AVANÇA 50').segments).ok);
  assert.equal(erased.pen, 'down');
  // INI.DIB no baixa el llapis ni canvia el color (com a l'original; owner).
  const I = new Interpreter(); I.runSync('NO.LLAPIS FES.COLOR 2 INI.DIB');
  assert.equal(I.turtle.pen, 'up'); assert.equal(I.turtle.color, 2);
});

test('capítol 4: «Què dibuixarà?» — tres dibuixos diferents i la tortuga acaba igual a tots tres', () => {
  const block = html.match(/<div class="prediu"[\s\S]*?<\/div>/)[0];
  const opts = [...block.matchAll(/<script type="text\/logo"( data-correcta)?[^>]*>([\s\S]*?)<\/script>/g)].map((m) => ({ ok: !!m[1], d: drawing(m[2]) }));
  assert.equal(opts.length, 3);
  assert.equal(opts.filter((o) => o.ok).length, 1);
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.equal(compareDrawings(opts[i].d.segments, opts[j].d.segments).ok, false);
  for (const o of opts) { assert.equal(o.d.pen, 'down'); assert.equal(Math.round(o.d.pose.y), 90); }   // la tortuga no dona pistes
});

test('capítol 4: «Els guions» — cinc traços de 10; no exigeix REPETEIX', () => {
  const ex = sim('cap4-guions');
  assert.equal(attr(ex, 'data-exigeix'), undefined);
  const t = drawing(ex.solutions[0]);
  assert.equal(t.segments.length, 5);
  const long = runPanel('PROC GUIONS\n' + '  AVANÇA 10\n  NO.LLAPIS\n  AVANÇA 10\n  LLAPIS\n'.repeat(5) + 'FI', 'GUIONS');
  assert.ok(compareDrawings(long.segments, t.segments).ok);
  const upAtEnd = runPanel('PROC GUIONS\n  REPETEIX 5 [LLAPIS AVANÇA 10 NO.LLAPIS AVANÇA 10]\nFI', 'GUIONS');
  assert.ok(compareDrawings(upAtEnd.segments, t.segments).ok);                              // llapis a dalt al final: també val
  const solid = runPanel('PROC GUIONS\n  AVANÇA 90\nFI', 'GUIONS');
  assert.equal(compareDrawings(solid.segments, t.segments).ok, false);
});

test('capítol 4: «La sanefa que s\'acaba» — sense LLAPIS a SALT només surt un quadrat', () => {
  const ex = sim('cap4-error');
  const t = drawing(ex.solutions[0]);
  assert.equal(t.segments.length, 16);
  const given = runPanel(ex.panel, attr(ex, 'data-executa'));
  assert.equal(given.error, null);
  assert.equal(given.segments.length, 4);
  assert.equal(compareDrawings(given.segments, t.segments).ok, false);
  const fixed = runPanel(ex.panel.replace('GIRA.D 90 AVANÇA 30 GIRA.E 90\nFI', 'GIRA.D 90 AVANÇA 30 GIRA.E 90\n  LLAPIS\nFI'), 'SANEFA');
  assert.ok(compareDrawings(fixed.segments, t.segments).ok);
});

test('capítol 4: «El carrer» — tres torres separades, i CARRER ha de fer servir TORRE', () => {
  const ex = sim('cap4-carrer');
  assert.ok(ex.attrs.includes('data-clau') && attr(ex, 'data-exigeix') === 'TORRE' && attr(ex, 'data-executa') === 'CARRER');
  const t = drawing(ex.solutions[0]);
  const tower = runPanel(ex.panel, 'TORRE');
  assert.ok(Math.hypot(tower.pose.x, tower.pose.y) < 1e-6 && tower.pose.heading === 0);   // la TORRE donada deixa la tortuga com l'ha trobada
  const extra = '\n\nPROC SALT\n  NO.LLAPIS GIRA.D 90 AVANÇA 30 GIRA.E 90 LLAPIS\nFI\n\nPROC CARRER\n  TORRE SALT TORRE SALT TORRE\nFI';
  const good = runPanel(ex.panel + extra, 'CARRER');
  assert.ok(compareDrawings(good.segments, t.segments).ok);
  assert.equal(good.I.procUses('CARRER', 'TORRE'), true);
  const glued = runPanel(ex.panel + extra.replace('NO.LLAPIS ', '').replace(' LLAPIS', ''), 'CARRER');
  assert.equal(compareDrawings(glued.segments, t.segments).ok, false);                     // sense aixecar el llapis, hi ha traços de més
});

test('missatges del capítol 4 (owner): paraula amb punt escrita amb espai, i color fora de 0–5', () => {
  assert.deepEqual(message('NO LLAPIS'), { line1: 'NO SÉ COM FER NO LLAPIS', hints: ["Volies dir NO.LLAPIS? S'escriu amb un punt i sense espai."] });
  assert.deepEqual(message('GIRA D 90'), { line1: 'NO SÉ COM FER GIRA D', hints: ["Volies dir GIRA.D? S'escriu amb un punt i sense espai."] });
  assert.deepEqual(message('FES.COLOR 9'), { line1: 'A FES.COLOR NO LI AGRADA 9', hints: ['Els colors van del 0 al 5'] });
  assert.deepEqual(message('FES.FONS 6').hints, ['Els colors van del 0 al 5']);
  assert.equal(message('NOLLAPIS').hints[0], 'Volies dir NO.LLAPIS?');
  const I = new Interpreter(); assert.deepEqual(I.runSync('ESCRIU NO 1 = 2').prints, ['CERT']);   // NO continua sent la negació
});
