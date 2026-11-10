# LogoCat — current state

> Single source of truth for what exists. Update it in the same change as the code.
> Last update: 2026-11-10 (v0.1, first delivery).

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
- **Landing page**, light/dark theme (stored in `localStorage` as `logocat-tema`),
  progress (`logocat-progres`), one-time negative-number note (`logocat-nota-negatiu`).
- **Tests**: 33 passing (`node --test tests/unit/*.test.mjs`). A manual browser smoke run
  (Chrome, desktop and 390 px wide) passed on 2026-11-10: commands, the three day-one
  messages, both exercises, activities, step mode, procedure definition at the prompt,
  runaway recursion stop; no console errors, no external requests.

## Not built yet

- **Editor lliure** (the hybrid screen with the procedures panel, speed slider, turtle
  status readout and the step-mode box). Design approved: `docs/DECISIONS.md` §7. The
  engine already supports it (`defineAll`, call frames); source ranges for highlighting
  the next instruction are not tracked yet.
- **Chapters 2–12**, glossary, teacher guide, certificate.
- **Family integration**: the shared files from `step-quiz-commons` (EXPLORA selector,
  footer, licence, touch key bar) and the `comuns.yml` workflow. That repo has not been
  seen; LogoCat must be registered there first.
- **Browser tests in CI.** Only Node unit tests run in CI.
- **Workspace autosave** per simulator (spec §4): drawings and procedures are lost on
  reload. Only progress, theme and the one-time note persist.

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
