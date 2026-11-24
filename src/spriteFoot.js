const cache=new WeakMap();

export function spriteBottom(image,x,y,w,h){
 if(!image)return h;
 let bounds=cache.get(image);
 if(!bounds){bounds=new Map();cache.set(image,bounds);}
 const key=[x,y,w,h].join(':');
 if(bounds.has(key))return bounds.get(key);
 let bottom=h;
 try{
  const buffer=document.createElement('canvas');
  buffer.width=w;buffer.height=h;
  const ctx=buffer.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(image,x,y,w,h,0,0,w,h);
  const alpha=ctx.getImageData(0,0,w,h).data;
  search:for(let row=h-1;row>=0;row--)for(let col=0;col<w;col++){
   if(alpha[(row*w+col)*4+3]>8){bottom=row+1;break search;}
  }
 }catch{/* Use the frame boundary if pixel readback is unavailable. */}
 bounds.set(key,bottom);
 return bottom;
}

export function tileFoot(sheet,idx){
 if(!sheet?.img||!sheet.tw)return 1;
 const {tw,cols,margin}=sheet;
 return spriteBottom(sheet.img,(idx%cols)*(tw+margin),Math.floor(idx/cols)*(tw+margin),tw,tw)/tw;
}
