# LogoCat language specification — v1.0 (approved 2026-11-10)

> Audience: a cold-start Claude session implementing the LogoCat interpreter.
> Companion to `LOGOCAT-DECISIONS.md` (read that first). Scope: everything chapters 1–12
> need. All points were approved by the owner in the review artifact "Revisió 3 de
> l'especificació del llenguatge" (2026-11-10).
> Reference behaviour: Apple Logo (LCSI, 1982). Vocabulary: Catalan (ICE-UB, 1985).

## 1. Lexical rules

- Source is a sequence of lines. Tokens are separated by spaces; `[ ] ( ) + - * / = < >`
  are self-delimiting.
- **Words** (primitive and procedure names): letters (including `Ç À È É Í Ï Ò Ó Ú Ü` and
  `L·L`), digits, and `.` `?` `!` `·` `_`; must not start with a digit. Matching is
  case-insensitive (canonical form: upper case). Diacritics ARE significant: `AVANCA` is
  not `AVANÇA` (it raises "unknown word" with a did-you-mean hint, see §8).
- **Numbers**: `50`, `3.5`, `.5`. Decimal separator is the dot. A comma
  decimal (`3,5`) is an error with the hint "Els decimals s'escriuen amb punt: 3.5".
- **Quoted word**: `"NOM` (a literal word, runs to the next space or bracket).
- **Variable reference**: `:NOM` ≡ `CONTINGUT "NOM`.
- **Lists**: `[ ... ]`, used as instruction lists (`REPETEIX`, `SI`) and as literal text for
  `ESCRIU [HOLA A TOTHOM]`. List-processing words are out of scope for v1.
- **Comments**: none. `;` has no special meaning (owner rejected comments).
- **Minus**: `a - b` and `a-b` are subtraction; `-` immediately followed by a number or
  `:` or `(` and preceded by a space or an opening delimiter is unary (`AVANÇA -50`,
  `FES.XY -20 30`).

## 2. Evaluation model

- Prefix notation with fixed arity per word; no punctuation between inputs. A line is a
  sequence of instructions: `AVANÇA 50 GIRA.D 90 AVANÇA 50`.
- **Commands** produce no value; **operations** produce one. A value nobody consumes is an
  error (`NO SÉ QUÈ FER AMB 50`). A command used where a value is needed is an error
  (`AVANÇA NO HA RETORNAT RES`).
- Infix arithmetic and comparison inside inputs: precedence `* /` > `+ -` > `= < >`,
  left-associative, parentheses allowed. `GIRA.D 360 / 5` turns 72.
- Greedy inputs: an input extends over a whole infix expression
  (`AVANÇA :COSTAT + 5` advances `:COSTAT + 5`).
- Booleans are the words `CERT` and `FALS`.
- Variables: dynamic scope, as in the original. Procedure inputs are local to the call
  and visible to callees. `POSA.A "X v` assigns the nearest existing binding, else creates
  a global. `LOCAL "X` creates a binding in the current call.

## 3. Word table (v1)

Arity in parentheses. C = command, O = operation.

| Word | Kind | Behaviour |
|---|---|---|
| `AVANÇA n` (1) | C | Move n steps along the heading; draws if pen down. Negative n moves backwards. One-time note, see §8. |
| `RECULA n` (1) | C | `AVANÇA -n`. |
| `GIRA.D a` / `GIRA.E a` (1) | C | Turn clockwise / anticlockwise by a degrees. Heading kept in [0, 360). |
| `INI.DIB` (0) | C | Clear drawing, turtle to (0,0) heading 0. Pen state, pen colour, background and edge mode are NOT reset. |
| `ESB.DIB` (0) | C | Clear drawing only. |
| `CENTRE` (0) | C | Turtle to (0,0), heading 0. NEVER draws, even with the pen down (owner decision; deviates from usual Logo HOME). |
| `APAREIX` / `DESAPAREIX` (0) | C | Show / hide the turtle. |
| `LLAPIS` / `NO.LLAPIS` / `GOMA` (0) | C | Pen down / up / erase (erase = draw in field colour, removing strokes for validation purposes). |
| `FES.COLOR n` (1) | C | Pen colour 0–5: black, white, green, violet, orange, blue. Other values: error. |
| `FES.FONS n` (1) | C | Field colour 0–5. 0 renders as the panel dark grey. |
| `COLOR` / `FONS` (0) | O | Current pen / field colour number. |
| `REPETEIX n [ ... ]` (2) | C | Run the list n times (n truncated to integer; n < 0 is an error). |
| `SI cond [ ... ]` (2 or 3) | C | Run the first list if cond is `CERT`; optional second list otherwise. Non-boolean cond: error. |
| `ACABA` (0) | C | Return from the current procedure. At top level: error. |
| `RETORNA v` (1) | C | Return v from the current procedure (makes the call an operation). |
| `ESPERA n` (1) | C | Pause n/60 seconds (scaled by nothing; skipped in validation runs). |
| `PROC nom :a :b ... FI` | special | Define a procedure. See §4. |
| `POSA.A "nom v` (2) | C | Assign. |
| `CONTINGUT "nom` (1) | O | Value of a variable. |
| `LOCAL "nom` (1) | C | Declare a local. |
| `+ - * /`, `= < >` | infix O | `/` is real division; division by zero: error. `=` compares numbers numerically, words case-insensitively. |
| `NO p` (1), `CERTS.TOTS p q` (2), `CERT.ALGUN p q` (2) | O | Logical not / and / or. |
| `ATZAR n` (1) | O | Random integer in [0, n). n < 1: error. Seedable for tests. |
| `ARREL2 n` (1) | O | Square root; negative input: error. |
| `SIN a` / `COS a` (1), `ATAN n` (1) | O | Degrees. |
| `ENTER n` / `APROX n` (1) | O | Truncate / round to nearest. |
| `QUOCIENT a b` / `RESTA.DIV a b` (2) | O | Integer quotient / remainder. |
| `ESCRIU v` (1) | C | Print v and a newline in the text zone. A list prints without brackets. |
| `ESCRIU.S v` (1) | C | Print without newline. |
| `MOSTRA v` (1) | C | Print; lists keep their brackets. |
| `PROCS?` (0) | C | Print every procedure definition. |
| `N.PROCS?` (0) | C | Print procedure title lines only. |
| `PROC? "nom` (1) | C | Print one definition. |
| `OBLIDA.PROC "nom` (1) | C | Remove a procedure (also removes it from the panel). |
| `EDITA "nom` (1) | C | Focus that procedure in the panel (creates an empty one if absent). |
| `FES.XY x y` (2), `FES.X x`, `FES.Y y` (1) | C | Move to coordinates; draws if pen down. Implemented, not taught. |
| `COOR.X` / `COOR.Y` (0), `ORIENTACIÓ` (0) | O | Turtle state readers. Implemented, not taught. |
| `FES.ORIENTACIÓ a` (1), `VERS.A x y` (2) | C / O | Set heading / heading towards a point. Implemented, not taught. |
| `M.CÍCLIC` / `M.BARRERA` / `M.FINESTRA` (0) | C | Edge mode: wrap (default) / fence / window. |

Number output: integers print without a decimal point (`90`, never `90.`); other values
print rounded to at most 4 decimals, trailing zeros removed.

## 4. Procedures and the workspace

- Definition lives in the procedures panel (left column). Title line `PROC NOM :A :B`,
  body lines, `FI` on its own line. The panel is parsed on every change; a syntax error in
  one procedure does not unload the others.
- At the `?` prompt, `PROC NOM ...` switches the prompt to `>`, collects lines until `FI`,
  then appends the procedure to the panel and prints `NOM DEFINIT`.
- `PROC NOM` at the prompt when NOM already exists is an error
  (`NOM JA ESTÀ DEFINIT`) with the hint to edit it in the panel.
- A procedure may not take the name of a primitive (`AVANÇA ÉS UNA ORDRE DE LOGO`).
- Calls: fixed arity = number of declared inputs. Recursion allowed.
- Workspace (procedures + direct-mode history + drawing) is autosaved per simulator in
  `localStorage`.

## 5. Turtle and field

- State: position (x, y) real, heading degrees (0 = up, clockwise), pen (down/up/erase),
  pen colour, visibility, edge mode, field colour. Initial: (0,0), 0, down, colour 1,
  visible, wrap, field 0.
- Field: 280 × 240 turtle steps, x ∈ [−140, 139], y ∈ [−120, 119] nominal; internally the
  wrap period is exactly 280 horizontally and 240 vertically (`AVANÇA 500` from the
  centre ends at y = 20). Rendering scales the field to the canvas, preserving 7:6.
- Wrap splits a stroke into segments at the edges. Fence: a move that would leave the
  field does not happen and raises `LA TORTUGA NO POT SORTIR DE LA PANTALLA`. Window:
  unbounded coordinates, nothing drawn outside.
- Turtle rendering (owner, 2026-11-11): filled triangle when the pen is down, hollow when
  up, dashed outline when erasing; drawn in the pen colour (contrast colour when it equals
  the field colour). Intentional deviation from Apple Logo, which shows no pen state.
- The drawing is a list of segments `{x1, y1, x2, y2, colour}` in field coordinates;
  this list (not pixels) is what validation compares.

## 6. Execution, stepping and limits

- The interpreter is a generator yielding after every primitive command (the step unit).
  The runner maps yields to animation frames according to the speed slider; "Pas"
  executes one unit; "Continua" resumes; "Atura" aborts and prints `ATURADA!`.
- Step-mode data exposed per yield: next instruction source range, call path with loop
  counters ("ROSASSA, volta 3 de 12 → QUADRAT, volta 3 de 4"), visible bindings.
- "Desfés" restores the snapshot (turtle state + segment list + variables) taken before
  the last direct-mode line. Procedure edits are not undone by it.
- Limits: 200 000 step units per direct-mode line and call depth 500.
  Exceeding either aborts with a message and a hint (see §8). No message for long but
  finite runs.
- Validation runs execute headless at full speed with `ESPERA` skipped and `ATZAR` seeded.

## 7. Deviations from Apple Logo (intentional)

Catalan vocabulary; normative diacritics; no abbreviations; `FES.XY x y` takes two
numbers (not a list); `CENTRE` never draws; numbers print without a trailing period;
procedures panel instead of the full-screen editor; no disk, package, property-list,
paddle or system words; step, speed, stop and undo controls; hint line after messages.

## 8. Message catalogue

Line 1 mimics the terse first-person voice of the original; line 2 is the family-style
hint (shown indented, with the bulb icon). `X`, `Y` stand for the offending tokens.
All approved; wording marked (owner) was written by the owner and must not be altered.

| # | Situation | Line 1 | Line 2 (hint) |
|---|---|---|---|
| 1 | Unknown word | `NO SÉ COM FER X` | `Volies dir Y?` (nearest known word, edit distance ≤ 2 or same letters without diacritics); otherwise no hint |
| 2 | Missing input | `X NECESSITA UN NOMBRE` | `Per exemple: X 50` |
| 3 | Unused value | `NO SÉ QUÈ FER AMB X` | `Escriu una ordre, com per exemple AVANÇA 50` |
| 4 | Wrong input type | `A X NO LI AGRADA Y` | `X vol un nombre, sense claudàtor` (owner) |
| 5 | Missing `]` | `FALTA TANCAR UN CLAUDÀTOR` | `Cada [ necessita el seu ]` |
| 6 | Stray `]` or `)` | `SOBRA UN CLAUDÀTOR` | `Hi ha un ] sense el seu [` |
| 7 | Variable without value | `:X NO TÉ CAP VALOR` | `És una entrada del procediment? Mira la línia PROC` |
| 8 | Command used as value | `X NO HA RETORNAT RES` | `X fa una acció, però no dona cap valor` |
| 9 | `ACABA`/`RETORNA` at top level | `X NOMÉS ES POT FER DINS D'UN PROCEDIMENT` | — |
| 10 | Procedure defined | `X DEFINIT` | — |
| 11 | Redefinition at prompt | `X JA ESTÀ DEFINIT` | `El pots canviar al panell de procediments` |
| 12 | Primitive name reused | `X ÉS UNA ORDRE DE LOGO` | `Tria un altre nom per al teu procediment` |
| 13 | Too few inputs to a procedure | `EL PROCEDIMENT 'X' NECESSITA 1 VALOR` / `… N VALORS` (owner) | `Per exemple: X 50` (built from the title line) |
| 14 | Division by zero | `NO PUC DIVIDIR ENTRE ZERO` (owner) | — |
| 15 | Fence | `LA TORTUGA NO POT SORTIR DE LA PANTALLA` | Two hint lines (owner): `Estàs en mode barrera.` / `Si vols suprimir el mode barrera, fes servir M.CÍCLIC` |
| 16 | Stopped by user | `ATURADA!` | — |
| 17–18 | Step limit or depth limit (same text) | `ATURADA!` | `Hem hagut d'aturar el programa perquè sembla que no acaba mai. Revisa les teves ordres.` (owner) |
| 19 | Comma decimal | `NO ENTENC 3,5` | `Els decimals s'escriuen amb punt: 3.5` |
| 20 | `FI` without `PROC`, `PROC` without `FI` | `FALTA FI` / `SOBRA FI` | `Cada PROC acaba amb FI` |

Additions made while implementing (same voice; NOT yet reviewed by the owner):
`X NECESSITA UNA LLISTA` (missing list input, for words other than `REPETEIX`; for
`REPETEIX` the owner wrote `REPETEIX NECESSITA SABER QUÈ HA DE REPETIR` /
`Per exemple: REPETEIX 4 [AVANÇA 50 GIRA.D 90]`, approved); `FALTA TANCAR UN PARÈNTESI` / `Cada ( necessita el seu )`; `SOBRA UN PARÈNTESI` /
`Hi ha un ) sense el seu (`;
hint variants for wrong input type: `X vol una llista entre claudàtors`,
`X vol una condició, com ara :N > 10`, `X vol un nombre` (when the value is not a list).

Reviewed and approved by the owner on 2026-11-11 (panel messages): `A PROC LI FALTA EL NOM`
/ `Per exemple: PROC QUADRAT`; `X NO ÉS DINS DE CAP PROCEDIMENT` / `Aquí només hi van
procediments (PROC … FI).` (text outside any procedure in the panel; the owner removed a
second sentence from the hint).

Approved by the owner on 2026-11-11 (chapter 4): a dotted primitive typed with a space
(`NO LLAPIS`; by extension `GIRA D 90`, `FES COLOR 2`) → `NO SÉ COM FER NO LLAPIS` /
`Volies dir NO.LLAPIS? S'escriu amb un punt i sense espai.` It fires when `A.B` is a
primitive and `A` is either `NO` or not a known word. A colour outside 0–5 for
`FES.COLOR` / `FES.FONS` → `A FES.COLOR NO LI AGRADA 9` / `Els colors van del 0 al 5`.

Approved by the owner on 2026-11-11 (chapter 5): school signs. An unknown word containing
`:` or `÷` (`360 : 5`, `360:5`) keeps `NO SÉ COM FER :` and gets the hint `Per dividir, fes
servir el signe /. Per exemple: 360 / 5`; `·`, `×`, `3X120`, or a lone `X` between two
numbers (when no procedure is named `X`) gets `Per multiplicar, fes servir el signe *. Per
exemple: 3 * 120`. These are detected before the line runs, so nothing is printed or drawn.

Messages inside a procedure append the location (owner wording):
`NO SÉ COM FER AVANSA A LA LÍNIA 2 DEL PROCEDIMENT 'QUADRAT'`.

One-time note (not an error; the instruction runs): the first time a negative number is
given to `AVANÇA`, `RECULA`, `GIRA.D` or `GIRA.E`, print under it
`AVANÇA -50 és el mateix que RECULA 50` (adapted to the word and number). Persist a flag
in `localStorage` so it never shows again in that browser.

## 9. Test obligations

Golden tests for: every word in §3; every message in §8; wrap arithmetic (`AVANÇA 500`);
step-mode call path; undo; `CENTRE` drawing nothing with the pen down; diacritic strictness
with hints; number formatting; the reference solutions of chapter 1 ("L'escala",
"El quadrat" including the missing-last-turn feedback).
