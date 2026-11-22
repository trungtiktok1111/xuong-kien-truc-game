cd /home/claude/ed && npx esbuild src/main.js --bundle --minify --format=iife --loader:.json=json --loader:.wasm=binary --outfile=dist/app.js >/dev/null 2>&1 && python3 - <<'PY'
js=open('/home/claude/ed/dist/app.js').read().replace('</script','<\\/script')
open('/home/claude/ed/index.html','w').write(open('/home/claude/ed/tpl.html').read().replace('__JS__',js))
PY
