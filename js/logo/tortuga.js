// La tortuga i el seu camp (docs/LANGUAGE-SPEC.md §5).
// Camp: 280 × 240 passos; x ∈ [−140, 140), y ∈ [−120, 120). Orientació: 0 = amunt, horari.
import { LogoError } from './missatges.js';

export const FIELD = { w: 280, h: 240, xmin: -140, xmax: 140, ymin: -120, ymax: 120 };
const EPS = 1e-9;

export class Turtle {
  constructor() { this.reset(); }

  /** Estat inicial complet (botó «Reinicia»). */
  reset() {
    this.x = 0; this.y = 0; this.heading = 0;
    this.pen = 'down';            // 'down' | 'up' | 'erase'
    this.color = 1; this.bg = 0;
    this.visible = true;
    this.mode = 'wrap';           // 'wrap' | 'fence' | 'window'
    this.segments = [];           // { x1, y1, x2, y2, color, erase }
    this.path = [];               // trossos de l'últim desplaçament
  }

  snapshot() {
    const { x, y, heading, pen, color, bg, visible, mode } = this;
    return { x, y, heading, pen, color, bg, visible, mode, segments: this.segments.slice(), path: [] };
  }
  restore(s) { Object.assign(this, s, { segments: s.segments.slice(), path: [] }); }
  pose() { return { x: this.x, y: this.y, heading: this.heading }; }

  turn(deg) { this.heading = (((this.heading + deg) % 360) + 360) % 360; }
  setHeading(deg) { this.heading = ((deg % 360) + 360) % 360; }

  _stroke(x1, y1, x2, y2, out) {
    this.path.push({ x1, y1, x2, y2 });           // el camí, amb llapis o sense
    if (this.pen === 'up') return;
    if (Math.abs(x2 - x1) < EPS && Math.abs(y2 - y1) < EPS) return;
    const seg = { x1, y1, x2, y2, color: this.color, erase: this.pen === 'erase' };
    this.segments.push(seg); out.push(seg);
  }

  /** Avança `dist` passos (negatiu = enrere). Retorna els segments nous. */
  forward(dist) {
    const out = [];
    this.path = [];
    const sign = dist < 0 ? -1 : 1;
    const rad = this.heading * Math.PI / 180;
    const dx = Math.sin(rad) * sign, dy = Math.cos(rad) * sign;
    let left = Math.abs(dist);
    return this._travel(dx, dy, left, out);
  }

  _travel(dx, dy, left, out) {
    if (this.mode !== 'wrap') {
      const nx = this.x + dx * left, ny = this.y + dy * left;
      if (this.mode === 'fence' &&
          (nx < FIELD.xmin - EPS || nx > FIELD.xmax + EPS || ny < FIELD.ymin - EPS || ny > FIELD.ymax + EPS)) {
        throw new LogoError('fence');
      }
      this._stroke(this.x, this.y, nx, ny, out);
      this.x = nx; this.y = ny;
      return out;
    }
    let guard = 0;
    while (left > EPS && guard++ < 100000) {
      let tx = Infinity, ty = Infinity;
      if (dx > EPS) tx = (FIELD.xmax - this.x) / dx; else if (dx < -EPS) tx = (FIELD.xmin - this.x) / dx;
      if (dy > EPS) ty = (FIELD.ymax - this.y) / dy; else if (dy < -EPS) ty = (FIELD.ymin - this.y) / dy;
      const t = Math.min(left, tx, ty);
      const nx = this.x + dx * t, ny = this.y + dy * t;
      this._stroke(this.x, this.y, nx, ny, out);
      this.x = nx; this.y = ny; left -= t;
      if (left <= EPS) break;
      if (tx <= ty + EPS && Math.abs(t - tx) < 1e-7) this.x = dx > 0 ? FIELD.xmin : FIELD.xmax;
      if (ty <= tx + EPS && Math.abs(t - ty) < 1e-7) this.y = dy > 0 ? FIELD.ymin : FIELD.ymax;
    }
    if (this.x >= FIELD.xmax - EPS) this.x -= FIELD.w;
    if (this.y >= FIELD.ymax - EPS) this.y -= FIELD.h;
    return out;
  }

  /** Va a (x, y) en línia recta, dibuixant si el llapis és a baix. */
  moveTo(x, y) {
    const out = [];
    this.path = [];
    const dx = x - this.x, dy = y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < EPS) return out;
    if (this.mode === 'wrap') { this._stroke(this.x, this.y, x, y, out); this.x = x; this.y = y; return out; }
    return this._travel(dx / d, dy / d, d, out);
  }

  /** CENTRE: al mig, mirant amunt, sense dibuixar mai. */
  home() { this.x = 0; this.y = 0; this.heading = 0; }
  clean() { this.segments = []; }
}
