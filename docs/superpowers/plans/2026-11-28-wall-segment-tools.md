# Sửa/xoá tường theo từng đoạn Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user select one straight wall run of the outline's boundary (as already identified by `outlineSupports()` in `src/wall2d.js`) and delete it (permanent gap, no wall/collision there) or restore it, with a per-run material override as a stretch addition — without changing the outline's floor-shape geometry.

**Architecture:** `outlineSupports(outline)` already derives discrete wall runs with stable ids from the outline's loop geometry; it is the single choke point all 6 consumers (2D/3D drawing, collision, gate mounting, construction rules) call through. Filtering its output by `outline.removedWalls` and applying `outline.wallOverrides` there propagates correctly everywhere with one change. `src/outlineEditor.js` gets a new interaction mode (same pattern as its existing `select`/`move`/`gate` modes) to pick a run and act on it, persisting the two new arrays/maps through the same `outlineData()` round-trip every other outline property already uses.

**Tech Stack:** Vanilla JS (ES modules), `esbuild`, `node:test`.

**Spec:** `docs/superpowers/specs/2026-11-28-wall-segment-tools-design.md`

## Global Constraints
- Backward compatible: an outline with no `removedWalls`/`wallOverrides` behaves exactly as today.
- `src/outlineEditor.js` and `src/wall2d.js` are being actively edited by another contributor on the same `main` branch — before any edit in these files, re-read the current content at the exact lines you're about to touch (line numbers in this plan are a pointer, not a guarantee) and re-run `npm test` + `git fetch && git log --oneline HEAD..origin/main` before every push, merging if the remote moved.
- Deleting a wall run with a gate mounted on it must stay blocked, with the same toast pattern already used for that guard elsewhere in `ed2d.js`.

## Review Focus
- Deleting a run, then undoing, must restore it exactly (same id reusable) — a stale/regenerated id after an unrelated geometry edit would silently "un-delete" the wrong run or leave a dangling entry forever.
- A `removedWalls` id that no longer corresponds to any current run (e.g. after the outline shape changed elsewhere) must not crash collision/drawing — it should be silently ignorable, not throw.
- Picking a run must not misfire when the user is actually trying to use an existing mode (`move`, `polygon`, etc.) on the same canvas — the new mode must be its own explicit toolbar button, never an implicit side effect of clicking near an edge in another mode.
- A gate mounted on a run that still exists but was given a `wallOverrides` material must keep rendering/colliding correctly (override must not remove the run itself, only its material).
- Two different runs' ids must never collide after `W`/`H` resize or origin shift (`outlineSupports`' id already encodes loop index + point index, both of which can shift under resize/rebase) — confirm whether that's already a pre-existing limitation (in which case document it, don't fix it here) rather than silently assuming ids are stable across such ops.

---

### Task 1: Filter removed wall runs and apply per-run material overrides in `outlineSupports`

**Files:**
- Modify: `src/wall2d.js` (`outlineSupports`, currently around line 77-95)
- Test: `tests/wall2d.test.js` (new file — `wall2d.js` currently has no test file; confirm this before creating one, and match the existing `tests/*.test.js` style, e.g. `tests/outline-anchors.test.js`)

**Interfaces:**
- Produces: `outlineSupports(outline)` unchanged in return shape (`Array<{id,outlineWall:true,x,y,wallLine:{dx,dy,thickness,material?}}>`) except: entries whose `id` is in `outline.removedWalls` (an array of strings, optional) are omitted; entries whose `id` is a key in `outline.wallOverrides` (a `{[id:string]: string}` map, optional) get `wallLine.material` set to that value. Both fields are optional/absent-safe — `outline.removedWalls`/`outline.wallOverrides` undefined behaves exactly as today.

- [ ] **Step 1: Write the failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {outlineSupports} from '../src/wall2d.js';

const square=()=>({loops:[[[0,0],[4,0],[4,4],[0,4]]],thickness:.24});

test('outlineSupports omits a run whose id is in removedWalls',()=>{
 const base=outlineSupports(square());
 assert.ok(base.length>=1);
 const withRemoval=outlineSupports({...square(),removedWalls:[base[0].id]});
 assert.equal(withRemoval.length,base.length-1);
 assert.ok(!withRemoval.some(run=>run.id===base[0].id));
});
test('outlineSupports is unaffected when removedWalls is absent or names an id that no longer exists',()=>{
 const base=outlineSupports(square());
 assert.deepEqual(outlineSupports(square()),base);
 assert.deepEqual(outlineSupports({...square(),removedWalls:['outline:9:9']}),base);
});
test('outlineSupports sets wallLine.material from wallOverrides for a matching id, leaves others unset',()=>{
 const base=outlineSupports(square());
 const withOverride=outlineSupports({...square(),wallOverrides:{[base[0].id]:'Gỗ sồi'}});
 assert.equal(withOverride[0].wallLine.material,'Gỗ sồi');
 assert.equal(withOverride[1].wallLine.material,undefined);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL (`tests/wall2d.test.js` either can't import correctly yet if `outlineSupports` doesn't accept/apply these fields, or the new assertions fail against current behavior).

- [ ] **Step 3: Implement in `src/wall2d.js`**

In `outlineSupports`, after building each run's `{id, ..., wallLine:{dx,dy,thickness}}` object (the `out.push(...)` call), skip pushing when `outline.removedWalls?.includes(id)`, and when `outline.wallOverrides?.[id]` is set, include `material: outline.wallOverrides[id]` inside that run's `wallLine`. Keep the rest of the function's geometry logic untouched.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, and the full suite still green (no regressions in existing wall/gate-dependent tests).

- [ ] **Step 5: Commit**

```bash
git add src/wall2d.js tests/wall2d.test.js
git commit -m "feat: let outlineSupports omit removed wall runs and apply per-run material overrides"
```

---

### Task 2: Render a wall run's override material

**Files:**
- Modify: whichever of `src/outline2d.js` / `src/outlineDraftView.js` actually reads `wall.wallLine` to pick a texture for 2D drawing (re-grep `wallLine` usage in both files first — do not assume the line numbers below are still current) and `src/outline3d.js` for the 3D build path.

**Interfaces:**
- Consumes: `run.wallLine.material` from Task 1 (a string naming a sheet/material already loaded for this scene, matching how `map.cfg.outline.wallMaterial`/`wallMaterials` are already resolved to a texture elsewhere in these files — reuse that same resolution, just keyed per-run instead of scene-wide).
- Produces: a wall run with an override renders with that material instead of the scene's default `wallMaterial`, in both the 2D draft view and (if time allows within this task) the 3D build. If the 3D path turns out to need materially more plumbing than the 2D path, ship the 2D path and leave a one-line note in the commit message about the 3D gap rather than silently skipping it.

- [ ] **Step 1: Manual verification plan (no unit test — these files render via `canvas`/`document`, consistent with the rest of the outline drawing code having no test file)**

After Step 2's implementation, verify via the same build+Playwright approach used earlier in this project: build, open the app, draw an outline, apply a wall material pack-wide, then (once Task 3's UI exists) override one run to a different material and confirm the live preview shows that one run differently from the rest. This step is written here so Task 3 can be implemented first if that proves easier to sequence; do not mark this task's checklist complete until the visual check has actually been done once Task 3 lands.

- [ ] **Step 2: Implement**

Find where the current single scene-wide wall material gets turned into a drawn texture (search for `wallMaterial` in `src/outline2d.js`/`src/outlineDraftView.js`/`src/outline3d.js`) and thread `run.wallLine.material` through so, when present, it resolves to that material's texture instead of the scene default for that one run's draw call.

- [ ] **Step 3: Commit**

```bash
git add -u
git commit -m "feat: draw a wall run's overridden material instead of the scene default"
```

---

### Task 3: Wall-run selection mode, delete/restore, and material override UI

**Files:**
- Modify: `src/outlineEditor.js` (re-grep each anchor below before editing — this file has changed significantly since this plan was written):
  - the mode-button loop building `['select','Chỉnh điểm'],['move','Di chuyển đường'],...` (currently ~line 728)
  - `draft()`/`record()`/`travel()` (currently ~line 431-440ish) — add `removedWalls`/`wallOverrides` to the undo snapshot the same way `gates` already is
  - `outlineData()` (currently ~line 989) — persist `removedWalls`/`wallOverrides` the same way `wallMaterial`/`wallModules` already are, but read from the live local variables (not `map.cfg.outline?.…` directly, since they're being edited this session)
  - `canvas.onpointerdown` (currently ~line 606) — add the new mode's click handling
  - the toolbar — add the new mode button plus Xoá/Khôi phục/Đổi vật liệu controls, shown only when a run is selected

**Interfaces:**
- Consumes: `outlineSupports` (Task 1) to compute the current runs for hit-testing a click; the materials already loaded for the scene's walls (for the override picker's option list — reuse whatever existing list of wall materials `wallMaterials`/`wallModules` already track in this file).
- Produces: a local `let removedWalls=structuredClone(map.cfg.outline?.removedWalls||[])` and `let wallOverrides=structuredClone(map.cfg.outline?.wallOverrides||{})`, a new mode id (e.g. `'wall'`), and a selected-run id tracked alongside the existing `picked`/`gatePreview`-style local state.

- [ ] **Step 1: Manual verification plan (no unit test — DOM/canvas UI file with no existing test file, same reasoning as every other outlineEditor.js task in this project)**

Build, open the app, draw a closed outline, apply a wall material, switch to the new wall-run mode (button or its shortcut), click one run: it highlights and Xoá/Khôi phục/Đổi vật liệu controls appear. Xoá it, confirm the live preview shows a gap there and no collision (walk through it in Chơi thử). Khôi phục it, confirm the wall reappears. Attempt to Xoá a run with a gate mounted on it, confirm it's blocked with a toast, matching the existing blocked-delete pattern elsewhere in this codebase (e.g. `src/ed2d.js`'s `eraseEntity`'s "Đoạn tường có cổng" guard). Undo/redo through a delete and confirm the run's exact id is restored, not a fresh one.

- [ ] **Step 2: Implement the mode, selection, and delete/restore**

Add `'wall'` as a new mode button (`['wall','Chọn đoạn tường']`) in the existing mode-button loop. In `canvas.onpointerdown`, when `mode==='wall'`, hit-test the point against the current `outlineSupports({loops, thickness: +thickness.value, removedWalls, wallOverrides})`'s runs (nearest-point-to-segment, reusing the existing `projectSegment`/`wallSpan` helpers from `src/wall2d.js` rather than writing new geometry) and set a local `selectedWall` id. Add Xoá/Khôi phục buttons next to the toolbar, shown only when `selectedWall` is set: Xoá guards against a mounted gate (search `gates`/placed deco entities for one anchored to this run's id, matching the existing gate-blocks-delete check already used elsewhere) via `record()` then pushing the id into `removedWalls` (or splicing it back out for Khôi phục), then `draw()`. Add a keyboard shortcut (pick an unused key; check `box.onkeydown`'s existing bindings first) to switch to `'wall'` mode directly.

- [ ] **Step 3: Implement the material override picker**

When `selectedWall` is set and a wall material is available for the current scene, show a small `<select>` of the available wall materials; picking one sets `wallOverrides[selectedWall]` (via `record()` first), clearing to "— mặc định —" deletes that key. Keep this inside the same conditional UI block as Step 2's buttons.

- [ ] **Step 4: Wire persistence**

Add `removedWalls`/`wallOverrides` into `draft()`'s snapshot object and restore them in `travel()` exactly like every other tracked field there (`gates`, `front`, `rear`, …), and into `outlineData()`'s returned object (structured-cloned, not the live references, matching how `propEdits` is already cloned there).

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "feat: select, delete, restore and re-material individual wall runs in the outline editor"
```

---

## Self-review notes
- Spec coverage: delete/restore a run (Task 1 + 3), per-run material override (Task 1 + 2 + 3), single choke-point fix propagating to all 6 `outlineSupports` consumers (Task 1), keyboard shortcut (Task 3). Covered.
- Task 2 and 3 have no automated test, consistent with every other canvas/DOM file in this codebase having none — each carries an explicit manual verification plan instead of a false-coverage unit test.
- Given `src/outlineEditor.js` is under heavy concurrent edit by another contributor, Task 3's step anchors are deliberately phrased as "re-grep before editing" rather than trusted absolute line numbers, and the Global Constraints section repeats the fetch-before-push discipline already in effect for this project.
- Proportion check: three tasks, the only fully-mechanical/testable one (Task 1) given concrete code; Tasks 2-3 give signatures and reuse-pointers to existing helpers rather than full bodies, since the UI shape depends on code that will have moved by execution time.
