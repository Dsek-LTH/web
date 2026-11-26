#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

rm -rf pkg
wasm-pack build --target web --release --out-dir pkg

mkdir -p ../../src/lib/actic/governing/diff/generated
cp pkg/typdiff_wasm.js pkg/typdiff_wasm_bg.wasm pkg/typdiff_wasm.d.ts \
  ../../src/lib/actic/governing/diff/generated/
rm -rf pkg
