import {inSurfaceShape,surfaceLevelById,surfacePieceById} from './surfaceLibrary.js';

// Surface modules compose over a full rectangular grid, displayed as a diamond in isometric view.
export const surfaceTypes=[
 ['plain','Đồng bằng', '#879b60'],['meadow','Đồng cỏ / bãi trống','#a0ad6b'],
 ['forest','Rừng','#476b46'],['mountain','Núi đá','#777c70'],['farm','Ruộng','#a19058'],
 ['plaza','Quảng trường / sân','#b4a694'],['sand','Bãi cát','#c6ad78'],['wetland','Đất ngập nước','#768f65'],
 ['main','Đường lớn','#aaa193'],['branch','Đường nhánh','#a59376'],['lane','Đường nhỏ','#ac9870'],['trail','Đường mòn','#a18859'],
 ['sea','Biển','#286780'],['river','Sông','#337d95'],['canal','Kênh / rạch','#448b9a'],
 ['stream','Suối','#5a9ca3'],['lake','Hồ','#367e91'],['pond','Ao','#537f85'],['bridge','Cầu','#927154'],
 ['lot','Nền công trình','#94877a']
];
export const surfaceKinds=Object.fromEntries(surfaceTypes.map(([id],i)=>[id,i]));
const K=surfaceKinds;
export const surfaceProfiles={
 blank:{name:'Nền trống · đi được toàn khung',waters:[],settle:false,blank:true},
 plain:{name:'Đồng bằng và rừng núi',waters:['river','lake','stream'],settle:false},
 city:{name:'Thành phố ven sông',waters:['river','canal'],settle:true},
 village:{name:'Thôn trang',waters:['stream','pond'],settle:true},
 temple:{name:'Tông môn trên núi',waters:['stream','lake'],settle:true},
 coast:{name:'Vùng ven biển',waters:['sea','river'],settle:true}
};
export const surfaceWater=['sea','river','canal','stream','lake','pond'];
export const diamondOutline=(w,h)=>[[[0,0],[w,0],[w,h],[0,h]]];
export function newSurface(profile='plain'){
 const {waters,settle,blank}=surfaceProfiles[profile];
 return {profile,water:[...waters],roads:!blank,land:!blank,buildings:settle,seed:1,patches:[]};
}
export function surfaceFromLevel(level){
 return {...newSurface(level.profile),layout:level.id,water:[...new Set(level.shapes.map(shape=>shape.kind).filter(kind=>surfaceWater.includes(kind)))],buildings:level.lots.length>0};
}
export function surfaceHash(x,y,z){
 let n=Math.imul(x+19,374761393)^Math.imul(y+31,668265263)^Math.imul(z+1,1274126177);
 n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;
}
const clamp=(n,a,b)=>Math.max(a,Math.min(n,b));
const isWet=id=>id>=K.sea&&id<=K.pond;

// Each cell retains the base ground, a water layer, and a circulation layer until assembly.
export function planSurface(w,h,spec,style={}){
 const n=w*h,land=new Uint8Array(n),water=new Uint8Array(n).fill(255),road=new Uint8Array(n).fill(255);
 const {seed=1,profile='plain',patches=[]}=spec,layout=surfaceLevelById.get(spec.layout);
 const waters=new Set(spec.water||[]),city=profile==='city',temple=profile==='temple',village=profile==='village',coast=profile==='coast';
 const phase=surfaceHash(0,0,seed)*6.28;
 const detail=style.detail||1,baseW=w/detail,baseH=h/detail;
 const junction=Math.round(baseH*.51);
 const cell=([x,y])=>[clamp(Math.floor(x*w/100),0,w-1),clamp(Math.floor(y*h/100),0,h-1)];
 const start=layout?cell(layout.start):[Math.max(1,Math.floor(w*.12)),clamp(junction,1,h-2)];
 const goal=layout?cell(layout.goal):[clamp(Math.floor(w*(waters.has('sea')?.68:.87)),1,w-2),start[1]];
 const houseLots=[];
 const delta=Math.min(baseW,baseH);
 if(!layout)for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x,u=(x+.5)/w,v=(y+.5)/h,gx=(x+.5)/detail-.5,gy=(y+.5)/detail-.5;
  const wave=Math.sin(v*9+phase)*.037;
  const shore=.81+wave*.58+Math.sin(v*5+phase)*.04;
  if(spec.land){
   const forest=(u-.21)**2/.079+(v-.22)**2/.08;
   const rock=(u-(temple?.30:.17))**2/(temple?.055:.026)+(v-.19)**2/.036;
   const terrainNoise=.17*Math.sin(gx*.47+gy*.24)*Math.cos(gy*.43-gx*.19);
   if(forest+terrainNoise<1)land[i]=K.forest;
   if(rock+terrainNoise<.78)land[i]=K.mountain;
   if(u<.34&&v>.58&&(village||profile==='plain'))land[i]=K.farm;
   if((u-.48)**2/.018+(v-.7)**2/.036+terrainNoise<1)land[i]=K.meadow;
   if((city||temple||village)&&Math.abs(u-(temple?.37:.30))<(city?.24:.12)&&Math.abs(v-.53)<(city?.21:.13))land[i]=K.plaza;
   if((coast||waters.has('sea'))&&u>shore-.075)land[i]=K.sand;
  }
  if(waters.has('sea')&&u>shore)water[i]=K.sea;
  const trunk=(waters.has('sea')?.60:.61)+wave;
  if(water[i]===255&&waters.has('river')&&Math.abs(u-trunk)*baseW<Math.max(1.35,delta*.042))water[i]=K.river;
  if(water[i]===255&&waters.has('canal')&&u>.17&&u<trunk&&Math.abs(v-.71)*baseH<Math.max(.73,delta*.014))water[i]=K.canal;
  if(water[i]===255&&waters.has('stream')&&v<.76&&Math.abs(u-(.49+Math.sin(v*8+phase)*.052))*baseW<Math.max(.65,delta*.015))water[i]=K.stream;
  if(water[i]===255&&waters.has('lake')&&((u-.72)/.113)**2+((v-.23)/.115)**2<1)water[i]=K.lake;
  if(water[i]===255&&waters.has('pond')&&((u-.24)/.075)**2+((v-.76)/.085)**2<1)water[i]=K.pond;
  if(spec.roads){
   if(Math.abs(gy-junction)<Math.floor(delta*.023)+.5&&(!waters.has('sea')||u<shore-.02))road[i]=K.main;
   else if(((Math.abs(gx-Math.floor(baseW*.31))<.5||Math.abs(gx-Math.floor(baseW*.72))<.5)&&v>.29&&v<.87)||
     (city&&Math.abs(gy-Math.floor(baseH*.34))<Math.floor(delta*.012)+.5&&u>.12&&u<.77))road[i]=K.branch;
   else if((Math.abs(gy-Math.floor(baseH*.65))<Math.floor(delta*.009)+.5&&u>.12&&u<.44)||
     (Math.abs(gx-Math.floor(baseW*.40))<.5&&v>.44&&v<.69))road[i]=K.lane;
   else if(Math.abs(gx-Math.floor(baseW*(.135+.035*Math.sin(gy*.20))))<.5&&v>.12&&v<.54)road[i]=K.trail;
  }
 }
 function paint(kind,i,overwrite){
  const type=K[kind];
  if(isWet(type)){water[i]=type;if(overwrite)road[i]=255;}
  else if(type===K.bridge||type>=K.main&&type<=K.trail)road[i]=type;
  else{land[i]=type;if(overwrite||type===K.plain||type===K.meadow){water[i]=255;road[i]=255;}}
 }
 function stamp(shapes,bounds,turn=0,overwrite=true){
  const [a,b,c,d]=bounds;
  if(c<=a||d<=b)return;
  for(let y=clamp(Math.floor(b),0,h);y<clamp(Math.ceil(d),0,h);y++)for(let x=clamp(Math.floor(a),0,w);x<clamp(Math.ceil(c),0,w);x++){
   const u=(x+.5-a)*100/(c-a),v=(y+.5-b)*100/(d-b);
   if(u<0||v<0||u>=100||v>=100)continue;
   const px=turn===1?v:turn===2?100-u:turn===3?100-v:u;
   const py=turn===1?100-u:turn===2?100-v:turn===3?u:v;
   for(const shape of shapes)if(inSurfaceShape(shape,px,py))paint(shape.kind,y*w+x,overwrite);
  }
 }
 if(layout){
  const shapes=layout.shapes.filter(({kind})=>K[kind]>=K.main&&K[kind]<=K.trail?spec.roads:isWet(K[kind])?waters.has(kind):spec.land);
  stamp(shapes,[0,0,w,h],0,false);
 }
 for(const patch of patches){
  const piece=surfacePieceById.get(patch.piece);
  if(piece)stamp(piece.shapes,patch.bounds,patch.turn);
  else if(K[patch.kind]!==undefined)stamp([{kind:patch.kind,box:[0,0,100,100]}],patch.bounds);
 }
 if(spec.buildings&&w>=24&&h>=20){
  const anchors=layout?layout.lots.map(([x,y])=>[x/100,y/100]):city?[[.20,.39],[.34,.39],[.20,.58],[.34,.58],[.74,.65]]:temple?[[.29,.40],[.36,.40],[.31,.60]]:coast?[[.20,.35],[.33,.61],[.68,.37]]:[[.22,.37],[.36,.38],[.34,.58]];
  for(const [u,v] of anchors){
   const x=Math.floor(u*w),y=Math.floor(v*h),width=2,height=3;
   if(x+width+1>=w||y+height+1>=h)continue;
   const cells=Array.from({length:width*height},(_,j)=>(y+Math.floor(j/width))*w+x+j%width);
   if(cells.some(i=>water[i]!==255||road[i]!==255||land[i]===K.mountain)||houseLots.some(l=>Math.abs(x-l.x)<4&&Math.abs(y-l.y)<5))continue;
   for(const i of cells)land[i]=K.lot;
   houseLots.push({x,y});
  }
 }
 const tiles=new Uint8Array(n),blocked=new Uint8Array(n),trees=[];
 for(let i=0;i<n;i++){
  const x=i%w,y=Math.floor(i/w),wet=water[i],route=road[i],base=land[i];
  if(route===K.bridge)tiles[i]=wet===255?K.branch:K.bridge;
  else if(wet!==255)tiles[i]=route!==255&&wet!==K.sea?K.bridge:wet;
  else tiles[i]=route!==255?route:base;
  blocked[i]=Number(isWet(tiles[i])||tiles[i]===K.mountain);
  if(route!==255||wet!==255)continue;
  if(style.detail)continue;
  const shade=surfaceHash(x,y,seed);
  if(base===K.forest&&x%3===0&&y%3===0&&(layout||shade>.23))trees.push({x,y,kind:'tree',shade});
  else if(base===K.mountain&&x%4===0&&y%4===0&&(layout||shade>.32))trees.push({x,y,kind:'rock',shade});
  else if(base===K.farm&&x%5===0&&y%4===0&&(layout||shade>.4))trees.push({x,y,kind:'crop',shade});
 }
 // Mark the start and goal on actual available land. Validate connectivity again after scenery is installed.
 const plan={tiles,blocked,trees,houseLots,start,goal};
 if(style.geometry){
  const scale=Math.max(1,Math.min(6,Math.floor(Math.sqrt(350000/(w*h)))));
  const finePatches=patches.map(p=>({...p,bounds:p.bounds.map(n=>n*scale)}));
  const fine=scale>1?
   planSurface(w*scale,h*scale,{...spec,patches:finePatches,buildings:false},{detail:scale}):null;
  if(fine){
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const kind=tiles[y*w+x];
    // The visual deck uses the full walkable bridge cells. Lots remain aligned with structures.
    if(kind!==K.bridge&&kind!==K.lot)continue;
    for(let row=0;row<scale;row++){
     const i=(y*scale+row)*w*scale+x*scale;
     fine.tiles.fill(kind,i,i+scale);
     fine.blocked.fill(0,i,i+scale);
    }
   }
  }
  plan.detail=fine?{w:w*scale,h:h*scale,scale,tiles:fine.tiles,blocked:fine.blocked}:{w,h,scale:1,tiles,blocked};
 }
 return plan;
}

const detailedPlans=new WeakMap();
export function detailedSurface(w,h,spec){
 const old=detailedPlans.get(spec);
 if(old?.w===w&&old?.h===h)return old.plan;
 const plan=planSurface(w,h,spec,{geometry:true});
 detailedPlans.set(spec,{w,h,plan});
 return plan;
}

export function surfaceReachable(w,h,blocked,start){
 const [x,y]=start;
 if(x<0||y<0||x>=w||y>=h||blocked[y*w+x])return [];
 const n=w*h,seen=new Uint8Array(n),q=new Int32Array(n);
 let tail=0;
 const put=i=>{if(!seen[i]&&!blocked[i]){seen[i]=1;q[tail++]=i;}};
 put(y*w+x);
 for(let head=0;head<tail;head++){
  const i=q[head],a=i%w;
  if(a>0)put(i-1);
  if(a+1<w)put(i+1);
  if(i>=w)put(i-w);
  if(i<n-w)put(i+w);
 }
 return Array.from(q.subarray(0,tail),i=>({x:i%w,y:Math.floor(i/w)}));
}
