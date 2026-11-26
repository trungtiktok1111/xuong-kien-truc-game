import test from 'node:test';
import assert from 'node:assert/strict';
import {captureOutlineTiles,placeOutlineTiles} from '../src/outlineMaterials.js';
import {dressOutline} from '../src/outlineDressing.js';
import {outlineLevels} from '../src/outlineLevels.js';
import {rasterOutline} from '../src/mapCollision.js';
import {linkWalkability} from '../src/mapLinks2d.js';

const loop=(x,y)=>[[[x,y],[x+4,y],[x+4,y+3],[x,y+3]]];
const at=(cells,x,y)=>cells.find(c=>c.x===x&&c.y===y)?.tiles;
const w=20,h=20;
const source=()=>({w,h,layers:Array.from({length:4},(_,l)=>Array(w*h).fill(l+1))});

test('scan retains each tile layer and only copies floor on the margin',()=>{
 const map=source(),selection=loop(2,3);
 map.layers[2][4*w+3]=26;
 const cells=captureOutlineTiles(selection,map,[],w,h);
 const dest=placeOutlineTiles(cells,loop(9,12),{x:0,y:0,dx:7,dy:9,c:1,s:0},w,h,v=>v);
 assert.deepEqual(at(dest,10,13),[1,2,26,4]);
 assert.deepEqual(at(dest,9,11),[1]);
 assert.equal(at(dest,19,19),undefined);
});

test('copied tiles in a draft can be scanned and pasted again',()=>{
 const selection=loop(2,3),stamps=[[{x:3,y:4,tiles:[5,6,7,8]}]];
 const cells=captureOutlineTiles(selection,null,stamps,w,h);
 const dest=placeOutlineTiles(cells,loop(10,12),{x:0,y:0,dx:8,dy:9,c:1,s:0},w,h,v=>v+10);
 assert.deepEqual(at(dest,11,13),[15,16,17,18]);
});

test('automatic dressing on a dungeon layout keeps its geometry, markers and playable route',()=>{
 const {w,h,loops,start,goal,chests}=outlineLevels.find(l=>l.id==='crossroads-below');
 const mask=rasterOutline(loops,w,h),blk=Array.from(mask,v=>1-v);
 const markers=[[start,'start'],[goal,'goal'],...chests.map(p=>[p,'chest'])]
  .map(([[x,y],t])=>({x,y,t}));
 const map={w,h,blk,layers:Array.from({length:4},()=>Array(w*h).fill(0)),
  cfg:{outline:{loops,floorCollision:true}},ents:markers.slice()};
 const materials=[1,2,3,4].map(sid=>({
  floors:[{sid,source:String(sid)}],
  props:[{radius:.27,source:String(sid),create:(x,y,id)=>({x:x-1,y:y-1,id,t:'deco',
   outlineAutoProp:true,col:[{k:'circle',x:0,y:0,r:.27}]})}]
 }));
 const original=structuredClone(map);
 const result=dressOutline(map,materials,v=>v);
 assert.equal(result.sources.length,4);
 assert.ok(result.props>0);
 assert.deepEqual(map.cfg,original.cfg);
 assert.deepEqual(map.blk,original.blk);
 assert.deepEqual(map.ents.slice(0,markers.length),original.ents);
 const connected=linkWalkability(map).component(markers[0]);
 assert.ok(connected.some(({x,y})=>x===goal[0]&&y===goal[1]));
 assert.equal(dressOutline(map,materials,v=>v).props,result.props);
 assert.equal(map.ents.length,markers.length+result.props);
});

test('selected floor and prop palettes use multiple materials in the same outline',()=>{
 const loops=[[[1,1],[19,1],[19,19],[1,19]]],mask=rasterOutline(loops,w,h);
 const map={w,h,blk:Array.from(mask,v=>1-v),layers:Array.from({length:4},()=>Array(w*h).fill(0)),
  cfg:{outline:{loops,floorCollision:true}},ents:[{x:9,y:9,t:'start'},{x:10,y:10,t:'goal'}]};
 const floors=[1,2,3].map(sid=>({sid,source:'test'}));
 const props=['chair','table'].map(name=>({radius:.22,source:'test',
  create:(x,y,id)=>({x:x-1,y:y-1,id,name,t:'deco',outlineAutoProp:true})}));
 const result=dressOutline(map,[{floors,props}],v=>v,[],[],{floor:1,props:1},new Set(),true);
 assert.deepEqual([...new Set(map.layers[0].filter(Boolean))].sort(),[1,2,3]);
 assert.equal(result.propKinds,2);
 assert.deepEqual([...new Set(map.ents.filter(e=>e.outlineAutoProp).map(e=>e.name))].sort(),['chair','table']);
});
