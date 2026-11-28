import test from 'node:test';
import assert from 'node:assert/strict';
import {outline2D} from '../src/outline2d.js';

function polygon(n,r){
 return Array.from({length:n},(_,i)=>{
  const a=2*Math.PI*i/n;
  return [10+r*Math.cos(a),10+r*Math.sin(a)];
 });
}

// Review finding (Critical #1): the first version of outline2D's render-segment tagging
// matched against outlineSupports' FILTERED list, so any segment whose run was simply too
// short/curved to ever qualify for an id (not "removed" — never a support at all) got
// marked removed by default. A small polygon with no long straight run reproduces this:
// every edge is short enough that no run qualifies, so supports is empty, but the walls
// themselves must still render.
test('outline2D does not mark a short-edged curved loop as removed when no run ever qualified for an id',()=>{
 const loops=[polygon(12,.9)];
 const geo=outline2D({loops,thickness:.24});
 assert.equal(geo.supports.length,0); // confirms the setup: no run qualifies for an id here
 assert.ok(geo.walls.length>0);
 assert.ok(!geo.walls.some(w=>w.removed));
});

test('outline2D marks only the removed run\'s own segments, not neighboring runs',()=>{
 const loops=[[[0,0],[4,0],[4,4],[0,4]]];
 const base=outline2D({loops,thickness:.24});
 assert.equal(base.supports.length,4);
 const target=base.supports.find(s=>s.x===-1&&s.y===-1); // the (0,0)-(4,0) edge
 assert.ok(target);
 const withRemoval=outline2D({loops,thickness:.24,removedWalls:[target.id]},false,[]);
 const removedSegments=withRemoval.walls.filter(w=>w.removed);
 assert.equal(removedSegments.length,8);
 assert.ok(removedSegments.every(w=>w.a[1]===0&&w.b[1]===0));
});

test('outline2D sets wall.material only on the overridden run\'s segments',()=>{
 const loops=[[[0,0],[4,0],[4,4],[0,4]]];
 const base=outline2D({loops,thickness:.24});
 const target=base.supports.find(s=>s.x===-1&&s.y===-1);
 const withOverride=outline2D({loops,thickness:.24,wallOverrides:{[target.id]:'Gỗ sồi'}},false,[]);
 const matching=withOverride.walls.filter(w=>w.material==='Gỗ sồi');
 assert.equal(matching.length,8);
 assert.ok(matching.every(w=>w.a[1]===0&&w.b[1]===0));
 assert.ok(withOverride.walls.some(w=>w.material===undefined));
});
