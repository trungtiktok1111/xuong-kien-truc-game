#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
./node_modules/.bin/esbuild src/main.js --bundle --minify --format=iife --target=chrome100,safari15.4 \
  --loader:.json=json --loader:.wasm=binary --loader:.zip=binary --outfile=dist/app.js
node <<'JS'
const { readFileSync, writeFileSync } = require('node:fs');
const script = readFileSync('dist/app.js', 'utf8').replaceAll('</script', '<\\/script').replaceAll('</body', '<\\/body').replaceAll('</head', '<\\/head');
const template = readFileSync('tpl.html', 'utf8');
const sample = JSON.parse(template.match(/id="da-xoay-sample"[^>]*>(.*?)<\/script>/s)[1]);
const path = sample.cfg.outline.loops.map(loop =>
  'M' + loop.map(([x,y]) => x.toFixed(2)+','+y.toFixed(2)).join(' L') + ' Z'
).join(' ');
const preview = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+sample.w+' '+sample.h+'" role="img" aria-label="Mặt bằng Đá Xoáy"><path fill-rule="evenodd" fill="#73938b" stroke="#b6d3c8" stroke-width=".24" d="'+path+'"/></svg>';
writeFileSync('index.html', template.replace('__SAMPLE_PREVIEW__', () => preview).replace('__JS__', () => script));
JS
