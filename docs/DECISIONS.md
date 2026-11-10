# LogoCat — baseline decisions (phase 0)

> Audience: a cold-start Claude session continuing this project. Everything here was
> approved by the owner on 2026-11-10 unless marked OPEN. For what is built, see `STATE.md`.
> Reply to the owner in Catalan; write AI-facing Markdown in English.

## 1. What LogoCat is

Fifth course of the Step Quiz "Cat" family (KarelCat, PyCat, JSCat, HTMLCat): a static,
build-free, Catalan-language web course that teaches the LOGO language with turtle
graphics, faithful to the 1980s original. Target domain: `logocat.step-quiz.net`.
Family-wide rules live in the `regles-comunes` block of every sibling `CLAUDE.md`
(Catalan UI, ZIP delivery to `_uploads/` with repo-root paths, Cloudflare Pages deploy on
every `main` commit, never `[skip ci]` / `[ci skip]` / `[cf-pages-skip]`, run tests before
delivering, docs updated in the same commit).

Working agreement: slow, human-in-the-loop. The owner (maths teacher, C programmer)
decides UI, UX, pedagogy and learning progression. Ask decisions through multiple-choice
dialogs; 5+ decision points go into a review artifact with per-point buttons.

## 2. Decisions

| Id | Decision |
|---|---|
| Reference dialect | Apple Logo (LCSI, 1982): behaviour and syntax. |
| Primitive language | Catalan, from *El llenguatge Logo en català* (ICE-UB, 1985). Where the book lists two English columns (Terrapin / "LOGO Systems"), follow "LOGO Systems" (= LCSI names). |
| V1 | Adopt the 1985 vocabulary unmodified: full imperative verbs, dot as word joiner (`GIRA.D`), `FES.` prefix for setters, `?` suffix for queries. |
| V2 | No built-in abbreviations (no `AV`/`RE`/`GD`/`GE`). Students define their own in chapter 6. The 1985 book argues the same. Touch key bar offers full words. |
| V3 | Canonical spelling is normative Catalan with diacritics (`AVANÇA`, `ÚLTIM`, `FES.ORIENTACIÓ`, `M.CÍCLIC`), deliberately departing from the book, which prints capitals unaccented. Case-insensitive. A word typed without its `ç`/accent is an ERROR with a hint, not an alias. |
| V4 | Conditional is LCSI-style: `SI cond [ ... ]`. An optional second list is the else branch: `SI cond [ ... ] [ ... ]` (owner-approved 2026-11-10; the tutorial manual only shows the one-list form). `LLAVORS` / `ALTRAMENT` (Terrapin-style, in the book) are not implemented. |
| F1 | Drawing panel always dark grey (not pure black), light pen, triangular turtle, regardless of site theme. Colours by number: 0 black (rendered as the panel grey), 1 white, 2 green, 3 violet, 4 orange, 5 blue. |
| F2 | Edge mode defaults to wrap (`M.CÍCLIC`); `M.BARRERA` (fence, error on exit) and `M.FINESTRA` (window) available. Fixed logical field 280 × 240 turtle steps: x ∈ [−140, 139], y ∈ [−120, 119], scaled to the canvas. |
| F3 | Messages: terse first-person original-style line in Catalan, then a family-style hint line. Example: `NO SÉ COM FER QUADRA` / `💡 Volies dir QUADRAT?`. Catalan wording is OPEN (to be drafted and reviewed). |
| F4 | Hybrid screen: procedures panel on the left (always visible, autosaved); drawing panel on the right with a direct-mode `?` prompt line under it, with history (arrow-up). Typing `PROC NOM` at `?` switches the prompt to `>` until `FI`, then the procedure appears in the panel. `EDITA "NOM` moves focus to it. No Ctrl-C. |
| F5 | Non-original aids: animated turtle with speed control, single-step button highlighting the current instruction, stop, undo of the last direct-mode command. |
| F6 | Out of engine and course: disk (`GRAVA`, `RECUPERA`), packages (`PQ*`), property lists (`*.PROP`), paddles (`DIAL`, `BOTÓ.POLSAT`), system words (`.EXM` etc.), text-screen modes (`P.TEXT`, `P.MIXTA`, `P.DIB`), `FES.PROPORCIÓ`. Kept: `PROCS?`, `PROC?`, `OBLIDA.PROC`. |
| P0 | Start with the turtle in direct mode; text output comes late (the Apple manual starts with `PRINT`). |
| D1 | Audience: ages 12–14 (1r–2n ESO), no prior experience; entry point of the family, before KarelCat. Chapters 10–12 flagged as extension. Maths (synthetic geometry) is the thread; the owner is NOT interested in analytic/coordinate geometry. |
| D2 | Drawing validation: compare the student's drawn segments with a reference solution's, with tolerance, ignoring stroke order and direction. Per-exercise options: turtle must end where it started; required construct (`REPETEIX`, a `PROC` with inputs); run a procedure with several input values. Student sees the goal as a faint overlay via a "🎯 Objectiu" button (KarelCat pattern). |
| D3 | Activity types: editable examples, validated exercise, find-the-bug, Parsons, quiz, final challenges, plus one new type: "Què dibuixarà?" (pick the right drawing before running). The unplugged "Fes de tortuga" activity was rejected. |
| A1 | Name LogoCat; turtle icon in the family "EXPLORA" selector. |
| A2 | Own interpreter following KarelCat's design (tokenizer → parser → generator-based interpreter, see `karelcat/js/{tokenizer,parser,interpreter,execution}.js`), under HTMLCat's rules: native ES modules, zero third-party requests (self-hosted fonts), tests from day one. |

## 3. Curriculum (approved)

| # | Title | LOGO | Maths |
|---|---|---|---|
| 1 | Coneix la tortuga | Direct mode; `AVANÇA`, `RECULA`, `GIRA.D`, `GIRA.E`, `INI.DIB` | Turn as angle, degrees, estimation |
| 2 | Repeteix | `REPETEIX n [ ... ]` | Square, rectangle, right angle, perimeter; 4 × 90 = 360 |
| 3 | Paraules noves | `PROC ... FI`, procedures calling procedures, `PROCS?`, `OBLIDA.PROC` | Decomposing figures; leave the turtle as you found it |
| 4 | El llapis | `NO.LLAPIS`, `LLAPIS`, `GOMA`, `APAREIX`, `DESAPAREIX`, `FES.COLOR`, `FES.FONS` | Translations, friezes |
| 5 | Triangles i polígons | Arithmetic in inputs (`GIRA.D 360 / 5`) | Exterior/interior angles, angle sums, Total Turtle Trip theorem |
| 6 | Entrades | `PROC QUADRAT :COSTAT` | Variable, similar figures, perimeter as a function of side |
| 7 | Dues entrades | `PROC POLIGON :N :COSTAT` | Generalising with 360 / N; star polygons and divisors |
| 8 | Cercles i arcs | Student-built `CERCLE`, `ARC` (the 1985 vocabulary has no circle primitive) | Circle as many-sided polygon, circumference, π |
| 9 | Simetria | No new words; swap `GIRA.D`/`GIRA.E` | Rotational and mirror symmetry, tessellations |
| 10 | Triangles i quadrilàters | `ARREL2` | Classify and construct: isosceles, right triangle, parallelogram, rhombus, trapezoid, kite; opposite/supplementary angles; Pythagoras for the diagonal |
| 11 | Decisions i atzar | `SI [ ... ]`, `ACABA`, `POSA.A`, `ATZAR`, `RETORNA`, `ESCRIU` | Conditions, random walk, frequencies |
| 12 | Recursivitat | Self-calling procedure with a stop rule | Spirals (sequences), fractals (self-similarity) |

Chapter 10 replaced an originally proposed "Coordenades" chapter. Coordinate words
(`FES.XY`, `COOR.X` ...) are not taught; the engine may still implement them.
Deferred beyond v1: words and lists (`PRIMER`, `ÚLTIM`, `FRASE` ...).
`CENTRE` and the wrap phenomenon (the turtle re-entering from the opposite edge) are explained in chapter 1, where students first hit them; the three mode words (`M.CÍCLIC`, `M.BARRERA`, `M.FINESTRA`) are introduced in chapter 4 (delegated to Claude by the owner).

## 4. Verified vocabulary (course subset)

Checked page by page against the 1985 book (vocabulary pp. 19–37, appendix pp. 41–47)
on 2026-11-10. Spelling below is the canonical LogoCat form (V3).

| LogoCat | LCSI | Inputs / notes |
|---|---|---|
| `AVANÇA`, `RECULA` | FORWARD, BACK | n |
| `GIRA.D`, `GIRA.E` | RIGHT, LEFT | degrees |
| `INI.DIB` | CLEARSCREEN | = `CENTRE` + `ESB.DIB` |
| `ESB.DIB` | CLEAN | clears, turtle unchanged |
| `CENTRE` | HOME | centre, heading 0 (up) |
| `APAREIX`, `DESAPAREIX` | SHOWTURTLE, HIDETURTLE | |
| `LLAPIS`, `NO.LLAPIS`, `GOMA` | PENDOWN, PENUP, PENERASE | `LLAPIS.INVERS` exists in the book (Terrapin PENREVERSE); not planned |
| `FES.COLOR n`, `FES.FONS n`, `COLOR`, `FONS` | SETPC, SETBG, PENCOLOR, BACKGROUND | |
| `REPETEIX n llista` | REPEAT | |
| `SI`, `ACABA`, `RETORNA obj` | IF, STOP, OUTPUT | see V4 |
| `CERT`, `FALS`, `NO`, `CERTS.TOTS`, `CERT.ALGUN` | TRUE, FALSE, NOT, AND, OR | |
| `PROC nom ... FI` | TO ... END | |
| `EDITA`, `PROC? nom`, `PROCS?`, `N.PROCS?` | EDIT, PO, POPS, POTS | `N.PROCS?` lists names only |
| `OBLIDA.PROC obj` | ERASE | `OBLIDA obj` (Terrapin ERASE) removes procedures and/or variables |
| `POSA.A var obj`, `CONTINGUT var`, `LOCAL nom` | MAKE, THING, LOCAL | `:NOM` ≡ `CONTINGUT "NOM` |
| `ATZAR n` | RANDOM | integer in 0..n−1 |
| `ARREL2`, `SIN`, `COS`, `ATAN`, `ENTER`, `APROX`, `QUOCIENT`, `RESTA.DIV` | SQRT, SIN, COS, ARCTAN, INT, ROUND, QUOTIENT, REMAINDER | trig in degrees |
| `ESCRIU`, `ESCRIU.S`, `MOSTRA` | PRINT, TYPE, SHOW | `MOSTRA` keeps list brackets |
| `ESPERA n` | WAIT | Apple Logo: `WAIT 60` = 1 second |
| `FES.XY n m`, `FES.X`, `FES.Y`, `COOR.X`, `COOR.Y`, `COOR.XY` | SETPOS, SETX, SETY, XCOR, YCOR, POS | book: two numbers (LCSI SETPOS takes a list); follow the book |
| `FES.ORIENTACIÓ n`, `ORIENTACIÓ`, `VERS.A n m` | SETHEADING, HEADING, TOWARDS | heading 0 = up, clockwise |
| `M.CÍCLIC`, `M.BARRERA`, `M.FINESTRA` | WRAP, FENCE, WINDOW | |
| `PUNT n m` | DOT | |

Book quirks: the appendix prints `SORT` for SQRT (typo); LPUT is `PROPOSAT` in the
vocabulary section but `POSPOSAT` in the appendix (unresolved, lists are deferred); the
book states two Catalan implementations existed (used at the AULA school and Col·legi
Sant Ignasi, Barcelona) without naming them.

## 5. Apple Logo reference facts (from the 1982 manual)

- Prompt `?`; becomes `>` while defining with TO. Split screen: turtle field plus 4 text
  lines. `EDIT "NAME` opens a full-screen editor; CTRL-C saves, CTRL-G aborts/interrupts.
- Messages seen in the manual: `WELCOME TO LOGO`, `I DON'T KNOW HOW TO HELLO`,
  `GREET DEFINED`, `STOPPED!`, `TURTLE OUT OF BOUNDS`, `I DON'T KNOW WHAT TO DO WITH X`.
- `CS  FD 500  PR POS` prints `0. 20.` in wrap mode (field height 240). Numbers print
  with a trailing period there (`90.`). LogoCat does NOT reproduce that: numbers print without a trailing period (owner decision).
- Manual chapter order: PRINT/TO/REPEAT, turtle, square procedure, saving, screen modes,
  pen, editing, workspace, spider project, triangles, variables, circles, two inputs and
  POLY, spirals, turtle's field, game project (RANDOM, IF, READCHAR), recursion.

## 6. Reuse map (sibling repos)

- KarelCat: interpreter architecture, step/speed/stop, goal overlay and diff feedback,
  `<solucio>` blocks inside pages verified by `tests/comprova-curs.js`.
- PyCat: turtle canvas renderer (`js/turtle-view.js`), Parsons and quiz activities
  (`curs/activitats.js`), course page skeleton built by `curs/capitols.js`.
- HTMLCat: engineering rules (ES modules, no third-party requests, `docs/STATE.md` as
  single source of truth, teacher guide, progress export/import).
- JSCat: publication switches (`VISIBLE_MAX_CHAPTER`, `SHOW_REPTES`).
- Shared files (selector, footer, progress, certificate, touch key bar) come from the
  `step-quiz-commons` repo, which has NOT been seen yet; needed to register LogoCat.

## 7. Screen (mockup approved by the owner on 2026-11-10)

Design canvas "Maqueta de la pantalla de LogoCat" (artifact slug
`19e0b570-d8cd-4f70-a948-723056d20be5`): `Main.dc.html` (free editor, light theme),
`Pas.dc.html` (step mode, dark theme), `Exercici.dc.html` (embedded exercise, chapter 2).
The owner hand-edited the light theme; the dark theme mirrors it. Binding points:

- Family look: Space Mono everywhere; light theme `#ffffff` / `#f5f5f5` / `#d0d0d0` /
  accent `#2563eb`; dark theme `#000000` / `#141414` / `#2a2a2a` / accent `#a8a8a2`.
- Top bar: logo, Capítols / Reptes / Editor lliure, state badge, Glossari, theme toggle.
- Toolbar: `Pas`, `Atura` (and `Continua` while stepping) at 18 px; `Desfés`, `Reinicia`
  at 16 px; all regular weight, min-height 44 px, text only. No "Executa" button: Enter
  runs the line. Speed slider WITHOUT a text label for the current speed. Turtle status at
  15 px: `Orientació`, `Llapis`, `Color` (colour shown by name only, no number).
- Left column: procedures panel, header "PROCEDIMENTS" + "desat", code at 15 px with line
  numbers and syntax colours.
- Right column is ONE dark-grey "monitor" (`#2b2d31`, field `#232529`): drawing on top,
  text lines and the `?` input below, like the original split screen. Error line in a
  light red, hint line in light blue with a bulb icon.
- Step mode: current line tinted, next instruction outlined, and a box under the panel
  with "Ara farà" (next instruction), "On som" (call path with loop counters) and
  "Valors" (input values, e.g. `:COSTAT = 50`).
- Embedded exercises in early chapters show the monitor only (no procedures panel; it
  appears from chapter 3). Toolbar there: `Comprova` (primary), `Pas`, `Desfés`,
  `Reinicia` at 16 px, plus `Objectiu: visible` toggle and `Pantalla completa`. Goal
  feedback: matching strokes white, extra strokes thick light red, missing strokes dashed
  light blue, with a legend, and a message box under the simulator.

## 8. Chapter 1 (script approved 2026-11-10; full draft written)

Editable draft: Claude Docs doc "LogoCat · Capítol 1 · Coneix la tortuga"
(https://claude.ai/artifact/NhCPBKkf6vXZqaL7qk32Kw, doc id
`afacad63-8a86-444f-8d8a-b3c03828f36e`). Plain text = student-facing; paragraphs starting
"Muntatge:" = build notes. The owner may edit it by hand: re-read before converting.

- Order: La tortuga i la pantalla → AVANÇA → GIRA.D / GIRA.E → activity "Què dibuixarà?"
  → RECULA, INI.DIB, typing aids → exercise "L'escala" → "Quant he de girar?" (90/180/360)
  → 3-question quiz → box "Fora de la pantalla" (wrap, CENTRE) → exercise "El quadrat"
  → summary table + bridge to chapter 2. No free/unvalidated challenge (rejected).
- Size: one class session, ~500 words, 6 example simulators (monitor only), 4 activities.
- Voice (course-wide): informal "tu", short present-tense sentences, the turtle is "ella";
  say "ordre" and "nombre", not "primitiva" / "entrada" (the latter arrives in chapter 6).
- Course-wide principle (owner): the student must always know where the turtle is
  heading, not only what was drawn. Exercises check final heading whenever meaningful.
  "El quadrat" requires the 4th turn (turtle back at start, heading up) and awards the
  chapter tick; feedback when only the turn is missing: "El quadrat és correcte. Només
  falta que la tortuga acabi mirant amunt."
- First three messages (line 1 original style, line 2 hint):
  `NO SÉ COM FER AVANCA` / `Volies dir AVANÇA?`;
  `AVANÇA NECESSITA UN NOMBRE` / `Per exemple: AVANÇA 50`;
  `NO SÉ QUÈ FER AMB 50` / `Escriu una ordre, com per exemple AVANÇA 50`.
- `CENTRE` never draws, even with the pen down (owner decision).
- OPEN: whether "El quadrat" also accepts the mirrored square drawn with `GIRA.E` (proposed yes).

## 9. Next step

v0.2 delivered (engine, monitor, chapter 1, Editor lliure). Next candidate: the script
of chapter 2 (same review flow as chapter 1), then family integration once
`step-quiz-commons` is available.

## 10. Sources and records

- Conesa, Kirchner, Marcet, *El llenguatge Logo en català*, ICE-UB, 1985:
  https://diposit.ub.edu/dspace/bitstream/2445/150269/1/Materials%20experimentals_6.pdf
- C. Solomon, *Apple Logo: Introduction to Programming through Turtle Graphics*, LCSI,
  1982: https://www.callapple.org/docs/ap2/AppleLogo.pdf
- Review artifact "Revisió 1 del curs de LOGO" (slug
  `546f6f67-a2f4-40e5-8d76-c13b8ebd6eb9`): owner answers in db collection `respostes/{id}`
  (`decisio`, `comentari`), Claude replies in `claude/{id}` (`text`).
- Review artifact "Revisió 2 del guió del capítol 1" (slug
  `d20210f4-aa5c-4636-91cc-f41ed31bdb5d`): same db schema; 15 points (G1–G3 framing,
  then S1–S6 sections, E1–E5 activities and T1 closing, in reading order).
