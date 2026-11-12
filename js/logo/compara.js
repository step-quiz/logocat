// Correcció de dibuixos (docs/DECISIONS.md, D2; mètode per punts des del capítol 8).
// Un dibuix és una llista de segments. Es compara QUINA tinta hi ha, no com s'ha fet:
// ni l'ordre ni el sentit dels traços importen, i un traç repassat compta una vegada.
//
// Mètode (owner, 2026-11-11, revisió 10, G5). Les corbes de la tortuga són centenars de
// trossos de menys d'1,5 passos, cadascun en una recta diferent, i la comparació antiga per
// rectes no les veia. Ara:
//  1. Tinta neta: cada traç amb el llapis es parteix en trossos de mig pas com a molt; un
//     tros és esborrat si un traç de goma POSTERIOR li passa a menys d'ERASE_TOL.
//  2. Un tros de tinta d'un dibuix està cobert si a menys de DIST_TOL hi ha tinta de l'altre
//     que va en una direcció semblant (menys de 20°: una línia que en creua una altra no la
//     cobreix).
//  3. Els trossos no coberts que es toquen formen trams; els trams de menys de MIN_LEN no
//     compten (una imprecisió petita no és un error).

const DIST_TOL = 1.5;                // passos de tortuga
const MIN_LEN = 1.5;                 // trams més curts no compten
const STEP = 0.5;                    // mida màxima d'un tros
const ERASE_TOL = 1;                 // la goma esborra el que té a menys d'1 pas
const DIR_TOL = Math.sin(20 * Math.PI / 180);
const CELL = 4;                      // graella per trobar la tinta propera de pressa
const JOIN = 0.05;                   // dos trossos es toquen si els extrems són a menys d'això

const len = (s) => Math.hypot(s.x2 - s.x1, s.y2 - s.y1);

function dist(x, y, s) {
  const dx = s.x2 - s.x1, dy = s.y2 - s.y1, L2 = dx * dx + dy * dy;
  const t = L2 ? Math.max(0, Math.min(1, ((x - s.x1) * dx + (y - s.y1) * dy) / L2)) : 0;
  return Math.hypot(x - s.x1 - t * dx, y - s.y1 - t * dy);
}

/** Graella: cel·la → segments que hi passen a menys de `tol`. */
function grid(segs, tol) {
  const m = new Map();
  for (const s of segs) {
    const i0 = Math.floor((Math.min(s.x1, s.x2) - tol) / CELL), i1 = Math.floor((Math.max(s.x1, s.x2) + tol) / CELL);
    const j0 = Math.floor((Math.min(s.y1, s.y2) - tol) / CELL), j1 = Math.floor((Math.max(s.y1, s.y2) + tol) / CELL);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      const k = i + ',' + j;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(s);
    }
  }
  return m;
}
const near = (m, x, y) => m.get(Math.floor(x / CELL) + ',' + Math.floor(y / CELL)) || [];

/** Clau d'un traç sense sentit: els dos extrems arrodonits, en ordre. */
const key = (x1, y1, x2, y2) => {
  const a = Math.round(x1 * 1e4) + ',' + Math.round(y1 * 1e4), b = Math.round(x2 * 1e4) + ',' + Math.round(y2 * 1e4);
  return a < b ? a + ';' + b : b + ';' + a;
};

/** Tinta neta en trossos: [{ x1, y1, x2, y2, ux, uy, len, src }]. */
function inkPieces(segments) {
  const erasers = segments.map((s, i) => ({ ...s, i })).filter((s) => s.erase && len(s) > 1e-9);
  const m = grid(erasers, ERASE_TOL), out = [];
  // Un traç repassat compta una vegada (revisió 18, B5): de cada traç repetit es fa servir
  // només l'últim, que és el que mana si pel mig hi ha passat la goma. Sense això, un dibuix
  // repassat moltes vegades (REPETEIX 1000 [QUADRAT 50]) feia que «Comprova» trigués minuts.
  const last = new Map();
  segments.forEach((s, i) => { if (!s.erase) last.set(key(s.x1, s.y1, s.x2, s.y2), i); });
  const seen = new Set();
  segments.forEach((s, i) => {
    const L = len(s);
    if (s.erase || L < 1e-9 || last.get(key(s.x1, s.y1, s.x2, s.y2)) !== i) return;
    const n = Math.ceil(L / STEP), ux = (s.x2 - s.x1) / L, uy = (s.y2 - s.y1) / L;
    for (let k = 0; k < n; k++) {
      const a = k / n, b = (k + 1) / n;
      const q = { x1: s.x1 + (s.x2 - s.x1) * a, y1: s.y1 + (s.y2 - s.y1) * a, x2: s.x1 + (s.x2 - s.x1) * b, y2: s.y1 + (s.y2 - s.y1) * b, ux, uy, len: L / n, src: i };
      const mx = (q.x1 + q.x2) / 2, my = (q.y1 + q.y2) / 2;
      if (near(m, mx, my).some((e) => e.i > i && dist(mx, my, e) <= ERASE_TOL)) continue;
      const pk = key(q.x1, q.y1, q.x2, q.y2);
      if (!seen.has(pk)) { seen.add(pk); out.push(q); }
    }
  });
  return out;
}

function isCovered(m, q) {
  const x = (q.x1 + q.x2) / 2, y = (q.y1 + q.y2) / 2;
  return near(m, x, y).some((s) => Math.abs(q.ux * s.uy - q.uy * s.ux) <= DIR_TOL && dist(x, y, s) <= DIST_TOL + 1e-9);
}

/**
 * Trams de la tinta A coberts (true) o no (false) per la tinta B: [{ cov, len, segs }].
 * Un tram és un grup de trossos amb el mateix estat que es toquen, en qualsevol ordre.
 */
function runs(A, B) {
  const m = grid(B, DIST_TOL);
  for (const q of A) q.cov = isCovered(m, q);
  const parent = A.map((_, i) => i);
  const find = (i) => { while (parent[i] !== i) i = parent[i] = parent[parent[i]]; return i; };
  const cells = new Map();
  A.forEach((q, i) => {
    for (const [x, y] of [[q.x1, q.y1], [q.x2, q.y2]]) {
      const cx = Math.floor(x / JOIN), cy = Math.floor(y / JOIN);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        for (const j of cells.get((cx + dx) + ',' + (cy + dy)) || []) {
          const o = A[j];
          if (o.cov === q.cov && Math.min(Math.hypot(o.x1 - x, o.y1 - y), Math.hypot(o.x2 - x, o.y2 - y)) <= JOIN) parent[find(i)] = find(j);
        }
      }
      const k = cx + ',' + cy;
      if (!cells.has(k)) cells.set(k, []);
      cells.get(k).push(i);
    }
  });
  const groups = new Map();
  A.forEach((q, i) => {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, { cov: q.cov, len: 0, segs: [] });
    const g = groups.get(r), last = g.segs[g.segs.length - 1];
    if (last && last.src === q.src && Math.hypot(last.x2 - q.x1, last.y2 - q.y1) < 1e-9) { last.x2 = q.x2; last.y2 = q.y2; }   // trossos seguits del mateix traç: un sol segment
    else g.segs.push({ src: q.src, x1: q.x1, y1: q.y1, x2: q.x2, y2: q.y2 });
    g.len += q.len;
  });
  const out = [...groups.values()];
  for (const r of out) r.segs = r.segs.map(({ x1, y1, x2, y2 }) => ({ x1, y1, x2, y2 }));
  return out;
}

const pick = (rs, cov, min) => rs.filter((r) => r.cov === cov && r.len >= min);
const total = (rs) => rs.reduce((t, r) => t + r.len, 0);

/**
 * Compara el dibuix de l'alumne amb l'objectiu.
 * Retorna { ok, matching, extra, missing, error } — llistes de segments (un tram és una
 * cadena de segments seguits); `error` és la longitud total que sobra més la que falta
 * (per triar l'objectiu més proper).
 */
export function compareDrawings(student, target) {
  const A = inkPieces(student), B = inkPieces(target);
  const ra = runs(A, B), rb = runs(B, A);
  const extra = pick(ra, false, MIN_LEN), missing = pick(rb, false, MIN_LEN);
  return {
    ok: extra.length === 0 && missing.length === 0,
    matching: pick(ra, true, 0).flatMap((r) => r.segs),
    extra: extra.flatMap((r) => r.segs),
    missing: missing.flatMap((r) => r.segs),
    error: total(pick(ra, false, 0)) + total(pick(rb, false, 0)),
  };
}

/** La tortuga ha acabat on i com havia d'acabar? */
export function comparePose(a, b) {
  const dh = Math.abs(((a.heading - b.heading) % 360 + 540) % 360 - 180);
  return {
    position: Math.abs(a.x - b.x) <= DIST_TOL && Math.abs(a.y - b.y) <= DIST_TOL,
    heading: dh <= 1,
  };
}
