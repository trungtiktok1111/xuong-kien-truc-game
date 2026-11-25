const basename = path => path.split('/').pop();
const normalize = path => {
  const parts = [];
  for (const part of path.replaceAll('\\', '/').split('/')) {
    if (part === '..') parts.pop();
    else if (part && part !== '.') parts.push(part);
  }
  return parts.join('/').toLowerCase();
};
const townAlias = path => basename(path).replace(/^town-buildings_0?(\d+)-/, 'isometric buildings $1 - ')
  .replace(/^town-roofing_01-/, 'isometric town roofing - ');

export function readTileset(path, xml) {
  const root = new DOMParser().parseFromString(xml, 'application/xml').documentElement;
  if (root.localName !== 'tileset') return null;
  const image = [...root.children].find(node=>node.localName==='image');
  if (!image?.getAttribute('source')) return null;
  const field = key => Number(root.getAttribute(key)) || 0;
  const color = image.getAttribute('trans') || '';
  const offset = [...root.children].find(node=>node.localName==='tileoffset');
  const folder = path.slice(0, path.lastIndexOf('/') + 1);
  const width = field('tilewidth'), height = field('tileheight');
  if (width < 1 || height < 1 || field('columns') < 1) return null;
  return {
    path: normalize(folder + image.getAttribute('source')), name: root.getAttribute('name') || basename(path),
    width, height, columns: field('columns'), count: field('tilecount'), margin: field('margin'),
    spacing: field('spacing'), color: /^#?[\da-f]{6}$/i.test(color) ? color.replace('#', '').toLowerCase() : '',
    x: Number(offset?.getAttribute('x')) || 0, y: Number(offset?.getAttribute('y')) || 0
  };
}

function sbsKind(pack) {
  const name = pack.toLowerCase();
  if (!name.includes('sbs - isometric')) return '';
  if (name.includes('textures - floor')) return 'terrain';
  if (name.includes('textures')) return 'material';
  if (/grid pack|tile toolkit|town examples/.test(name)) return 'reference';
  if (/pathways|overworld/.test(name)) return 'terrain';
  return 'object';
}

export const archiveKinds = {
  terrain: 'Nền / đường', object: 'Vật thể / công trình', layer: 'Lớp thân / mái',
  material: 'Vật liệu', reference: 'Tham khảo', model: 'Ảnh của mô hình 3D', other: 'Ảnh khác'
};
export const heldArchiveKinds = new Set(['reference', 'model', 'material']);

export function classifyArchiveImage(pack, path, own, related) {
  const key = normalize(path), sbs = sbsKind(pack);
  let kind = sbs || 'other';
  if (/(?:^|\/)layers?\/|[-_](?:cover|base)\.[^.]+$/i.test(key) || /\/roof tiles\//.test('/' + key)) kind = 'layer';
  if (/(?:^|\/)(?:masks?|previews?|examples?)\/|(?:demo|contact[-_ ]?sheet)\.[^.]+$/.test(key)) kind = 'reference';
  if (/tree_pack/i.test(pack) && /\/textures\/(?:tree|bush)\d+\./.test('/'+key)) kind = 'model';
  if (/^pak_perspective/i.test(pack)||/^kenney_/.test(pack)&&/^(?:preview[^/]*|sample)\./i.test(key)) kind = 'reference';
  const matching = specs => specs.filter(spec => spec.path === key);
  let recipes = matching(own);
  if (!recipes.length && /sbs - isometric town pack/i.test(pack)) {
    recipes = related.filter(spec => townAlias(spec.path) === basename(key));
  }
  const drSize=/^dr_master_tiles\((16|32|64|128)\)\.png$/.exec(key);
  if(drSize){
    const side=Number(drSize[1]);
    recipes=[{width:side,height:side,margin:0,spacing:0,name:'Lưới DR Master Tiles'}];
    kind='object';
  }
  const match = key.match(/(\d+)x(\d+)\.[^.]+$/);
  const size = match ? [Number(match[1]), Number(match[2])] : null;
  if (!recipes.length && sbs && !heldArchiveKinds.has(kind) && size) {
    recipes = [{width:size[0], height:size[1], margin:0, spacing:0, name:'Theo tên tệp SBS', inferred:true, groundTexture:/textures - floor/i.test(pack)}];
  }
  return {kind, recipes, size: recipes.length ? [recipes[0].width, recipes[0].height] : null};
}

export function tileFrames(recipe, width, height) {
  const {width:w, height:h, margin:m, spacing:s} = recipe;
  if (![w,h,m,s].every(Number.isSafeInteger) || w < 1 || h < 1 || m < 0 || s < 0) return [];
  const maxColumns = Math.floor((width - 2*m + s) / (w+s));
  const rows = Math.floor((height - 2*m + s) / (h+s));
  const columns = recipe.columns || maxColumns;
  if (columns < 1 || columns > maxColumns || rows < 1 || columns*rows > 4096 || recipe.count > columns*rows) return [];
  return Array.from({length: recipe.count || columns*rows}, (_, i) =>
    [m+(i%columns)*(w+s), m+Math.floor(i/columns)*(h+s), w,h]);
}

export function sheetColor(recipe, context, width, height) {
  if (recipe.color) return recipe.color;
  if (!recipe.inferred) return '';
  const corners = [[0,0],[width-1,0],[0,height-1],[width-1,height-1]];
  const colors = corners.map(([x,y]) => {
    const [r,g,b,a] = context.getImageData(x,y,1,1).data;
    return a === 255 ? (r*65536+g*256+b).toString(16).padStart(6,'0') : '';
  });
  return ['ff00ff','008080','000000'].includes(colors[0]) && colors.every(c=>c===colors[0]) ? colors[0] : '';
}

export function clearSheetColor(context, width, height, color) {
  if (!color) return;
  const rgb = Number.parseInt(color,16), r=rgb>>16, g=(rgb>>8)&255, b=rgb&255;
  const pixels = context.getImageData(0,0,width,height), data = pixels.data;
  for (let i=0; i<data.length; i+=4) {
    if (data[i]===r && data[i+1]===g && data[i+2]===b) data[i+3]=0;
  }
  context.putImageData(pixels,0,0);
}
