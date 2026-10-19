#!/bin/sh
# Surenka paskelbimui paruoštą svetainę (be testų, įrankių ir dokumentacijos).
# Naudojimas: sh apsauga/tools/build-site.sh [išvesties_aplankas]
# Rezultatą galima įkelti į bet kurį talpinimą (Hostinger, GitHub Pages ir kt.).
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT=${1:-$ROOT/dist/site}
rm -rf "$OUT"
mkdir -p "$OUT"
(cd "$ROOT" && tar cf - --exclude=./tests --exclude=./tools --exclude=./dist .) | (cd "$OUT" && tar xf -)
find "$OUT" -maxdepth 1 -name '*.md' -delete
sh "$ROOT/tools/package-extension.sh" "$OUT" >/dev/null
echo "$OUT"
