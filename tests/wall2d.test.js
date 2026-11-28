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
