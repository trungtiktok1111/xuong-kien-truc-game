/* Quy tắc vật lý cho mái: mái không được lơ lửng.
   Một ô mái (lớp 4 "Mái / cửa") đứng vững khi
   - nằm sát điểm tựa (tường, cột, nhà): vươn ra tối đa `overhang` ô, hoặc
   - bắc ngang giữa hai điểm tựa đối diện (trái–phải hoặc trên–dưới) cách nhau không quá `span` ô.
   Tắt cho cả bản đồ bằng cfg.roofPhysics=false; đổi nhịp bằng cfg.roofSpan / cfg.roofOverhang. */
export const ROOF_SPAN=12,ROOF_OVERHANG=2;
const ROOF_NAME=/roof|mái|mai[-_ ]|lop[-_ ]che|mai[-_ ]che|canopy|tan[-_ ]che/i;

export const roofRules=cfg=>({
  on:cfg?.roofPhysics!==false,
  span:Math.max(1,Number(cfg?.roofSpan)||ROOF_SPAN),
  overhang:Math.max(0,Number.isFinite(Number(cfg?.roofOverhang))&&cfg?.roofOverhang!=null?Number(cfg.roofOverhang):ROOF_OVERHANG)
});

export const isRoofEnt=e=>!!e&&e.t==='deco'&&!e.flat&&!!(e.cv||ROOF_NAME.test(e.name||''));

/* ô tựa: ô lớp 3 là tường/nhà (isSupportTile) + đối tượng tường, cột, nhà (isSupportEnt) */
export function supportGrid({w,h,layers,ents=[],isSupportTile=()=>false,isSupportEnt=()=>false,skipEnt=null}){
  const g=new Uint8Array(w*h),mark=(x,y)=>{x=Math.floor(x);y=Math.floor(y);if(x>=0&&y>=0&&x<w&&y<h)g[y*w+x]=1;};
  const L=layers?.[2];
  if(L)for(let i=0;i<w*h;i++)if(L[i]&&isSupportTile(L[i]))g[i]=1;
  for(const e of ents){
    if(e===skipEnt||isRoofEnt(e))continue;
    if(e.wallLine){
      const ax=e.x+1,ay=e.y+1,{dx,dy}=e.wallLine,n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.25));
      for(let i=0;i<=n;i++)mark(ax+dx*i/n,ay+dy*i/n);
      continue;
    }
    if(e.t!=='deco'||e.flat||e.walk)continue;
    if(!e.gateAssembly&&!isSupportEnt(e))continue;
    const z=e.zb||[-(e.fx||1),-(e.fy||1),e.fx||1,e.fy||1],x0=e.x+1+z[0],y0=e.y+1+z[1];
    for(let y=Math.floor(y0);y<Math.ceil(y0+z[3]);y++)for(let x=Math.floor(x0);x<Math.ceil(x0+z[2]);x++)mark(x,y);
  }
  return g;
}

export function cellSupported(g,w,h,x,y,{span,overhang}){
  const has=(a,b)=>a>=0&&b>=0&&a<w&&b<h&&g[b*w+a]===1;
  for(let dy=-overhang;dy<=overhang;dy++)for(let dx=-overhang;dx<=overhang;dx++)if(has(x+dx,y+dy))return true;
  const reach=(sx,sy)=>{for(let d=1;d<=span;d++)if(has(x+sx*d,y+sy*d))return true;return false;};
  return (reach(-1,0)&&reach(1,0))||(reach(0,-1)&&reach(0,1));
}

/* các ô mái đang lơ lửng (chỉ xét ô trong `only` nếu có) */
export function floatingRoofCells(map,ctx,only=null){
  const rules=roofRules(map.cfg);if(!rules.on)return [];
  const roof=map.layers?.[3];if(!roof)return [];
  const g=supportGrid({w:map.w,h:map.h,layers:map.layers,ents:map.ents,...ctx});
  const out=[],test=i=>{if(roof[i]&&!cellSupported(g,map.w,map.h,i%map.w,(i/map.w)|0,rules))out.push(i);};
  if(only)for(const i of only)test(i);else for(let i=0;i<roof.length;i++)test(i);
  return out;
}

/* mái dạng vật thể (deco): mọi ô của khung chân phải có điểm tựa */
export function floatingRoofEnt(map,e,ctx){
  const rules=roofRules(map.cfg);if(!rules.on||!isRoofEnt(e))return false;
  const g=supportGrid({w:map.w,h:map.h,layers:map.layers,ents:map.ents,skipEnt:e,...ctx});
  const z=e.zb||[-(e.fx||1),-(e.fy||1),e.fx||1,e.fy||1],x0=e.x+1+z[0],y0=e.y+1+z[1];
  for(let y=Math.floor(y0);y<Math.ceil(y0+z[3]);y++)for(let x=Math.floor(x0);x<Math.ceil(x0+z[2]);x++)
    if(!cellSupported(g,map.w,map.h,x,y,rules))return true;
  return false;
}
