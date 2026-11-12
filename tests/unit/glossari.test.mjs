// Proves del glossari (owner, revisió 15).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { Interpreter } from '../../js/logo/interpret.js';

const read = (f) => readFileSync(new URL('../../' + f, import.meta.url), 'utf8');
const html = read('glossari.html');
const un = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&');
const entries = [...html.matchAll(/<article class="gl-entrada" id="([^"]+)">([\s\S]*?)<\/article>/g)].map((m) => ({
  id: m[1],
  word: un(m[2].match(/<h3><code>([\s\S]*?)<\/code><\/h3>/)[1]),
  chapter: (m[2].match(/href="curs\/capitol-(\d+)\.html"/) || [])[1],
  text: un(m[2].match(/<p>([\s\S]*?)<\/p>/)[1]),
  example: (m[2].match(/<pre class="codi">([\s\S]*?)<\/pre>/) || [])[1],
  prova: (m[2].match(/class="gl-prova" href="([^"]+)"/) || [])[1],
  part: null,
}));
const curs = html.slice(html.indexOf('id="curs"'), html.indexOf('id="altres"'));
for (const e of entries) e.part = curs.includes(`id="${e.id}"`) ? 'curs' : 'altres';
const COORD = ['FES.XY', 'FES.X', 'FES.Y', 'COOR.X', 'COOR.Y', 'ORIENTACIÓ', 'FES.ORIENTACIÓ', 'VERS.A'];

test('glossari: totes les paraules del motor, menys les de coordenades (G1 A)', () => {
  const words = new Set(entries.flatMap((e) => e.word.split(/\s+/)));
  for (const w of Object.keys(new Interpreter().prims)) {
    if (COORD.includes(w)) assert.ok(!words.has(w), w + ' no hi ha de ser');
    else assert.ok(words.has(w), w + ' hi falta');
  }
  for (const w of ['PROC', 'FI', ':NOM', 'CERT', 'FALS', '+', '-', '*', '/', '<', '>', '=', '(', ')']) assert.ok(words.has(w), w);
  assert.equal(new Set(entries.map((e) => e.id)).size, entries.length, 'identificadors únics');
});

test('glossari: dues parts, per temes en l\'ordre aprovat, i alfabètic dins de cada tema (G2 A)', () => {
  const order = ['Moure la tortuga', 'El llapis i els colors', 'Repetir', 'Procediments i variables', 'Nombres i càlculs', 'Atzar i decisions', 'La pantalla i els modes', 'Veure i esborrar procediments'];
  for (const part of ['curs', 'altres']) {
    const block = part === 'curs' ? curs : html.slice(html.indexOf('id="altres"'));
    const themes = [...block.matchAll(/<section class="gl-tema" id="[^"]+">\s*<h2>([^<]+)<\/h2>([\s\S]*?)<\/section>/g)];
    const names = themes.map((t) => un(t[1]));
    assert.deepEqual(names, order.filter((n) => names.includes(n)), part + ': ordre dels temes');
    for (const t of themes) {
      const ws = [...t[2].matchAll(/<h3><code>([\s\S]*?)<\/code>/g)].map((m) => un(m[1])).filter((w) => /[A-Z]/.test(w));
      const key = (w) => w.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z]/g, '');
      assert.deepEqual(ws, [...ws].sort((a, b) => key(a).localeCompare(key(b))), un(t[1]) + ': ordre alfabètic');
    }
  }
  assert.ok(entries.filter((e) => e.part === 'curs').every((e) => e.chapter), 'les paraules del curs porten capítol');
  assert.ok(entries.filter((e) => e.part === 'altres').every((e) => !e.chapter), 'les altres diuen «No surt al curs»');
  assert.equal((html.match(/No surt al curs/g) || []).length, entries.filter((e) => e.part === 'altres').length);
});

test('glossari: cada paraula del curs surt al capítol que diu', () => {
  const plain = (n) => un(read(`curs/capitol-${n}.html`).replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' '));
  for (const e of entries.filter((x) => x.part === 'curs')) {
    const t = plain(e.chapter);
    for (const w of e.word.split(/\s+/).filter((x) => x !== '/' || e.word !== 'CERT / FALS')) {
      if (w === ':NOM') { assert.ok(/:[A-Z]/.test(t)); continue; }
      assert.ok(t.includes(w), `${w} hauria de sortir al capítol ${e.chapter}`);
    }
  }
});

test('glossari: «Prova-ho» porta a l\'Editor lliure amb l\'exemple, i l\'exemple funciona (G4 A)', () => {
  const expectedError = { 'M.BARRERA AVANÇA 200': 'fence' };   // l'exemple ensenya el missatge
  for (const e of entries) {
    if (!e.example) continue;
    const ex = un(e.example);
    if (e.prova) {
      assert.ok(!ex.includes('\n'), e.word + ': un «Prova-ho» només per a exemples d\'una línia');
      assert.ok(e.prova.startsWith('simulador.html?prova='));
      assert.equal(decodeURIComponent(e.prova.slice('simulador.html?prova='.length)), ex);
      const r = new Interpreter({ rng: () => 0.5 }).runSync(ex);
      if (expectedError[ex]) assert.equal(r.error && r.error.code, expectedError[ex], ex);
      else assert.equal(r.error, null, ex);
    } else {
      // Sense «Prova-ho»: exemples de diverses línies (es defineixen bé) o que demanen un procediment al panell.
      if (ex.startsWith('PROC ')) { const I = new Interpreter(); I.defineAll(ex); assert.ok(I.procs.size === 1, e.word); }
      else assert.ok(/^(PROC\?|OBLIDA\.PROC) "QUADRAT$/.test(ex), e.word + ': ha de poder-se provar');
    }
  }
  assert.ok(entries.filter((e) => e.prova).length >= 40);
  assert.ok(html.includes('target="_blank" rel="noopener"'));
});

test('glossari: textos aprovats', () => {
  const t = (w) => entries.find((e) => e.word === w).text;
  assert.equal(t('M.CÍCLIC'), "La tortuga que surt per una vora entra per la del davant. És com funciona sempre, si no dius res.");
  assert.equal(t('M.BARRERA'), "Des d'ara, la tortuga no pot sortir de la pantalla: si ho intenta, s'atura i surt un missatge. Per tornar a com era, M.CÍCLIC.");
  assert.equal(t('M.FINESTRA'), "Des d'ara, la tortuga pot sortir de la pantalla i continuar per fora, on no la veus. Per tornar a com era, M.CÍCLIC.");
  assert.equal(t('AVANÇA'), 'La tortuga avança tants passos com li diguis, en la direcció cap on mira. Si té el llapis avall, deixa ratlla.');
  assert.equal(t('REPETEIX'), 'Fa el que hi ha entre claudàtors tantes vegades com li diguis.');
  assert.equal(t('( )'), 'Els parèntesis diuen a LOGO que primer faci el càlcul de dins.');
  assert.ok(!/Idees del curs/.test(html), 'sense secció d\'idees (owner, G5: no)');
  assert.ok(!/\bentrad|\bcaps[ae]/i.test(un(html.replace(/<[^>]+>/g, ' '))));
});

test('glossari: l\'entrada «Glossari» és a la barra de totes les pàgines (G6)', () => {
  const pages = ['index.html', 'simulador.html', 'glossari.html', ...readdirSync(new URL('../../curs/', import.meta.url)).filter((f) => /^capitol-\d+\.html$/.test(f)).map((f) => 'curs/' + f)];
  for (const p of pages) {
    const s = read(p);
    const bar = s.slice(s.indexOf('<header class="barra">'), s.indexOf('</header>'));
    assert.ok(bar.includes(`href="${p.startsWith('curs/') ? '../' : ''}glossari.html"`), p);
  }
  assert.ok(html.includes('<a href="glossari.html" aria-current="page">Glossari</a>'));
});

test('l\'Editor lliure llegeix «?prova=» (G4 A)', () => {
  const s = read('js/ui/editor.js');
  assert.ok(/URLSearchParams\(location\.search\)\.get\('prova'\)/.test(s));
  assert.ok(/monitor\.input\.value = prova/.test(s));
});
