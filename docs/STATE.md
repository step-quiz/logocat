# LogoCat — current state

> Single source of truth for what exists. Update it in the same change as the code.
> Last update: 2026-11-12 (v0.17: glossary; v0.16: chapter 12 «Recursivitat», the course plan is complete; v0.15: chapter 11 «Decisions i atzar»; v0.14: chapter 10 «Quadrilàters»; v0.13: chapter 9 «Simetria»; v0.12: chapter 8 «Cercles i arcs», point-sampling drawing comparison).

## What exists

- **Language engine** (`js/logo/`), implementing `docs/LANGUAGE-SPEC.md` v1.0 in full:
  tokenizer, generator-based evaluator (prefix words with fixed arity, infix arithmetic
  with precedence, lists as instruction blocks), procedures (`PROC … FI`, inputs, dynamic
  scope, `RETORNA`, `ACABA`, recursion), every word of the spec's word table, the Catalan
  message catalogue with did-you-mean hints, limits (200 000 steps per line, depth 500),
  snapshot/restore for undo, turtle with wrap / fence / window modes.
- **Drawing validation** (`js/logo/compara.js`, rewritten in v0.12, owner-approved point
  G5 of review 10): point-sampling comparison. Net ink = pen strokes cut into pieces of at
  most 0.5 steps, minus pieces within 1 step of a LATER eraser stroke. A piece is covered
  if ink of the other drawing lies within 1.5 steps AND runs in a similar direction (< 20°;
  a crossing line does not cover). Uncovered pieces that touch (endpoints < 0.05 apart, in
  any order) form runs; runs shorter than 1.5 steps are ignored. Order- and
  direction-independent, overdraw counts once. Returns `{ ok, matching, extra, missing,
  error }` (segments; a run is a chain of consecutive segments, which the monitor strokes as
  one path so dashes follow curves). The old line/interval method could not see curves (a
  circle is 360 pieces shorter than the 1.5 minimum: an empty screen passed). Every
  reference solution of chapters 1–8 was re-driven in the browser with the new method.
  Known tolerance: a gap of up to ~3 steps in a curve (e.g. 355° instead of 360° with
  step 0.5) is not detected, the same tolerance straight lines always had. Final pose
  check unchanged.
- **Monitor** (`js/ui/monitor.js`): the simulator embedded in chapters and the screen of
  the Editor lliure. Animated turtle, `?` prompt with history (arrow keys), `>` prompt
  while defining a procedure, buttons Pas / Continua / Atura / Desfés / Reinicia /
  Pantalla completa; in exercises also Comprova and the goal toggle, with the
  white / red / dashed feedback and legend.
- **Activities** (`js/ui/activitats.js`): "Què dibuixarà?" (thumbnails are produced by
  running the option code through the engine; options are shuffled) and the quiz.
- **Chapter 1** (`curs/capitol-1.html`): approved text, 6 free simulators, 4 activities.
  "El quadrat" awards the chapter tick and accepts the square drawn to either side.
- **Chapter 2** (`curs/capitol-2.html`): approved script, 4 free simulators, 5 activities.
  New exercise options in the monitor: `data-exigeix="REPETEIX"` (required word; a correct
  drawing without it gets praise plus encouragement and is not marked done) and
  `data-ordre="…"` (line pre-written at `?`, restored by Reinicia; used by find-the-bug).
  "L'escala llarga" awards the chapter tick.
- **Procedures panel** (`js/ui/panell.js`, class `ProcPanel`): one component used by the
  Editor lliure and by chapter simulators. Textarea under a syntax-coloured layer with
  line numbers; parses on every change (400 ms debounce, and always before a run); a
  syntax problem is shown under the panel; `hooks()` returns the Monitor options that
  wire step marks, the red error line, define/forget/edit events and read-only while
  running. Optional `storageKey` (only the Editor lliure persists).
- **Simulator with panel** (chapter 3 onwards; `data-panell` on `.simulador`): toolbar on
  top, panel on the left (55 %, 13 px code font, owner-approved: 52 characters per line;
  the canvas keeps its size at 1366 × 625), monitor on the right, and a compact "Pas a pas" box ("Ara farà", "On som", "Valors") under the panel
  while stepping; step mode pauses BEFORE each
  action, as in the Editor lliure. Below 720 px the panel goes under the monitor
  (300 px high). No placeholder text. Each simulator is independent; an activity that
  needs a known procedure carries it in `<script type="text/logo-panell">`. Reinicia
  clears the screen and keeps the panel text (reloading the page restores the given
  text). `data-executa="NOM"`: Comprova clears the screen, runs that procedure in view
  of the student (animation at 0.4 × duration) and compares drawing and, if asked, final
  pose. Verdicts before comparing: panel syntax problem; `Encara no has definit NOM.`;
  procedure with inputs; run stopped by an error. With `data-exigeix="PEÇA"` the
  procedure must call that word directly (`Interpreter.procUses`); otherwise praise plus
  encouragement, not marked done.
- **Chapter 3** (`curs/capitol-3.html`): approved script, 6 simulators with panel (1 empty,
  2 with given procedures, 3 exercises), "Què dibuixarà?", quiz. Exercises: "El graó"
  (`GRAÓ`, drawing + pose), find-the-bug "La finestra torta" (`FINESTRA`, given panel),
  key exercise "La torre" (`TORRE` must use `QUADRAT`; mirrored solution accepted).
- **Chapter 4** (`curs/capitol-4.html`): approved script, 7 simulators with panel (4 for
  examples, 3 exercises), "Què dibuixarà?", quiz, colour table (`.colors`, swatches equal
  to the `PEN` array of `js/ui/monitor.js`). Exercises, all `data-comprova="dibuix"`:
  "Els guions" (`GUIONS`), find-the-bug "La sanefa que s'acaba" (`SANEFA`; `SALT` lacks
  the final `LLAPIS`), key exercise "El carrer" (`CARRER` must use `TORRE`; `QUADRAT` and
  a state-restoring `TORRE` are given). Colour never counts in Comprova; the final pen
  state is not checked (owner rejected it).
- **Chapter 5** (`curs/capitol-5.html`): approved script, 6 simulators with panel (3 for
  examples, 3 exercises), "Què dibuixarà?", quiz, table of exterior/interior angles
  (checked against the engine by the tests). Introduces infix arithmetic in inputs and
  `ESCRIU` with numbers. Exercises: "El triangle" (`TRIANGLE`, drawing + pose, mirrored
  solution accepted), find-the-bug "El pentàgon obert" (`PENTÀGON`, given panel), key
  exercise "La casa" (`CASA` must use `TRIANGLE`, drawing + pose; the 30° turn is left
  for the student to discover).
- **Chapter 6** (`curs/capitol-6.html`, titled «Variables»): approved script, 7 simulators
  with panel (4 for examples, 3 exercises), "Què dibuixarà?", quiz. Procedures with one
  variable. Exercises run ONE call with a value named in the statement
  (`data-executa="TRIANGLE 70"`; the owner rejected testing with two values): "El
  triangle de qualsevol mida" (drawing + pose, mirrored solution accepted), find-the-bug
  "El quadrat que no creix" (`QUADRAT 70`), key exercise "La casa de qualsevol mida"
  (`CASA 40`, must use `TRIANGLE`, drawing + pose). When `data-executa` carries values,
  Comprova first checks that the procedure has that many variables (`TRIANGLE ha de tenir
  una variable. Mira la línia PROC.`).
- **Chapter 7** (`curs/capitol-7.html`, «Dues variables»): approved script, 6 simulators
  with panel (3 for examples, 3 exercises), "Què dibuixarà?", quiz. `POLÍGON :N :COSTAT`
  and `ESTRELLA :N :VOLTES`. Exercises: "El polígon" (`POLÍGON 5 40`, drawing + pose),
  find-the-bug "El pentàgon petit" (variables swapped inside), key exercise "L'estrella"
  (`ESTRELLA 7 3`, drawing + pose). Mirrored solutions accepted.
- **Chapter 8** (`curs/capitol-8.html`, «Cercles i arcs»): approved script (review 10), 7
  simulators with panel (4 for examples, 3 exercises), "Què dibuixarà?", quiz. The circle
  is presented as "the turtle walks round" (tiny step, tiny turn), never as a polygon;
  no π. `CERCLE :PAS` and `ARC :PAS :GRAUS` (student-built; no circle primitive exists).
  Exercises: "El cercle" (`CERCLE 0.5`, drawing + pose, mirrored solution accepted),
  find-the-bug "El cercle que no tanca" (`REPETEIX 36` instead of 360; `CERCLE 1`, drawing),
  key exercise "El pètal" (`PÈTAL 0.8`, must use `ARC`, drawing + pose; the 90° turn is
  left to discovery; no mirrored version since `ARC` turns right). Last simulator: the
  flower `REPETEIX 6 [PÈTAL 1 GIRA.D 60]`, bridge to chapter 9 (symmetry).
- **Chapter 9** (`curs/capitol-9.html`, «Simetria»): approved script (review 11), 5
  simulators with panel (2 for examples, 3 exercises), "Què dibuixarà?", quiz. No new
  words. Names "gir", "simetria", "eix de simetria", and the sentence linking them to
  chapter 4's translation. Student procedures with a dot in the name: `BANDERA.D` (a flag
  that contains one `GIRA.E` on purpose, so that changing only D→E is not a mirror) and
  its mirror `BANDERA.E`. Exercises: find-the-bug "El molinet torçat" (`BANDERA.D` lacks
  its last line `AVANÇA 35 GIRA.D 180`; `MOLINET` given; drawing), "La bandera del mirall"
  (`BANDERA.E`, drawing + pose), key exercise "El molinet" (`MOLINET 5`, must use
  `BANDERA.D`, drawing + pose; turning left gives the same drawing). Mosaics are NOT in
  this chapter (owner: final challenges chapter).
- **Chapter 10** (`curs/capitol-10.html`, «Quadrilàters», renamed from «Triangles i
  quadrilàters» by the owner): approved script (review 12), 6 simulators with panel (3 for
  examples, 3 exercises), "Què dibuixarà?" (rhombus 45/135), quiz. Only parallelograms
  (square, rectangle, rhombus, rhomboid), with the half-turn rule (the two turns of each
  half add up to 180). New word `ARREL2` in the section "La diagonal del quadrat" (no
  exercise), with the Pythagoras sentence. Procedures written as the half of the figure on
  one line, twice (a `REPETEIX 2 [...]` line does not fit 52 characters). Fixed angles, no
  angle variable. Exercises: "El romboide" (`ROMBOIDE 70 40`, drawing + pose, mirrored
  solution listed), find-the-bug "El romboide que no tanca" (both turns 60; `ROMBOIDE 80
  50`, drawing), key exercise "El rombe de 70 graus" (`ROMBE 60`; the second turn, 110, must
  be computed; drawing + pose, mirrored solution listed).
- **Chapter 11** (`curs/capitol-11.html`, «Decisions i atzar»): approved script (review
  13), 6 simulators with panel (4 for examples, 2 exercises), "Què dibuixarà?", quiz. New
  words `ATZAR` and `SI` (with optional second list), signs `<`, `>`, `=`, and the words
  `CERT`/`FALS` shown by `ESCRIU 3 > 5`. `ATZAR N` is explained FIRST, before `SI`: the set
  {0, 1, …, N − 1}, N possible results, N never comes out, `ATZAR 2` gives only 0 or 1
  (0 = heads). Coin flips are taught with parentheses: `SI (ATZAR 2) = 0 [...]`. Sections:
  a die, a random walk, decisions (`MONEDA`), "Cares i creus" (`REGLE` + `CURSA :LLOC`:
  a bar chart of heads in 100 flips). Exercises never use `ATZAR` (Comprova cannot compare
  random drawings): find-the-bug "El cercle que no hi cap" (`CERCLE.SEGUR 2`, sign reversed;
  drawing) and key exercise "El quadrat que hi cap" (`QUADRAT.SEGUR 150`, must use `SI`;
  drawing + pose; mirrored solution listed).
- **Chapter 12** (`curs/capitol-12.html`, «Recursivitat», last chapter of the plan):
  approved script (review 14), 5 simulators with panel (2 for examples, 3 exercises),
  "Què dibuixarà?" (`CAMÍ 1`), quiz. New word `ACABA`. `ESPIRAL :COSTAT` (stop rule
  `SI :COSTAT > 100 [ACABA]`, then `ESPIRAL :COSTAT + 5`); the student deletes the rule to see
  ATURADA!; successions («cada nombre s'obté sumant 5 al nombre anterior»); the fractal
  tree `ARBRE` (section without exercise, `ARBRE 60` / `ARBRE 40`). Exercises: find-the-bug
  "L'espiral que no surt" (`<` instead of `>`; `ESPIRAL 5`, drawing), "L'espiral triangular"
  (`ESPIRAL.TRI 5`, drawing; mirrored solution listed), key exercise "L'espiral que
  s'encongeix" (`ESPIRAL.IN 100`, drawing; mirrored solution listed). Recursive exercises
  check the drawing only (the turtle ends far away). The closing says the course is over
  and links to the Editor lliure; the footer links to the Editor lliure.
- **Glossary** (`glossari.html`, review 15): 54 entries. Part 1 «Paraules del curs» (26,
  each with a link to the chapter where it first appears), part 2 «Altres paraules que
  LOGO entén» (28, «No surt al curs»); the coordinate words (`FES.XY`, `FES.X`, `FES.Y`,
  `COOR.X`, `COOR.Y`, `ORIENTACIÓ`, `FES.ORIENTACIÓ`, `VERS.A`) are left out. Themes in the
  approved order, alphabetical inside each theme. Each entry: word, one sentence, an
  example; one-line examples (46) have «Prova-ho», which opens the Editor lliure in a new
  tab with the line typed at `?` (`simulador.html?prova=`). Examples that need several lines
  or a procedure in the panel (`PROC`, `FI`, `:NOM`, `ACABA`, `LOCAL`, `RETORNA`, `PROC?`,
  `OBLIDA.PROC`) have no button. No "ideas" section (owner). «Glossari» is in the top bar of
  every page except 404, on the right before the theme toggle, as in the mockup.
- **Version label**: `index.html` shows `v0.17` fixed at the bottom-right (`.versio`); a
  test keeps it equal to `package.json` `version`. Bump both in EVERY delivery: the owner
  uses it to check that the latest ZIP is live.
- **Turtle rendering** (`Monitor.draw`, owner decision 2026-11-11, applies everywhere,
  Editor lliure included): filled triangle = pen down, hollow = pen up, dashed outline =
  eraser; the turtle takes the pen colour (if pen colour equals field colour, a
  contrasting white/black is used). Thumbnails of "Què dibuixarà?" fill the turtle when
  the pen ends down.
- **Editor lliure** (`simulador.html`, `js/ui/editor.js`): the hybrid screen of the
  approved mockup. Left: procedures panel (a textarea under a syntax-coloured layer with
  line numbers), autosaved to `localStorage` (`logocat-editor-procediments`), parsed on
  every change; a syntax problem is shown under the panel and the previous definitions
  stay loaded. Centre: the monitor (50 %). Far right: a 20 % column with Pas / Continua /
  Atura (18 px) and Desfés / Reinicia (16 px). Single top bar with the speed slider
  (6 positions, the last is instant, no text label) and the turtle status (orientation,
  pen, colour name). The panel takes 30 %: about 33 characters per line at 1280 px wide
  and 36 at 1366 px before it scrolls sideways. Step mode pauses BEFORE each action:
  the line is tinted, the next instruction outlined, the calling instructions underlined,
  and the box shows "Ara farà", "On som" (call path with loop counters) and "Valors".
  A procedure typed at `?` is appended to the panel; `OBLIDA.PROC` removes it from the
  panel; `EDITA "NOM` moves the cursor there (creating an empty procedure if needed).
  An error inside a procedure tints its line red. Layout: one-screen app above 860 px
  wide (no page scroll; the drawing scales to the free height; text zone fixed at 5
  lines with hidden scrollbar). Below 860 px the order is monitor, buttons in a row,
  panel, and the page scrolls. Measured with no page scroll at 1280 × 585,
  1280 × 670, 1366 × 625, 1360 × 800 and 1920 × 950.
- **Landing page**, light/dark theme (stored in `localStorage` as `logocat-tema`),
  progress (`logocat-progres`), one-time negative-number note (`logocat-nota-negatiu`).
- **Tests**: 123 passing (`node --test tests/unit/*.test.mjs`). Manual browser runs in
  headless Chrome on 2026-11-11: chapters 1–8, the landing page and the Editor lliure, no
  console errors, no external requests. v0.12: chapter 8 driven end to end at 1366 × 625
  (every verdict of the three exercises, chapter tick, the new messages, the flower), and
  every reference solution of chapters 1–8 re-checked through Comprova with the new
  comparison (all «Correcte»); no horizontal scrollbar on any page or panel. v0.13:
  chapter 9 driven end to end at 1366 × 625 (every verdict of the three exercises,
  chapter tick, the new hints at the `?` line) and every reference solution of chapters
  1–9 re-checked through Comprova after the engine changes. v0.14: same for chapter 10
  (every verdict, chapter tick, `ARREL2` and the new hints at the `?` line) and for every
  reference solution of chapters 1–10. v0.15: same for chapter 11 (both exercises, every
  verdict, chapter tick, the new hints, the random walk, the coin and the bar chart) and
  for every reference solution of chapters 1–11. v0.16: same for chapter 12 (every
  verdict, chapter tick, runaway recursion stopped with «Atura» and its hint, the tree)
  and for every reference solution of chapters 1–12. Note: runaway recursion in the UI
  reaches the 500-call limit only after about 28 s of animation; most students will
  press «Atura» first, which now also gives the recursion hint. Chapter 7 was driven end to end at 1366 × 625. Chapter 4 was driven end to end at 1366 × 625 (verdicts of the three
  exercises, both new messages, turtle states and colours, white field). Chapter 3 was driven end to end at 1366 × 625 (every verdict of the
  three exercises, step mode with panel marks, error line, panel warning, chapter tick)
  and checked for horizontal scroll at 390, 1280, 1366 and 1920 px wide: none, and the
  longest chapter line (34 characters) fits the panel without a horizontal scrollbar.

## Not built yet

- A possible final challenges chapter (nested `REPETEIX`, mosaics; maybe `POSA.A`, `RETORNA`): to be decided by the owner in its own review (owner, review 14, G6 A); teacher guide; certificate (comes with the family integration, see below).
- **Family integration**: the shared files from `step-quiz-commons` (EXPLORA selector,
  footer, licence, touch key bar) and the `comuns.yml` workflow. That repo has not been
  seen; LogoCat must be registered there first.
- **Browser tests in CI.** Only Node unit tests run in CI.
- **Workspace autosave** (spec §4) is partial: the Editor lliure keeps its procedures;
  drawings, variables and command history are lost on reload everywhere, and embedded
  simulators keep nothing.
- Top-bar entries of the mockup that have no page yet (Reptes) are not shown.

## Known deviations and open points

- Mockup toolbar sizes: all toolbar buttons are 16 px in embedded simulators (as in the
  approved exercise artboard). The 18 px Pas/Atura belong to the Editor lliure.
- "Pas" in the monitor: with text in the input and nothing running, it starts that line
  in step mode (one turtle action per press); "Continua" finishes it at normal speed.
- Speed: fixed in embedded simulators (the slider belongs to the Editor lliure). Long
  runs accelerate automatically (after 40 actions, then instant after 150).
- `FES.XY` in wrap mode draws a straight stroke without wrapping.
- References to the 1980s: the two approved earlier stay (`curs/capitol-1.html`, history
  sentence; `index.html`, intro and meta description) — owner, 2026-11-11. Do not add new
  ones in chapter text (owner rejected one in chapter 3).
- "El carrer" (chapter 4): the complete answer is 19 panel lines, so the panel shows its
  thin vertical scrollbar at 1366 × 625 (about 14 lines fit).
- Nested `REPETEIX` is taught in no regular chapter (rejected for chapters 2, 3 and 5). The
  owner suggested it may fit a final extension / challenges chapter ("potser"): propose it
  there when that chapter is scripted.
- School signs: the hint for `:` `÷` (divide) and `X` `·` `×` (multiply) is raised before
  anything on the line runs (`Interpreter._schoolSigns`); `X` counts only between two
  numbers and when no procedure is called `X`.
- Panel parsing is all-or-nothing: with a syntax problem anywhere in the panel, the
  last good set of procedures stays active (the spec asks for per-procedure isolation).
- In the Editor lliure, Desfés does not undo panel edits (by design); after an undo or a
  reset the procedures are reloaded from the panel.
