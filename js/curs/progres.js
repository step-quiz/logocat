// Progrés de l'alumne, desat només al seu navegador (localStorage).
// Cap dada surt de l'ordinador de l'alumne.
const KEY = 'logocat-progres';

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
}

export function isDone(id) { return !!read()[id]; }

export function markDone(id) {
  const p = read();
  if (p[id]) return;
  p[id] = true;
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { /* sense emmagatzematge */ }
  document.dispatchEvent(new CustomEvent('logocat:progres', { detail: { id } }));
}
