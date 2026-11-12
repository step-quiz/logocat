// Portada: quants reptes de cada nivell s'han fet (progrés desat al navegador).
import { isDone } from './progres.js';

document.querySelectorAll('[data-reptes]').forEach((a) => {
  const ids = a.dataset.reptes.split(' ');
  const done = ids.filter(isDone).length;
  if (!done) return;
  const c = a.parentElement.querySelector('.comptador');
  c.textContent = done === ids.length ? '✓ fet' : `${done} de ${ids.length} fets`;
  c.classList.toggle('tot', done === ids.length);
});
