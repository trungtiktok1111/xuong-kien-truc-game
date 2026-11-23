# Xưởng Kiến Trúc Game

Ứng dụng **một file HTML** để tự thiết kế bản đồ 2D (chéo 2.5D), công trình 3D voxel, rồi biến thành game chơi được. Dùng tài nguyên do chính người dùng tự tạo (gói tranh võ hiệp riêng); kho này **không chứa** tài nguyên của bên thứ ba.

## Chạy nhanh (không cần cài gì)
Tải `index.html` về, mở bằng Chrome. App chạy hoàn toàn trong trình duyệt, không cần máy chủ.

## Dữ liệu người dùng nằm ở đâu
Mẫu 2D, bản đồ, tài nguyên đã nạp lưu trong **trình duyệt** (IndexedDB, kho `thk_store`), **không nằm trong kho này**. Muốn chuyển sang máy/AI khác: dùng nút sao lưu trong app (tab "🏠 Mẫu 2D" có Sao lưu/Khôi phục) rồi nạp lại.

## Tính năng chính
- **Editor 2D**: bản đồ chéo/vuông tới 600×600; 5 lớp (nền, phủ nền, vật thể, mái/cửa, vùng chặn); chọn vùng, sao chép, dán; thêm vật thể kích thước thật (deco).
- **Mẫu 2D**: kho mẫu có số thứ tự, giữ ảnh gốc, phân loại theo góc camera → nhóm → mẫu; quét dọn (ghép lớp phủ vào mẫu, bỏ trùng/rác).
- **Editor 3D voxel**: lưới tới 320×320×128, đặt mô hình GLB.
- **Chơi thử** 2D/3D: nhân vật, va chạm theo dấu chân, sắp xếp che khuất theo dấu chân.

## Cấu trúc thư mục
- `src/` mã nguồn. Chính: `main.js` (vào), `ed2d.js` (editor 2D), `mau2d.js` (kho mẫu), `ed3d.js`, `play2d.js`, `play3d.js`, `isoslab.js` (vẽ ô nền chéo), `groundfx.js` (nền mượt: hòa trộn mép, đốm sáng tối, sương), `gen2d.js` (sinh bản đồ), `logic.js`, `util.js`.
- `tpl.html` khung trang; `index.html` là **bản đã đóng gói** (sinh ra, đừng sửa tay).
- `nen/` gói nền (atlas ô 192px, `index.json` liệt kê); `vat/` gói vật thể; `assets/` danh mục.
- `tests/` kịch bản kiểm thử Playwright (`t*.py`); `tools/` script phụ; `docs/` ghi chú thiết kế (vùng chặn).

## Dựng lại từ mã nguồn
```
npm install
bash build.sh   # esbuild → index.html
```
Lưu ý: `build.sh` đang ghi cứng đường dẫn `/home/claude/ed`; đổi sang thư mục của bạn khi chạy ở nơi khác.

## Quy ước kỹ thuật cần biết (cho AI/người tiếp tục)
- Hình học chéo: màn hình = (ox+(x−y)·D, oy+(x+y)·D/2); neo vật thể = góc dưới ô (x+1,y+1).
- Tô ô (công cụ Vẽ) ép sprite vào **một ô**; vật cỡ thật phải là deco (Mẫu 2D → "Đặt").
- Thứ tự vẽ và va chạm tính theo **dấu chân** vật thể (`play2d.js`).
- Không dùng tài nguyên Kenney hay gói bên thứ ba trong kho; người dùng tự nạp vào trình duyệt.
- Đã thử xóa viền ô nền (`derim`) nhưng làm nền xấu hơn → đã gỡ. Hướng đúng: nền liền theo tọa độ bản đồ + pha màu chỗ giáp.
- Việc dang dở: thanh công cụ nổi (Chọn/Sao chép/Dán/Xóa), nền liền, giảm số tab, tạo nhân vật, màn 2, menu, âm thanh.
