# Xưởng Kiến Trúc Game

Ứng dụng **một file HTML** để tự thiết kế bản đồ 2D (chéo 2.5D), công trình 3D voxel, rồi biến thành game chơi được. Dùng tài nguyên do chính người dùng tự tạo (gói tranh võ hiệp riêng); kho này có kèm bộ mảnh Kenney chọn lọc theo giấy phép CC0.

## Mặt đất trong Đường Bao 2D

Chọn **Đường bao → Mặt đất → Phủ kín hình thoi** để tạo nền trống đi được trên toàn bộ lưới. Chọn mẫu đồng bằng, thành phố, thôn trang, tông môn hoặc ven biển. Có thể bật hoặc tắt địa hình, công trình, mạng đường và từng loại mặt nước.

Trong **Ráp vùng**, chọn một loại đất, đường, nước hoặc cầu rồi kéo trên lưới. Các vùng được ráp theo thứ tự đặt và có thể hoàn tác. Nước và vách núi chặn bước chân. Đường qua vùng nước trong đất liền được nối bằng cầu. Với cảnh biển, dùng vùng **Cầu** để đặt lối vượt nước tại vị trí mong muốn.

Dùng **Chơi thử bản nháp** để kiểm tra tuyến đi. Dùng **Tạo màn mới từ hình này** để giữ cảnh hầm hiện tại và thêm màn mặt đất riêng.

## Tự phối vật liệu Đường Bao 2D

Mở **2D → Đường Bao → Tự phối vật liệu Đường Bao**. Chọn gói ZIP và mảnh ráp riêng cho từng lớp **Nền**, **Phủ nền**, **Tường bao**, **Vật dụng** và **Nhà**. Dùng **Thử lần lượt** để xem từng mảnh tương thích ngay trong bản xem trước, hoặc dùng **Trước**, **Sau** và **Bỏ qua**. Dùng **Áp dụng vào bản đồ**, **Chơi thử bản nháp** hoặc **Tạo màn mới từ hình này**. Xưởng chừa hành lang và kiểm tra va chạm khi đặt đạo cụ.

**Thêm ZIP** nhận nhiều gói cùng lúc. Bản chạy từ mã nguồn GitHub dùng các bộ tích hợp và ZIP chọn từ máy. Danh mục kho gói của bản triển khai cần các tệp `dist/packs/`. Xưởng nhận diện một số tên mảnh thông dụng. Với gói có tên riêng, thêm tệp `outline-materials.json` và khai báo đường dẫn ảnh tính từ thư mục chứa tệp. Ví dụ:

```json
{
  "version": 1,
  "floors": [{"path": "nen/da.png", "name": "Đá lát", "shape": "square"}],
  "props": [{"path": "vat/thung-e.png", "name": "Thùng", "anchor": [128, 437], "tileWidth": 256}]
}
```

Các bộ phối Kenney đi kèm ứng dụng và có thể dùng ngay khi mất kết nối đến kho gói. Nếu ZIP đã chọn khớp bộ Kenney Miniature, Xưởng đọc trực tiếp các mảnh trong ZIP đó. Các ảnh gốc dùng cho bộ phối và giấy phép CC0 của Kenney nằm trong `assets/kenney-outline.zip`.

Dùng `shape: "square"` cho ảnh vật liệu vuông nhìn từ trên xuống. Mặc định ảnh sàn dùng góc isometric 2:1. `anchor` là điểm chân trên ảnh gốc tính bằng pixel. `tileWidth` là bề rộng pixel ứng với một ô bản đồ. Có thể chỉ khai báo sàn hoặc chỉ khai báo đạo cụ và phối với gói khác.

### Tỉ lệ, nhân vật và bộ đã lưu

Đường Bao 2D dùng 1,5 m cho một ô cao. Xưởng ưu tiên chiều cao `heightMeters` khai báo cho mảnh trong `outline-materials.json`. Với ảnh thiếu số đo, Xưởng ước lượng từ cửa, tường, nhân vật hoặc nhóm vật dụng, động vật và cây cối. Cỡ mạch nền, chiều cao và độ dày tường, cùng phần chỉnh tỉ lệ theo gói vẫn có thể chỉnh riêng.

Chọn ảnh trong lớp **Nhân vật**. Ảnh đầu là nhân vật điều khiển khi chơi. Các ảnh chọn thêm là nhân vật phụ đứng trong cảnh. Ảnh PNG nhập riêng là hình tĩnh.

Dùng **Lưu…** hoặc **Lưu bộ mới…**, rồi chọn bộ trong **Bộ đã lưu → Mở**. Xưởng lưu các ZIP đang dùng cùng bộ chọn trong trình duyệt đó. Lưu bộ chọn có thể thực hiện trước khi áp dụng bản đồ.

## Điểm neo khi đặt mảnh 2D

Chọn một trong chín vị trí dưới mục Điểm neo để đặt mái theo tâm, theo mép hoặc theo góc. Điểm sáng trên mái đi theo con trỏ. Các dấu tựa xanh vẫn thể hiện nơi đỉnh tường hoặc cột đỡ mái. Vật thể khác có một, ba hoặc chín điểm theo kích thước nhìn thấy. Giữ Shift để bám lưới ¼ ô.

## Khoảng trống theo trục Z trong cảnh 2D

- X/Y xác định vị trí và diện tích chiếm chỗ. Z tính từ mặt sàn theo đơn vị ô bản đồ. So sánh đỉnh vật với đáy mái thấp nhất trên phần mặt bằng giao nhau. Mái dốc có cao độ khác nhau ở mỗi điểm.
- Mặc định người chơi đứng cao 1,20 ô, cúi còn 0,68 ô. Bấm C hoặc nút Cúi để đi dưới mái thấp. Khi ở dưới mái thấp, cần ra chỗ đủ cao để đứng dậy. Tìm đường dùng tư thế hiện tại.
- Mặc định rương đóng cao 0,55 ô, mở nắp lên 0,80 ô. Chiều cao của người chơi, NPC, quái và vật thể có thể chỉnh trong bảng Đối tượng. Vật thể ảnh riêng dùng chiều cao ước lượng từ ảnh khi chưa nhập số đo.

## Quy tắc dựng mái 2D

- Mái cần hai điểm tựa ở hai phía trên tường hoặc cột có nền đỡ. Cao độ của mái khớp với đỉnh điểm tựa. Hai điểm bằng cao độ cho mặt mái ngang. Có thể đổi chiều mái hoặc chỉnh chiều cao tường để tạo độ dốc.
- Công cụ Đặt mảnh hiển thị vị trí tựa. Dời hoặc xóa kết cấu khiến mái mất tựa sẽ hủy thao tác. Các mái treo trong bản đồ cũ vẫn có thể chỉnh sửa, hiện viền đỏ và được liệt kê khi bấm Kiểm. Bản chơi bỏ qua những mái này.
- Các quy tắc lắp ghép kiểm tra hình học của cảnh game. Chúng xác định nền đỡ, điểm tựa và lối qua cổng.

## V15.7.1
- **Va chạm (K)** hiện ngay vùng chặn. Bộ đếm ghi rõ số vùng vẽ tay.

## V15.7
- **Dựng cảnh** hiển thị vật liệu và vật thể theo lớp ngay trong khung bên phải. **Đặt mảnh (B)** dùng mảnh đã chọn để lắp lên bản đồ.
- Tìm và chọn mảnh trong cùng khung. Dùng **Bảng ghép ô** để kéo chọn nhiều ô liền nhau trong atlas.

## V15.6
- Lớp Vật thể tự gắn vùng chặn ước lượng theo chân ảnh có nhãn Chặn đường. Bật hiển thị Va chạm để xem viền cam trong trình sửa hoặc lúc chơi.
- Xem [Quy tắc đặt vật thể 2D](docs/quy-tac-dat-vat-the-2d.md) để biết quy ước tọa độ, dữ liệu từ gói và giới hạn suy từ PNG.

## V15.4
- Báo kết quả riêng cho từng ZIP, liệt kê gói đã lưu và mở trực tiếp ZIP có ảnh khi thiếu tệp khai báo.

## V15.3
- **Tệp** tập trung vào mở, lưu dự án và trạng thái tự lưu. Các cảnh cũ đã được bỏ khỏi mục này. Nhập ảnh/gói qua **Tài nguyên**, đổi kích thước trong **Màn & cửa**, và xuất PNG trong **Xuất**.

## V15.2
- Trong **Màn mẫu**, chọn **Dùng mẫu cho màn hiện tại** để thay bố cục và nội dung sau khi xác nhận. Có thể hoàn tác. **Tạo bản sao** vẫn thêm một màn riêng.

## V15.1
- Khi bảng vẽ chưa khởi động, hiện mặt bằng Đá Xoáy và thông báo ngay cả trong khung xem tệp không chạy JavaScript. Bản đồ 2D khởi động trước khi tải các gói nền qua mạng.

## V15
- **Màn mẫu** có 23 bố cục, gồm bản Đá Xoáy gốc và 10 màn mới trong nhóm **Bố cục phức tạp**.
- **Điện thoại:** thanh công cụ 2D nằm dưới vùng vẽ, không che bản đồ. Trình sửa **Đường bao** xếp lại: vùng vẽ dính phía trên, các nhóm nút vuốt ngang; xoay ngang thì vùng vẽ bên trái, công cụ bên phải.
- **Xoay góc tùy chọn** (Đường bao → Chỉnh hình đã chọn): xoay hình đã chọn hoặc cả bản đồ theo số độ bất kỳ.
- Tường được cắt thành đoạn ngắn khi sắp độ sâu, nên không còn đè lên nhân vật đứng ở đầu cạnh tường dài.
- Nạp nhiều gói xuong-pack (.zip) cùng lúc.

## V14
- **Đường bao → Quét chọn** sao chép đường bao cùng bốn lớp ô hình. Dán vào lưới hoặc bấm **Tạo màn từ vùng quét** để tách riêng khu đã chọn. Nền Đá Xoáy ghép lại đúng mạch ở tọa độ mới.
- Trong bản đồ có đường bao, ảnh nhân vật và bóng bám điểm chân ở cả Isometric và Angle. Mép tường tiếp tục che nhân vật theo thứ tự chiều sâu.

## V13
- Giữ 28 mảnh ghép có thể xoay, 12 màn mẫu chơi thử được và lưới tùy chỉnh theo từng chiều đến 600 ô. Trong **Màn mẫu**, dùng **Tạo bản sao** hoặc **Nạp lại mẫu gốc** để thử bố cục khác.
- Chân nhân vật bị chặn theo đường bao sàn, kể cả mép cong và sân trong. Lớp kiểm tra va chạm trong trình biên tập và chế độ chơi dùng cùng đường bao. Ô chặn đặt thủ công phía trong sàn và collider riêng của đạo cụ vẫn có hiệu lực.
- Màn đường bao cũ có đủ mặt nạ ô chặn ngoại vi được nhận dạng tự động. Tùy chọn **Cập nhật vùng chặn** xác định cách áp dụng va chạm cho lần lưu đường bao mới.
- [Phân tích Kenney Dungeon và quy trình dựng gói độc lập](docs/Phan-Tich-Kenney-Dungeon-va-Quy-Trinh-Tao-Goi-Doc-Lap.md).

## Chạy nhanh
Mở `index.html` sau khi dựng. Khi cần nạp các gói tài nguyên nằm ngoài tệp HTML, chạy `python3 -m http.server 8000` ở thư mục gốc repo và mở `http://localhost:8000`.

## Dữ liệu người dùng nằm ở đâu
Mẫu 2D, bản đồ, tài nguyên đã nạp lưu trong **trình duyệt** (IndexedDB, kho `thk_store`), **không nằm trong kho này**. Muốn chuyển sang máy/AI khác: dùng nút sao lưu trong app (tab "🏠 Mẫu 2D" có Sao lưu/Khôi phục) rồi nạp lại.

## Tính năng chính
- **Editor 2D**: bản đồ chéo/vuông tới 600×600; 5 lớp (nền, phủ nền, vật thể, mái/cửa, vùng chặn); chọn vùng, sao chép, dán; thêm vật thể kích thước thật (deco).
- **Mẫu 2D**: kho mẫu có số thứ tự, giữ ảnh gốc, phân loại theo góc camera → nhóm → mẫu; quét dọn (ghép lớp phủ vào mẫu, bỏ trùng/rác).
- **Đường Bao 3D**: ở chế độ 3D, mở **Đường Bao** để chỉnh mặt bằng XZ rồi áp dụng sàn, lỗ khoét, tường và va chạm vào cảnh. **Vừa lưới** thu khoảng trống. Có thể đặt mẫu, chỉnh điểm, quét/sao chép hình và nối hành lang như trong trình mặt bằng 2D.
- **Màn mẫu**: thôn trang, thành trấn, bang phái, bến nước, quan ải và vườn đền dùng được ở cả hai chế độ. Các nhãn trên bản vẽ chỉ vị trí khu chức năng.
- **Cổng tường bao 3D**: tạo màn đích bằng **Tạo bản sao**, chuyển về màn nguồn qua danh sách cảnh 3D, mở **Đường Bao** và chọn **Lắp cổng 3D**. Chọn màn đích rồi bấm cạnh thẳng đủ dài. Khi chơi, đi vào phía trong miệng cổng để sang điểm xuất phát của màn đích. Đặt thêm một cổng ở màn bên kia nếu cần đường về.
- **Editor 3D voxel**: lưới tới 320×320×128, đặt mô hình GLB.
- **Chơi thử** 2D/3D: nhân vật, va chạm theo dấu chân, sắp xếp che khuất theo dấu chân.

## Cấu trúc thư mục
- `src/` mã nguồn. Chính: `main.js` (vào), `ed2d.js` (editor 2D), `mau2d.js` (kho mẫu), `ed3d.js`, `play2d.js`, `play3d.js`, `isoslab.js` (vẽ ô nền chéo), `groundfx.js` (nền mượt: hòa trộn mép, đốm sáng tối, sương), `gen2d.js` (sinh bản đồ), `logic.js`, `util.js`.
- `tpl.html` khung trang; `index.html` là **bản đã đóng gói** (sinh ra, đừng sửa tay).
- `nen/` gói nền (atlas ô 192px, `index.json` liệt kê); `vat/` gói vật thể; `assets/` danh mục.
- `tests/` kịch bản kiểm thử Playwright (`t*.py`); `tools/` script phụ; `docs/` ghi chú thiết kế (vùng chặn).

## Dựng lại từ mã nguồn
```
npm ci
npm run build   # esbuild → index.html
npm test        # kiểm thử hình học vùng chặn
```


## Quy ước kỹ thuật cần biết (cho AI/người tiếp tục)
- Hình học chéo: màn hình = (ox+(x−y)·D, oy+(x+y)·D/2); neo vật thể = góc dưới ô (x+1,y+1).
- Tô ô (công cụ Vẽ) ép sprite vào **một ô**; vật cỡ thật phải là deco (Mẫu 2D → "Đặt").
- Thứ tự vẽ và va chạm tính theo **dấu chân** vật thể (`play2d.js`).
- Không dùng tài nguyên Kenney hay gói bên thứ ba trong kho; người dùng tự nạp vào trình duyệt.
- Đã thử xóa viền ô nền (`derim`) nhưng làm nền xấu hơn → đã gỡ. Hướng đúng: nền liền theo tọa độ bản đồ + pha màu chỗ giáp.
- Việc dang dở: thanh công cụ nổi (Chọn/Sao chép/Dán/Xóa), nền liền, giảm số tab, tạo nhân vật, màn 2, menu, âm thanh.
