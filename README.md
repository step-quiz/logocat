# LogoCat

Interactive course, in Catalan, to learn the LOGO language with turtle graphics, faithful
to the 1980s original (Apple Logo behaviour, Catalan vocabulary of 1985). Fifth member of
the Step Quiz "Cat" family (KarelCat, PyCat, JSCat, HTMLCat). Target: `logocat.step-quiz.net`.

Static site: HTML, CSS and native ES modules. No build, no dependencies, no third-party
requests.

## Layout

| Path | What |
|---|---|
| `index.html` | Landing page with the chapter list |
| `curs/capitol-N.html` | One page per chapter; text, simulators and activities |
| `js/logo/` | The language: `lexer.js`, `interpret.js` (generator-based interpreter and primitives), `tortuga.js` (turtle and field), `missatges.js` (Catalan messages), `compara.js` (drawing validation) |
| `js/ui/monitor.js` | The "monitor": turtle canvas, text lines, `?` prompt, toolbar, exercise checking |
| `js/ui/activitats.js` | "Què dibuixarà?" and quiz |
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
heading). `data-clau` marks the exercise that awards the chapter tick. See
`curs/capitol-1.html` for `.prediu` and `.quiz`.
