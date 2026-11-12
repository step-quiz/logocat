# LogoCat — baseline decisions (phase 0)

> Audience: a cold-start Claude session continuing this project. Everything here was
> approved by the owner on 2026-11-10 unless marked OPEN. For what is built, see `STATE.md`.
> Reply to the owner in Catalan; write AI-facing Markdown in English.

## 1. What LogoCat is

Fifth course of the Step Quiz "Cat" family (KarelCat, PyCat, JSCat, HTMLCat): a static,
build-free, Catalan-language web course that teaches the LOGO language with turtle
graphics, faithful to the 1980s original. Published at `logo.step-quiz.net` (the owner's
choice; earlier notes said `logocat.step-quiz.net`).
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
| D2 | Drawing validation: compare the student's drawn segments with a reference solution's, with tolerance, ignoring stroke order and direction (point-sampling method since v0.12, see §8h and `STATE.md`). Per-exercise options: turtle must end where it started; required construct (`REPETEIX`, a `PROC` with inputs); run a procedure with several input values. Student sees the goal as a faint overlay via a "🎯 Objectiu" button (KarelCat pattern). |
| D3 | Activity types: editable examples, validated exercise, find-the-bug, Parsons, quiz, final challenges, plus one new type: "Què dibuixarà?" (pick the right drawing before running). The unplugged "Fes de tortuga" activity was rejected. |
| A1 | Name LogoCat; turtle icon in the family "EXPLORA" selector. |
| A2 | Own interpreter following KarelCat's design (tokenizer → parser → generator-based interpreter, see `karelcat/js/{tokenizer,parser,interpreter,execution}.js`), under HTMLCat's rules: native ES modules, zero third-party requests (self-hosted fonts), tests from day one. |

## 3. Curriculum (approved)

| # | Title | LOGO | Maths |
|---|---|---|---|
| 1 | Coneix la tortuga | Direct mode; `AVANÇA`, `RECULA`, `GIRA.D`, `GIRA.E`, `INI.DIB` | Turn as angle, degrees, estimation |
| 2 | Repeteix | `REPETEIX n [ ... ]` | Square, rectangle, right angle, perimeter; 4 × 90 = 360 |
| 3 | Paraules noves | `PROC ... FI`, procedures calling procedures (`PROCS?` and `OBLIDA.PROC` work but are not taught: owner, 2026-11-11) | Decomposing figures; leave the turtle as you found it |
| 4 | El llapis | `NO.LLAPIS`, `LLAPIS`, `GOMA`, `APAREIX`, `DESAPAREIX`, `FES.COLOR`, `FES.FONS` | Translation, friezes |
| 5 | Triangles i polígons | Arithmetic in inputs (`GIRA.D 360 / 5`); `ESCRIU` with numbers, moved here from chapter 11 (owner) | Exterior/interior angles, angle sums, Total Turtle Trip theorem |
| 6 | Variables | `PROC QUADRAT :COSTAT` | Variable, similar figures, perimeter as a function of side |
| 7 | Dues variables | `PROC POLÍGON :N :COSTAT` | Generalising with 360 / N; stars as more than one full turn (no divisor theory: owner) |
| 8 | Cercles i arcs | Student-built `CERCLE :PAS`, `ARC :PAS :GRAUS` (the 1985 vocabulary has no circle primitive) | The turtle walks round (tiny step, tiny turn); full turn = circle, part of it = arc. NOT a many-sided polygon, NO π (owner, review 10) |
| 9 | Simetria | No new words; swap `GIRA.D`/`GIRA.E`; student names with a dot (`BANDERA.D`/`BANDERA.E`) | Turning a figure (gir) and mirror symmetry (simetria, eix de simetria). Tessellations moved to the final challenges chapter (owner, review 11) |
| 10 | Quadrilàters (renamed by the owner, review 12) | `ARREL2` | Parallelograms only (square, rectangle, rhombus, rhomboid): consecutive angles add to 180, opposite angles equal; the trapezoid in one sentence; Pythagoras for the square's diagonal. Isosceles/right triangles and the kite were dropped (owner) |
| 11 | Decisions i atzar | `ATZAR`, `SI cond [ ... ] [ ... ]`, `<` `>` `=` (owner, review 13: `ACABA` moved to chapter 12; `POSA.A` and `RETORNA` to the challenges chapter or the glossary) | Random numbers (a die, a coin), conditions, random walk, frequencies as a bar chart drawn by the turtle |
| 12 | Recursivitat | Self-calling procedure with a stop rule; `ACABA` (moved here from chapter 11) | Spirals (sequences), fractals (self-similarity) |

Chapter 10 replaced an originally proposed "Coordenades" chapter. Coordinate words
(`FES.XY`, `COOR.X` ...) are not taught; the engine may still implement them.
Deferred beyond v1: words and lists (`PRIMER`, `ÚLTIM`, `FRASE` ...).
`CENTRE` and the wrap phenomenon (the turtle re-entering from the opposite edge) are explained in chapter 1, where students first hit them; the three mode words (`M.CÍCLIC`, `M.BARRERA`, `M.FINESTRA`) are not taught in any chapter: they keep working and go to the glossary (owner, 2026-11-11).

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
  `step-quiz-commons` repo; see §8n for what LogoCat receives.

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
- Layout rules decided on 2026-11-11 after testing on classroom laptops (1366 × 768 and
  1920 × 1080 at 150 %, i.e. viewports around 1366 × 625 and 1280 × 585–670):
  the Editor lliure is a one-screen app, never a scrolling page (above 860 px wide); the
  drawing scales to the free height; the text zone shows exactly 5 lines, older lines roll
  up and can be reached with the wheel, with NO visible scrollbar; when the window is at
  most 720 px tall the two top bars merge into one row and the turtle status moves to a thin
  strip at the top of the monitor; the procedures panel scrolls only when the code does
  not fit, with a thin theme-coloured scrollbar (font 15 px / line-height 1.75 unchanged).
- Owner changes of 2026-11-11 (they SUPERSEDE the mockup and the bullets above where they
  conflict): the Editor lliure has three columns above 860 px wide: procedures panel 30 %,
  monitor 50 %, and a button column 20 % at the far right holding Pas, Continua, Atura,
  Desfés and Reinicia stacked, each half the column wide and aligned to the monitor side
  (so the turtle sits nearer the centre of the screen); their hover is deliberately strong:
  soft grey background and a thick pure-black border (white in the dark theme). There is a single top bar at every height: logo, Capítols / Editor lliure, speed
  slider, turtle status, state badge, theme toggle; no separate toolbar row and no status
  strip over the drawing. In the panel, the code is separated from the focus frame by the
  same 12 px that separate the line numbers, and the focus frame is inset from the panel
  edges. The `?` input has NO placeholder text when idle (the teacher explains it in
  class); this applies to every monitor, chapters included.
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
  say "ordre" and "nombre", not "primitiva". From chapter 6 on, `:COSTAT` is a "variable" (see §8f).
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
- "El quadrat" accepts the mirrored square drawn with `GIRA.E` (owner, 2026-11-11).

## 8b. Chapter 2 (script approved 2026-11-11; built)

Review artifact "Revisió 4 del guió del capítol 2" (slug
`68ed61ca-4d33-4fe3-900a-e4d08ab82bdf`). Order: Dir-ho una sola vegada → Els claudàtors
(the owner rejected saying where the bracket keys are) → "Què dibuixarà?" → Canvia els
nombres (rectangle) → exercise "El rectangle" → Quatre vegades 90 (4 × 90 = 360,
perimeter) → quiz → find-the-bug "El quadrat que no tanca" (line pre-written at `?`) →
key exercise "L'escala llarga" → summary. Nested `REPETEIX` was left out (see §8c).

- Owner wording: `REPETEIX NECESSITA SABER QUÈ HA DE REPETIR`.
- Course-wide rule (owner, 2026-11-11): an exercise accepts the mirrored figure too (the
  square or rectangle drawn to the left with `GIRA.E`); each such exercise lists both
  reference solutions.
- Course-wide rule (owner): when an exercise requires a construct and the student gets
  the right drawing without it, tell them they did it right and encourage the construct
  ("Molt bé! El dibuix és correcte. Ara prova de fer-lo amb REPETEIX: amb una sola línia
  n'hi ha prou."), in the success style. The exercise is marked done only with the
  construct.

## 8c. Chapter 3 (script approved 2026-11-11; built)

Review artifact "Revisió 5 del guió del capítol 3" (slug
`6fb22f5f-6d5e-40a8-8c48-619765f267cd`). Words: `PROC` and `FI` only; no inputs until
chapter 6. Right-angle figures only (the house waits for chapter 5, after the triangle).
Order: Posar nom a un dibuix (first procedure typed in the panel, not at `?`) → Les
regles d'un procediment (panel warning; error line inside a procedure) → exercise "El
graó" → Una paraula nova en fa servir una altra (`ESCALA` = five `GRAÓ`) → "Què
dibuixarà?" (`FINESTRA`) → Deixa la tortuga com l'has trobada → find-the-bug "La
finestra torta" (bug in `QUADRAT`, not in `FINESTRA`) → quiz → key exercise "La torre"
→ summary, invitation to the Editor lliure, bridge to chapter 4 (the pen).

- Simulators with a procedures panel from this chapter on; each simulator is independent
  and carries any procedure it needs already written (owner).
- Comprova on a procedure exercise runs the named procedure on a clean screen, in view
  of the student (owner).
- Procedure names follow the diacritics rule: `GRAÓ`, with accent (owner).
- Owner wording: the hint of `X NO ÉS DINS DE CAP PROCEDIMENT` is only `Aquí només hi van
  procediments (PROC … FI).`; `A PROC LI FALTA EL NOM` / `Per exemple: PROC QUADRAT`
  approved.
- Rejected: a box on nested `REPETEIX` (off-topic in a chapter about naming; no chapter
  assigned yet) and a box "Com es feia als anys 80" (owner: "No vull cap referència de
  text als anys 80"). `PROCS?` and `OBLIDA.PROC` are not taught.

## 8d. Chapter 4 (script approved 2026-11-11; built)

Review artifact "Revisió 6 del guió del capítol 4" (slug
`4c60e499-42fd-4a5b-8c92-633923960a30`). Order: Aixeca el llapis (`QUADRAT` given) →
"Què dibuixarà?" → exercise "Els guions" → Una sanefa (`SALT`, `SANEFA`; the word
"translació"; rule: a good procedure leaves the turtle heading as found and the pen
down) → find-the-bug "La sanefa que s'acaba" → Colors (table of six swatches) → La goma
(three pen states) → Amaga la tortuga (shares the simulator with La goma) → quiz → key
exercise "El carrer" → summary and bridge to chapter 5 (other angles, triangles).

- **Pen indicator (owner).** The owner wants the pen state visible, also in chapters: not
  showing it was a limitation of 1980s hardware, not something to preserve. Chosen in a
  dialog: the turtle itself changes (filled = down, hollow = up, dashed outline = eraser)
  and takes the pen colour. No status line in chapter simulators.
- `INI.DIB` does not reset pen or colours (as the original); Reinicia and Comprova start
  from pen down, white pen, dark field, visible turtle (owner).
- Comprova compares strokes, not colours (owner). The final pen state is NOT part of the
  checked final state (owner rejected the proposal); "Els guions" therefore does not ask
  for it.
- Owner-approved messages: `NO SÉ COM FER NO LLAPIS` / `Volies dir NO.LLAPIS? S'escriu amb
  un punt i sense espai.`; `A FES.COLOR NO LI AGRADA 9` / `Els colors van del 0 al 5`.
- Edge modes left out of the chapter; figures are sized to stay inside the field.

## 8e. Chapter 5 (script approved 2026-11-11; built)

Review artifact "Revisió 7 del guió del capítol 5" (slug
`5415372e-08be-4abf-ac31-e02a746f71f3`). Order: El triangle que no tanca (the student
first hits the 60° error, then it is explained) → exercise "El triangle" → La volta
sencera → LOGO fa els comptes (four signs, `ESCRIU`) → "Què dibuixarà?" (hexagon) →
find-the-bug "El pentàgon obert" → L'angle de fora i l'angle de dins (table) → quiz → key
exercise "La casa" → summary and bridge to chapter 6 (inputs: `TRIANGLE 80`).

- Names (owner): "la regla de la volta sencera" for the Total Turtle Trip theorem, to be
  reused in chapters 7–9; "angle exterior" / "angle interior".
- Owner wording (frozen): "L'angle exterior i l'angle interior sempre sumen 180°."
- Spacing rule taught: always one space on each side of an arithmetic sign (this hides the
  `180 -60` unary-minus trap, which is not explained).
- Owner-approved hints: `:` → `Per dividir, fes servir el signe /. Per exemple: 360 / 5`;
  `X` or `·` between numbers → `Per multiplicar, fes servir el signe *. Per exemple: 3 * 120`.
- "La casa": the statement does not give the 30° turn (owner approved leaving it to
  discovery); the failure hint says to try it at the `?` line.
- Nested `REPETEIX`: not in this chapter; maybe in a final extension / challenges chapter.

## 8f. Chapter 6 «Variables» (script approved 2026-11-11; built)

Review artifact "Revisió 8 del guió del capítol 6" (slug
`901366e7-80ed-4930-8c25-29b13263b4b0`), plus a three-question dialog. Order: Un quadrat
de cada mida → Les regles d'una variable → "Què dibuixarà?" → exercise "El triangle de
qualsevol mida" → Figures semblants (`PERÍMETRE`) → find-the-bug "El quadrat que no
creix" → La variable passa d'un procediment a un altre (`DOS.QUADRATS`) → quiz → key
exercise "La casa de qualsevol mida" → summary and bridge to chapter 7.

- **Terminology (owner, binding everywhere).** `:COSTAT` is always a "variable". Never
  "entrada", never "capsa" (the owner rejected the box metaphor): in chapter prose, in
  LOGO messages and in UI texts. Chapters 6 and 7 are titled «Variables» and «Dues
  variables». The already-approved hint of `:X NO TÉ CAP VALOR` was reworded to `És una
  variable del procediment? Mira la línia PROC`.
- **Comprova with one value (owner).** The proposal to test a procedure with two values
  was rejected. Comprova runs one call, named in the statement (`TRIANGLE 70`); pick a
  value different from the 50 students tend to leave inside.
- The step box of chapter simulators shows a third row, "Valors" (owner).
- Panel and monitor share the simulator half and half (owner), so the 39-character line
  `  REPETEIX 4 [AVANÇA :COSTAT GIRA.D 90]` needs no horizontal scrollbar.
- Owner-approved messages (with "variables"): `Volies dir :COSTAT? Les variables
  s'escriuen amb dos punts al davant.`; `Els dos punts van enganxats al nom, sense espai:
  :COSTAT`; `LES VARIABLES DE PROC PORTEN DOS PUNTS` / `Per exemple: PROC QUADRAT :COSTAT`.
- Maths vocabulary: "figures semblants"; the variable goes to lengths, never to turns.
- The landing page shows the delivered version at the bottom-right (owner request).

## 8g. Chapter 7 «Dues variables» (script approved 2026-11-11; built)

Review artifact "Revisió 9 del guió del capítol 7" (slug
`bcd59d50-6dcb-44c4-9398-01d2ad131184`). Order: Un procediment per a tots els polígons →
L'ordre importa → "Què dibuixarà?" → exercise "El polígon" → find-the-bug "El pentàgon
petit" → Estrelles → quiz → key exercise "L'estrella" → summary, bridge to chapter 8.

- **No star-polygon theory (owner).** The {n/k} theory and divisors do not belong in this
  course. The planned section "Estrelles que no surten" and its table were dropped; the
  only trace is the owner's sentence, verbatim: "De vegades l'estrella no surt sencera."
- **A many-sided polygon is not a circle (owner).** Never write or suggest that a polygon
  "looks like a circle"; `POLÍGON 40 5` is a 40-gon. Examples use few sides (owner's own
  example for argument order: `POLÍGON 8 10` vs `POLÍGON 10 8`). Keep this in mind when
  scripting chapter 8 (circles).
- The rule of the full turn is extended, same name: a star makes more than one full turn.
  The second variable of `ESTRELLA` is `:VOLTES` (owner; not `:SALT`).
- Missing-value message (owner): hints are the procedure's `PROC` line and an example
  built from the values the student already typed (`POLÍGON 5` → `Per exemple: POLÍGON 5
  20`; with no value typed, 50 is used).
- Panel 55 % with 13 px code font (owner), for the 46- and 49-character lines.

## 8h. Chapter 8 «Cercles i arcs» (script approved 2026-11-11; built)

Review artifact "Revisió 10 del guió del capítol 8" (slug
`f9fb5be4-9282-4294-80a3-5557042d8bda`; 20 points: G1–G7, chapter points, and P1–P3 for
questions left open by earlier chapters), plus a two-question dialog. Order: La tortuga
camina en rodó → Un cercle de cada mida → "Què dibuixarà?" (half circle) → exercise "El
cercle" → find-the-bug "El cercle que no tanca" → Arcs → quiz → key exercise "El pètal"
→ summary, the flower, bridge to chapter 9 (symmetry).

- **How the circle is presented (owner, option A).** "La tortuga camina en rodó": a short
  step and a small turn, again and again, like walking round a roundabout. Never say
  "polígon", never "s'assembla". The rule of the full turn explains why it closes
  (360 turns of 1° = one turn). A test forbids `polígon|assembl|costats` in chapter 8.
- **Variable of `CERCLE` (owner): `:PAS`**, not `:RADI` (that needs π, and its line has
  53 characters). Good values 0.2–1.2; the text says `CERCLE 2` does not fit and wraps.
  `ARC :PAS :GRAUS` (`:GRAUS` is a repeat count, not a turn; owner kept the name).
- **No π (owner).** «No m'interessa treballar el nombre pi en aquest entorn de LOGO»: the
  turtle only approximates. The planned section "Quantes vegades hi cap?" (measuring the
  diameter, `ESCRIU 360 / 115`) and the π conclusion were dropped and NOT replaced (owner,
  dialog). Do not bring π back in later chapters without asking.
- Quiz question 3 (owner, dialog): «Quin cercle és més petit?» CERCLE 1 · **CERCLE 0.5** ·
  Són iguals (replaces a question that relied on π).
- **Comprova sees curves (owner, G5).** New point-sampling comparison for ALL exercises
  (see `STATE.md`, Drawing validation). Every earlier chapter re-checked.
- "El pètal": the 90° turn between the arcs is not given; it follows from the rule of the
  full turn; the failure text says to try it at the `?` line (as "La casa", chapter 5).
- Decimals: typed with a dot (`0.5`); the text says so once.
- Chapter 5: the sentence «Com més costats, més s'assembla a un cercle.» was removed
  (owner, P1); the paragraph now reads «Prova amb 8, 10 i 12 costats.»
- Messages: see `LANGUAGE-SPEC.md` §8 (chapter 8 block). The missing-value example change
  also removed the «Per exemple: QUADRAT 50» line quoted in chapter 6's text, so that the
  page shows the real message.

## 8i. Chapter 9 «Simetria» (script approved 2026-11-12; built)

Review artifact "Revisió 11 del guió del capítol 9" (slug
`4c32f8e9-baf6-4de3-b8b1-70c2d3963b5a`; 14 points, all approved). Order: Girar una figura
(the chapter 8 flower, then `REPETEIX 4 [BANDERA.D GIRA.D 90]`) → "Què dibuixarà?"
(`REPETEIX 3 [BANDERA.D GIRA.D 120]`) → find-the-bug "El molinet torçat" → El mirall (a
staircase and its mirror at the `?` line, `CENTRE` in between) → exercise "La bandera
del mirall" → quiz → key exercise "El molinet" → summary, bridge to chapter 10.

- **Maths words (owner, option A).** "gir" (turning a figure about a point), "simetria",
  "eix de simetria" (the line the turtle faced at the start). Frozen sentence: «La
  translació, el gir i la simetria mouen una figura sense canviar-ne la forma ni la mida.»
- **Mosaics (owner, option A):** not in chapter 9; they go to the final challenges
  chapter, with nested `REPETEIX`. A test forbids "mosaic" in chapter 9.
- **Names with a dot (owner):** `BANDERA.D` / `BANDERA.E`, mirroring `GIRA.D` / `GIRA.E`.
- The mirror rule taught: change every `GIRA.D` into `GIRA.E` AND every `GIRA.E` into
  `GIRA.D`. The flag contains one `GIRA.E` so that the naive D→E replacement fails.
- "El molinet": `MOLINET 5` is checked with one value (chapter 6 rule); a `MOLINET` with
  72 typed by hand also passes (owner informed, accepted).
- Messages: see `LANGUAGE-SPEC.md` §8 (chapter 9 block).

## 8j. Chapter 10 «Quadrilàters» (script approved 2026-11-12; built)

Review artifact "Revisió 12 del guió del capítol 10" (slug
`b4776efc-359f-421c-9412-d49ed735c373`; 15 points, all approved with the recommended
options). Order: El romboide (line at `?`) → "Què dibuixarà?" → exercise "El romboide" →
La família dels paral·lelograms → find-the-bug "El romboide que no tanca" → La diagonal
del quadrat → quiz → key exercise "El rombe de 70 graus" → summary, bridge to chapter 11.

- **Scope (owner, G2 A):** parallelograms only; title «Quadrilàters». Chapter 9's bridge
  sentence was changed accordingly to «Al capítol següent: quadrilàters de tota mena.»
- **Half-turn rule:** in each half of a parallelogram the turtle turns twice, and the two
  turns add up to 180; with chapter 5's frozen sentence, consecutive interior angles add
  to 180 and opposite ones are equal. Frozen sentences: «El quadrat és alhora un
  rectangle i un rombe.», «El trapezi només té dos costats paral·lels: no és un
  paral·lelogram.»
- **ARREL2 and Pythagoras (owner, G3 A):** section without exercise; frozen sentence «És
  el teorema de Pitàgores: la diagonal al quadrat és igual a la suma dels dos costats al
  quadrat.» Parentheses appear here for the first time, with one sentence: «Els parèntesis
  diuen a LOGO que primer faci el càlcul de dins.»
- **No angle variable (owner, G4 A):** chapter 6's rule (variables go to lengths) holds.
  `ROMBOIDE :BASE :COSTAT` with turns 60/120 written inside; the family is shown by
  editing the turns by hand.
- **Half on one line, twice (owner, G5):** `REPETEIX 2 [...]` does not fit 52 characters.
- Messages: see `LANGUAGE-SPEC.md` §8 (chapter 10 block).

## 8k. Chapter 11 «Decisions i atzar» (script approved 2026-11-12; built)

Review artifact "Revisió 13 del guió del capítol 11" (slug
`3939c5f6-2bb8-4a39-b158-20bd38a9dc5e`; 15 points, all approved with the recommended
options). Order: Un dau → Un passeig a l'atzar → Decisions (`SI`, `MONEDA`) → "Què
dibuixarà?" → find-the-bug "El cercle que no hi cap" → Cares i creus → quiz → key exercise
"El quadrat que hi cap" → summary, bridge to chapter 12.

- **Words (owner, G2 A):** only `ATZAR` and `SI`. No quoted words in the course yet.
- **`ATZAR N` first (owner, comment on G4 and S1):** before `SI`, explain very clearly
  that `ATZAR N` gives a number of {0, 1, …, N − 1}: N possible results, N never comes out,
  because counting starts at 0; `ATZAR 2` gives only 0 or 1. A test checks the order.
- **No randomness in exercises (owner, G3 A):** Comprova runs the reference with a fixed
  `ATZAR` and the student with real randomness, so random drawings cannot be compared.
  Chapter 11 therefore has 2 exercises, not 3.
- **The `ATZAR 2 = 0` trap (owner, G4 A):** in Logo a prefix word takes the whole infix
  expression after it, so `SI ATZAR 2 = 0 [...]` gives `ATZAR` the value `FALS`. Kept as
  in Apple Logo; taught as `SI (ATZAR 2) = 0 [...]`, with a hint on the error.
- **Second list of `SI` (owner, G5):** taught from the start. Frozen sentence: «La segona
  llista és el que fa la tortuga si la condició no es compleix.» Also frozen: «Si tires
  una moneda moltes vegades, surt cara més o menys la meitat de les vegades. Però no saps
  mai quantes exactament.»
- Messages: see `LANGUAGE-SPEC.md` §8 (chapter 11 block).

## 8l. Chapter 12 «Recursivitat» (script approved 2026-11-12; built)

Review artifact "Revisió 14 del guió del capítol 12" (slug
`4ed0ce99-f152-4442-97fc-9d77f851b0b5`; 15 points, all approved with the recommended
options). Order: Un procediment que es fa servir a si mateix (with "La regla per
aturar-se" in the same section and simulator) → "Què dibuixarà?" → find-the-bug
"L'espiral que no surt" → exercise "L'espiral triangular" → Un arbre → quiz → key
exercise "L'espiral que s'encongeix" → summary and end of the course.

- **Scope (owner, G2 A):** spirals with exercises; the fractal tree as a section without
  exercise. Frozen: «Cada branca és un arbre més petit. Una figura així es diu fractal.»
- **Maths words (owner, G3 A, with his wording):** «Els costats formen una successió: cada
  nombre s'obté sumant 5 al nombre anterior.» No "progressió aritmètica".
- **Frozen:** «Un procediment que es fa servir a si mateix necessita una regla per
  aturar-se. Sense la regla, no acabaria mai.»
- **End of the course (owner, G6 A):** «Has acabat el curs. Ara ja pots inventar els teus
  dibuixos a l'Editor lliure.» The challenges chapter is decided later in its own review;
  if it is built, chapter 12's closing and footer change.
- Messages: see `LANGUAGE-SPEC.md` §8 (chapter 12 block).

## 8m. Glossary (review 15, approved 2026-11-12; built)

Review artifact "Revisió 15: el glossari" (slug `e5fac928-a3d0-42b1-a8a4-641f46561600`).
- **Which words (G1 A):** two parts, course words (with chapter) and other words the
  engine knows, without the coordinate words (D1: no coordinate geometry).
- **Order (G2 A):** by theme, in this order: Moure la tortuga · El llapis i els colors ·
  Repetir · Procediments i variables · Nombres i càlculs · Atzar i decisions · La pantalla
  i els modes · Veure i esborrar procediments; alphabetical inside a theme; theme index on
  top.
- **Entry (G3):** word, one sentence to the student, a one-line example, chapter link or
  «No surt al curs». Deviation: entries that cannot be shown in one line (`PROC`, `FI`,
  `:NOM`, `ACABA`, `LOCAL`, `RETORNA`) have a short multi-line example instead.
- **«Prova-ho» (G4 A):** opens the Editor lliure in a new tab with the example typed at
  `?`. Only for one-line examples that run in an empty Editor lliure (and `M.BARRERA
  AVANÇA 200`, which shows the fence message on purpose).
- **No ideas section (G5: no).**
- **Access (G6):** «Glossari» in the top bar of every page.
- **Edge modes (G7):** the three approved sentences, frozen.

## 8n. LogoCat in the Step Quiz family (review 16, approved 2026-11-12; built)

Review artifact "Revisió 16: LogoCat a la família" (slug
`98e0f05a-b13a-4f51-a170-8afb71f169b6`), plus a dialog on the certificate.
- **Files (F1 A, then reduced by F5):** licence, icons, `family.js`, `footer.js`. No touch
  key bar. No certificate and no shared `progress.js` (they only served the certificate).
- **No Google Fonts (F2 A):** new option `fontExterna: false` in step-quiz-commons'
  `family.js`, used only by LogoCat; other webs unchanged.
- **Selector (F3 A):** LogoCat first in `CAT_PROJECTS`; every web shows 5 icons. In LogoCat
  the selector is not on the Editor lliure page (no room at 1366 px; same reason as F6).
- **Icon (F4 A):** hand-drawn top-view green turtle, `img/logocat.svg`.
- **Certificate (F5, owner):** LogoCat, like HTMLCat, is outside the KarelCat → PyCat → JSCat
  chain, and has no certificate. F7 (when a chapter counts) therefore does not apply.
- **Footer (F6 A):** index, chapters, glossary; not the Editor lliure.

## 8o. Challenges «Reptes» (review 17, approved 2026-11-12; built)

Review artifact "Revisió 17: el capítol de reptes" (slug
`5d6de9d7-0e83-4e50-a228-3ad35c9c3703`), all points approved, plus a dialog.
- **Three levels, three strategies (G1, G2):** each level opens with its three-step
  planning text (owner-approved, frozen): N1 «Troba la peça que es repeteix» (one piece,
  count, full-turn rule), N2 «Peces que encaixen» (pieces; plan where the turtle starts and
  ends each piece; pieces first, then the joining procedure), N3 «Generalitza» (the smaller
  copy inside; what changes; stop rule first, then the self-calling procedure). 3 challenges
  per level.
- **Pages (G3 A):** `curs/reptes-1.html`, `-2`, `-3`; «Reptes» in the top bar of every page
  with a «Seccions» nav (all but 404) → `index.html#reptes`, a section under the chapters
  listing the levels with «N de 3 fets» / «✓ fet» (`js/curs/portada.js`).
- **Open access (G4 A):** «Recomanat després del capítol 7 / 9 / 12», no locking.
- **Panel (G5 A):** N2 gives the base piece (`QUADRAT` 25; ch. 6's `QUADRAT :COSTAT`,
  `TRIANGLE :COSTAT`, `CASA :MIDA`; `HEXÀGON` 30); N1 and N3 nothing. Owner asked why nothing
  in N3: the piece and the figure are the same procedure; R8 also without `QUADRAT :C`
  (dialog).
- **Hints (G6 A + owner):** «Una pista» shows a strategy sentence; then «Una altra pista»
  shows a more concrete one (numbers, a code fragment, never the whole solution); then the
  button disappears. Markup `<div class="pistes"><p>…</p><p>…</p></div>`, mounted by
  `pagina.js`. Second-hint texts approved in the dialog.
- **Checking (G7):** target visible, turtle from home, exact drawing and position, drawing
  only (`data-comprova="dibuix"`), no `data-exigeix`. Every challenge has `data-clau`; the
  top-bar «✓ Nivell fet» needs all three (pagina.js now accepts several `data-clau`).
- **Nested REPETEIX (G8 A):** N2 explains it with
  `REPETEIX 4 [REPETEIX 4 [AVANÇA 20 GIRA.D 90] GIRA.D 90]`; no challenge requires it.
- **N1 statement (G9 A, owner's idea):** «Reprodueix el dibuix que veus aquí. Defineix X:
  quan premis «Comprova», la tortuga farà X.» — no description; the student counts and
  measures. Challenge simulators get `data-quadricula`: a faint grid every 10 steps, a bit
  stronger every 50 (`Monitor` option `grid`); all sizes are multiples of 10 where measured.
- **Typos (owner question, dialog):** the existing nearest-word hint already uses
  Levenshtein distance (≤ 2, ≤ length/3, accents and ç ignored): `ABANÇA`, `AVAANÇA`,
  `AVANÇ`, `AVAÇA` → `NO SÉ COM FER …` / `Volies dir AVANÇA?`. Owner: keep it as a hint and
  stop; never auto-correct and run.

## 8p. Final review (review 18, approved 2026-11-12; built in v0.20)

Review artifact "Revisió 18: revisió final de LogoCat" (slug
`efab7680-6413-4d2b-85e5-f34316bbd7cb`): 23 points, all approved.
- **Engine and messages (B1, B2, B4, B5, P4, P5, U4):** see LANGUAGE-SPEC §8, block
  "review 18". P5: the owner asked to extend the list further; the extension goes to
  review 19.
- **Accent at «Comprova» (B3, owner wording):** `Has definit POLIGON, però el nom en català
  és POLÍGON, amb accent.`
- **Editor lliure bar (U1 A):** below 1340 px the label «Velocitat:» is visually hidden and
  the status reads `0° · a baix · blanc` (titles «Orientació», «Llapis», «Color»). Reptes
  pages: the bar title is «Nivell N». One row from 1024 px up (tested).
- **Theme button (U2)** on the index, the glossary and the 404 page (which now has a
  minimal bar: logo + theme). Module `js/curs/tema-pagina.js` for pages without simulators.
- **Index (U3):** «✓ fet» on each chapter whose key exercise is done (`data-clau` on the
  chapter link = the key exercise id).
- **Tablets (U4):** `autocorrect="off"` on the panel; typographic quotes accepted;
  `touch-action: manipulation` on buttons; on coarse pointers the `?` input is refocused
  only after a run started from it (Enter), never after a button.
- **Key bar (U5):** own module `js/ui/tecles.js` (not commons' kbd-accessory.js, which
  handles one editor per page). Only with `(pointer: coarse)`, while the `?` input or a
  panel textarea has focus. Keys `[ ] : . + - * / = < >` and `↑` (previous line; only for
  `?`). No words (owner gave none). Positioned with `visualViewport` at the edge of the
  visible area farther from the field. Not tested on a real tablet.
- **Quiz (P1):** options shuffled on every visit.
- **Chapter 7 key exercise (P2 A):** `ESTRELLA` with three variables (points, turns, side);
  «Comprova» runs `ESTRELLA 7 3 60`. Statement and fail text adapted minimally (owner
  sentence kept: «El gir surt de dues de les variables: …»). A student who names the third
  variable `:COSTAT` writes a 56-character line: the panel (54 visible) scrolls 2 characters.
- **Challenges announced (P3):** «Ja pots fer els reptes del nivell N →» at the end of
  chapters 7, 9 and 12; chapter 12 footer adds «Reptes · Nivell 3 →».
- **Exercise panels saved (M1):** `logocat-panell-<data-id>` in `localStorage`; «Torna a
  començar» in the panel header restores the initial text (confirm dialog if the panel
  changed: «Vols tornar a començar? Es perdrà el que has escrit al panell.»).
- **Editor lliure files (M2, M3):** «Desa en un fitxer» (`logocat-procediments.txt`), «Obre
  un fitxer» (replaces the panel; confirm «Vols canviar els procediments del panell pels del
  fitxer?» if it is not empty), «Desa el dibuix» (`logocat-dibuix.png`, the canvas as
  shown). Bottom of the button column.
- **Teacher guide (M4 A):** first a draft as a Claude doc, outside the web: "LogoCat · Guia
  del professorat (esborrany)", https://claude.ai/artifact/WwFkLzukCyvPffHVWDVGcN .
- **Code (C1):** `aria-label` removed from the version label; three useless regex escapes
  removed; `ProcPanel.resetText()` is now used by M1.
- **Browser tests (C2):** `tests/navegador/prova.mjs` (Playwright; own static server):
  every page at 1366×625, 1280×585 and two tablet sizes (no errors, no external requests,
  no horizontal scroll, one-row top bar), every exercise and challenge solved through
  «Comprova», and the review-18 behaviours. CI job `navegador` in `ci.yml` (the owner
  edits `.github/` on github.com).
- **HANDOUT.md (C3)** at the repo root for a future session.

## 8q. Hints and texts (review 19, approved 2026-11-12; built in v0.21)

Review artifact "Revisió 19: pistes dels exercicis i textos nous" (slug
`c4ea3382-a0f7-456a-9b07-22c79f33b1e3`): 47 points, all approved.
- **A1–A34:** «Una pista» / «Una altra pista» after every chapter exercise (34), the exact
  texts of `tests/unit/pistes19.data.mjs` (frozen). Same markup and mechanism as the
  challenges (`<div class="pistes">`, mounted by `pagina.js`).
- **E1–E8:** LANGUAGE-SPEC §8, block "review 19". E2 extended with the owner's comment
  ("azar, fin, …").
- **T1, T2 (owner wording):** «Segur que vols tornar a començar? Pensa que es perdrà tot el
  que has escrit al panell.» and «Segur que vols canviar els procediments que hi ha al panell
  pels que hi ha al fitxer? Pensa que perdràs el que tens ara escrit.»
- **T3:** the chapter 7 statement and fail text as built in v0.20.
- **T4:** key bar `[ ] ( ) : . " + - * / = < >` and `↑`.
- **G1:** the teacher guide draft is approved as it is (Claude doc, outside the web).

## 9. Next step

Nothing pending from the owner as of v0.21. Possible later work, only if he asks: the
final form of the teacher guide (it is approved as a Claude doc); real-tablet checks of the
key bar; adding LogoCat to HTMLCat's own `family.js` (outside this repo).

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
