import test from 'node:test';
import assert from 'node:assert/strict';
import {diamondOutline,newSurface,planSurface,surfaceKinds as K,surfaceProfiles,surfaceReachable,surfaceTypes} from '../src/surfaceTerrain.js';
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
