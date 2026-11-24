# Đặc tả gói tài nguyên — `xuong-pack-1` (bản nháp để duyệt)

Mục tiêu: thả một file .zip vào app, app đọc `pack.json`, hiểu từng mảnh là gì, rồi dựng bối cảnh theo nguyên tắc chung. App không đoán theo tên file.

## 1. Cấu trúc zip
```
pack.json          bắt buộc
sprites/*.png      ảnh từng mảnh (hoặc atlas, khai báo trong pack.json)
rules.json         tuỳ chọn: luật đặt riêng của gói (ghi đè luật mặc định)
```

## 2. pack.json
```json
{
  "format": "xuong-pack-1",
  "id": "thieu-lam", "name": "Thiếu Lâm", "license": "…",
  "projection": {
    "type": "iso", "tile": [256,128],
    "anchor": [128,384],            // điểm giữa mặt sàn trong ảnh, px
    "zUnit": "px",                  // độ cao tính bằng px màn hình
    "rotation": {"E":0,"S":90,"W":180,"N":270}
  },
  "assets": {
    "tuong_da_E": {
      "png": "sprites/tuong_da_E.png",
      "role": "tuong",              // xem mục 3
      "dir": "E",                   // E|S|W|N|ALL
      "footprint": [-0.5,0.27,0.5,0.48],  // khung chiếm chỗ (ô), theo hướng E
      "solid": true,
      "rise": 0,                    // chỉ bậc thang: px nâng lên
      "at": [x,y],                  // tuỳ chọn: đặt ảnh (đã cắt gọn) tại x,y trong khung canvas; nhiều mảnh dùng chung một png
      "col": [{"k":"seg","a":[-0.5,0.4],"b":[-0.26,0.4],"th":0.22}]  // tuỳ chọn: vùng chặn riêng (thay footprint), theo hệ E, gốc tâm ô
    }
  }
}
```

## 3. Vai trò (role) app hiểu
| role | ý nghĩa |
|---|---|
| `nen` | ô nền đi được (có thể nhiều biến thể) |
| `nen-duong` | nền lối đi chính (tuỳ chọn) |
| `nen-cao` | khối nền nâng cao (cần `rise`) |
| `vien-nen` | mép/góc nền, đặt ở biên vùng nền |
| `bac` | bậc nối hai mặt cao thấp (cần `rise`, hướng) |
| `tuong` | tường chắn trên cạnh ô |
| `cong` | trụ/khung cổng, xà, mái cổng (nhóm `part`: `tru`,`xa`,`mai`) |
| `cua` | cửa (khai báo `state`: `dong`/`mo`) |
| `cot`, `ban`, `ke`, `den`, `cay`, `chau` | vật trang trí/đồ đạc (khai báo `place`) |
| `ruong` | vật đặt ở nhánh cụt |
| `tham` | phủ nền đi được |
| `mai` | lớp phủ trên cao |

## 4. Cách đặt (`place`) — mặc định, gói có thể ghi đè trong `rules.json`
- `wall` dựa tường · `center` giữa phòng · `corner` góc · `free` tự do · `edge` mép
- `clear`: số ô phải để trống trước mặt (cửa mặc định 3)
- `maxDensity`: tỉ lệ ô có vật tối đa (mặc định 15% trong phòng, 10% ngoài sân)

## 5. Họ bố cục và vai trò cần có
| họ bố cục | cần |
|---|---|
| `phong-noi-hanh-lang` | nen, tuong, cua |
| `san-don` / `san-doi` | nen, tuong (+ cay/den tuỳ chọn) |
| `san-bac` | nen, nen-cao, bac, tuong, cong |
Quy tắc: gói đủ vai trò thì app mở họ bố cục đó; thiếu thì app nêu rõ thiếu vai trò nào.

## 6. Quy ước toạ độ (để mọi gói khớp nền)
- Vật được đặt theo ô (x,y); điểm `anchor` của ảnh trùng **tâm ô**.
- Độ lệch giữa ảnh và tâm ô là việc của bước nhập gói (app tự bù khi đọc `anchor` và `tile`), bộ dựng không cộng/trừ tay.
- Độ cao `z` (px) chỉ nâng hình lên; app chưa có độ cao va chạm thật.

## 7. Việc app làm khi nhận zip
1. Đọc `pack.json`, kiểm `format`, kiểm mọi `png` tồn tại.
2. Kiểm vai trò: báo mảnh thiếu dữ liệu (không `footprint`, không `anchor`…).
3. Sinh bộ nền và bộ vật thể nội bộ, lưu cùng dự án.
4. Hiện danh sách họ bố cục dựng được với gói này; bấm là dựng, tự kiểm lối đi.

## 8. Chuyển gói hiện có
- **Thiếu Lâm:** `manifest.json` của tác giả → `pack.json` (đổi `kind` thành `role`, giữ footprint/anchor/rise).
- **Kenney (4 gói):** viết `pack.json` theo cùng định dạng từ các vai trò script đang đoán; bạn duyệt lại danh sách vai trò trước khi dùng.

## 9. Gói dựng sẵn từ SBS / mẫu miễn phí (thư mục `packs/`)
- Bộ dựng: `tools/sbs/build_all.py` (+ `lib.py`). Mỗi gói ra một zip có `pack.json` riêng; `packs/index.json` liệt kê gói và các gói không nạp (kèm lý do).
- `at` giúp mảnh Đông/Tây (hoặc Nam/Bắc) dùng chung một ảnh, chỉ khác chỗ đặt; khung canvas do bộ dựng tính từ toàn bộ mảnh.
- `col` (seg/rect/circle/poly) toạ độ theo hệ E, gốc ở tâm ô, tự xoay theo `dir` — dùng cho cửa vòm (hai trụ hai bên lỗ cửa).
- Quy ước đặt tường: ảnh nghiêng `\` gán cạnh Đông và Tây, ảnh `/` gán Nam và Bắc; điểm chân là giữa đường chân tường nội suy từ đáy hai đầu ảnh (không dùng cột giữa vì cửa vòm rỗng ở đó).
- Nạp trong app: tab 💾 Tệp → "📚 Gói 2D có sẵn".
