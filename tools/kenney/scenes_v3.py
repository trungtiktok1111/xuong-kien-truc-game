import json, random, sys
sys.path.insert(0, '/home/claude/kn')
from scenes_build import Scene, ED

DIRS = ['-nam', '-đông', '-bắc', '-tây']
EDGE = ([-1, -1, 1, .25], [-1, -1, .25, 1], [-1, -1, 1, .45], [-1, -1, .25, 1])


class B:  # ngữ cảnh dựng một cảnh
    def __init__(s, name, W, H, seed):
        s.sc = Scene(name, W, H, seed); s.W = W; s.H = H; s.rnd = random.Random(seed)
        s.fl = set(); s.props = []; s.arches = []; s.zones = {}; s.chests = []
    def prop(s, pid, k, d, x, y):
        s.sc.put(pid, k, d, x, y); s.props.append((x, y, k))
    def wall(s, pid, k, d, x, y):
        s.sc.put(pid, k, d, x, y)


def chest_goal(b, pid, chest_tile, goal_tile, chests, goal, start):
    sc = b.sc
    sid, it = sc.item(pid, chest_tile, 'S')
    for (x, y) in chests:
        sc.ents.append({'id': 'c%d_%d' % (x, y), 't': 'chest', 'x': x, 'y': y, 'name': 'Rương', 'tile': {'sid': sid, 'idx': it['i']}, 'gives': 'hp', 'amt': 2})
    b.chests = list(chests)
    gs, gi = sc.item(pid, goal_tile, 'S')
    sc.ents.append({'id': 'g0', 't': 'goal', 'x': goal[0], 'y': goal[1], 'name': 'Đích', 'tile': {'sid': gs, 'idx': gi['i']}})
    sc.start(*start); b.start = start; b.goal = goal


# ===================== NÔNG TRẠI 2 =====================
def farm():
    G, F = 'kenney-co', 'kenney-nong-trai'
    b = B('Nông trại 2', 40, 30, 21); sc = b.sc
    sc.addnen(G); sc.addnen(F); sc.addvat(F)
    X0, Y0, X1, Y1 = 2, 2, 37, 27
    for y in range(Y0, Y1 + 1):
        for x in range(X0, X1 + 1):
            b.fl.add((x, y)); sc.floor(G, b.rnd.choice(['grass' + d for d in DIRS]), x, y)
    # đường đất 2 ô: sân xuất phát -> ngã tư -> cửa kho
    path = set()
    for y in range(22, 26):
        for x in range(4, 8): path.add((x, y))
    for y in (23, 24):
        for x in range(4, 21): path.add((x, y))
    for y in range(9, 25):
        for x in (19, 20): path.add((x, y))
    for y in (9, 10):
        for x in range(19, 24): path.add((x, y))
    for (x, y) in path: sc.floor(F, 'dirt' + b.rnd.choice(DIRS), x, y)
    # ruộng 8x6 + ngô phủ nền (không chặn)
    field = [(x, y) for y in range(15, 21) for x in range(9, 17)]
    for (x, y) in field: sc.floor(F, 'dirtfarmland-nam', x, y)
    for (x, y) in field:
        if (x + y) % 2 == 0 and (x, y) != (12, 17):
            sc.sc if False else sc.put(F, b.rnd.choice(['corn', 'cornYoung', 'cornDouble', 'corn']), None, x, y)
    # hàng rào ruộng: cạnh bắc + cạnh tây (chừa cổng 2 ô ở cạnh tây)
    for x in range(9, 17): sc.put(F, 'fenceLow', 'S', x, 15)
    for y in range(15, 21):
        if y not in (17, 18): sc.put(F, 'fenceLow', 'E', 9, y)
    # rào biên khu đất: cạnh bắc + cạnh tây
    for x in range(X0, X1 + 1):
        if x == X0: sc.put(F, 'fenceHigh', 'S', x, Y0)
        else: sc.put(F, 'fenceLow' if b.rnd.random() > .12 else 'fenceLowBroken', 'S', x, Y0)
    for y in range(Y0 + 1, Y1 + 1): sc.put(F, 'fenceLow' if b.rnd.random() > .12 else 'fenceLowBroken', 'E', X0, y)
    # nhà kho: x24..33, y5..12
    kx0, ky0, kx1, ky1 = 24, 5, 33, 12
    for y in range(ky0, ky1 + 1):
        for x in range(kx0, kx1 + 1):
            b.fl.add((x, y)); sc.floor(F, 'planks-nam', x, y)
    sc.put(F, 'woodWallCorner', 'S', kx0, ky0)
    seq = ['woodWall', 'woodWallWindow', 'woodWall', 'woodWall', 'woodWallWindowGlass', 'woodWall', 'woodWall']
    for i, x in enumerate(range(kx0 + 1, kx1 + 1)): sc.put(F, seq[i % len(seq)], 'S', x, ky0)
    door = [(kx0, 9), (kx0, 10)]
    for y in range(ky0 + 1, ky1 + 1):
        if (kx0, y) in door: sc.put(F, 'woodWallGateOpen', 'E', kx0, y); b.arches.append(('E', kx0, y))
        else: sc.put(F, ['woodWall', 'woodWall', 'woodWallWindow'][y % 3], 'E', kx0, y)
    b.prop(F, 'chimneyBase', None, 33, 6)
    for (k, x, y) in [('hayBalesStacked', 26, 6), ('hayBales', 32, 9), ('sack', 26, 11), ('hay', 29, 11), ('sacksCrate', 31, 6)]:
        b.prop(F, k, None, x, y)
    # đồ ngoài sân (thưa)
    for (k, x, y) in [('hay', 12, 11), ('hayBales', 14, 12), ('sacksCrate', 22, 20), ('hayBalesStacked', 27, 20), ('hay', 29, 22), ('sack', 31, 17), ('hayBales', 6, 12), ('sack', 5, 7)]:
        b.prop(F, k, None, x, y)
    b.zones = {'Kho': (kx0, ky0, kx1, ky1, .15), 'Sân': (X0, Y0, X1, Y1, .10), 'Ruộng': (9, 15, 16, 20, .10)}
    b.chests_cells = [(12, 17), (32, 11)]
    chest_goal(b, F, 'ladderStand', 'ladderStand', [(12, 17), (32, 11)], (30, 7), (5, 24))
    # va chạm: ngoài khu đất; mép nam + đông của kho (chỉ vào bằng cổng tây)
    blk = [0 if (i % b.W, i // b.W) in b.fl else 1 for i in range(b.W * b.H)]
    for x in range(kx0, kx1 + 1): blk[(ky1 + 1) * b.W + x] = 1
    for y in range(ky0, ky1 + 2): blk[y * b.W + kx1 + 1] = 1
    b.blk = blk
    b.walk = {(x, y) for (x, y) in b.fl if not blk[y * b.W + x]}
    b.openings = [(a[1], a[2], a[0]) for a in b.arches]
    return b


# ===================== THƯ VIỆN 2 =====================
LIB_ROOMS = {'A': (4, 14, 15, 24), 'B': (20, 14, 30, 23), 'C': (6, 4, 13, 9), 'D': (20, 4, 31, 10)}
LIB_HALLS = {'AB': (16, 19, 19, 20), 'AC': (9, 10, 10, 13), 'BD': (25, 11, 26, 13)}
LIB_ARCH = [('E', 16, 19), ('E', 16, 20), ('E', 20, 19), ('E', 20, 20),
            ('S', 9, 10), ('S', 10, 10), ('S', 9, 14), ('S', 10, 14),
            ('S', 25, 11), ('S', 26, 11), ('S', 25, 14), ('S', 26, 14)]


def lib():
    D, V = 'kenney-dia-lao', 'kenney-thu-vien'
    b = B('Thư viện 2', 36, 28, 31); sc = b.sc
    sc.addnen(D); sc.addvat(V); sc.addvat(D)
    for r in list(LIB_ROOMS.values()) + list(LIB_HALLS.values()):
        for y in range(r[1], r[3] + 1):
            for x in range(r[0], r[2] + 1): b.fl.add((x, y))
    for (x, y) in sorted(b.fl):
        sc.floor(D, 'planks' + b.rnd.choice(DIRS) if b.rnd.random() < .92 else 'planksbroken-nam', x, y)
    arch = {(a[1], a[2], a[0]) for a in LIB_ARCH}
    wallset = [('wallBooks', 40), ('bookcaseBooks', 20), ('bookcaseHalfBooks', 10), ('bookcaseEmpty', 8), ('bookcaseBooksLadder', 10), ('bookcaseGlass', 12)]
    def pick():
        r = b.rnd.random() * 100; a = 0
        for k, w in wallset:
            a += w
            if r < a: return k
        return 'wallBooks'
    for (x, y) in sorted(b.fl):
        nv = (x, y - 1) not in b.fl; wv = (x - 1, y) not in b.fl
        if nv and (x, y, 'S') not in arch: sc.put(V, pick() if not wv else 'wallBooks', 'S', x, y)
        if wv and (x, y, 'E') not in arch: sc.put(V, pick() if not nv else 'wallBooks', 'E', x, y)
    for (d, x, y) in LIB_ARCH: sc.put(V, 'wallDoorway', d, x, y); b.arches.append((d, x, y))
    # thảm phủ nền (không chặn)
    for y in (19, 20):
        for x in range(6, 14): sc.put(V, 'floorCarpet', None, x, y)
    for y in (6, 7):
        for x in range(23, 29): sc.put(V, 'floorCarpet', None, x, y)
    P = [  # A sảnh
        ('longTableDecoratedChairs', 7, 16), ('longTableChairs', 11, 16), ('candleStand', 5, 15), ('candleStandDouble', 14, 15),
        ('libraryChair', 14, 23), ('displayCase', 4, 18), ('bookStand', 9, 23),
        # B phòng đọc
        ('longTableDecoratedChairsBooks', 23, 17), ('longTable', 27, 17), ('longTableChairs', 23, 22), ('libraryChair', 28, 22),
        ('candleStand', 21, 15), ('displayCaseBooks', 30, 15), ('bookStand', 29, 20),
        # C kho
        ('bookStand', 7, 5), ('displayCaseBooks', 13, 7), ('candleStand', 6, 8), ('libraryChair', 12, 8),
        # D đích
        ('displayCaseSword', 22, 5), ('displayCaseSword', 30, 5), ('candleStandDouble', 21, 9), ('candleStandDouble', 31, 9), ('bookStand', 26, 9),
    ]
    for (k, x, y) in P: b.prop(V, k, None, x, y)
    b.zones = {n: (r[0], r[1], r[2], r[3], .15) for n, r in LIB_ROOMS.items()}
    chest_goal(b, D, 'chestClosed', 'stairsSpiral', [(12, 5), (29, 22)], (26, 5), (5, 23))
    b.blk = [0 if (i % b.W, i // b.W) in b.fl else 1 for i in range(b.W * b.H)]
    b.walk = set(b.fl)
    b.openings = [(a[1], a[2], a[0]) for a in LIB_ARCH]
    return b


def check(b):
    rep = []; ok = True
    def add(n, c, d=''):
        nonlocal ok
        rep.append((n, c, d)); ok &= bool(c)
    pc = {(x, y) for (x, y, k) in b.props}
    # chồng đồ
    cnt = {}
    for (x, y, k) in b.props: cnt[(x, y)] = cnt.get((x, y), 0) + 1
    add('Không đồ chồng ô', all(v == 1 for v in cnt.values()), [c for c, v in cnt.items() if v > 1])
    add('Đồ nằm trong vùng đi được', all(c in b.fl for c in pc), [c for c in pc if c not in b.fl])
    # chest & goal & start trùng đồ
    special = set(b.chests) | {b.goal, b.start}
    add('Rương/đích/xuất phát không đè đồ', not (special & pc), list(special & pc))
    def bfs(src, blocked):
        q = [src]; vis = {src}
        while q:
            c = q.pop()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                n = (c[0] + dx, c[1] + dy)
                if n in b.walk and n not in blocked and n not in vis: vis.add(n); q.append(n)
        return vis
    vis = bfs(b.start, pc)
    wide = set(pc)
    for (x, y) in pc:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)): wide.add((x + dx, y + dy))
    wide -= {b.start}
    visw = bfs(b.start, wide)
    add('Thông tuyến xuất phát → đích', b.goal in vis)
    add('Thông tuyến rộng (chừa 1 ô quanh đồ)', b.goal in visw)
    for c in b.chests: add('Rương %s tới được' % (c,), c in vis)
    bad = []
    for (x, y, d) in b.openings:
        a = (x, y); bh = (x - 1, y) if d == 'E' else (x, y - 1); c2 = (x + 1, y) if d == 'E' else (x, y + 1)
        for c in (a, bh, c2):
            if c in pc: bad.append(c)
    add('Trước/sau cửa không có đồ', not bad, bad)
    for n, z in b.zones.items():
        area = (z[2] - z[0] + 1) * (z[3] - z[1] + 1)
        cnum = sum(1 for c in pc if z[0] <= c[0] <= z[2] and z[1] <= c[1] <= z[3])
        add('Mật độ %s: %d/%d = %d%% (≤%d%%)' % (n, cnum, area, round(100 * cnum / area), round(z[4] * 100)), cnum / area <= z[4])
    return ok, rep


def save(b, fn):
    b.sc.save(fn)
    o = json.load(open(fn)); o['collision'] = b.blk
    json.dump(o, open(fn, 'w'), ensure_ascii=False, separators=(',', ':'))


if __name__ == '__main__':
    for nm, fnc, fn in (('Nông trại 2', farm, 'nong-trai-2'), ('Thư viện 2', lib, 'thu-vien-2')):
        b = fnc(); ok, rep = check(b)
        print('==', nm)
        for r in rep: print(('ĐẠT ' if r[1] else 'TRƯỢT'), r[0], r[2] if not r[1] else '')
        print('TỔNG', 'ĐẠT' if ok else 'TRƯỢT')
        save(b, '/home/claude/ed/scene/%s.json' % fn)
