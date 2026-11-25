import {unzipSync} from 'fflate';
import {el, expandPacks} from './util.js';
import {archiveKinds, classifyArchiveImage, clearSheetColor, heldArchiveKinds, readTileset, sheetColor, tileFrames} from './archiveCatalog.js';

const basename = path => path.split('/').pop();
const isImage = path => /\.(png|jpe?g|gif|webp)$/i.test(path);
const readImage = (bytes, path) => {
  const type = {jpg:'jpeg',jpeg:'jpeg',png:'png',gif:'gif',webp:'webp'}[path.split('.').pop().toLowerCase()];
  return new Promise((resolve,reject)=>{
    const image = new Image(), reader = new FileReader();
    const failed = ()=>reject(new Error('Ảnh không đọc được'));
    reader.onerror = image.onerror = failed;
    image.onload = ()=>resolve(image);
    reader.onload = ()=>{image.src = reader.result;};
    reader.readAsDataURL(new Blob([bytes],{type:'image/'+type}));
  });
};
const btn = (label, fn, extra={}) => el('button',{class:'btn',type:'button',onclick:fn,...extra},label);
const options = (label, values, change) => el('select',{'aria-label':label,onchange:change},
  values.map(([value,title])=>el('option',{value},title)));
const searchKey = text => text.toLowerCase().trim();
const shortSize = entry => entry.size?.join('×') || '';

export async function openArchivePicker(files, receive, publishResults) {
  const box = el('dialog',{class:'asset-import','aria-label':'Nhập tài nguyên từ ZIP/RAR'});
  document.body.append(box);
  box.addEventListener('close',()=>box.remove(),{once:true});
  const title = el('h2',{},'Nhập tài nguyên từ ZIP/RAR');
  const close = btn('Đóng',()=>box.close());
  const header = el('header',{},title,close);
  const percent = el('p',{role:'status'},'Đang đọc '+files.length+' gói…');
  box.append(header,percent);
  box.showModal();

  const groups = [], failed = [];
  for (const file of files) {
    if (!box.open) return;
    percent.textContent = 'Đang đọc '+file.name+'…';
    try {
      const expanded = await expandPacks([file],true);
      for (const part of expanded) {
        if (part.archiveError) {failed.push({name:part.name,error:part.archiveError});continue;}
        try {
          const data = new Uint8Array(await part.arrayBuffer()), entries = [];
          const specs = unzipSync(data,{filter:entry=>{
            const path = entry.name.replaceAll('\\','/');
            if (/(^|\/)(__MACOSX|\._)/.test(path)) return false;
            if (isImage(path)) entries.push({path, raw:entry.name, bytes:entry.originalSize});
            return /\.tsx$/i.test(path) && entry.originalSize <= 2_000_000;
          }});
          const decoder = new TextDecoder();
          const tilesets = Object.entries(specs).map(([path,bytes])=>readTileset(path.replaceAll('\\','/'),decoder.decode(bytes))).filter(Boolean);
          const group = {name:part.name,data,entries,tilesets};
          for (const entry of entries) entry.group = group;
          groups.push(group);
        } catch {failed.push({name:part.name,error:'Không đọc được ZIP hoặc cấu trúc gói bị lỗi'});}
      }
    } catch {failed.push({name:file.name,error:'Không đọc được tệp'});}
  }
  if (!box.open) return;
  const related = groups.flatMap(group=>group.tilesets);
  for (const group of groups) {
    group.entries.sort((a,b)=>a.path.localeCompare(b.path,undefined,{numeric:true}));
    for (const entry of group.entries) Object.assign(entry,classifyArchiveImage(group.name,entry.path,group.tilesets,related));
  }
  const catalog = groups.flatMap(g=>g.entries), chosen = new Set();
  let focused = null, selectedGroup = groups.findIndex(g=>g.entries.length), page = 0, previewToken = 0;
  const reportBase = () => [
    ...groups.map(group=>({name:group.name,total:group.entries.length,selected:0,imported:0,skipped:0,failed:0,pieces:0})),
    ...failed
  ];

  if (!catalog.length) {
    percent.textContent = 'Các gói đã kiểm tra không có ảnh để chọn.';
    for (const result of failed) box.append(el('p',{},result.name+' · '+result.error));
    publishResults(reportBase());
    return;
  }

  const query = el('input',{type:'search',placeholder:'Tìm theo tên hoặc thư mục','aria-label':'Tìm ảnh',oninput:()=>{reset();showFirst();}});
  const groupFilter = options('Gói',groups.map((g,i)=>[i,g.name+' · '+g.entries.length+' ảnh']),()=>{
    selectedGroup = Number(groupFilter.value);kindFilter.value='';rebuildSizes();reset();showFirst();
  });
  groupFilter.value = String(selectedGroup);
  const kindFilter = options('Loại tài nguyên',[['','Mọi loại'],...Object.entries(archiveKinds)],()=>{rebuildSizes();reset();showFirst();});
  const sizeFilter = options('Kích thước ô',[],()=>{reset();showFirst();});
  const sizeKB = options('Dung lượng tệp',[[0,'Mọi dung lượng'],[20,'≥ 20 KB'],[100,'≥ 100 KB'],[300,'≥ 300 KB']],reset);
  const order = options('Sắp xếp',[['name','Theo tên'],['size','Dung lượng lớn trước']],reset);
  const controls = el('div',{class:'asset-import-filters'},
    el('label',{},'Gói',groupFilter),el('label',{},'Loại tài nguyên',kindFilter),
    el('label',{},'Kích thước ô',sizeFilter),el('label',{},'Tìm ảnh',query));
  const advanced = el('details',{},el('summary',{},'Nâng cao'),el('div',{class:'row'},sizeKB,order));
  const list = el('div',{class:'asset-import-list'});
  const preview = el('section',{class:'asset-import-preview','aria-label':'Xem trước cách tách'});
  const pageText = el('span',{},'');
  const prev = btn('Trang trước',()=>{page--;render();});
  const next = btn('Trang sau',()=>{page++;render();});
  const count = el('span',{role:'status'});
  const useViewed = btn('Nhập ảnh đang xem',()=>importEntries([focused]));
  const useChosen = btn('Nhập ảnh đã chọn',()=>importEntries([...chosen]),{class:'btn on'});
  const pickVisible = btn('Chọn nhóm đang lọc',()=>{filtered().filter(e=>!heldArchiveKinds.has(e.kind)).forEach(e=>chosen.add(e));render();});
  const clearChosen = btn('Bỏ chọn tất cả',()=>{chosen.clear();render();});
  const footer = el('footer',{},el('div',{class:'row'},pickVisible,clearChosen,count),el('div',{class:'row'},useViewed,useChosen));
  const paging = el('div',{class:'row'},prev,pageText,next);
  const results = el('details',{},el('summary',{},'Tình trạng đọc gói ('+files.length+')'));
  groups.forEach(g=>results.append(el('p',{},g.name+' · '+g.entries.length+' ảnh'+(g.entries.length?'':' · Không có ảnh để nhập'))));
  failed.forEach(g=>results.append(el('p',{},g.name+' · '+g.error)));
  percent.remove();
  box.append(controls,advanced,results,el('div',{class:'asset-import-body'},el('div',{class:'asset-import-browser'},list,paging),preview),footer);
  function byGroup() {
    return groups[selectedGroup].entries.filter(e=>!kindFilter.value || e.kind===kindFilter.value);
  }
  function rebuildSizes() {
    const values = [...new Set(byGroup().map(shortSize))].filter(Boolean).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    sizeFilter.replaceChildren(el('option',{value:''},'Mọi kích thước'),
      ...values.map(v=>el('option',{value:v},v+' px')),el('option',{value:'unknown'},'Ảnh rời / chưa rõ'));
  }
  function filtered() {
    const term = searchKey(query.value);
    const found = byGroup().filter(e=>(!sizeFilter.value || (shortSize(e)||'unknown')===sizeFilter.value)
      && e.bytes>=Number(sizeKB.value)*1024 && searchKey(e.path).includes(term));
    return order.value==='size'?found.sort((a,b)=>b.bytes-a.bytes):found;
  }
  function reset() {page=0;render();}
  function showFirst() {void showPreview(filtered()[0] || null);}
  function updateButtons() {
    count.textContent = 'Đã chọn '+chosen.size+' ảnh';
    clearChosen.disabled = chosen.size===0;
    useChosen.disabled = chosen.size===0;
    useViewed.disabled = !focused || !filtered().includes(focused) || heldArchiveKinds.has(focused.kind) || !focused.ready;
  }
  function render() {
    const visible = filtered(), start = page*80;
    list.replaceChildren();
    for (const entry of visible.slice(start,start+80)) {
      const check = el('input',{type:'checkbox','aria-label':'Chọn '+entry.path,onchange:()=>{
        if (check.checked) chosen.add(entry);else chosen.delete(entry);
        updateButtons();
      }});
      check.checked = chosen.has(entry);
      check.disabled = heldArchiveKinds.has(entry.kind);
      const name = btn(basename(entry.path),()=>void showPreview(entry),{'aria-current':focused===entry?'true':'false'});
      list.append(el('div',{class:'asset-import-entry'},check,el('div',{},name,
        el('small',{},archiveKinds[entry.kind]+(shortSize(entry)?' · Ô '+shortSize(entry)+' px':'')),
        el('small',{},entry.path.includes('/')?entry.path.slice(0,entry.path.lastIndexOf('/')):''))));
    }
    if (!visible.length) list.append(el('p',{},'Không có ảnh phù hợp trong gói này.'));
    pickVisible.disabled = !visible.some(e=>!heldArchiveKinds.has(e.kind));
    pageText.textContent = visible.length?(start+1)+'–'+Math.min(start+80,visible.length)+' / '+visible.length+' ảnh':'0 ảnh';
    prev.disabled = !page;
    next.disabled = start+80>=visible.length;
    updateButtons();
  }

  const get = entry => unzipSync(entry.group.data,{filter:file=>file.name===entry.raw})[entry.raw];
  function imagePlan(entry, image) {
    const recipe = entry.recipes[entry.variant || 0];
    const width = image.naturalWidth, height = image.naturalHeight;
    if (width*height > 16_000_000) throw new Error('Ảnh vượt 16 triệu pixel');
    const canvas = el('canvas',{width,height});
    const context = canvas.getContext('2d',{willReadFrequently:true});
    context.drawImage(image,0,0);
    const frames = recipe ? tileFrames(recipe,width,height) : [[0,0,width,height]];
    if (!frames.length) throw new Error('Kích thước ô không khớp với ảnh');
    const color = recipe ? sheetColor(recipe,context,width,height) : '';
    clearSheetColor(context,width,height,color);
    return {canvas,context,width,height,frames,recipe,color};
  }
  async function showPreview(entry) {
    const token = ++previewToken;
    focused = entry;
    preview.replaceChildren(el('h3',{},'Xem trước'));
    if (!entry) {render();return;}
    entry.ready = false;
    render();
    preview.append(el('p',{},entry.path),el('p',{},'Đang đọc ảnh…'));
    try {
      const image = await readImage(get(entry),entry.path);
      if (token!==previewToken || !box.open) return;
      const {canvas,width,height,frames,recipe,color} = imagePlan(entry,image);
      if (recipe) {
        const grid = canvas.getContext('2d');
        grid.strokeStyle = '#63e3cd';grid.lineWidth = Math.max(1,width/900);
        frames.forEach(([x,y,w,h])=>grid.strokeRect(x+.5,y+.5,w-1,h-1));
      }
      entry.ready = true;
      preview.replaceChildren(el('h3',{},'Xem trước'),el('p',{},entry.path),
        el('p',{},'Ảnh '+width+' × '+height+' px'+(recipe?' · Ô '+recipe.width+' × '+recipe.height+' px · '+frames.length+' khung':' · Ảnh rời')),
        canvas);
      if (entry.recipes.length>1) {
        const variants = options('Khai báo Tiled',entry.recipes.map((r,i)=>[i,r.name]),()=>{
          entry.variant=Number(variants.value);void showPreview(entry);
        });
        variants.value=String(entry.variant || 0);
        preview.append(el('label',{},'Khai báo Tiled',variants));
      }
      if (recipe) preview.append(el('p',{class:'hint'},(recipe.inferred?'Lưới gợi ý từ tên tệp SBS':'Lưới từ tệp .tsx')+
        (color?' · Màu trong suốt #'+color:'')+
        (recipe.x || recipe.y?' · Độ lệch Tiled '+recipe.x+', '+recipe.y+' px':'')));
      if (heldArchiveKinds.has(entry.kind)) preview.append(el('p',{class:'hint'},'Ảnh thuộc nhóm '+archiveKinds[entry.kind]+'. Giữ trong gói gốc để dùng khi dựng tài nguyên.'));
      updateButtons();
    } catch (error) {
      if (token===previewToken) preview.replaceChildren(el('h3',{},'Xem trước'),el('p',{},entry.path+' · '+error.message));
    }
  }

  async function importEntries(entries) {
    if (!entries.length || !box.open) return;
    // Large image sheets can expand to dozens of pieces each. Process sequentially within a pack.
    const reports = reportBase();
    box.replaceChildren(header,percent);
    close.disabled = true;
    const preventCancel = event=>event.preventDefault();
    box.addEventListener('cancel',preventCancel);
    for (const group of groups) {
      const report = reports[groups.indexOf(group)];
      const selected = entries.filter(e=>e.group===group);
      report.selected=selected.length;
      for (const entry of selected) {
        percent.textContent = 'Đang nhập '+group.name+' · '+(report.imported+report.skipped+report.failed+1)+' / '+selected.length;
        try {
          const image = await readImage(get(entry),entry.path);
          const raw = el('canvas',{width:image.naturalWidth,height:image.naturalHeight});
          if (raw.width*raw.height > 16_000_000) throw new Error('Ảnh vượt 16 triệu pixel');
          let items;
          if (entry.recipes.length) {
            const {canvas,context,frames,recipe} = imagePlan(entry,image);
            items = frames.flatMap(([x,y,w,h],i)=>{
              const data = context.getImageData(x,y,w,h).data;
              if (!data.some((value,k)=>k%4===3 && value>16)) return [];
              const cell = el('canvas',{width:w,height:h});
              cell.getContext('2d').drawImage(canvas,x,y,w,h,0,0,w,h);
              return [{url:cell.toDataURL('image/png'),path:entry.path,name:basename(entry.path).replace(/\.[^.]+$/,'')+' '+(i+1),
                decoded:cell,frame:{kind:entry.kind, x:recipe.x||0, y:recipe.y||0}}];
            });
          } else {
            raw.getContext('2d').drawImage(image,0,0);
            items = [{url:raw.toDataURL('image/png'),path:entry.path,name:basename(entry.path),decoded:image}];
          }
          const result = items.length ? await receive(items, basename(entry.path).replace(/\.[^.]+$/,'')) : 0;
          const pieces = typeof result==='number'?result:result.pieces;
          if (pieces) {report.imported++;report.pieces+=pieces;}
          else report.skipped++;
        } catch (error) {
          report.failed++;
          (report.errors ||= []).push(basename(entry.path)+' · '+error.message);
        }
        await new Promise(resolve=>setTimeout(resolve,0));
      }
    }
    publishResults(reports);
    box.close();
  }
  rebuildSizes();
  render();
  showFirst();
}
