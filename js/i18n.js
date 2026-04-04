// ════════════════════════════════════════════════════════
// i18n.js — Traduccions (CAT / CAST / ENG)
// ════════════════════════════════════════════════════════

const I18N = {
  ca: {
    ui: {
      challenges: '🎯 Reptes', challenges_title: '🎯 Reptes — tria un exercici',
      toggle_theme: 'Fosc / Clar', run: '▶ Executa', step: '⏭ Pas', stop: '■ Para',
      reset: '↺ Reinicia', clear_log: '⌫ Log', speed: 'Velocitat:', close: 'Tanca',
      lbl_codelang: 'Codi:', lbl_userlang: 'Idioma:',
      level_easy: '⭐ Fàcil', level_medium: '⭐⭐ Mitjà', level_hard: '⭐⭐⭐ Difícil',
      ref_btn: '📋 Ref', ref_cmd: 'Moviment', ref_struct: 'Estructures',
      success_title: 'Repte superat!', success_msg: 'Excel·lent! Has resolt l\'exercici correctament.',
      success_more: '🎯 Més reptes', success_close: 'Continua',
      category_basic: '🐢 Reptes bàsics', category_advanced: '🌟 Reptes avançats',
      goal_btn: '🎯 Objectiu', goal_title: '🎯 Objectiu del repte', goal_desc: 'Dibuix objectiu:',
      hint_btn: '💡 Pista', hint_locked: '🔒 Pista ({time})',
      onboard_next: 'Següent →', onboard_prev: '← Enrere', onboard_start: 'Comencem! 🚀', onboard_skip: 'Salta',
      pos: 'Pos:', heading: 'Dir:', pen: 'Llapis:', pen_down: 'baix ✏️', pen_up: 'amunt ✗',
    },
    state: { idle: 'aturat', running: 'executant', step: 'pas a pas', error: 'error' },
    speed: ['Molt lent', 'Lent', 'Normal', 'Ràpid', 'Molt ràpid', 'Instant'],
    log: {
      running: '▶ Executant...', step_mode: '⏭ Mode pas a pas',
      done: '✓ Programa acabat', reset: '↺ Reiniciat', cleared: '⌫ Netejat',
      challenge: '🎯 Repte', error: '✗ Error',
    },
    errors: {
      unknown_word:       { msg: 'Ordre desconeguda: «{word}»',             help: '📌 «{word}» no és cap ordre reconeguda. Volies dir <code>{suggestion}</code>? Consulta el panell 📋 Ref per veure totes les ordres disponibles.' },
      missing_parens:     { msg: 'Falta el parèntesi a «{word}»',           help: '📌 Les ordres de moviment necessiten un número entre parèntesis. Exemple: <code>{word}(100)</code>' },
      expect_num:         { msg: 'S\'esperava un número després de «{word}»', help: '📌 L\'ordre <code>{word}</code> necessita un valor numèric. Prova: <code>{word}(50)</code>' },
      empty_parens:       { msg: 'Parèntesis buits a «{word}»',             help: '📌 Has escrit <code>{word}()</code> però falta el número dins els parèntesis. Prova: <code>{word}(100)</code>' },
      missing_open_brace: { msg: 'Falta «{» per obrir el bloc',             help: '📌 Després de <code>{word}</code> cal obrir un bloc amb <code>{</code>. Exemple:<br><code>{word}(4) { avança(100) }</code>' },
      missing_close_brace:{ msg: 'Falta «}» per tancar el bloc',            help: '📌 Has obert un bloc amb <code>{</code> però no l\'has tancat. Afegeix <code>}</code> al final del bloc.' },
      missing_proc_name:  { msg: 'Falta el nom del procediment',             help: '📌 Després de <code>procediment</code> cal escriure un nom. Exemple:<br><code>procediment quadrat { avança(100) gira.dreta(90) }</code>' },
      unknown_proc:       { msg: 'Procediment desconegut: «{name}»',         help: '📌 Has cridat <code>{name}</code> però no l\'has definit. Defineix-lo abans amb:<br><code>procediment {name} { ... }</code>' },
      max_steps:          { msg: 'Massa passos! Possible bucle infinit',     help: '📌 El programa ha superat el límit de passos. Potser tens un <code>repeteix</code> amb un valor massa alt, o un bucle que no acaba mai.' },
      too_deep:           { msg: 'Massa profunditat de crides',              help: '📌 Els procediments es criden uns als altres massa vegades. Potser un procediment es crida a si mateix (recursió infinita)?' },
    },
    commands: ['avança', 'retrocedeix', 'gira.dreta', 'gira.esquerra', 'posa.llapis', 'treu.llapis', 'centre', 'neteja'],
    keywords: ['repeteix', 'procediment'],
    challenges: [
      { id: 1,   category: 'basic',    title: 'Primera línia',     level: 'easy',   desc: "Fes que la tortuga avanci <em>100 passes</em> endavant. Veuràs com dibuixa una línia recta!", code: '// Fes avançar la tortuga 100 passes\n\n', goal: 'forward 100', hints: ["L'ordre avança fa moure la tortuga endavant. Escriu: avança(100)", 'Solució: avança(100) — la tortuga avança 100 passes i dibuixa una línia.'] },
      { id: 2,   category: 'basic',    title: 'El quadrat',        level: 'easy',   desc: "Dibuixa un quadrat de 100x100. Usa <em>repeteix</em> per no escriure 4 vegades el mateix!", code: '// Dibuixa un quadrat\n// Pista: repeteix(4) { avança(100) gira.dreta(90) }\n\n', goal: 'repeat(4){forward 100 right 90}', hints: ['Un quadrat té 4 costats iguals i 4 girs de 90°. Usa repeteix(4) per repetir el patró.', 'Solució: repeteix(4) { avança(100) gira.dreta(90) }'] },
      { id: 3,   category: 'basic',    title: 'El triangle',       level: 'easy',   desc: "Dibuixa un triangle equilàter. Quants graus ha de girar la tortuga a cada cantonada?", code: '// Dibuixa un triangle equilàter\n// Pista: la suma dels girs exteriors és 360°\n\n', goal: 'repeat(3){forward 100 right 120}', hints: ['Un triangle equilàter té 3 costats. La suma dels girs exteriors sempre és 360°, així que cada gir és 360÷3 = 120°.', 'Solució: repeteix(3) { avança(100) gira.dreta(120) }'] },
      { id: 4,   category: 'basic',    title: "L'estrella",        level: 'medium', desc: "Dibuixa una estrella de 5 puntes. El secret és girar <em>144 graus</em> a cada punta!", code: '// Dibuixa una estrella de 5 puntes\n\n', goal: 'repeat(5){forward 100 right 144}', hints: ['Una estrella de 5 puntes es fa amb 5 costats i girs de 144°. Per què 144? Perquè la tortuga fa 2 voltes completes: 720÷5 = 144.', 'Solució: repeteix(5) { avança(100) gira.dreta(144) }'] },
      { id: 5,   category: 'basic',    title: "L'escala",          level: 'medium', desc: "Dibuixa una escala de 4 graons. Cada graó és: avança, gira dreta, avança, gira esquerra.", code: '// Dibuixa una escala de 4 graons\n\n', goal: 'repeat(4){forward 40 right 90 forward 40 left 90}', hints: ['Cada graó combina dos moviments i dos girs.', 'Solució: repeteix(4) { avança(40) gira.dreta(90) avança(40) gira.esquerra(90) }'] },
      { id: 6,   category: 'basic',    title: "L'hexàgon",         level: 'medium', desc: "Dibuixa un hexàgon regular. Recorda: la suma dels girs exteriors és sempre <em>360°</em>.", code: '// Dibuixa un hexàgon regular\n\n', goal: 'repeat(6){forward 60 right 60}', hints: ['Un hexàgon té 6 costats. Gir exterior = 360÷6 = 60°.', 'Solució: repeteix(6) { avança(60) gira.dreta(60) }'] },
      { id: 7,   category: 'basic',    title: 'La casa',           level: 'hard',   desc: "Dibuixa una casa: un quadrat (base) amb un triangle (teulada) a sobre. Defineix un <em>procediment</em> per a cada part!", code: 'procediment base {\n  // quadrat de 100\n}\nprocediment teulada {\n  // triangle a sobre\n}\n\n// Programa principal\nbase\nteulada\n', goal: 'repeat(4){forward 100 right 90} right 30 forward 100 right 120 forward 100', hints: ['La base és un quadrat de 100. Per la teulada, has de girar 30° a la dreta i dibuixar un triangle amb girs de 120°.', 'Base: repeteix(4) { avança(100) gira.dreta(90) } — Teulada: gira.dreta(30) avança(100) gira.dreta(120) avança(100)'] },
      { id: 101, category: 'advanced', title: 'El cercle',         level: 'easy',   desc: "Aproxima un cercle: repeteix <em>36 vegades</em> un petit avanç i un petit gir. 36 × 10° = 360°!", code: '// Dibuixa un cercle (aproximació)\n\n', goal: 'repeat(36){forward 10 right 10}', hints: ['Un cercle és un polígon amb molts costats petits. Si gires 10° cada vegada, necessites 36 repeticions (36×10=360).', 'Solució: repeteix(36) { avança(10) gira.dreta(10) }'] },
      { id: 102, category: 'advanced', title: 'Línia discontínua', level: 'medium', desc: "Dibuixa una línia discontínua: alterna entre dibuixar i no dibuixar amb <em>posa.llapis</em> i <em>treu.llapis</em>.", code: '// Línia discontínua\n\n', goal: 'repeat(8){forward 20 pen.up forward 15 pen.down}', hints: ['Usa treu.llapis per moure sense dibuixar i posa.llapis per tornar a dibuixar.', 'Solució: repeteix(8) { avança(20) treu.llapis avança(15) posa.llapis }'] },
      { id: 103, category: 'advanced', title: 'El ventall',        level: 'medium', desc: "Dibuixa un ventall de 6 triangles girats.", code: '// Ventall de triangles\n\n', goal: 'repeat(6){repeat(3){forward 60 right 120}right 60}', hints: ['Dibuixa un triangle, gira 60°, dibuixa un altre triangle, gira 60°... 6 vegades.', 'Solució: repeteix(6) { repeteix(3) { avança(60) gira.dreta(120) } gira.dreta(60) }'] },
      { id: 104, category: 'advanced', title: 'La flor',           level: 'hard',   desc: "Dibuixa una flor: 8 cercles petits disposats en forma de flor.", code: '// Flor de cercles\nprocediment petal {\n  // un cercle petit\n}\n\n// 8 pètals girats\n\n', goal: 'repeat(8){repeat(36){forward 5 right 10}right 45}', hints: ['Cada pètal és un cercle petit: repeteix(36) { avança(5) gira.dreta(10) }. Dibuixa 8 pètals girant 45° entre cada un.', 'Solució: repeteix(8) { repeteix(36) { avança(5) gira.dreta(10) } gira.dreta(45) }'] },
      { id: 105, category: 'advanced', title: 'El caleidoscopi',   level: 'hard',   desc: "Dibuixa 12 quadrats girats 30° entre ells.", code: '// Caleidoscopi de quadrats\n\n', goal: 'repeat(12){repeat(4){forward 80 right 90}right 30}', hints: ['Dibuixa un quadrat, gira 30°, dibuixa un altre quadrat... 12 vegades (12×30=360).', 'Solució: repeteix(12) { repeteix(4) { avança(80) gira.dreta(90) } gira.dreta(30) }'] },
    ],
    onboard: [
      { icon: '🐢', title: 'Hola! Soc la tortuga Logo', body: 'Segueixo les teves instruccions per dibuixar formes al llenç. Tu escrius el codi, jo dibuixo!' },
      { icon: '🖊️', title: 'Com funciona', body: "A l'<strong>esquerra</strong> veus el llenç on dibuixo. A la <strong>dreta</strong> escrius ordres com <code>avança(100)</code> o <code>gira.dreta(90)</code>. Prem <code>▶ Executa</code> per veure el resultat." },
      { icon: '🚀', title: 'Preparat?', body: 'Fes clic a <strong>🎯 Reptes</strong> i tria el primer. Sort!' },
    ],
  },

  es: {
    ui: {
      challenges: '🎯 Retos', challenges_title: '🎯 Retos — elige un ejercicio',
      toggle_theme: 'Oscuro / Claro', run: '▶ Ejecuta', step: '⏭ Paso', stop: '■ Para',
      reset: '↺ Reinicia', clear_log: '⌫ Log', speed: 'Velocidad:', close: 'Cerrar',
      lbl_codelang: 'Código:', lbl_userlang: 'Idioma:',
      level_easy: '⭐ Fácil', level_medium: '⭐⭐ Medio', level_hard: '⭐⭐⭐ Difícil',
      ref_btn: '📋 Ref', ref_cmd: 'Movimiento', ref_struct: 'Estructuras',
      success_title: '¡Reto superado!', success_msg: '¡Excelente! Has resuelto el ejercicio correctamente.',
      success_more: '🎯 Más retos', success_close: 'Continuar',
      category_basic: '🐢 Retos básicos', category_advanced: '🌟 Retos avanzados',
      goal_btn: '🎯 Objetivo', goal_title: '🎯 Objetivo del reto', goal_desc: 'Dibujo objetivo:',
      hint_btn: '💡 Pista', hint_locked: '🔒 Pista ({time})',
      onboard_next: 'Siguiente →', onboard_prev: '← Atrás', onboard_start: '¡Empecemos! 🚀', onboard_skip: 'Saltar',
      pos: 'Pos:', heading: 'Dir:', pen: 'Lápiz:', pen_down: 'abajo ✏️', pen_up: 'arriba ✗',
    },
    state: { idle: 'detenido', running: 'ejecutando', step: 'paso a paso', error: 'error' },
    speed: ['Muy lento', 'Lento', 'Normal', 'Rápido', 'Muy rápido', 'Instante'],
    log: {
      running: '▶ Ejecutando...', step_mode: '⏭ Modo paso a paso',
      done: '✓ Programa terminado', reset: '↺ Reiniciado', cleared: '⌫ Limpiado',
      challenge: '🎯 Reto', error: '✗ Error',
    },
    errors: {
      unknown_word:       { msg: 'Orden desconocida: «{word}»',               help: '📌 «{word}» no es ninguna orden reconocida. ¿Quisiste decir <code>{suggestion}</code>? Consulta el panel 📋 Ref para ver todas las órdenes.' },
      missing_parens:     { msg: 'Falta el paréntesis en «{word}»',           help: '📌 Las órdenes de movimiento necesitan un número entre paréntesis. Ejemplo: <code>{word}(100)</code>' },
      expect_num:         { msg: 'Se esperaba un número después de «{word}»', help: '📌 La orden <code>{word}</code> necesita un valor numérico. Prueba: <code>{word}(50)</code>' },
      empty_parens:       { msg: 'Paréntesis vacíos en «{word}»',             help: '📌 Has escrito <code>{word}()</code> pero falta el número. Prueba: <code>{word}(100)</code>' },
      missing_open_brace: { msg: 'Falta «{» para abrir el bloque',            help: '📌 Después de <code>{word}</code> hay que abrir un bloque con <code>{</code>. Ejemplo:<br><code>{word}(4) { avanza(100) }</code>' },
      missing_close_brace:{ msg: 'Falta «}» para cerrar el bloque',           help: '📌 Has abierto un bloque con <code>{</code> pero no lo has cerrado. Añade <code>}</code> al final del bloque.' },
      missing_proc_name:  { msg: 'Falta el nombre del procedimiento',          help: '📌 Después de <code>procedimiento</code> hay que escribir un nombre. Ejemplo:<br><code>procedimiento cuadrado { avanza(100) gira.derecha(90) }</code>' },
      unknown_proc:       { msg: 'Procedimiento desconocido: «{name}»',        help: '📌 Has llamado a <code>{name}</code> pero no lo has definido. Defínelo con:<br><code>procedimiento {name} { ... }</code>' },
      max_steps:          { msg: 'Demasiados pasos! Posible bucle infinito',   help: '📌 El programa ha superado el límite de pasos. Quizás tienes un <code>repite</code> con un valor demasiado alto.' },
      too_deep:           { msg: 'Demasiada profundidad de llamadas',          help: '📌 Los procedimientos se llaman unos a otros demasiadas veces. ¿Recursión infinita?' },
    },
    commands: ['avanza', 'retrocede', 'gira.derecha', 'gira.izquierda', 'pon.lapiz', 'quita.lapiz', 'centro', 'limpia'],
    keywords: ['repite', 'procedimiento'],
    challenges: [
      { id: 1,   category: 'basic',    title: 'Primera línea',     level: 'easy',   desc: "Haz que la tortuga avance <em>100 pasos</em>.", code: '// Haz avanzar la tortuga 100 pasos\n\n', goal: 'forward 100', hints: ['La orden avanza mueve la tortuga. Escribe: avanza(100)', 'Solución: avanza(100)'] },
      { id: 2,   category: 'basic',    title: 'El cuadrado',       level: 'easy',   desc: "Dibuja un cuadrado de 100×100. Usa <em>repite</em>.", code: '// Dibuja un cuadrado\n\n', goal: 'repeat(4){forward 100 right 90}', hints: ['Un cuadrado tiene 4 lados iguales y 4 giros de 90°.', 'Solución: repite(4) { avanza(100) gira.derecha(90) }'] },
      { id: 3,   category: 'basic',    title: 'El triángulo',      level: 'easy',   desc: "Dibuja un triángulo equilátero.", code: '// Dibuja un triángulo equilátero\n\n', goal: 'repeat(3){forward 100 right 120}', hints: ['Giro exterior = 360÷3 = 120°.', 'Solución: repite(3) { avanza(100) gira.derecha(120) }'] },
      { id: 4,   category: 'basic',    title: 'La estrella',       level: 'medium', desc: "Dibuja una estrella de 5 puntas. Gira <em>144 grados</em>!", code: '// Dibuja una estrella de 5 puntas\n\n', goal: 'repeat(5){forward 100 right 144}', hints: ['5 lados con giros de 144° (720÷5).', 'Solución: repite(5) { avanza(100) gira.derecha(144) }'] },
      { id: 5,   category: 'basic',    title: 'La escalera',       level: 'medium', desc: "Dibuja una escalera de 4 peldaños.", code: '// Dibuja una escalera\n\n', goal: 'repeat(4){forward 40 right 90 forward 40 left 90}', hints: ['Cada peldaño: avanza, gira derecha, avanza, gira izquierda.', 'Solución: repite(4) { avanza(40) gira.derecha(90) avanza(40) gira.izquierda(90) }'] },
      { id: 6,   category: 'basic',    title: 'El hexágono',       level: 'medium', desc: "Dibuja un hexágono regular. 360÷6 = ?", code: '// Dibuja un hexágono\n\n', goal: 'repeat(6){forward 60 right 60}', hints: ['Giro = 60°.', 'Solución: repite(6) { avanza(60) gira.derecha(60) }'] },
      { id: 7,   category: 'basic',    title: 'La casa',           level: 'hard',   desc: "Dibuja una casa: cuadrado + triángulo como tejado.", code: 'procedimiento base {\n  // cuadrado de 100\n}\nprocedimiento tejado {\n  // triángulo encima\n}\n\nbase\ntejado\n', goal: 'repeat(4){forward 100 right 90} right 30 forward 100 right 120 forward 100', hints: ['Base = cuadrado. Tejado: gira 30° y triángulo con 120°.', 'Base: repite(4){avanza(100) gira.derecha(90)} — Tejado: gira.derecha(30) avanza(100) gira.derecha(120) avanza(100)'] },
      { id: 101, category: 'advanced', title: 'El círculo',        level: 'easy',   desc: "Aproxima un círculo: 36 pasos con giros de 10°.", code: '// Dibuja un círculo\n\n', goal: 'repeat(36){forward 10 right 10}', hints: ['36 × 10° = 360°.', 'Solución: repite(36) { avanza(10) gira.derecha(10) }'] },
      { id: 102, category: 'advanced', title: 'Línea discontinua', level: 'medium', desc: "Alterna <em>pon.lapiz</em> y <em>quita.lapiz</em>.", code: '// Línea discontinua\n\n', goal: 'repeat(8){forward 20 pen.up forward 15 pen.down}', hints: ['quita.lapiz para no dibujar, pon.lapiz para volver.', 'Solución: repite(8) { avanza(20) quita.lapiz avanza(15) pon.lapiz }'] },
      { id: 103, category: 'advanced', title: 'El abanico',        level: 'medium', desc: "6 triángulos girados formando un abanico.", code: '// Abanico de triángulos\n\n', goal: 'repeat(6){repeat(3){forward 60 right 120}right 60}', hints: ['Dibuja triángulo, gira 60°, repite 6 veces.', 'Solución: repite(6) { repite(3) { avanza(60) gira.derecha(120) } gira.derecha(60) }'] },
      { id: 104, category: 'advanced', title: 'La flor',           level: 'hard',   desc: "8 círculos pequeños (pétalos) girados 45°.", code: 'procedimiento petalo {\n  // círculo pequeño\n}\n\n// 8 pétalos\n\n', goal: 'repeat(8){repeat(36){forward 5 right 10}right 45}', hints: ['Cada pétalo es un mini-círculo. Gira 45° entre pétalos.', 'Solución: repite(8) { repite(36) { avanza(5) gira.derecha(10) } gira.derecha(45) }'] },
      { id: 105, category: 'advanced', title: 'El caleidoscopio',  level: 'hard',   desc: "12 cuadrados girados 30° entre sí.", code: '// Caleidoscopio\n\n', goal: 'repeat(12){repeat(4){forward 80 right 90}right 30}', hints: ['Cuadrado + giro 30°, 12 veces.', 'Solución: repite(12) { repite(4) { avanza(80) gira.derecha(90) } gira.derecha(30) }'] },
    ],
    onboard: [
      { icon: '🐢', title: '¡Hola! Soy la tortuga Logo', body: '¡Sigo tus instrucciones para dibujar. Tú escribes, yo dibujo!' },
      { icon: '🖊️', title: 'Cómo funciona', body: 'A la <strong>izquierda</strong> está el lienzo. A la <strong>derecha</strong> escribes órdenes como <code>avanza(100)</code>. Pulsa <code>▶ Ejecuta</code>.' },
      { icon: '🚀', title: '¿Listo?', body: 'Haz clic en <strong>🎯 Retos</strong> y elige el primero. ¡Suerte!' },
    ],
  },

  en: {
    ui: {
      challenges: '🎯 Challenges', challenges_title: '🎯 Challenges — pick an exercise',
      toggle_theme: 'Dark / Light', run: '▶ Run', step: '⏭ Step', stop: '■ Stop',
      reset: '↺ Reset', clear_log: '⌫ Log', speed: 'Speed:', close: 'Close',
      lbl_codelang: 'Code:', lbl_userlang: 'Lang:',
      level_easy: '⭐ Easy', level_medium: '⭐⭐ Medium', level_hard: '⭐⭐⭐ Hard',
      ref_btn: '📋 Ref', ref_cmd: 'Movement', ref_struct: 'Structures',
      success_title: 'Challenge complete!', success_msg: 'Excellent! You solved the exercise correctly.',
      success_more: '🎯 More challenges', success_close: 'Continue',
      category_basic: '🐢 Basic challenges', category_advanced: '🌟 Advanced challenges',
      goal_btn: '🎯 Goal', goal_title: '🎯 Challenge goal', goal_desc: 'Target drawing:',
      hint_btn: '💡 Hint', hint_locked: '🔒 Hint ({time})',
      onboard_next: 'Next →', onboard_prev: '← Back', onboard_start: "Let's go! 🚀", onboard_skip: 'Skip',
      pos: 'Pos:', heading: 'Dir:', pen: 'Pen:', pen_down: 'down ✏️', pen_up: 'up ✗',
    },
    state: { idle: 'stopped', running: 'running', step: 'step mode', error: 'error' },
    speed: ['Very slow', 'Slow', 'Normal', 'Fast', 'Very fast', 'Instant'],
    log: {
      running: '▶ Running...', step_mode: '⏭ Step mode',
      done: '✓ Program finished', reset: '↺ Reset', cleared: '⌫ Cleared',
      challenge: '🎯 Challenge', error: '✗ Error',
    },
    errors: {
      unknown_word:       { msg: 'Unknown command: "{word}"',               help: '📌 "{word}" is not a recognized command. Did you mean <code>{suggestion}</code>? Check the 📋 Ref panel for all available commands.' },
      missing_parens:     { msg: 'Missing parentheses in "{word}"',         help: '📌 Movement commands need a number in parentheses. Example: <code>{word}(100)</code>' },
      expect_num:         { msg: 'Expected a number after "{word}"',        help: '📌 The command <code>{word}</code> needs a numeric value. Try: <code>{word}(50)</code>' },
      empty_parens:       { msg: 'Empty parentheses in "{word}"',           help: '📌 You wrote <code>{word}()</code> but the number is missing. Try: <code>{word}(100)</code>' },
      missing_open_brace: { msg: 'Missing "{" to open block',              help: '📌 After <code>{word}</code> you need to open a block with <code>{</code>. Example:<br><code>{word}(4) { forward(100) }</code>' },
      missing_close_brace:{ msg: 'Missing "}" to close block',             help: '📌 You opened a block with <code>{</code> but never closed it. Add <code>}</code> at the end of the block.' },
      missing_proc_name:  { msg: 'Missing procedure name',                  help: '📌 After <code>procedure</code> you need a name. Example:<br><code>procedure square { forward(100) right(90) }</code>' },
      unknown_proc:       { msg: 'Unknown procedure: "{name}"',              help: '📌 You called <code>{name}</code> but haven\'t defined it. Define it with:<br><code>procedure {name} { ... }</code>' },
      max_steps:          { msg: 'Too many steps! Possible infinite loop',   help: '📌 The program exceeded the step limit. Perhaps a <code>repeat</code> value is too high, or a loop that never ends.' },
      too_deep:           { msg: 'Too deep call stack',                      help: '📌 Procedures are calling each other too many times. Infinite recursion?' },
    },
    commands: ['forward', 'back', 'right', 'left', 'pen.down', 'pen.up', 'home', 'clear'],
    keywords: ['repeat', 'procedure'],
    challenges: [
      { id: 1,   category: 'basic',    title: 'First line',        level: 'easy',   desc: "Move the turtle <em>100 steps</em> forward.", code: '// Move the turtle 100 steps forward\n\n', goal: 'forward 100', hints: ['The forward command moves the turtle. Write: forward(100)', 'Solution: forward(100)'] },
      { id: 2,   category: 'basic',    title: 'The square',        level: 'easy',   desc: "Draw a 100×100 square. Use <em>repeat</em>!", code: '// Draw a square\n\n', goal: 'repeat(4){forward 100 right 90}', hints: ['A square has 4 equal sides and 4 turns of 90°.', 'Solution: repeat(4) { forward(100) right(90) }'] },
      { id: 3,   category: 'basic',    title: 'The triangle',      level: 'easy',   desc: "Draw an equilateral triangle.", code: '// Draw an equilateral triangle\n\n', goal: 'repeat(3){forward 100 right 120}', hints: ['Exterior angle = 360÷3 = 120°.', 'Solution: repeat(3) { forward(100) right(120) }'] },
      { id: 4,   category: 'basic',    title: 'The star',          level: 'medium', desc: "Draw a 5-pointed star. Turn <em>144 degrees</em>!", code: '// Draw a 5-pointed star\n\n', goal: 'repeat(5){forward 100 right 144}', hints: ['5 sides with turns of 144° (720÷5).', 'Solution: repeat(5) { forward(100) right(144) }'] },
      { id: 5,   category: 'basic',    title: 'The staircase',     level: 'medium', desc: "Draw a staircase with 4 steps.", code: '// Draw a 4-step staircase\n\n', goal: 'repeat(4){forward 40 right 90 forward 40 left 90}', hints: ['Each step: forward, right, forward, left.', 'Solution: repeat(4) { forward(40) right(90) forward(40) left(90) }'] },
      { id: 6,   category: 'basic',    title: 'The hexagon',       level: 'medium', desc: "Draw a regular hexagon. 360÷6 = ?", code: '// Draw a regular hexagon\n\n', goal: 'repeat(6){forward 60 right 60}', hints: ['Turn = 60°.', 'Solution: repeat(6) { forward(60) right(60) }'] },
      { id: 7,   category: 'basic',    title: 'The house',         level: 'hard',   desc: "Draw a house: square + triangle roof. Use <em>procedures</em>!", code: 'procedure base {\n  // square of 100\n}\nprocedure roof {\n  // triangle on top\n}\n\nbase\nroof\n', goal: 'repeat(4){forward 100 right 90} right 30 forward 100 right 120 forward 100', hints: ['Base = square. Roof: turn 30° right then triangle with 120° turns.', 'Base: repeat(4){forward(100) right(90)} — Roof: right(30) forward(100) right(120) forward(100)'] },
      { id: 101, category: 'advanced', title: 'The circle',        level: 'easy',   desc: "Approximate a circle: 36 small steps with 10° turns.", code: '// Draw a circle\n\n', goal: 'repeat(36){forward 10 right 10}', hints: ['36 × 10° = 360°.', 'Solution: repeat(36) { forward(10) right(10) }'] },
      { id: 102, category: 'advanced', title: 'Dashed line',       level: 'medium', desc: "Alternate <em>pen.down</em> and <em>pen.up</em>.", code: '// Dashed line\n\n', goal: 'repeat(8){forward 20 pen.up forward 15 pen.down}', hints: ['pen.up to stop drawing, pen.down to resume.', 'Solution: repeat(8) { forward(20) pen.up forward(15) pen.down }'] },
      { id: 103, category: 'advanced', title: 'The fan',           level: 'medium', desc: "6 rotated triangles forming a fan.", code: '// Fan of triangles\n\n', goal: 'repeat(6){repeat(3){forward 60 right 120}right 60}', hints: ['Draw triangle, turn 60°, repeat 6 times.', 'Solution: repeat(6) { repeat(3) { forward(60) right(120) } right(60) }'] },
      { id: 104, category: 'advanced', title: 'The flower',        level: 'hard',   desc: "8 small circles (petals) rotated 45° apart.", code: 'procedure petal {\n  // small circle\n}\n\n// 8 petals\n\n', goal: 'repeat(8){repeat(36){forward 5 right 10}right 45}', hints: ['Each petal is a mini-circle. Turn 45° between petals.', 'Solution: repeat(8) { repeat(36) { forward(5) right(10) } right(45) }'] },
      { id: 105, category: 'advanced', title: 'Kaleidoscope',      level: 'hard',   desc: "12 squares rotated 30° apart.", code: '// Kaleidoscope of squares\n\n', goal: 'repeat(12){repeat(4){forward 80 right 90}right 30}', hints: ['Square + 30° turn, 12 times.', 'Solution: repeat(12) { repeat(4) { forward(80) right(90) } right(30) }'] },
    ],
    onboard: [
      { icon: '🐢', title: "Hi! I'm the Logo turtle", body: "I follow your instructions to draw shapes. You write the code, I draw!" },
      { icon: '🖊️', title: 'How it works', body: 'On the <strong>left</strong> is the canvas. On the <strong>right</strong> you write commands like <code>forward(100)</code>. Press <code>▶ Run</code>.' },
      { icon: '🚀', title: 'Ready?', body: 'Click <strong>🎯 Challenges</strong> and pick the first one. Good luck!' },
    ],
  },
};


// ── Funció de traducció ──

function t(path) {
  const parts = path.split('.');
  let obj = I18N[L.state.currentUserLang];
  for (const p of parts) {
    obj = obj?.[p];
    if (obj === undefined) return '';
  }
  return obj;
}


// ── Exporta ──

L.I18N = I18N;
L.t    = t;
