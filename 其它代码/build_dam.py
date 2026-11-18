# -*- coding: utf-8 -*-
"""
三角洲行动 · 零号大坝 复原蓝图生成器 v2 (400 x 200)
====================================================
用户要求: 地图至少 400x200; 原点(0,0,0)=西南角检查站=出生基点;
  +X = 用户 x 轴(东), +Z = 用户 y 轴(南), +Y = 高度 (SY=32)
复原对象: 三角洲行动「零号大坝」(非自制), 点位/方位/撤离点类型按公开攻略:
  西区: 军营(管道=丢包撤离) / 水泥厂(随机撤离)
  北区: 水库 / 大坝(坝顶=限重撤离, 坝内廊道+金库, 泄洪道) / 行政楼(金库隧道,
        工业电梯=电梯撤离, Boss 塞伊德) / 发电厂房
  东区: 主变电站(拉闸点) / 备用电站(西南=付费撤离) / 游客中心(南=随机撤离)
  固定撤离: 东西谷底隧道口; 断桥; 南侧河滩
输出: output/dam400/dam400_p01..p28.bloxdschem (64x32x50/件, 4 区块, v1 安全包络)
      output/dam400/manifest.txt + dam_meta.json
配套: 生成大坝并关机.bat  (构建成功后 60 秒关机, 超过 0 点同样生效)
"""

import build_taihedian3 as ser      # 复用 serialize/verify
from build_lobby import AIR

# ============ 调色板 (M2B idToNameJson 核实) ============
STONE=28; SMOOTH_ST=31; SAND=5; GRAVEL=7; WATER=126; GRASS=4
PINE_LOG=10; PINE_LEAF=100; TGRASS=1109; DANDELION=151; POPPY=152
IRON=47; GOLD=48; GLASS=106; LAMP=124
CONC_G=84; CONC_LG=85; CONC_W=97
SB=129; SSS=727; DARKRED=131; CEDAR=12; CEDLAD=1020
WWOOL=51; OWOOL=52; LWOOL=56; GWool=58; BWOOL=66

ID_NAME = {STONE:"Stone", SMOOTH_ST:"Smooth Stone", SAND:"Sand", GRAVEL:"Gravel",
           WATER:"Water", GRASS:"Grass Block", PINE_LOG:"Pine Log", PINE_LEAF:"Pine Leaves",
           TGRASS:"Tall Grass", DANDELION:"Dandelion", POPPY:"Poppy", IRON:"Block of Iron",
           GOLD:"Block of Gold", GLASS:"Glass", LAMP:"Dim Lamp On", CONC_G:"Gray Concrete",
           CONC_LG:"Light Gray Concrete", CONC_W:"White Concrete", SB:"Stone Bricks",
           SSS:"Smooth Stone Slab", DARKRED:"Dark Red Stone", CEDAR:"Cedar Log",
           CEDLAD:"Cedar Ladder", WWOOL:"White Wool", OWOOL:"Orange Wool",
           LWOOL:"Lime Wool", GWool:"Gray Wool", BWOOL:"Black Wool"}

SX, SY, SZ = 400, 32, 200
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

# ============ 1. 高度图 ============
H = [[3] * SZ for _ in range(SX)]          # 默认谷地 y3
M = [[GRASS] * SZ for _ in range(SX)]
def region(x0, x1, z0, z1, h, mat=None):
    for x in range(max(0, x0), min(SX - 1, x1) + 1):
        for z in range(max(0, z0), min(SZ - 1, z1) + 1):
            H[x][z] = h
            if mat: M[x][z] = mat

region(0, 12, 0, 12, 3, SMOOTH_ST)                 # 检查站地坪 (=出生基点)
region(155, 175, 0, 131, 2, GRAVEL)                # 主河槽 (水 y3)
region(110, 155, 100, 104, 2, GRAVEL)              # 尾水渠 (厂房->河)
region(80, 118, 128, 131, 2, GRAVEL)               # 尾水渠西连段
region(130, 200, 3, 14, 3, SAND)                   # 南侧河滩
region(120, 225, 112, 117, 2, CONC_G)              # 消力池垫层
region(14, 386, 132, 199, 0)                       # 水库 (无地形, 水面 y21)
region(14, 386, 196, 199, 28, STONE)               # 北岩崖
region(0, 13, 132, 199, 28, STONE)                 # 西坝肩
region(387, 399, 132, 199, 28, STONE)              # 东坝肩
region(0, 13, 114, 131, 31, STONE)                 # 西坝顶山体(坝顶隧道)
region(387, 399, 114, 131, 31, STONE)              # 东坝顶山体
region(0, 11, 52, 84, 20, STONE)                   # 西谷底山嘴(隧道撤离)
region(388, 399, 52, 84, 20, STONE)                # 东谷底山嘴

# ============ 2. 地形蒙皮 (每柱从 min(邻柱高) 填到自身顶) ============
def h_at(x, z):
    if 0 <= x < SX and 0 <= z < SZ:
        return H[x][z]
    return None

for x in range(SX):
    for z in range(SZ):
        h = H[x][z]
        if h <= 0:
            continue
        ns = [h]
        for dx, dz in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nh = h_at(x + dx, z + dz)
            if nh is None:
                continue
            ns.append(21 if nh == 0 else nh)       # 水邻柱按水面算(只填水线以上)
        y0 = max(2, min(ns))
        mat = M[x][z]
        for y in range(y0, h + 1):
            setb(x, y, z, mat if y == h else (STONE if h - y >= 2 else mat))

# ============ 3. 水系 ============
for x in range(14, 387):                           # 水库水面 y21
    for z in range(132, 200):
        setb(x, 21, z, WATER)
for x in range(155, 176):                          # 主河槽 y3
    for z in range(0, 132):
        setb(x, 3, z, WATER)
for x in range(110, 156):                          # 尾水渠
    for z in range(100, 105):
        setb(x, 3, z, WATER)
for x in range(80, 119):
    for z in range(128, 132):
        setb(x, 3, z, WATER)
for x in range(120, 226):                          # 消力池 y3..4
    for z in range(112, 118):
        if 187 <= x <= 191:                        # 行政楼隧道涵洞段保持干燥
            continue
        setb(x, 3, z, CONC_G)
        for y in (3, 4):
            setb(x, y, z, WATER)
for x in range(130, 201):                          # 河滩浅水
    for z in range(3, 15):
        if (x + z) % 4:
            setb(x, 3, z, WATER)
for (rx, rz0, rz1) in ((154, 100, 105), (176, 100, 105),   # 河岸护坡
                       (109, 100, 105), (119, 128, 132), (79, 128, 132)):
    for z in range(rz0, rz1 + 1):
        if H[rx][z] >= 3:
            setb(rx, 3, z, GRAVEL)

# ============ 4. 大坝 (z120..131, 坝顶 y22, 全宽 400) ============
CREST = 22
SPX0, SPX1 = 150, 185                              # 泄洪道
for x in range(SX):
    spill = SPX0 <= x <= SPX1
    top = 19 if spill else CREST
    for z in (128, 129, 130, 131):                 # 坝顶路面(泄洪段降为缺口)
        setb(x, top, z, CONC_W)
    if not spill and not (96 <= x <= 108 or 290 <= x <= 302):
        setb(x, CREST + 1, 128, CONC_W); setb(x, CREST + 1, 131, CONC_W)  # 护栏(楼梯桥口留空)
    for y in range(5, CREST + 1):                  # 上游面(水库侧 z131)
        setb(x, y, 131, CONC_W if y % 4 == 0 else CONC_LG)
    for (z, tp) in [(127, 20), (126, 17), (125, 14), (124, 11), (123, 8)]:
        for y in range(5, tp + 1):                 # 下游阶梯面
            setb(x, y, z, CONC_LG if (x // 8) % 2 else CONC_G)
    for y in range(4, 8):                          # 坝趾
        for z in (118, 119):
            setb(x, y, z, CONC_G)
# 坝内廊道 (y5..8, z122..129, 泄洪段断开)
for (gx0, gx1) in ((8, 149), (186, 392)):
    fill(gx0, gx1, 5, 8, 122, 129, AIR)
    fill(gx0, gx1, 4, 4, 122, 129, CONC_G); fill(gx0, gx1, 9, 9, 122, 129, CONC_G)
    fill(gx0, gx1, 5, 8, 122, 122, CONC_G)         # 北墙
    for x in range(gx0 + 2, gx1, 12):
        setb(x, 5, 125, LAMP)
# 金库 (坝体内 x192..204)
fill(192, 204, 5, 8, 124, 128, SB)
fill(193, 203, 6, 8, 125, 127, AIR)
for x in range(193, 204):
    for z in (125, 127):
        for y in (6, 8):
            setb(x, y, z, GOLD)
fill(191, 191, 5, 8, 124, 128, CONC_G)
setb(191, 6, 126, AIR); setb(191, 7, 126, AIR)
setb(191, 5, 127, LAMP)
# 行政楼->坝体 隧道 (x188..190, z70..122)
fill(188, 190, 5, 8, 70, 122, AIR)
fill(188, 190, 4, 4, 70, 122, CONC_G)
fill(188, 190, 9, 9, 70, 122, CONC_G)
for z in range(74, 122, 10):
    setb(189, 5, z, LAMP)
# 泄洪道: 闸门 + 泄槽过水
for x in range(SPX0, SPX1 + 1):
    for y in range(19, 23):
        setb(x, y, 129, IRON)
    setb(x, 19, 131, CONC_W)
    for (z, tp) in [(127, 20), (126, 17), (125, 14), (124, 11), (123, 8)]:
        for y in range(tp, tp + 2):
            setb(x, y, z, WATER)
    for z in (118, 119):
        for y in range(4, 8):
            setb(x, y, z, WATER)
# 上坝楼梯 x2 (西 x96..108, 东 x290..302) + 顶桥
for rx in (96, 290):
    ya = 4
    for fl, z in enumerate((116, 112)):
        x0 = rx if fl == 0 else rx + 12
        x1 = rx + 12 if fl == 0 else rx
        step_h = 9 if fl == 0 else 10
        for i in range(13):
            y = ya + i * step_h // 12
            x = x0 + (x1 - x0) * i // 12
            fill(x, x, 4, y, z, z + 1, CONC_G)
        ya = 13
    fill(rx, rx + 12, 23, 23, 114, 127, CONC_G)    # 顶桥接坝顶
    for px in (rx, rx + 6, rx + 12):
        fill(px, px, 4, 22, 117, 117, CONC_G)
# 坝顶设施: 岗亭 + 限重撤离点
for bx in (30, 370):
    fill(bx, bx + 2, 23, 25, 129, 131, CONC_W)
    fill(bx, bx + 2, 26, 26, 129, 131, CONC_G)
    setb(bx + 1, 24, 130, GLASS)

# ============ 5. 发电厂房 (x30..110, z70..114) ============
fill(30, 110, 3, 3, 70, 114, CONC_G)
fill(30, 110, 4, 18, 70, 70, CONC_G)
fill(30, 110, 4, 18, 114, 114, CONC_LG)
fill(30, 30, 4, 18, 70, 114, CONC_G); fill(110, 110, 4, 18, 70, 114, CONC_G)
fill(31, 109, 4, 18, 71, 113, AIR)
for x in range(33, 109, 4):
    for y in (11, 12, 13):
        setb(x, y, 114, GLASS)
fill(60, 70, 4, 10, 114, 114, AIR)                 # 大门
fill(30, 110, 19, 19, 70, 114, CONC_LG)
for x in range(30, 111, 3):
    setb(x, 20, 114, SSS); setb(x, 20, 70, SSS)
for tx in (42, 60, 78, 96):                        # 4 水轮机组
    for dx in (-2, -1, 0, 1, 2):
        for dz in (-2, -1, 0, 1, 2):
            if dx * dx + dz * dz <= 5:
                for y in range(4, 11):
                    setb(tx + dx, y, 92 + dz, IRON)
    setb(tx, 11, 92, GOLD)
fill(31, 109, 17, 17, 92, 92, IRON)                # 天车梁
for x in range(33, 109, 5):
    setb(x, 16, 92, CEDLAD)
for x in range(34, 108, 8):
    for z in (76, 108):
        setb(x, 15, z, LAMP)

# ============ 6. 行政楼 (x180..205, z70..96, 4层) ============
fill(180, 205, 3, 3, 70, 96, SMOOTH_ST)
for (y0, y1) in ((4, 7), (8, 11), (12, 15), (16, 19)):
    fill(180, 205, y0, y1, 70, 70, CONC_W)
    fill(180, 205, y0, y1, 96, 96, CONC_W)
    fill(180, 180, y0, y1, 70, 96, CONC_W); fill(205, 205, y0, y1, 70, 96, CONC_W)
    fill(181, 204, y0, y1, 71, 95, AIR)
for y in (5, 6, 9, 10, 13, 14, 17, 18):
    for x in range(183, 203):
        setb(x, y, 96, GLASS)
fill(190, 195, 4, 7, 96, 96, AIR)                  # 正门
fill(188, 190, 5, 8, 70, 70, AIR)                  # 金库隧道接口
for (fy, ly) in ((8, 8), (12, 12), (16, 16)):
    fill(183, 202, fy, fy, 71, 95, CONC_LG)
for y in range(8, 20):                             # 楼梯井(梯贯穿楼板)
    setb(184, y, 92, CEDLAD)
fill(180, 205, 20, 20, 70, 96, CONC_W)
for x in range(180, 206, 3):
    setb(x, 21, 96, SSS)
for (lx, lz) in ((184, 74), (200, 74), (184, 92), (200, 92)):
    setb(lx, 6, lz, LAMP); setb(lx, 10, lz, LAMP); setb(lx, 14, lz, LAMP); setb(lx, 18, lz, LAMP)
# 工业电梯 (电梯撤离点)
fill(208, 212, 3, 3, 70, 74, CONC_G)
for (cx, cz) in ((208, 70), (212, 70), (208, 74), (212, 74)):
    fill(cx, cx, 4, 20, cz, cz, IRON)
for y in (4, 9, 14, 20):
    fill(208, 212, y, y, 70, 74, IRON)
fill(209, 211, 4, 19, 71, 73, AIR)
setb(210, 5, 73, GOLD)
for y in range(8, 19):
    setb(210, y, 71, CEDLAD)
fill(206, 207, 3, 3, 71, 73, SMOOTH_ST)

# ============ 7. 军营 (x16..90, z20..58) ============
fill(16, 90, 3, 3, 20, 58, CONC_G)
for (bx0, bx1, bz0, bz1) in ((18, 38, 24, 34), (44, 64, 24, 34),
                             (18, 38, 40, 50), (44, 64, 40, 50)):
    fill(bx0, bx1, 4, 8, bz0, bz1, CONC_G)
    fill(bx0 + 1, bx1 - 1, 4, 8, bz0 + 1, bz1 - 1, AIR)
    fill(bx0, bx1, 9, 9, bz0, bz1, DARKRED)
    fill(bx0 + 3, bx1 - 3, 4, 5, bz1, bz1, AIR)
for (fx, fz) in ((24, 34), (52, 34), (24, 50), (52, 50)):
    setb(fx, 5, fz, GLASS); setb(fx, 6, fz, GLASS)
for (tx, tz) in ((70, 26), (70, 52)):              # 瞭望塔
    fill(tx, tx, 4, 14, tz, tz, CEDAR)
    fill(tx - 1, tx + 1, 10, 10, tz - 1, tz + 1, CONC_G)
    fill(tx - 1, tx + 1, 14, 14, tz - 1, tz + 1, CONC_G)
for y in range(4, 9):                              # 旗杆
    setb(54, y, 46, CEDAR)
setb(54, 9, 46, OWOOL); setb(54, 10, 46, OWOOL)
# 丢包管道 (x30..40, z54..56)
fill(29, 41, 5, 7, 53, 57, IRON)
fill(30, 40, 5, 7, 54, 56, AIR)
setb(35, 5, 55, LWOOL); setb(35, 7, 55, LAMP)

# ============ 8. 水泥厂 (x115..150, z85..110) ============
fill(115, 150, 3, 3, 85, 110, CONC_LG)
for (cx, cz) in ((120, 88), (132, 88), (144, 88), (120, 98), (132, 98), (144, 98)):
    r = 3
    for dx in range(-r, r + 1):
        for dz in range(-r, r + 1):
            if dx * dx + dz * dz <= r * r:
                for y in range(4, 18):
                    setb(cx + dx, y, cz + dz, CONC_LG)
    for y in (7, 11, 15):
        for dx in range(-r, r + 1):
            for dz in range(-r, r + 1):
                if dx * dx + dz * dz <= r * r and (abs(dx) == r or abs(dz) == r):
                    setb(cx + dx, y, cz + dz, IRON)
    setb(cx, 18, cz, DARKRED)
fill(120, 148, 4, 12, 104, 110, CONC_G)            # 窑体
fill(121, 147, 4, 12, 105, 109, AIR)
fill(120, 148, 13, 13, 104, 110, DARKRED)
fill(132, 134, 4, 6, 110, 110, AIR)
for y in (9, 10):                                  # 栈桥
    fill(120, 120, y, y, 88, 104, CONC_G)
fill(120, 120, 11, 11, 88, 104, SSS)
for (px, pz) in ((125, 112), (130, 112), (135, 112)):
    fill(px, px + 3, 4, 4, pz, pz, IRON); setb(px + 1, 5, pz, IRON)
setb(140, 7, 96, LAMP)

# ============ 9. 主变电站 (x236..290, z90..114) ============
fill(236, 290, 3, 3, 90, 114, GRAVEL)
for x in range(236, 291):
    setb(x, 4, 90, SB); setb(x, 5, 90, SB)
    setb(x, 4, 114, SB); setb(x, 5, 114, SB)
for z in range(90, 115):
    setb(236, 4, z, SB); setb(236, 5, z, SB)
    setb(290, 4, z, SB); setb(290, 5, z, SB)
fill(256, 260, 4, 5, 114, 114, AIR)
for tx in (242, 254, 266, 278):
    for tz in (96, 108):
        fill(tx, tx + 2, 4, 5, tz, tz + 1, IRON)
        setb(tx + 1, 6, tz, CONC_LG); setb(tx + 1, 7, tz, CONC_LG)
for (px, pz) in ((240, 93), (286, 93), (240, 111), (286, 111)):
    fill(px, px, 4, 14, pz, pz, CEDAR)
    fill(px - 1, px + 1, 12, 12, pz, pz, IRON)
    fill(px - 1, px + 1, 9, 9, pz, pz, IRON)
setb(286, 4, 111, GOLD); setb(286, 5, 111, GOLD)   # 拉闸点

# ============ 10. 备用电站 + 付费点 ============
fill(240, 275, 3, 3, 98, 116, CONC_LG)
fill(240, 275, 4, 10, 98, 116, CONC_LG)
fill(241, 274, 4, 10, 99, 115, AIR)
fill(240, 275, 11, 11, 98, 116, CONC_G)
for x in range(243, 273, 4):
    setb(x, 8, 116, GLASS); setb(x, 9, 116, GLASS)
fill(254, 260, 4, 6, 116, 116, AIR)
for (tx, tz) in ((246, 104), (266, 104)):
    fill(tx, tx + 1, 4, 5, tz, tz + 1, IRON)
fill(234, 238, 3, 3, 114, 118, SMOOTH_ST)          # 付费撤离点(备用电站西南)
setb(235, 4, 116, GOLD); setb(237, 4, 116, GOLD)
setb(235, 5, 115, IRON); setb(237, 5, 115, IRON)

# ============ 11. 游客中心 (x238..288, z64..88) ============
fill(238, 288, 3, 3, 64, 88, SMOOTH_ST)
fill(238, 288, 4, 11, 64, 64, CONC_W)
fill(238, 288, 4, 11, 88, 88, CONC_W)
fill(238, 238, 4, 11, 64, 88, CONC_W); fill(288, 288, 4, 11, 64, 88, CONC_W)
fill(239, 287, 4, 11, 65, 87, AIR)
for y in (6, 7, 9, 10):
    for x in range(241, 286):
        setb(x, y, 88, GLASS)
fill(256, 264, 4, 7, 88, 88, AIR)                  # 正门
fill(238, 288, 12, 12, 64, 88, CONC_W)
for x in range(238, 289, 3):
    setb(x, 13, 88, SSS)
fill(238, 288, 3, 3, 89, 93, SMOOTH_ST)            # 停车场
for x in range(240, 287, 5):
    setb(x, 4, 90, BWOOL); setb(x, 4, 91, BWOOL)

# ============ 12. 断桥 (x145..180, z100..110, 跨主河槽) ============
fill(145, 157, 6, 7, 100, 110, CONC_G)             # 西引桥
fill(168, 180, 6, 7, 100, 110, CONC_G)             # 东引桥(断口 x158..167)
fill(146, 156, 8, 8, 100, 110, CONC_LG)
fill(169, 179, 8, 8, 100, 110, CONC_LG)
for (px, pz) in ((146, 100), (156, 100), (146, 110), (156, 110),
                 (169, 100), (179, 100), (169, 110), (179, 110)):
    fill(px, px, 4, 6, pz, pz, CONC_G)             # 桥墩
for x in (158, 160, 162, 164, 166):                # 坍落桥面块
    setb(x, 5, 104 + (x // 2) % 3, CONC_G)
    setb(x + 1, 4, 106 - (x // 2) % 3, CONC_LG)

# ============ 13. 检查站 = 出生基点 (0,0,0) ============
for y in (4, 5):
    setb(3, y, 6, CONC_G); setb(9, y, 6, CONC_G)
fill(3, 9, 6, 6, 6, 6, CONC_W)
fill(0, 2, 4, 6, 0, 2, CONC_LG)
fill(0, 2, 4, 5, 0, 1, AIR)                        # 值班亭内部
setb(1, 5, 1, GLASS)
# (0,4,0) 净空 = 玩家出生站位

# ============ 14. 道路 + 隧道 ============
fill(0, 399, 3, 3, 12, 15, SMOOTH_ST)              # 南横路
for x in range(0, 400, 12):
    setb(x, 4, 13, CONC_LG)
fill(0, 399, 3, 3, 62, 66, SMOOTH_ST)              # 主干道(谷底公路)
for x in range(0, 400, 12):
    setb(x, 4, 64, CONC_LG)
fill(4, 7, 3, 3, 16, 60, SMOOTH_ST)                # 西纵路
fill(228, 231, 3, 3, 16, 116, SMOOTH_ST)           # 东纵路
fill(148, 177, 4, 4, 62, 66, CONC_G)               # 跨河桥面(主干道)
for px in (150, 156, 162, 168, 174):
    fill(px, px, 2, 3, 61, 61, CONC_G); fill(px, px, 2, 3, 67, 67, CONC_G)
# 谷底隧道 (主干道穿山嘴)
fill(0, 11, 4, 8, 62, 66, AIR)
fill(0, 11, 3, 3, 62, 66, SMOOTH_ST)
fill(388, 399, 4, 8, 62, 66, AIR)
fill(388, 399, 3, 3, 62, 66, SMOOTH_ST)
for x in (2, 6, 391, 396):
    setb(x, 8, 63, LAMP); setb(x, 8, 65, LAMP)
# 坝顶隧道 (坝顶公路穿坝肩山体, y23)
fill(0, 13, 23, 27, 125, 130, AIR)
fill(0, 13, 22, 22, 125, 130, SMOOTH_ST)
fill(387, 399, 23, 27, 125, 130, AIR)
fill(387, 399, 22, 22, 125, 130, SMOOTH_ST)
for x in (3, 10, 390, 396):
    setb(x, 27, 126, LAMP); setb(x, 27, 129, LAMP)

# ============ 15. 撤离点标记 (绿圈 + 金柱) ============
exfils = {}
def exfil(name, kind, x0, x1, z0, z1, y=4):
    for x in range(x0, x1 + 1):
        for z in (z0, z1):
            setb(x, y, z, LWOOL)
    for z in range(z0, z1 + 1):
        setb(x0, y, z, LWOOL); setb(x1, y, z, LWOOL)
    cx, cz = (x0 + x1) // 2, (z0 + z1) // 2
    setb(cx, y, cz, GOLD); setb(cx, y + 1, cz, GOLD)
    exfils[name] = {"type": kind, "range": [x0, x1, z0, z1], "center": [cx, y + 1, cz]}

exfil("west_tunnel", "固定", 2, 6, 62, 66)
exfil("east_tunnel", "固定", 393, 397, 62, 66)
exfil("crest_weight", "限重", 190, 210, 129, 130, y=23)
exfil("camp_pipe", "丢包", 33, 37, 54, 56, y=6)
exfil("cement_random", "随机", 124, 130, 106, 109)
exfil("visitor_random", "随机", 242, 248, 60, 63)
exfil("paid", "付费", 234, 238, 114, 118)
exfil("elevator", "电梯", 208, 212, 68, 69, y=4)

# ============ 16. 草木 ============
import random
random.seed(11)
def on_grass(x, z):
    return H[x][z] == 3 and M[x][z] == GRASS and (x, 3, z) not in blocks and (x, 4, z) not in blocks
for _ in range(420):
    x, z = random.randint(14, 386), random.randint(16, 110)
    if on_grass(x, z):
        setb(x, 4, z, random.choice((TGRASS, TGRASS, DANDELION, POPPY)))
for _ in range(70):
    x, z = random.randint(14, 386), random.randint(16, 110)
    if on_grass(x, z):
        for y in (4, 5, 6, 7):
            setb(x, y, z, PINE_LOG)
        for dx in range(-2, 3):
            for dz in range(-2, 3):
                if abs(dx) + abs(dz) <= 3:
                    setb(x + dx, 7, z + dz, PINE_LEAF)
        for dx in range(-1, 2):
            for dz in range(-1, 2):
                setb(x + dx, 8, z + dz, PINE_LEAF)
        setb(x, 9, z, PINE_LEAF)

# ============ 17. 战利品箱 (头顶方块=类型: Stone Bricks物资/Gold高级/Diamond BOSS/无=普通) ============
CHEST = 204
MARK = {'n': None, 's': SB, 'g': GOLD, 'b': 172}       # 172=Block of Diamond
CHESTS = [
    # (x, z, 地面y, 类型)  类型: n普通 s物资 g高级 bboss
    (8, 4, 3, 'n'),                                    # 检查站
    (24, 28, 3, 's'), (50, 28, 3, 's'), (24, 44, 3, 's'), (50, 44, 3, 's'),   # 军营营房
    (70, 29, 3, 'g'),                                  # 军营瞭望塔
    (124, 107, 3, 's'), (142, 107, 3, 's'),            # 水泥厂窑体
    (132, 93, 3, 'g'),                                 # 水泥厂筒仓间
    (132, 108, 3, 'b'),                                # 水泥厂窑内BOSS
    (40, 76, 3, 's'), (58, 76, 3, 's'), (76, 76, 3, 's'), (94, 76, 3, 's'),   # 厂房北列
    (60, 104, 3, 'g'), (94, 104, 3, 'b'),              # 厂房南列
    (185, 75, 3, 's'), (200, 75, 3, 's'),              # 行政楼1F
    (197, 80, 8, 'g'),                                 # 行政楼2F(楼板y8)
    (190, 88, 16, 'b'),                                # 行政楼顶层BOSS(楼板y16)
    (250, 100, 3, 's'), (270, 100, 3, 's'),            # 主变电站
    (280, 110, 3, 'g'),                                # 变电站拉闸点旁
    (250, 106, 3, 's'),                                # 备用电站
    (245, 70, 3, 's'), (270, 70, 3, 's'), (260, 80, 3, 'g'),   # 游客中心
    (150, 105, 7, 'n'),                                # 断桥西引桥
    (100, 129, 22, 's'), (300, 129, 22, 's'),          # 坝顶
    (100, 125, 4, 's'), (300, 125, 4, 's'),            # 坝内廊道
    (198, 126, 5, 'b'),                                # 金库BOSS
    (3, 63, 3, 's'), (396, 65, 3, 's'),                # 东西隧道口
]
n_chest = 0
for (cx, cz, gy, ct) in CHESTS:
    cy = gy + 1
    setb(cx, cy, cz, CHEST)
    if MARK[ct]:
        setb(cx, cy + 1, cz, MARK[ct])
    n_chest += 1

# ============ 18. POI 元数据 ============
import json
meta = {
    "map": "零号大坝 复原 400x200", "origin": "西南角检查站=出生基点(0,0,0)",
    "axes": "+X=东(用户x), +Z=南(用户y), +Y=高度", "size": [SX, SY, SZ],
    "spawn": [0, 4, 0],
    "pois": {
        "dam": [0, 399, 120, 131], "reservoir": [14, 386, 132, 199],
        "powerhouse": [30, 110, 70, 114], "admin": [180, 205, 70, 96],
        "camp": [16, 90, 20, 58], "cement": [115, 150, 85, 110],
        "substation_main": [230, 290, 90, 114], "substation_backup": [240, 275, 98, 116],
        "visitor": [238, 288, 64, 88], "vault": [192, 204, 124, 128],
        "elevator": [208, 212, 70, 74], "broken_bridge": [145, 180, 100, 110],
        "river": [155, 175, 0, 131], "basin": [120, 225, 112, 117],
        "tunnel_w": [0, 11, 62, 66], "tunnel_e": [388, 399, 62, 66],
    },
    "exfils": exfils,
    "dropzones": {"west": [16, 24, 16, 24], "east": [376, 384, 16, 24]},
}

# ============ 18. 切片输出 (X 7 段 x Z 4 段 = 28 件) ============
XS = [(0, 63), (64, 127), (128, 191), (192, 255), (256, 319), (320, 383), (384, 399)]
ZS = [(0, 49), (50, 99), (100, 149), (150, 199)]

if __name__ == "__main__":
    import os, sys
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output", "dam400")
    os.makedirs(out_dir, exist_ok=True)
    manifest = ["零号大坝 400x200 分件粘贴清单 (X向东, Z向南; 你的y轴=Bloxd Z)", "",
                "出生基点: p01 内 (0,4,0) 即原点。粘贴: 每行内 +64X 换件, 行间 +50Z", ""]
    n = 0
    all_got = set()
    for zx0, zx1 in XS:
        for zz0, zz1 in ZS:
            n += 1
            part = {(x - zx0, y, z - zz0): b for (x, y, z), b in blocks.items()
                    if zx0 <= x <= zx1 and zz0 <= z <= zz1}
            sx, sz = zx1 - zx0 + 1, zz1 - zz0 + 1
            data = ser.serialize(f"ZeroDam400_p{n:02d}", (sx, SY, sz), part)
            name, sizes, got = ser.verify(data)
            assert name == f"ZeroDam400_p{n:02d}" and tuple(sizes) == (sx, SY, sz)
            expect = {(x, y, z, b) for (x, y, z), b in part.items()}
            assert got == expect, f"p{n:02d} 回读不一致!"
            all_got |= {(x + zx0, y, z + zz0, b) for (x, y, z, b) in got}
            with open(os.path.join(out_dir, f"dam400_p{n:02d}.bloxdschem"), "wb") as f:
                f.write(data)
            manifest.append(f"p{n:02d}: x{zx0}..{zx1} z{zz0}..{zz1}  偏移 X+{zx0} Z+{zz0}"
                            f"  ({sx}x{SY}x{sz}, {len(part)} 块, {len(data)/1024:.1f}KB)")
    expect_all = {(x, y, z, b) for (x, y, z), b in blocks.items()}
    assert all_got == expect_all, "分片并集 != 全量!"
    with open(os.path.join(out_dir, "manifest.txt"), "w", encoding="utf-8") as f:
        f.write("\n".join(manifest))
    with open(os.path.join(out_dir, "dam_meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
    used = {}
    for b in blocks.values():
        used[b] = used.get(b, 0) + 1
    print("\n".join(manifest))
    print(f"[OK] 28 件并集校验通过, 总方块 {len(blocks)}")
    print("[主要方块]")
    for b, c in sorted(used.items(), key=lambda kv: -kv[1])[:12]:
        print(f"   {ID_NAME.get(b, b)}: {c}")
    if "--shutdown" in sys.argv:
        os.system("shutdown /s /t 60 /c \"ZeroDam blueprints done, auto shutdown in 60s (shutdown /a to cancel)\"")
