# -*- coding: utf-8 -*-
"""
太和殿复刻 v2 · 细节加强版 .bloxdschem 生成器
==============================================
输出: output/taihedian_v2.bloxdschem  (88 x 40 x 80, 3x2x3 = 18 个 32^3 区块)

v2 变化 (按用户要求): 不再限 5 区块; 方块调色板大幅丰富; 本轮不放指令方块
(用户: "不用在意加指令方块, 把太和殿细节先做好")。指令方块隔离规则保留在
build_taihedian.py (v1) 的 check_isolation(), 下轮加回时沿用: 两两距离>=2。

复刻细节:
- 三层汉白玉须弥座 (White Concrete), 望柱栏杆 (White Wool 柱头, 每3一柱),
  螭首排水 (Smooth Andesite 挑出), 南北御路踏道 (垂带石 + 金色踏心),
  御路石雕 (Chiseled Block of Quartz + Dark Red Stone 边框)
- 大殿 11 开间 x 5 开间 (66x30), 檐柱 72 根 + 金柱 40 根通高, 柱础 Dark Red Stone
- 隔扇门窗: Red Baked Clay 裙板下碱 + 红框红玻璃棂条; 山墙 Red Baked Clay 裙肩
- 额枋青绿彩画 (Cyan Wool) + 柱头金饰 (Block of Gold)
- 重檐庑殿顶: 下檐黄琉璃 10 步坡 (红椽头) + 上檐 5 步坡 + 金正脊
  + Golden Decoration 鸱吻
- 殿内: 金砖地 (Stone Bricks + Cracked Stone Bricks 做旧), Dark Red Stone 甬路,
  须弥座宝座 (Golden Decoration), 藻井 (Block of Lapis Lazuli + 金环)
- 庭院: 铜缸 x6, 日晷/嘉量座 x2 (Chiseled Quartz), 樱花树 x4, 灯柱 x4, 廊下宫灯

序列化: Avro schema0 / RLE+LEB128 / 32^3 chunk, helper 复用 build_lobby.py
方块 ID 均已对照 M2B 映射表 (与官方 BLOCK_NAMES.txt 名字表交叉核实)
"""

from build_lobby import (zz, avro_bytes, rle_encode, _read_leb, rle_decode, zzd,
                         AIR, SMOOTH_ANDES, RED_WOOL, RED_GLASS, GOLD_BLOCK,
                         DIM_LAMP, JACK_LANTERN, DARK_RED_ST, STONE_BRICKS,
                         CHERRY_LOG, CHERRY_LEAF, CEDAR_LOG, CODE_BLOCK)

# ---- 调色板 (M2B idToNameJson 核实) ----
WHITE = 97    # White Concrete 汉白玉
WWOOL = 51    # White Wool 望柱头/栏板
QZC   = 133   # Chiseled Block of Quartz 石雕
REDW  = 65    # Red Wool 红柱红墙椽头
RBC   = 82    # Red Baked Clay 裙板下碱
DRB   = 130   # Dark Red Brick 垂带/铺装
DRST  = 131   # Dark Red Stone 柱础/甬路
CYAN  = 60    # Cyan Wool 青绿彩画
YEL   = 55    # Yellow Wool 琉璃瓦
SB    = 129   # Stone Bricks 金砖
CSB   = 136   # Cracked Stone Bricks 金砖做旧
LAPI  = 49    # Block of Lapis Lazuli 藻井
GDEC  = 145   # Golden Decoration 鸱吻/宝座
ERS   = 476   # Engraved Red Sandstone 铺装纹样
MRS   = 477   # Marked Red Sandstone 铺装纹样

ID_NAME = {WHITE: "White Concrete", WWOOL: "White Wool", QZC: "Chiseled Block of Quartz",
           REDW: "Red Wool", RBC: "Red Baked Clay", DRB: "Dark Red Brick",
           DRST: "Dark Red Stone", CYAN: "Cyan Wool", YEL: "Yellow Wool",
           SB: "Stone Bricks", CSB: "Cracked Stone Bricks", LAPI: "Block of Lapis Lazuli",
           GDEC: "Golden Decoration", ERS: "Engraved Red Sandstone",
           MRS: "Marked Red Sandstone", SMOOTH_ANDES: "Smooth Andesite",
           RED_WOOL: "Red Wool", RED_GLASS: "Red Glass", GOLD_BLOCK: "Block of Gold",
           DIM_LAMP: "Dim Lamp On", JACK_LANTERN: "Jack o'Lantern",
           DARK_RED_ST: "Dark Red Stone", STONE_BRICKS: "Stone Bricks",
           CHERRY_LOG: "Cherry Log", CHERRY_LEAF: "Cherry Leaves", CEDAR_LOG: "Cedar Log"}

blocks = {}

def setb(x, y, z, bid):
    if bid == AIR:
        blocks.pop((x, y, z), None)
    else:
        blocks[(x, y, z)] = bid

def fill(x0, x1, y0, y1, z0, z1, bid, soft=False):
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            for z in range(z0, z1 + 1):
                if soft and (x, y, z) in blocks:
                    continue
                setb(x, y, z, bid)

# ============ 布局参数 ============
SX, SY, SZ = 88, 40, 80
# 三层台基 (各 2 高)
T1 = (1, 86, 1, 78)     # x, x1, z0, z1, y0..1
T2 = (3, 84, 3, 76)     # y2..3
T3 = (5, 82, 5, 74)     # y4..5
RAMP = (40, 48)          # 御路宽 x40..48 (中心44 = 明间中线)
CHI_Z = [10, 18, 26, 34, 42, 50, 58, 66]   # 螭首坐标集 (避开御路/角)
CHI_X = [10, 18, 26, 34, 42, 50, 58, 66, 74]
# 大殿 11 开间 x 5 开间
XL = list(range(11, 78, 6))              # 12 柱列 x=11..77
ZL = [24, 30, 36, 42, 48, 54]            # 6 柱列
UXL, UZL = XL[1:-1], ZL[1:-1]            # 金柱 10 x 4
HX0, HX1, HZ0, HZ1 = 11, 77, 24, 54
FLOOR_Y = 6
WY0, WY1 = 7, 18                          # 檐柱/墙 y
FANG = 19                                 # 额枋
UPR_WY = (28, 30)                         # 上檐墙
UPR_FANG = 31
DOOR = (42, 46)                           # 明间门洞
# 上檐墙外皮 (金柱平面)
UX0, UX1, UZ0, UZ1 = 17, 71, 30, 48

# ============ 1. 三层台基 ============
fill(T1[0], T1[1], 0, 1, T1[2], T1[3], WHITE)
fill(T2[0], T2[1], 3, 3, T2[2], T2[3], WHITE)                     # T2 顶面
for x in range(T2[0], T2[1]+1):                                   # T2 侧裙(外露2宽环)
    for z in range(T2[2], T2[3]+1):
        if x in (T2[0], T2[1], T2[0]+1, T2[1]-1) or z in (T2[2], T2[3], T2[2]+1, T2[3]-1):
            setb(x, 2, z, WHITE)
fill(T3[0], T3[1], 5, 5, T3[2], T3[3], WHITE)                     # T3 顶面
for x in range(T3[0], T3[1]+1):                                   # T3 侧裙(外露1宽环)
    for z in range(T3[2], T3[3]+1):
        if x in (T3[0], T3[1]) or z in (T3[2], T3[3]):
            setb(x, 4, z, WHITE)
# 台面铺装纹样: T3 顶面御路两侧 Maroon 纹带
for z in range(58, 74):
    for x in (36, 37, 51, 52):
        setb(x, 5, z, MRS if z % 2 == 0 else ERS)

# ============ 2. 望柱栏杆 (rail 1 + 每3望柱加高带 WW 柱头) ============
def balustrade(axis, fixed, y, gaps, lo, hi):
    for v in range(lo, hi + 1):
        if any(g0 <= v <= g1 for (g0, g1) in gaps):
            continue
        x, z = (v, fixed) if axis == 'z' else (fixed, v)
        setb(x, y, z, WHITE)
        if v % 3 == 0:
            setb(x, y + 1, z, WWOOL)
gaps = [RAMP]
balustrade('z', T1[2], 2, gaps, T1[0], T1[1]); balustrade('z', T1[3], 2, gaps, T1[0], T1[1])
balustrade('x', T1[0], 2, [], T1[2], T1[3]);   balustrade('x', T1[1], 2, [], T1[2], T1[3])
balustrade('z', T2[2], 4, gaps, T2[0], T2[1]); balustrade('z', T2[3], 4, gaps, T2[0], T2[1])
balustrade('x', T2[0], 4, [], T2[2], T2[3]);   balustrade('x', T2[1], 4, [], T2[2], T2[3])
balustrade('z', T3[2], 6, gaps, T3[0], T3[1]); balustrade('z', T3[3], 6, gaps, T3[0], T3[1])
balustrade('x', T3[0], 6, [], T3[2], T3[3]);   balustrade('x', T3[1], 6, [], T3[2], T3[3])

# ============ 3. 螭首 (各层侧面挑出 + 托架) ============
for z in CHI_Z:                                                     # 东西向
    for (fy, fx_in, fx_out) in ((3, T2[0], T2[0]-1), (3, T2[1], T2[1]+1),
                                (5, T3[0], T3[0]-1), (5, T3[1], T3[1]+1)):
        setb(fx_out, fy, z, SMOOTH_ANDES); setb(fx_out, fy-1, z, WHITE)
for x in CHI_X:                                                     # 南北向
    for (fy, fz_in, fz_out) in ((3, T2[2], T2[2]-1), (3, T2[3], T2[3]+1),
                                (5, T3[2], T3[2]-1), (5, T3[3], T3[3]+1)):
        setb(x, fy, fz_out, SMOOTH_ANDES); setb(x, fy-1, fz_out, WHITE)

# ============ 4. 南北御路踏道 + 垂带 + 石雕 ============
for (sx0, sx1) in (RAMP,):
    for x in range(sx0, sx1 + 1):                                   # 南: 地->T1->T2->T3
        setb(x, 0, T1[3] + 1, GOLD_BLOCK if x == 44 else WHITE)
        setb(x, 2, T2[3] + 1, GOLD_BLOCK if x == 44 else WHITE)
        setb(x, 4, T3[3] + 1, GOLD_BLOCK if x == 44 else WHITE)
        setb(x, 0, T1[2] - 1, GOLD_BLOCK if x == 44 else WHITE)     # 北
        setb(x, 2, T2[2] - 1, GOLD_BLOCK if x == 44 else WHITE)
        setb(x, 4, T3[2] - 1, GOLD_BLOCK if x == 44 else WHITE)
for cx in (RAMP[0] - 1, RAMP[1] + 1):                               # 垂带石 南/北
    for (z, y0, y1) in ((T1[3] + 1, 0, 1), (T2[3] + 1, 2, 3), (T3[3] + 1, 4, 5)):
        fill(cx, cx, y0, y1 - 1, z, z, WHITE); setb(cx, y1, z, SMOOTH_ANDES)
    for (z, y0, y1) in ((T1[2] - 1, 0, 1), (T2[2] - 1, 2, 3), (T3[2] - 1, 4, 5)):
        fill(cx, cx, y0, y1 - 1, z, z, WHITE); setb(cx, y1, z, SMOOTH_ANDES)
# 御路石雕: T3 南脸中央
fill(41, 47, 4, 5, T3[3], T3[3], QZC)
for x in (41, 47):
    setb(x, 4, T3[3], DRST); setb(x, 5, T3[3], DRST)
setb(44, 5, T3[3], GDEC); setb(43, 4, T3[3], DRST); setb(45, 4, T3[3], DRST)

# ============ 5. 殿内金砖地面 ============
for x in range(HX0, HX1 + 1):
    for z in range(HZ0, HZ1 + 1):
        worn = CSB if (x * 31 + z * 17) % 19 == 0 else SB
        setb(x, FLOOR_Y, z, worn)
fill(42, 46, FLOOR_Y, FLOOR_Y, HZ0, HZ1, DRST)                      # 甬路

# ============ 6. 柱网 ============
for x in XL:
    for z in ZL:
        setb(x, FLOOR_Y, z, DRST)                                   # 柱础
        for y in range(WY0, WY1 + 1):
            setb(x, y, z, REDW)                                     # 檐柱
for x in UXL:
    for z in UZL:
        for y in range(FANG, UPR_FANG):                             # 金柱通高 y19..30
            setb(x, y, z, REDW)

# ============ 7. 檐墙: 南北隔扇 / 东西山墙 ============
for wz in (HZ0, HZ1):
    for bx0, bx1 in zip(XL[:-1], XL[1:]):
        for x in range(bx0 + 1, bx1):
            if DOOR[0] <= x <= DOOR[1]:
                continue
            fill(x, x, WY0, WY0 + 1, wz, wz, RBC)                   # 裙板
            for y in range(WY0 + 2, WY1):
                setb(x, y, wz, RED_GLASS if x % 2 == 0 else RED_WOOL)
            setb(x, WY1, wz, RED_WOOL)                              # 上槛
for wx in (HX0, HX1):
    for z in range(HZ0 + 1, HZ1):
        fill(wx, wx, WY0, WY0 + 2, z, z, RBC)                       # 下碱
        fill(wx, wx, WY0 + 3, WY1, z, z, REDW)

# ============ 8. 额枋青绿彩画 + 柱头金饰 ============
for x in range(HX0, HX1 + 1):
    c = GOLD_BLOCK if x in XL else CYAN
    setb(x, FANG, HZ0, c); setb(x, FANG, HZ1, c)
for z in range(HZ0, HZ1 + 1):
    c = GOLD_BLOCK if z in ZL else CYAN
    setb(HX0, FANG, z, c); setb(HX1, FANG, z, c)

# ============ 9. 下檐黄琉璃坡 (10 步, 红椽头) ============
for k in range(10):
    y = FANG + k
    x0, x1, z0, z1 = 7 + k, 81 - k, 20 + k, 58 - k
    for x in range(x0, x1 + 1):
        for z in range(z0, z1 + 1):
            if UX0 <= x <= UX1 and UZ0 <= z <= UZ1:
                continue
            edge = x in (x0, x1) or z in (z0, z1)
            if k == 0 and edge:
                setb(x, y, z, REDW)                                 # 椽头
            elif k == 0:
                if (x, y, z) not in blocks:
                    setb(x, y, z, YEL)
            else:
                setb(x, y, z, YEL)

# ============ 10. 上檐墙 + 上额枋 ============
for wz in (UZ0, UZ1):
    for bx0, bx1 in zip(UXL[:-1], UXL[1:]):
        for x in range(bx0 + 1, bx1):
            for y in range(UPR_WY[0], UPR_WY[1] + 1):
                setb(x, y, wz, RED_GLASS if x % 2 == 0 else RED_WOOL)
for wx in (UX0, UX1):
    for z in range(UZ0 + 1, UZ1):
        for y in range(UPR_WY[0], UPR_WY[1] + 1):
            setb(wx, y, z, REDW)
for x in range(UX0, UX1 + 1):
    c = GOLD_BLOCK if x in UXL else CYAN
    setb(x, UPR_FANG, UZ0, c); setb(x, UPR_FANG, UZ1, c)
for z in range(UZ0, UZ1 + 1):
    c = GOLD_BLOCK if z in UZL else CYAN
    setb(UX0, UPR_FANG, z, c); setb(UX1, UPR_FANG, z, c)

# ============ 11. 上檐黄琉璃坡 + 金脊鸱吻 ============
for (y, x0, x1, z0, z1) in [(32, 14, 74, 27, 51), (33, 15, 73, 28, 50),
                            (34, 16, 72, 29, 49), (35, 18, 70, 31, 47),
                            (36, 22, 66, 35, 43)]:
    fill(x0, x1, y, y, z0, z1, YEL)
fill(28, 60, 37, 37, 39, 39, GOLD_BLOCK)                            # 金正脊
for cx in (27, 61):                                                 # 鸱吻
    setb(cx, 37, 39, GDEC); setb(cx, 38, 39, GDEC)

# ============ 12. 殿内: 宝座 + 藻井 ============
fill(41, 47, 7, 7, 36, 42, STONE_BRICKS)                            # 须弥座台
setb(44, 8, 39, GDEC)                                               # 宝座
setb(44, 8, 38, GDEC); setb(44, 9, 38, GDEC); setb(44, 10, 38, GDEC)
setb(43, 8, 39, DARK_RED_ST); setb(45, 8, 39, DARK_RED_ST)
for x in range(42, 47):                                             # 藻井 5x5 青金环
    for z in range(37, 42):
        if x in (42, 46) or z in (37, 41):
            setb(x, 28, z, LAPI)
for x in range(43, 46):                                             # 3x3 金环
    for z in range(38, 41):
        if x in (43, 45) or z in (38, 40):
            setb(x, 29, z, GOLD_BLOCK)
setb(44, 30, 39, GDEC); setb(44, 29, 39, DIM_LAMP)

# ============ 13. 庭院陈设 ============
for (vx, vz) in [(9, 58), (15, 58), (73, 58), (79, 58), (9, 20), (79, 20)]:
    setb(vx, 6, vz, DARK_RED_ST); setb(vx, 7, vz, GOLD_BLOCK); setb(vx, 8, vz, GOLD_BLOCK)
for (px, pz) in [(36, 64), (52, 64)]:
    setb(px, 6, pz, STONE_BRICKS); setb(px, 7, pz, STONE_BRICKS); setb(px, 8, pz, QZC)
for (tx, tz) in [(9, 68), (79, 68), (9, 10), (79, 10)]:
    for y in (6, 7, 8):
        setb(tx, y, tz, CHERRY_LOG)
    for dx in range(-2, 3):
        for dz in range(-2, 3):
            setb(tx + dx, 8, tz + dz, CHERRY_LEAF)
    for dx in range(-1, 2):
        for dz in range(-1, 2):
            setb(tx + dx, 9, tz + dz, CHERRY_LEAF)
    setb(tx, 10, tz, CHERRY_LEAF)
    for dx, dz in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        setb(tx + dx, 10, tz + dz, CHERRY_LEAF)
    for y in (8,):
        setb(tx, y, tz, CHERRY_LOG)
for (px, pz) in [(39, 57), (49, 57), (39, 21), (49, 21)]:
    for y in (6, 7, 8):
        setb(px, y, pz, CEDAR_LOG)
    setb(px, 9, pz, JACK_LANTERN)
for lx in (13, 19, 25, 31, 37, 49, 55, 61, 67, 73):                 # 廊下宫灯
    setb(lx, 18, 55, DIM_LAMP); setb(lx, 18, 23, DIM_LAMP)
for (lx, lz) in [(12, 27), (12, 33), (12, 39), (12, 45), (12, 51),
                 (76, 27), (76, 33), (76, 39), (76, 45), (76, 51)]:
    setb(lx, 18, lz, DIM_LAMP)

# ============ 14. 序列化 (Avro schema0) ============
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
    for _ in range(3):
        v, i = _read_leb(data, i)                                   # x,y,z 原点
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

if __name__ == "__main__":
    import os
    data = build_schematic("TaiHeDian_V2")
    name, sizes, got = verify(data)
    expect = {(x, y, z, b) for (x, y, z), b in blocks.items()}
    assert got == expect, "回读不一致!"
    assert name == "TaiHeDian_V2" and tuple(sizes) == (SX, SY, SZ)
    xs = [p[0] for p in blocks]; ys = [p[1] for p in blocks]; zs = [p[2] for p in blocks]
    assert max(xs) < SX and max(ys) < SY and max(zs) < SZ, "越界!"
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
    os.makedirs(out_dir, exist_ok=True)
    with open(os.path.join(out_dir, "taihedian_v2.bloxdschem"), "wb") as f:
        f.write(data)
    nchunks = ((SX + 31)//32) * ((SY + 31)//32) * ((SZ + 31)//32)
    print(f"[OK] output/taihedian_v2.bloxdschem ({len(data)/1024:.1f} KB, "
          f"区块 {nchunks}, 总方块 {len(blocks)})")
    used = {}
    for b in blocks.values():
        n = ID_NAME.get(b, f"ID{b}")
        used[n] = used.get(n, 0) + 1
    for n, c in sorted(used.items(), key=lambda kv: -kv[1]):
        print(f"   {n}: {c}")
