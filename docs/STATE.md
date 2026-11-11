# LogoCat — current state

> Single source of truth for what exists. Update it in the same change as the code.
> Last update: 2026-11-11 (v0.11: chapter 7 «Dues variables»).

## What exists

- **Language engine** (`js/logo/`), implementing `docs/LANGUAGE-SPEC.md` v1.0 in full:
  tokenizer, generator-based evaluator (prefix words with fixed arity, infix arithmetic
  with precedence, lists as instruction blocks), procedures (`PROC … FI`, inputs, dynamic
  scope, `RETORNA`, `ACABA`, recursion), every word of the spec's word table, the Catalan
  message catalogue with did-you-mean hints, limits (200 000 steps per line, depth 500),
  snapshot/restore for undo, turtle with wrap / fence / window modes.
- **Drawing validation** (`js/logo/compara.js`): ink comparison by line and interval,
  order- and direction-independent, erase-aware; reports matching, extra and missing
  strokes; final pose check.
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
- **Version label**: `index.html` shows `v0.11` fixed at the bottom-right (`.versio`); a
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
- **Tests**: 80 passing (`node --test tests/unit/*.test.mjs`). Manual browser runs in
  headless Chrome on 2026-11-11: chapters 1–7, the landing page and the Editor lliure, no
  console errors, no external requests. Chapter 7 was driven end to end at 1366 × 625. Chapter 4 was driven end to end at 1366 × 625 (verdicts of the three
  exercises, both new messages, turtle states and colours, white field). Chapter 3 was driven end to end at 1366 × 625 (every verdict of the
  three exercises, step mode with panel marks, error line, panel warning, chapter tick)
  and checked for horizontal scroll at 390, 1280, 1366 and 1920 px wide: none, and the
  longest chapter line (34 characters) fits the panel without a horizontal scrollbar.

## Not built yet

- **Chapters 8–12**, glossary (the edge-mode words `M.CÍCLIC`, `M.BARRERA`, `M.FINESTRA`
  go there, not in a chapter), teacher guide, certificate.
- **Family integration**: the shared files from `step-quiz-commons` (EXPLORA selector,
  footer, licence, touch key bar) and the `comuns.yml` workflow. That repo has not been
  seen; LogoCat must be registered there first.
- **Browser tests in CI.** Only Node unit tests run in CI.
- **Workspace autosave** (spec §4) is partial: the Editor lliure keeps its procedures;
  drawings, variables and command history are lost on reload everywhere, and embedded
  simulators keep nothing.
- Top-bar entries of the mockup that have no page yet (Reptes, Glossari) are not shown.

## Known deviations and open points

- Mockup toolbar sizes: all toolbar buttons are 16 px in embedded simulators (as in the
  approved exercise artboard). The 18 px Pas/Atura belong to the Editor lliure.
- "Pas" in the monitor: with text in the input and nothing running, it starts that line
  in step mode (one turtle action per press); "Continua" finishes it at normal speed.
- Speed: fixed in embedded simulators (the slider belongs to the Editor lliure). Long
  runs accelerate automatically (after 40 actions, then instant after 150).
- Messages added during implementation and pending owner review: see the note at the end
  of `docs/LANGUAGE-SPEC.md` §8.
- `FES.XY` in wrap mode draws a straight stroke without wrapping.
- References to the 1980s: the two approved earlier stay (`curs/capitol-1.html`, history
  sentence; `index.html`, intro and meta description) — owner, 2026-11-11. Do not add new
  ones in chapter text (owner rejected one in chapter 3).
- "El carrer" (chapter 4): the complete answer is 19 panel lines, so the panel shows its
  thin vertical scrollbar at 1366 × 625 (about 14 lines fit).
- The spaced-word message was approved for `NO LLAPIS`; the same wording is applied to any
  dotted primitive typed with a space (`GIRA D 90`, `FES COLOR 2`, `INI DIB`). Pending
  owner confirmation of that extension.
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
