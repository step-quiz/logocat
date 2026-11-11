// Proves del capítol 3 tal com es publica: procediments al panell i «Comprova» que executa un procediment.
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
  return { segments: I.turtle.segments, pose: I.turtle.pose() };
}
/** El que fa «Comprova»: defineix el panell i executa el procediment en net. */
function runPanel(panel, name) {
  const I = new Interpreter({ rng: () => 0.5 });
  I.defineAll(panel);
  const r = I.runSync(name);
  return { I, error: r.error, segments: I.turtle.segments, pose: I.turtle.pose() };
}
const html = readFileSync(new URL('../../curs/capitol-3.html', import.meta.url), 'utf8');
const sims = [...html.matchAll(/<div class="simulador"([^>]*)>([\s\S]*?)<\/div>/g)].map((m) => ({
  attrs: m[1],
  solutions: [...m[2].matchAll(/<script type="text\/logo">([\s\S]*?)<\/script>/g)].map((s) => s[1]),
  // com js/curs/pagina.js: sense les línies en blanc del principi ni del final
  panel: ((m[2].match(/<script type="text\/logo-panell">([\s\S]*?)<\/script>/) || [])[1] || '').replace(/^\n+|\s+$/g, ''),
}));
const sim = (id) => sims.find((s) => s.attrs.includes(id));
const attr = (s, name) => (s.attrs.match(new RegExp(name + '="([^"]*)"')) || [])[1];

test('capítol 3: tots els simuladors porten panell; 3 exercicis amb procediment per executar', () => {
  assert.equal(sims.length, 6);
  assert.ok(sims.every((s) => s.attrs.includes('data-panell')));
  const ex = sims.filter((s) => s.solutions.length > 0);
  assert.equal(ex.length, 3);
  for (const s of ex) { assert.ok(attr(s, 'data-executa')); for (const code of s.solutions) drawing(code); }
  for (const s of sims) if (s.panel) new Interpreter().defineAll(s.panel);      // els panells donats es poden definir
  assert.ok(!/anys 80/i.test(html) && !/PROCS\?|OBLIDA\.PROC/.test(html));     // decisions de la revisió 5
});

test('capítol 3: el QUADRAT amb AVANSA dona l\'error amb la línia del procediment', () => {
  const s = sims.find((x) => x.panel.includes('AVANSA'));
  const r = runPanel(s.panel, 'QUADRAT');
  const m = describe(r.error, r.I.knownWords());
  assert.equal(m.line1, "NO SÉ COM FER AVANSA A LA LÍNIA 2 DEL PROCEDIMENT 'QUADRAT'");
  assert.deepEqual(m.hints, ['Volies dir AVANÇA?']);
  assert.equal(r.error.where.panelLine, 1);
  assert.ok(html.includes(m.line1));                                           // el text del capítol cita el missatge real
});

test('capítol 3: «El graó» — dibuix i orientació final', () => {
  const ex = sim('cap3-grao');
  assert.equal(attr(ex, 'data-executa'), 'GRAÓ');
  assert.ok(ex.attrs.includes('dibuix+tortuga'));
  const t = drawing(ex.solutions[0]);
  const ok = runPanel('PROC GRAÓ\n  AVANÇA 20\n  GIRA.D 90\n  AVANÇA 20\n  GIRA.E 90\nFI', 'GRAÓ');
  assert.ok(compareDrawings(ok.segments, t.segments).ok);
  assert.deepEqual(comparePose(ok.pose, t.pose), { position: true, heading: true });
  const noTurn = runPanel('PROC GRAÓ\n  AVANÇA 20 GIRA.D 90 AVANÇA 20\nFI', 'GRAÓ');
  assert.ok(compareDrawings(noTurn.segments, t.segments).ok);
  assert.deepEqual(comparePose(noTurn.pose, t.pose), { position: true, heading: false });
  // Sense accent és un altre nom: GRAÓ no existeix.
  const other = new Interpreter(); other.defineAll('PROC GRAO\n  AVANÇA 20\nFI');
  assert.equal(other.procs.has('GRAÓ'), false);
});

test('capítol 3: «La finestra torta» — el panell donat falla i amb QUADRAT corregit passa', () => {
  const ex = sim('cap3-error');
  const t = drawing(ex.solutions[0]);
  const given = runPanel(ex.panel, attr(ex, 'data-executa'));
  assert.equal(given.error, null);
  assert.equal(compareDrawings(given.segments, t.segments).ok, false);
  const fixed = runPanel(ex.panel.replace('REPETEIX 3 [AVANÇA 40 GIRA.D 90]\n  AVANÇA 40', 'REPETEIX 4 [AVANÇA 40 GIRA.D 90]'), 'FINESTRA');
  assert.ok(compareDrawings(fixed.segments, t.segments).ok);
  assert.equal(t.segments.length > 0 && compareDrawings(t.segments, drawing('REPETEIX 4 [REPETEIX 4 [AVANÇA 40 GIRA.D 90] GIRA.D 90]').segments).ok, true);
});

test('capítol 3: «La torre» — tres quadrats, i TORRE ha de fer servir QUADRAT', () => {
  const ex = sim('cap3-torre');
  assert.ok(ex.attrs.includes('data-clau') && attr(ex, 'data-exigeix') === 'QUADRAT' && attr(ex, 'data-executa') === 'TORRE');
  const [right, left] = ex.solutions.map(drawing);
  assert.equal(compareDrawings(right.segments, left.segments).ok, false);       // les dues solucions són miralls
  const good = runPanel('PROC QUADRAT\n  REPETEIX 4 [AVANÇA 30 GIRA.D 90]\nFI\n\nPROC TORRE\n  QUADRAT AVANÇA 30\n  QUADRAT AVANÇA 30\n  QUADRAT\nFI', 'TORRE');
  assert.ok(compareDrawings(good.segments, right.segments).ok);
  assert.equal(good.I.procUses('TORRE', 'QUADRAT'), true);
  const flat = runPanel('PROC TORRE\n  REPETEIX 3 [REPETEIX 4 [AVANÇA 30 GIRA.D 90] AVANÇA 30]\nFI', 'TORRE');
  assert.ok(compareDrawings(flat.segments, right.segments).ok);                 // dibuix bo…
  assert.equal(flat.I.procUses('TORRE', 'QUADRAT'), false);                     // …però sense la peça: missatge d'ànim
  const nested = runPanel('PROC QUADRAT\n  REPETEIX 4 [AVANÇA 30 GIRA.E 90]\nFI\nPROC TORRE\n  REPETEIX 3 [QUADRAT AVANÇA 30]\nFI', 'TORRE');
  assert.ok(compareDrawings(nested.segments, left.segments).ok);
  assert.equal(nested.I.procUses('TORRE', 'QUADRAT'), true);                    // també dins dels claudàtors
});

test('capítol 3: «Què dibuixarà?» — tres dibuixos diferents, i la bona fa 4 quadrats', () => {
  const block = html.match(/<div class="prediu"[\s\S]*?<\/div>/)[0];
  const opts = [...block.matchAll(/<script type="text\/logo"( data-correcta)?[^>]*>([\s\S]*?)<\/script>/g)].map((m) => ({ ok: !!m[1], d: drawing(m[2]) }));
  assert.equal(opts.length, 3);
  assert.equal(opts.filter((o) => o.ok).length, 1);
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) assert.equal(compareDrawings(opts[i].d.segments, opts[j].d.segments).ok, false);
});

test('missatge del panell: una ordre fora de PROC … FI (sense «les ordres soltes…»)', () => {
  const I = new Interpreter();
  let err = null; try { I.defineAll('AVANÇA 50'); } catch (e) { err = e; }
  const m = describe(err, I.knownWords());
  assert.equal(m.line1, 'AVANÇA 50 NO ÉS DINS DE CAP PROCEDIMENT');
  assert.deepEqual(m.hints, ['Aquí només hi van procediments (PROC … FI).']);
});
