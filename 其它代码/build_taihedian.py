# -*- coding: utf-8 -*-
"""
太和殿复刻 · 出生点大厅 .bloxdschem 生成器
==========================================
输出: output/taihedian.bloxdschem  (64 x 31 x 64, 2x1x2 = 4 个 32^3 区块)

复刻要点 (Bloxd 方块语言):
- 三层汉白玉台基 (White Concrete) + 望柱栏杆 (每3块一根高柱), 南北御路豁口
- 大殿 11 开间 x 5 开间 (面阔44 x 进深20), 红柱 72 根; 金柱 40 根通高到上檐
- 副阶周匝 (四周 4 宽檐廊), 隔扇门窗 (红羊毛框 + 红玻璃棂条), 明间大开
- 重檐庑殿顶: 下檐黄琉璃 7 步坡 + 上檐黄琉璃 5 步坡, 金正脊 + 金鸱吻
- 殿内: 金砖地 (石砖), 中央须弥座 + 金宝座, 藻井位吊灯群; 廊下宫灯, 庭院铜缸

指令方块 (Code Block 1510) 布局 —— 硬约束: 任意两个指令方块切比雪夫距离 >= 2
(点一个带一串 = 挨着会连锁, 因此绝不相邻):
- 购买区 4 区 x 25: 东西山墙墙面跳点排布 (z 步进2, y 步进2), 5x5=25/区
- 变卖区 40: 庭院东西两侧对称摊位柱 (石砖柱 + 顶置指令块), 网格步进2, 20+20

序列化格式同 build_lobby.py (Avro schema0 / RLE+LEB128 / 32^3 chunk / 空气=0),
helper 直接 import 复用。
"""

from build_lobby import (zz, avro_bytes, leb128, rle_encode,
                         _read_leb, rle_decode, zzd,
                         AIR, SMOOTH_STONE, STONE_BRICKS, SMOOTH_ANDES,
                         RED_WOOL, BLACK_WOOL, GRAY_CONC, RED_GLASS,
                         GOLD_BLOCK, DIM_LAMP, JACK_LANTERN, DARK_RED_ST,
                         RED_CARPET, CHERRY_LOG, CHERRY_PLK, CHERRY_LEAF,
                         CEDAR_LOG, CEDAR_PLK, CODE_BLOCK)

WHITE = 97         # White Concrete (汉白玉) — M2B 表核实
YELLOW = 55        # Yellow Wool (琉璃瓦) — M2B 表核实
NAME_ID = None     # 延迟填充

import json
import os

# ---- ID 合法性自检: build_lobby 的 ID_NAME 不含 White/Yellow, 这里按 M2B 表补 ----
EXTRA_ID_NAME = {WHITE: "White Concrete", YELLOW: "Yellow Wool"}

blocks = {}

def setb(x, y, z, bid):
    if bid == AIR:
        blocks.pop((x, y, z), None)
    else:
        blocks[(x, y, z)] = bid

def fill(x0, x1, y0, y1, z0, z1, bid, soft=False):
    """soft=True 时只填空位 (不覆盖已有)"""
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            for z in range(z0, z1 + 1):
                if soft and (x, y, z) in blocks:
                    continue
                setb(x, y, z, bid)

# ============ 布局参数 ============
# 三层台基 (各 1 高, 可跳行进): T1 x0..63/z0..63, T2 x3..60/z3..60, T3 x6..57/z6..57
TIERS = [(0, 63, 0, 63, 0), (3, 60, 3, 60, 1), (6, 57, 6, 57, 2)]
RAMP_X = (29, 34)          # 御路豁口 (南北栏杆断开)
# 大殿: 11 开间 x 5 开间
XLINES = list(range(10, 55, 4))          # 12 柱列 x=10..54
ZLINES = [12, 16, 20, 24, 28, 32]        # 6 柱列 z=12..32
UXL = XLINES[1:-1]                       # 金柱 x=14..50 (10 列)
UZL = ZLINES[1:-1]                       # 金柱 z=16..28 (4 列)
HX0, HX1, HZ0, HZ1 = 10, 54, 12, 32      # 大殿墙外皮
WY0, WY1 = 4, 12                         # 檐墙 y 范围 (柱高9)
FANG_Y = 13                              # 额枋层
CENTER_BAY = (31, 33)                    # 明间 (南北门洞)
DOOR_X = (31, 33)
# 下檐 (环坡): (y, x0, x1, z0, z1), 外缘逐层内收, y13 与额枋同层 soft 填
LOW_EAVE = [(13, 7, 57, 9, 35), (14, 8, 56, 10, 34), (15, 9, 55, 11, 33),
            (16, 10, 54, 12, 32), (17, 11, 53, 13, 31), (18, 12, 52, 14, 30),
            (19, 13, 51, 15, 29)]
UP_WY = (19, 22)                         # 上檐墙 y19..22
UP_FANG_Y = 23
UP_EAVE = [(24, 12, 52, 14, 30), (25, 14, 50, 16, 28), (26, 17, 47, 18, 26),
           (27, 21, 43, 20, 24), (28, 25, 39, 21, 23)]
RIDGE = (29, 26, 38, 22)                 # 金正脊 y29 x26..38 z22
CHIWEN_X = (25, 39)                      # 鸱吻 x 位置 (y29..30)
# 指令方块
BUY_WALLS = [(10, 13, 21), (10, 23, 31), (54, 13, 21), (54, 23, 31)]
BUY_YS = (4, 6, 8, 10, 12)
SELL_XS_W = (17, 19, 21, 23)
SELL_XS_E = (41, 43, 45, 47)
SELL_ZS = (38, 40, 42, 44, 46)
# 装饰
VATS = [(14, 34), (18, 34), (46, 34), (50, 34)]   # 铜缸 (x,z)
POSTS = [(8, 54), (56, 54), (8, 10), (56, 10)]    # 庭院灯柱

# ============ 1. 三层台基 + 望柱栏杆 ============
for (x0, x1, z0, z1, y) in TIERS:
    fill(x0, x1, y, y, z0, z1, WHITE)

def balustrade(ring, y, gaps):
    """ring: (固定轴, 'x'|'z', 值) 描述边缘线; rail 1 高 + 每3一格望柱加高"""
    axis, fixed = ring
    lo, hi = 0, 63
    pts = []
    for v in range(lo, hi + 1):
        if any(g0 <= v <= g1 for (g0, g1) in gaps):
            continue
        x, z = (v, fixed) if axis == 'z' else (fixed, v)
        pts.append((x, z, v))
    for (x, z, v) in pts:
        setb(x, y, z, WHITE)                      # 栏板
        if v % 3 == 0:
            setb(x, y + 1, z, WHITE)              # 望柱
g1 = [RAMP_X]
balustrade(('z', 0), 1, g1); balustrade(('z', 63), 1, g1)      # T1 北南
balustrade(('x', 0), 1, []); balustrade(('x', 63), 1, [])
balustrade(('z', 3), 2, g1); balustrade(('z', 60), 2, g1)      # T2
balustrade(('x', 3), 2, []); balustrade(('x', 60), 2, [])
balustrade(('z', 6), 3, g1); balustrade(('z', 57), 3, g1)      # T3
balustrade(('x', 6), 3, []); balustrade(('x', 57), 3, [])

# ============ 2. 大殿地面 / 金砖 ============
fill(HX0, HX1, 3, 3, HZ0, HZ1, STONE_BRICKS)

# ============ 3. 柱网: 檐柱 72 + 金柱 40 通高 ============
for x in XLINES:
    for z in ZLINES:
        for y in range(WY0, WY1 + 1):
            setb(x, y, z, RED_WOOL)
for x in UXL:
    for z in UZL:
        for y in range(FANG_Y, 22 + 1):          # 金柱穿过下檐直抵上檐枋下
            setb(x, y, z, RED_WOOL)

# ============ 4. 檐墙: 南北隔扇 + 东西山墙 ============
for wz in (HZ0, HZ1):
    for bx0, bx1 in zip(XLINES[:-1], XLINES[1:]):
        for x in range(bx0 + 1, bx1):
            if DOOR_X[0] <= x <= DOOR_X[1]:
                continue                          # 明间门洞全开
            setb(x, WY0, wz, RED_WOOL)            # 隔扇下槛
            for y in range(WY0 + 1, WY1 + 1):
                setb(x, y, wz, RED_GLASS if x % 2 == 0 else RED_WOOL)
for wx in (HX0, HX1):
    for z in range(HZ0 + 1, HZ1):
        for y in range(WY0, WY1 + 1):
            setb(wx, y, z, RED_WOOL)              # 山墙实红

# ============ 5. 额枋 (檐柱顶, 金色枋头) ============
for x in range(HX0, HX1 + 1):
    gold = x in XLINES
    setb(x, FANG_Y, HZ0, GOLD_BLOCK if gold else RED_WOOL)
    setb(x, FANG_Y, HZ1, GOLD_BLOCK if gold else RED_WOOL)
for z in range(HZ0, HZ1 + 1):
    gold = z in ZLINES
    setb(HX0, FANG_Y, z, GOLD_BLOCK if gold else RED_WOOL)
    setb(HX1, FANG_Y, z, GOLD_BLOCK if gold else RED_WOOL)

# ============ 6. 下檐黄琉璃坡 (椽头红环) ============
for (y, x0, x1, z0, z1) in LOW_EAVE:
    for x in range(x0, x1 + 1):
        for z in range(z0, z1 + 1):
            if 14 <= x <= 50 and 16 <= z <= 28:
                continue                          # 上檐墙位置不盖
            edge = (y == 13) and (x in (x0, x1) or z in (z0, z1))
            fill_soft = (y == 13)
            if edge:
                setb(x, y, z, RED_WOOL)
            elif fill_soft:
                if (x, y, z) not in blocks:
                    setb(x, y, z, YELLOW)
            else:
                setb(x, y, z, YELLOW)

# ============ 7. 上檐墙 (金柱间): 隔扇 + 山墙 ============
for wz in (UZL[0], UZL[-1]):
    for bx0, bx1 in zip(UXL[:-1], UXL[1:]):
        for x in range(bx0 + 1, bx1):
            for y in range(UP_WY[0], UP_WY[1] + 1):
                setb(x, y, wz, RED_GLASS if x % 2 == 0 else RED_WOOL)
for wx in (UXL[0], UXL[-1]):
    for z in range(UZL[0] + 1, UZL[-1]):
        for y in range(UP_WY[0], UP_WY[1] + 1):
            setb(wx, y, z, RED_WOOL)
# 上额枋
for x in range(UXL[0], UXL[-1] + 1):
    gold = x in UXL
    setb(x, UP_FANG_Y, UZL[0], GOLD_BLOCK if gold else RED_WOOL)
    setb(x, UP_FANG_Y, UZL[-1], GOLD_BLOCK if gold else RED_WOOL)
for z in range(UZL[0], UZL[-1] + 1):
    gold = z in UZL
    setb(UXL[0], UP_FANG_Y, z, GOLD_BLOCK if gold else RED_WOOL)
    setb(UXL[-1], UP_FANG_Y, z, GOLD_BLOCK if gold else RED_WOOL)

# ============ 8. 上檐黄琉璃坡 + 金脊鸱吻 ============
for (y, x0, x1, z0, z1) in UP_EAVE:
    fill(x0, x1, y, y, z0, z1, YELLOW)
fill(RIDGE[1], RIDGE[2], RIDGE[0], RIDGE[0], RIDGE[3], RIDGE[3], GOLD_BLOCK)
for cx in CHIWEN_X:
    for y in (RIDGE[0], RIDGE[0] + 1):
        setb(cx, y, RIDGE[3], GOLD_BLOCK)

# ============ 9. 殿内: 宝座 + 藻井灯 ============
fill(31, 33, 4, 4, 21, 23, STONE_BRICKS)          # 须弥座
setb(32, 5, 22, GOLD_BLOCK)                        # 宝座
setb(32, 5, 21, GOLD_BLOCK); setb(32, 6, 21, GOLD_BLOCK); setb(32, 7, 21, GOLD_BLOCK)
setb(31, 5, 22, DARK_RED_ST); setb(33, 5, 22, DARK_RED_ST)   # 扶手
for (lx, lz) in ((31, 21), (33, 21), (31, 23), (33, 23)):
    setb(lx, 20, lz, DIM_LAMP)
setb(32, 19, 22, DIM_LAMP)

# ============ 10. 指令方块 (间距>=2 硬约束) ============
code_zones = {}
def cb_group(name, meta, coords):
    code_zones[name] = {"meta": meta, "coords": [list(c) for c in coords],
                        "count": len(coords)}

zi = 0
for (wx, z0, z1) in BUY_WALLS:                     # 购买区 4 区 x25, 墙面跳点
    zi += 1
    side = "west" if wx == HX0 else "east"
    half = "north" if z1 <= 21 else "south"
    coords = [(wx, y, z) for z in range(z0, z1 + 1, 2) for y in BUY_YS]
    for c in coords:
        setb(*c, CODE_BLOCK)
    cb_group(f"buy_zone{zi}", {"wall": side, "z": [z0, z1], "y": list(BUY_YS),
                               "note": f"{side}山墙 {half}段 5列(z步2)x5行(y步2)"},
             coords)
for tag, xs in (("west", SELL_XS_W), ("east", SELL_XS_E)):   # 变卖区 20+20 摊位
    coords = []
    for x in xs:
        for z in SELL_ZS:
            setb(x, 3, z, STONE_BRICKS)            # 摊位柱
            setb(x, 4, z, CODE_BLOCK)
            coords.append((x, 4, z))
    cb_group(f"sell_{tag}", {"grid_x": list(xs), "grid_z": list(SELL_ZS),
                             "note": "石砖柱y3 + 指令块y4, 步进2"}, coords)

# ============ 11. 庭院陈设 ============
fill(32, 32, 2, 2, 36, 54, GOLD_BLOCK)             # 御路金道
fill(31, 31, 2, 2, 40, 46, DARK_RED_ST)
fill(33, 33, 2, 2, 40, 46, DARK_RED_ST)
for (vx, vz) in VATS:                              # 铜缸
    setb(vx, 3, vz, DARK_RED_ST)
    setb(vx, 4, vz, GOLD_BLOCK)
for (px, pz) in POSTS:                             # 灯柱
    setb(px, 3, pz, CEDAR_LOG); setb(px, 4, pz, CEDAR_LOG)
    setb(px, 5, pz, JACK_LANTERN)
for lx in (14, 22, 38, 46):                        # 廊下宫灯
    setb(lx, 12, 30, DIM_LAMP); setb(lx, 12, 14, DIM_LAMP)
for (lx, lz) in ((11, 18), (11, 26), (53, 18), (53, 26)):
    setb(lx, 12, lz, DIM_LAMP)

# ============ 12. 序列化 (Avro schema0) ============
SX, SY, SZ = 64, 31, 64

def build_schematic(name):
    chunks = {}
    for (x, y, z), bid in blocks.items():
        key = (x >> 5, y >> 5, z >> 5)
        flat = chunks.setdefault(key, [AIR] * (32*32*32))
        flat[(x & 31) * 1024 + (y & 31) * 32 + (z & 31)] = bid
    buf = bytearray(b"\x00" * 4)
    buf += avro_bytes(name.encode("utf-8"))
    buf += zz(0) * 3
    buf += zz(SX) + zz(SY) + zz(SZ)
    keys = sorted(chunks)
    buf += zz(len(keys))
    for (cx, cy, cz) in keys:
        buf += zz(cx) + zz(cy) + zz(cz)
        buf += avro_bytes(rle_encode(chunks[(cx, cy, cz)]))
    buf += zz(0)
    return bytes(buf)

def verify(data):
    i = 4
    ln, i = _read_leb(data, i); ln = zzd(ln)
    name = data[i:i+ln].decode("utf-8"); i += ln
    pos = []
    for _ in range(3):
        v, i = _read_leb(data, i); pos.append(zzd(v))
    sizes = []
    for _ in range(3):
        v, i = _read_leb(data, i); sizes.append(zzd(v))
    cnt, i = _read_leb(data, i); cnt = zzd(cnt)
    got = set()
    for _ in range(cnt):
        c = []
        for _ in range(3):
            v, i = _read_leb(data, i); c.append(zzd(v))
        bln, i = _read_leb(data, i); bln = zzd(bln)
        flat = rle_decode(data[i:i+bln], 32*32*32); i += bln
        assert len(flat) == 32*32*32
        for lx in range(32):
            for ly in range(32):
                for lz in range(32):
                    bid = flat[lx*1024 + ly*32 + lz]
                    if bid != AIR:
                        got.add((c[0]*32+lx, c[1]*32+ly, c[2]*32+lz, bid))
    assert data[i:i+1] == b"\x00"
    return name, sizes, got

# ============ 13. 指令方块间距硬校验 ============
def check_isolation():
    cb = sorted([p for p, b in blocks.items() if b == CODE_BLOCK])
    bad = []
    for i in range(len(cb)):
        for j in range(i + 1, len(cb)):
            a, b = cb[i], cb[j]
            if max(abs(a[0]-b[0]), abs(a[1]-b[1]), abs(a[2]-b[2])) < 2:
                bad.append((a, b))
    assert not bad, f"指令方块相邻! {bad[:5]}"
    return len(cb)

# ============ 主流程 ============
if __name__ == "__main__":
    n_cb = check_isolation()
    data = build_schematic("TaiHeDian_Lobby")
    name, sizes, got = verify(data)
    expect = {(x, y, z, b) for (x, y, z), b in blocks.items()}
    assert got == expect, "回读不一致!"
    assert name == "TaiHeDian_Lobby" and tuple(sizes) == (SX, SY, SZ)
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "taihedian.bloxdschem"), "wb") as f:
        f.write(data)
    with open(os.path.join(out_dir, "taihedian_code_blocks.json"), "w",
              encoding="utf-8") as f:
        json.dump(code_zones, f, ensure_ascii=False, indent=1)
    ID_NAME = dict(EXTRA_ID_NAME)
    from build_lobby import ID_NAME as BASE
    ID_NAME.update(BASE)
    used = {}
    for b in blocks.values():
        n = ID_NAME.get(b, f"ID{b}")
        used[n] = used.get(n, 0) + 1
    print(f"[OK] output/taihedian.bloxdschem  ({len(data)/1024:.1f} KB, "
          f"区块 {SX//32}x{(SY+31)//32}x{SZ//32}={ (SX//32)*((SY+31)//32)*(SZ//32) })")
    print(f"[OK] 指令方块 {n_cb} 个, 全部间距>=2 通过")
    print(f"[OK] 总方块 {len(blocks)}")
    for n, c in sorted(used.items(), key=lambda kv: -kv[1]):
        print(f"   {n}: {c}")
