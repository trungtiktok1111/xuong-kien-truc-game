// Tỉ lệ quy ra từ điểm neo: cửa → tường → nhân vật trong gói → chỉnh tay → không có.
export const REFERENCE_HEIGHT={door:1.47,wall:2.0,character:1.2};

export function guessTileWidth(w,h){return Math.max(w/.95,h/1.65);}

// entity() sets sc = 1.5*side/tileWidth, so on-screen size is inversely proportional to
// tileWidth. The generic per-object guess G already produced the pack's current sc; the
// anchor gives the true pixels-per-tile T. The correction that turns sc_guess into
// sc_true is G/T (NOT T/G): sc_true = 1.5*side/T = (1.5*side/G)*(G/T) = sc_guess*(G/T).
export function anchorFactor(kind,artWidthPx,artHeightPx){
 const trueTileWidth=artHeightPx/REFERENCE_HEIGHT[kind];
 return guessTileWidth(artWidthPx,artHeightPx)/trueTileWidth;
}

export function packScale({door,wall,character}={},manualOverride){
 if(Number.isFinite(manualOverride)&&manualOverride>0)return {...packScale({door,wall,character}),factor:Math.max(.2,Math.min(5,manualOverride)),via:'manual'};
 if(door)return {factor:anchorFactor('door',door.w,door.h),via:'door',pixelsPerCell:door.h/REFERENCE_HEIGHT.door};
 if(wall)return {factor:anchorFactor('wall',wall.w,wall.h),via:'wall',pixelsPerCell:wall.h/REFERENCE_HEIGHT.wall};
 if(character)return {factor:anchorFactor('character',character.w,character.h),via:'character',pixelsPerCell:character.h/REFERENCE_HEIGHT.character};
 return {factor:1,via:'none'};
}

// One cell of elevation represents 1.5 m. Raster art rarely has dimensions;
// a category gives a starting height while the original aspect ratio is retained.
const heights=[
 [/stool|ghe-dau|bench|ghe-dai/, .34],
 [/chair|ghe|ban-ghe/, .60],
 [/table|ban-an|ban-go/, .53],
 [/barrel|thung|crate|chest|ruong|woodencrate/, .54],
 [/bookcase|shelf|tu-sach|cabinet/, 1.25],
 [/column|cot|lamp-post|den-duong/, 1.65],
 [/horse|ngua|deer|nai|cow|cattle|bo-sua/, 1.02],
 [/dog|cho|wolf|soi|sheep|cuu|goat|heode/, .49],
 [/cat|meo|rabbit|tho|chicken|hen|duck|vit|bird|chim/, .24],
 [/shrub|bush|bui-cay|corn|ngo|crop/, .65],
 [/tree|pine|palm|tung|cay-co-thu|cay-lon|cay-thong/, 2.85],
 [/flower|grass|hoa|co-dai|plant/, .25],
 [/statue|tuong-da/, 1]
];
export function outlineHeight(label,role,meters){
 if(Number.isFinite(meters)&&meters>0)return meters/1.5;
 if(role==='character')return REFERENCE_HEIGHT.character;
 if(role==='house')return 2.7;
 const name=label.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replaceAll('đ','d').replace(/[ _]+/g,'-');
 return heights.find(([pattern])=>pattern.test(name))?.[1];
}
export function outlineObjectSize(art,label,role,scale,declaredWidth,meters){
 // An image's projected tile width spans two vertical half-tile units.
 const anchoredWidth=scale?.pixelsPerCell&&2*scale.pixelsPerCell;
 const base=declaredWidth||anchoredWidth||guessTileWidth(art.w,art.h);
 const height=outlineHeight(label,role,meters),measured=2*art.h/base;
 const standard=height&&(role==='character'||meters||!scale?.pixelsPerCell&&!declaredWidth||measured<height*.65||measured>height*1.55);
 const factor=scale?.via==='manual'?scale.factor:1;
 const tileWidth=(standard?2*art.h/height:base)/factor;
 const slender=/tree|pine|palm|cay|column|cot/i.test(label);
 const radius=Math.max(.10,Math.min(2.2,art.w/tileWidth*(slender?.17:.43)));
 return {tileWidth,radius,bodyHeight:2*art.h/tileWidth};
}

export function scaleOutlineHouse(house,factor){
 if(factor===1)return house;
 const pair=([x,y])=>[x*factor,y*factor];
 const ents=house.ents.map(e=>({...e,x:(e.x+1)*factor-1,y:(e.y+1)*factor-1,sc:e.sc*factor,
  ...(e.housePart?{housePart:{...e.housePart,scale:e.housePart.scale*factor}}:{}),
  col:e.col?.map(c=>c.k==='seg'?{...c,a:pair(c.a),b:pair(c.b),th:c.th*factor}:c)}));
 return {...house,w:Math.ceil(house.w*factor),h:Math.ceil(house.h*factor),ents};
}
