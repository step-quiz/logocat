// Activitats que no són el simulador: «Què dibuixarà?» i el qüestionari.
import { drawingOf } from './monitor.js';

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

/** Un dibuix petit (SVG) a partir del resultat d'executar un codi. */
function thumbnail(d, box) {
  const svg = svgEl('svg', { viewBox: `${box.x} ${box.y} ${box.w} ${box.h}`, 'aria-hidden': 'true' });
  svg.appendChild(svgEl('circle', { cx: 0, cy: 0, r: 2.2, class: 'mini-inici' }));
  const path = d.segments.map((s) => `M${s.x1} ${-s.y1}L${s.x2} ${-s.y2}`).join('');
  svg.appendChild(svgEl('path', { d: path, class: 'mini-trac' }));
  const p = d.pose, rad = p.heading * Math.PI / 180;
  const pts = [[0, 11], [-6, -5], [6, -5]].map(([a, b]) =>
    `${(p.x + a * Math.cos(rad) + b * Math.sin(rad)).toFixed(1)},${(-(p.y - a * Math.sin(rad) + b * Math.cos(rad))).toFixed(1)}`).join(' ');
  svg.appendChild(svgEl('polygon', { points: pts, class: 'mini-tortuga' + (d.pen === 'down' ? ' mini-tortuga--plena' : '') }));
  return svg;
}

/**
 * «Què dibuixarà?»
 * <div class="prediu" data-id="…">
 *   <pre class="codi">…</pre>
 *   <script type="text/logo" data-correcta data-perque="…">codi</script>   (una per opció)
 * </div>
 */
export function mountPredict(root, { onSolved } = {}) {
  const options = [...root.querySelectorAll('script[type="text/logo"]')].map((s) => ({
    correct: s.hasAttribute('data-correcta'), why: s.dataset.perque || '', d: drawingOf(s.textContent),
  }));
  for (let i = options.length - 1; i > 0; i--) {           // ordre a l'atzar a cada visita
    const j = Math.floor(Math.random() * (i + 1)); [options[i], options[j]] = [options[j], options[i]];
  }
  let x0 = -14, x1 = 14, y0 = -14, y1 = 14;
  for (const o of options) for (const s of o.d.segments) {
    x0 = Math.min(x0, s.x1 - 14, s.x2 - 14); x1 = Math.max(x1, s.x1 + 14, s.x2 + 14);
    y0 = Math.min(y0, -s.y1 - 14, -s.y2 - 14); y1 = Math.max(y1, -s.y1 + 14, -s.y2 + 14);
  }
  const box = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  const list = document.createElement('div'); list.className = 'prediu-opcions';
  const out = document.createElement('p'); out.className = 'prediu-resposta'; out.setAttribute('role', 'status'); out.hidden = true;
  options.forEach((o, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'prediu-opcio';
    const letter = 'ABC'[i] || String(i + 1);
    b.setAttribute('aria-label', 'Opció ' + letter);
    b.appendChild(thumbnail(o.d, box));
    const tag = document.createElement('span'); tag.textContent = letter; b.appendChild(tag);
    b.addEventListener('click', () => {
      list.querySelectorAll('.prediu-opcio').forEach((x) => x.classList.remove('es-bona', 'es-dolenta'));
      b.classList.add(o.correct ? 'es-bona' : 'es-dolenta');
      out.hidden = false;
      out.className = 'prediu-resposta ' + (o.correct ? 'es-bona' : 'es-dolenta');
      out.textContent = (o.correct ? 'Correcte! ' : 'No és aquesta. ') + o.why;
      if (o.correct && onSolved) onSolved();
    });
    list.appendChild(b);
  });
  root.appendChild(list); root.appendChild(out);
}

/**
 * Qüestionari.
 * <div class="quiz" data-id="…">
 *   <fieldset class="pregunta" data-correcta="1">      (índex de l'opció bona, des de 0)
 *     <legend>…</legend> <label><input type="radio"> …</label> … <p class="explicacio" hidden>…</p>
 *   </fieldset>
 * </div>
 */
export function mountQuiz(root, { onSolved } = {}) {
  const questions = [...root.querySelectorAll('.pregunta')];
  const solved = new Set();
  questions.forEach((q, qi) => {
    const right = Number(q.dataset.correcta);
    const labels = [...q.querySelectorAll('label')];
    const why = q.querySelector('.explicacio');
    const verdict = document.createElement('p'); verdict.className = 'veredicte'; verdict.setAttribute('role', 'status'); verdict.hidden = true;
    q.insertBefore(verdict, why);
    labels.forEach((lab, i) => {
      const input = lab.querySelector('input');
      input.name = (root.dataset.id || 'quiz') + '-' + qi;
      input.addEventListener('change', () => {
        labels.forEach((x) => x.classList.remove('es-bona', 'es-dolenta'));
        const ok = i === right;
        lab.classList.add(ok ? 'es-bona' : 'es-dolenta');
        verdict.hidden = false;
        verdict.className = 'veredicte ' + (ok ? 'es-bona' : 'es-dolenta');
        verdict.textContent = ok ? 'Correcte!' : 'No és aquesta. Torna-ho a provar.';
        if (why) why.hidden = !ok;
        if (ok) solved.add(qi); else solved.delete(qi);
        if (solved.size === questions.length && onSolved) onSolved();
      });
    });
  });
}
