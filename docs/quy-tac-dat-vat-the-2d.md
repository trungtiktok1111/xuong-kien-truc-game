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

## Dựng cổng và tường

| Quy tắc | Hành vi trong Xưởng |
|---|---|
| Tuyến tường dựng trước | Dùng **W** hoặc **Dựng tuyến tường**, bấm lần lượt các góc. Bấm lại điểm đầu để khép vòng. Enter hoặc Esc kết thúc tuyến. |
| Cổng vòm Đá Xoáy lắp sau | Bấm **Lắp cổng vào tường** rồi rê lên đoạn tường đủ dài. Xưởng căn hai trụ theo tuyến và chỉ mở khoảng giữa hai trụ. Xóa cổng sẽ khép lỗ mở. |
| Chân tường cần sàn đỡ | Kiểm tra dọc tuyến tường và lấy đường bao sàn làm chuẩn nếu màn có đường bao. Với bản đồ ô, kiểm tra lớp Nền. |
| Cổng phải đi xuyên được | Khe giữa hai trụ rộng ít nhất 0,64 ô. Kiểm tra phần đường ở cả hai phía với bán kính 0,32 ô, bao gồm khoảng dự phòng cho bán kính nhân vật 0,28 ô. |
| Giữ khoảng trống quanh lối đi | Vùng chặn đã có, kể cả vùng vẽ tay và vật cảnh, không được chồng vào chân tường hoặc hành lang xuyên cổng. Công trình tránh che điểm xuất phát, đích, cửa chuyển màn, NPC và rương. |
| Bảo toàn dự án cũ | Cổng đã đặt giữ bố cục cũ. Có thể chọn vật cảnh đủ hai chân và bấm **Lắp cổng cũ lên tường** khi ở gần tuyến. Ảnh cổng nhận diện theo tên cần hồ sơ hai chân trụ trước khi đặt theo quy tắc này. |
| Vật thể rắn đặt riêng | Điểm chân cần nằm trên sàn. Không đặt đè lên điểm tương tác hoặc chắn hành lang xuyên qua cổng đã lắp. |
| Kiểm tra sau khi đổi bố cục | Nút **Kiểm** kiểm lại sàn, tường và lối đi của các cổng đã lắp, kể cả sau khi sửa sàn hoặc dán vùng. Chế độ Chơi và bản xuất dùng cùng hình học chặn với trình sửa. |

Phím **+ / −** hoặc **Shift + cuộn** đổi cỡ theo bước 10 điểm phần trăm. **T** hoặc **Alt + cuộn** đổi giữa hai hướng hiển thị bằng khung ảnh lật ngang và cập nhật chân trụ theo hướng mới. **Shift** khi đặt bám lưới ¼ ô. Với sprite có chữ hoặc hình bất đối xứng, khung lật sẽ lật cả chi tiết ảnh. Hồ sơ bậc, mái và cầu vẫn cần dữ liệu hình học và cao độ riêng.
