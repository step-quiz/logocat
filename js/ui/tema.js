// Tema clar / fosc, compartit per totes les pàgines. Es desa a localStorage.
const THEME_KEY = 'logocat-tema';

export function initTheme() {
  let t = null;
  try { t = localStorage.getItem(THEME_KEY); } catch (e) { /* sense emmagatzematge */ }
  if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = t;
  const b = document.getElementById('boto-tema');
  if (!b) return;
  const label = () => b.setAttribute('aria-label', document.documentElement.dataset.theme === 'dark' ? 'Canvia a tema clar' : 'Canvia a tema fosc');
  label();
  b.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next; label();
    try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* sense emmagatzematge */ }
  });
}
