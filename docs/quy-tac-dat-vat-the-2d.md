# Quy tắc đặt vật thể 2D

## Tọa độ và điểm neo

- Ô `(i,j)` chiếm `[i,i+1) × [j,j+1)`. Vị trí chân, vùng chặn và bán kính nhân vật dùng đơn vị ô, có phần thập phân. Điểm giữa ô là `(i+.5,j+.5)`.
- Với isometric, `X=ox+(i-j)S`, `Y=oy+(i+j)S/2`. `S` là nửa bề rộng ô trên màn hình. Với Angle, hai trục màn hình lần lượt có hệ số `2S` và `2S×ANG_R`. Camera chỉ đổi phép chiếu.
- Vật cảnh nhập từ gói lưu hình chặn cục bộ theo mốc `(i+1,j+1)`. Khung ảnh và điểm neo dùng để vẽ. Vùng chặn và điều kiện bố trí là hai dữ liệu riêng.
- Ảnh vẽ trên lớp Vật thể được ráp theo nhóm liên thông 4 hướng. Tính điểm chân từ vị trí sprite trong chính nhóm đã vẽ, rồi đổi về tọa độ mặt bằng. Vùng chặn tự đổi khi di chuyển, lật hoặc xóa ô.
- Mô hình nhiều tầng cần cao độ mặt đứng và liên kết bậc/dốc. Lớp va chạm của bản này xử lý trên mặt bằng hiện hành.

## Chọn hình chặn

| Trường hợp | Quy tắc đang chạy |
|---|---|
| Vật cảnh có dữ liệu gói | Dùng các hình do gói khai báo. Trạng thái cửa, vật cho đi qua và phần phủ nền dùng quy tắc hiện hành của vật cảnh. |
| Ảnh lớp Vật thể có nhãn Chặn đường | Ước lượng chân từ dải pixel đủ đục sát đáy khung. Cột, cây, đèn dùng chân tròn. Tường dùng dải mỏng. Vật khối dùng chữ nhật. |
| Mái, bóng, trang trí cho đi qua, nền và ảnh không có nhãn đủ | Không sinh vùng chặn tự động từ lớp vẽ. |
| Cửa, vòm, bậc, cầu và dầm | Dùng dữ liệu vật cảnh hoặc vẽ vùng chặn riêng. Cửa vòm có thể có hai chân trụ và khe đi ở giữa. |
| Khung ảnh trong suốt, hỏng hoặc không đọc được | Không sinh hình chặn ước lượng. |

Giữ va chạm sát chân vật và kiểm với kích thước nhân vật. Chữ nhật và hình tròn là mặc định của các họ. Vật có nhiều chân cần tập hợp hình chặn. Lưu quy tắc theo họ và thông số kích thước để dùng lại cho các biến thể.

## Trình sửa, chơi và xuất

- Nút Va chạm (K) bật/tắt lớp ước lượng của ảnh vẽ cho từng màn. Màu cam thể hiện vùng ước lượng. Vùng vẽ tay và vùng vật cảnh có dữ liệu riêng.
- Mỗi màn xuất hình chặn đã quy đổi sang tọa độ bản đồ. Di chuyển trực tiếp, tìm đường khi chơi và lớp hiển thị kiểm sử dụng hình học đó. Trình kiểm tra dự án kiểm điểm xuất phát bằng hình học. Các phép kiểm kết nối cũ ở cấp ô vẫn mang tính sơ bộ.
- Kiểm vật từ nhiều phía, va chạm khi đi sát chân, khoảng trống cạnh vật, cửa mở/đóng, ảnh đã lật, xóa ô, lưu/mở lại và chơi bản xuất. Bộ kiểm thử sinh 100.000 tình huống cho tọa độ và tra va chạm của nhóm tự động.

Đối chiếu tài liệu «Kenney Isometric Miniature Dungeon», mục 7 và mục 8, cùng giao thức gói của Xưởng. Các mục bố trí tự động tránh nhau, khoảng trống trước cửa, liên kết nhiều cao độ và vật nhiều chân từ PNG cần dữ liệu hình học bổ sung.
