import test from 'node:test';
import assert from 'node:assert/strict';
import {farmBarn,referencePlan,stockScenes} from '../src/stockScenes.js';

test('restoring coordinate data and reconstructing a preview are distinct actions',()=>{
  assert.equal(new Set(stockScenes.map(scene=>scene.id)).size,stockScenes.length);
  for(const scene of stockScenes){
    const p=referencePlan(scene.id);
    if(scene.kind==='original'){assert.equal(p,undefined);continue;}
    assert.equal(p.ground.length,p.w*p.h);
    assert.ok(p.ground.every(tile=>tile?.asset||typeof tile==='string'));
    assert.ok(p.parts.every(part=>part.x>=0&&part.x<p.w&&part.y>=0&&part.y<p.h&&part.source<scene.files.length));
    for(const [x,y] of [p.start,p.goal])assert.ok(!p.blocks.some(([a,b,w,h])=>x>=a&&x<a+w&&y>=b&&y<b+h));
  }
});

test('farm barns join the ridge along the row and alternate slopes on wide roofs',()=>{
  assert.ok(farmBarn(0,0,1,4).filter(p=>p.roof).every(p=>p.dir==='N'));
  const slopes=farmBarn(0,0,2,4).filter(p=>p.asset==='roof');
  assert.equal(slopes.length,8);
  assert.ok(slopes.every(p=>p.dir===(p.x===0?'S':'N')));
});
