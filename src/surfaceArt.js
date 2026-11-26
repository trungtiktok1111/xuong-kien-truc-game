import {surfaceTypes,surfaceKinds as K,surfaceHash as hash} from './surfaceTerrain.js';

export const SURFACE_VARIANTS=4;
const TILE=48;
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
export function surfaceSheet(){
 const cv=Object.assign(document.createElement('canvas'),{width:TILE*SURFACE_VARIANTS,height:TILE*surfaceTypes.length});
 const ctx=cv.getContext('2d');
 surfaceTypes.forEach(([, ,color],kind)=>{
  for(let n=0;n<SURFACE_VARIANTS;n++){
   const x=n*TILE,y=kind*TILE;
   ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.rect(0,0,TILE,TILE);ctx.clip();
   rect(ctx,0,0,TILE,TILE,color);
   const wet=kind>=K.sea&&kind<=K.pond;
   for(let i=0;i<170;i++){
    const px=Math.floor(hash(i,kind,n)*TILE),py=Math.floor(hash(i,kind,n+7)*TILE);
    rect(ctx,px,py,1+(i%4),1, i%2?'#e8edbe25':'#152d3824');
   }
   if(wet){
    for(let i=0;i<7;i++){
     const a=hash(i,kind,n+15)*TILE,b=hash(i,kind,n+24)*TILE,length=7+hash(i,kind,n+5)*12;
     ctx.beginPath();ctx.moveTo(a,b);ctx.quadraticCurveTo(a+length*.5,b-2,a+length,b);
     ctx.strokeStyle=kind===K.sea?'#86c4ce55':'#bae0d166';ctx.lineWidth=1.15;ctx.stroke();
    }
   }else if(kind===K.main||kind===K.plaza||kind===K.lot){
    ctx.strokeStyle='#564f453b';ctx.lineWidth=.75;
    for(let v=0;v<TILE;v+=12){
     ctx.beginPath();ctx.moveTo(0,v+.5);ctx.lineTo(TILE,v+.5);
     for(let u=(v/12%2)*8;u<TILE;u+=16){ctx.moveTo(u+.5,v);ctx.lineTo(u+.5,v+12);}
     ctx.stroke();
    }
   }else if(kind===K.farm){
    for(let row=1;row<TILE;row+=8){
     rect(ctx,0,row,TILE,3,'#544d3055');rect(ctx,0,row+3,TILE,1,'#ddd28c48');
    }
   }else if(kind===K.bridge){
    for(let row=0;row<TILE;row+=8){
     rect(ctx,0,row,TILE,1,'#4c372c');rect(ctx,0,row+1,TILE,1,'#dfbc8b');
    }
    rect(ctx,0,0,2,TILE,'#564331');rect(ctx,TILE-2,0,2,TILE,'#564331');
   }
   ctx.restore();
  }
 });
 return {name:'Mặt đất · Địa hình và đường',url:cv.toDataURL(),tw:TILE,margin:0};
}
export function surfaceRock(){
 const tw=96,cv=Object.assign(document.createElement('canvas'),{width:tw,height:tw}),c=cv.getContext('2d');
 const face=(color,points)=>{c.fillStyle=color;c.beginPath();c.moveTo(...points[0]);for(const q of points.slice(1))c.lineTo(...q);c.closePath();c.fill();};
 face('#4b5248',[[6,83],[24,57],[38,20],[61,33],[80,63],[92,82],[59,96],[22,95]]);
 face('#82867a',[[6,83],[24,57],[38,20],[48,46],[45,80],[22,95]]);
 face('#a3a593',[[24,57],[38,20],[61,33],[48,46],[34,62]]);
 face('#656a60',[[48,46],[61,33],[80,63],[92,82],[59,96],[45,80]]);
 face('#757b69',[[48,46],[67,58],[60,78],[45,80]]);
 return {name:'Mặt đất · Vách núi đá',url:cv.toDataURL(),tw,margin:0};
}
