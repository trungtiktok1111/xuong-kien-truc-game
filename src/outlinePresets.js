import {idbGet,idbSet} from './util.js';

const KEY='outline-material-presets';
const defaultIo={get:idbGet,set:(k,v)=>idbSet(k,v)};

async function readAll(io){return (await io.get(KEY))||[];}

export async function listOutlinePresets(io=defaultIo){
 return (await readAll(io)).map(({id,name,savedAt})=>({id,name,savedAt}));
}

export async function loadOutlinePreset(id,io=defaultIo){
 return (await readAll(io)).find(p=>p.id===id)?.data??null;
}

export async function saveOutlinePreset(id,name,data,io=defaultIo){
 const list=await readAll(io);
 const entry={id:id??crypto.randomUUID(),name,savedAt:Date.now(),data};
 const at=list.findIndex(p=>p.id===entry.id);
 if(at>=0)list[at]=entry;else list.push(entry);
 if(!await io.set(KEY,list))throw Error('Không ghi được bộ chọn vào bộ nhớ trình duyệt.');
 return {id:entry.id,name:entry.name,savedAt:entry.savedAt};
}

export async function deleteOutlinePreset(id,io=defaultIo){
 if(!await io.set(KEY,(await readAll(io)).filter(p=>p.id!==id)))
  throw Error('Không xoá được bộ chọn khỏi bộ nhớ trình duyệt.');
}
