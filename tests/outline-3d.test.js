import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,Raycaster,Vector3} from 'three';
import {fitGate3D,outlineCollision3D,outlineMarkers,outlineMesh3D,wallSegments3D} from '../src/outline3d.js';
import {outlineLevels} from '../src/outlineLevels.js';

const outline={loops:[[[1,1],[7,1],[19,1],[19,19],[1,19]],[[8,8],[12,8],[12,12],[8,12]]],front:1,rear:1,thickness:.8};
test('3D plan has a slab with a hole and collision uses the same perimeter',()=>{
 const group=outlineMesh3D(outline);
 const floor=group.children.find(m=>m.name==='Sàn đường bao');
 const hit=(x,z)=>new Raycaster(new Vector3(x,5,z),new Vector3(0,-1,0)).intersectObject(floor);
 assert.ok(Math.abs(new Box3().setFromObject(floor).max.y)<1e-6);
 assert.ok(hit(5,5).length);
 assert.equal(hit(10,10).length,0);
 const clear=outlineCollision3D(outline,[24,24,24]);
 assert.equal(clear(5,5,0),true);
 assert.equal(clear(10,10,0),false);
 assert.equal(clear(9,1.5,0),false);
 assert.equal(clear(9,1.5,1.5),true);
});
test('3D gate joins straight collinear edges, cuts the wall, and has an inside landing',()=>{
 assert.equal(fitGate3D(outline,[1,1],3,.2),null);
 const gate=fitGate3D(outline,[7,1],3,.2);
 assert.ok(gate);
 const opened={...outline,gates:[{...gate,id:'gate'}]};
 assert.ok(wallSegments3D(opened).length<wallSegments3D(outline).length);
 const clear=outlineCollision3D(opened,[24,24,24]);
 assert.ok(clear(...gate.inside,0));
 assert.ok(clear(7,1.5,0));
 assert.equal(clear(2,1.5,0),false);
});
for(const plan of outlineLevels){
 test(plan.name+' has reachable start and goal in native 3D',()=>{
  const {start,goal}=outlineMarkers({...plan,front:plan.height??1,rear:plan.height??1,thickness:.24},plan.w,plan.h,plan);
  assert.deepEqual(start,plan.start);
  assert.deepEqual(goal,plan.goal);
 });
}
