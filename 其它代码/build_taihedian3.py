# -*- coding: utf-8 -*-
"""
太和殿复刻 v3 · 半砖细节版 + 分文件输出
========================================
背景: v2 (88×40×80, 18 区块, 48354 块) 游戏内只导入约 1/3 —— v1 (4 区块,
各轴<=64, 1.3 万块) 完整, 因此按 M2B 的做法把蓝图切片成多个小文件输出,
每个文件 4 区块 / 各轴<=40 / 约 8 千块, 全部落在 v1 已验证的安全包络内。

输出: output/taihedian_v3_p1..p6.bloxdschem + output/taihedian_v3_manifest.txt
粘贴布局 (X向东, Z向南):
  p1(0,0)    p2(+32,0)    p3(+64,0)
  p4(0,+40)  p5(+32,+40)  p6(+64,+40)

v3 新细节 (在 v2 基础上叠加, 均为官方表内新方块的"裸名字"默认态):
- 屋面瓦垄: 下檐每层坡沿 + 上檐每层坡沿加 Yellow Concrete Slab 半砖过渡,
  屋顶曲线平滑一倍
- 螭首改 Smooth Andesite Slab 半砖吐水口
- 望柱头改 White Concrete Slab 方斗式柱头
- 台基各层上枋挑边 Smooth Stone Slab (御路豁口断开)
- 金正脊加 Golden Decoration 行什 x4
- 东西山墙内侧 Cedar Ladder 检修梯 (可爬到檐口)
半砖/梯子 ID 均已对照 M2B idToNameJson。
"""

import build_taihedian2 as base
from build_lobby import (zz, avro_bytes, rle_encode, _read_leb, rle_decode, zzd, AIR)

# ---- 新方块 ID (M2B 表核实, 裸名字=默认态: 半砖为下半砖) ----
SSS   = 727    # Smooth Stone Slab
SAS   = 763    # Smooth Andesite Slab
SBS   = 739    # Stone Bricks Slab
YCS   = 1125   # Yellow Concrete Slab
WCS   = 1131   # White Concrete Slab
SRSS  = 865    # Smooth Red Sandstone Slab
ERSS  = 871    # Engraved Red Sandstone Slab
CEDLAD = 1020  # Cedar Ladder
GDEC  = base.GDEC
REDW  = base.REDW
YEL   = base.YEL
WHITE = base.WHITE
GOLD_BLOCK = base.GOLD_BLOCK
SMOOTH_ANDES = base.SMOOTH_ANDES
WWOOL = base.WWOOL

SX, SY, SZ = base.SX, base.SY, base.SZ          # 88 x 40 x 80
blocks = base.blocks                             # v2 全量 (引用, 直接改)

def setb(x, y, z, bid):
    if bid == AIR:
        blocks.pop((x, y, z), None)
    else:
        blocks[(x, y, z)] = bid

# ============ 1. 下檐瓦垄: 每层坡外沿加半砖 (y19..27 层) ============
for k in range(9):
    y = base.FANG + k
    x0, x1, z0, z1 = 7 + k, 81 - k, 20 + k, 58 - k
    for x in range(x0, x1 + 1):
        for z in (z0, z1):
            if not (base.UX0 <= x <= base.UX1 and base.UZ0 <= z <= base.UZ1):
                setb(x, y + 1, z, YCS)
    for z in range(z0, z1 + 1):
        for x in (x0, x1):
            if not (base.UX0 <= x <= base.UX1 and base.UZ0 <= z <= base.UZ1):
                setb(x, y + 1, z, YCS)

# ============ 2. 上檐瓦垄 ============
for (y, x0, x1, z0, z1) in [(32, 14, 74, 27, 51), (33, 15, 73, 28, 50),
                            (34, 16, 72, 29, 49), (35, 18, 70, 31, 47),
                            (36, 22, 66, 35, 43)]:
    for x in range(x0, x1 + 1):
        setb(x, y + 1, z0, YCS); setb(x, y + 1, z1, YCS)
    for z in range(z0, z1 + 1):
        setb(x0, y + 1, z, YCS); setb(x1, y + 1, z, YCS)
setb(27, 37, 39, GDEC); setb(61, 37, 39, GDEC)                      # 鸱吻保持
for rx in (32, 40, 48, 56):                                          # 行什
    setb(rx, 37, 39, GDEC)

# ============ 3. 螭首改半砖吐水口 (托架保留) ============
for z in base.CHI_Z:
    for (fy, fx_in, fx_out) in ((3, base.T2[0], base.T2[0]-1), (3, base.T2[1], base.T2[1]+1),
                                (5, base.T3[0], base.T3[0]-1), (5, base.T3[1], base.T3[1]+1)):
        setb(fx_out, fy, z, SAS)
for x in base.CHI_X:
    for (fy, fz_in, fz_out) in ((3, base.T2[2], base.T2[2]-1), (3, base.T2[3], base.T2[3]+1),
                                (5, base.T3[2], base.T3[2]-1), (5, base.T3[3], base.T3[3]+1)):
        setb(x, fy, fz_out, SAS)

# ============ 4. 望柱头改方斗半砖 ============
# v2 里望柱头顶块是 WWOOL, 全部替换为 White Concrete Slab
for pos, bid in list(blocks.items()):
    if bid == WWOOL:
        setb(*pos, WCS)

# ============ 5. 台基上枋挑边半砖 (各层脸外一圈, 御路豁口断开) ============
RAMP = base.RAMP
def edge_slab(axis, fixed, y, lo, hi):
    for v in range(lo, hi + 1):
        if axis == 'z' and RAMP[0] <= v <= RAMP[1]:
            continue                                                 # 御路豁口
        x, z = (v, fixed) if axis == 'z' else (fixed, v)
        setb(x, y, z, SSS)
T1, T2, T3 = base.T1, base.T2, base.T3
edge_slab('z', T1[2]-1, 2, T1[0]-1, T1[1]+1); edge_slab('z', T1[3]+1, 2, T1[0]-1, T1[1]+1)
edge_slab('x', T1[0]-1, 2, T1[2]-1, T1[3]+1); edge_slab('x', T1[1]+1, 2, T1[2]-1, T1[3]+1)
edge_slab('z', T2[2]-1, 4, T2[0]-1, T2[1]+1); edge_slab('z', T2[3]+1, 4, T2[0]-1, T2[1]+1)
edge_slab('x', T2[0]-1, 4, T2[2]-1, T2[3]+1); edge_slab('x', T2[1]+1, 4, T2[2]-1, T2[3]+1)
edge_slab('z', T3[2]-1, 6, T3[0]-1, T3[1]+1); edge_slab('z', T3[3]+1, 6, T3[0]-1, T3[1]+1)
edge_slab('x', T3[0]-1, 6, T3[2]-1, T3[3]+1); edge_slab('x', T3[1]+1, 6, T3[2]-1, T3[3]+1)

# ============ 6. 山墙内侧 Cedar Ladder 检修梯 ============
for lz in (39,):
    for y in range(base.WY0, base.WY1 + 1):
        setb(12, y, lz, CEDLAD)
        setb(76, y, lz, CEDLAD)

# ============ 7. 切片输出 (X 3 段 x Z 2 段 = 6 文件) ============
XS = [(0, 31), (32, 63), (64, 87)]
ZS = [(0, 39), (40, 79)]

def serialize(name, sizes, part_blocks):
    chunks = {}
    for (x, y, z), bid in part_blocks.items():
        key = (x >> 5, y >> 5, z >> 5)
        flat = chunks.setdefault(key, [AIR] * (32*32*32))
        flat[(x & 31) * 1024 + (y & 31) * 32 + (z & 31)] = bid
    buf = bytearray(b"\x00" * 4)
    buf += avro_bytes(name.encode("utf-8"))
    buf += zz(0) * 3
    buf += zz(sizes[0]) + zz(sizes[1]) + zz(sizes[2])
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
        v, i = _read_leb(data, i)
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
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output")
    os.makedirs(out_dir, exist_ok=True)
    manifest = ["太和殿 v3 分件粘贴清单 (X向东, Z向南, 单位: 方块)",
                "先放 p1, 之后每个文件按偏移量摆放:", ""]
    n = 0
    all_got = set()
    for pi, (zx0, zx1) in enumerate(XS, 1):
        for zi, (zz0, zz1) in enumerate(ZS, 1):
            n += 1
            part = {(x - zx0, y, z - zz0): b for (x, y, z), b in blocks.items()
                    if zx0 <= x <= zx1 and zz0 <= z <= zz1}
            sx = zx1 - zx0 + 1
            sz = zz1 - zz0 + 1
            data = serialize(f"TaiHeDian_p{n}", (sx, SY, sz), part)
            name, sizes, got = verify(data)
            assert name == f"TaiHeDian_p{n}" and tuple(sizes) == (sx, SY, sz)
            expect = {(x, y, z, b) for (x, y, z), b in part.items()}
            assert got == expect, f"p{n} 回读不一致!"
            all_got |= {(x + zx0, y, z + zz0, b) for (x, y, z, b) in got}
            path = os.path.join(out_dir, f"taihedian_v3_p{n}.bloxdschem")
            with open(path, "wb") as f:
                f.write(data)
            manifest.append(f"p{n}: 范围 x{zx0}..{zx1} z{zz0}..{zz1}  "
                            f"粘贴偏移 X+{zx0} Z+{zz0}  ({sx}x{SY}x{sz}, "
                            f"{len(part)} 块, {len(data)/1024:.1f}KB)")
    expect_all = {(x, y, z, b) for (x, y, z), b in blocks.items()}
    assert all_got == expect_all, "分片并集 != 全量!"
    used = {}
    for b in blocks.values():
        used[b] = used.get(b, 0) + 1
    from build_taihedian2 import ID_NAME as N2
    names = {SSS: "Smooth Stone Slab", SAS: "Smooth Andesite Slab", SBS: "Stone Bricks Slab",
             YCS: "Yellow Concrete Slab", WCS: "White Concrete Slab", SRSS: "Smooth Red Sandstone Slab",
             ERSS: "Engraved Red Sandstone Slab", CEDLAD: "Cedar Ladder"}
    names.update(N2)
    with open(os.path.join(out_dir, "taihedian_v3_manifest.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(manifest))
    print("\n".join(manifest))
    print(f"[OK] 6 件并集校验通过, 总方块 {len(blocks)}")
    print("[新增方块统计]")
    for b in (SSS, SAS, YCS, WCS, CEDLAD, GDEC):
        print(f"   {names.get(b, b)}: {used.get(b, 0)}")
