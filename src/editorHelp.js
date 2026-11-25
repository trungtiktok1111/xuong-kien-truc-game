import {el} from './util.js';

const guide2D={
  draw:['Đặt mảnh · B','Lắp mảnh nền, vật thể hoặc mái vào bản đồ.',
    'Chọn lớp và mảnh trong Dựng cảnh.','Bấm để đặt một mảnh, kéo để đặt nhiều mảnh. Ctrl+Z để hoàn tác.'],
  select:['Chọn vùng · V','Chọn một khu trên bản đồ để sao chép, di chuyển hoặc xóa.',
    'Kéo chuột trái từ góc đầu đến góc đối diện.','Dùng Ctrl+C để sao chép, Ctrl+V rồi bấm điểm đặt. Dùng phím mũi tên để dời vùng chọn.'],
  erase:['Xóa · E','Xóa các ô tại lớp đang sửa.',
    'Chọn đúng lớp ở thanh dưới.','Bấm hoặc kéo chuột trái trên những ô cần xóa. Ctrl+Z nếu xóa nhầm.'],
  pick:['Lấy mẫu · I','Lấy lại một ô hình đã có trên bản đồ để đặt lại.',
    'Bấm vào một ô sàn hoặc ô hình đang thấy.','Nhấn B để quay về Đặt mảnh, rồi bấm nơi muốn đặt ô vừa lấy.'],
  rect:['Hình chữ nhật · R','Lát cùng một ô hình trên cả một khu hình chữ nhật.',
    'Chọn lớp và ô hình trước.','Kéo từ góc đầu đến góc đối diện rồi nhả chuột.'],
  fill:['Đổ · U','Thay nhóm ô liền nhau có cùng hình bằng ô hình đang cầm.',
    'Chọn lớp và ô hình mới.','Bấm một ô trong vùng muốn thay. Kiểm kết quả rồi dùng Ctrl+Z nếu vùng đổ rộng hơn dự kiến.'],
  zone:['Va chạm · K','Xem và chỉnh vùng chặn ngay trên bản đồ.',
    'Muốn thêm vùng chặn, chọn hình bên dưới.','Kéo để đặt khung hoặc bấm từng đỉnh đa giác rồi nhấn Enter.'],
  pan:['Kéo bản đồ','Di chuyển khung nhìn để xem khu khác.',
    'Giữ chuột trái và kéo khi đang chọn Kéo. Trên máy tính, Space + kéo dùng được khi đang cầm công cụ khác.'],
  paste:['Dán · Ctrl+V','Đặt bản sao của một vùng đã chép vào bản đồ.',
    'Di chuột để xem trước vị trí. Bấm chuột trái để đặt.','Nhấn Esc để thoát chế độ Dán.'],
  obj:['Đối tượng · O','Đặt hoặc chỉnh những thứ có vai trò trong game như điểm xuất phát, NPC hoặc rương.',
    'Chọn loại bên dưới rồi bấm một ô trống để đặt.','Bấm đối tượng có sẵn để xem thuộc tính. Kéo để dời vị trí.'],
  sheet:['Bảng ghép ô','Chọn mảnh hoặc cụm mảnh từ một bảng ảnh.',
    'Chọn tên bộ hình. Bấm một ô, hoặc kéo trên bảng để lấy nhiều ô liền nhau.','Di chuột ra bản đồ và bấm để đặt. Nhấn B nếu đang dùng công cụ khác.'],
  res:['Tài nguyên','Tìm hình, gắn nhãn và chọn cách dùng một mảnh.',
    'Tìm theo tên hoặc chọn nhóm tài nguyên.','Mở một mảnh để xem ảnh và các tùy chọn đặt trên bản đồ.'],
  mau:['Mẫu 2D','Dùng lại các mảnh hoặc cụm đã lưu, như một căn nhà có nhiều lớp.',
    'Chọn nhóm và mở mẫu.','Chọn Đặt rồi bấm lên bản đồ. Kiểm vị trí chân và thử vùng chặn khi cần.'],
  maps:['Màn & cửa','Quản lý các bản đồ và nối chúng bằng cửa chuyển màn.',
    'Thêm hoặc chọn một màn. Đặt cửa ở bản đồ xuất phát.','Chọn màn đích và ô đến. Bấm Chơi để thử bước qua cửa.'],
  lib:['Thư viện','Dùng lại các vùng bản đồ đã lưu thành mẫu ghép.',
    'Chọn một mẫu đã lưu để lấy làm cọ.','Bấm bản đồ để đặt. Muốn tạo mẫu mới, dùng Chọn vùng trước.'],
  logic:['Logic','Đặt luật cho game theo sự kiện, điều kiện và hành động.',
    'Chọn sự kiện như Mở rương. Thêm điều kiện nếu cần.','Thêm hành động, chẳng hạn tăng điểm. Bấm Chơi để kích hoạt và kiểm kết quả.'],
  anim:['Hoạt ảnh','Ghép các khung hình thành chuyển động của nhân vật.',
    'Tạo hoặc chọn một hoạt ảnh rồi chọn trạng thái như đứng hoặc chạy.','Gán ảnh, kiểm thứ tự và tốc độ phát, rồi gán hoạt ảnh cho nhân vật.'],
  layers:['Lớp bản đồ','Điều khiển lớp đang sửa và lớp đang nhìn thấy.',
    'Chọn Nền để lát sàn, Vật thể để đặt đồ hoặc Mái / cửa cho hình che phía trên.','Dùng Hiện / Ẩn để xem riêng một lớp khi cần kiểm.'],
  file:['Tệp','Mở hoặc lưu toàn bộ dự án.',
    'Dùng Lưu dự án để tải một bản sao .xuong.json chứa tất cả các màn.','Mở Nâng cao nếu cần trao đổi dữ liệu của một bản đồ.']
};
const guide3D={
  build:['Đặt khối 3D','Dựng cảnh bằng các khối có hình và chất liệu riêng.','Chọn hình khối và chất liệu, rồi chỉnh Độ cao đặt.','Bấm hoặc kéo chuột trái để đặt. Phím R xoay khối trước khi đặt.'],
  sel:['Chọn khối','Chọn khối có sẵn để xem hoặc chỉnh.','Bấm khối trong khung 3D, rồi dùng các tùy chọn đang hiện bên dưới.'],
  area:['Vùng 3D','Làm việc trên nhiều khối cùng lúc.','Chọn hai góc của vùng rồi kiểm kích thước trong panel.','Dùng thao tác Sao chép hoặc Xóa vùng theo mục đích.'],
  erase:['Xóa khối','Bỏ khối khỏi công trình.','Chọn Xóa rồi bấm vào khối cần bỏ. Hoàn tác nếu xóa nhầm.'],
  paint:['Tô khối','Đổi chất liệu trên một khối đã đặt.','Chọn chất liệu, rồi bấm vào khối muốn đổi.'],
  pick:['Hút chất liệu','Lấy chất liệu từ một khối đã đặt.','Bấm khối có chất liệu muốn dùng lại.'],
  zone:['Vùng chặn 3D','Chặn nhân vật bằng vùng có chiều cao.','Chọn hình, vẽ vùng rồi chỉnh cao độ. Bấm Chơi để thử đường đi.'],
  obj:['Đối tượng 3D','Đặt điểm xuất phát, NPC và các đối tượng chơi.','Chọn loại, rồi bấm vị trí đặt. Chọn lại đối tượng để sửa thuộc tính.'],
  mdl:['Mô hình 3D','Đặt mô hình vào công trình.','Chọn hoặc nạp mô hình, rồi bấm vị trí đặt trên cảnh.'],
  logic:guide2D.logic,
  view:['Góc nhìn 3D','Kiểm công trình từ các góc và độ cao khác nhau.','Kéo chuột phải để xoay, dùng chuột giữa để dời góc nhìn và cuộn để zoom.'],
  tpl:['Mẫu 3D','Nạp một bố cục mẫu để tiếp tục dựng.','Chọn mẫu, xem nội dung rồi kiểm lại cao độ và lối đi.'],
  file:['Tệp 3D','Nhập hoặc xuất dữ liệu công trình.','Chọn định dạng tương ứng với mục đích sửa tiếp hay đưa sang công cụ khác.']
};
export const appGuides={
  outline:['Đường bao','Đây là mặt bằng nhìn thẳng từ trên xuống. Đường khép kín xác định mép sàn, chân tường và sân trong ở cả hai góc nhìn.',
    'Bấm mẫu, chọn cỡ và góc xoay, rồi bấm nơi muốn đặt. Bạn cũng có thể kéo mẫu sang mặt bằng.','Quét chọn → Ctrl+C → Ctrl+V để nhân bản đường bao và ô hình. Bấm Tạo màn từ vùng quét để tách riêng khu đã chọn. Dùng Nối hành lang để kéo một lối đi giữa hai hình.','Nhập số ô Rộng và Cao ngay trên lưới rồi bấm Đổi số ô. Mở Màn mẫu để chọn bố cục có sẵn, chơi thử hoặc tạo một màn mới.'],
  project:['Dự án game','Quản lý và đóng gói toàn bộ game.',
    'Tạo từ mẫu hoặc mở một gói dự án. Dùng Lưu dự án để chỉnh tiếp lần sau.','Bấm Chơi thử để kiểm game. Dùng Xuất game HTML để tạo tệp riêng cho người chơi.'],
  check:['Kiểm tra','Xem các lỗi dữ liệu có thể làm kẹt lượt chơi.',
    'Đọc các mục Thiếu hoặc Hỏng trước. Sửa trong Xưởng rồi bấm Cập nhật kết quả.','Dùng Chơi để kiểm những phần cần quan sát hoặc thao tác thực tế.'],
  release:['Xuất bản','Đóng gói bản chơi cho web, PC hoặc điện thoại.',
    'Điền tên game và thông tin cần thiết, rồi chọn gói phù hợp.','Mở thử bản vừa xuất trước khi gửi cho người chơi.']
};
const collapsed=new Set();
export function guideBox(id,data,{chips=[],note='',picked=false}={}){
 if(!data)return null;
 const [name,purpose,...steps]=data;
 const section=el('details',{class:'editor-guide','data-guide':id},
   el('summary',{},name),el('p',{},purpose),el('ol',{},steps.map(s=>el('li',{},s))));
 section.open=!collapsed.has(id);
 section.ontoggle=()=>{if(section.open)collapsed.delete(id);else collapsed.add(id);};
 if(note)section.append(el('p',{class:picked?'brush-ready':'brush-missing',role:'status'},note));
 if(chips.length)section.append(el('div',{class:'row editor-guide-actions'},chips));
 return section;
}
export function guideFor(view,key,options){
 const list=view==='3d'?guide3D:guide2D;
 return guideBox(view+'-'+key,list[key],options);
}
const keys=[
 ['B · V · E · I','Đặt mảnh · Chọn vùng · Xóa · Lấy mẫu'],
 ['R · U · O · K','Đặt theo khung · Thay vùng liền · Đối tượng · Va chạm'],
 ['1–5 · G · F','Đổi lớp · Bật/tắt lưới · Vừa khung hoặc đến vùng chọn'],
 ['Space + kéo · Chuột giữa','Di chuyển khung nhìn'],
 ['+ / − · Shift + cuộn','Đổi cỡ vật thể đang ngắm hoặc đang chọn'],
 ['T · Alt + cuộn','Đổi hướng vật thể 2D'],
 ['Giữ Shift','Bám ¼ ô khi đặt vật thể'],
 ['Cuộn · Chuột phải','Zoom tại con trỏ · Thao tác tại chỗ'],
 ['Ctrl+C / X / V · Delete','Sao chép / Cắt / Dán · Xóa vùng chọn'],
 ['Ctrl+Z · Ctrl+Shift+Z','Hoàn tác · Làm lại'],
 ['Ctrl+S · F5 · F1','Lưu dự án · Chơi thử · Mở/đóng hướng dẫn phím']
];
export function toggleShortcutHelp(panel){
 const focusCanvas=()=>panel.parentElement?.querySelector('canvas.main')?.focus();
 const present=panel.querySelector('.desktop-shortcuts');
 if(present){present.remove();focusCanvas();return;}
 const close=()=>{help.remove();focusCanvas();};
 const table=el('dl',{},keys.flatMap(([k,v])=>[el('dt',{},k),el('dd',{},v)]));
 const help=el('section',{class:'desktop-shortcuts',tabindex:'0','aria-label':'Phím tắt trên máy tính'},
  el('h3',{},'Phím tắt trên máy tính'),el('p',{},'Các phím 2D hoạt động khi bạn đang thao tác trên bản đồ 2D.'),table,
  el('button',{class:'b',type:'button',onclick:close},'Ẩn phím tắt'));
 // Keep help in the panel layout, with its own scroll at short viewport heights.
 panel.querySelector('.pbody')?.before(help);
 help.scrollTop=0;help.focus({preventScroll:true});
 help.onkeydown=e=>{if(e.key==='Escape'||e.key==='F1'){e.preventDefault();close();}};
}
