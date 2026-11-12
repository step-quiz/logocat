# CLAUDE.md — rules for AI agents working on LogoCat

<!-- regles-comunes:inici -->
## Regles comunes de Step Quiz

*Aquest bloc és igual a tots els repositoris de `step-quiz`. Les regles específiques d'aquest
repositori, si n'hi ha més avall, manen sobre aquestes quan diuen una altra cosa.*

- **Llengua.** Parla amb l'usuari en català. Tot el que veu l'alumnat, també en català.
- **L'usuari.** David, llicenciat en Matemàtiques i professor d'ESO i Batxillerat a Catalunya.
  Programa en C i dissenya algorismes; d'HTML, CSS, JS, Git, GitHub, Codespaces i LaTeX en sap
  el que cal per fer-los servir, no més. Quan hagi de fer alguna cosa (pull, push, commit, pujar
  un ZIP, compilar…), dona-li els passos numerats, amb les ordres o els textos per copiar i
  enganxar, i explica què fa cada pas.
- **ZIP.** Els ZIP que lliuris, l'usuari els puja a `_uploads/` (GitHub → `_uploads/` →
  *Add file* → *Upload files*), i el workflow `unzip-upload.yml` els descomprimeix a l'arrel i en
  fa commit. Per tant, les rutes de dins del ZIP comencen a l'arrel del repositori (`js/app.js`,
  no `projecte/js/app.js`): cap carpeta que ho contingui tot. El que hi hagi a `.github/` s'ignora;
  els workflows es canvien des del web de GitHub.
- **Publicació.** Els webs es publiquen amb Cloudflare Pages a cada commit de `main`. Cap missatge
  de commit pot portar `[skip ci]`, `[ci skip]` ni `[cf-pages-skip]`, tampoc els dels workflows
  que desen fitxers generats: Cloudflare no publicaria aquell commit.
- **Webs estàtiques.** HTML, CSS i JavaScript sense compilació ni servidor, si aquest repositori
  no diu el contrari. Cap dada personal de l'alumnat en un repositori públic.
- **Documentació.** Si canvies el comportament, posa al dia el README i els documents que el
  descriuen en el mateix commit. Si el codi i un document no coincideixen, el que s'ha
  d'arreglar és el document.
- **Proves.** Abans de lliurar res, passa les proves del repositori i digues-ne el resultat.
<!-- regles-comunes:fi -->

## LogoCat-specific rules

Read `docs/STATE.md` first (current state, what exists, what is pending), then
`docs/DECISIONS.md` (every product decision the owner has approved) and
`docs/LANGUAGE-SPEC.md` (the language contract). If code and a document disagree, fix
the document in the same change.

- **Human in the loop.** The owner decides UI, UX, pedagogy and learning progression.
  Do not invent chapters, wording of messages or screen changes: propose them. Decision
  questions go through multiple-choice dialogs; five or more points go into a review
  artifact with per-point buttons (see `docs/DECISIONS.md` §1).
- **Common files are not edited here.** `LICENSE`, `LLICENCIA.md`, `family.js`,
  `footer.js` and `img/{logocat,karelcat,pycat,jscat,htmlcat}.svg` come from
  `step-quiz/step-quiz-commons` (`comuns.json`, entry `logocat`) and are overwritten every
  day by the workflow `.github/workflows/comuns.yml`. Change them in step-quiz-commons.
- **Owner-written wording is frozen.** Messages marked (owner) in the spec, and the
  chapter prose once approved, are copied verbatim.
- **Say "variable".** In everything a student reads (prose, messages, UI), a procedure
  input such as `:COSTAT` is a "variable": never "entrada", never "capsa".
- **Version label.** Every delivery bumps `version` in `package.json` and the `v…` label
  at the bottom-right of `index.html` (a test keeps them equal).
- **Vocabulary.** Catalan primitives from the 1985 ICE-UB book, normative diacritics,
  no abbreviations. A word typed without its accent is an error with a hint, never an alias.
- **No third-party requests.** No CDN, no remote fonts, no analytics. Students are minors.
  `tests/unit/correccio.test.mjs` enforces it for the published pages.
- **No build step.** Native ES modules, plain CSS. `package.json` exists only so Node
  treats `.js` as modules and to name the test command; the site has no dependencies.
- **Tests.** `node --test tests/unit/*.test.mjs` must pass before every delivery; say the
  result. Every reference solution inside a chapter page is executed by the tests.
- **Solutions live in the page.** Exercises carry their reference solution(s) in
  `<script type="text/logo">` inside the `.simulador` element (family convention).
- **Delivery.** ZIP for `_uploads/` with repo-root paths. `.github/` inside a ZIP is
  ignored by the workflow: workflow changes are done by the owner on github.com.
