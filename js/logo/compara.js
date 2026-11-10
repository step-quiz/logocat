// Correcció de dibuixos (docs/DECISIONS.md, D2).
// Un dibuix és una llista de segments. Es compara QUINA tinta hi ha, no com s'ha fet:
// ni l'ordre ni el sentit dels traços importen, i un traç repassat compta una vegada.
//
// Mètode: cada segment viu en una recta (angle θ, distància ρ a l'origen). Els segments
// de la mateixa recta es converteixen en intervals sobre aquella recta i s'uneixen.
// Comparar dos dibuixos és restar intervals recta per recta.

const ANG_TOL = 1 * Math.PI / 180;   // rectes amb menys d'1° de diferència són la mateixa
const DIST_TOL = 1.5;                // passos de tortuga
const MIN_LEN = 1.5;                 // trossos més curts no compten

function lineOf(seg) {
  let theta = Math.atan2(seg.y2 - seg.y1, seg.x2 - seg.x1);
  if (theta < 0) theta += Math.PI;
  if (theta >= Math.PI - ANG_TOL / 2) theta -= Math.PI;       // ≈180° és la mateixa recta que ≈0°
  const ux = Math.cos(theta), uy = Math.sin(theta);
  const rho = -seg.x1 * uy + seg.y1 * ux;
  const a = seg.x1 * ux + seg.y1 * uy, b = seg.x2 * ux + seg.y2 * uy;
  return { theta, rho, ux, uy, lo: Math.min(a, b), hi: Math.max(a, b) };
}

function addInterval(list, lo, hi) {
  const out = [];
  for (const [a, b] of list) {
    if (b < lo - 1e-6 || a > hi + 1e-6) out.push([a, b]);
    else { lo = Math.min(lo, a); hi = Math.max(hi, b); }
  }
  out.push([lo, hi]);
  return out.sort((p, q) => p[0] - q[0]);
}

function subInterval(list, lo, hi) {
  const out = [];
  for (const [a, b] of list) {
    if (b <= lo || a >= hi) { out.push([a, b]); continue; }
    if (a < lo) out.push([a, lo]);
    if (b > hi) out.push([hi, b]);
  }
  return out;
}

const sameLine = (g, l) => Math.abs(g.theta - l.theta) < ANG_TOL && Math.abs(g.rho - l.rho) < DIST_TOL;

/** Agrupa els segments per rectes, amb la unió d'intervals de cada una. */
export function coverage(segments) {
  const groups = [];
  for (const seg of segments) {
    if (Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1) < 1e-6) continue;
    const l = lineOf(seg);
    let g = groups.find((x) => sameLine(x, l));
    if (!g) { g = { theta: l.theta, rho: l.rho, ux: l.ux, uy: l.uy, ivs: [] }; groups.push(g); }
    g.ivs = seg.erase ? subInterval(g.ivs, l.lo, l.hi) : addInterval(g.ivs, l.lo, l.hi);
  }
  return groups.filter((g) => g.ivs.length);
}

function toSegments(g, ivs) {
  return ivs.filter(([a, b]) => b - a >= MIN_LEN).map(([a, b]) => ({
    x1: a * g.ux - g.rho * g.uy, y1: a * g.uy + g.rho * g.ux,
    x2: b * g.ux - g.rho * g.uy, y2: b * g.uy + g.rho * g.ux,
  }));
}

function minus(A, B) {
  const out = [];
  for (const g of A) {
    let ivs = g.ivs;
    for (const h of B) if (sameLine(h, g)) for (const [a, b] of h.ivs) ivs = subInterval(ivs, a - DIST_TOL / 2, b + DIST_TOL / 2);
    out.push(...toSegments(g, ivs));
  }
  return out;
}

function common(A, B) {
  const out = [];
  for (const g of A) {
    for (const h of B) {
      if (!sameLine(h, g)) continue;
      const ivs = [];
      for (const [a, b] of g.ivs) for (const [c, d] of h.ivs) {
        const lo = Math.max(a, c), hi = Math.min(b, d);
        if (hi > lo) ivs.push([lo, hi]);
      }
      out.push(...toSegments(g, ivs));
    }
  }
  return out;
}

const total = (segs) => segs.reduce((s, q) => s + Math.hypot(q.x2 - q.x1, q.y2 - q.y1), 0);

/**
 * Compara el dibuix de l'alumne amb l'objectiu.
 * Retorna { ok, matching, extra, missing, error } — llistes de segments; `error` és la
 * longitud total que sobra més la que falta (per triar l'objectiu més proper).
 */
export function compareDrawings(student, target) {
  const A = coverage(student), B = coverage(target);
  const extra = minus(A, B), missing = minus(B, A);
  return { ok: extra.length === 0 && missing.length === 0, matching: common(A, B), extra, missing, error: total(extra) + total(missing) };
}

/** La tortuga ha acabat on i com havia d'acabar? */
export function comparePose(a, b) {
  const dh = Math.abs(((a.heading - b.heading) % 360 + 540) % 360 - 180);
  return {
    position: Math.abs(a.x - b.x) <= DIST_TOL && Math.abs(a.y - b.y) <= DIST_TOL,
    heading: dh <= 1,
  };
}
