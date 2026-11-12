// LogoCat a la família Step Quiz (owner, revisió 16): fitxers comuns de step-quiz-commons.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const read = (f) => readFileSync(new URL('../../' + f, import.meta.url), 'utf8');
const exists = (f) => existsSync(new URL('../../' + f, import.meta.url));
const COMMON = ['LICENSE', 'LLICENCIA.md', 'family.js', 'footer.js', ...['htmlcat', 'pycat', 'karelcat', 'jscat', 'logocat'].map((n) => `img/${n}.svg`)];
const config = (f) => JSON.parse(read(f).match(/var CONFIG = (\{.*\});/)[1]);
const chapters = readdirSync(new URL('../../curs/', import.meta.url)).filter((f) => /^capitol-\d+\.html$/.test(f)).map((f) => 'curs/' + f);

test('els fitxers comuns hi són, i els scripts porten l\'avís de FITXER COMÚ', () => {
  for (const f of COMMON) assert.ok(exists(f), f);
  for (const f of ['family.js', 'footer.js']) assert.ok(/FITXER COMÚ/.test(read(f)), f);
  assert.ok(!exists('certificat.js') && !exists('curs/certificat.js') && !exists('curs/progress.js') && !exists('js/kbd-accessory.js'), 'sense certificat, ni progrés comú, ni barra de tecles (owner, F1 i F5)');
});

test('selector EXPLORA: LogoCat és el projecte actual, i sense lletra de Google (F2, F3)', () => {
  const c = config('family.js');
  assert.equal(c.actual, 'logocat');
  assert.equal(c.fontExterna, false, 'cap petició a tercers: la lletra de Google no es carrega');
  assert.ok(/id: 'logocat'/.test(read('family.js')));
  assert.equal(config('footer.js').fix, false, 'el peu va al final de la pàgina (F6)');
});

test('selector i peu a les pàgines: no a l\'Editor lliure, que va just a 1366 × 625 (F3, F6)', () => {
  for (const p of ['index.html', 'glossari.html', ...chapters]) {
    const s = read(p), pre = p.startsWith('curs/') ? '../' : '';
    assert.ok(s.includes(`<script src="${pre}family.js" defer></script>`), p + ': family.js');
    assert.ok(s.includes(`<script src="${pre}footer.js" defer></script>`), p + ': footer.js');
    assert.ok(s.includes('<div class="topbar-actions"></div>'), p + ': lloc del selector');
  }
  const ed = read('simulador.html');
  assert.ok(!/family\.js|footer\.js|topbar-actions/.test(ed), 'l\'Editor lliure no porta ni selector ni peu');
});
