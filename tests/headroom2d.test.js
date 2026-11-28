import {miniatureHouseHeadroom,FARM_HOUSE_SCALE} from '../src/miniatureHouse.js';
import {scaleOutlineHouse} from '../src/outlineAnchors.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {actorFootprint,actorHeights,bodyFootprint,bodyHeight,clearanceBelow,fitsUnderRoof,roofPlane} from '../src/headroom2d.js';
import {headroomIssue} from '../src/constructionRules2d.js';

const roof={id:'roof',bounds:[4,4,8,8],base:.95,rise:0,direction:'E'};
const player=actorFootprint(6,6,.28);
const {standing,crouching}=actorHeights();

test('a low roof permits crouching but prevents standing, and a lower ceiling blocks both',()=>{
  assert.equal(fitsUnderRoof([roof],player,standing),false);
  assert.equal(fitsUnderRoof([roof],player,crouching),true);
  assert.equal(fitsUnderRoof([{...roof,base:.65}],player,crouching),false);
  assert.equal(fitsUnderRoof([roof],actorFootprint(3,6,.28),standing),true);
});

test('a sloped roof uses the lowest point over the overlapping footprint in every direction',()=>{
  const inset=[[5,7,6,7,'E',.95],[6,6,7,7,'W',.95],[5,5,6,6,'N',1.25],[5,6,6,7,'S',1.25]];
  for(const [l,t,r,b,direction,expected] of inset){
    const sloped={...roof,base:.65,rise:1.2,direction};
    assert.ok(Math.abs(clearanceBelow(sloped,[l,t,r,b])-expected)<1e-6);
  }
  const east=roofPlane({x:5,y:5,sc:3.8,roofDirection:'E'},{base:.65,rise:1.2});
  assert.equal(fitsUnderRoof([east],actorFootprint(6,6,.28),1.2),false);
  assert.equal(fitsUnderRoof([east],actorFootprint(7,6,.28),1.2),true);
  assert.equal(fitsUnderRoof([east,{...roof,base:.8}],actorFootprint(7,6,.28),1.2),false);
});

test('closed chest and lid are tested separately; other tall props and walls use the same ceiling',()=>{
  const chest={t:'chest',x:5,y:5,lidRise:.5};
  assert.equal(headroomIssue(chest,[roof],{}),'');
  assert.equal(fitsUnderRoof([roof],bodyFootprint(chest),bodyHeight(chest,{},true)),false);
  assert.ok(headroomIssue({...chest,bodyHeight:1},[roof],{}));
  assert.ok(headroomIssue({t:'deco',x:5,y:5,placedProp:true,bodyHeight:1.4},[roof],{}));
  assert.ok(headroomIssue({t:'deco',x:3,y:5,wallLine:{dx:4,dy:0,height:1.2}},[roof],{}));
  assert.equal(headroomIssue({t:'deco',x:3,y:5,wallLine:{dx:4,dy:0,height:.95}},[roof],{}),'');
});

test('miniature houses enforce door height and honor the scaled floor and roof contact',()=>{
 const door={id:'a',name:'woodWallDoorway W',x:1.5,y:2.5,housePart:{door:true,side:1,scale:1}};
 const roof={id:'b',name:'roof S',x:1.5,y:2.5,housePart:{roof:true,scale:1}};
 const legacy=miniatureHouseHeadroom([{...door,housePart:undefined,surfaceGenerated:true},roof]);
 assert.ok(!fitsUnderRoof(legacy,actorFootprint(3,3.5,.28),1.2));
 assert.ok(fitsUnderRoof(legacy,actorFootprint(3,3.5,.28),.68));
 const scaled=scaleOutlineHouse({w:1,h:1,ents:[door,roof]},FARM_HOUSE_SCALE);
 const planes=miniatureHouseHeadroom(scaled.ents);
 assert.ok(fitsUnderRoof(planes,actorFootprint(3*FARM_HOUSE_SCALE,3.5*FARM_HOUSE_SCALE,.28),1.2));
 assert.ok(!fitsUnderRoof(planes,actorFootprint(2.5*FARM_HOUSE_SCALE,3.5*FARM_HOUSE_SCALE,.28),1.8));
});
