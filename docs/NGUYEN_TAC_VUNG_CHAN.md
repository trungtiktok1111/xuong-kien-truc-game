# Nguyên tắc vùng chặn (va chạm) theo nền tài nguyên

1. Vùng chặn bám đúng NỀN thật của hình (phần chạm đất), không bám ô lưới.
2. Phải phủ HẾT nền: nhà = cả mặt bằng (kể cả cột, hiên); cây = gốc + rễ + đá quanh gốc; bụi cây = cả bụi + đá; giếng = cả bệ đá.
3. Hình dạng theo vật: cây/bụi = hình tròn (elip trên mặt đất iso); nhà, giếng, sạp = đa giác/hình thoi/xéo (4 góc đo trên hình: BASEQ); tường = dải mỏng.
4. Vật lớn hoặc có chỗ hở (cổng làng) = tách thành nhiều đa giác nhỏ (`zps`), chừa lối đi đúng chỗ.
5. Chỉ vật đi được thật (sân luyện, cầu, bến gỗ) mới đặt `walk` (không chặn).
6. Mỗi vật: đo từ chính hình (alpha đáy), không đoán; chụp đối chiếu vùng đỏ với hình trước khi giao.
7. Dữ liệu: `zp` (1 đa giác) hoặc `zps` (nhiều đa giác) tính từ góc trước (x+1,y+1); engine: decoZones() -> free()/blocked(); builder: tools/levels/build_l1_iso.py.
8. Màn 1 tải với `cache:'no-store'` để không dính dữ liệu cũ.
