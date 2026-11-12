# LogoCat — hand-over notes

Entry point for a new session (human or AI) that has to continue this project cold. Read
this file, then `CLAUDE.md`, then `docs/STATE.md`, `docs/DECISIONS.md` and
`docs/LANGUAGE-SPEC.md`. As of v0.21 (2026-11-12).

## 1. What the project is

A static web course (Catalan UI, 12–13-year-old students) that teaches Apple-Logo-style
LOGO with the 1985 ICE-UB Catalan vocabulary (`AVANÇA`, `GIRA.D`, `REPETEIX`, `PROC … FI`).
Published at `logo.step-quiz.net` (Cloudflare Pages, deployed from the GitHub repo's
default branch). Member of the Step Quiz "Cat" family (KarelCat, PyCat, JSCat, HTMLCat).
No build, no dependencies, no third-party requests (students are minors).

Content: 12 chapters (`curs/capitol-N.html`), 9 challenges in 3 levels
(`curs/reptes-N.html`), glossary (`glossari.html`), Editor lliure (`simulador.html`).
Progress, exercise panels and the Editor lliure procedures live in `localStorage` only.

## 2. Code map

- `js/logo/`: `lexer.js` → tokens with source positions; `interpret.js` → generator-based
  interpreter (`runLine`, `runScript`, `runSync`, `defineAll` for the panel, primitives in
  `buildPrimitives`, limits `MAX_STEPS` 200 000 and `MAX_DEPTH` 500); `tortuga.js` → turtle
  and 280 × 240 field (wrap / fence / window); `missatges.js` → `LogoError` and
  `describe(err, knownWords) → { line1, hints }`; `compara.js` → point-sampling drawing
  comparison (`compareDrawings`, `comparePose`).
- `js/ui/`: `monitor.js` (canvas, `?` prompt, buttons, «Comprova»), `panell.js`
  (procedures panel), `editor.js` (Editor lliure), `activitats.js` («Què dibuixarà?», quiz),
  `tecles.js` (touch key bar), `tema.js` (theme).
- `js/curs/`: `pagina.js` (chapter/challenge bootstrap), `progres.js`, `portada.js`,
  `tema-pagina.js`.
- Exercise markup: `.simulador[data-id][data-panell][data-executa][data-comprova]
  [data-exigeix][data-clau][data-si-falla][data-quadricula]` with
  `<script type="text/logo-panell">` (given panel) and `<script type="text/logo">`
  (reference solutions; a mirrored one may follow). «Comprova» runs `data-executa` on a
  clean screen and compares the drawing (and pose with `dibuix+tortuga`).
- Common family files (`family.js`, `footer.js`, `LICENSE`, `LLICENCIA.md`,
  `img/*cat.svg`) come from `step-quiz/step-quiz-commons` via `.github/workflows/comuns.yml`.
  Never edit them here.

## 3. Tests

- `node --test tests/unit/*.test.mjs` (143 tests): engine, every message, every chapter
  page (texts the owner froze, reference solutions, line lengths ≤ 52 in panels and
  solutions), challenges, glossary, family files, review 18.
- `node tests/navegador/prova.mjs` (Playwright, 154 checks): every page at 1366×625,
  1280×585, 1180×740 and 1024×690 (touch), every exercise and challenge solved through
  «Comprova», review-18 behaviours. Needs `npm install --no-save playwright` and a Chromium
  (`npx playwright install chromium`, or `CHROME_PATH=…`).
- CI: `.github/workflows/ci.yml`. The browser job only exists once the owner pastes the
  v0.20 version of that file on github.com (see §5).

## 4. How the owner works (binding)

- The owner is a maths teacher (ESO and Batxillerat, Catalonia) and an algorithms expert
  who programs in C. Chat with him in **Catalan**. Every `.md` file is for an AI reader:
  **English, technical**.
- He decides UI, UX and pedagogy: propose, never decide. Wording he wrote or approved is
  **frozen** (marked "(owner)" in the code and the spec).
- Questions to him go through the multiple-choice dialog (≤ 4 questions, 2–4 options, the
  recommended one first with «(Recomanat)»), never as plain text.
- Five or more points to decide → a **review artifact** (claude-artifacts MCP:
  `publish_files`, then `declare_capabilities {"db":{}}`): points grouped by category, each
  with an id (B1, C2…), what happens, the proposal and a question; buttons «Sí, fes-ho»,
  «No», «Més endavant», «En parlem», a comment field, autosave, an answered counter and a
  «Sense resposta» filter. In chat, only 2–3 sentences and the link. When he writes
  «Revisa artifact»: read `respostes` with `db_list`, ask about open decisions with the
  dialog, reply to each point in the artifact (`claude/{id}` = `{text}`) and build what he
  approved. The page builder used so far: a template with `CATS` and `POINTS` arrays
  (rows of `[label, html]`, optional `codi`, `extra`, `pregunta`).
- Turn A / Turn B for new content: script first as a review artifact (run the engine on
  the mistakes students will make; panel lines ≤ 52 characters), build only after his
  answers.
- Rules of the course text: say «variable», never «entrada» or «capsa»; no new references
  to the 1980s; a polygon is not a circle; no π; no star-polygon theory.
- Delivery: a ZIP whose root is the repo root (he uploads it to `_uploads/` on github.com;
  `unzip-upload.yml` extracts it and dispatches `ci.yml`). `.github/` inside a ZIP is
  ignored: workflow changes are pasted by him on github.com. Explain every git / upload
  step in Catalan with copy-paste blocks. Never put «[skip ci]», «[ci skip]» or
  «[cf-pages-skip]» in a commit message (Cloudflare Pages would not publish).
- Every delivery bumps `package.json` `version` and the `v…` label in `index.html`.
- His e-mail address is private: never send it to an external service.

## 5. Open items (as of v0.21)

Nothing is waiting for the owner: reviews 18 and 19 are fully built.
1. **Teacher guide**: approved as a Claude doc ("LogoCat · Guia del professorat
   (esborrany)", outside the web). Its solutions and error table describe v0.21; update it
   if exercises or messages change.
2. **CI browser job**: exists once the owner has pasted the v0.20 `ci.yml` on github.com
   (job `navegador`). If the Actions tab shows only the `tests` job, he has not done it.
3. HTMLCat's own `family.js` still lacks LogoCat (outside this repo).
4. Not verified on real tablets: the key bar and the focus rule (Chrome touch emulation
   only).
