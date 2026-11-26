import test from 'node:test';
import assert from 'node:assert/strict';

const store=new Map();
test.beforeEach(()=>{store.clear();});
// src/util.js's idbGet/idbSet require a real IndexedDB; outlinePresets.js must accept
// injected get/set so this test runs under node:test without a browser. See Step 3.
import {listOutlinePresets,loadOutlinePreset,saveOutlinePreset,deleteOutlinePreset} from '../src/outlinePresets.js';
const io={get:async k=>store.get(k),set:async(k,v)=>{store.set(k,v);return true;}};

test('save creates a new id, list surfaces it without the data payload, load returns the full data',async()=>{
 const saved=await saveOutlinePreset(null,'Bộ A',{layers:{floor:{source:'x',assets:[]}}},io);
 assert.ok(saved.id);
 const list=await listOutlinePresets(io);
 assert.deepEqual(list.map(p=>({id:p.id,name:p.name})),[{id:saved.id,name:'Bộ A'}]);
 assert.deepEqual(await loadOutlinePreset(saved.id,io),{layers:{floor:{source:'x',assets:[]}}});
});
test('saving again with the same id overwrites instead of duplicating',async()=>{
 const first=await saveOutlinePreset(null,'Bộ A',{n:1},io);
 await saveOutlinePreset(first.id,'Bộ A sửa',{n:2},io);
 const list=await listOutlinePresets(io);
 assert.equal(list.length,1);
 assert.equal(list[0].name,'Bộ A sửa');
 assert.deepEqual(await loadOutlinePreset(first.id,io),{n:2});
});
test('delete removes the preset; loading a missing id returns null',async()=>{
 const saved=await saveOutlinePreset(null,'Bộ B',{n:1},io);
 await deleteOutlinePreset(saved.id,io);
 assert.deepEqual(await listOutlinePresets(io),[]);
 assert.equal(await loadOutlinePreset(saved.id,io),null);
});
