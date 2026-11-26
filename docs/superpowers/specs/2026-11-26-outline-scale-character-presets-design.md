# Tự động hiệu chỉnh tỉ lệ + Chọn nhân vật + Lưu bộ chọn (Đường Bao)

## Vì sao
Bảng "Tự phối vật liệu Đường Bao" (`src/outlineEditor.js`) cho chọn ZIP/mảnh riêng cho
Nền, Phủ nền, Tường bao, Vật dụng, Nhà — nhưng kích thước hiển thị của mỗi mảnh
(`tileWidth` → `sc` trong `entity()`, `src/scenePacks.js`) hoặc do gói tự khai báo,
hoặc do app đoán theo tỉ lệ khung ảnh (`art.w/.95, art.h/1.65` cho mọi vật dụng bất kể
loại). Không có cơ chế nào đối chiếu tỉ lệ giữa các gói, nên khi phối Kenney Dungeon +
Kenney Library + StoneKingdoms, người/bàn/nhà có thể lệch cỡ rõ rệt.

Mục tiêu: (1) tự động quy mọi gói về cùng một tỉ lệ thực, lấy **cửa** làm điểm neo
chính, dự phòng điểm neo khác khi cửa không đáng tin; (2) thêm cột **Nhân vật** dùng
đúng kiểu giao diện các cột hiện có, vừa để hiển thị vừa làm thước đo chuẩn; (3) cho
lưu/mở lại một **bộ chọn đã đặt tên** (mọi cột + tỉ lệ), không chỉ nhớ theo từng bản đồ
như hiện tại (`map.cfg.outlineMaterials`).

## Mục tiêu / không làm
- Có: hiệu chỉnh tỉ lệ tự động theo gói nguồn (không theo từng vật riêng lẻ), có nút
  chỉnh tay khi tự động sai; cột Nhân vật trong chính bảng Đường Bao; lưu/mở/xoá bộ
  chọn đặt tên, lưu trong IndexedDB (`thk_store`, theo đúng cách `idbGet/idbSet` đã có).
- Không làm: không thay sprite nhân vật thật trong lúc chơi (`play2d.js`/`play3d.js`) —
  nhân vật ở đây chỉ hiện trong bản xem trước của Đường Bao làm mốc đối chiếu và làm
  điểm neo tỉ lệ. Nếu sau này muốn nhân vật này thay luôn hình người chơi lúc chơi thật,
  đó là việc khác, làm sau.
- Không xây bảng tra chiều cao theo từng loại vật (phương án 3 đã bỏ, chọn phương án 2).

## Ràng buộc
- Phải tương thích ngược: bản đồ cũ không có `scaleAnchors`/`characters` vẫn mở và
  hiển thị y như trước (coi như hệ số hiệu chỉnh = 1).
- Giữ đúng mẫu code hiện có: hàm ngắn, không class, không thêm phụ thuộc ngoài.

## Các phương án đã cân nhắc (đã chọn cùng người dùng)
1. **Thanh trượt tỉ lệ thủ công mỗi gói** — đơn giản nhất nhưng không "tự động".
2. **Tự hiệu chỉnh theo điểm neo** (đã chọn): mỗi gói nguồn tự dò một vật mốc có tỉ lệ
   thật khá chuẩn mực để suy ra pixel/ô của *cả gói*, áp cho mọi mảnh cùng gói.
3. Bảng tra chiều cao theo từng loại vật — chính xác hơn nhưng tốn công bảo trì, không
   chọn.

Trong phương án 2, thứ tự điểm neo (người dùng đã đồng ý cần dự phòng nhiều điểm neo):
1. **Cửa** (`cua`/door trong Tường bao hoặc Nhà) — chuẩn kiến trúc khá đồng nhất.
2. **Tường** (chiều cao đoạn tường thẳng) — khi gói không có cửa nhận ra được.
3. **Nhân vật trong cùng gói** — khi gói đó tự có hình người (hiếm nhưng có, ví dụ gói
   nhân vật đi kèm scenery).
4. **Thủ công** — khi không có gì ở trên, hoặc người dùng thấy máy đoán sai: ô nhập hệ
   số tỉ lệ riêng cho gói đó, cạnh dòng trạng thái ghi rõ "đang theo: cửa / tường / tay".

Nhân vật chọn ở cột **Nhân vật** không thuộc gói nào cả — nó là mốc hiển thị cố định
(mặc định cao 1,20 ô, đúng quy ước "người chơi đứng" đã có trong README) để người dùng
so bằng mắt trong khung xem trước, không phải điểm neo "trong gói" của mục 3 ở trên.

## Thiết kế

### 1. Dữ liệu mô tả mảnh — mở rộng `outline-materials.json` (không bắt buộc)
Thêm, cạnh `floors`/`props`/`overlays`/`walls` đã có:
```json
{
  "doors": [{"path": "...", "height": 128}],
  "characters": [{"path": "...", "name": "...", "height": 128}]
}
```
`height` là px từ chân đến đỉnh trong ảnh đã cắt (bounding box), không bắt buộc — khi
thiếu, app tự đo bounding box của ảnh đã nạp (giống cách `bbox()`/`crop()` trong
`pack.js`/`scenePacks.js` đã làm) và coi khung đó là chiều cao vật đó.

### 2. Dò điểm neo tự động khi không có khai báo riêng
File mới `src/outlineAnchors.js`:
- `findDoorAnchor(pack)`: lọc ảnh trong catalog gói có tên khớp
  `/cua|door|gate|cong/i` và không bị loại bởi các bộ lọc đang có (ignored, structure
  v.v., trừ khi rõ ràng là cửa); đo chiều cao bounding box; trả `{px, realHeight: 1.47}`
  (1,47 ô ≈ cửa cao ~2,1 m với quy ước 1 ô ≈ 1,43 m suy từ "người chơi cao 1,20 ô" ≈
  1,7 m thật — hằng số này đặt ở đầu file, dễ chỉnh).
- `findWallAnchor(...)`: tương tự, lọc theo `/tuong|wall/i`, `realHeight` mặc định
  2,0 ô (tường trong nhà ~2,8–3 m, biên độ rộng hơn nên xếp sau cửa).
- `findCharacterAnchor(pack)`: lọc theo mẫu đặt tên nhân vật hiện đang bị loại trong
  `scenePacks.js` (`characters?/`), `realHeight=1.2`.
- `packScale(pack, manualOverride)`: thử theo thứ tự cửa → tường → nhân vật trong gói →
  `manualOverride ?? 1`; trả `{factor, via:'door'|'wall'|'character'|'manual'}` để hiển
  thị cho người dùng biết đang theo gì.

`factor = (realHeight tiêu chuẩn * TILE_UNIT) / chiều cao px đo được / tileWidth đoán
hiện có` — cụ thể: giữ nguyên cách tính `tileWidth` từng mảnh như hiện tại trong
`scenePacks.js`, rồi nhân thêm `factor` của gói nguồn mảnh đó vào bước dựng `sc` trong
`entity()`. Không đổi cách đoán hiện có cho từng mảnh (vẫn vậy), chỉ thêm một hệ số
sửa sai **chung cho cả gói** lên trên.

### 3. Áp dụng hệ số vào `scenePacks.js`
- `outlinePackMaterials(pack, profile, style)` nhận thêm `scale` (kết quả
  `packScale`) và nhân `factor` vào `tileWidth` tính cho từng prop/house/floor trước khi
  gọi `addSprite`/`groundTile`. Gói Kenney miniature "native" (đã có `tileWidth` khai
  báo đồng bộ nội bộ) vẫn tôn trọng `tileWidth` gốc của mảnh, chỉ nhân thêm `factor`
  lên trên — không đụng vào phần suy luận hiện có.
- Trả thêm `result.scale={factor,via}` để panel hiển thị trạng thái.

### 4. UI: cột Nhân vật
Trong `src/outlineEditor.js`, thêm vào mảng `rows`:
```js
const rows=[['floor','Nền',true],['overlay','Phủ nền',false],['wall','Tường bao',true],
  ['props','Vật dụng',true],['house','Nhà',false],['character','Nhân vật',true]];
```
`layerControls` dùng lại nguyên cấu trúc hiện có (source/gallery/Thử lần lượt/Trước/
Sau/Bỏ qua lớp) — không viết control mới. `editor.outlineLayerChoices('character', …)`
thêm nhánh đọc trong `ed2d.js`/`scenePacks.js` trả về các ảnh khớp mẫu nhân vật
(`findCharacterAnchor`/catalog mở rộng), mỗi ảnh hiển thị ở chiều cao chuẩn 1,20 ô
trong bản xem trước, bất kể gói nguồn.

### 5. UI: trạng thái + hiệu chỉnh tay theo gói
Dưới mỗi dòng `control.element` (hoặc một khối chung bên trên, theo nguồn — vì nhiều
dòng có thể cùng một gói), thêm một dòng nhỏ mỗi **gói nguồn đang dùng**:
`"<tên gói> · tỉ lệ theo: Cửa (tự động) ✓"` kèm nút "Chỉnh tay" mở một ô số (hệ số
0.5–2.0) — khi người dùng nhập, `via` đổi thành `'manual'` và được ghi nhớ trong preset.
Khung xem trước (`liveOutlineMap`/`drawOutlineDraft`) vẽ thêm bóng người tham chiếu cao
đúng 1,20 ô cạnh một vật bất kỳ mỗi khi bật tuỳ chọn "Hiện người đối chiếu" (checkbox
cạnh `dressing`).

### 6. Lưu / mở bộ chọn đặt tên
- Lưu trong `thk_store` qua `idbGet/idbSet` đã có, khoá cố định
  `'outline-material-presets'`, giá trị là mảng `{id, name, savedAt, data}` — `data`
  đúng hình dạng `materials()` hiện trả về (`layers`, `floorScale`, `matchJoints`) cộng
  thêm `character` (giống một `layer` nữa) và `scaleOverrides` (map tên gói →hệ số tay).
- UI: trong `materialsPanel`, thêm hàng `"Bộ đã lưu"`: `<select>` liệt kê preset đã lưu
  + nút **Mở**, **Lưu bộ hiện tại…** (dùng `ask()` có sẵn trong `util.js` để đặt tên),
  **Xoá**. "Lưu" ghi đè nếu trùng id đang mở, "Lưu bộ hiện tại…" luôn hỏi tên mới nếu
  không có id đang mở (bấm "Lưu" trên preset đang mở thì ghi đè không hỏi lại).
- "Mở" nạp `data` vào từng `layerControls` (set `control.ids`, `control.source.value`,
  gọi lại `refreshLayer`) + `floorScale`/`matchJoints`/`scaleOverrides`, y hệt cách
  `saved=map.cfg.outlineMaterials` đang nạp lúc mở bảng, chỉ khác nguồn dữ liệu.
- ZIP người dùng tự thêm (`outlineZipFiles`) không lưu được vào IndexedDB (File object
  không serialize gọn) — preset lưu theo `source` dạng `'zip:tên|cỡ|sửa-lúc'` như hiện
  tại; khi mở preset mà ZIP đó chưa được thêm lại trong phiên này, dòng tương ứng hiện
  "cần nạp lại ZIP" (đã có sẵn cơ chế này ở `refreshSources`), không có gì mới phải
  xử lý thêm ở đây.

## Việc còn để người làm tự quyết (cal của tôi, ghi lại để biết)
- Hằng số `TILE_UNIT`/chiều cao chuẩn cửa-tường-nhân vật đặt ở đầu `outlineAnchors.js`,
  có thể chỉnh sau khi thấy preview thực tế.
- Vị trí vẽ bóng người đối chiếu trong canvas xem trước: góc dưới bên trái, cố định,
  không che bản vẽ chính.
- Khi hai dòng khác cột lấy cùng một gói nguồn, trạng thái tỉ lệ chỉ tính và hiện một
  lần cho gói đó (không lặp lại mỗi dòng).
