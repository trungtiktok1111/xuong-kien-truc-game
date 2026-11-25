import test from 'node:test';
import assert from 'node:assert/strict';
import {automaticPaintZones,daXoayArchProfiles,estimateContact,indexPaintZones,makePaintProfile,paintedGroups,paintFamily} from '../src/placement2d.js';
import {mapCollision} from '../src/mapCollision.js';

test('painted props choose foot profile by role and keep open or unknown multipart assets clear',()=>{
  assert.equal(paintFamily('tree01.png','Cây','Chặn đường'),'round');
  assert.equal(paintFamily('stone wall','Tường/hàng rào','Chặn đường'),'wall');
  assert.equal(paintFamily('wooden arch','Nhà','Chặn đường'),null);
  assert.equal(paintFamily('wooden door','Nhà','Chặn đường'),null);
  assert.equal(paintFamily('roof.png','Nhà','Chặn đường'),null);
  assert.equal(paintFamily('crate.png','Đồ vật','Đi được'),null);
});

test('sprite contact ignores faint shadows and follows flips from the displayed frame',()=>{
  const n=24,rgba=new Uint8Array(n*n*4);
  for(let y=4;y<19;y++)for(let x=3;x<9;x++)rgba[(y*n+x)*4+3]=255;
  for(let x=0;x<n;x++)rgba[((n-1)*n+x)*4+3]=80;
  const a=estimateContact(rgba,n,0),b=estimateContact(rgba,n,1);
  assert.equal(a.v,18.5/24);assert.equal(a.u,.25);assert.equal(b.u,.75);
  assert.equal(makePaintProfile('round',a).kind,'ell');
});

test('derived geometry is fractional, reused by runtime and removable with the painted image',()=>{
  const layer=Array(36).fill(0);layer[14]=8;layer[15]=16;
  const map={w:6,h:6,blk:Array(36).fill(0),cfg:{view:'iso'},layers:[[],[],layer,[]]};
  const groups=paintedGroups(layer,6,6);
  assert.equal(groups.length,1);
  const profile=makePaintProfile('round',{u:.5,v:1,width:.2});
  const zones=automaticPaintZones(map,v=>v===8?profile:null,groups);
  assert.equal(zones.length,1);
  const z=zones[0],x=z.x+z.w/2,y=z.y+z.h/2;
  const collision=mapCollision({...map,placementZones:zones});
  assert.equal(collision.free(x,y,.15),false);
  assert.equal(collision.free(x+.5,y,.15),true);
  assert.equal(mapCollision(map).free(x,y,.15),true);
  assert.equal(automaticPaintZones({...map,cfg:{...map.cfg,autoObjectCollision:false}},()=>profile).length,0);
  layer[14]=0;assert.equal(automaticPaintZones(map,v=>v===8?profile:null).length,0);
});

test('100,000 placement and indexed collision checks across grid, Angle and Isometric',()=>{
  let count=0;
  for (let i=0;i<100000;i++){
    const w=32,h=24,x=1+i%29,y=1+Math.floor(i/29)%21;
    const layer=[];layer[y*w+x]=1;
    const modes=[{view:'rpg'},{view:'iso',proj:'angle'},{view:'iso'}];
    const map={w,h,layers:[[],[],layer,[]],cfg:modes[i%3]};
    const group={cells:[y*w+x],x0:x,y0:y,x1:x+1,y1:y+1,xc:x+.5,yb:y+1};
    const p=makePaintProfile(i%2?'round':'solid',{u:.25+(i%30)/60,v:.7+(i%15)/60,width:.14+(i%12)/70});
    const [z]=automaticPaintZones(map,()=>p,[group]);
    const cx=z.x+z.w/2,cy=z.y+z.h/2;
    const blocked=indexPaintZones([z]);
    assert.equal(blocked(cx,cy,.1),true);
    assert.equal(blocked(cx+.65,cy,.1),false);
    assert.equal(blocked(cx,cy+z.h/2+.04,.1),true);
    assert.ok(Math.abs(cx-x)<1 && Math.abs(cy-y)<1.01);
    count++;
  }
  assert.equal(count,100000);
});


test('a painted Đá Xoáy arch has two separate post colliders in every projection',()=>{
  const layer=Array(64).fill(0);
  layer[27]=1;
  for(const cfg of [{view:'top'},{view:'iso'},{view:'iso',proj:'angle'}]){
    for(let flip=0;flip<8;flip++){
      const map={w:8,h:8,blk:Array(64).fill(0),layers:[[],[],layer,[]],cfg};
      const zones=automaticPaintZones(map,()=>daXoayArchProfiles(flip));
      assert.equal(zones.length,2);
      assert.ok(zones.every(zone=>zone.estimated===false));
      const [a,b]=zones.map(z=>[z.x+z.w/2,z.y+z.h/2]);
      const collision=mapCollision({...map,placementZones:zones});
      assert.equal(collision.free(...a,.08),false);
      assert.equal(collision.free(...b,.08),false);
      assert.equal(collision.free((a[0]+b[0])/2,(a[1]+b[1])/2,.08),true);
    }
  }
});
