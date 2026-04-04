// ════════════════════════════════════════════════════════
// canvas.js — Canvas, tortuga, i lògica de moviment unificada
//
// MILLORA: applyTurtleCommand() és la font única de veritat
// per al moviment de la tortuga. Tant l'intèrpret real com
// la previsualització de reptes la utilitzen.
// ════════════════════════════════════════════════════════

// ── Gestió del canvas ──

function setupCanvases() {
  const S     = L.state;
  const area  = document.getElementById('canvas-area');
  const cDraw = document.getElementById('canvas-draw');
  const cTurt = document.getElementById('canvas-turtle');
  if (!area || !cDraw || !cTurt) return;

  const dpr = window.devicePixelRatio || 1;
  const w   = area.clientWidth;
  const h   = area.clientHeight;
  S.canvasW = w;
  S.canvasH = h;

  for (const c of [cDraw, cTurt]) {
    c.width  = w * dpr;
    c.height = h * dpr;
    c.style.width  = w + 'px';
    c.style.height = h + 'px';
  }

  S.ctxDraw  = cDraw.getContext('2d');
  S.ctxDraw.scale(dpr, dpr);
  S.ctxTurtle = cTurt.getContext('2d');
  S.ctxTurtle.scale(dpr, dpr);

  redrawAll();
}


// ── Redibuixar tot ──

function redrawAll() {
  const S = L.state;
  if (!S.ctxDraw) return;

  S.ctxDraw.clearRect(0, 0, S.canvasW, S.canvasH);
  const cx = S.canvasW / 2;
  const cy = S.canvasH / 2;

  // Eixos de referència
  S.ctxDraw.strokeStyle = 'rgba(0,230,118,.08)';
  S.ctxDraw.lineWidth   = 1;
  S.ctxDraw.beginPath();
  S.ctxDraw.moveTo(cx, 0);
  S.ctxDraw.lineTo(cx, S.canvasH);
  S.ctxDraw.moveTo(0, cy);
  S.ctxDraw.lineTo(S.canvasW, cy);
  S.ctxDraw.stroke();

  // Redibuixar tots els segments
  for (const seg of S.drawHistory) {
    S.ctxDraw.strokeStyle = seg.color;
    S.ctxDraw.lineWidth   = seg.width;
    S.ctxDraw.lineCap     = 'round';
    S.ctxDraw.beginPath();
    S.ctxDraw.moveTo(cx + seg.x1, cy + seg.y1);
    S.ctxDraw.lineTo(cx + seg.x2, cy + seg.y2);
    S.ctxDraw.stroke();
  }

  drawTurtle();
}


// ── Dibuixar la tortuga ──

function drawTurtle() {
  const S = L.state;
  if (!S.ctxTurtle) return;

  S.ctxTurtle.clearRect(0, 0, S.canvasW, S.canvasH);
  const t   = S.turtle;
  const cx  = S.canvasW / 2 + t.x;
  const cy  = S.canvasH / 2 + t.y;
  const rad = t.heading * Math.PI / 180;
  const sz  = 12;

  S.ctxTurtle.save();
  S.ctxTurtle.translate(cx, cy);
  S.ctxTurtle.rotate(rad);

  S.ctxTurtle.beginPath();
  S.ctxTurtle.moveTo(0, -sz);
  S.ctxTurtle.lineTo(-sz * 0.5, sz * 0.45);
  S.ctxTurtle.lineTo(sz * 0.5, sz * 0.45);
  S.ctxTurtle.closePath();

  const penColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--pen-color').trim();
  S.ctxTurtle.fillStyle   = t.penDown ? penColor : '#888';
  S.ctxTurtle.fill();
  S.ctxTurtle.strokeStyle  = t.penDown ? '#fff' : '#666';
  S.ctxTurtle.lineWidth    = 1.5;
  S.ctxTurtle.stroke();

  S.ctxTurtle.restore();
}


// ── Funció unificada de moviment de tortuga (DRY) ──
//
// Retorna { segment? } — el segment dibuixat, si n'hi ha.
// Tant l'intèrpret real com executeGoalCode utilitzen això.

function applyTurtleCommand(turtle, node, penColor) {
  let segment = null;

  switch (node.name) {
    case 'forward':
    case 'back': {
      const dist = node.name === 'back' ? -node.arg : node.arg;
      const rad  = turtle.heading * Math.PI / 180;
      const dx   = dist * Math.sin(rad);
      const dy   = -dist * Math.cos(rad);
      const nx   = turtle.x + dx;
      const ny   = turtle.y + dy;
      if (turtle.penDown) {
        segment = { x1: turtle.x, y1: turtle.y, x2: nx, y2: ny, color: penColor, width: 2 };
      }
      turtle.x = nx;
      turtle.y = ny;
      break;
    }
    case 'right':
      turtle.heading = (turtle.heading + node.arg) % 360;
      break;
    case 'left':
      turtle.heading = ((turtle.heading - node.arg) % 360 + 360) % 360;
      break;
    case 'pendown':
      turtle.penDown = true;
      break;
    case 'penup':
      turtle.penDown = false;
      break;
    case 'home':
      turtle.x = 0; turtle.y = 0; turtle.heading = 0;
      break;
    case 'clear':
      turtle.x = 0; turtle.y = 0; turtle.heading = 0; turtle.penDown = true;
      return { clear: true };
  }

  return { segment };
}


// ── Executar comanda sobre el canvas real ──

function executeCommand(node) {
  const S = L.state;
  const penColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--pen-color').trim() || '#00e676';

  const result = applyTurtleCommand(S.turtle, node, penColor);

  if (result.clear) {
    S.drawHistory = [];
    redrawAll();
  } else if (result.segment) {
    S.drawHistory.push(result.segment);
    // Dibuixar incrementalment (sense redibuixar tot)
    const seg = result.segment;
    const cx  = S.canvasW / 2;
    const cy  = S.canvasH / 2;
    S.ctxDraw.strokeStyle = seg.color;
    S.ctxDraw.lineWidth   = seg.width;
    S.ctxDraw.lineCap     = 'round';
    S.ctxDraw.beginPath();
    S.ctxDraw.moveTo(cx + seg.x1, cy + seg.y1);
    S.ctxDraw.lineTo(cx + seg.x2, cy + seg.y2);
    S.ctxDraw.stroke();
  }

  drawTurtle();
  updateStatus();
}


// ── Executar codi de referència (per a previsualització de reptes) ──
// Usa la mateixa applyTurtleCommand, sense tocar el canvas real.

function executeGoalCode(goalCode) {
  const tokens = L.tokenize(goalCode, 'en');
  const ast    = L.parse(tokens);
  const turtle = { x: 0, y: 0, heading: 0, penDown: true };
  const segs   = [];
  const procs  = {};

  for (const n of ast) {
    if (n.type === 'procdef') procs[n.name] = n.body;
  }

  function run(nodes, depth) {
    if (depth > 200) return;
    for (const n of nodes) {
      if (n.type === 'cmd') {
        const result = applyTurtleCommand(turtle, n, '#00e676');
        if (result.clear) segs.length = 0;
        else if (result.segment) segs.push(result.segment);
      } else if (n.type === 'repeat') {
        for (let i = 0; i < n.count; i++) run(n.body, depth + 1);
      } else if (n.type === 'call' && procs[n.name]) {
        run(procs[n.name], depth + 1);
      }
    }
  }

  run(ast, 0);
  return segs;
}


// ── Actualitzar barra d'estat ──

function updateStatus() {
  const S  = L.state;
  const t  = S.turtle;
  const pe = document.getElementById('st-pos');
  const he = document.getElementById('st-heading');
  const pn = document.getElementById('st-pen');
  if (pe) pe.textContent = `(${Math.round(t.x)}, ${Math.round(-t.y)})`;
  if (he) he.textContent = Math.round(t.heading) + '°';
  if (pn) pn.textContent = t.penDown
    ? (L.t('ui.pen_down') || 'baix ✏️')
    : (L.t('ui.pen_up') || 'amunt ✗');
}


// ── Exporta ──

L.setupCanvases     = setupCanvases;
L.redrawAll         = redrawAll;
L.drawTurtle        = drawTurtle;
L.applyTurtleCommand = applyTurtleCommand;
L.executeCommand    = executeCommand;
L.executeGoalCode   = executeGoalCode;
L.updateStatus      = updateStatus;
