import test from 'node:test';
import assert from 'node:assert/strict';
import {floatingRoofCells,floatingRoofEnt,roofRules} from '../src/roofSupport2d.js';

const mk=(w=30,h=30)=>({w,h,cfg:{},ents:[],layers:[Array(w*h).fill(0),Array(w*h).fill(0),Array(w*h).fill(0),Array(w*h).fill(0)]});
const ctx={isSupportTile:v=>v===9,isSupportEnt:e=>/wall|nha/.test(e.name||'')};

test('mái lơ lửng giữa trời bị từ chối',()=>{
  const m=mk();for(let y=5;y<9;y++)for(let x=5;x<9;x++)m.layers[3][y*30+x]=7;
  assert.equal(floatingRoofCells(m,ctx).length,16);
});
test('mái bắc giữa hai tường đối diện thì đứng vững, vượt nhịp thì không',()=>{
  const m=mk();
  for(let y=5;y<9;y++){m.layers[2][y*30+4]=9;m.layers[2][y*30+13]=9;for(let x=5;x<13;x++)m.layers[3][y*30+x]=7;}
  assert.equal(floatingRoofCells(m,ctx).length,0);
  m.cfg.roofSpan=4;assert.ok(floatingRoofCells(m,ctx).length>0);
});
test('mái vươn quá mép đỡ hơn mức cho phép thì báo, vươn ngắn thì được',()=>{
  const m=mk();for(let y=5;y<9;y++)m.layers[2][y*30+5]=9;
  for(let y=5;y<9;y++)for(const x of [6,7])m.layers[3][y*30+x]=7;
  assert.equal(floatingRoofCells(m,ctx).length,0);
  for(let y=5;y<9;y++)m.layers[3][y*30+12]=7;
  assert.equal(floatingRoofCells(m,ctx).length,4);
});
test('tường dựng thành tuyến (wallLine) và vật thể nhà cũng là điểm tựa',()=>{
  const m=mk();m.ents.push({t:'deco',id:'w',x:4,y:4,wallLine:{dx:0,dy:6}});
  m.layers[3][6*30+6]=7;assert.equal(floatingRoofCells(m,ctx).length,0);
  m.layers[3][20*30+20]=7;assert.equal(floatingRoofCells(m,ctx).length,1);
  const m2=mk();m2.ents.push({t:'deco',id:'h',x:9,y:9,name:'nha',fx:2,fy:2});
  m2.layers[3][10*30+11]=7;assert.equal(floatingRoofCells(m2,ctx).length,0);
});
test('mái dạng vật thể phải có điểm tựa; tắt được bằng cfg.roofPhysics=false',()=>{
  const m=mk(),roof={t:'deco',id:'r',x:10,y:10,name:'roof_E-1',fx:3,fy:3};
  assert.equal(floatingRoofEnt(m,roof,ctx),true);
  m.ents.push({t:'deco',id:'p',x:9,y:9,name:'wall',fx:4,fy:4});
  assert.equal(floatingRoofEnt(m,roof,ctx),false);
  const off=mk();off.cfg.roofPhysics=false;off.layers[3][0]=7;
  assert.equal(floatingRoofCells(off,ctx).length,0);assert.equal(roofRules(off.cfg).on,false);
});
