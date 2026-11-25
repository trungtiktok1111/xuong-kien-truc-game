/* Tải bộ nền isometric theo khu (nen/index.json + nen/<id>.json): atlas ô 192x192, đỉnh ô ở y=cy */
let IDX=null;const CACHE={};const CUSN={},CUSV={};
export async function nenIndex(){if(!IDX){try{const r=await fetch('nen/index.json?v=1');IDX=await r.json();}catch(e){IDX=[];}}return IDX.filter(o=>!CUSN[o.id]).concat(Object.values(CUSN).map(c=>c.entry));}
export async function nenPack(id){if(CUSN[id])return CUSN[id].pk;if(CACHE[id])return CACHE[id];const r=await fetch('nen/'+id+'.json?v=1');if(!r.ok)throw new Error('Không tải được bộ nền "'+id+'"');return CACHE[id]=await r.json();}
export const nenTag=n=>/^(kenh|muong|nuoc|vuc|bo-00|mep-vuc-00|tiep-da-nuoc|lua-|sau-gat)/.test(n)?{type:'Nước',layer:0,fn:'Chặn đường'}:{type:'Đường',layer:0,fn:'Đi được'};

/* Bộ vật thể theo khu (vat/index.json + vat/<id>.json): atlas ô vuông T, điểm neo = giữa đáy ô */
let VIDX=null;const VC={};
export async function vatIndex(){if(!VIDX){try{const r=await fetch('vat/index.json?v=1');VIDX=await r.json();}catch(e){VIDX=[];}}return VIDX.filter(o=>!CUSV[o.id]).concat(Object.values(CUSV).map(c=>c.entry));}
export async function vatPack(id){if(CUSV[id])return CUSV[id].pk;if(VC[id])return VC[id];const r=await fetch('vat/'+id+'.json?v=1');if(!r.ok)throw new Error('Không tải được bộ vật thể "'+id+'"');return VC[id]=await r.json();}

/* Gói người dùng nạp từ zip (xuong-pack-1): đăng ký vào bộ nhớ để mọi nơi gọi nenPack/vatPack đều thấy */
export function registerPack(res){
  const m=res.vat;delete CUSN[m.id];if(res.nen)CUSN[res.nen.id]={pk:res.nen,entry:{id:res.nen.id,name:res.nen.name+' (gói nạp)',desc:res.nen.desc,n:res.nGround,kb:Math.round(res.nen.atlas.length*.75/1024),thumb:res.thumb||'',custom:1}};
  CUSV[m.id]={pk:m,entry:{id:m.id,name:m.name+' (gói nạp)',desc:m.desc,n:m.items.length,kb:Math.round(m.atlas.length*.75/1024),custom:1,roles:[...new Set(m.items.map(i=>i.r).filter(Boolean))],profiles:res.profiles||m.profiles||{}}};}
export function unregisterPack(id){delete CUSN[id];delete CUSV[id];}
export const customPackIds=()=>Object.keys(CUSV);
export function customPackRecords(){
 return Object.values(CUSV).map(({pk:vat})=>({id:vat.id,vat,nen:CUSN[vat.id]?.pk||null}));
}
export function packRoles(id){const v=CUSV[id]?CUSV[id].pk:VC[id];return v?[...new Set(v.items.map(i=>i.r).filter(Boolean))]:[];}
