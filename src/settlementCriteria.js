// Status reflects which part of the workshop can verify the criterion today.
const active='Kiểm tự động';
const partial='Kiểm một phần';
const editor='Công cụ 2D hiện có';
const pending='Cần dữ liệu hoặc công cụ bổ sung';
export const settlementCriteria=[
  ['Tọa độ, kích thước và vùng dành chỗ',[
    [partial,'Một hệ tọa độ cho điểm neo, chiều rộng, chiều sâu, cao độ và hướng.'],
    [partial,'Lưu riêng dấu chân, vùng va chạm, phần vươn ra và vùng cần để trống.'],
    [partial,'Cập nhật điểm neo và vùng chặn khi đổi ảnh, vị trí, tỷ lệ hoặc hướng.'],
    [partial,'Dùng kích thước nhân vật và phương tiện để xác định khoảng hở.'],
    [partial,'Chồng lớp khác cao độ chỉ khi có khoảng hở và kết cấu đỡ.'],
    [partial,'Tự dựng từ mảnh đã biết vai trò và thông số tương thích.']
  ]],
  ['Địa hình, nền và phân khu',[
    [partial,'Xác định đất khô, bờ, nước, cao độ, dốc và vùng cấm trước khi chia lô.'],
    [active,'Dành tuyến đường, lô công trình và sân trước khi đặt cây, đạo cụ.'],
    [editor,'Nền, móng, bậc hoặc kết cấu đỡ phù hợp với dấu chân công trình.'],
    [partial,'Tổ chức khu ở, chợ, sân, kho, rừng hoặc bến theo công dụng và kết nối.'],
    [partial,'Chọn nền theo phân khu và dành vật liệu riêng cho bờ, sân và đường.'],
    [partial,'Khớp mảnh mép, góc, lề và mảnh chuyển tiếp giữa các vật liệu.']
  ]],
  ['Đường, ngã rẽ và lối vào',[
    [partial,'Phân vai đường chính, đường nhánh, lối vào nhà và lối đi bộ, với bề rộng phù hợp.'],
    [partial,'Giữ lòng đường và tầm nhìn trục đường khi đặt nhà, tường, cây và đạo cụ.'],
    [active,'Kiểm khoảng trống dọc tuyến sau khi bố trí mọi vùng chặn.'],
    [partial,'Khớp đầu đường, đoạn thẳng, góc và giao lộ. Đổi cao độ cần bậc hoặc dốc.'],
    [partial,'Lối dẫn tới mép lô. Nhà có nội thất cần mặt tiền quay về cửa hoặc cổng tiếp cận được.'],
    [partial,'Đầu cụt phải dẫn đến điểm có mục đích và các tuyến bắt buộc phải kết nối.'],
    [partial,'Xuất phát, đích và điểm tương tác cần chỗ đứng và tầm nhìn.']
  ]],
  ['Sông, suối, cầu và bến',[
    [active,'Dòng nước liền mạch và mảnh bờ nối theo hướng dòng.'],
    [active,'Đường vượt nước bằng mặt cầu riêng, nối với hai đầu đường trên đất khô.'],
    [active,'Mặt cầu nhô cao, có mố và dốc ở hai đầu.'],
    [active,'Mặt nước dưới cầu, lòng nước hai bên chặn, mặt cầu đi được và lan can chặn lệch hướng.'],
    [active,'Kiểm trọn tuyến lên dốc, qua mặt cầu, xuống dốc và đủ chỗ cho nhân vật.'],
    [pending,'Bến có lối lên xuống và điểm lên thuyền đúng cao độ.']
  ]],
  ['Nhà, tường, cổng và mái',[
    [partial,'Chừa diện tích cho nhà, hiên, bậc, mái, lối vào và khoảng trước cửa.'],
    [partial,'Nhà tách rời có khoảng trống. Tường chung cần mảnh ghép tương thích.'],
    [partial,'Tường khớp góc, mái khớp mảnh đỡ và đúng hướng lắp.'],
    [editor,'Dựng tường trước, lắp cổng trên đoạn đủ dài, mở đúng khe và vùng chặn.'],
    [editor,'Cổng có vùng tiếp cận hợp lệ và điểm đến nếu chuyển màn.'],
    [editor,'Mái có hai phía được đỡ và phải được kiểm lại sau khi sửa điểm tựa.'],
    [editor,'Độ dày mái, cao độ mặt dưới, khả năng đi đứng, cúi và đặt vật.'],
    [partial,'Nhà ngoại thất có vùng cấm đi. Nhà nội thất cần cửa, sàn và che mái động.']
  ]],
  ['Cây, đạo cụ và che khuất',[
    [partial,'Giữ chỗ cho gốc, thân và tán. Kiểm tán cùng hình chiếu nhà và trục đường.'],
    [partial,'Thân riêng, tán có thể xen trong cụm. Mật độ phụ thuộc loại khu vực.'],
    [partial,'Đạo cụ đúng vùng sử dụng, chừa vị trí tương tác.'],
    [editor,'Vật cần mặt đỡ và vùng chặn phù hợp với chỗ nhân vật có thể chạm.'],
    [partial,'Sắp ảnh theo chiều sâu và cao độ, bảo vệ tầm nhìn tại các tuyến bắt buộc.']
  ]],
  ['Biến thể và nghiệm thu',[
    [partial,'Mỗi kiểu màn có mạng đường, điểm đích và mật độ riêng.'],
    [active,'Đổi mã tạo biến thể địa hình, tuyến, phân khu và vị trí nhà trong cùng bộ điều kiện.'],
    [partial,'Kiểm đường bằng bán kính nhân vật. Chơi thử để xác nhận cửa động, điều khiển và tư thế.'],
    [partial,'Kiểm mặt bằng và hình chiếu isometric trước khi thêm màn.'],
    [active,'Thử vị trí hoặc mảnh khác. Vi phạm còn lại có tên, tọa độ và trạng thái bản nháp.']
  ]]
];
