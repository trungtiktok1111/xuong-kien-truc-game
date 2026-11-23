/* Tải bộ nền isometric theo khu (nen/index.json + nen/<id>.json): atlas ô 192x192, đỉnh ô ở y=cy */
let IDX=null;const CACHE={};
export async function nenIndex(){if(IDX)return IDX;try{const r=await fetch('nen/index.json?v=1');IDX=await r.json();}catch(e){IDX=[];}return IDX;}
export async function nenPack(id){if(CACHE[id])return CACHE[id];const r=await fetch('nen/'+id+'.json?v=1');if(!r.ok)throw new Error('Không tải được bộ nền "'+id+'"');return CACHE[id]=await r.json();}
export const nenTag=n=>/^(kenh|muong|nuoc|vuc|bo-00|mep-vuc-00|tiep-da-nuoc|lua-|sau-gat)/.test(n)?{type:'Nước',layer:0,fn:'Chặn đường'}:{type:'Đường',layer:0,fn:'Đi được'};
