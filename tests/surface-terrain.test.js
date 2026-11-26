import {surfaceLevels,surfacePieces} from '../src/surfaceLibrary.js';
import {placedPropFrame} from '../src/proj.js';
import {decoZones,zonesHit} from '../src/zones.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {diamondOutline,newSurface,planSurface,surfaceKinds as K,surfaceFromLevel,surfaceProfiles,surfaceReachable,surfaceTypes} from '../src/surfaceTerrain.js';
import {rasterOutline} from '../src/mapCollision.js';

test('the exterior ground fills every cell and each standard setting connects spawn to goal',()=>{
 for(const [w,h] of [[24,20],[48,36],[64,60],[128,96]]){
  assert.ok(rasterOutline(diamondOutline(w,h),w,h).every(Boolean));
  for(const name of Object.keys(surfaceProfiles))for(const seed of [1,4,7]){
   const plan=planSurface(w,h,{...newSurface(name),seed});
   assert.ok(plan.tiles.every(kind=>kind<surfaceTypes.length));
   const route=surfaceReachable(w,h,plan.blocked,plan.start);
   assert.ok(route.some(p=>p.x===plan.goal[0]&&p.y===plan.goal[1]),[w,h,name,seed].join(' '));
   if(name==='blank'){assert.ok(plan.blocked.every(n=>!n));continue;}
   assert.ok(plan.tiles.some((tile,i)=>tile===K.bridge&&!plan.blocked[i]),name);
   assert.ok(plan.tiles.some((tile,i)=>tile>=K.sea&&tile<=K.pond&&plan.blocked[i]),name);
  }
 }
});
test('independent surface patches can add new water and reopen a crossing',()=>{
 const w=24,h=20,base={...newSurface(),roads:false,land:false,water:[]};
 const canal={kind:'canal',bounds:[9,0,12,h]};
 const bridge={kind:'bridge',bounds:[8,8,13,11]};
 const water=planSurface(w,h,{...base,patches:[canal]});
 assert.equal(water.tiles[10*w+10],K.canal);
 assert.equal(water.blocked[10*w+10],1);
 assert.equal(water.tiles[2],K.plain);
 const crossed=planSurface(w,h,{...base,patches:[canal,bridge]});
 assert.equal(crossed.tiles[10*w+10],K.bridge);
 assert.equal(crossed.blocked[10*w+10],0);
 assert.ok(surfaceReachable(w,h,crossed.blocked,crossed.start).some(p=>p.x>12));
 const open=planSurface(w,h,base);
 assert.ok(open.blocked.every(n=>!n));
});

test('every named surface layout has its own repeatable route and belongs to a complete catalog',()=>{
 const signatures=new Set();
 for(const level of surfaceLevels){
  const {w,h}=level,spec=surfaceFromLevel(level);
  const plan=planSurface(w,h,spec);
  const blocked=plan.blocked.slice();
  for(const {x,y,kind} of plan.trees)if(kind==='tree')blocked[y*w+x]=1;
  for(const {x,y} of plan.houseLots)for(let j=0;j<3;j++)for(let i=0;i<2;i++)blocked[(y+j)*w+x+i]=1;
  assert.ok(surfaceReachable(w,h,blocked,plan.start).some(({x,y})=>x===plan.goal[0]&&y===plan.goal[1]),level.name);
  assert.deepEqual(plan,planSurface(w,h,spec),level.name);
  const signature=Array.from(planSurface(46,29,spec).tiles).join(',');
  assert.ok(!signatures.has(signature),level.name);
  signatures.add(signature);
 }
 assert.equal(signatures.size,30);
 assert.equal(new Set(surfacePieces.map(item=>item.id)).size,30);
});

test('a quarter turn rotates a shaped stamp and the sea requires a dedicated bridge',()=>{
 const base=newSurface('blank'),bounds=[0,0,20,20];
 const stamp=(piece,turn=0)=>({piece,bounds,turn});
 const at=(patches,x,y)=>planSurface(20,20,{...base,patches}).tiles[y*20+x];
 assert.equal(at([stamp('river-bend')],10,1),K.river);
 assert.equal(at([stamp('river-bend')],1,9),K.plain);
 assert.equal(at([stamp('river-bend',1)],18,10),K.river);
 assert.equal(at([stamp('island')],10,10),K.plain);
 assert.equal(at([stamp('island')],4,10),K.lake);
 assert.equal(at([stamp('river'),stamp('bridge')],10,10),K.bridge);
 assert.equal(at([stamp('coast'),stamp('main')],17,10),K.sea);
 assert.equal(at([stamp('coast'),stamp('bridge')],17,10),K.bridge);
});

test('saved surface tree art and its collision use the same projected ground contact',()=>{
 const e={t:'deco',id:'surface-tree-3-6',surfaceGenerated:true,x:2.5,y:5.5,sc:3.4,oy:.1905,col:[{k:'circle',x:0,y:0,r:.2}]};
 const [zone]=decoZones([e]);
 const project=(x,y)=>[(x-y)*75,(x+y)*37.5];
 const frame=placedPropFrame(e,project,100,'iso');
 const [x,y]=project(zone.x+zone.w/2,zone.y+zone.h/2);
 assert.ok(Math.abs(frame.x+frame.size*171/336-x)<1e-8);
 assert.ok(Math.abs(frame.y+frame.size*209/336-y)<1e-8);
 assert.equal(zone.k,'rect');
 assert.ok(Math.abs(zone.w*150-frame.size*80/336)<1e-8);
 assert.ok(zonesHit([zone],e.x+1,e.y+1,0));
 assert.ok(!zonesHit([zone],e.x+1,e.y+1+.45,0));
});
