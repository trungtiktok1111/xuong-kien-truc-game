// Root positions measured in the 296 px Kenney Farm isometric atlas.
// Transparent shadows are useful for registering frames, but are never colliders.
const roots = [
 [[68,238],[100,224],[130,207],[163,191],[131,271],[166,257],[194,239],[229,226]],
 [[71,225],[99,241],[132,257],[160,271],[132,192],[165,207],[196,224],[228,240]],
 [[67,239],[99,225],[131,208],[164,192],[133,270],[163,256],[196,239],[227,225]],
 [[69,224],[99,240],[132,255],[159,273],[133,191],[163,207],[197,225],[222,239]],
 [[83,231],[148,198],[147,263],[213,232]],
 [[84,232],[147,198],[146,263],[211,232]],
 [[84,232],[148,200],[148,263],[212,232]],
 [[84,232],[148,199],[148,266],[211,232]]
];

const referenceBounds = [
 [20,77,262,275],[21,69,251,275],[20,72,251,272],[20,72,253,275],
 [50,164,245,274],[52,160,239,274],[46,161,239,274],[49,161,240,275],
 [64,172,230,267],[67,167,224,267],[62,169,224,267],[64,169,225,267],
 [27,84,247,267],[35,76,236,267],[21,79,236,264],[27,79,238,267]
];

export function cropContactFrame(sheetName,index,source,bounds){
 if(!bounds)return null;
 const file=String(source||'').split(/[\\/]/).pop().replace(/\.[a-z]+$/i,'');
 const match=/^(cornDouble|cornYoungDouble|cornYoung|corn)[ _-]([SENW])$/i.exec(file);
 const frame=sheetName==='Vat-kenney-nong-trai'&&index>=8&&index<=23?index-8:
  match?['corndouble','cornyoungdouble','cornyoung','corn'].indexOf(match[1].toLowerCase())*4+'SENW'.indexOf(match[2].toUpperCase()):-1;
 if(frame<0)return null;
 const [l,t,r,b]=referenceBounds[frame], [u,v,w,h]=bounds;
 return (roots[(frame%4)+(frame<8?0:4)]).map(([x,y])=>[
  u+(x-l)/(r-l)*(w-u),v+(y-t)/(b-t)*(h-v)
 ]);
}
