# Tiêu chí dựng cảnh 2D

Mở **Kho gói có sẵn → Tiêu chí dựng cảnh** để xem 43 mục và mức hỗ trợ. Danh mục trong [settlementCriteria.js](../src/settlementCriteria.js) là nội dung hiển thị trong Xưởng.

- **Kiểm tự động** có kiểm tra hoặc quy tắc riêng trong bộ sinh.
- **Kiểm một phần** chỉ kiểm được phạm vi hiện có của lưới, tài nguyên và chuyển động.
- **Công cụ 2D hiện có** dùng các phép kiểm của trình dựng tay, xem [Quy tắc đặt vật thể 2D](quy-tac-dat-vat-the-2d.md).
- **Cần dữ liệu hoặc công cụ bổ sung** áp dụng cho phần chưa có trong Xưởng.

## Bộ sinh ngoại thất

Phố chợ có vòng đường, trạm có nhánh tới đích, đường rừng có nhiều khúc ngoặt. Cùng mã, kiểu màn, địa hình, kích thước và gói tài nguyên tạo lại cùng cảnh trong phiên bản bộ sinh này.

Bộ sinh đặt đường trước rồi thử lô nhà. Cả mặt bằng lẫn khung hình tường và mái ở phép chiếu isometric được kiểm khi chọn lô. Dấu chân nhà phải nằm trên đất khô, ngoài đường và cách lô khác. Cây được thử theo kích thước tán ước lượng và khung hình hiển thị. Xưởng bỏ ứng viên che tim tuyến hoặc giao nhà. Khung ảnh là bao ngoài bảo thủ. Cảnh thiếu đất có thể đặt ít nhà hoặc cây hơn mục tiêu.

Nền bờ, nền đất sân và nền chính được chọn riêng. Kích thước mặt bằng nhà thay đổi theo vai trò. Bộ ghép dùng bộ ngoại thất chữ nhật SBS Town, giữ điểm neo ảnh. Lối vào hiện dẫn tới mép lô. Cửa, nội thất, tường chung, móng trên địa hình nhiều cao độ và các điểm tương tác theo chức năng cần hồ sơ mảnh tương thích.

## Mặt nước, cầu và di chuyển

Cầu nâng có bản mặt gỗ, mố, dốc lên xuống và lan can. Ô nước vẫn được vẽ dưới cầu. Đường và cầu hiện rộng một ô. Khung kiểm dùng nhân vật bán kính 0,28 ô. Chế độ Chơi dùng cùng cao độ để đặt chân nhân vật và tính điểm bấm trên mặt cầu. Mỗi cảnh có nước dùng một cầu thẳng. Bộ sinh hiện không tạo bến thuyền.

## Kiểm sau khi sửa

Nút **Kiểm** dùng dữ liệu tuyến và lô đã đi cùng màn. Nút này kiểm vùng nước, hình học cầu, vùng chặn trên dấu chân, vị trí các mảnh nhà, khoảng trống của đường cho nhân vật và khung nhà/cây trong hình chiếu isometric. Vi phạm có mã quy tắc, tên và tọa độ. Bộ sinh thử lại lô và cảnh. Nếu vẫn có vi phạm, màn được đánh dấu bản nháp khi dựng xong.

Cảnh từ phiên bản cũ có thể mở và sửa. Dựng lại để có dữ liệu nghiệm thu tuyến và cầu. Kiểm thử tự động chưa thay thế việc chơi thử bằng các tư thế và trạng thái cửa khác nhau.

## Tài nguyên chạy bộ sinh

Bản Xưởng triển khai có sẵn kho tài nguyên. Khi chạy bản mã nguồn riêng, cần thêm kho được quyền sử dụng ở cạnh HTML. Đường dẫn tương đối là `packs/index.json`, `packs/kenney-isometric-roads.zip`, hai gói `packs/sbs-isometric-town-*.zip`, gói nền và đạo cụ đã chọn, cùng `scenery/Settlement-Trees.zip`.
