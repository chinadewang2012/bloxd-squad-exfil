# -*- coding: utf-8 -*-
"""
中式出生点大厅 .bloxdschem 生成器
==================================
输出: output/spawn_lobby.bloxdschem  (64 x 20 x 36, 4 个 32^3 区块, 单文件)

格式依据 (参考经社区验证的转换器 Quentin-X/M2B, https://github.com/Quentin-X/M2B):
- Avro schema0 record: headers=fixed(4)全0, name=string, x/y/z=int(原点),
  sizeX/Y/Z=int, chunks=array<{x,y,z:int, blocks:bytes}>; Avro int 为 zigzag varint
- 每个 chunk 32^3 方块, blocks 为 RLE: (LEB128 count, LEB128 blockId) 对,
  解码后扁平数组下标 idx = lx*1024 + ly*32 + lz
- 方块 ID: 0=Air, 1=Unloaded, 2=Dirt ... 数值取自 M2B 的 idToNameJson 映射
- 指令方块 = Bloxd "Code Block" (ID 1510)

区域: 主厅(出生) / 变卖区 40 Code Block / 购买区 4 区 x 25 Code Block
"""

import json
import os

# ============ 方块 ID (来自 M2B block-jsons.js 的 idToNameJson) ============
AIR          = 0
SMOOTH_STONE = 31
STONE_BRICKS = 129
SMOOTH_ANDES = 35
SMOOTH_SAND  = 137
RED_WOOL     = 65
BLACK_WOOL   = 66
GRAY_CONC    = 84
RED_GLASS    = 120
GOLD_BLOCK   = 48
DIM_LAMP     = 124
JACK_LANTERN = 980
DARK_RED_ST  = 131
RED_CARPET   = 1053
CHERRY_LOG   = 1222
CHERRY_PLK   = 1225
CHERRY_LEAF  = 1226
CEDAR_LOG    = 12
CEDAR_PLK    = 20
CODE_BLOCK   = 1510  # Bloxd "Code Block" = 指令方块

ID_NAME = {
    AIR: "Air", SMOOTH_STONE: "Smooth Stone", STONE_BRICKS: "Stone Bricks",
    SMOOTH_ANDES: "Smooth Andesite", SMOOTH_SAND: "Smooth Sandstone",
    RED_WOOL: "Red Wool", BLACK_WOOL: "Black Wool", GRAY_CONC: "Gray Concrete",
    RED_GLASS: "Red Glass", GOLD_BLOCK: "Block of Gold", DIM_LAMP: "Dim Lamp On",
    JACK_LANTERN: "Jack o'Lantern", DARK_RED_ST: "Dark Red Stone",
    RED_CARPET: "Red Carpet", CHERRY_LOG: "Cherry Log", CHERRY_PLK: "Cherry Wood Planks",
    CHERRY_LEAF: "Cherry Leaves", CEDAR_LOG: "Cedar Log", CEDAR_PLK: "Cedar Wood Planks",
    CODE_BLOCK: "Code Block",
}

# ============ 尺寸 ============
SX, SY, SZ = 64, 20, 36          # 整体包围盒 -> 2x1x2 = 4 个 32^3 区块 (≤5)
CX_N, CY_N, CZ_N = 2, 1, 2       # 区块网格

blocks = {}                       # (x,y,z) -> id, 只存非空气

def setb(x, y, z, bid):
    if bid == AIR:
        blocks.pop((x, y, z), None)
    else:
        blocks[(x, y, z)] = bid

def fill(x0, x1, y0, y1, z0, z1, bid):
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            for z in range(z0, z1 + 1):
                setb(x, y, z, bid)

# ============ 布局参数 ============
# 地台/围界
APRON = (0, SX - 1, 0, SZ - 1)          # y0 散水
PLAT  = (2, SX - 3, 2, SZ - 3)          # y1 台基 (x2..61, z2..33)
# 墙体 (1 厚): x6..57, z6..29, y2..8 沙岩 + y9 红枋
WX0, WX1, WZ0, WZ1 = 6, 57, 6, 29
WY0, WY1 = 2, 8
BAND_Y = 9                               # 额枋 (红)
# 大门: 南北墙 x29..36, y2..7
DX0, DX1, DY1 = 29, 36, 7
FRAME_L, FRAME_R = 28, 37                # 门框红柱
KEY_X0, KEY_X1 = 32, 33                  # 金色门楣
# 购买区面板: 5x5, 嵌在南北墙面(z6/z29), x8..12 与 x15..19, y4..8
BUY_PANELS = [(8, 12), (15, 19)]         # x0,x1
BUY_Y0, BUY_Y1 = 4, 8
# 变卖区面板: 5x2, x44..48 与 x51..55, y5..6
SELL_PANELS = [(44, 48), (51, 55)]
SELL_Y0, SELL_Y1 = 5, 6
# 室内柱: z12/z23 两排
COL_ROWS = (12, 23)
COL_XS = (10, 16, 22, 40, 46, 52)
# 天花梁: 纵梁 z12/z23, 横梁 x22/32/42
BEAM_Z = (12, 23)
BEAM_X = (22, 32, 42)
# 中央香炉台
DAIS = (30, 33, 16, 19)                  # x30..33, z16..19, y2
DAIS_GOLD = (31, 32, 17, 18)
# 屋顶出檐 2
ROOF_L1 = (4, SX - 5, 4, SZ - 5)         # x4..59, z4..31, y11 (红檐环+杉木檐底)
ROOF_STEPS = [                           # (y, x0, x1, z0, z1) 灰瓦逐层内收
    (12, 5, 58, 5, 30), (13, 7, 56, 7, 28), (14, 9, 54, 9, 26),
    (15, 11, 52, 11, 24), (16, 13, 50, 13, 22), (17, 16, 47, 15, 20),
]
RIDGE_Y, RIDGE = 18, (20, 43, 17, 18)    # 黑瓦正脊
FIN_Y = 19                               # 鸱吻
# 灯柱 / 树
POSTS = [(28, 32), (37, 32), (28, 3), (37, 3)]
# 树位避开墙体 (墙 x6/x57, z6..29): 树冠半径2, 取 x7/x56, z3/z32
TREES = [(7, 32), (56, 32), (7, 3), (56, 3)]

# ============ 1. 地面与台基 ============
fill(0, SX-1, 0, 0, 0, SZ-1, SMOOTH_STONE)                    # 散水
for x in range(0, SX):                                        # 散水边缘石砖
    setb(x, 0, 0, STONE_BRICKS); setb(x, 0, SZ-1, STONE_BRICKS)
for z in range(0, SZ):
    setb(0, 0, z, STONE_BRICKS); setb(SX-1, 0, z, STONE_BRICKS)
fill(PLAT[0], PLAT[1], 1, 1, PLAT[2], PLAT[3], STONE_BRICKS)  # 台基
for x in range(PLAT[0], PLAT[1]+1):                           # 台缘光面安山岩
    setb(x, 1, PLAT[2], SMOOTH_ANDES); setb(x, 1, PLAT[3], SMOOTH_ANDES)
for z in range(PLAT[2], PLAT[3]+1):
    setb(PLAT[0], 1, z, SMOOTH_ANDES); setb(PLAT[1], 1, z, SMOOTH_ANDES)
# 室内地板: 樱木板
fill(WX0+1, WX1-1, 1, 1, WZ0+1, WZ1-1, CHERRY_PLK)
# 中央甬道红毯 (避开香炉台)
for x in range(WX0+2, WX1-1):
    if not (DAIS[0] <= x <= DAIS[1]):
        for z in (17, 18):
            setb(x, 2, z, RED_CARPET)

# ============ 2. 墙体 ============
# 四面墙: 南北 z6/z29 (x6..57), 东西 x6/x57 (z6..29)
for x in range(WX0, WX1+1):
    for y in range(WY0, WY1+1):
        setb(x, y, WZ0, SMOOTH_SAND); setb(x, y, WZ1, SMOOTH_SAND)
for z in range(WZ0, WZ1+1):
    for y in range(WY0, WY1+1):
        setb(WX0, y, z, SMOOTH_SAND); setb(WX1, y, z, SMOOTH_SAND)
# 额枋: 墙顶一圈红
for x in range(WX0, WX1+1):
    setb(x, BAND_Y, WZ0, RED_WOOL); setb(x, BAND_Y, WZ1, RED_WOOL)
for z in range(WZ0, WZ1+1):
    setb(WX0, BAND_Y, z, RED_WOOL); setb(WX1, BAND_Y, z, RED_WOOL)
# 角柱 + 南北墙壁柱 (红)
PILasters = [WX0, 13, 20, FRAME_L, FRAME_R, 42, 49, WX1]
for px in PILasters:
    for y in range(WY0, BAND_Y+1):
        setb(px, y, WZ0, RED_WOOL); setb(px, y, WZ1, RED_WOOL)
for pz in (WZ0, WZ1):
    for y in range(WY0, BAND_Y+1):
        setb(WX0, y, pz, RED_WOOL); setb(WX1, y, pz, RED_WOOL)
# 东西山墙直棂窗: y4..8, z9..26, (z+y) 奇偶红玻璃格栅; y3 杉木窗下枋
for gx in (WX0, WX1):
    for z in range(9, 27):
        setb(gx, 3, z, CEDAR_PLK)
        for y in range(4, 9):
            setb(gx, y, z, RED_GLASS if (z + y) % 2 == 0 else SMOOTH_SAND)
# 大门 (南北): x29..36, y2..7 空洞; 门框红柱 + 金色门楣
for dx in (FRAME_L, FRAME_R):
    for pz in (WZ0, WZ1):
        for y in range(WY0, BAND_Y+1):
            setb(dx, y, pz, RED_WOOL)
for pz in (WZ0, WZ1):
    for x in range(DX0, DX1+1):
        for y in range(WY0, DY1+1):
            setb(x, y, pz, AIR)
    for x in range(KEY_X0, KEY_X1+1):
        setb(x, DY1+1, pz, GOLD_BLOCK)

# ============ 3. 天花与梁架 ============
fill(WX0, WX1, 10, 10, WZ0, WZ1, CEDAR_PLK)          # 天花一圈+满铺杉木
for bz in BEAM_Z:
    fill(WX0+1, WX1-1, 10, 10, bz, bz, DARK_RED_ST)  # 纵梁
for bx in BEAM_X:
    fill(bx, bx, 10, 10, WZ0+1, WZ1-1, DARK_RED_ST)  # 横梁
# 室内柱: 柱础暗红石, 柱身红
for cz in COL_ROWS:
    for cx in COL_XS:
        setb(cx, 2, cz, DARK_RED_ST)
        for y in range(3, 10):
            setb(cx, y, cz, RED_WOOL)

# ============ 4. 中央香炉台与吊灯 ============
fill(DAIS[0], DAIS[1], 2, 2, DAIS[2], DAIS[3], SMOOTH_ANDES)
fill(DAIS_GOLD[0], DAIS_GOLD[1], 2, 2, DAIS_GOLD[2], DAIS_GOLD[3], GOLD_BLOCK)
for lx in (31, 32):                                   # 台顶正上方宫灯
    for lz in (17, 18):
        setb(lx, 9, lz, DIM_LAMP)
for lx in (24, 48):                                   # 甬道吊灯
    for lz in (17, 18):
        setb(lx, 9, lz, DIM_LAMP)

# ============ 5. 指令方块 (Code Block 1510) ============
code_block_zones = {}
zi_ = 0
for (px0, px1) in BUY_PANELS:                         # 购买区 4 区 x 25
    for side, pz in (("north", WZ0), ("south", WZ1)):
        zi_ += 1
        zone = f"buy_zone{zi_}"
        coords = []
        for x in range(px0, px1+1):
            for y in range(BUY_Y0, BUY_Y1+1):
                setb(x, y, pz, CODE_BLOCK); coords.append([x, y, pz])
        code_block_zones[zone] = {"wall": side, "panel": [px0, px1],
                                  "y": [BUY_Y0, BUY_Y1], "coords": coords,
                                  "count": len(coords)}
for zi, (px0, px1) in enumerate(SELL_PANELS, 1):      # 变卖区 2 面 x 2 板 x 10 = 40
    for side, pz in (("north", WZ0), ("south", WZ1)):
        zone = f"sell_panel{zi}_{side}"
        coords = []
        for x in range(px0, px1+1):
            for y in range(SELL_Y0, SELL_Y1+1):
                setb(x, y, pz, CODE_BLOCK); coords.append([x, y, pz])
        code_block_zones[zone] = {"wall": side, "panel": [px0, px1],
                                  "y": [SELL_Y0, SELL_Y1], "coords": coords,
                                  "count": len(coords)}
# 面板下金色压条
for (px0, px1) in BUY_PANELS:
    for pz in (WZ0, WZ1):
        for x in range(px0, px1+1):
            setb(x, BUY_Y0-1, pz, GOLD_BLOCK)
for (px0, px1) in SELL_PANELS:
    for pz in (WZ0, WZ1):
        for x in range(px0, px1+1):
            setb(x, SELL_Y0-1, pz, GOLD_BLOCK)

# ============ 6. 屋顶 (灰瓦歇山简化 + 飞檐翘角) ============
ry0, ry1, rz0, rz1 = ROOF_L1
for x in range(ry0, ry1+1):                           # 檐口: 红椽环 + 杉木檐底
    for z in range(rz0, rz1+1):
        edge = x in (ry0, ry1) or z in (rz0, rz1)
        setb(x, 11, z, RED_WOOL if edge else CEDAR_PLK)
for (y, x0, x1, z0, z1) in ROOF_STEPS:
    fill(x0, x1, y, y, z0, z1, GRAY_CONC)
fill(RIDGE[0], RIDGE[1], RIDGE_Y, RIDGE_Y, RIDGE[2], RIDGE[3], BLACK_WOOL)
for fx in ((RIDGE[0], RIDGE[0]+1), (RIDGE[1]-1, RIDGE[1])):   # 鸱吻
    for lz in (17, 18):
        for x in fx:
            setb(x, FIN_Y, lz, BLACK_WOOL)
for gx in (RIDGE[0]-1, RIDGE[1]+1):                   # 吻尾鎏金
    for lz in (17, 18):
        setb(gx, FIN_Y, lz, GOLD_BLOCK)
for (fx, fz) in ((ry0-1, rz0-1), (ry0-1, rz1+1),      # 飞檐翘角
                 (ry1+1, rz0-1), (ry1+1, rz1+1)):
    setb(fx, 12, fz, GRAY_CONC)
    setb(fx - (1 if fx < SX//2 else -1), 13, fz - (1 if fz < SZ//2 else -1), GOLD_BLOCK)

# ============ 7. 灯柱与樱桃树 ============
for (px, pz) in POSTS:
    for y in (2, 3, 4):
        setb(px, y, pz, CEDAR_LOG)
    setb(px, 5, pz, JACK_LANTERN)
for (tx, tz) in TREES:
    for y in (2, 3, 4, 5):
        setb(tx, y, tz, CHERRY_LOG)
    for dx in range(-2, 3):                           # y5 五五盘
        for dz in range(-2, 3):
            setb(tx+dx, 5, tz+dz, CHERRY_LEAF)
    for dx in range(-1, 2):                           # y6 三三盘
        for dz in range(-1, 2):
            setb(tx+dx, 6, tz+dz, CHERRY_LEAF)
    setb(tx, 7, tz, CHERRY_LEAF)                      # 顶
    for dx, dz in ((1,0), (-1,0), (0,1), (0,-1)):
        setb(tx+dx, 7, tz+dz, CHERRY_LEAF)
# 树干穿过树冠, 后写覆盖
for (tx, tz) in TREES:
    for y in (5,):
        setb(tx, y, tz, CHERRY_LOG)

# ============ 8. Avro schema0 序列化 ============
def zz(n):
    """Avro int: zigzag + varint"""
    v = (n << 1) if n >= 0 else ((-n << 1) - 1)
    out = bytearray()
    while True:
        b = v & 0x7F
        v >>= 7
        if v:
            out.append(b | 0x80)
        else:
            out.append(b)
            return bytes(out)

def avro_bytes(b):
    return zz(len(b)) + b

def leb128(n):
    """无符号 LEB128 (RLE 用, 非 zigzag)"""
    out = bytearray()
    while True:
        b = n & 0x7F
        n >>= 7
        if n:
            out.append(b | 0x80)
        else:
            out.append(b)
            return bytes(out)

def rle_encode(flat):
    out = bytearray()
    i, n = 0, len(flat)
    while i < n:
        j = i
        v = flat[i]
        while j < n and flat[j] == v:
            j += 1
        out += leb128(j - i) + leb128(v)
        i = j
    return bytes(out)

def build_schematic(name):
    # 分桶到 32^3 区块, 块内 idx = lx*1024 + ly*32 + lz
    chunks = {}
    for (x, y, z), bid in blocks.items():
        key = (x >> 5, y >> 5, z >> 5)
        flat = chunks.setdefault(key, [AIR] * (32*32*32))
        flat[(x & 31) * 1024 + (y & 31) * 32 + (z & 31)] = bid
    buf = bytearray(b"\x00" * 4)                # headers: fixed(4)
    buf += avro_bytes(name.encode("utf-8"))     # name: string
    buf += zz(0) * 3                            # x, y, z (原点)
    buf += zz(SX) + zz(SY) + zz(SZ)
    keys = sorted(chunks)
    buf += zz(len(keys))                        # chunks: array (block count)
    for (cx, cy, cz) in keys:
        buf += zz(cx) + zz(cy) + zz(cz)
        buf += avro_bytes(rle_encode(chunks[(cx, cy, cz)]))
    buf += zz(0)                                # array 终止符
    return bytes(buf)

# ============ 9. 校验: 解码回读比对 ============
def rle_decode(data, cap):
    out, i = [], 0
    while i < len(data) and len(out) < cap:
        amount, i = _read_leb(data, i)
        bid, i = _read_leb(data, i)
        out.extend([bid] * amount)
    return out

def _read_leb(data, i):
    shift, val = 0, 0
    while True:
        b = data[i]; i += 1
        val |= (b & 0x7F) << shift
        if not (b & 0x80):
            return val, i
        shift += 7

def zzd(v):
    """zigzag 解码"""
    return (v >> 1) ^ -(v & 1)

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
        assert len(flat) == 32*32*32, f"chunk {c} 解码长度 {len(flat)} != 32768"
        for lx in range(32):
            for ly in range(32):
                for lz in range(32):
                    bid = flat[lx*1024 + ly*32 + lz]
                    if bid != AIR:
                        got.add((c[0]*32+lx, c[1]*32+ly, c[2]*32+lz, bid))
    assert data[i:i+1] == b"\x00", "缺少 chunks 数组终止符"
    return name, sizes, got

# ============ 主流程 ============
if __name__ == "__main__":
    total_cb = sum(z["count"] for z in code_block_zones.values())
    print(f"[BUILD] 总方块 {len(blocks)}, Code Block {total_cb} "
          f"(购买 {sum(z['count'] for n,z in code_block_zones.items() if n.startswith('buy'))}, "
          f"变卖 {sum(z['count'] for n,z in code_block_zones.items() if n.startswith('sell'))})")
    data = build_schematic("SpawnLobby_CN")
    name, sizes, got = verify(data)
    expect = {(x, y, z, b) for (x, y, z), b in blocks.items()}
    assert got == expect, f"回读不一致! 文件 {len(got)} vs 构建 {len(expect)}"
    assert name == "SpawnLobby_CN" and tuple(sizes) == (SX, SY, SZ)
    xs = [p[0] for p in blocks]; ys = [p[1] for p in blocks]; zs = [p[2] for p in blocks]
    assert max(xs) < SX and max(ys) < SY and max(zs) < SZ, "越界!"
    cb = sum(1 for v in blocks.values() if v == CODE_BLOCK)
    assert cb == 140, f"Code Block 数量 {cb} != 140"
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "spawn_lobby.bloxdschem")
    with open(out_path, "wb") as f:
        f.write(data)
    json_path = os.path.join(out_dir, "lobby_code_blocks.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(code_block_zones, f, ensure_ascii=False, indent=1)
    used = {}
    for b in blocks.values():
        used[ID_NAME[b]] = used.get(ID_NAME[b], 0) + 1
    print(f"[OK] {out_path}  ({len(data)/1024:.1f} KB, 区块 2x1x2=4)")
    print(f"[OK] {json_path}")
    print("[方块统计]")
    for n, c in sorted(used.items(), key=lambda kv: -kv[1]):
        print(f"   {n}: {c}")
    print("[Code Block 分区]")
    for n, z in code_block_zones.items():
        print(f"   {n}: {z['wall']}墙 x{z['panel'][0]}..{z['panel'][1]} y{z['y'][0]}..{z['y'][1]} = {z['count']}")
