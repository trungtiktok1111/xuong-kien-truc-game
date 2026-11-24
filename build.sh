#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
./node_modules/.bin/esbuild src/main.js --bundle --minify --format=iife --target=chrome100 \
  --loader:.json=json --loader:.wasm=binary --outfile=dist/app.js
node <<'JS'
const { readFileSync, writeFileSync } = require('node:fs');
const script = readFileSync('dist/app.js', 'utf8').replaceAll('</script', '<\\/script');
const template = readFileSync('tpl.html', 'utf8');
writeFileSync('index.html', template.replace('__JS__', () => script));
JS
