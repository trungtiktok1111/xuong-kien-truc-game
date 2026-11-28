# Giai đoạn 3 — Sửa/xoá tường bao theo từng đoạn

## Vì sao
Tường bao hiện không phải là vật thể riêng lẻ — nó được tính ra mỗi lần từ hình
dạng mặt sàn (`outlineSupports()` trong `src/wall2d.js`, cắt biên mặt sàn thành
các đoạn thẳng, mỗi đoạn có id như `outline:<vòng>:<điểm>`). Cổng đã có thể gắn
vào một đoạn qua `wallId`, nhưng không có cách nào chọn một đoạn cụ thể để xoá
hẳn (đục tường) hay đổi riêng vật liệu của một đoạn — đang là tất-cả-hoặc-
không-gì (một vật liệu tường chung, hoặc đã ghép nhiều gói qua `wallModules`
nhưng không chọn tay theo từng đoạn được).

## Phạm vi
- **Chọn một đoạn tường** bằng cách bấm gần nó trên khung vẽ Đường Bao (dùng
  lại đúng ý tưởng id đoạn đã có sẵn, không đổi cách tính hình học).
- **Xoá đoạn đã chọn**: đoạn đó không còn tường/va chạm nữa (thành khoảng hở
  vĩnh viễn) — không đụng tới hình dạng mặt sàn. Nếu đoạn đang có cổng gắn vào,
  chặn xoá và báo lý do, giống các luật chặn khác đang có.
- **Khôi phục** một đoạn đã xoá.
- **Đổi vật liệu riêng cho một đoạn** — chọn một trong các vật liệu tường đã
  nạp (từ các gói đang dùng), áp riêng cho đoạn đó, đè lên vật liệu chung.
- Phím tắt: một phím để bật nhanh công cụ "Chọn đoạn tường" (ví dụ `L`, giống
  tinh thần phím tắt một chạm cho các công cụ khác).

## Cách làm
- Lưu hai danh sách mới trong `map.cfg.outline`:
  `removedWalls: string[]` (id các đoạn đã xoá) và
  `wallOverrides: {[id: string]: string}` (id đoạn → tên vật liệu riêng).
  Mặc định không có (bản đồ cũ mở lại y như cũ).
- `outlineSupports(outline)` (`src/wall2d.js`) lọc bỏ các đoạn có id nằm trong
  `outline.removedWalls` trước khi trả về — vì tất cả 6 nơi dùng hàm này (vẽ
  tường 2D/3D, tính va chạm, gắn cổng, kiểm luật dựng) đều gọi qua chung một
  hàm, sửa một chỗ này là đủ cho toàn bộ, không phải sửa 6 nơi riêng.
- Vẽ tường (`outline2d.js`/`outlineDraftView.js`): khi một đoạn có
  `wallOverrides[id]`, dùng vật liệu đó thay vì vật liệu tường chung của cảnh.
- `outlineEditor.js`: thêm chế độ chọn (giống các mode `select`/`move`/`gate`
  đã có), hiện đoạn đang chọn, và các nút Xoá/Khôi phục/Đổi vật liệu ngay cạnh
  khung vẽ khi có đoạn đang chọn.

## Việc để người làm tự quyết
- Phím tắt cụ thể cho chế độ chọn đoạn tường (đề xuất `L`, đổi nếu trùng).
- Cách hiển thị đoạn đã xoá trên khung vẽ (đề xuất: nét đứt mờ, để phân biệt
  với tường còn hiệu lực, nhưng vẫn thấy được để bấm khôi phục).
