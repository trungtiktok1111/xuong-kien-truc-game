// Preserve the original 2 × 2 grout layout in all four tone groups.
const finishes=[
 ['Đá vôi kem · mịn',[185,168,137],1.0,1.3],
 ['Sa thạch mật ong · nhám',[172,128,73],1.1,8],
 ['Đá đỏ đất nung · sần',[151,88,70],1.0,10],
 ['Phiến xám lam · mịn',[102,119,135],1.05,2],
 ['Đá rêu · nhám',[106,117,89],1.05,7],
 ['Bazalt than · sần',[66,68,72],.8,10],
 ['Granite xám · nhám',[130,128,124],1,8],
 ['Granite xám · mịn',[130,128,124],1,2]
];

export function stonePavingSheets(image){
 const size=16,width=size*16;
 const canvas=Object.assign(document.createElement('canvas'),{width,height:size});
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(image,0,0,width,size);
 const original=ctx.getImageData(0,0,width,size);
 const gray=(r,g,b)=>r*.2126+g*.7152+b*.0722;
 return finishes.map(([name,color,contrast,roughness])=>{
  const pixels=ctx.createImageData(width,size);
  for(let y=0;y<size;y++)for(let x=0;x<width;x++){
   const i=4*(y*width+x),tile=Math.floor(x/size);
   const u=x%size+(tile&1)*size,v=y+((tile>>1)&1)*size;
   const noise=((Math.imul(u+19,73856093)^Math.imul(v+31,19349663))>>>0)%251/125-1;
   const luminance=gray(...original.data.subarray(i,i+3));
   const relief=(luminance-112)*contrast+noise*roughness;
   for(let channel=0;channel<3;channel++)pixels.data[i+channel]=color[channel]+relief;
   pixels.data[i+3]=original.data[i+3];
  }
  ctx.putImageData(pixels,0,0);
  return {name:'Đá lát · '+name,url:canvas.toDataURL(),tw:size,margin:0,phaseBrush:'da-xoay-stone-2x2'};
 });
}
