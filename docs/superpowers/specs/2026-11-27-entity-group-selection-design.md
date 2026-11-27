# Giai đoạn 1 — Cụm vật ghép (nhóm chọn/xoá nguyên khối)

## Vì sao
Một "nhà" dựng tự động (`outlineDressing.js`) gồm nhiều thực thể riêng (tường, mái,
cửa…) ghép lại, hiện chỉ liên hệ với nhau qua quy ước đặt tên id
(`outline-house-<số>-<phần>`), không có gì ngăn người dùng xoá một phần mà bỏ sót
phần khác — đúng lỗi bạn gặp. Việc này cũng là nền cho Giai đoạn 2 (kéo-thả Nhà
thủ công trong Đường Bao) và yêu cầu "bấm Nhà chỉ chọn/xoá được cả cụm".

## Phạm vi
- Thêm trường `groupId` lên mỗi thực thể thuộc một cụm ghép (nhà, và sau này là
  nhà đặt tay ở Giai đoạn 2). Không đổi gì ở thực thể đơn lẻ (không có `groupId`
  thì hành xử y như cũ).
- `eraseEntity`/xoá theo scope: nếu thực thể có `groupId`, xoá toàn bộ thực thể
  cùng `groupId` trong một lần — không chỉ thực thể bị bấm trúng. Nếu một phần
  trong cụm bị chặn bởi luật đã có (vd "đoạn tường có cổng"), toàn bộ thao tác
  xoá cụm bị huỷ và báo lý do, giống cách một thực thể đơn lẻ bị chặn hiện nay.
- Thêm một **phạm vi xoá/chọn mới "Nhà"** cạnh các phạm vi đã có (Nền/Phủ nền/Vật
  thể/Mái-cửa/Vùng chặn/Đối tượng) trong bảng Xoá: bấm vào đó, chỉ các thực thể
  có `groupId` mới bắt được chuột/phím tắt xoá, và bấm trúng bất kỳ phần nào của
  cụm sẽ chọn/xoá nguyên cụm đó.
- **Không làm trong giai đoạn này**: di chuyển cả cụm cùng lúc (kéo một phần kéo
  theo cả nhà) — chỉ chọn/xoá, đúng như bạn mô tả. Việc di chuyển để sau nếu bạn
  cần.

## Cách làm
- `outlineDressing.js`: khi ghép các phần nhà (`house.ents.map(...)`), gắn
  `groupId:'outline-house-'+houseCount` lên từng phần, thay vì chỉ để lộ qua
  tiền tố id như hiện nay.
- `ed2d.js`:
  - `eraseEntity(e)`: khi `e.groupId`, kiểm tra toàn bộ nhóm trước (cùng các luật
    chặn đang áp cho từng thực thể), rồi xoá cả nhóm trong một lần `pushUndo()`
    (một bước hoàn tác, không phải nhiều bước nhỏ).
  - Thêm scope xoá mới `'house'` vào danh sách scope hiện có (nơi định nghĩa
    `eraseScope()`/`layerNames`/mảng tên hiển thị trạng thái) — bấm vào đó lọc
    theo `e.groupId` thay vì theo lớp vẽ (layer) như các scope khác.
  - Phím tắt: giữ nguyên phím Xoá/Delete đã có cho scope đang chọn; thêm một
    phím gợi nhớ (ví dụ `H`) để chuyển nhanh sang scope "Nhà" mà không cần mở
    bảng, theo đúng tinh thần ưu tiên phím tắt bạn nêu.

## Việc để người làm tự quyết
- Phím tắt cụ thể (`H` hay phím khác) — chọn phím chưa dùng, không trùng các
  phím hiện có (`B/V/E/K/P/F/Q/[/]/J` theo ảnh bạn gửi).
- Vị trí chính xác nút "Nhà" trong bảng Xoá/bảng lớp hiện có.
