# LogoCat — current state

> Single source of truth for what exists. Update it in the same change as the code.
> Last update: 2026-11-11 (v0.6: chapter 2).

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
- **Monitor** (`js/ui/monitor.js`): the simulator embedded in chapters, monitor only
  (no procedures panel). Animated turtle, `?` prompt with history (arrow keys), `>` prompt
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
- **Tests**: 44 passing (`node --test tests/unit/*.test.mjs`). Manual browser smoke runs
  (Chrome, 1360 px and 390 px wide) passed on 2026-11-10 for chapter 1 and for the Editor
  lliure (panel colouring, run, step mode matching the mockup scenario, stop, error line,
  panel syntax warning, define/forget/edit from the prompt, undo, persistence after
  reload); no console errors, no external requests.

## Not built yet

- **Chapters 3–12**, glossary, teacher guide, certificate.
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
- OPEN (owner): confirm that "El quadrat" accepts the mirrored square (currently yes).
- `FES.XY` in wrap mode draws a straight stroke without wrapping.
- Panel parsing is all-or-nothing: with a syntax problem anywhere in the panel, the
  last good set of procedures stays active (the spec asks for per-procedure isolation).
- In the Editor lliure, Desfés does not undo panel edits (by design); after an undo or a
  reset the procedures are reloaded from the panel.
