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
 plain:{name:'Đồng bằng và rừng núi',waters:['river','lake','stream'],settle:false},
 city:{name:'Thành phố ven sông',waters:['river','canal'],settle:true},
 village:{name:'Thôn trang',waters:['stream','pond'],settle:true},
 temple:{name:'Tông môn trên núi',waters:['stream','lake'],settle:true},
 coast:{name:'Vùng ven biển',waters:['sea','river'],settle:true}
};
export const surfaceWater=['sea','river','canal','stream','lake','pond'];
export const diamondOutline=(w,h)=>[[[0,0],[w,0],[w,h],[0,h]]];
export function newSurface(profile='plain'){
 return {profile,water:[...surfaceProfiles[profile].waters],roads:true,land:true,buildings:surfaceProfiles[profile].settle,seed:1,patches:[]};
}
export function surfaceHash(x,y,z){
 let n=Math.imul(x+19,374761393)^Math.imul(y+31,668265263)^Math.imul(z+1,1274126177);
 n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;
}
const clamp=(n,a,b)=>Math.max(a,Math.min(n,b));
const isWet=id=>id>=K.sea&&id<=K.pond;

// Each cell retains the base ground, a water layer, and a circulation layer until assembly.
export function planSurface(w,h,spec){
 const n=w*h,land=new Uint8Array(n),water=new Uint8Array(n).fill(255),road=new Uint8Array(n).fill(255);
 const {seed=1,profile='plain',patches=[]}=spec;
 const waters=new Set(spec.water||[]),city=profile==='city',temple=profile==='temple',village=profile==='village',coast=profile==='coast';
 const phase=surfaceHash(0,0,seed)*6.28;
 const junction=Math.round(h*.51);
 const start=[Math.max(1,Math.floor(w*.12)),clamp(junction,1,h-2)];
 const goal=[clamp(Math.floor(w*(waters.has('sea')?.68:.87)),1,w-2),start[1]];
 const houseLots=[];
 const delta=Math.min(w,h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x,u=(x+.5)/w,v=(y+.5)/h;
  const wave=Math.sin(v*9+phase)*.037;
  const shore=.81+wave*.58+Math.sin(v*5+phase)*.04;
  if(spec.land){
   const forest=(u-.21)**2/.079+(v-.22)**2/.08;
   const rock=(u-(temple?.30:.17))**2/(temple?.055:.026)+(v-.19)**2/.036;
   const terrainNoise=.17*Math.sin(x*.47+y*.24)*Math.cos(y*.43-x*.19);
   if(forest+terrainNoise<1)land[i]=K.forest;
   if(rock+terrainNoise<.78)land[i]=K.mountain;
   if(u<.34&&v>.58&&(village||profile==='plain'))land[i]=K.farm;
   if((u-.48)**2/.018+(v-.7)**2/.036+terrainNoise<1)land[i]=K.meadow;
   if((city||temple||village)&&Math.abs(u-(temple?.37:.30))<(city?.24:.12)&&Math.abs(v-.53)<(city?.21:.13))land[i]=K.plaza;
   if((coast||waters.has('sea'))&&u>shore-.075)land[i]=K.sand;
  }
  if(waters.has('sea')&&u>shore)water[i]=K.sea;
  const trunk=(waters.has('sea')?.60:.61)+wave;
  if(water[i]===255&&waters.has('river')&&Math.abs(u-trunk)*w<Math.max(1.35,delta*.042))water[i]=K.river;
  if(water[i]===255&&waters.has('canal')&&u>.17&&u<trunk&&Math.abs(v-.71)*h<Math.max(.73,delta*.014))water[i]=K.canal;
  if(water[i]===255&&waters.has('stream')&&v<.76&&Math.abs(u-(.49+Math.sin(v*8+phase)*.052))*w<Math.max(.65,delta*.015))water[i]=K.stream;
  if(water[i]===255&&waters.has('lake')&&((u-.72)/.113)**2+((v-.23)/.115)**2<1)water[i]=K.lake;
  if(water[i]===255&&waters.has('pond')&&((u-.24)/.075)**2+((v-.76)/.085)**2<1)water[i]=K.pond;
  if(spec.roads){
   if(Math.abs(y-junction)<=Math.floor(delta*.023)&&(!waters.has('sea')||u<shore-.02))road[i]=K.main;
   else if(((x===Math.floor(w*.31)||x===Math.floor(w*.72))&&v>.29&&v<.87)||
     (city&&Math.abs(y-Math.floor(h*.34))<=Math.floor(delta*.012)&&u>.12&&u<.77))road[i]=K.branch;
   else if((Math.abs(y-Math.floor(h*.65))<=Math.floor(delta*.009)&&u>.12&&u<.44)||
     (x===Math.floor(w*.40)&&v>.44&&v<.69))road[i]=K.lane;
   else if(x===Math.floor(w*(.135+.035*Math.sin(y*.20)))&&v>.12&&v<.54)road[i]=K.trail;
  }
 }
 for(const patch of patches){
  const type=K[patch.kind];
  if(type===undefined)continue;
  const [a,b,c,d]=patch.bounds;
  for(let y=clamp(Math.floor(b),0,h);y<clamp(Math.ceil(d),0,h);y++)for(let x=clamp(Math.floor(a),0,w);x<clamp(Math.ceil(c),0,w);x++){
   const i=y*w+x;
   if(isWet(type)){water[i]=type;road[i]=255;}
   else if(type===K.bridge||type>=K.main&&type<=K.trail)road[i]=type;
   else{land[i]=type;water[i]=255;road[i]=255;}
  }
 }
 if(spec.buildings&&w>=24&&h>=20){
  const anchors=city?[[.20,.39],[.34,.39],[.20,.58],[.34,.58],[.74,.65]]:temple?[[.29,.40],[.36,.40],[.31,.60]]:coast?[[.20,.35],[.33,.61],[.68,.37]]:[[.22,.37],[.36,.38],[.34,.58]];
  for(const [u,v] of anchors){
   const x=Math.floor(u*w),y=Math.floor(v*h),width=2,height=3;
   if(x+width+1>=w||y+height+1>=h)continue;
   const cells=Array.from({length:width*height},(_,j)=>(y+Math.floor(j/width))*w+x+j%width);
   if(cells.some(i=>water[i]!==255||road[i]!==255)||houseLots.some(l=>Math.abs(x-l.x)<4&&Math.abs(y-l.y)<5))continue;
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
  const shade=surfaceHash(x,y,seed);
  if(base===K.forest&&x%3===0&&y%3===0&&shade>.23)trees.push({x,y,kind:'tree',shade});
  else if(base===K.mountain&&x%4===0&&y%4===0&&shade>.32)trees.push({x,y,kind:'rock',shade});
  else if(base===K.farm&&x%5===0&&y%4===0&&shade>.4)trees.push({x,y,kind:'crop',shade});
 }
 // Mark the start and goal on actual available land. Validate connectivity again after scenery is installed.
 return {tiles,blocked,trees,houseLots,start,goal};
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
