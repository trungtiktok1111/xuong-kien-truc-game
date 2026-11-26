import test from 'node:test';
import assert from 'node:assert/strict';
import {campaignStart,mapLinkLanding,mapLinkReports,planMapPair} from '../src/mapLinks2d.js';

function grid(name,walk,start,goal,cfg={}){
  const w=12,h=10,blk=Array.from({length:w*h},(_,i)=>Number(!walk(i%w,Math.floor(i/w))));
  return {w,h,blk,cfg,name,ents:[{t:'start',id:'start',x:start[0],y:start[1]},
    {t:'goal',id:'goal',x:goal[0],y:goal[1]}]};
}

test('link a resource road to an outline with two safe separated arrival points',()=>{
  const farm=grid('Trang trại',(x,y)=>y===4&&x>0&&x<11,[1,4],[10,4]);
  const loops=[[[2,2],[9,2],[9,7],[2,7]]];
  const hall=grid('Đường bao',(x,y)=>x>=2&&x<9&&y>=2&&y<7,[3,3],[7,5],{outline:{loops,floorCollision:true}});
  const maps=[farm,hall];
  const [out,back]=planMapPair(farm,hall,0,1,'pair');
  assert.deepEqual([out.x,out.y,out.to,out.advanceGoal],[10,4,1,'goal']);
  assert.equal(back.to,0);
  for(const [door,peer] of [[out,back],[back,out]]){
    assert.deepEqual(mapLinkLanding(maps,door),{x:door.tx+.5,y:door.ty+.5});
    assert.ok(Math.hypot(door.tx-peer.x,door.ty-peer.y)>=1);
  }
  farm.ents.push(out);hall.ents.push(back);
  assert.deepEqual(mapLinkReports(maps),[]);
  assert.equal(campaignStart(maps,1),1);
  assert.equal(campaignStart(maps,2),0);
  hall.blk[out.ty*hall.w+out.tx]=1;
  assert.equal(mapLinkLanding(maps,out),null);
  assert.ok(mapLinkReports(maps).some(row=>row.includes('ô đến không hợp lệ')));
});

test('a blocked branch is avoided and no links are written when the target lacks floor',()=>{
  const source=grid('Trang trại',(x,y)=>y===4&&x>0&&x<11&&x!==6,[1,4],[9,4]);
  const bad=grid('Hang thiếu sàn',()=>false,[2,4],[8,4]);
  assert.throws(()=>planMapPair(source,bad,0,1,'pair'),/Hang thiếu sàn/);
  assert.equal(source.ents.length,2);
  const target=grid('Hang',(x,y)=>x>1&&x<11&&y>1&&y<9,[2,2],[8,8]);
  const [door]=planMapPair(source,target,0,1,'pair');
  assert.ok(door.x<6);
  assert.equal(mapLinkLanding([source,target],{to:9}),null);
});

test('a painted obstruction can prevent a safe arrival in another map',()=>{
  const m=grid('Màn',()=>true,[3,3],[9,7]);
  m.cfg.zones=[{k:'rect',x:4,y:4,w:1,h:1}];
  assert.equal(mapLinkLanding([m],{to:0,tx:4,ty:4}),null);
  assert.deepEqual(mapLinkLanding([m],{to:0}),{x:3.5,y:3.5});
});


test('recover a spawn inside the raster mask but too close to the outline edge',()=>{
  const source=grid('Màn cũ',()=>true,[3,3],[7,7]);
  const loops=[[[2,2.35],[10,2.35],[10,8],[2,8]]];
  const target=grid('Đường bao mới',(x,y)=>x>=2&&x<10&&y>=2&&y<8,[3,2],[7,6],{outline:{loops,floorCollision:true}});
  const [out,back,entries]=planMapPair(source,target,0,1,'edge');
  assert.deepEqual([entries.targetEntry.x,entries.targetEntry.y],[3,3]);
  assert.deepEqual([entries.sourceEntry.x,entries.sourceEntry.y],[3,3]);
  Object.assign(target.ents[0],entries.targetEntry);
  source.ents.push(out);target.ents.push(back);
  assert.deepEqual(mapLinkReports([source,target]),[]);
});
