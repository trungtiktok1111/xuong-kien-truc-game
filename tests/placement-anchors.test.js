import test from 'node:test';
import assert from 'node:assert/strict';
import {placementAnchors,placementAnchorOffset,placedPropFrame} from '../src/proj.js';

const iso=(x,y)=>[24*(x-y),12*(x+y)];
const roof={x:4,y:7,sc:1.9,roofDirection:'E',roofBase:1,roofRise:.8};

test('nine roof anchors lie on the projected surface, including the corners and slope',()=>{
  for(const direction of ['E','W','N','S']){
    const frame=placedPropFrame({...roof,roofDirection:direction},iso,32,'iso');
    const p=placementAnchors(frame);
    assert.equal(p.length,9);
    assert.deepEqual(p[0].point,frame.roof[0]);
    for(let i=0;i<2;i++){
      const [a,b,c]=frame.roof.map(q=>q[i]);
      assert.ok(Math.abs(p[4].point[i]-(b+c)/2)<1e-9);
      assert.ok(Math.abs(p[8].point[i]-(b+c-a))<1e-9);
    }
  }
});

test('inverse aim offset puts the chosen anchor under the pointer after translating the part',()=>{
  const pointer=[130,170],probe=placedPropFrame({...roof,x:0,y:0},iso,32,'iso');
  for(const id of [0,4,8]){
    const [dx,dy]=placementAnchorOffset(probe,undefined,'roof',id);
    const [px,py]=[pointer[0]-dx,pointer[1]-dy];
    const x=(px/24+py/12)/2-1,y=(py/12-px/24)/2-1;
    const p=placementAnchors(placedPropFrame({...roof,x,y},iso,32,'iso'))[id].point;
    assert.ok(Math.hypot(p[0]-pointer[0],p[1]-pointer[1])<1e-9);
  }
});

test('sprite anchors use visible bounds and adapt to the object dimensions',()=>{
  const make=sc=>placedPropFrame({x:4,y:7,sc},iso,32,'iso');
  assert.deepEqual(placementAnchors(make(.5)).map(p=>p.id),[4]);
  assert.deepEqual(placementAnchors(make(2),[.45,.1,.55,.9]).map(p=>p.id),[1,4,7]);
  assert.equal(placementAnchors(make(2),[.1,.1,.9,.9]).length,9);
  assert.deepEqual(placementAnchors(make(2),undefined,'gate'),[{id:4,point:iso(5,8)}]);
});

test('roof thickness adds visible faces above the bearing without shifting the underside',()=>{
  const thin=placedPropFrame({...roof,roofThickness:.1},iso,32,'iso');
  const thick=placedPropFrame({...roof,roofThickness:.3},iso,32,'iso');
  assert.equal(thin.roofSides.length,2);
  assert.equal(placedPropFrame(roof,iso,32,'angle').roofSides.length,1);
  assert.equal(placedPropFrame(roof,iso,32,'top').roofSides,undefined);
  for(let i=0;i<3;i++){
    assert.equal(thin.roof[i][0],thick.roof[i][0]);
    assert.ok(Math.abs(thin.roof[i][1]+thin.roofDepth-thick.roof[i][1]-thick.roofDepth)<1e-9);
  }
  assert.ok(Math.abs(placementAnchors(thin)[4].point[1]-placementAnchors(thick)[4].point[1]-4.8)<1e-9);
});
