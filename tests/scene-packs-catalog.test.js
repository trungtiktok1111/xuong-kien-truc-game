import test from 'node:test';
import assert from 'node:assert/strict';
import {characterName, pickAnchorArt} from '../src/scenePacks.js';

test('characterName matches the folder and name patterns scenePacks.js currently ignores for characters',()=>{
 assert.ok(characterName.test('isometric/characters/hero_e.png'));
 assert.ok(characterName.test('character/npc_guard.png'));
 assert.ok(characterName.test('sprites/nhan-vat-nu.png'));
 assert.ok(!characterName.test('isometric/barrel_e.png'));
});

test('pickAnchorArt finds a door-like path before a wall-like path',()=>{
 const paths=['isometric/stoneWall_e.png','isometric/stoneWallDoorway_e.png','isometric/barrel_e.png'];
 assert.equal(pickAnchorArt(paths,'door'),'isometric/stoneWallDoorway_e.png');
 assert.equal(pickAnchorArt(paths.slice(0,1).concat(paths[2]),'wall'),'isometric/stoneWall_e.png');
 // pickAnchorArt is a plain search, not aware of 'door' taking priority at the call site —
 // with kind 'wall' it still finds the first wall-like path even though a door-like one
 // is also present in the array (see Task 3 ruling in the ledger).
 assert.equal(pickAnchorArt(paths,'wall'),'isometric/stoneWall_e.png');
});
