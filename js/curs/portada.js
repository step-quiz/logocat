// Portada: el botó del tema, quins capítols s'han fet i quants reptes de cada nivell
// (progrés desat al navegador).
import { isDone } from './progres.js';
import { initTheme } from '../ui/tema.js';

initTheme();

// Capítols: «✓ fet» quan l'exercici clau està resolt (owner, revisió 18, U3).
document.querySelectorAll('[data-clau]').forEach((a) => {
  if (!isDone(a.dataset.clau)) return;
  const c = a.querySelector('.comptador');
  c.textContent = '✓ fet'; c.classList.add('tot');
});

document.querySelectorAll('[data-reptes]').forEach((a) => {
  const ids = a.dataset.reptes.split(' ');
  const done = ids.filter(isDone).length;
  if (!done) return;
  const c = a.querySelector('.comptador');
  c.textContent = done === ids.length ? '✓ fet' : `${done} de ${ids.length} fets`;
  c.classList.toggle('tot', done === ids.length);
});
