import test from 'node:test';
import assert from 'node:assert/strict';
import {constructionContext,gateIssue,propIssue} from '../src/constructionRules2d.js';
import {gateLayout,gateWalls} from '../src/gate2d.js';
import {decoZones,zonesHit} from '../src/zones.js';
import {daXoayArchProfiles,propContact,resizeProp,turnProp} from '../src/placement2d.js';
import {ANG_R,placedPropFrame} from '../src/proj.js';

const arch=(x=8,y=8)=>({id:'gate',t:'deco',gateAssembly:true,x:x-1,y:y-1,sc:3.4,propProjection:'iso',
  ...propContact(daXoayArchProfiles(0),null,3.4,'iso')});
const map=()=>({w:16,h:16,layers:[Array(256).fill(1)],blk:Array(256).fill(0),ents:[],cfg:{}});

test('wall wings touch both posts, have their own collisions, and leave a walkable opening',()=>{
  const e=arch(),g=gateLayout(e),zones=decoZones([e]);
  assert.deepEqual(g.wings.map(([a])=>a),g.posts);
  assert.equal(zones.length,4);
  assert.ok(gateWalls(e,false).every(w=>w.height===g.height));
  assert.ok(g.wings.every(([,end])=>zonesHit(zones,...end,.28)));
  assert.ok(!zonesHit(zones,...g.center,.28));
  assert.equal(gateIssue(e,constructionContext(map())),'');
});

test('gate rules detect unsupported walls, blocked approaches, narrow openings and protected markers',()=>{
  const m=map(),e=arch(),g=gateLayout(e);
  assert.match(gateIssue(arch(.5,.5),constructionContext(m)),/nằm trên sàn/);
  const tiny=arch();resizeProp(tiny,.5);
  assert.match(gateIssue(tiny,constructionContext(m)),/quá hẹp/);
  m.cfg.zones=[{k:'ell',x:8.6,y:7.8,w:.4,h:.4}];
  assert.match(gateIssue(e,constructionContext(m)),/hai phía/);
  m.cfg.zones=[];
  const [x,y]=g.wings[0][1];
  m.ents=[{t:'start',x:x-.5,y:y-.5}];
  assert.match(gateIssue(e,constructionContext(m)),/xuất phát/);
  m.ents=[e];
  assert.equal(gateIssue(e,constructionContext(m)),'');
});

test('turning a gate moves the two wing colliders, and projection changes keep their feet attached',()=>{
  const e=arch(),before=gateLayout(e);
  turnProp(e);
  assert.equal(e.spriteFlip,1);
  assert.ok(gateLayout(e).posts.every(([x,y],i)=>x===before.posts[i][1]&&y===before.posts[i][0]));
  const project=(x,y)=>[1.5*x,1.5*ANG_R*y];
  const frame=placedPropFrame(e,project,1,'angle');
  const [a,b]=e.col,uv=[.75*(b.x-a.x-b.y+a.y),.375*(b.x-a.x+b.y-a.y)];
  const [px,py]=project(b.x-a.x,b.y-a.y),[sx,sy]=frame.matrix;
  assert.ok(Math.abs(uv[0]*sx-px)<1e-9&&Math.abs(uv[0]*sy+uv[1]-py)<1e-9);
});

test('an edge-on projection keeps two visible posts at the correct plan coordinates',()=>{
  const e=arch(),project=(x,y)=>[1.5*x,1.5*ANG_R*y];
  const edge=placedPropFrame(e,project,1,'angle').edge;
  assert.ok(edge?.height>0);
  assert.deepEqual(edge.feet,gateLayout(e).posts.map(p=>project(...p)).sort((a,b)=>a[1]-b[1]));
});

test('solid props preserve the way through an already assembled gate',()=>{
  const m=map();m.ents=[arch()];
  const prop={id:'p',t:'deco',buildChecks:true,x:7,y:7,col:[{k:'circle',x:0,y:0,r:.2}]};
  assert.match(propIssue(prop,constructionContext(m)),/chắn lối/);
  assert.match(propIssue({...prop,x:-1,y:-1},constructionContext(m)),/trên sàn/);
  assert.equal(propIssue({...prop,walk:true},constructionContext(m)),'');
});

import {builtWallFaces,mountGate,wallRuns} from '../src/wall2d.js';
import {wallIssue} from '../src/constructionRules2d.js';

const wall={id:'wall',t:'deco',placedProp:true,x:2,y:7,wallLine:{dx:10,dy:0,height:1.25}};

test('a wall blocks first, a mounted gate cuts only the opening, deletion closes the opening',()=>{
  const m=map(),candidate=arch(8,8.3);
  assert.equal(mountGate(candidate,[]),null);
  assert.equal(wallIssue(wall,constructionContext(m)),'');
  assert.match(wallIssue({...wall,x:-1},constructionContext(m)),/sàn đỡ/);
  assert.ok(zonesHit(decoZones([wall]),8,8,.28));
  const gate=mountGate(candidate,[wall]);
  assert.equal(gate.wallId,'wall');
  assert.equal(gate.y+1,8);
  m.ents=[wall];
  assert.equal(gateIssue(gate,constructionContext(m)),'');
  m.ents.push(gate);
  assert.equal(gateIssue(gate,constructionContext(m)),'');
  const runs=wallRuns(wall,m.ents);
  assert.equal(runs.length,2);
  assert.equal(runs[0][1][0],gate.x+1+Math.min(...gate.col.map(c=>c.x)));
  assert.equal(builtWallFaces(m.ents,false).length,builtWallFaces([wall],false).length-2);
  const colliders=decoZones(m.ents);
  assert.ok(!zonesHit(colliders,8,8,.28));
  assert.ok(zonesHit(colliders,5,8,.28));
  assert.ok(zonesHit(decoZones([wall]),8,8,.28));
  assert.match(gateIssue(gate,constructionContext(map())),/lệch khỏi tuyến/);
  assert.match(gateIssue({...gate,id:'another'},constructionContext(m)),/quá gần/);
  assert.equal(gateWalls(gate,false).length,0);
});

test('wall thickness is saved in footprint collisions and rejects a pinched gate',()=>{
 const m=map(),thick={...wall,wallLine:{...wall.wallLine,thickness:1.5}};
 assert.equal(decoZones([thick])[0].th,1.5);
 assert.ok(zonesHit(decoZones([thick]),7,8.6));
 assert.ok(!zonesHit(decoZones([wall]),7,8.6));
 m.ents=[thick];
 assert.match(gateIssue(mountGate(arch(),[thick]),constructionContext(m)),/thông thoáng/);
});
