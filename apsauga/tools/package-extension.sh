#!/bin/sh
# Supakuoja naršyklės plėtinį į ZIP (Chrome Web Store, Firefox Add-ons ar rankiniam diegimui).
# Naudojimas: sh apsauga/tools/package-extension.sh [išvesties_aplankas]
set -e
ROOT=$(cd "$(dirname "$0")/.." && pwd)
OUT=${1:-$ROOT/dist}
VERSION=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' "$ROOT/extension/manifest.json" | head -1)
mkdir -p "$OUT"
OUT=$(cd "$OUT" && pwd)
rm -f "$OUT/apsauga-extension.zip"
cd "$ROOT/extension"
zip -qr -X "$OUT/apsauga-extension.zip" . -x '.*' -x '*/.*'
echo "$OUT/apsauga-extension.zip (versija $VERSION)"
