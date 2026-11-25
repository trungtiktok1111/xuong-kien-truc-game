import test from 'node:test';
import assert from 'node:assert/strict';
import {planSettlement,settlementTile,networkVariant} from '../src/settlementLayout.js';

const lots=[{w:5,h:4},{w:3,h:3},{w:2,h:2},{w:6,h:3}];
const roadNames=new Set(['roadEW','roadNS','roadNE','roadNW','roadSE','roadES','roadSW','crossroad',
  'crossroadNSW','crossroadNES','crossroadNEW','crossroadESW','bridgeNS','endN','endE','endS','endW']);
const waterNames=new Set(['water','waterN','waterS','riverEW','riverNS','riverNE','riverNW','riverES','riverSW']);

function random(seed){
  let state=seed;
  return ()=>((state=Math.imul(state,1664525)+1013904223)>>>0)/4294967296;
}

for(const style of ['land','river','creek']){
  test('settlement '+style+' connects frontages and reserves different land uses',()=>{
    const w=34,h=28,plan=planSettlement(w,h,lots,style,random(42));
    assert.ok(plan.buildings.length>=2);
    assert.ok(plan.groves.length>=2);
    assert.equal(plan.bridges.length,{land:0,river:3,creek:1}[style]);
    for(const [x,y] of plan.accesses)assert.equal(plan.blocked[y*w+x],0);
    for(const cells of plan.groves)for(const [x,y] of cells){
      assert.ok(!plan.roads.has(x+':'+y)&&!plan.water.has(x+':'+y));
      assert.equal(plan.blocked[y*w+x],0);
    }
    for(const house of plan.buildings)for(let y=house.y;y<house.y+house.lot.h;y++)for(let x=house.x;x<house.x+house.lot.w;x++){
      assert.equal(plan.blocked[y*w+x],1);
      assert.equal(settlementTile(plan,x,y,style),null);
    }
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const cell=x+':'+y,name=settlementTile(plan,x,y,style);
      if(plan.roads.has(cell))assert.ok(roadNames.has(name),name);
      else if(plan.water.has(cell)){
        assert.ok(waterNames.has(name),name);
        assert.equal(plan.blocked[y*w+x],1);
      }
    }
  });
}


test('play styles change the road topology and a seed recreates a layout',()=>{
  const build=(profile,seed)=>planSettlement(34,28,lots,'river',random(seed),profile);
  const market=build('market',42),outpost=build('outpost',42),trail=build('trail',42);
  assert.deepEqual(market,build('market',42));
  assert.notDeepEqual(market.roads,build('market',43).roads);
  assert.notDeepEqual(market.buildings,build('market',43).buildings);
  const edges=plan=>[...plan.roads].reduce((sum,cell)=>{
    return sum+networkVariant(plan.roads,...cell.split(':').map(Number)).length;
  },0)/2;
  assert.ok(edges(market)>=market.roads.size,'market has a loop');
  assert.ok(outpost.goal[0]<outpost.riverX,'outpost ends on a spur before the bridge');
  assert.notEqual(trail.start[1],trail.goal[1],'trail approaches the bridge after a turn');
  assert.equal(new Set([market,outpost,trail].map(plan=>[...plan.roads].sort().join(','))).size,3);
});

test('seeded layouts keep bridges, building approaches and ground tiles valid across map sizes',()=>{
  for(const profile of ['market','outpost','trail'])for(const style of ['land','river','creek']){
    for(const [w,h] of [[18,18],[18,64],[34,28],[64,18],[64,64]])for(let seed=0;seed<12;seed++){
      const plan=planSettlement(w,h,lots,style,random(seed*913+17),profile);
      assert.ok(plan.buildings.length>=2,[profile,style,w,h,seed].join(' '));
      assert.equal(plan.bridges.length,{land:0,river:3,creek:1}[style]);
      for(const [x,y] of plan.bridges)assert.equal(networkVariant(plan.roads,x,y),'NS');
      for(const {front} of plan.buildings)assert.ok(plan.roads.has(front.join(':')));
      for(const cell of plan.roads){
        const [x,y]=cell.split(':').map(Number);
        assert.ok(roadNames.has(settlementTile(plan,x,y,style)));
        assert.equal(plan.blocked[y*w+x],0);
      }
      for(const cell of plan.water){
        const [x,y]=cell.split(':').map(Number);
        if(y>=0&&y<h&&!plan.roads.has(cell))assert.ok(waterNames.has(settlementTile(plan,x,y,style)));
      }
    }
  }
});

test('raised river and stream crossings retain water tiles and reach both banks',()=>{
  for(const style of ['river','creek']){
    const plan=planSettlement(34,28,lots,style,random(42),'trail');
    const {left,right,y}=plan.bridge;
    assert.ok(plan.roads.has((left-1)+':'+y)&&plan.roads.has(right+':'+y));
    for(const [x,y] of plan.bridges)
      assert.ok(waterNames.has(settlementTile(plan,x,y,style,{raised:true})));
  }
});
