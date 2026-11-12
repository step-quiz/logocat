// Proves al navegador (revisió 18, C2). Fan amb Chrome el que no poden fer les proves de Node:
//  1. Totes les pàgines a quatre mides de pantalla (dos portàtils i dues tauletes en horitzontal):
//     cap error de JavaScript, cap petició a fora, cap barra de desplaçament horitzontal i la barra
//     de dalt en una sola fila.
//  2. Cada exercici dels capítols i dels reptes amb la seva solució de referència: «Comprova» ha de
//     dir «Correcte!».
//  3. Les coses de la revisió 18 que viuen a la pàgina: el nom sense accent, el panell desat i
//     «Torna a començar», el qüestionari barrejat, la portada, la barra de tecles i els fitxers.
//
// A la CI: la feina «navegador» de .github/workflows/ci.yml. En local:
//   npm install --no-save playwright && npx playwright install chromium
//   node tests/navegador/prova.mjs
// Per fer servir un Chrome que ja tinguis: CHROME_PATH=/usr/bin/google-chrome node tests/navegador/prova.mjs
// (i PLAYWRIGHT_PATH=/camí/a/node_modules/playwright si Playwright no és al projecte).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json' };

let fails = 0;
const check = (cond, what) => { if (!cond) fails++; console.log((cond ? 'OK    ' : 'FALLA ') + what); };

function serve() {
  return new Promise((resolve) => {
    const srv = createServer(async (req, res) => {
      let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (path.endsWith('/')) path += 'index.html';
      const file = normalize(join(ROOT, path));
      if (!file.startsWith(ROOT.replace(/[\\/]$/, '') + sep)) { res.writeHead(403); res.end(); return; }
      try {
        const body = await readFile(file);
        res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
        res.end(body);
      } catch (e) { res.writeHead(404); res.end('no hi és'); }
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

const PAGES = ['index.html', 'glossari.html', 'simulador.html', '404.html',
  ...Array.from({ length: 12 }, (_, i) => `curs/capitol-${i + 1}.html`), 'curs/reptes-1.html', 'curs/reptes-2.html', 'curs/reptes-3.html'];
const VIEWS = [['portàtil 1366×625', 1366, 625, false], ['portàtil 1280×585', 1280, 585, false],
  ['tauleta 1180×740', 1180, 740, true], ['tauleta 1024×690', 1024, 690, true]];
const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** Els procediments d'un text, per nom: { NOM: 'PROC NOM …\nFI' }. */
function procs(text) {
  const out = {}; let cur = null;
  for (const line of text.split('\n')) {
    const m = /^PROC\s+(\S+)/i.exec(line.trim());
    if (m) cur = { name: m[1].toUpperCase(), lines: [] };
    if (cur) cur.lines.push(line);
    if (cur && line.trim().toUpperCase() === 'FI') { out[cur.name] = cur.lines.join('\n'); cur = null; }
  }
  return out;
}

/** Els exercicis d'una pàgina: { id, run, panel, solution }. */
function exercises(file) {
  const html = readFileSync(join(ROOT, file), 'utf8');
  return [...html.matchAll(/<div class="simulador" data-id="([^"]+)"([^>]*)>([\s\S]*?)<\/div>/g)].map((m) => ({
    id: m[1],
    run: (m[2].match(/data-executa="([^"]*)"/) || [])[1] || null,
    panel: unescape(((m[3].match(/<script type="text\/logo-panell">\n?([\s\S]*?)<\/script>/) || [])[1] || '').trim()),
    solution: unescape((m[3].match(/<script type="text\/logo">\n?([\s\S]*?)<\/script>/) || [])[1] || '').trim(),
  })).filter((e) => e.solution);
}

/** El panell que resol l'exercici: els procediments del panell, canviats pels de la solució. */
function fixedPanel(ex) {
  if (ex.id === 'cap5-error') return ex.panel.replace('360 / 6', '360 / 5');      // la solució no porta el PROC
  const all = { ...procs(ex.panel), ...procs(ex.solution) };
  // La solució dibuixa amb unes ordres soltes (CARRER, capítol 4): són el cos del procediment.
  const name = ex.run.split(/\s+/)[0].toUpperCase();
  if (!all[name]) {
    const lines = ex.solution.split('\n'), end = lines.map((l) => l.trim().toUpperCase()).lastIndexOf('FI');
    all[name] = ['PROC ' + name, ...lines.slice(end + 1).map((l) => '  ' + l.trim()), 'FI'].join('\n');
  }
  return Object.values(all).join('\n\n') + '\n';
}

async function waitIdle(page, sim) {
  await page.waitForFunction((el) => !el.querySelector('.sim-entrada input').disabled, await sim.elementHandle(), { timeout: 120000 });
}
async function verdict(page, sim) {
  await sim.locator('button', { hasText: 'Comprova' }).click();
  await page.waitForFunction((el) => { const r = el.querySelector('.sim-resultat'); return r && !r.hidden && r.textContent.trim() !== ''; },
    await sim.elementHandle(), { timeout: 120000 });
  await waitIdle(page, sim);
  return (await sim.locator('.sim-resultat').textContent()).trim();
}
async function setPanel(page, sim, text) {
  const ta = sim.locator('.sim-panell textarea');
  await ta.fill(text);
  await page.waitForTimeout(500);
}
async function type(page, sim, line) {
  const input = sim.locator('.sim-entrada input');
  await input.fill(line); await input.press('Enter');
  await page.waitForTimeout(100);
  await waitIdle(page, sim);
}

async function main() {
  const srv = await serve();
  const BASE = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const newPage = async (ctx) => {
    const p = await ctx.newPage(); p.errs = []; p.ext = [];
    p.on('pageerror', (e) => p.errs.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error') p.errs.push(m.text()); });
    p.on('request', (r) => { if (!r.url().startsWith(BASE) && !r.url().startsWith('data:') && !r.url().startsWith('blob:')) p.ext.push(r.url()); });
    p.on('dialog', (d) => d.accept());
    return p;
  };

  // ── 1. Totes les pàgines, a quatre mides ──
  for (const [label, width, height, touch] of VIEWS) {
    const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: touch });
    for (const f of PAGES) {
      const p = await newPage(ctx);
      await p.goto(BASE + f); await p.waitForTimeout(300);
      const r = await p.evaluate(() => {
        const bar = document.querySelector('.barra');
        return { hscroll: document.documentElement.scrollWidth > innerWidth + 1, barH: bar ? Math.round(bar.getBoundingClientRect().height) : 0 };
      });
      check(!r.hscroll && r.barH <= 70 && p.errs.length === 0 && p.ext.length === 0,
        `${label} · ${f}${r.hscroll ? ' · barra horitzontal' : ''}${r.barH > 70 ? ' · barra de dalt en dues files (' + r.barH + ' px)' : ''}${p.errs.length ? ' · errors: ' + p.errs.join(' | ') : ''}${p.ext.length ? ' · peticions a fora: ' + p.ext.join(' ') : ''}`);
      await p.close();
    }
    await ctx.close();
  }

  // ── 2. Cada exercici amb la seva solució ──
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 625 } });
  for (const f of PAGES.filter((x) => x.startsWith('curs/'))) {
    const p = await newPage(ctx);
    await p.goto(BASE + f); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
    for (const ex of exercises(f)) {
      const sim = p.locator(`.simulador[data-id="${ex.id}"]`);
      await sim.scrollIntoViewIfNeeded();
      if (ex.run) await setPanel(p, sim, fixedPanel(ex));
      else { await sim.locator('button', { hasText: 'Reinicia' }).click(); for (const line of ex.solution.split('\n')) if (line.trim()) await type(p, sim, line); }
      const v = await verdict(p, sim);
      check(v.startsWith('Correcte!'), `${f} · ${ex.id} → ${v.slice(0, 80)}`);
    }
    check(p.errs.length === 0, `${f} · sense errors de JavaScript ${p.errs.join(' | ')}`);
    await p.close();
  }

  // ── 3. Revisió 18 ──
  let p = await newPage(ctx);
  // B3: un nom sense accent.
  await p.goto(BASE + 'curs/capitol-3.html');
  let sim = p.locator('.simulador[data-id="cap3-grao"]'); await sim.scrollIntoViewIfNeeded();
  await setPanel(p, sim, 'PROC GRAO\n  AVANÇA 20 GIRA.D 90\n  AVANÇA 20 GIRA.E 90\nFI\n');
  let v = await verdict(p, sim);
  check(v.includes('Has definit GRAO, però el nom en català és GRAÓ, amb accent.'), 'B3: ' + v);
  // M1: el panell es desa i «Torna a començar» torna al text inicial.
  await p.reload(); await p.waitForTimeout(300);
  sim = p.locator('.simulador[data-id="cap3-grao"]');
  check((await sim.locator('.sim-panell textarea').inputValue()).startsWith('PROC GRAO'), 'M1: el panell de l\'exercici es recupera en tornar a la pàgina');
  await sim.locator('button', { hasText: 'Torna a començar' }).click(); await p.waitForTimeout(300);
  check((await sim.locator('.sim-panell textarea').inputValue()) === '', 'M1: «Torna a començar» torna al panell inicial');
  sim = p.locator('.simulador[data-id="cap3-error"]');
  const initial = await sim.locator('.sim-panell textarea').inputValue();
  await setPanel(p, sim, 'PROC X\nFI\n');
  await sim.locator('button', { hasText: 'Torna a començar' }).click(); await p.waitForTimeout(300);
  check((await sim.locator('.sim-panell textarea').inputValue()) === initial, 'M1: a «Troba l\'error» torna el procediment amb l\'error');
  // P1: el qüestionari, en qualsevol ordre.
  const orders = new Set();
  for (let k = 0; k < 8; k++) {
    await p.reload(); await p.waitForTimeout(150);
    orders.add((await p.locator('.quiz .pregunta').first().locator('label').allTextContents()).join('|'));
  }
  check(orders.size > 1, `P1: l'ordre de les opcions canvia (${orders.size} ordres diferents en 8 visites)`);
  const q1 = p.locator('.quiz .pregunta').first();
  await q1.locator('label', { hasText: /^\s*FI\s*$/ }).click();
  check((await q1.locator('.veredicte').textContent()) === 'Correcte!', 'P1: la bona continua sent la bona');
  await p.close();

  // U3: la portada marca els capítols fets.
  p = await newPage(ctx);
  await p.goto(BASE + 'index.html');
  await p.evaluate(() => localStorage.setItem('logocat-progres', JSON.stringify({ 'cap1-quadrat': true, 'cap7-estrella': true, 'rep1-flor': true })));
  await p.reload(); await p.waitForTimeout(200);
  const ticks = await p.locator('.llista-capitols .comptador').allTextContents();
  check(ticks[0] === '✓ fet' && ticks[6] === '✓ fet' && ticks[1] === '' && ticks[12] === '1 de 3 fets', 'U3: ' + JSON.stringify(ticks.slice(0, 13)));
  await p.close();

  // M2 i M3: desar i obrir un fitxer, i desar el dibuix.
  p = await newPage(ctx);
  await p.goto(BASE + 'simulador.html'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(300);
  await p.fill('#procediments', 'PROC Q\n  REPETEIX 4 [AVANÇA 30 GIRA.D 90]\nFI\n'); await p.waitForTimeout(500);
  let [dl] = await Promise.all([p.waitForEvent('download'), p.click('#b-desa')]);
  check(dl.suggestedFilename() === 'logocat-procediments.txt' && readFileSync(await dl.path(), 'utf8').startsWith('PROC Q'), 'M2: «Desa en un fitxer»');
  await p.setInputFiles('#fitxer', { name: 'meu.txt', mimeType: 'text/plain', buffer: Buffer.from('PROC TRI\n  REPETEIX 3 [AVANÇA 40 GIRA.D 120]\nFI\n') });
  await p.waitForTimeout(600);
  check((await p.inputValue('#procediments')).startsWith('PROC TRI'), 'M2: «Obre un fitxer»');
  await p.fill('#monitor .sim-entrada input', 'TRI'); await p.press('#monitor .sim-entrada input', 'Enter'); await p.waitForTimeout(1500);
  [dl] = await Promise.all([p.waitForEvent('download'), p.click('#b-dibuix')]);
  const png = readFileSync(await dl.path());
  check(dl.suggestedFilename() === 'logocat-dibuix.png' && png.slice(1, 4).toString() === 'PNG', 'M3: «Desa el dibuix»');
  check(p.errs.length === 0, 'Editor lliure: sense errors de JavaScript ' + p.errs.join(' | '));
  await p.close(); await ctx.close();

  // U5: la barra de tecles, només amb pantalla tàctil.
  const touch = await browser.newContext({ viewport: { width: 1180, height: 740 }, hasTouch: true });
  p = await newPage(touch);
  await p.goto(BASE + 'curs/capitol-2.html');
  sim = p.locator('.simulador').first(); await sim.scrollIntoViewIfNeeded();
  const input = sim.locator('.sim-entrada input');
  check(await p.locator('.tecles').isHidden(), 'U5: la barra no hi és mentre no s\'escriu');
  await input.tap(); await p.waitForTimeout(200);
  check(await p.locator('.tecles').isVisible(), 'U5: la barra surt en escriure a ?');
  await input.fill('REPETEIX 4 ');
  await p.locator('.tecla', { hasText: '[' }).tap();
  check((await input.inputValue()) === 'REPETEIX 4 [', 'U5: la tecla [ escriu a la línia ?');
  await input.fill('AVANÇA 20'); await input.press('Enter'); await waitIdle(p, sim);
  await input.tap(); await p.locator('.tecla', { hasText: '↑' }).tap();
  check((await input.inputValue()) === 'AVANÇA 20', 'U5: la tecla ↑ recupera l\'última línia');
  await p.close(); await touch.close();
  const desk = await browser.newContext({ viewport: { width: 1366, height: 625 } });
  p = await newPage(desk);
  await p.goto(BASE + 'curs/capitol-2.html');
  await p.locator('.simulador .sim-entrada input').first().focus();
  check(await p.locator('.tecles').count() === 0, 'U5: amb ratolí no hi ha barra de tecles');
  await p.close(); await desk.close();

  await browser.close(); srv.close();
  console.log(fails ? `\n${fails} FALLADES` : '\nTot correcte');
  process.exit(fails ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
