# Nguyên tắc vùng chặn (va chạm) theo nền tài nguyên

1. Vùng chặn bám đúng NỀN thật của hình (phần chạm đất), không bám ô lưới.
2. Phải phủ HẾT nền: nhà = cả mặt bằng (kể cả cột, hiên); cây = gốc + rễ + đá quanh gốc; bụi cây = cả bụi + đá; giếng = cả bệ đá.
3. Hình dạng theo vật: cây/bụi mọc trên đất = hình tròn (elip trên mặt đất iso); cây/bụi TRONG CHẬU = theo đúng hình chậu (vuông, chữ nhật, tròn, lục giác... đo 4 góc/đường viền đáy chậu như nhà); nhà, giếng, sạp = đa giác/hình thoi/xéo (4 góc đo trên hình: BASEQ); tường = dải mỏng.
4. Vật lớn hoặc có chỗ hở (cổng làng) = tách thành nhiều đa giác nhỏ (`zps`), chừa lối đi đúng chỗ.
5. Chỉ vật đi được thật (sân luyện, cầu, bến gỗ) mới đặt `walk` (không chặn).
6. Mỗi vật: đo từ chính hình (alpha đáy), không đoán; chụp đối chiếu vùng đỏ với hình trước khi giao.
7. Dữ liệu: `zp` (1 đa giác) hoặc `zps` (nhiều đa giác) tính từ góc trước (x+1,y+1); engine: decoZones() -> free()/blocked(); builder: tools/levels/build_l1_iso.py.
8. Màn 1 tải với `cache:'no-store'` để không dính dữ liệu cũ.
9. Bộ "Tạo bối cảnh" (gen2d.js buildIso) dùng cfg.catalog (xuất từ build_l1_iso.py): chỉ dùng ô nền/nhà/cây có vai trò, vùng chặn zp/zb đã đo; KHÔNG đoán nền theo màu. Chưa có danh mục thì báo lỗi, yêu cầu mở Màn 1 trước.
