import test from 'node:test';
import assert from 'node:assert/strict';
import {mapCollision,rasterOutline} from '../src/mapCollision.js';

const rect=(x0,y0,x1,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
const ellipse=(x,y,rx,ry)=>Array.from({length:64},(_,i)=>{
 const t=i*Math.PI/32;
 return [x+Math.cos(t)*rx,y+Math.sin(t)*ry];
});
function fixture(loops,floorCollision){
 const w=20,h=20;
 const blk=Array.from(rasterOutline(loops,w,h),v=>Number(!v));
 return {w,h,blk,cfg:{outline:{loops,floorCollision}}};
}

test('a legacy outline uses its exact boundary and keeps manual blocks on the floor',()=>{
 const map=fixture([rect(1.2,1,18.4,19)],undefined);
 map.blk[8*map.w+8]=1;
 const c=mapCollision(map);
 assert.ok(c.floor);
 assert.equal(c.tileBlocked(10*map.w+18),false);
 assert.ok(c.free(18.08,10.5,.28));
 assert.ok(!c.free(18.20,10.5,.28));
 assert.ok(!c.free(1.15,10.5,0));
 assert.ok(!c.free(8.5,8.5,.28));
});

test('radius and swept paths respect the curved perimeter and the edge of an inner void',()=>{
 const outer=ellipse(10,10,8,7),hole=ellipse(10,10,2.6,3.1);
 const {floor,free}=mapCollision(fixture([outer,hole],true));
 assert.ok(free(17.4,10,.28));
 assert.ok(!free(17.85,10,.28));
 assert.ok(!free(10,10,.28));
 assert.ok(!floor.sweep(5,10,15,10,.28));
 assert.ok(floor.sweep(6,6,14,6,.28));
});

test('a narrow cut is still a barrier even if no blocked center lies inside it',()=>{
 const loops=[rect(1,1,19,19),rect(10.482,3,10.49,17)];
 const {floor}=mapCollision(fixture(loops,true));
 assert.ok(!floor.sweep(9,10,12,10,.01));
});

test('manual grid collision remains available and circular footprints clear tile corners',()=>{
 const map=fixture([rect(1.2,1,18.4,19)],false);
 map.blk[8*map.w+8]=1;
 const c=mapCollision(map);
 assert.equal(c.floor,null);
 assert.ok(!c.free(18.08,10.5,.28));
 assert.ok(c.free(7.79,7.79,.28));
 assert.ok(!c.free(7.82,7.82,.28));
});
