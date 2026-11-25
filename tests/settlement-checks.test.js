import test from 'node:test';
import assert from 'node:assert/strict';
import {bridgeHeight,bridgeRails,crossing,pickBridge} from '../src/settlementBridge.js';
import {canSeeRoad,protectedViews,settlementIssues} from '../src/settlementChecks.js';
import {settlementCriteria} from '../src/settlementCriteria.js';
import {zonesHit} from '../src/zones.js';

test('the rule catalogue exposes every accepted criterion',()=>{
  assert.equal(settlementCriteria.reduce((n,[,items])=>n+items.length,0),43);
});

test('deck and ramps use the same elevation for display and cursor picking',()=>{
  const bridge=crossing([[4,4],[5,4],[6,4]]);
  assert.equal(bridgeHeight(bridge,3,4.5),0);
  assert.equal(bridgeHeight(bridge,3.5,4.5),.21);
  assert.equal(bridgeHeight(bridge,5.5,4.5),.42);
  assert.equal(bridgeHeight(bridge,7.5,4.5),.21);
  assert.equal(bridgeHeight(bridge,5.5,3.5),0);
  const project=(x,y)=>[(x-y)*40,(x+y)*20];
  for(const [x,y] of [[3.7,4.5],[5.5,4.5],[7.5,4.5]]){
    const [u,v]=project(x,y);
    const p=pickBridge(bridge,project,40,u,v-40*bridgeHeight(bridge,x,y));
    assert.ok(Math.abs(x-p.x)<.0001&&Math.abs(y-p.y)<.0001);
  }
  assert.equal(zonesHit(bridgeRails(bridge),5.5,4.5,.28),false);
  assert.equal(zonesHit(bridgeRails(bridge),5.5,4.20,.28),true);
});

test('a sprite can cover a road even when its foot is on another tile',()=>{
  const views=protectedViews([[4,4]],null);
  assert.equal(canSeeRoad({x:4.5,y:4.5,sc:1.5,spriteBounds:[0,0,1,1]},views),false);
  assert.equal(canSeeRoad({x:1,y:4.5,sc:.5,spriteBounds:[0,0,1,1]},views),true);
});

test('checking a draft reports the location of a missing bridge or a blocked route',()=>{
  const w=10,h=10,y=4,route=Array.from({length:8},(_,i)=>[i+1,y]),water=[[4,y],[4,y+1]];
  const blk=new Array(w*h).fill(0);blk[(y+1)*w+4]=1;
  const map={w,h,blk,ents:[{t:'start',x:1,y},{t:'goal',x:8,y}],
    cfg:{settlement:{plan:{route,water,accesses:[],bridge:null}}}};
  assert.ok(settlementIssues(map).some(e=>e.rule==='CAU'&&e.x===4&&e.y===4));
  map.cfg.settlement.plan.bridge=crossing([[4,y]]);
  assert.ok(!settlementIssues(map).some(e=>e.rule==='CAU'||e.rule==='LOI-DI'));
  blk[y*w+5]=1;
  assert.ok(settlementIssues(map).some(e=>e.rule==='LOI-DI'&&e.x===5&&e.y===4));
});
