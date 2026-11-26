// Tỉ lệ quy ra từ điểm neo: cửa → tường → nhân vật trong gói → chỉnh tay → không có.
export const REFERENCE_HEIGHT={door:1.47,wall:2.0,character:1.2};

export function guessTileWidth(w,h){return Math.max(w/.95,h/1.65);}

export function anchorFactor(kind,artWidthPx,artHeightPx){
 const trueTileWidth=artHeightPx/REFERENCE_HEIGHT[kind];
 return trueTileWidth/guessTileWidth(artWidthPx,artHeightPx);
}

export function packScale({door,wall,character}={},manualOverride){
 if(door)return {factor:anchorFactor('door',door.w,door.h),via:'door'};
 if(wall)return {factor:anchorFactor('wall',wall.w,wall.h),via:'wall'};
 if(character)return {factor:anchorFactor('character',character.w,character.h),via:'character'};
 if(Number.isFinite(manualOverride)&&manualOverride>0)return {factor:manualOverride,via:'manual'};
 return {factor:1,via:'none'};
}
