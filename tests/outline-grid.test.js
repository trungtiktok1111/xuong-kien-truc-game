import test from 'node:test';
import assert from 'node:assert/strict';
import {fitDraftGrid,rebaseOutlineSource,usedGridBounds} from '../src/outlineGrid.js';
import {outline2D} from '../src/outline2d.js';
import {captureOutlineTiles} from '../src/outlineMaterials.js';

const box=(l,t,r,b)=>[[l,t],[r,t],[r,b],[l,b]];
test('fit removes unused margins, keeps hole and stamps and leaves one cell where available',()=>{
 const shape=[box(18,12,53,42),box(24,18,31,26)],stamps=[[{x:22,y:15,tiles:[3]}]];
 const fit=fitDraftGrid(shape,stamps,[0,0],256,192,null,false);
 assert.deepEqual([fit.w,fit.h,fit.origin],[37,32,[17,11]]);
 assert.deepEqual(fit.loops,[box(1,1,36,31),box(7,7,14,15)]);
 assert.deepEqual(fit.stamps,[[{x:5,y:4,tiles:[3]}]]);
 assert.deepEqual(fitDraftGrid(shape,stamps,[0,0],256,192,null,true).origin,[0,0]);
 assert.deepEqual(fitDraftGrid(fit.loops,fit.stamps,fit.origin,fit.w,fit.h,null,false),fit);
});

test('crop keeps map contents, rebases collisions, self-targets and captured materials',()=>{
 const m={w:32,h:20,cfg:{outline:{loops:[box(8,6,15,13)],floorCollision:true},
  zones:[{k:'line',pts:[[9,7],[11,7]],th:.2}]},ents:[{t:'door',x:10,y:9,to:2,tx:12,ty:10}],
  layers:[Array(640).fill(0)],blk:Array(640).fill(1)};
 m.layers[0][8*32+10]=5;
 for(let y=6;y<13;y++)for(let x=8;x<15;x++)m.blk[y*32+x]=0;
 assert.deepEqual(usedGridBounds(m),[8.9,6.9,11.1,10]);
 const translated=rebaseOutlineSource(m,9,9,[7,5],2);
 assert.deepEqual(translated.ents,[{t:'door',x:3,y:4,to:2,tx:5,ty:5}]);
 assert.equal(translated.layers[0][3*9+3],5);
 assert.equal(translated.blk[3*9+3],0);
 assert.deepEqual(translated.cfg.zones[0].pts,[[2,2],[4,2]]);
 assert.deepEqual(translated.cfg.outline.loops,[box(1,1,8,8)]);
 const source={...m,layers:[m.layers[0],...Array.from({length:3},()=>Array(640).fill(0))]};
 assert.deepEqual(captureOutlineTiles([box(1,1,8,8)],source,[],9,9,[7,5]).get(3*1024+3),[5,0,0,0]);
});

test('outline wall heights default equally and keep explicit values including zero',()=>{
 const loop=box(0,0,4,4);
 const standard=outline2D({loops:[loop]});
 assert.equal(standard.front,1);assert.equal(standard.rear,1);
 const custom=outline2D({loops:[loop],front:0,rear:2});
 assert.equal(custom.front,0);assert.equal(custom.rear,2);
});
