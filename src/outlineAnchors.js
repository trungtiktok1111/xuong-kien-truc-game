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
 if(Number.isFinite(manualOverride)&&manualOverride>0)return {factor:manualOverride,via:'manual'};
 if(door)return {factor:anchorFactor('door',door.w,door.h),via:'door'};
 if(wall)return {factor:anchorFactor('wall',wall.w,wall.h),via:'wall'};
 if(character)return {factor:anchorFactor('character',character.w,character.h),via:'character'};
 return {factor:1,via:'none'};
}
