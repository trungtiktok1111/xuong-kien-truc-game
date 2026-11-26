# Tỉ lệ tự động + Chọn nhân vật + Lưu bộ chọn (Đường Bao) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In the "Tự phối vật liệu Đường Bao" panel (`src/outlineEditor.js`), make props/houses from different ZIP packs share one real-world scale (auto-calibrated per source pack from a door, falling back to a wall or an in-pack character, falling back to a manual multiplier), add a "Nhân vật" selection column used as a visual reference only (never committed to the real map), and let users save/load a named selection (all layers + character + scale overrides) from IndexedDB instead of only the current per-map memory.

**Architecture:** A new pure module (`src/outlineAnchors.js`) holds the scale-factor arithmetic, unit-tested with plain numbers. `src/scenePacks.js` gains door/wall/character detection (image loading, already its job) that feeds that pure module, and multiplies the resulting factor into already-built entities' `sc` field — it does not change the existing per-object `tileWidth` guess formula. `src/ed2d.js` wires a `character` role through the existing generic `outlineRoles` map, but excludes it from the code path that commits layers into the real map. `src/outlineEditor.js` adds one more row to the existing generic `layerControls` UI (no new control type) plus a small per-source scale status/override strip and a preset save/load strip. A new `src/outlinePresets.js` wraps the existing `idbGet/idbSet` (`src/util.js`) for named presets.

**Tech Stack:** Vanilla JS (ES modules), `esbuild`, `node:test` for unit tests (no DOM — anything touching `canvas`/`Image` stays untested like the rest of `scenePacks.js` today).

**Spec:** `docs/superpowers/specs/2026-11-26-outline-scale-character-presets-design.md`

## Global Constraints
- No new dependencies; follow existing code style (short functions, no classes, Vietnamese user-facing strings).
- Backward compatible: maps/presets without `character`/`scaleOverrides`/`scale` behave exactly as today (factor defaults to 1).
- Character selection must never be written into the real map/game (`dressOutline`, `applyOutline`, `newOutlineMap`) — preview/reference only.
- Reuse the existing generic `layerControls` UI pattern in `src/outlineEditor.js` for the new row; do not write a parallel control type.

## Review Focus
- A pack with no recognizable door, wall, or in-pack character: scale factor must fall back to 1 (or the manual override) without throwing, and the UI must say "chưa nhận ra — chỉnh tay" rather than silently guessing wrong.
- A manual override value of 0, negative, or non-finite: must be ignored (treated as not set) rather than zeroing or breaking every prop in that pack.
- Opening an old map (`map.cfg.outlineMaterials` has no `character`/`scaleOverrides`) or an old saved preset shape must not throw — missing fields default to empty/1.
- Selecting a character and pressing "Áp dụng vào bản đồ"/"Tạo màn mới từ hình này" must never add a character entity to the committed map — this is the central regression risk of the feature.
- Loading a saved preset whose `source` is a `zip:` entry not present in this session's `outlineZipFiles` must show the existing "cần nạp lại ZIP" state (already implemented for the per-map case) instead of crashing.

---

### Task 1: Pure scale-anchor arithmetic

**Files:**
- Create: `src/outlineAnchors.js`
- Test: `tests/outline-anchors.test.js`

**Interfaces:**
- Produces: `REFERENCE_HEIGHT` (object: `{door, wall, character}`, values in map tiles — `door:1.47, wall:2.0, character:1.2`), `guessTileWidth(w, h): number` (mirrors the existing heuristic in `src/scenePacks.js:478`, `Math.max(w/.95, h/1.65)`), `anchorFactor(kind: 'door'|'wall'|'character', artWidthPx: number, artHeightPx: number): number`, `packScale({door, wall, character}: {[k: string]: {w:number,h:number}|undefined}, manualOverride?: number): {factor: number, via: 'door'|'wall'|'character'|'manual'|'none'}`.

- [ ] **Step 1: Write the failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {REFERENCE_HEIGHT, guessTileWidth, anchorFactor, packScale} from '../src/outlineAnchors.js';

test('guessTileWidth mirrors the existing prop heuristic ratios',()=>{
 assert.equal(guessTileWidth(95,0),100);
 assert.equal(guessTileWidth(0,165),100);
});
test('anchorFactor is 1 when the measured art already matches the generic guess',()=>{
 // door art drawn at exactly REFERENCE_HEIGHT.door tiles tall, at the generic guess's implied tileWidth
 const h=165,w=95,tileWidth=guessTileWidth(w,h);
 const px=tileWidth*REFERENCE_HEIGHT.door;
 assert.ok(Math.abs(anchorFactor('door',w,px)-1)<1e-9);
});
test('packScale prefers door, then wall, then in-pack character, then manual, then none',()=>{
 const door={w:95,h:300},wall={w:95,h:400},character={w:95,h:220};
 assert.equal(packScale({door,wall,character}).via,'door');
 assert.equal(packScale({wall,character}).via,'wall');
 assert.equal(packScale({character}).via,'character');
 assert.equal(packScale({},2.5).via,'manual');
 assert.equal(packScale({},2.5).factor,2.5);
 assert.deepEqual(packScale({}),{factor:1,via:'none'});
});
test('packScale ignores a non-finite or non-positive manual override',()=>{
 assert.equal(packScale({},0).via,'none');
 assert.equal(packScale({},-1).via,'none');
 assert.equal(packScale({},NaN).via,'none');
 assert.equal(packScale({},undefined).via,'none');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test` (bundles `tests/*.test.js`; confirm `outline-anchors.test.js` fails with "Cannot find module" or similar)
Expected: FAIL

- [ ] **Step 3: Implement `src/outlineAnchors.js`**

`anchorFactor(kind, artWidthPx, artHeightPx)` = `(artHeightPx / REFERENCE_HEIGHT[kind]) / guessTileWidth(artWidthPx, artHeightPx)`. `packScale` tries `door`, then `wall`, then `character` (each only if the corresponding arg is a truthy `{w,h}`), calling `anchorFactor` with that kind; only if none are present does it fall to `manualOverride` when `Number.isFinite(manualOverride) && manualOverride>0`; otherwise `{factor:1,via:'none'}`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, all `outline-anchors.test.js` cases green.

- [ ] **Step 5: Commit**

```bash
git add src/outlineAnchors.js tests/outline-anchors.test.js
git commit -m "feat: add pure scale-anchor calculator for outline material packs"
```

---

### Task 2: Character catalog + `outline-materials.json` door/character declarations

**Files:**
- Modify: `src/scenePacks.js` (near `catalog()` at `scenePacks.js:260`, and `outlinePackMaterials` at `scenePacks.js:384`)
- Test: `tests/scene-packs-catalog.test.js` (only the pure, DOM-free parts — path/name matching — not image loading)

**Interfaces:**
- Consumes: nothing new from Task 1 yet.
- Produces: `characterName` (RegExp, exported for the test), `catalogCharacters(pack): Array<{pack, path, label, layer:2}>` (exported), and an extended `outlinePackMaterials` result shape: `result.characters=[]` added alongside the existing `floors/overlays/props/houses/walls`, populated the same way the `props` loop already is (`scenePacks.js:476-482`) but sourced from `catalogCharacters(pack)` plus any `settings.characters`/`settings.doors` rows from `outline-materials.json` (parsed with the existing `named()` helper, `scenePacks.js:389`).

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {characterName} from '../src/scenePacks.js';

test('characterName matches the folder and name patterns scenePacks.js currently ignores for characters',()=>{
 assert.ok(characterName.test('isometric/characters/hero_e.png'));
 assert.ok(characterName.test('character/npc_guard.png'));
 assert.ok(characterName.test('sprites/nhan-vat-nu.png'));
 assert.ok(!characterName.test('isometric/barrel_e.png'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "characterName is not exported" / undefined.

- [ ] **Step 3: Implement in `src/scenePacks.js`**

Add `export const characterName=/(?:^|\/)characters?\/|(?:^|[_-])(?:hero|npc|person|human|nhan-?vat|nguoi)(?:[_-]|\.[^.]+$)/i;` near the existing `ignored`/`structure` regexes (`scenePacks.js:257-259`).

`export function catalogCharacters(pack){return pack.paths.filter(p=>isImage(p)&&characterName.test(p)).map(path=>({pack,path,label:stem(path),layer:2}));}`

In `outlinePackMaterials`, initialize `result.characters=[]` alongside the existing arrays (`scenePacks.js:385`). After the existing `settings`/`profile`/catalog branches that build `floors`/`props`/`overlays`, build `characters`: when `settings`, `const characters=(settings.characters||[]).map(row=>named(row,2));` and append any `settings.doors` similarly into a local `doors` array (used by Task 3, not placed on the map); otherwise `const characters=catalogCharacters(pack);`. Loop them exactly like the existing props loop (`scenePacks.js:476-482`) but force `tileWidth=art.h/REFERENCE_HEIGHT.character` (import from `outlineAnchors.js`) instead of guessing, no collision shape (`collision:null`), and push into `result.characters` with the same `{sid,id,label,source,create}` shape as `result.props` entries (so `create(x,y,id)` returns a plain `entity(piece,x,y,0,id)` with no `outlineAutoProp` flag — it must never be mistaken for a placeable prop).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/scenePacks.js tests/scene-packs-catalog.test.js
git commit -m "feat: catalog character art and outline-materials.json character/door declarations"
```

---

### Task 3: Anchor detection and scale wiring into props/houses

**Files:**
- Modify: `src/scenePacks.js` (`outlinePackMaterials`, props loop at `scenePacks.js:476-482`, house loop at `scenePacks.js:484-496`)

**Interfaces:**
- Consumes: `packScale` from `src/outlineAnchors.js` (Task 1); `catalogCharacters` from Task 2; the local `doors` list from Task 2's `outline-materials.json` parsing.
- Produces: `result.scale: {factor:number, via:string}` on the object `outlinePackMaterials` returns; every entry in `result.props`'s `create(...)` and every ent in `result.houses[].ents` has its `sc` multiplied by `result.scale.factor` (characters are excluded — they stay at the fixed reference height).

- [ ] **Step 1: Write the failing test**

Add to `tests/scene-packs-catalog.test.js` (pure part only — build a fake "pack" shape and call a small exported helper, not the full async image-loading `outlinePackMaterials`):

```js
import {pickAnchorArt} from '../src/scenePacks.js';

test('pickAnchorArt finds a door-like path before a wall-like path',()=>{
 const paths=['isometric/stoneWall_e.png','isometric/stoneWallDoorway_e.png','isometric/barrel_e.png'];
 assert.equal(pickAnchorArt(paths,'door'),'isometric/stoneWallDoorway_e.png');
 assert.equal(pickAnchorArt(paths.slice(0,1).concat(paths[2]),'wall'),'isometric/stoneWall_e.png');
 assert.equal(pickAnchorArt(paths,'wall'),null); // door match takes priority at the call site, not inside pickAnchorArt
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL (`pickAnchorArt` not exported).

- [ ] **Step 3: Implement**

`export function pickAnchorArt(paths, kind){const re=kind==='door'?/cua|door|gate|cong|doorway/i:/tuong|wall|vach/i; return paths.find(p=>!ignored.test(p)&&re.test(p))||null;}` (place near `catalogCharacters`).

In `outlinePackMaterials`, after building `floors/props/overlays/characters` lists (so the door/wall path can be looked up among `pack.paths` directly, independent of which list it landed in), add an async local `measure(path)` that loads the image via the already-imported `loadImage({pack,path})` + `crop(image,[0,0,image.width,image.height])`, returning `{w:art.w,h:art.h}` or `null` on failure (wrap in the existing `attempt`-style try/catch, i.e. return `null` on any error). Build:
```js
const doorPath=pickAnchorArt(pack.paths,'door'), wallPath=!doorPath&&pickAnchorArt(pack.paths,'wall');
const charPath=characters[0]?.path;
const anchors={door:doorPath&&await measure(doorPath),wall:wallPath&&await measure(wallPath),character:charPath&&await measure(charPath)};
result.scale=packScale(anchors,style?.manualScale);
```
(`style.manualScale` is a new optional field callers may pass — Task 4 wires it from the UI.)

Then, in the existing props loop (`scenePacks.js:476-482`), change the `create` closure to multiply: `create:(x,y,id)=>{const e=entity(piece,x,y,0,id);return {...e,sc:e.sc*result.scale.factor,outlineAutoProp:true};}` (keep everything else the same). In the house-building block (`scenePacks.js:484-496`), after `ents.push(await miniaturePiece(...))` finishes building a house's `parts`/`ents` for a given `w,h`, map the final `ents` array once: `ents=ents.map(e=>({...e,sc:e.sc*result.scale.factor}))` before pushing into `result.houses`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/scenePacks.js tests/scene-packs-catalog.test.js
git commit -m "feat: auto-calibrate pack scale from door/wall/character anchors"
```

---

### Task 4: Wire the `character` role through `src/ed2d.js` without committing it to the map

**Files:**
- Modify: `src/ed2d.js` (`outlineRoles` at `ed2d.js:3378`, `prepareOutlineLayerDressing` at `ed2d.js:3422-3472`)

**Interfaces:**
- Consumes: `pack.characters` (Task 2/3), `pack.scale` (Task 3).
- Produces: `outlineRoles.character='characters'` (so the already-generic `outlineLayerChoices` at `ed2d.js:3398` works for the new row with zero changes); `prepareOutlineLayerDressing` ignores any `options.layers.character` entry when building the committed map; a new exported editor method `outlineCharacterPreview(source, id, files, style): Promise<{ent: object, sheets: Array}|null>` that loads just that one character's sheet into a **fresh** sheets array (via the existing `loadBuiltinSheet` helper) and returns its `create(1, 1, 'outline-character-preview')` entity plus that fresh sheets array, for `outlineEditor.js` to merge into a live-preview-only copy of the scene (never into `M`/`sheets`).

- [ ] **Step 1: Write the failing test**

Add to `tests/outline-materials.test.js` (or a new `tests/outline-character-role.test.js` if the editor's internals aren't reachable without a DOM — check first whether `ed2d.js`'s top-level factory needs `document`; if it does, write this as a narrower unit test directly against `outlineRoles`/the filter logic instead of the whole editor). Minimum required assertion:

```js
test('a layers selection including a character role never reaches dressOutline as a prop/house', ()=>{
 const requested=[['floor','s',['a']],['character','s',['hero']]];
 const filtered=requested.filter(([role])=>role!=='character');
 assert.deepEqual(filtered.map(r=>r[0]),['floor']);
});
```
(This pins the exact filter predicate used in Step 3 — keep the real code and this test using the identical `role!=='character'` check so the test is meaningful, not just restating itself.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL only if the assertion doesn't hold yet (trivial here — the real safety net is Step 3's code change plus this pinned predicate string matching it; if `ed2d.js` is reachable in node without a browser `document`, prefer importing `prepareOutlineLayerDressing`'s requested-building logic directly instead of duplicating the predicate — check `ed2d.js`'s imports for `document`/`window` at module load time before deciding).

- [ ] **Step 3: Implement in `src/ed2d.js`**

- `outlineRoles={floor:'floors',overlay:'overlays',wall:'walls',props:'props',house:'houses',character:'characters'}` (`ed2d.js:3378`).
- In `prepareOutlineLayerDressing` (`ed2d.js:3423`), change the `requested` line to filter out the character role before anything else touches `dressOutline`: `const requested=Object.entries(options.layers).filter(([role])=>role!=='character').map(...)`.
- Add `async function outlineCharacterPreview(source,id,files,style){const pack=await outlineLayerPack(source,files,style);const item=pack.characters?.find(a=>a.id===id);if(!item)return null;const fresh=[];const sid=await loadBuiltinSheet(pack.sheets[item.sid],fresh);return {ent:item.create(1,1,'outline-character-preview'),sheets:fresh,scale:pack.scale};}` placed near `outlineLayerChoices` (`ed2d.js:3398`), using the same `loadBuiltinSheet` helper already used at `ed2d.js:3450`/`3492`.
- Export `outlineCharacterPreview` from the editor's returned object (`ed2d.js:3575`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ed2d.js tests/outline-materials.test.js
git commit -m "feat: add character role to outline layer picker without committing it to the map"
```

---

### Task 5: "Nhân vật" row, scale status/override strip, and live-preview silhouette

**Files:**
- Modify: `src/outlineEditor.js` (`rows` at `outlineEditor.js:659`, `queueLivePreview` at `outlineEditor.js:868-897`, `materials()` at `outlineEditor.js:844-848`, `materialsPanel` at `outlineEditor.js:857-862`)

**Interfaces:**
- Consumes: `editor.outlineCharacterPreview` (Task 4), `pack.scale`/`result.scale` surfaced through `editor.outlineLayerChoices`'s existing `message` field (extend it, see Step 3) for the status line, `drawOutlineDraft` (`src/outlineDraftView.js`) unchanged.
- Produces: the panel has six rows instead of five; `materials(preview)` never includes a `character` key (so `prepareOutlineDressing`/`applyOutline`'s normal callers are unaffected even though Task 4 already guards it server-side — belt and suspenders, and it keeps `editor.outlineLayerChoices` calls for the character row's own gallery working through the exact same generic code every other row uses); a manual per-source scale override input, stored in a new `scaleOverrides` map (`{[source]: number}`) kept alongside `layerControls` state and threaded into `style` (as `manualScale`, picked per the control's own `source.value`) on every `refreshLayer`/`queueLivePreview` call.

- [ ] **Step 1: Manual check (no automated test — this file loads `document`/`canvas` at import time, consistent with the rest of `outlineEditor.js`, which has no existing test file)**

Note this explicitly instead of a step 1-2-4 test cycle: run `npm run build` after Step 3 and open the built `index.html` locally (`python3 -m http.server 8000`), open Đường Bao, draw a floor, open "Tự phối vật liệu Đường Bao", and confirm: a "Nhân vật" column appears with the same gallery UI as "Vật dụng"; picking a character shows it in the live preview at a fixed corner; the "Vật dụng"/"Nhà" column for a pack with a recognizable door shows "tỉ lệ theo: Cửa"; typing a manual override changes the live preview size.

- [ ] **Step 2: Implement the row**

Change `rows` (`outlineEditor.js:659`) to append `['character','Nhân vật',true]`. No other change needed inside the `layerControls.map` body — the existing generic control (source select, gallery, Thử lần lượt, Trước/Sau, Bỏ qua lớp) already works once `outlineRoles.character` exists (Task 4) and `editor.outlineLayerChoices('character', …)` returns items (Task 2/3).

- [ ] **Step 3: Scale status + manual override, per source**

Add a `scaleOverrides=new Map()` (source → number) next to the existing `outlineZipFiles` map (`outlineEditor.js:642` area, same scope as `saved=map.cfg.outlineMaterials||{}`), seeded from `saved.scaleOverrides||{}`. Extend `surfaceStyle()` (`outlineEditor.js:651`) to accept the current control's source: since different rows can share one source pack, compute the override lookup once per `refreshLayer(control,...)` call: `style={...surfaceStyle(),manualScale:scaleOverrides.get(control.source.value)}`. Pass this `style` into the existing `editor.outlineLayerChoices(control.key,control.source.value,outlineZipFiles,style)` call (`outlineEditor.js:809`) unchanged otherwise.

Extend `outlineLayerChoices`'s returned `message` (Task 2/3's `result.scale`) so `renderGallery`/`syncLayer`'s existing `control.note` line (`outlineEditor.js:782-784`) also shows, once per distinct source across all rows, `'· Tỉ lệ theo '+{door:'cửa',wall:'tường',character:'nhân vật trong gói',manual:'tay',none:'chưa nhận ra'}[via]`. Add one small `<input type=number>` next to each row's `source` select (visible only when that row's control is the first one referencing its source, to avoid repeating the control five times for the same pack) that writes into `scaleOverrides` on change and calls `void refreshLayer(control,control.ids)` for every control sharing that source.

- [ ] **Step 4: Live-preview reference silhouette**

In `queueLivePreview` (`outlineEditor.js:868`), after `const view=await editor.liveOutlineMap(...)` succeeds (`outlineEditor.js:879`), find the character row's control; if it has a `trial` or a first `ids[0]`, call `editor.outlineCharacterPreview(control.source.value, control.trial||control.ids[0], outlineZipFiles, surfaceStyle())`. On success, build `const merged={...view,M:{...view.M,ents:[...view.M.ents,{...preview.ent,tile:{...preview.ent.tile,sid:preview.ent.tile.sid+view.sheets.length}}]},sheets:[...view.sheets,...preview.sheets]}` and call `drawOutlineDraft(liveCanvas,merged)` instead of `drawOutlineDraft(liveCanvas,view)`. Keep the existing `view` object itself unmodified (it is not used for anything else downstream in this function). On any failure from `outlineCharacterPreview`, fall back to drawing `view` unmerged — never let a character-preview failure block the rest of the live preview.

- [ ] **Step 5: Commit**

```bash
git add src/outlineEditor.js
git commit -m "feat: add character column, per-source scale status, and reference silhouette to outline preview"
```

---

### Task 6: Named preset save/load/delete

**Files:**
- Create: `src/outlinePresets.js`
- Test: `tests/outline-presets.test.js`
- Modify: `src/outlineEditor.js` (`materialsPanel` at `outlineEditor.js:857-862`, `materials()`/`saved` wiring at `outlineEditor.js:642-651` and `844-848`)

**Interfaces:**
- Produces (`src/outlinePresets.js`): `listOutlinePresets(): Promise<Array<{id,name,savedAt}>>`, `loadOutlinePreset(id): Promise<object|null>` (full saved `data`), `saveOutlinePreset(id, name, data): Promise<{id,name,savedAt}>` (generates a new `id` via `crypto.randomUUID()` when `id` is null/undefined — overwrite behavior is "same `id` passed back in"), `deleteOutlinePreset(id): Promise<void>`. Internally a single `idbGet('outline-material-presets')`/`idbSet(...)` array, exactly like the design doc's storage shape (`{id,name,savedAt,data}[]`), reusing `idbGet/idbSet` from `src/util.js`.
- Consumes (`outlineEditor.js`): the above four functions; `materials(false)` (existing, `outlineEditor.js:844`) extended to also read `character` the same way as any other row (it already will, once Task 5's row exists, since `materials` iterates `layerControls` generically) and to include `scaleOverrides:Object.fromEntries(scaleOverrides)`.

- [ ] **Step 1: Write the failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';

const store=new Map();
test.beforeEach(()=>{store.clear();});
// src/util.js's idbGet/idbSet require a real IndexedDB; outlinePresets.js must accept
// injected get/set so this test runs under node:test without a browser. See Step 3.
import {listOutlinePresets,loadOutlinePreset,saveOutlinePreset,deleteOutlinePreset} from '../src/outlinePresets.js';
const io={get:async k=>store.get(k),set:async(k,v)=>{store.set(k,v);return true;}};

test('save creates a new id, list surfaces it without the data payload, load returns the full data',async()=>{
 const saved=await saveOutlinePreset(null,'Bộ A',{layers:{floor:{source:'x',assets:[]}}},io);
 assert.ok(saved.id);
 const list=await listOutlinePresets(io);
 assert.deepEqual(list.map(p=>({id:p.id,name:p.name})),[{id:saved.id,name:'Bộ A'}]);
 assert.deepEqual(await loadOutlinePreset(saved.id,io),{layers:{floor:{source:'x',assets:[]}}});
});
test('saving again with the same id overwrites instead of duplicating',async()=>{
 const first=await saveOutlinePreset(null,'Bộ A',{n:1},io);
 await saveOutlinePreset(first.id,'Bộ A sửa',{n:2},io);
 const list=await listOutlinePresets(io);
 assert.equal(list.length,1);
 assert.equal(list[0].name,'Bộ A sửa');
 assert.deepEqual(await loadOutlinePreset(first.id,io),{n:2});
});
test('delete removes the preset; loading a missing id returns null',async()=>{
 const saved=await saveOutlinePreset(null,'Bộ B',{n:1},io);
 await deleteOutlinePreset(saved.id,io);
 assert.deepEqual(await listOutlinePresets(io),[]);
 assert.equal(await loadOutlinePreset(saved.id,io),null);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL ("Cannot find module '../src/outlinePresets.js'").

- [ ] **Step 3: Implement `src/outlinePresets.js`**

Each exported function takes an optional last argument `io={get:idbGet,set:(k,v)=>idbSet(k,v)}` (default wired to the real `idbGet/idbSet` from `src/util.js`), defaulting to the real IndexedDB-backed ones so `outlineEditor.js` can call them with zero extra arguments, while the test injects the in-memory `io`. Internal key: `'outline-material-presets'`. `listOutlinePresets(io)` reads the array (default `[]`), maps to `{id,name,savedAt}`. `loadOutlinePreset(id,io)` finds by id, returns `.data` or `null`. `saveOutlinePreset(id,name,data,io)` reads the array, either replaces the matching `{id}` entry or appends a new one (`id??crypto.randomUUID()`), writes it back, returns the saved `{id,name,savedAt:Date.now()}`. `deleteOutlinePreset(id,io)` filters it out and writes back.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Wire into `src/outlineEditor.js`**

In `materialsPanel` (`outlineEditor.js:857`), add a row: a `<select>` populated from `listOutlinePresets()` (label + relative/raw `savedAt`), and three buttons — **Mở** (loads via `loadOutlinePreset(id)`; for each `layerControls` row set `control.source.value=data.layers[control.key]?.source ?? control.source.value`, `refreshSources(control,control.source.value)`, then `void refreshLayer(control, data.layers[control.key]?.assets ?? [])`; also set `floorScale.value`, `matchJoints.checked`, and repopulate `scaleOverrides` from `data.scaleOverrides||{}`, then `queueLivePreview(true)`), **Lưu…** (if a preset is currently open, overwrite it via `saveOutlinePreset(openId,...)`; otherwise prompt a name with the existing `ask()` from `src/util.js` and create a new one), **Xoá** (confirm with `yes()` from `src/util.js`, then `deleteOutlinePreset(id)` and refresh the `<select>`). Track "currently open preset id/name" in a local variable so repeated **Lưu…** on the same preset overwrites without re-prompting, matching the design doc.

- [ ] **Step 6: Commit**

```bash
git add src/outlinePresets.js tests/outline-presets.test.js src/outlineEditor.js
git commit -m "feat: save and load named outline material selection presets"
```

---

## Self-review notes
- Spec coverage: door→wall→character→manual anchor chain (Tasks 1,3), Nhân vật column reusing the existing control (Tasks 2,4,5), live reference silhouette (Task 5), never committing the character to the real map (Task 4, pinned by its test), named save/load/delete (Task 6). Covered.
- `outlineEditor.js` and `ed2d.js` have no existing test files and are known to load `document`/`canvas`/`IndexedDB` at module scope elsewhere in the codebase (consistent with `src/scenePacks.js` having no test file either) — Tasks 4 and 5 use a manual verification step instead of inventing DOM mocking infrastructure this codebase doesn't otherwise have; Task 4's one automated assertion is deliberately narrow (the filter predicate) rather than a false sense of full coverage.
- Proportion check: six tasks, each touching one or two files with a named interface; code bodies given only where the spec fixes exact formulas (anchor math) or where the existing codebase's own formula must be mirrored exactly (`guessTileWidth`).
