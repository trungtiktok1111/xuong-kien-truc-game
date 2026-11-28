const cache=new WeakMap();

export function spriteVerticalBounds(image,x,y,w,h){
 if(!image)return [0,h];
 let bounds=cache.get(image);
 if(!bounds){bounds=new Map();cache.set(image,bounds);}
 const key=[x,y,w,h].join(':');
 if(bounds.has(key))return bounds.get(key);
 let bottom=h,top=0;
 try{
  const buffer=document.createElement('canvas');
  buffer.width=w;buffer.height=h;
  const ctx=buffer.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(image,x,y,w,h,0,0,w,h);
  const alpha=ctx.getImageData(0,0,w,h).data;
  first:for(let row=0;row<h;row++)for(let col=0;col<w;col++){
   if(alpha[(row*w+col)*4+3]>8){top=row;break first;}
  }
  search:for(let row=h-1;row>=0;row--)for(let col=0;col<w;col++){
   if(alpha[(row*w+col)*4+3]>8){bottom=row+1;break search;}
  }
 }catch{/* Use the frame boundary if pixel readback is unavailable. */}
 const result=[top,bottom];bounds.set(key,result);
 return result;
}

export const spriteBottom=(...args)=>spriteVerticalBounds(...args)[1];

export function tileSpan(sheet,idx){
 if(!sheet?.img||!sheet.tw)return 1;
 const {tw,cols,margin=0}=sheet;
 const [top,bottom]=spriteVerticalBounds(sheet.img,(idx%cols)*(tw+margin),Math.floor(idx/cols)*(tw+margin),tw,tw);
 return (bottom-top)/tw;
}

export function tileFoot(sheet,idx){
 if(!sheet?.img||!sheet.tw)return 1;
 const {tw,cols,margin}=sheet;
 return spriteBottom(sheet.img,(idx%cols)*(tw+margin),Math.floor(idx/cols)*(tw+margin),tw,tw)/tw;
}
