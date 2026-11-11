# LogoCat

Interactive course, in Catalan, to learn the LOGO language with turtle graphics, faithful
to the 1980s original (Apple Logo behaviour, Catalan vocabulary of 1985). Fifth member of
the Step Quiz "Cat" family (KarelCat, PyCat, JSCat, HTMLCat). Published at `logo.step-quiz.net`.

Static site: HTML, CSS and native ES modules. No build, no dependencies, no third-party
requests.

## Layout

| Path | What |
|---|---|
| `index.html` | Landing page with the chapter list |
| `simulador.html` | Editor lliure: procedures panel + monitor, step mode |
| `curs/capitol-N.html` | One page per chapter; text, simulators and activities |
| `js/logo/` | The language: `lexer.js`, `interpret.js` (generator-based interpreter and primitives), `tortuga.js` (turtle and field), `missatges.js` (Catalan messages), `compara.js` (drawing validation) |
| `js/ui/monitor.js` | The "monitor": turtle canvas, text lines, `?` prompt, toolbar, exercise checking; with `panel`, the simulator with procedures panel |
| `js/ui/panell.js` | Procedures panel component (`ProcPanel`): colouring, line numbers, parsing, step and error marks |
| `js/ui/editor.js` | Editor lliure wiring (panel + monitor + button column + step box) |
| `js/ui/activitats.js` | "Què dibuixarà?" and quiz |
| `js/ui/tema.js` | Light/dark theme toggle |
| `js/curs/` | Page bootstrap (`pagina.js`) and progress in `localStorage` (`progres.js`) |
| `css/logocat.css` | All styles, light and dark themes |
| `fonts/` | Space Mono (OFL), self-hosted |
| `tests/unit/` | Node test files |
| `docs/` | `STATE.md`, `DECISIONS.md`, `LANGUAGE-SPEC.md` |

## Run and test

```
python3 -m http.server 8000        # then open http://localhost:8000
node --test tests/unit/*.test.mjs
```

ES modules need a web server: opening the files with `file://` does not work.

## Authoring a chapter

```html
<div class="simulador"></div>                         <!-- free simulator -->

<div class="simulador" data-id="cap1-quadrat" data-clau data-comprova="dibuix+tortuga"
     data-si-falla="Text shown when the drawing does not match">
  <script type="text/logo">AVANÇA 50 GIRA.D 90 …</script>   <!-- one or more accepted solutions -->
</div>
```

`data-comprova`: `dibuix` (drawing only) or `dibuix+tortuga` (also final position and
heading). `data-clau` marks the exercise that awards the chapter tick. `data-exigeix="REPETEIX"`
requires that word; `data-ordre="…"` pre-writes a line at the `?` prompt. See
`curs/capitol-1.html` for `.prediu` and `.quiz`.

Simulator with the procedures panel (chapter 3 onwards):

```html
<div class="simulador" data-panell></div>             <!-- free, empty panel -->

<div class="simulador" data-id="cap3-torre" data-panell data-executa="TORRE"
     data-comprova="dibuix" data-exigeix="QUADRAT">
  <script type="text/logo-panell">PROC … FI</script>    <!-- optional: text given in the panel -->
  <script type="text/logo">PROC … FI … TORRE</script>   <!-- solution: definitions, then the call -->
</div>
```

`data-executa="NOM"`: Comprova clears the screen, runs that procedure and compares the
result. It may carry values (`data-executa="TRIANGLE 70"`, chapter 6 onwards): the
procedure must then have that many variables, and the solution script must end with the
same call. With `data-executa`, `data-exigeix="PEÇA"` means the procedure must call `PEÇA`.
See `curs/capitol-3.html`.
