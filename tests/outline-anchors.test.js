import test from 'node:test';
import assert from 'node:assert/strict';
import {REFERENCE_HEIGHT, guessTileWidth, anchorFactor, packScale, outlineObjectSize, scaleOutlineHouse} from '../src/outlineAnchors.js';

test('guessTileWidth mirrors the existing prop heuristic ratios',()=>{
 assert.equal(guessTileWidth(95,0),100);
 assert.equal(guessTileWidth(0,165),100);
});
test('anchorFactor is 1 when the measured art already matches the generic guess',()=>{
 // door art drawn at exactly REFERENCE_HEIGHT.door tiles tall, at the generic guess's implied tileWidth
 const h=165,w=95,tileWidth=guessTileWidth(w,h);
 const px=tileWidth*REFERENCE_HEIGHT.door;
 assert.ok(Math.abs(anchorFactor('door',w,px)-1)<1e-9);
});
test('packScale prefers door, then wall, then in-pack character, then manual, then none',()=>{
 const door={w:95,h:300},wall={w:95,h:400},character={w:95,h:220};
 assert.equal(packScale({door,wall,character}).via,'door');
 assert.equal(packScale({wall,character}).via,'wall');
 assert.equal(packScale({character}).via,'character');
 assert.equal(packScale({},2.5).via,'manual');
 assert.equal(packScale({},2.5).factor,2.5);
 assert.deepEqual(packScale({}),{factor:1,via:'none'});
});
test('packScale ignores a non-finite or non-positive manual override',()=>{
 assert.equal(packScale({},0).via,'none');
 assert.equal(packScale({},-1).via,'none');
 assert.equal(packScale({},NaN).via,'none');
 assert.equal(packScale({},undefined).via,'none');
});

// Review finding (Critical #1): sc = 1.5*side/tileWidth, so on-screen size is inversely
// proportional to tileWidth. An anchor measured taller than the generic per-object guess
// implies true pixels-per-tile T is bigger than the guess G, meaning objects drawn using
// G were too large — the correction must SHRINK them (factor = G/T < 1), not grow them.
test('anchorFactor shrinks art when the anchor measures taller than the generic guess implies',()=>{
 const w=95,h=300; // deliberately much taller than guessTileWidth(95,300) assumes for a door
 const g=guessTileWidth(w,h),t=h/REFERENCE_HEIGHT.door;
 assert.ok(t>g,'test setup should put the true tileWidth above the generic guess');
 const factor=anchorFactor('door',w,h);
 assert.ok(factor<1,'expected a shrink factor (G/T), not a growth factor (T/G)');
 assert.ok(Math.abs(factor-g/t)<1e-9);
});

// Review finding (Critical #2a): the design doc says manual override is also for "người
// dùng thấy máy đoán sai" (the user feels the automatic guess is wrong) — it must be able
// to override an anchor the app DID find, not just fill in when none was found.
test('packScale lets a valid manual override win over an automatically detected anchor',()=>{
 const door={w:95,h:300};
 assert.equal(packScale({door},2.5).via,'manual');
 assert.equal(packScale({door},2.5).factor,2.5);
 assert.equal(packScale({door}).via,'door'); // no override given: automatic still applies
});

test('the same kind of prop at different raster resolutions fits the same world height',()=>{
 const small=outlineObjectSize({w:20,h:35},'chair','props');
 const large=outlineObjectSize({w:80,h:140},'chair','props');
 assert.equal(small.bodyHeight,large.bodyHeight);
 assert.equal(small.radius,large.radius);
 assert.ok(small.bodyHeight<outlineObjectSize({w:80,h:140},'hero','character').bodyHeight);
 assert.ok(outlineObjectSize({w:80,h:140},'oak-tree','props').bodyHeight>1.2);
 assert.equal(outlineObjectSize({w:80,h:140},'hero','character',null,null,1.8).bodyHeight,1.2);
});
test('a house scale changes the graphic and wall segments with the footprint',()=>{
 const house={w:2,h:3,ents:[{x:0,y:0,sc:1,col:[{k:'seg',a:[0,0],b:[1,1],th:.1}]}]};
 const scaled=scaleOutlineHouse(house,2);
 assert.deepEqual([scaled.w,scaled.h,scaled.ents[0].x,scaled.ents[0].sc],[4,6,1,2]);
 assert.deepEqual(scaled.ents[0].col[0].b,[2,2]);
});


test('a prop follows its pack door anchor using the same projected vertical unit',()=>{
 const scale=packScale({door:{w:120,h:147}});
 const item=outlineObjectSize({w:50,h:85},'obj','props',scale);
 assert.equal(item.tileWidth,200);
 assert.equal(item.bodyHeight,.85);
});
