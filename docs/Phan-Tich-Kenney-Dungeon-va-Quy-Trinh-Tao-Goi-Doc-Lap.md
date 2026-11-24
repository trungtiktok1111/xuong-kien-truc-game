# Kenney Isometric Miniature Dungeon
## Giải phẫu toàn bộ ZIP và quy trình sản xuất gói isometric 2D độc lập

### Tóm tắt kết quả

Bản đính kèm `kenney_isometric-miniature-dungeon(1).zip` trùng SHA-256 với ZIP Dungeon đã phân tích trước đó. Tên trong `License.txt` là **Dungeon Pack (2.3)**, với ngày tạo ghi trong tệp là **15-02-2019**. Lần này kiểm tra đến từng mục trong ZIP, ZIP lồng và tar của Unity, tổng cộng **903 mục**, gồm **869 tệp và 34 mục thư mục**. Bảng kiểm kê CSV đi kèm ghi từng đường dẫn, mục đích, kích thước, hộp alpha nếu có và SHA-256 của từng tệp.

Phát hiện quan trọng nhất là **hai mẫu dựng cảnh đóng gói tài nguyên riêng**. Tiled và Unity dùng chung 11 ảnh mẫu, khác bộ sprite Dungeon chính. Ngay cả hai cầu thang cùng tên cũng khác pixel. Tiled có đủ đường dẫn và ảnh nội bộ. Unity có đầy đủ liên kết nội bộ cho **scene mẫu**, nhưng **prefab Tile Palette có GUID tham chiếu không tồn tại trong gói**. Khi thiết kế gói mới, nên giữ ý tưởng cảnh mẫu tự chứa của Kenney và bổ sung kiểm tra tham chiếu để tránh lỗi này.

| Cấp lưu trữ | Tệp | Thư mục | Tổng |
|---|---:|---:|---:|
| ZIP Dungeon ngoài cùng | 753 | 5 | 758 |
| Bên trong `Tiled Sample.zip` | 13 | 1 | 14 |
| Bên trong `Unity Sample.zip` | 1 | 0 | 1 |
| Bên trong `Unity Sample.unitypackage` | 102 | 28 | 130 |
| **Tổng** | **869** | **34** | **903** |

Tệp ZIP lồng được tính là một mục ở cấp chứa nó. Các mục bên trong được tính riêng vì mỗi mục có chức năng và đường dẫn riêng. Tổng cộng đã giải mã **791 payload PNG**, kể cả thumbnail Unity. Hộp alpha trong CSV dùng hệ góc trên trái `x0,y0,x1,y1`, trong đó mép phải và mép dưới là tọa độ loại trừ. Hộp alpha là kết quả đo pixel, chỉ dùng để kiểm hình. Nó có thể bao cả bóng và phần nhô ra.

## 1. Mười một mục ở cấp gốc trong ảnh người dùng gửi

| Đường dẫn | Nội dung và mục đích | Vai trò khi tích hợp |
|---|---|---|
| `Angle/` | 288 PNG môi trường, 72 tên gốc × bốn hướng. | Bộ phối góc thay thế. Định dạng khung ảnh giống `Isometric`, nhưng mặt sàn và vật thể dùng phép chiếu khác. |
| `Characters/` | Thư mục cha của `Male/`. | Tách tài nguyên chuyển động khỏi các mảnh môi trường. |
| `Isometric/` | 288 PNG môi trường, 72 tên gốc × bốn hướng. | Bộ đồ họa chính để ráp vào lưới hình thoi. |
| `Samples/` | Hai ZIP chứa mẫu Tiled và Unity. | Cung cấp bài mẫu về cấu hình nhập và cách sắp mảnh. |
| `Information.png` | Sơ đồ kỹ thuật 640 × 592. Ghi PNG 256 × 512, mặt ô 256 × 128, render 30°–45°–0°, nhãn cạnh của ô và sơ đồ tám hướng nhân vật. | Quy cách nhập mảnh. Giải thích vì sao có vùng trống trên các sprite thấp. |
| `Instructions.url` | Lối tắt Windows chứa URL `https://kenney.nl/documentation/game-assets/isometric`. Có thêm IDList, HotKey và trường Explorer. | Trỏ tới hướng dẫn bên ngoài. Kết quả phân tích hiện tại dựa vào dữ liệu mẫu nằm trong ZIP. |
| `Kenney.url` | Lối tắt Windows tới `http://www.kenney.nl/`. | Đường dẫn tác giả. |
| `License.txt` | Tên, phiên bản, ngày tạo, tác giả, CC0 và đường dẫn hỗ trợ. Nội dung ghi được sử dụng cho mục đích cá nhân, giáo dục, thương mại, ghi công tự nguyện. | Thông tin xuất xứ và giấy phép khi đóng gói dự án. |
| `Patreon.url` | Lối tắt tới `https://www.patreon.com/kenney/`. | Đường dẫn hỗ trợ tác giả. |
| `Preview.png` | Bảng giới thiệu mảnh rời 918 × 515. Mảnh được bày tách nhau để nhìn hình dạng và loại. | Dùng để duyệt nhanh phạm vi bộ tài nguyên. |
| `Sample.png` | Ảnh cảnh lắp ghép 918 × 515 có sàn đá, tường, vòm, cầu thang, kết cấu và đạo cụ. | Dùng để xem cách phối mảnh trong một cảnh hoàn chỉnh. Tệp là ảnh minh họa của Dungeon. Map Tiled và scene Unity là một cảnh kỹ thuật khác. |

## 2. Toàn bộ sprite môi trường

Tất cả 576 PNG môi trường là **PNG indexed palette có độ trong suốt**, khung **256 × 512**. Mỗi tên gốc có đúng `_E`, `_N`, `_S`, `_W` trong cả hai thư mục. Không có cặp cùng tên/cùng hậu tố giữa `Angle` và `Isometric` cho ảnh RGBA giống nhau. Ví dụ, ở `stoneTile_E`, biên alpha của `Isometric` bắt đầu tại y=364, còn `Angle` tại y=308. Mặt sàn ở `Isometric` hiện hình thoi. Ở `Angle` nó hiện gần hình chữ nhật. Game chọn một phép chiếu cho một cảnh, và bộ còn lại có thể được giữ để dùng khi cần góc khác.

Bảng này là danh mục đầy đủ **72 tên gốc**, không kể tên hướng. CSV mở rộng từng nhóm thành từng đường dẫn.

| Họ mảnh | Tất cả tên gốc | Công dụng khi dựng |
|---|---|---|
| Nền đất và đá | `dirt`, `dirtTiles`, `stone`, `stoneCorner`, `stoneInset`, `stoneLeft`, `stoneRight`, `stoneMissingTiles`, `stoneSide`, `stoneSideUneven`, `stoneSteps`, `stoneStep`, `stoneTile`, `stoneUneven` | Nền nguyên, nền có chi tiết, dải nối đá–đất, góc, ô lõm, lỗ và phần nền gồ ghề. Mảnh có lỗ cần được quy định riêng về đường đi. |
| Ván và cầu | `planks`, `planksBroken`, `planksHole`, `bridge`, `bridgeBroken` | Sàn gỗ và nhịp qua khe. Có biến thể intact/hỏng/lỗ về hình. Khả năng qua cầu do dữ liệu gameplay quyết định. |
| Bậc | `stairs`, `stairsAged`, `stairsCorner`, `stairsSpiral` | Bậc thẳng, bậc cũ, góc bậc, thang xoắn. Dùng cùng dữ liệu cao độ, đầu nối và phía tiếp cận nếu muốn đi được. |
| Cột và gỗ đỡ | `stoneColumn`, `stoneColumnWood`, `woodenSupportBeams`, `woodenSupportsBeam`, `woodenSupportsBlock`, `woodenSupports` | Trụ riêng, khung có dầm, khung nhiều trụ. Trụ là điểm va chạm, dầm trên đầu cần thứ tự che riêng ở game đi xuyên bên dưới. |
| Tường đá thẳng, biên và góc | `stoneWall`, `stoneWallAged`, `stoneWallAgedLeft`, `stoneWallAgedRight`, `stoneWallBroken`, `stoneWallBrokenLeft`, `stoneWallBrokenRight`, `stoneWallColumn`, `stoneWallColumnIn`, `stoneWallCorner`, `stoneWallHalf`, `stoneWallTop`, `stoneWallHole`, `stoneWallStructure` | Kéo dài vách, nối góc, gắn cột, thay đầu đoạn, tạo hư hỏng, đổi chiều cao biểu kiến hoặc gắn phần đỡ gỗ. Biến thể hình không tự thay đổi cạnh chặn. |
| Tường cong, vòm và cửa sổ | `stoneWallRound`, `stoneWallRoundBroken`, `stoneWallRoundWindow`, `stoneWallArchway`, `stoneWallWindow`, `stoneWallWindowBars` | Tạo biên cong, ô thoáng và vòm. Đường chân tường cong và khoảng hở cần hình học riêng nếu game cho đi tự do. |
| Cửa vòm | `stoneWallDoor`, `stoneWallDoorBars`, `stoneWallDoorClosed`, `stoneWallDoorOpen` | Cùng kiểu lối vòm với khung trống, song chắn, cánh đóng, cánh mở. Phù hợp mô tả cùng một đối tượng có nhiều trạng thái. |
| Cổng rộng | `stoneWallGate`, `stoneWallGateBars`, `stoneWallGateClosed`, `stoneWallGateOpen` | Bốn biến thể lối rộng với đầu cột/khung cùng hệ. |
| Bàn ghế | `chair`, `tableRound`, `tableRoundChairs`, `tableRoundItemsChairs`, `tableShort`, `tableShortChairs`, `tableChairsBroken` | Có mảnh lẻ và tổ hợp đã ghép. Cụm ghép đặt nhanh. Mảnh lẻ dùng khi ghế hoặc mặt bàn cần tương tác độc lập. |
| Vật chứa và đồ kho | `barrel`, `barrels`, `barrelsStacked`, `chestClosed`, `chestOpen`, `woodenCrate`, `woodenCrates`, `woodenPile` | Đạo cụ thấp, cụm xếp chồng, rương đóng/mở. Rương đổi sprite tại cùng vị trí. Kiểm sát chân bệ khi chuyển trạng thái. |

Điểm sản xuất đáng học là **có một hệ cạnh nối, một hệ trạng thái và một hệ biến thể**. Tường thẳng có thể thay bằng cửa hoặc cửa sổ tại một cạnh. Sàn nguyên có thể thay bằng ô có hư hỏng. Mảnh đồ nội thất có thể đổi từ riêng lẻ sang cụm. Trước khi làm nhiều biến thể, phải chốt footprint và điều kiện ráp với mảnh bên cạnh.

## 3. Toàn bộ sprite nhân vật

`Characters/Male/` chứa **168 PNG indexed có độ trong suốt, đều 256 × 512**. Cấu trúc tên `Male_{hướng}_{hành động}{khung}.png`. Mỗi hướng có đúng một `Idle0`, mười `Run0…9` và mười `Pickup0…9`.

| Chỉ số | Hướng trên màn hình theo sơ đồ | Tệp cho mỗi hướng |
|---|---|---:|
| 0 | Phải-trên, N | 21 |
| 1 | Phải | 21 |
| 2 | Phải-dưới, E | 21 |
| 3 | Xuống | 21 |
| 4 | Trái-dưới, S | 21 |
| 5 | Trái | 21 |
| 6 | Trái-trên, W | 21 |
| 7 | Lên | 21 |

`Idle0` cho tư thế đứng. `Run` cho chuỗi khung chạy. `Pickup` cho chuỗi nhặt. Bộ phân phối chỉ có PNG, vì vậy engine cần dữ liệu thời lượng frame, quy tắc lặp, hướng nhìn, điểm neo, thời điểm nhận vật và xử lý chuyển động. Tên của khung không quy định FPS. Biên alpha thay đổi qua từng khung, do chân tay đổi tư thế và do ảnh có phần nhìn thấy khác nhau. Giữ một điểm gốc logic cho toàn bộ hành động và dựng theo crop offset nếu cắt khung. Dùng điểm thấp nhất của alpha ở từng ảnh sẽ có thể làm nhân vật nhảy vị trí.

## 4. Mở từng tệp của mẫu Tiled

### Sample.tmx

Map hữu hạn, Tiled khai báo bản lưu `2018.12.22`, định dạng `1.2`, lưới `isometric`, `renderorder=right-down`, kích thước **60 × 32**, ô **256 × 128 px**, màu nền `#3a3a3a`. Tham chiếu `Sample.tsx` bằng đường dẫn tương đối, `firstgid=1`. Mỗi lớp có 1.920 số CSV. Số 0 là ô trống. Có **51 lượt đặt tile** trên mọi lớp.

| Lớp theo thứ tự XML | ID | Ô có mảnh | Nội dung |
|---|---:|---:|---|
| `Second floor` | 6 | 4 | Bốn `floor_E` ở các ô (31,13), (32,13), (31,14), (32,14). Lớp dịch y=−78 px. |
| `Floor` | 7 | 32 | Cùng một tile nền `floor_E` lặp lại tạo mặt bằng chính. |
| `Walls` | 8 | 15 | Tường, cửa, cửa sổ, hàng rào, thùng, bậc và ô công tắc. Tên lớp dùng chung cho vật gắn trên nền. |

Ví dụ tại **(34,15)** có nền `floor_E` và `crate_E` trên hai lớp. Hai mảnh được lưu cùng tọa độ nhưng vẽ theo lớp của mình. `Second floor` minh họa nâng hình bằng offset riêng. File không khai báo lớp đối tượng, lưới điều hướng, trigger hay sự kiện qua tầng.

### Sample.tsx và toàn bộ Sprites/

Tileset là **collection of images**, thể hiện bằng `columns=0` và 11 mục `<tile>` trỏ từng PNG. Kích thước ảnh/tile khai báo 256 × 512. Trường `<grid orientation="orthogonal" width="1" height="1"/>` nằm trong **tileset**. Phép chiếu của **map** vẫn là isometric theo TMX. ID nội bộ 12–22, ra GID 13–23 trong map vì `firstgid=1`. Khi xử lý TSX, phải đọc ID đã lưu thay vì lấy thứ tự hàng làm ID.

| PNG trong `Sprites/` | ID TSX / GID TMX | Số lần đặt | Vai trò |
|---|---:|---:|---|
| `crate_E.png` | 12 / 13 | 1 | Thùng gỗ đặt trên nền, minh họa chồng lớp. |
| `doorway_E.png` | 13 / 14 | 1 | Khuôn cửa gắn vào dải tường. |
| `fence_W.png` | 14 / 15 | 3 | Đoạn hàng rào lặp. |
| `floor_E.png` | 15 / 16 | 36 | Nền ở sàn chính và sàn nâng. |
| `stairs_E.png` | 16 / 17 | 2 | Đoạn bậc theo hướng E. |
| `stairs_S.png` | 17 / 18 | 2 | Đoạn bậc theo hướng S. |
| `stairsCornerOuter_S.png` | 18 / 19 | 1 | Mảnh xử lý góc ngoài của dải bậc. |
| `switchFloorOn_E.png` | 19 / 20 | 1 | Hình công tắc sàn ở trạng thái bật. |
| `wall_E.png` | 20 / 21 | 2 | Đoạn tường thẳng lặp. |
| `wallCurve_S.png` | 21 / 22 | 1 | Đoạn tường cong. |
| `window_S.png` | 22 / 23 | 1 | Mảnh cửa sổ trong dải tường. |

Không có objectgroup va chạm hay frame animation khai báo trong TSX. Mười một ảnh này khớp từng byte với 11 ảnh Unity. Không ảnh nào khớp SHA-256 với các PNG môi trường ở hai thư mục chính. Chín ảnh có tên riêng, hai cầu thang cùng tên nhưng khác cả dữ liệu RGBA. Ví dụ trong `stairs_E`, mép alpha trên bắt đầu tại y=304 ở mẫu, y=305 ở bộ chính. Để mở mẫu Tiled, giữ `Sample.tmx`, `Sample.tsx` và thư mục `Sprites/` cùng cấu trúc.

## 5. Mở từng cấp bên trong mẫu Unity

`Unity Sample.zip` chỉ chứa `Unity Sample.unitypackage`. Nó là tar nén gzip. Bên trong có **28 nhóm GUID**. Trong từng nhóm, tên Unity được ghi trong `pathname`. UUID của thư mục đóng gói trùng trường `guid` của `asset.meta` ở cả 28 nhóm.

| Mục vật lý trong tar | Số lượng | Mục đích |
|---|---:|---|
| Thư mục GUID | 28 | Gom các thành phần của mục được Unity nhập. |
| `pathname` | 28 | Chỉ đường dẫn cần khôi phục trong `Assets/`. |
| `asset.meta` | 28 | Giữ GUID và cấu hình importer tương ứng. |
| `asset` | 24 | Dữ liệu thực của 11 texture, 11 Tile, một scene và một prefab. |
| `preview.png` | 22 | Thumbnail riêng của 11 texture và 11 Tile để xem trong bộ nhập. |

Bốn nhóm chỉ đại diện cho thư mục dự án. Chúng là `Assets/Sample`, `Assets/Sample/Scenes`, `Assets/Sample/Tiles` và `Assets/Sample/Tiles/Palette`. Từng nhóm có `asset.meta` và `pathname` mà không có payload `asset`. CSV chỉ rõ GUID và từng file vật lý của cả 28 nhóm.

### 11 texture PNG và 11 Tile

Mỗi tên dưới đây xuất hiện hai lần về mặt logic, một `.png` và một `.asset`, đều trong `Assets/Sample/Tiles/`. Danh sách đầy đủ là `crate_E`, `doorway_E`, `fence_W`, `floor_E`, `stairsCornerOuter_S`, `stairs_E`, `stairs_S`, `switchFloorOn_E`, `wallCurve_S`, `wall_E`, `window_S`.

- **Texture PNG** mang hình. Metadata của cả 11 ảnh ghi Sprite single, 256 Pixels Per Unit, mipmap tắt, alpha transparency bật, không tag atlas. Trường serialized `spritePivot` là `(0.5,0.5)` cùng `alignment=7`. Khi tái lập, giữ cả cấu hình importer và anchor của Tilemap. Đọc riêng giá trị pivot rồi áp cho engine khác có thể đặt lệch ảnh.
- **Tile YAML** mang tham chiếu từ mỗi Tile sang texture tương ứng bằng GUID. Cả 11 cặp GUID đã được đối chiếu. Tile màu trắng, ma trận đồng nhất, không gắn prefab GameObject, có `m_ColliderType=1`. Đây là thiết lập từng Tile. Scene mẫu không chứa thành phần Tilemap Collider hay script chơi riêng.
- **Thumbnail** có đường dẫn vật lý riêng và SHA-256 trong CSV. Thumbnail phục vụ xem trước. Sprite được scene truy cập qua Tile và GUID của ảnh nguồn.

### Assets/Sample/Scenes/Sample.unity

Scene chứa `camera`, `grid`, `tiles`, `sun` và cấu hình scene. Camera trực giao, `orthographic size: 2`; Grid có `m_CellLayout=3`, kích thước ô `(1,0.5,0.01)`; Tilemap có `Tile Anchor=(0,0,0)`; renderer ghi `m_SortOrder=3` và `m_Mode=1`. Các số là giá trị lưu trong mẫu đời cũ. Có thể đối chiếu chúng khi tái nhập trên phiên bản Unity đích. Scene có **51 lượt đặt tile**, chia:

| z của ô trong Unity | Số lượt | Thành phần |
|---:|---:|---|
| 0 | 37 | 32 nền, 2 bậc E, 2 bậc S và 1 góc bậc ngoài. |
| 1 | 10 | 3 hàng rào, 2 tường thẳng, khuôn cửa, cửa sổ, tường cong, thùng và ô công tắc. |
| 122 | 4 | Bốn ô nền ở phần sàn nâng. |

Unity dùng Z của ô trong một Tilemap để bố trí các phần sàn và vật thể. Tiled dùng các layer và độ lệch pixel. Hai mẫu dùng cùng nhóm hình và số lượng tile nhưng khác cách lưu. **Không dùng `122` như số pixel hay thông số độ cao phổ quát**. Cả 11 GUID Tile và 11 GUID sprite đang được scene tham chiếu đều có trong kho, ngoài các tham chiếu đối tượng tích hợp của Unity.

### Assets/Sample/Tiles/Palette/Sample Palette.prefab

Prefab chứa Grid cấu hình `(1,0.5,1)`, Tilemap `Layer1` và `Palette Settings`. Grid và palette lưu bố cục để người dựng chọn mảnh. Dữ liệu thực có **12 ô**, và **12 GUID Tile của các ô này đều vắng mặt trong tar**. Mảng tham chiếu ảnh của prefab có thêm **12 GUID sprite cũng vắng mặt**. Đây là kết quả đối chiếu tĩnh, chưa mở bằng Unity để quan sát biểu hiện cụ thể trên phiên bản hiện nay. Trường hợp nhập trên dự án sạch, cách làm đáng tin cậy là tạo lại Tile Palette từ 11 Tile đi kèm, lưu GUID mới trong prefab, rồi kiểm tra lại map và palette. Không thay GUID của texture hoặc Tile đang được scene dùng.

## 6. Kết luận về cách Kenney tổ chức đầu ra

- **Lõi sản phẩm** là các họ mảnh ghép có cùng chuẩn ảnh, đủ biến thể hướng và đủ phần nối. Dungeon có ground, biên/tường, cửa, mảnh cao, cầu/bậc, props và nhân vật. Một dự án nhỏ có thể chọn gói này làm nguồn hình môi trường và nhân vật.
- **Tài liệu kỹ thuật** khóa kích thước và hướng. **Preview** trả lời có những mảnh gì. **Sample.png** cho thấy hình ghép khi dùng mảnh. **Mẫu engine** giúp kiểm cấu hình, cấu trúc tệp và cách đặt ô.
- Hai ZIP mẫu có byte giống nhau trong bốn gói Dungeon, Farm, Library và Bases đã đối chiếu. Một bài mẫu kỹ thuật có thể dùng lại cho cả một dòng sản phẩm. Khi làm gói mới, kèm thêm một cảnh kiểm đúng các họ mảnh của gói đó để chứng minh khả năng dựng độc lập.
- **Độc lập có hai nghĩa cần kiểm**. Độc lập về tài nguyên là có đủ ảnh và dữ liệu tương thích để dựng cảnh trong phạm vi công bố. Độc lập về gameplay cần thêm luật và mã chạy. Các mẫu Kenney cho thấy cách nhập và bố trí hình, nhưng không chứa hệ thống nhân vật, cửa tương tác, nhặt đồ hay chuyển tầng chạy được.
- Các tệp xác nhận kích thước, góc render ghi trên sơ đồ và tổ chức đầu ra. Bộ ZIP không cung cấp dự án nguồn tạo hình, rig, file vật liệu hay cấu hình render gốc. Quy trình bên dưới bám cấu trúc đã xác minh và áp dụng được cho sản xuất thuần 2D.

## 7. Quy trình tự tạo một gói isometric 2D độc lập

| Công đoạn | Việc thực hiện | Đầu ra và phép kiểm |
|---|---|---|
| **1. Chốt phạm vi gói** | Viết một cảnh cần dựng bằng riêng gói này. Ví dụ một phòng đá có đường vào, bậc, cửa mở/đóng và một kho nhỏ. Lập danh mục những phần cần để cảnh tự đứng được. | Catalog phân theo ground, chuyển tiếp, biên, góc, lối mở, cao độ, props và character nếu phạm vi có nhân vật. |
| **2. Khóa mẫu lưới** | Dùng hình thoi 256 × 128, khung 256 × 512, điểm neo theo tâm hoặc một mốc mặt bằng được ghi rõ. Khóa hướng chiếu sáng và hệ trục. Tạo ô chuẩn, chân vách, bốn cạnh, cao độ đỉnh, giới hạn canvas. | Tệp nguồn tham chiếu và `Information.png`. Dịch ô theo (128,64) hoặc (−128,64), khoảng cách giữ nhất quán. |
| **3. Ráp phần nhỏ trước** | Vẽ sàn nguyên, một góc, một cạnh chuyển nền, tường thẳng, góc tường, một cửa, một bậc, một prop. Tạo đủ các mảnh cơ bản để ráp phòng thử. | Phòng ráp từ PNG gốc kín mép, các cạnh nối đúng, cửa và bậc nằm đúng vị trí. |
| **4. Hoàn thiện hình theo họ** | Dựng các mặt 2D theo đường lưới, sau đó thêm vật liệu, sáng tối và bóng. Với mỗi hướng, dựng lại mặt nhìn thấy. Giữ mốc chân khi đổi trạng thái. Với nhân vật, khóa origin theo chuỗi frame. | Sheet duyệt hình theo họ, PNG trong suốt, hướng nhất quán, bản outline nối được, các trạng thái đăng ký cùng điểm neo. |
| **5. Thêm dữ liệu dùng trong game** | Mỗi ID có đường dẫn, phép chiếu, hướng, anchor, footprint, cạnh nối, tầng hoặc điều kiện đặt. Cửa ghi biến thể hình và cạnh chặn, bậc ghi đầu nối cao độ. Nhân vật ghi frame, thời lượng, lặp và sự kiện nếu cần. | Manifest và schema/README có đơn vị. Không có ID trùng hoặc tham chiếu thiếu. |
| **6. Đóng mẫu từng trình biên tập** | Tiled: TMX, TSX, PNG đi cùng đường dẫn tương đối. Unity: Grid, sprites, Tile assets, map scene và palette có đủ metadata. Có thể tạo adapter khác từ cùng manifest. | Mỗi mẫu mở từ thư mục/project sạch. Đối chiếu tất cả ID/GUID và cả scene lẫn palette. |
| **7. Kiểm trong game thử** | Cho nhân vật hoặc con trỏ thử bấm ô, đi qua cửa, đi trước/sau tường và qua bậc nếu có. Kiểm từ trước camera đến các mức zoom dùng thật. | Nền không hở, cửa đổi đồ họa và va chạm cùng lúc, vật cao che đúng, vùng đi được không bị chặn sai, mọi điểm đích đi tới được. |
| **8. Đóng bản phát hành** | Ghi phiên bản, giấy phép, danh sách tệp, ảnh mảnh rời, ảnh cảnh ghép, mẫu nhập và hướng dẫn. Kèm tệp nguồn chỉnh sửa tùy mục tiêu. | Giải nén thử vào đường dẫn mới, dựng được cảnh từ riêng ZIP, rồi mới chốt phiên bản. |

### Hợp đồng tối thiểu cho lập trình

Dữ liệu bên dưới là ví dụ cho gói mới. Mọi giá trị số phải được xác nhận bằng sprite thực của gói.

```json
{
  "formatVersion": 1,
  "projection": {"tilePx": [256,128], "canvasPx": [256,512]},
  "assets": {
    "ruins.door.north": {
      "kind": "edge",
      "edge": "+j",
      "sourceAnchorPx": [128,428],
      "connectors": ["stone-wall", "stone-wall"],
      "states": {
        "closed": {"png": "Isometric/door_closed_N.png", "blocksEdge": true},
        "open": {"png": "Isometric/door_open_N.png", "blocksEdge": false}
      }
    }
  }
}
```

Trong hệ tọa độ tài liệu này, `X=128(i−j)`, `Y=64(i+j)−elevationPx`, trước khi cộng vị trí camera/gốc và trừ anchor để đặt ảnh. Cạnh ví dụ `+j` nối một ô với hàng xóm có j lớn hơn. Hình dạng thật của cửa quyết định các phần khung mà nhân vật có thể đi qua. Hệ có thể dùng cạnh chặn nếu đi theo ô, hoặc đa giác va chạm mặt bằng nếu đi tự do. Với sprite atlas, bổ sung khung nguồn và offset crop để khôi phục neo. Chiều cao logic, va chạm và thứ tự che không nên suy trực tiếp từ khung trong suốt.

### Sơ đồ thư mục bàn giao

```text
TenGoi-1.0/
  README.md
  License.txt
  Information.png
  Preview.png
  Sample.png
  Isometric/
  Angle/                  nếu có phép chiếu thứ hai
  Characters/             nếu phạm vi có nhân vật
  Data/
    manifest.json
    example-map.json
  Samples/
    Tiled Sample.zip      nếu hỗ trợ Tiled
    Unity Sample.zip      nếu hỗ trợ Unity
```

Nếu kèm bộ mẫu nhập nhỏ dùng chung, giữ tài nguyên mẫu trong chính mẫu đó và đặt tên rõ. Giữ một **cảnh riêng dùng các ảnh của gói thật** trong `Data/` hoặc `Samples/`. Từ dự án sạch, phải nạp đủ gói, thử đúng cửa và bậc thực của gói, mở palette, rồi kiểm rằng tên trùng giữa ví dụ và bộ chính không làm trình nhập lấy nhầm.

### Tiêu chí giao và phạm vi kiểm chứng

1. Mỗi mục được công bố đều có tệp, đủ hướng/trạng thái đã cam kết và giấy phép rõ.
2. Nền lặp theo cả hai trục, ráp góc trong/ngoài và mảnh chuyển tiếp, không hở.
3. Cửa mở/đóng không đổi điểm neo. Bản đồ và kiểm tra đi lại cùng nhận đúng trạng thái.
4. Bậc và sàn nâng có đầu nối cao độ đúng. Phép thử lên xuống bao gồm hình, va chạm và thứ tự che.
5. Trình nhập mở được ở dự án sạch, không cần thư mục riêng của người làm. Palette và scene đều qua kiểm GUID.
6. `Preview.png` cho thấy mảnh rời, `Sample.png` cho thấy cảnh đủ, dữ liệu map cho phép tái dựng hoặc kiểm tương đương.
7. Mỗi phiên bản có bảng kiểm tệp, kết quả thử và cấu hình engine thực tế đã xác nhận.

Lần phân tích này kiểm CRC của ba ZIP, giải mã mọi PNG, đối chiếu RGBA tại các trường hợp trùng tên, đọc TOC và GUID của tar Unity, và đọc dữ liệu TMX/TSX và YAML. Phân tích Unity/Tiled là kiểm tra cấu trúc và tham chiếu qua tệp. Chưa chạy các editor đó để xác nhận hình trong phiên bản hiện hành. Những tiêu chí chạy editor và gameplay ở trên là bước nghiệm thu bắt buộc đối với **gói mới do mình tạo**, trước khi gọi nó là gói độc lập đã kiểm chứng.


### Nguyên tắc chung để dựng và nghiệm thu bối cảnh game

Áp dụng sáu nhóm dưới đây cho mọi bối cảnh game được dựng bằng bộ tài nguyên. Với từng nhóm, chọn tình huống kiểm theo bố cục, vật thể và cơ chế thực tế của cảnh. Các ví dụ như cửa, bậc và mái áp dụng khi cảnh có những cấu kiện đó.

| **Nhóm** | **Cần kiểm gì?** |
|---|---|
| **Bố cục và lối đi** | Đường chính, đường phụ và khoảng trống hợp lệ đều đi được. Bề rộng đường giữ đúng qua các đoạn rẽ. |
| **Lắp ghép tài nguyên** | Nền kín mép, tường và góc ráp đúng, trụ chạm sàn, cửa và mái khớp điểm neo. |
| **Cao độ và va chạm** | Chân bám bậc. Nhân vật đi đúng tầng, luồn qua khe đủ rộng và bị chặn ở mép sân, tường, cột và cánh cửa. |
| **Che khuất** | Chạy ngang đầu cánh cửa, vòng góc tường và qua dưới mái. Quan sát cả chuỗi chuyển động để phát hiện khung bị che sai hoặc đổi lớp đột ngột. |
| **Camera và hiển thị** | Theo nhân vật, xem toàn cảnh và phóng gần mà vẫn đọc được đường đi, hình ảnh và phản hồi tương tác. |
| **Chạy thực tế** | Mở đúng bản bàn giao trên trình duyệt hoặc môi trường chạy đích, chơi qua các tuyến và đối chiếu kết quả với bài kiểm tra mã. |

Ghi riêng kết quả kiểm thử tự động và kết quả quan sát trực tiếp trên bản bàn giao. Với mục chưa chạy hoặc không áp dụng, ghi rõ trạng thái và lý do.


### Quy tắc chung về vùng chặn theo hình học vật thể

**Vùng chặn bám phần hình học mà nhân vật có thể va vào trên mặt bằng, ở đúng tầng, hướng và trạng thái.** Ô logic dùng để đặt mảnh và ráp cảnh. Phần sàn trống trong cùng ô vẫn đi được nếu đủ chỗ cho nhân vật. Với một mảnh chiếm trọn ô theo thiết kế, hình chặn có thể phủ cả ô.

| Dữ liệu | Mục đích |
|---|---|
| `footprintCells` | Số ô dùng để bố trí mảnh trên lưới. |
| `collision` | Hình chặn thực tế khi chơi, tính theo tọa độ mặt bằng cục bộ từ điểm neo logic. Khai báo hình tròn, chữ nhật, đa giác hoặc đoạn có độ dày, kèm đơn vị, tầng hoặc khoảng cao cần xét. |
| `placementClearance` | Vùng cần để trống khi bố trí, chẳng hạn khoảng trước cửa để app tránh đặt bàn. Quy tắc này chỉ hạn chế đặt vật. |

- **Chọn hình theo phần chiếm chỗ.** Chân đèn dùng hình tròn theo chân đế, kệ dùng hình chữ nhật theo đáy, tường dùng dải theo chân tường. Bóng đổ và phần hình tràn ra được xử lý trong hiển thị. Với mái hoặc xà, dùng khoảng cao để xác định nhân vật có lọt bên dưới hay không.
- **Áp dụng cùng biến đổi với vật thể.** Dịch hình chặn đến đúng vị trí và xoay theo hướng đặt trên mặt bằng trước khi chiếu ra màn hình. Cửa đóng chắn ngang lối. Khi mở, hình chặn đi theo từng cánh và khe giữa thông nếu đủ rộng.
- **Tính theo kích thước đối tượng di chuyển.** Kiểm va chạm trên cả đoạn di chuyển, kể cả khi đi nhanh. Với nhân vật hình tròn bán kính `r`, có thể mở rộng vùng chặn thêm `r` rồi kiểm tuyến của tâm. Lối đi hợp lệ thay đổi theo kích thước đối tượng.
- **Dùng chung dữ liệu trong game.** Điều khiển trực tiếp, tìm đường và lớp hiển thị kiểm thử cùng đọc dữ liệu va chạm và trạng thái hiện tại. Thứ tự vẽ dùng dữ liệu che khuất riêng.
- **Tạo mẫu theo họ vật thể.** Các biến thể có cùng phần chiếm chỗ dùng chung một mẫu hình chặn. Các cỡ dùng chung loại hình với tham số kích thước khác nhau. Tạo ngoại lệ khi hình học, điểm neo hoặc trạng thái thực sự thay đổi. Mảnh chưa có dữ liệu va chạm được đánh dấu **chưa hiệu chỉnh** để app biết khi chọn mảnh tự động.

**Nghiệm thu theo họ vật thể.** Chạy thẳng vào vật từ các phía để xác nhận bị chặn, đi sượt cạnh để xác nhận phần sàn trống còn dùng được, thử khe đủ và thiếu rộng với các kích thước nhân vật phù hợp. Với cửa, thử từng cánh ở cả hai trạng thái và đi qua khe khi mở. Nếu có nhiều tầng, thử các vị trí chồng hình trên màn hình nhưng khác cao độ. Đối chiếu vùng hiển thị và đường tìm được với kết quả di chuyển trực tiếp.

## 8. Chuẩn triển khai và kiểm thử demo isometric

Áp dụng các quy tắc dưới đây khi dựng demo dùng một hoặc nhiều gói. Kiểm những cơ chế có trong phạm vi cảnh. Với cơ chế vắng mặt, ghi rõ lý do không áp dụng.

### 8.1. Chuẩn tối thiểu của bản demo

Bản bàn giao có điểm xuất phát hợp lệ, hướng dẫn điều khiển, nút đặt lại và các mốc kiểm tra trên tuyến chính lẫn lối phụ. Cung cấp camera **Toàn cảnh** và **Theo nhân vật**, nút hiện lưới, lớp **Vùng đi**, lớp **Va chạm** và nút **Tự kiểm** hoặc bộ test kèm bản giao. Lớp vùng đi thể hiện nơi tới được, nơi chưa tới được và các cạnh hoặc hình cản theo đúng trạng thái hiện tại. Điều khiển, tìm đường và lớp kiểm tra dùng cùng dữ liệu. Kiểm chuyển camera, đổi kích thước cửa sổ, mất focus, chơi trọn tuyến và đặt lại.

### 8.2. Hợp đồng manifest năm phần

| Phần | Trường cần khai báo và cách dùng |
|---|---|
| Vai trò | Mỗi mảnh có ID ổn định và vai trò như nền, tường, cửa, kệ hoặc bệ. App chọn theo vai trò khai báo. |
| Kích thước, hướng và neo | Ghi diện tích bố trí theo ô, biến thể hướng, đường dẫn ảnh và điểm neo của ảnh. Ghi kích thước khung nguồn và độ lệch cắt nếu dùng atlas. |
| Độ cao | Ghi cao độ mặt đứng, khoảng cao chặn nếu cần, đầu nối thấp/cao và hướng của bậc hoặc dốc. Dữ liệu chưa hiệu chỉnh được đánh dấu rõ. |
| Luật đặt | Ghi vị trí tương đối với nền, cạnh tường hoặc cấu kiện đỡ. Khai báo khoảng cần chừa để bố trí riêng với hình va chạm khi chơi. |
| Họ bố cục | Ghi vai trò bắt buộc và điều kiện kèm theo như trạng thái cửa hoặc đầu nối tầng. App đối chiếu trên tổ hợp gói đang dùng và báo rõ vai trò, hướng hoặc đầu nối còn thiếu. |

### 8.3. Điểm neo và mép nối khi phối gói

Dùng chung phép chiếu và quy ước lưới. Hiệu chỉnh điểm neo theo mốc tiếp đất của từng họ mảnh, rồi tính vị trí ảnh từ tọa độ chiếu, điểm neo và cao độ. Áp dụng độ hiệu chỉnh đúng một lần. Kiểm bản ráp ở chỗ hai gói tiếp nhau, gồm mặt sàn, mép nền, chân tường và mảnh nối tầng. Cùng kích thước PNG vẫn có thể có vị trí chân khác nhau trong khung ảnh.

### 8.4. Va chạm cho sprite có nhiều cấu kiện

Một sprite có thể khai báo một tập hợp hình chặn cục bộ. Cửa vòm dùng hai hình chặn ở chân trụ và để khe giữa thông theo bề rộng nhân vật. Cửa động có hình chặn của từng cánh theo góc và trạng thái. Cụm cây dùng hình chặn cho các thân hoặc phần mặt bằng thực sự chiếm chỗ và giữ lối đủ rộng giữa các luống. Mái, xà, vách và trụ có vai trò và khoảng cao riêng. Kiểm lối dưới mái bằng khoảng thông đứng và xử lý lớp che bằng dữ liệu vẽ.

### 8.5. Nhấp sàn để di chuyển

Quy đổi điểm nhấp từ màn hình về mặt bằng theo camera hiện hành và cao độ bề mặt. Phân biệt nhấp chọn đích với kéo camera. Xác nhận điểm thuộc sàn, đủ chỗ và có tuyến đi được. Báo rõ khi điểm bị chặn hoặc chưa có đường. Khi người chơi dùng phím, chuyển sang điều khiển tay và hủy tuyến tự động. Kiểm phép chọn điểm ở cả hai chế độ camera, trên sân cao và quanh các mép tầng.

### 8.6. Tuyến chạy chéo và bỏ góc rẽ thừa

Khi toàn bộ đoạn tới đích thông, cho nhân vật chạy thẳng. Khi có vật cản, tìm đường theo tám hướng, rồi bỏ điểm rẽ thừa nếu đoạn nối vẫn hợp lệ. Kiểm toàn tuyến theo kích thước nhân vật, cạnh chặn và liên kết cao độ để đường chéo qua được khe hợp lệ và dừng trước góc tường. Kiểm hướng hoạt ảnh theo chuyển động thực tế.

### 8.7. Thoát góc kẹt và tìm đường lại

Lưu đích độc lập với danh sách điểm rẽ. Nếu đoạn tiếp theo bị chặn, tính lại từ vị trí chân hiện tại và tiếp tục tới đích qua lối còn thông. Khi cửa hoặc vật cản đổi trạng thái giữa đường, kiểm lại tuyến và tìm đường vòng nếu cần. Nếu mọi lối đều bị chặn, dừng an toàn, báo chưa có đường và giữ đích để thử lại khi trạng thái liên quan thay đổi. Kiểm cả trường hợp đứng sát góc mà điểm chân nằm giữa các điểm lấy mẫu của lưới.

### 8.8. Kiểm thử hồi quy và bằng chứng nghiệm thu

| Tình huống | Kết quả mong đợi |
|---|---|
| Nhấp sàn để bắt đầu đi | Khung hình tiếp tục vẽ đủ nền, vật thể và nhân vật. Dấu đích hiển thị và vòng cập nhật tiếp tục. |
| Đích ở hướng chéo, đường trống | Nhân vật tới đích bằng một đoạn. |
| Gặp góc tường, cửa vòm hoặc bậc | Tuyến vòng đúng vật cản, đi qua khe cửa và lên đúng cao độ. |
| Kẹt sát vật cản hoặc đóng cửa giữa đường | Nhân vật giữ đích, tính lại và đi tiếp nếu có lối. Khi đường bị chặn hoàn toàn, báo và thử lại khi trạng thái thay đổi. |
| Đi qua trước, sau và ngang cạnh vật cao | Thứ tự che khuất chuyển đúng trong cả chuỗi chuyển động. Kiểm các khung sát cánh cửa, góc tường và tủ. |

Ghi riêng kết quả kiểm logic, kiểm sự kiện và khung hình bằng mô phỏng, và kết quả quan sát trên bản bàn giao trong trình duyệt đích. Trong demo liên khu tới v5, các ca nhấp chọn đích, chạy chéo, qua cửa, lên bậc, thoát điểm kẹt và đổi tuyến khi đóng cổng đã được kiểm bằng mô phỏng. Che khuất sát cánh cửa hoặc tủ và hành vi trực quan trên Cốc Cốc vẫn cần xác nhận trực tiếp.
