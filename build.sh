#!/bin/bash
# ════════════════════════════════════════════════════════
# build.sh — Genera logo.js (versió fitxer únic)
#
# Ús: ./build.sh
# Resultat: dist/logo.js + dist/index.html + dist/style.css
# ════════════════════════════════════════════════════════

set -e
mkdir -p dist

echo "// ════════════════════════════════════════════════════════" > dist/logo.js
echo "// logo.js — LOGOcat (generat automàticament per build.sh)" >> dist/logo.js
echo "// $(date '+%Y-%m-%d %H:%M')" >> dist/logo.js
echo "// ════════════════════════════════════════════════════════" >> dist/logo.js
echo "" >> dist/logo.js

# Concatenar en ordre de dependència
for f in \
  js/constants.js \
  js/i18n.js \
  js/state.js \
  js/tokenizer.js \
  js/parser.js \
  js/interpreter.js \
  js/canvas.js \
  js/editor.js \
  js/help.js \
  js/ui.js \
  js/execution.js \
  js/challenges.js \
  js/main.js
do
  echo "" >> dist/logo.js
  cat "$f" >> dist/logo.js
done

# Generar index.html amb un sol <script>
sed 's|<!--\_\_SCRIPTS\_START.*\_\_SCRIPTS\_END-->||' index.html | \
  sed '/^<script src="js\//d' | \
  sed 's|</body>|<script src="logo.js"></script>\n</body>|' > dist/index.html

# Copiar CSS
cp style.css dist/style.css

LINES=$(wc -l < dist/logo.js)
echo "✓ dist/logo.js generat ($LINES línies)"
echo "✓ dist/index.html generat"
echo "✓ dist/style.css copiat"
