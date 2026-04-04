// ════════════════════════════════════════════════════════
// constants.js — Namespace global, utilitats pures, constants
// ════════════════════════════════════════════════════════

// Namespace global
window.L = window.L || {};


// ── Seguretat: sanitització HTML ──

const _SAFE_TAGS  = new Set(['em', 'strong', 'code', 'br', 'span', 'b', 'i', 'u']);
const _SAFE_ATTRS = new Set(['class', 'title']);

function sanitizeHtml(html) {
  if (typeof html !== 'string') return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.textContent);
    if (node.nodeType !== Node.ELEMENT_NODE) return document.createTextNode('');
    const tag = node.tagName.toLowerCase();
    if (!_SAFE_TAGS.has(tag)) {
      const frag = document.createDocumentFragment();
      for (const child of node.childNodes) frag.appendChild(walk(child));
      return frag;
    }
    const el = document.createElement(tag);
    for (const attr of node.attributes) {
      if (_SAFE_ATTRS.has(attr.name.toLowerCase())) el.setAttribute(attr.name, attr.value);
    }
    for (const child of node.childNodes) el.appendChild(walk(child));
    return el;
  }

  const frag = document.createDocumentFragment();
  for (const child of doc.body.childNodes) frag.appendChild(walk(child));
  const tmp = document.createElement('div');
  tmp.appendChild(frag);
  return tmp.innerHTML;
}

function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function escRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


// ── Levenshtein (per a suggeriments d'errors) ──

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}


// ── Mapes de comandes i keywords per idioma ──

const CMD_MAP = {
  ca: { 'avança': 'forward', 'retrocedeix': 'back', 'gira.dreta': 'right', 'gira.esquerra': 'left', 'posa.llapis': 'pendown', 'treu.llapis': 'penup', 'centre': 'home', 'neteja': 'clear' },
  es: { 'avanza': 'forward', 'retrocede': 'back', 'gira.derecha': 'right', 'gira.izquierda': 'left', 'pon.lapiz': 'pendown', 'quita.lapiz': 'penup', 'centro': 'home', 'limpia': 'clear' },
  en: { 'forward': 'forward', 'back': 'back', 'right': 'right', 'left': 'left', 'pen.down': 'pendown', 'pen.up': 'penup', 'home': 'home', 'clear': 'clear' },
};

const KW_MAP = {
  ca: { 'repeteix': 'repeat', 'procediment': 'procedure' },
  es: { 'repite': 'repeat', 'procedimiento': 'procedure' },
  en: { 'repeat': 'repeat', 'procedure': 'procedure' },
};

const NEEDS_ARG = new Set(['forward', 'back', 'right', 'left']);


// ── Constants d'execució ──

const MAX_STEPS    = 50000;
const MAX_DEPTH    = 500;
const SPEED_MS     = [500, 200, 80, 20, 5, 0];
const HINT_DELAY_S = 30;

const LS_CODE    = 'logo-code-v1';
const LS_LIGHT   = 'logo-light';
const LS_ONBOARD = 'logo-onboard-done';


// ── Exporta al namespace ──

L.sanitizeHtml = sanitizeHtml;
L.escHtml      = escHtml;
L.escRegex     = escRegex;
L.levenshtein  = levenshtein;
L.CMD_MAP      = CMD_MAP;
L.KW_MAP       = KW_MAP;
L.NEEDS_ARG    = NEEDS_ARG;
L.MAX_STEPS    = MAX_STEPS;
L.MAX_DEPTH    = MAX_DEPTH;
L.SPEED_MS     = SPEED_MS;
L.HINT_DELAY_S = HINT_DELAY_S;
L.LS_CODE      = LS_CODE;
L.LS_LIGHT     = LS_LIGHT;
L.LS_ONBOARD   = LS_ONBOARD;
