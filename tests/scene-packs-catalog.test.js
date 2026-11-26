import test from 'node:test';
import assert from 'node:assert/strict';
import {characterName} from '../src/scenePacks.js';

test('characterName matches the folder and name patterns scenePacks.js currently ignores for characters',()=>{
 assert.ok(characterName.test('isometric/characters/hero_e.png'));
 assert.ok(characterName.test('character/npc_guard.png'));
 assert.ok(characterName.test('sprites/nhan-vat-nu.png'));
 assert.ok(!characterName.test('isometric/barrel_e.png'));
});
