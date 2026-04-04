# LOGOcat 🐢

Intèrpret Logo educatiu multiidioma (català, castellà, anglès) per al navegador.

Els alumnes escriuen ordres com `avança(100)` o `gira.dreta(90)` i veuen com la tortuga dibuixa formes al llenç. Inclou reptes guiats, autocompletat, errors contextuals amb suggeriments, i previsualització de l'objectiu.

## Per a docents

### Com funciona

Obriu `index.html` al navegador. No cal instal·lar res — tot funciona localment sense servidor.

L'alumne veu dues columnes: a l'esquerra el llenç amb la tortuga, a la dreta l'editor de codi. Escriu ordres, prem **▶ Executa**, i la tortuga es mou.

### Idiomes

Hi ha dos selectors independents:

- **Codi** — l'idioma de les ordres de programació (`avança` / `avanza` / `forward`)
- **Idioma** — l'idioma de la interfície (botons, missatges d'error, pistes)

Això permet, per exemple, que un alumne castellanoparlant programi en català mentre veu la interfície en castellà.

### Reptes

Hi ha 12 reptes organitzats en dues categories:

- **Bàsics** (7): línia, quadrat, triangle, estrella, escala, hexàgon, casa
- **Avançats** (5): cercle, línia discontínua, ventall, flor, caleidoscopi

Cada repte inclou codi inicial, pistes amb temporitzador (30 segons), previsualització de l'objectiu, i validació automàtica del resultat.

### Errors pedagògics

Si l'alumne escriu `avanssa(100)`, el sistema suggereix *"Volies dir avança?"* gràcies a la distància Levenshtein. Si escriu `avança()` sense número, l'error explica exactament què falta. Els missatges apareixen en un post-it destacat amb exemples de codi correcte.

## Per a desenvolupadors

### Estructura

```
logocat/
├── index.html          # Estructura HTML
├── style.css           # Estils (tema fosc/clar, responsive)
├── build.sh            # Genera versió fitxer únic a dist/
└── js/                 # Mòduls (ordre de dependència obligatori)
    ├── constants.js    # Namespace L, utilitats, mapes de comandes
    ├── i18n.js         # Traduccions CA/ES/EN, reptes, onboarding
    ├── state.js        # Estat centralitzat (L.state)
    ├── tokenizer.js    # LogoSyntaxError + tokenize()
    ├── parser.js       # Tokens → AST
    ├── interpreter.js  # AST → generador (yield per pas)
    ├── canvas.js       # Canvas, tortuga, applyTurtleCommand()
    ├── editor.js       # Highlighting, autocompletat, undo-safe
    ├── help.js         # Post-it d'errors contextuals
    ├── ui.js           # Modals, tema, log, onboarding
    ├── execution.js    # Run / step / stop / reset
    ├── challenges.js   # Llistat, validació, pistes amb timer
    └── main.js         # Inicialització (IIFE)
```

### Patrons

- **Namespace únic**: `window.L` — tots els mòduls exporten funcions com `L.runProgram = runProgram`
- **Estat centralitzat**: `L.state` conté tot l'estat mutable (tortuga, execució, UI)
- **Intèrpret generador**: `function* interpret(ast)` fa `yield` a cada pas, permetent execució animada i pas a pas
- **DRY**: `applyTurtleCommand()` és la font única de veritat per al moviment de la tortuga (usat tant per l'intèrpret com per la previsualització de reptes)

### Versió fitxer únic

Si preferiu un sol fitxer JS (per simplicitat o per distribuir):

```bash
chmod +x build.sh
./build.sh
# Resultat a dist/
```

### Afegir una comanda nova

1. Afegir el nom a `CMD_MAP` a `constants.js` (3 idiomes)
2. Afegir la traducció a `commands` dins `I18N` a `i18n.js` (3 idiomes)
3. Implementar el `case` a `applyTurtleCommand()` a `canvas.js`

Com que la lògica de moviment està unificada, la nova comanda funcionarà automàticament tant a l'intèrpret real com a la previsualització de reptes.

### Afegir un repte nou

Afegir un objecte a l'array `challenges` dins cada idioma a `i18n.js`:

```js
{ id: 106, category: 'advanced', title: 'Espiral', level: 'hard',
  desc: "Dibuixa una espiral quadrada creixent.",
  code: '// Espiral\n\n',
  goal: 'forward 10 right 90 forward 20 right 90 forward 30 right 90 forward 40 right 90',
  hints: ['Cada costat és 10 unitats més llarg que l\'anterior.', 'Solució: ...'] }
```

## Llicència

Ús educatiu lliure.
