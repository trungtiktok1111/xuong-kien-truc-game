import test from 'node:test';
import assert from 'node:assert/strict';
import {automaticPaintZones,daXoayArchProfiles,estimateContact,indexPaintZones,makePaintProfile,paintedPieces,paintFamily,propContact,resizeProp,roofTextureDirection,sceneEntityLayer,turnProp} from '../src/placement2d.js';
import {drawPlacedProp,placedPropBounds,placedPropFrame} from '../src/proj.js';
import {cropContactFrame} from '../src/cropContact.js';
import {decoZones,zonesHit} from '../src/zones.js';
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
  const groups=paintedPieces(layer,6,6);
  assert.equal(groups.length,2);
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


test('freely placed arches keep their contact pixels aligned with both posts when resized',()=>{
  const parts=daXoayArchProfiles(0);
  const e={t:'deco',x:5.25,y:8.625,sc:3.4,sizeBase:3.4,...propContact(parts,null,3.4,'iso')};
  const original=structuredClone(e);
  resizeProp(e,1.5);
  assert.equal(e.sc,5.1);
  for(let i=0;i<parts.length;i++){
    const c=e.col[i],part=parts[i];
    const imageX=(part.u-.5+e.ox)*e.sc/.75;
    const imageY=(part.v-1+e.oy)*e.sc/.75;
    assert.ok(Math.abs(c.x-c.y-imageX)<1e-9);
    assert.ok(Math.abs((c.x+c.y)/2-imageY)<1e-9);
    assert.ok(Math.abs(c.r-original.col[i].r*1.5)<1e-9);
    assert.ok(Math.hypot(c.x,c.y)>c.r);
  }
  assert.deepEqual([e.x,e.y,e.sizeBase],[5.25,8.625,3.4]);
});

test('placing or erasing a neighboring tile preserves the earlier anchor and footprint',()=>{
  const layer=Array(36).fill(0);
  const map={w:6,h:6,cfg:{view:'iso'},layers:[[],[],layer,[]]};
  const profile=makePaintProfile('solid',{u:.5,v:1,width:.3});
  layer[14]=8;
  const before=paintedPieces(layer,6,6).find(p=>p.cells[0]===14);
  const [foot]=automaticPaintZones(map,()=>profile);
  layer[13]=layer[15]=layer[20]=8;
  assert.deepEqual(paintedPieces(layer,6,6).find(p=>p.cells[0]===14),before);
  assert.deepEqual(automaticPaintZones(map,()=>profile).find(z=>z.id==='painted:14'),foot);
  layer[15]=0;
  assert.deepEqual(automaticPaintZones(map,()=>profile).find(z=>z.id==='painted:14'),foot);
});

test('deletion groups distinguish roofs, mounted gates, field objects and actors',()=>{
  const fixtures=[
    [{t:'deco',flat:true},1],
    [{t:'deco',placedProp:true},2],
    [{t:'deco',wallLine:{dx:1,dy:0}},2],
    [{t:'deco',sceneLayer:3},3],
    [{t:'deco',wallId:'outline:0:0'},3],
    [{t:'door'},5],
    [{t:'npc'},5],
    [{t:'chest'},5]
  ];
  for(const [item,group] of fixtures)assert.equal(sceneEntityLayer(item),group);
});

test('roof textures use a sloped, elevated surface and cycle facing without moving the anchor',()=>{
  assert.equal(roofTextureDirection('roof_E-1.png',true),'E');
  assert.equal(roofTextureDirection('roof_E-1.png',false),null);
  assert.equal(roofTextureDirection('floor_1.png',true),null);
  const e={x:3,y:4,sc:.95,tile:{idx:0},roofDirection:'E',spriteBounds:[.2,.1,.8,.9]};
  const project=(x,y)=>[20*(x-y),10*(x+y)];
  const frame=placedPropFrame(e,project,20/.75,'iso');
  assert.ok(frame.roof);
  const [a,b,c]=frame.roof;
  assert.notEqual(b[1]-a[1],c[1]-a[1]);
  assert.ok(placedPropBounds(frame,e.spriteBounds)[3]<project(4,5)[1]);
  assert.equal(placedPropFrame(e,project,20,'top').roof,undefined);
  const calls=[];
  const ctx={save(){},restore(){},fillRect(){},transform(...args){calls.push(args);},drawImage(...args){calls.push(args.slice(1));}};
  drawPlacedProp(ctx,e,{img:{},tw:100,cols:1},frame);
  assert.deepEqual(calls.at(-1).map(n=>Math.round(n)),[20,10,60,80,0,0,1,1]);
  for(const facing of ['N','W','S','E']){turnProp(e);assert.equal(e.roofDirection,facing);}
  assert.deepEqual([e.x,e.y],[3,4]);
});


test('corn contact lines up with each actual stalk and ignores the projected foliage',()=>{
  const contacts=cropContactFrame('Vat-kenney-nong-trai',8,'', [20,77,262,275].map(v=>v/296));
  assert.equal(contacts.length,8);
  const project=(x,y)=>[.75*(x-y),.375*(x+y)];
  for(const surfaceGenerated of [false,true])for(const spriteFlip of [0,1]){
    const e={id:'surface-crop-5-5',t:'deco',x:5,y:5,sc:1.8,ox:.04,oy:.07,
      contactProjection:'iso',surfaceGenerated,spriteFlip,cropContacts:contacts,zb:[-.5,-.5,1,1]};
    const frame=placedPropFrame(e,project,1,'iso'),zones=decoZones([e]);
    assert.equal(zones.length,8);
    for(let i=0;i<zones.length;i++){
      const {x,y,w,h}=zones[i], [u,v]=contacts[i];
      const [sx,sy]=project(x+w/2,y+h/2);
      assert.ok(Math.abs(sx-(frame.x+(spriteFlip?1-u:u)*frame.size))<1e-9);
      assert.ok(Math.abs(sy-(frame.y+v*frame.size))<1e-9);
      assert.equal(zonesHit(zones,x+w/2,y+h/2,0),true);
    }
    assert.equal(zonesHit(zones,5,5,0),false);
    assert.deepEqual(decoZones([{...e,sceneLayer:1}]),[]);
  }
  const imported=cropContactFrame('Gói nông trại',0,'Isometric/cornDouble_S.png',[.1,.2,.8,.9]);
  assert.equal(imported.length,8);
});
