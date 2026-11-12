// Barra de tecles per a pantalles tàctils (owner, revisió 18, U5).
// Al teclat de l'iPad, [ ] són a la pàgina de símbols i : . a la de nombres; tampoc hi ha la
// fletxa amunt. La barra surt només amb pantalla tàctil i mentre s'escriu a la línia «?» o al
// panell de procediments. Es col·loca a la vora de la part visible de la pantalla (sobre el
// teclat) que queda més lluny del camp, perquè no el tapi mai.
// No és el kbd-accessory.js de step-quiz-commons: aquell treballa amb un sol editor per pàgina.
const KEYS = ['[', ']', ':', '.', '+', '-', '*', '/', '=', '<', '>'];

const isField = (el) => !!(el && el.matches && (el.matches('.sim-entrada input') || el.matches('.pila textarea')));

/** Escriu a la posició del cursor, i així el desfer del navegador continua funcionant. */
function insert(field, text) {
  let ok = false;
  try { ok = document.execCommand('insertText', false, text); } catch (e) { ok = false; }
  if (!ok) {
    field.setRangeText(text, field.selectionStart, field.selectionEnd, 'end');
    field.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

export function initKeyBar() {
  if (!window.matchMedia || !window.matchMedia('(pointer: coarse)').matches) return;
  if (document.querySelector('.tecles')) return;
  const bar = document.createElement('div');
  bar.className = 'tecles'; bar.hidden = true;
  bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Tecles de LOGO');
  let field = null;

  const key = (label, act, title) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tecla'; b.textContent = label; b.tabIndex = -1;
    b.setAttribute('aria-label', title || 'Escriu ' + label);
    // Només mousedown: el botó no pren el focus i el teclat no es tanca. Cancel·lar touchstart
    // o pointerdown cancel·laria també el clic (step-quiz-commons, kbd-accessory.js).
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', () => { if (field) { field.focus(); act(field); } });
    bar.appendChild(b);
    return b;
  };
  KEYS.forEach((k) => key(k, (f) => insert(f, k)));
  const up = key('↑', (f) => f.logocatMonitor && f.logocatMonitor.historyBack(), "L'última línia");
  document.body.appendChild(bar);

  const place = () => {
    if (!field || bar.hidden) return;
    const vv = window.visualViewport || { offsetTop: 0, offsetLeft: 0, height: window.innerHeight, width: window.innerWidth };
    const r = field.getBoundingClientRect();
    const middle = r.top + r.height / 2 - vv.offsetTop;            // on és el camp dins la part visible
    const top = middle > vv.height / 2 ? vv.offsetTop : vv.offsetTop + vv.height - bar.offsetHeight;
    bar.style.top = Math.max(0, top) + 'px';
    bar.style.left = vv.offsetLeft + 'px';
    bar.style.width = vv.width + 'px';
  };
  document.addEventListener('focusin', (e) => {
    if (!isField(e.target)) return;
    field = e.target;
    up.hidden = !field.logocatMonitor;
    bar.hidden = false;
    place();
  });
  document.addEventListener('focusout', (e) => {
    if (e.target !== field) return;
    setTimeout(() => { if (!isField(document.activeElement)) { bar.hidden = true; field = null; } }, 150);
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', place);
    window.visualViewport.addEventListener('scroll', place);
  }
  window.addEventListener('scroll', place, { passive: true });
}
