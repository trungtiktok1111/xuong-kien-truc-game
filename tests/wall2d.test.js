import test from 'node:test';
import assert from 'node:assert/strict';
import {outlineSupports,outlineWallRuns} from '../src/wall2d.js';

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

// Review finding (Important #4): a run's id used to encode its loop index and point
// index, so adding/removing/reordering an unrelated loop elsewhere in the outline (which
// renumbers every later loop) silently repointed a stored removedWalls/wallOverrides
// entry at a different physical wall. Ids must now be keyed by the run's own geometry.
test('a run keeps the same id when an unrelated loop is reordered ahead of it',()=>{
 const wall=[[0,0],[4,0],[4,4],[0,4]];
 const other=[[10,10],[12,10],[12,12],[10,12]];
 const before=outlineSupports({loops:[wall,other],thickness:.24});
 const after=outlineSupports({loops:[other,wall],thickness:.24}); // wall is now loop index 1, not 0
 const sameWallRun=before.find(run=>run.x===wall[0][0]-1&&run.y===wall[0][1]-1);
 const afterRun=after.find(run=>run.x===sameWallRun.x&&run.y===sameWallRun.y);
 assert.equal(afterRun.id,sameWallRun.id);
});

// Review finding (Critical #1): outlineSupports deliberately omits a run that is too
// short (<=0.5) or whose loop has no straight corner (e.g. a dense curve) — those
// segments were never assigned an id and were never "removed". outline2D's tagging must
// tell "no owning run at all" apart from "owning run exists but is in removedWalls", and
// outlineWallRuns (the unfiltered list) is what makes that distinction possible.
test('outlineWallRuns includes every run regardless of removedWalls, unlike outlineSupports',()=>{
 const base=outlineWallRuns(square());
 assert.ok(base.length>=1);
 assert.deepEqual(outlineWallRuns({...square(),removedWalls:[base[0].id]}),base);
});
