import json, random, sys
sys.path.insert(0, '/home/claude/kn')
from scenes_build import Scene, ED

# ---- Bản đồ Địa lao theo nguyên tắc (mọi con số là ĐỀ XUẤT, chờ duyệt) ----
# Phòng: (tên, x0, y0, x1, y1). Hành lang rộng 2 ô.
ROOMS = {
    'A': (3, 20, 8, 25),    # phòng giam, xuất phát 6x6
    'B': (13, 17, 20, 24),  # sảnh canh 8x8
    'C': (14, 6, 19, 11),   # kho, nhánh phụ 6x6
    'D': (25, 14, 36, 22),  # phòng đích 12x9
}
HALLS = {
    'AB': (9, 22, 12, 23),   # ngang, dài 4
    'BC': (16, 12, 17, 16),  # dọc, dài 5
    'BD': (21, 20, 24, 21),  # ngang, dài 4
}
# Khung cửa: (loại, hướng cạnh, x, y)  S = cạnh sau-phải (phía bắc ô), E = cạnh sau-trái (phía tây ô)
ARCHES = [
    ('stoneWallArchway', 'E', 9, 22), ('stoneWallArchway', 'E', 9, 23),
    ('stoneWallArchway', 'E', 13, 22), ('stoneWallArchway', 'E', 13, 23),
    ('stoneWallArchway', 'S', 16, 17), ('stoneWallArchway', 'S', 17, 17),
    ('stoneWallArchway', 'S', 16, 12), ('stoneWallArchway', 'S', 17, 12),
    ('stoneWallArchway', 'E', 21, 20), ('stoneWallArchway', 'E', 21, 21),
    ('stoneWallGateOpen', 'E', 25, 20), ('stoneWallGateOpen', 'E', 25, 21),
]
PROPS = [  # (khóa, hướng, x, y)
    # A
    ('barrelsStacked', 'S', 4, 21), ('barrels', 'S', 5, 21), ('woodenCrate', 'S', 4, 25), ('chair', 'E', 7, 22),
    # B
    ('stoneColumn', 'S', 14, 18), ('stoneColumn', 'S', 19, 18), ('tableRoundChairs', 'S', 17, 21),
    ('woodenPile', 'S', 19, 24), ('barrel', 'S', 14, 24), ('barrels', 'S', 20, 18),
    # C
    ('woodenCrates', 'S', 15, 7), ('barrel', 'S', 19, 10), ('chair', 'S', 15, 10),
    # D
    ('stoneColumn', 'S', 27, 15), ('stoneColumn', 'S', 32, 15), ('stoneColumn', 'S', 27, 21), ('stoneColumn', 'S', 32, 21),
    ('barrelsStacked', 'S', 36, 22), ('woodenCrates', 'S', 36, 15), ('tableChairsBroken', 'S', 30, 18),
]
CHESTS = [('C', 18, 7), ('D', 35, 15)]
START = (5, 23)
GOAL = (34, 17)
W, H = 38, 30


def cells():
    fl = set()
    for r in list(ROOMS.values()) + list(HALLS.values()):
        for y in range(r[1], r[3] + 1):
            for x in range(r[0], r[2] + 1):
                fl.add((x, y))
    return fl


def build():
    N = 'kenney-dia-lao'
    sc = Scene('Địa lao 2', W, H, 11)
    sc.addnen(N); sc.addvat(N)
    fl = cells()
    rnd = random.Random(5)
    for (x, y) in sorted(fl):
        k = rnd.choice(['stone-nam', 'stone-đông', 'stone-bắc', 'stone-tây']) if rnd.random() < .97 else 'stonetile-nam'
        sc.floor(N, k, x, y)
    arch = {(a[2], a[3], a[1]) for a in ARCHES}
    # tường: chỉ hai cạnh sau
    for (x, y) in sorted(fl):
        nv = (x, y - 1) not in fl
        wv = (x - 1, y) not in fl
        if nv and wv:
            sc.put(N, 'stoneWallCorner', 'S', x, y); continue
        if nv and (x, y, 'S') not in arch:
            sc.put(N, wall_kind(rnd, fl, x, y, 'S'), 'S', x, y)
        if wv and (x, y, 'E') not in arch:
            sc.put(N, wall_kind(rnd, fl, x, y, 'E'), 'E', x, y)
    for (k, d, x, y) in ARCHES:
        sc.put(N, k, d, x, y)
    for (k, d, x, y) in PROPS:
        sc.put(N, k, d, x, y)
    sid, it = sc.item(N, 'chestClosed', 'S')
    for (_, x, y) in CHESTS:
        sc.ents.append({'id': 'c%d_%d' % (x, y), 't': 'chest', 'x': x, 'y': y, 'name': 'Rương', 'tile': {'sid': sid, 'idx': it['i']}, 'gives': 'hp', 'amt': 2})
    gs, gi = sc.item(N, 'stairsSpiral', 'S')
    sc.ents.append({'id': 'g0', 't': 'goal', 'x': GOAL[0], 'y': GOAL[1], 'name': 'Đích', 'tile': {'sid': gs, 'idx': gi['i']}})
    sc.start(*START)
    # ô ngoài sàn bị chặn để nhân vật không đi ra khoảng trống
    sc_blk = [0 if (i % W, i // W) in fl else 1 for i in range(W * H)]
    return sc, fl, sc_blk


def wall_kind(rnd, fl, x, y, d):
    # đầu đoạn tường không đặt cửa sổ
    if d == 'S':
        edge = (x - 1, y - 1) in fl or (x + 1, y - 1) in fl or (x - 1, y) not in fl or (x + 1, y) not in fl
    else:
        edge = (x - 1, y - 1) in fl or (x - 1, y + 1) in fl or (x, y - 1) not in fl or (x, y + 1) not in fl
    r = rnd.random()
    if r < .68: return 'stoneWall'
    if r < .84: return 'stoneWallAged'
    if r < .90: return 'stoneWallBroken'
    if edge: return 'stoneWall'
    return 'stoneWallWindow' if r < .96 else 'stoneWallWindowBars'


def check(sc, fl):
    rep = []
    ok = True
    ents = [e for e in sc.ents if e['t'] == 'deco']
    prop_cells = set()
    for e in ents:
        zb = e['zb']
        if e['name'] and zb[2] * zb[3] > 0 and abs(zb[2]) >= .5 and abs(zb[3]) >= .5 and zb[2] <= 1 and zb[3] <= 1 and zb != [-1, -1, 1, .25] and zb != [-1, -1, .25, 1]:
            if (zb[2] >= 1 and zb[3] >= 1) or (zb[2] == .6):
                prop_cells.add((e['x'], e['y']))
    # chồng đồ
    seen = {}
    dup = 0
    for e in ents:
        z = e['zb']
        if (e['x'], e['y']) in prop_cells and z not in ([-1, -1, 1, .25], [-1, -1, .25, 1]):
            seen[(e['x'], e['y'])] = seen.get((e['x'], e['y']), 0) + 1
    dup = [c for c, n in seen.items() if n > 1]
    rep.append(('Không đồ chồng ô', not dup, dup))
    ok &= not dup
    # đồ nằm trên sàn
    off = [c for c in prop_cells if c not in fl]
    rep.append(('Đồ nằm trên sàn', not off, off)); ok &= not off
    # tường trước
    front = [e for e in ents if e['name'].startswith('Tường') and 'N' in e['name'].split()[-1:]]
    # BFS
    def bfs(src, blocked):
        q = [src]; vis = {src}
        while q:
            c = q.pop()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                n = (c[0] + dx, c[1] + dy)
                if n in fl and n not in blocked and n not in vis:
                    vis.add(n); q.append(n)
        return vis
    vis = bfs(START, prop_cells)
    wide = set(prop_cells)
    for (x, y) in prop_cells:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            wide.add((x + dx, y + dy))
    wide.discard(START)
    visw = bfs(START, wide)
    rep.append(('Thông tuyến xuất phát → đích', GOAL in vis, GOAL)); ok &= GOAL in vis
    rep.append(('Thông tuyến rộng (chừa 1 ô quanh đồ)', GOAL in visw, GOAL)); ok &= GOAL in visw
    for (_, x, y) in CHESTS:
        r = (x, y) in vis
        rep.append(('Rương (%d,%d) tới được' % (x, y), r, '')); ok &= r
    # ô trước/sau khung cửa phải trống
    bad = []
    for (k, d, x, y) in ARCHES:
        ahead = (x, y); behind = (x - 1, y) if d == 'E' else (x, y - 1)
        for c in (ahead, behind):
            if c in prop_cells: bad.append(c)
        # ô tiếp sau phía trong phòng
        c2 = (x + 1, y) if d == 'E' else (x, y + 1)
        if c2 in prop_cells: bad.append(c2)
    rep.append(('Trước/sau khung cửa không có đồ', not bad, bad)); ok &= not bad
    # mật độ
    for nm, r in ROOMS.items():
        area = (r[2] - r[0] + 1) * (r[3] - r[1] + 1)
        n = sum(1 for c in prop_cells if r[0] <= c[0] <= r[2] and r[1] <= c[1] <= r[3])
        p = n / area
        rep.append(('Mật độ phòng %s: %d/%d = %d%%' % (nm, n, area, round(p * 100)), p <= .15, ''))
        ok &= p <= .15
    # hướng tường: chỉ S/E
    badw = [e['name'] for e in ents if e['name'].startswith('Tường') and e.get('f') and False]
    return ok, rep


if __name__ == '__main__':
    sc, fl, blk = build()
    ok, rep = check(sc, fl)
    for r in rep:
        print(('ĐẠT ' if r[1] else 'TRƯỢT'), r[0], r[2] if not r[1] else '')
    print('TỔNG', 'ĐẠT' if ok else 'TRƯỢT')
    sc.save('/home/claude/ed/scene/dia-lao-2.json')
    # gắn collision vào tệp
    fn = '/home/claude/ed/scene/dia-lao-2.json'
    o = json.load(open(fn)); o['collision'] = blk
    json.dump(o, open(fn, 'w'), ensure_ascii=False, separators=(',', ':'))
