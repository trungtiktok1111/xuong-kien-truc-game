import test from 'node:test';
import assert from 'node:assert/strict';
import {captureOutlineTiles,placeOutlineTiles} from '../src/outlineMaterials.js';

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
