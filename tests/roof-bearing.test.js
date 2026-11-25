import test from 'node:test';
import assert from 'node:assert/strict';
import {constructionContext,isBearingColumn,propIssue,roofBearing,roofIssue,roofPlacementProblems,wallHasFoundation} from '../src/constructionRules2d.js';
import {placedPropFrame} from '../src/proj.js';

const map=(ents=[])=>({w:16,h:16,ents,cfg:{view:'iso'},blk:Array(256).fill(0),layers:[Array(256).fill(1),[],[],[]]});
const roof={id:'roof',t:'deco',x:7,y:7,sc:3.8,placedProp:true,roofDirection:'E',walk:true};
const wall=(id,x,height)=>({id,t:'deco',x:x-1,y:5.5,placedProp:true,wallLine:{dx:0,dy:3,height,thickness:.2}});
const left=wall('left',6.5,1.25),right=wall('right',9.5,2);
const project=(x,y)=>[24*(x-y),12*(x+y)];

test('the brush rejects a floating roof and a roof supported on only one side',()=>{
  for(const ents of [[],[left],[{...left,y:7,wallLine:{...left.wallLine,dx:3,dy:0}}]]){
    assert.equal(propIssue(roof,constructionContext(map(ents))),roofIssue);
  }
  const reversed={...roof,roofDirection:'W'};
  assert.equal(propIssue(reversed,constructionContext(map([left,right]))),roofIssue);
});

test('two grounded walls set the roof surface to their actual heights',()=>{
  const ctx=constructionContext(map([left,right]));
  const bearing=roofBearing(roof,ctx);
  assert.ok(bearing);
  assert.equal(propIssue(roof,ctx),'');
  assert.equal(bearing.rise,1);
  for(const p of bearing.contacts){
    assert.equal(bearing.base+bearing.rise*((p.x-(roof.x+1))/4+.5),p.height);
  }
  const f=placedPropFrame({...roof,roofBase:bearing.base,roofRise:bearing.rise},project,32,'iso');
  assert.ok(Math.abs(f.roof[0][1]-(project(6,6)[1]-(bearing.base+.16)*24))<1e-9);
  assert.ok(Math.abs(f.roof[1][1]-(project(10,6)[1]-(bearing.base+bearing.rise+.16)*24))<1e-9);
  assert.equal(roofBearing(roof,constructionContext(map([left,wall('same',9.5,1.25)]))).rise,0);
});

test('moving support, cutting a wall opening, or removing its floor invalidates only dependent roofs',()=>{
  const other={...roof,id:'other',x:12,y:12};
  assert.deepEqual(roofPlacementProblems(map([left,right,roof,other])),[other]);
  assert.deepEqual(roofPlacementProblems(map([left,{...right,x:10},roof,other])),[roof,other]);
  const gate={id:'gate',t:'deco',wallId:right.id,x:right.x,y:7,col:[{x:0,y:-1.5},{x:0,y:1.5}]};
  assert.deepEqual(roofPlacementProblems(map([left,right,gate,roof])).map(e=>e.id),['roof']);
  const hole=map([left,right,roof]);
  hole.layers[0][7*16+9]=0;
  assert.equal(wallHasFoundation(right,constructionContext(hole)),false);
  assert.deepEqual(roofPlacementProblems(hole),[roof]);
});

test('columns support a roof at their sprite height and ordinary scenery does not',()=>{
  const col=(x,name)=>({t:'deco',placedProp:true,x:x-1,y:7,sc:1.5,spriteBounds:[.4,.2,.6,.9],name});
  assert.equal(isBearingColumn('Cột đá'),true);
  assert.equal(isBearingColumn('Cột đèn'),false);
  assert.equal(isBearingColumn('Cột cờ'),false);
  assert.ok(roofBearing(roof,constructionContext(map([col(6.5,'Cột đá'),col(9.5,'Pillar 01')]))));
  assert.equal(roofBearing(roof,constructionContext(map([col(6.5,'Hòm'),col(9.5,'Cột đèn')]))),null);
});
