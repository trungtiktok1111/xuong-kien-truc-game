# Xưởng Kiến Trúc Võ Lâm

Ứng dụng một file (artifact) để chỉnh bản đồ 2D, công trình 3D voxel, đặt mô hình GLB và biến thành game chơi được.

## Cấu trúc
- `src/` mã nguồn (ed2d, ed3d, models3d, play2d, play3d, logic, ...)
- `tpl.html` khung trang; `build.sh` đóng gói bằng esbuild thành `index.html` một file
- `tests/` các kịch bản kiểm thử Playwright (`t*.py`)

## Dựng
```
npm install
bash build.sh   # tạo index.html (lưu ý: build.sh đang dùng đường dẫn /home/claude/ed, sửa nếu chạy ở nơi khác)
```
Không lưu gói tài nguyên (Kenney, v.v.) trong kho này; người dùng tự nhập vào trình duyệt.
