import test from 'node:test';
import assert from 'node:assert/strict';
import {REFERENCE_HEIGHT, guessTileWidth, anchorFactor, packScale} from '../src/outlineAnchors.js';

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
