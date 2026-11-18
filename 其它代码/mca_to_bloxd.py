"""
MCA → Bloxd Schematic 转换器
============================
用法: python mca_to_bloxd.py <MCA目录> <输出前缀> [--max-size 100000]

功能:
- 读取多个 .mca 文件 (根据文件名 r.X.Z.mca 计算坐标偏移)
- 转换除空气外的所有方块
- 自动分块 (每个 .bloxdschem ≤ max-size bytes, 默认100KB)
- 输出标准 Bloxd 蓝图格式 (zigzag varint 编码)
"""

import sys, os, argparse, struct
from pathlib import Path

# ============ 1. MC→Bloxd 方块名映射 (视觉相似) ============
MC_TO_BLOXD = {
    # 自然方块
    "dirt": "Dirt",
    "grass_block": "Grass Block",
    "sand": "Sand",
    "red_sand": "Sand",
    "gravel": "Gravel",
    "clay": "Clay",
    "podzol": "Messy Dirt",
    "mycelium": "Messy Dirt",
    "moss_block": "Grass Block",
    "stone": "Stone",
    "cobblestone": "Messy Stone",
    "andesite": "Andesite",
    "polished_andesite": "Smooth Andesite",
    "diorite": "Diorite",
    "polished_diorite": "Smooth Diorite",
    "granite": "Granite",
    "polished_granite": "Smooth Granite",
    "calcite": "Andesite",
    "tuff": "Smooth Stone",
    "deepslate": "Dark Red Stone",
    "basalt": "Dark Red Stone",
    "blackstone": "Dark Red Stone",
    "bedrock": "Bedrock",
    "obsidian": "Obsidian",
    # 矿石
    "coal_ore": "Coal Ore",
    "iron_ore": "Iron Ore",
    "gold_ore": "Gold Ore",
    "diamond_ore": "Diamond Ore",
    "emerald_ore": "Emerald Ore",
    "lapis_ore": "Lapis Lazuli Ore",
    "redstone_ore": "Gold Ore",
    "copper_ore": "Iron Ore",
    # 矿物块
    "coal_block": "Block of Coal",
    "iron_block": "Block of Iron",
    "gold_block": "Block of Gold",
    "diamond_block": "Block of Diamond",
    "emerald_block": "Block of Emerald",
    "lapis_block": "Block of Lapis Lazuli",
    "redstone_block": "Block of Gold",
    "netherite_block": "Block of Diamond",
    # 原木
    "oak_log": "Plum Log",
    "birch_log": "Maple Log",
    "spruce_log": "Cedar Log",
    "jungle_log": "Jungle Log",
    "acacia_log": "Aspen Log",
    "dark_oak_log": "Jungle Log",
    "cherry_log": "Cherry Log",
    "mangrove_log": "Aspen Log",
    # 木板
    "oak_planks": "Plum Wood Planks",
    "birch_planks": "Maple Wood Planks",
    "spruce_planks": "Cedar Wood Planks",
    "jungle_planks": "Jungle Wood Planks",
    "acacia_planks": "Aspen Wood Planks",
    "dark_oak_planks": "Barkless Aspen Log",
    "cherry_planks": "Cherry Wood Planks",
    "mangrove_planks": "Aspen Wood Planks",
    # 树叶
    "oak_leaves": "Maple Leaves",
    "birch_leaves": "Pine Leaves",
    "spruce_leaves": "Aspen Leaves",
    "jungle_leaves": "Jungle Leaves",
    "acacia_leaves": "Aspen Leaves",
    "dark_oak_leaves": "Pine Leaves",
    "cherry_leaves": "Cherry Leaves",
    "mangrove_leaves": "Aspen Leaves",
    # 石头类
    "stone_bricks": "Stone Bricks",
    "mossy_stone_bricks": "Mossy Stone Bricks",
    "sandstone": "Sandstone",
    "smooth_sandstone": "Smooth Sandstone",
    "cut_sandstone": "Sandstone Bricks",
    "chiseled_sandstone": "Sandstone Bricks",
    "red_sandstone": "Red Sandstone",
    "smooth_red_sandstone": "Smooth Red Sandstone",
    "brick": "Bricks",
    "nether_bricks": "Block of Quartz",
    "quartz_block": "Block of Quartz",
    "bone_block": "Snow",
    "magma_block": "Dark Red Stone",
    "glowstone": "Dim Lamp On",
    # 流体
    "water": "Water",
    "lava": "Lava",
    "ice": "Hay Bale",
    "packed_ice": "Hay Bale",
    # 装饰
    "cactus": "Cactus",
    "vine": "Vines",
    "cobweb": "Cobweb",
    # 实用方块
    "chest": "Chest",
    "ender_chest": "Moonstone Chest",
    "crafting_table": "Workbench",
    "furnace": "Furnace",
    "bookshelf": "Empty Bookshelf",
    "beehive": "Moonstone Chest",
    "loom": "Artisan Bench",
    "cauldron": "Potion Table",
    "enchanting_table": "Diamond Enchanting Table",
    "melon": "Melon",
    "pumpkin": "Pumpkin",
    "hay_block": "Hay Bale",
    "sponge": "Sponge",
    "tnt": "Smooth Double Stone Slab",
    # 地狱/末地
    "netherrack": "Dark Red Stone",
    "soul_sand": "Smooth Stone",
    "end_stone": "Smooth Stone",
}

# 16色羊毛/混凝土/陶土/玻璃/床/地毯 - 颜色直接对应
COLOR16 = ["white","orange","magenta","light_blue","yellow","lime","pink","gray",
           "light_gray","cyan","purple","blue","brown","green","red","black"]
COLOR_MAP = {"white":0,"orange":1,"magenta":2,"light_blue":3,"yellow":4,"lime":5,
             "pink":6,"gray":7,"light_gray":8,"cyan":9,"purple":10,"blue":11,
             "brown":12,"green":13,"red":14,"black":15}

WOOL_BLOXD = ["White Wool","Orange Wool","Magenta Wool","Light Blue Wool","Yellow Wool","Lime Wool","Pink Wool","Gray Wool",
              "Light Gray Wool","Cyan Wool","Purple Wool","Blue Wool","Brown Wool","Green Wool","Red Wool","Black Wool"]
CONC_BLOXD = ["White Concrete","Orange Concrete","Magenta Concrete","Light Blue Concrete","Yellow Concrete","Lime Concrete","Pink Concrete","Gray Concrete",
              "Light Gray Concrete","Cyan Concrete","Purple Concrete","Blue Concrete","Brown Concrete","Green Concrete","Red Concrete","Black Concrete"]
CLAY_BLOXD = ["White Baked Clay","Orange Baked Clay","Magenta Baked Clay","Light Blue Baked Clay","Yellow Baked Clay","Lime Baked Clay","Pink Baked Clay","Gray Baked Clay",
              "Light Gray Baked Clay","Cyan Baked Clay","Purple Baked Clay","Blue Baked Clay","Brown Baked Clay","Green Baked Clay","Red Baked Clay","Black Baked Clay"]
GLASS_BLOXD = ["White Glass","Orange Glass","Magenta Glass","Light Blue Glass","Yellow Glass","Lime Glass","Pink Glass","Gray Glass",
               "Light Gray Glass","Cyan Glass","Purple Glass","Blue Glass","Brown Glass","Green Glass","Red Glass","Black Glass"]
BED_BLOXD = ["White Bed","Orange Bed","Magenta Bed","Light Blue Bed","Yellow Bed","Lime Bed","Pink Bed","Gray Bed",
             "Light Gray Bed","Cyan Bed","Purple Bed","Blue Bed","Brown Bed","Green Bed","Red Bed","Black Bed"]
CARPET_BLOXD = ["White Carpet","Orange Carpet","Magenta Carpet","Light Blue Carpet","Yellow Carpet","Lime Carpet","Pink Carpet","Gray Carpet",
                "Light Gray Carpet","Cyan Carpet","Purple Carpet","Blue Carpet","Brown Carpet","Green Carpet","Red Carpet","Black Carpet"]

for color, idx in COLOR_MAP.items():
    MC_TO_BLOXD[f"{color}_wool"] = WOOL_BLOXD[idx]
    MC_TO_BLOXD[f"{color}_concrete"] = CONC_BLOXD[idx]
    MC_TO_BLOXD[f"{color}_terracotta"] = CLAY_BLOXD[idx]
    MC_TO_BLOXD[f"{color}_stained_glass"] = GLASS_BLOXD[idx]
    MC_TO_BLOXD[f"{color}_bed"] = BED_BLOXD[idx]
    MC_TO_BLOXD[f"{color}_carpet"] = CARPET_BLOXD[idx]

# 空气 = 跳过
AIR_NAMES = {"air", "cave_air", "void_air", "structure_void"}

# ============ 2. Bloxd 方块名 → ID 索引 ============
BLOXD_NAMES = []  # name → id
BLOXD_NAME_TO_ID = {}
BLOCK_NAMES_TXT = os.path.join(os.path.dirname(__file__), "BLOCK_NAMES.txt")

def load_bloxd_names():
    """从官方 block_ids.json 的 idToName 加载方块名→ID(必须以官方 ID 为准, 不能用行号)"""
    global BLOXD_NAMES, BLOXD_NAME_TO_ID
    import json
    candidates = [
        os.path.join(os.path.dirname(__file__), "block_ids.json"),
        os.path.join(os.path.dirname(__file__), "..", "block_ids.json"),
        r"C:\Users\WZR\.agents\skills\bloxd-lookup\data\block_ids.json",
    ]
    for p in candidates:
        if not os.path.exists(p):
            continue
        try:
            with open(p, 'r', encoding='utf-8') as f:
                data = json.load(f)
            id_to_name = data.get("idToName") or {}
            if not id_to_name:
                continue
            max_id = max(int(k) for k in id_to_name)
            BLOXD_NAMES = [id_to_name.get(str(i), "") for i in range(max_id + 1)]
            BLOXD_NAME_TO_ID = {n: int(i) for i, n in id_to_name.items() if n}
            print(f"[OK] 官方 ID 表: {len(BLOXD_NAME_TO_ID)} 个方块 (id 0-{max_id})")
            return
        except Exception as e:
            print(f"[WARN] {p} 读取失败: {e}")
    raise SystemExit("[FATAL] 未找到 block_ids.json, 拒绝用行号当方块 ID(会生成错误蓝图)")
    # ↓↓↓ 旧实现(行号当 ID, 已废弃且不可达, 仅留作参考) ↓↓↓
    # 内置常用方块列表 (如果没有BLOCK_NAMES.txt就用这个)
    defaults = [
        "Dirt","Messy Dirt","Grass Block","Sand","Clay","Gravel","Snow",
        "Maple Log","Pine Log","Plum Log","Cedar Log","Aspen Log","Jungle Log",
        "Maple Wood Planks","Aspen Wood Planks","Plum Wood Planks","Jungle Wood Planks",
        "Pine Wood Planks","Cedar Wood Planks",
        "Maple Leaves","Pine Leaves","Jungle Leaves","Aspen Leaves","Cherry Leaves","Palm Leaves",
        "Stone","Messy Stone","Smooth Stone","Andesite","Smooth Andesite","Diorite","Smooth Diorite",
        "Granite","Smooth Granite","Dark Red Stone","Stone Bricks","Sandstone","Smooth Sandstone",
        "Red Sandstone","Smooth Red Sandstone","Bricks","Block of Quartz","Snow","Dark Red Stone",
        "Dim Lamp On","Water","Lava","Hay Bale","Cactus","Chest","Moonstone Chest","Workbench",
        "Furnace","Empty Bookshelf","Artisan Bench","Potion Table","Diamond Enchanting Table",
        "Block of Coal","Block of Iron","Block of Gold","Block of Diamond","Block of Emerald","Block of Lapis Lazuli",
        "Coal Ore","Iron Ore","Gold Ore","Diamond Ore","Emerald Ore","Lapis Lazuli Ore",
        "Bedrock","Obsidian","Melon","Pumpkin","Sponge","Smooth Double Stone Slab",
        "White Wool","Orange Wool","Magenta Wool","Light Blue Wool","Yellow Wool","Lime Wool","Pink Wool","Gray Wool",
        "Light Gray Wool","Cyan Wool","Purple Wool","Blue Wool","Brown Wool","Green Wool","Red Wool","Black Wool",
        "White Concrete","Orange Concrete","Magenta Concrete","Light Blue Concrete","Yellow Concrete","Lime Concrete","Pink Concrete","Gray Concrete",
        "Light Gray Concrete","Cyan Concrete","Purple Concrete","Blue Concrete","Brown Concrete","Green Concrete","Red Concrete","Black Concrete",
        "Orange Baked Clay","White Baked Clay","Yellow Baked Clay","Lime Baked Clay","Gray Baked Clay","Light Gray Baked Clay","Pink Baked Clay",
        "Magenta Baked Clay","Light Blue Baked Clay","Cyan Baked Clay","Purple Baked Clay","Blue Baked Clay","Brown Baked Clay","Green Baked Clay","Red Baked Clay","Black Baked Clay",
        "Glass","White Glass","Orange Glass","Magenta Glass","Light Blue Glass","Yellow Glass","Lime Glass","Pink Glass","Gray Glass",
        "Light Gray Glass","Cyan Glass","Purple Glass","Blue Glass","Brown Glass","Green Glass","Red Glass","Black Glass",
        "White Bed","Orange Bed","Magenta Bed","Light Blue Bed","Yellow Bed","Lime Bed","Pink Bed","Gray Bed",
        "Light Gray Bed","Cyan Bed","Purple Bed","Blue Bed","Brown Bed","Green Bed","Red Bed","Black Bed",
        "White Carpet","Orange Carpet","Magenta Carpet","Light Blue Carpet","Yellow Carpet","Lime Carpet","Pink Carpet","Gray Carpet",
        "Light Gray Carpet","Cyan Carpet","Purple Carpet","Blue Carpet","Brown Carpet","Green Carpet","Red Carpet","Black Carpet",
        "Vines","Cobweb","Spectral Ladder","Cherry Wood Planks","Cherry Log",
        "Smooth Sandstone Slab","Sandstone Bricks","Block of Quartz","Lava","Water",
        "Jack o'Lantern","Mossy Stone Bricks","Cherry Block","Barkless Aspen Log",
    ]
    BLOXD_NAMES = defaults
    BLOXD_NAME_TO_ID = {n: i for i, n in enumerate(BLOXD_NAMES)}
    
    # 尝试加载完整列表
    if os.path.exists(BLOCK_NAMES_TXT):
        try:
            with open(BLOCK_NAMES_TXT, 'r', encoding='utf-8') as f:
                idx = 0
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue
                    # 去掉 [TB] [R] 等后缀标记
                    name = re.sub(r'\s*\[[^\]]*\]\s*', '', line).strip()
                    if name:
                        if idx >= len(BLOXD_NAMES):
                            BLOXD_NAMES.append(name)
                        elif BLOXD_NAMES[idx] != name:
                            BLOXD_NAMES[idx] = name
                        BLOXD_NAME_TO_ID[name] = idx
                        idx += 1
        except Exception as e:
            print(f"[WARN] BLOCK_NAMES.txt 加载失败: {e}, 使用内置列表 ({len(BLOXD_NAMES)} 种)")
    else:
        print(f"[WARN] 未找到 BLOCK_NAMES.txt, 使用内置列表 ({len(BLOXD_NAMES)} 种)")

# ============ 3. Bloxd 蓝图写入 (zigzag varint) ============
class BloxdWriter:
    def __init__(self):
        self.buf = bytearray()
    
    def write_byte(self, b):
        self.buf.append(b & 0xFF)
    
    def write_long(self, value):
        """ZigZag + Varint 编码 (do-while, 即使值为0也输出1字节)"""
        if -1073741824 <= value < 1073741824:
            v = (value << 1) if value >= 0 else ((~value << 1) | 1)
            while True:
                n = v & 0x7F
                v >>= 7
                if v:
                    self.buf.append(n | 0x80)
                else:
                    self.buf.append(n)
                    break
        else:
            v = 2 * value if value >= 0 else -2 * value - 1
            while v >= 1:
                self.buf.append(int(v) & 0x7F)
                v //= 128
                if v >= 1:
                    self.buf[-1] |= 0x80
    
    def write_string(self, s):
        encoded = s.encode('utf-8')
        self.write_long(len(encoded))
        self.buf.extend(encoded)
    
    def write_bytes(self, data):
        self.write_long(len(data))
        self.buf.extend(data)
    
    def write_fixed(self, n):
        self.buf.extend(b'\x00' * n)
    
    def to_bytes(self):
        return bytes(self.buf)


def write_bloxd_schematic(name, sizeX, sizeY, sizeZ, chunks, blockdatas=None):
    """
    Bloxd Schematic 格式 (Schema B):
    - headers: 4 zero bytes
    - name: null-terminated UTF-8 string
    - sizeX, sizeY, sizeZ: zigzag varint
    - chunks count: zigzag varint
    - chunks: array of {x,y,z: zigzag varint, blocks: zigzag varint len + bytes}
    - blockdatas count: zigzag varint
    - blockdatas: array of {x,y,z: zigzag varint, str: zigzag varint len + utf8}
    """
    w = BloxdWriter()
    # headers: 4 zero bytes
    w.write_fixed(4)
    # name: null-terminated UTF-8
    encoded = name.encode('utf-8')
    w.buf.extend(encoded)
    w.write_byte(0)  # null terminator
    w.write_byte(0)  # extra null
    w.write_byte(0)  # extra null (sample has 3)
    # size
    w.write_long(sizeX); w.write_long(sizeY); w.write_long(sizeZ)
    # chunks array
    w.write_long(len(chunks))
    for cx, cy, cz, blocks in chunks:
        w.write_long(cx); w.write_long(cy); w.write_long(cz)
        w.write_bytes(blocks)
    # blockdatas array
    if blockdatas:
        w.write_long(len(blockdatas))
        for bx, by, bz, s in blockdatas:
            w.write_long(bx); w.write_long(by); w.write_long(bz)
            w.write_string(s)
    else:
        w.write_long(0)
    return w.to_bytes()


# ============ 4. MCA 解析 ============
import re

def parse_mca_filename(filename):
    """从 r.X.Z.mca 提取区块坐标"""
    m = re.match(r'r\.(-?\d+)\.(-?\d+)\.mca$', filename)
    if m:
        return int(m.group(1)), int(m.group(2))
    return None, None

def load_mca_chunks(mca_dir, mc_to_bloxd_func):
    """
    读取目录下所有.mca文件, 返回 [(x,y,z, bloxd_block_id), ...]
    坐标: MC原始世界坐标 (基点0,0,0)
    用 nbt 库的 AnvilChunk 自动解析 palette/blockstates
    """
    import nbt.region as nbt_region
    from nbt.chunk import AnvilChunk
    
    result = []  # (x, y, z, bloxd_id)
    mca_files = list(Path(mca_dir).glob("*.mca"))
    print(f"[INFO] 找到 {len(mca_files)} 个 MCA 文件")
    
    processed = 0
    for mca_path in mca_files:
        m = re.match(r'r\.(-?\d+)\.(-?\d+)\.mca$', mca_path.name)
        if m:
            region_rx, region_rz = int(m.group(1)), int(m.group(2))
        else:
            # 文件名不标准, 用默认坐标0,0
            region_rx, region_rz = 0, 0
            print(f"[WARN] 文件名不标准: {mca_path.name}, 使用默认坐标 (0,0)")
        
        try:
            region = nbt_region.RegionFile(str(mca_path))
            
            for meta in region.get_metadata():
                try:
                    chunk_nbt = region.get_chunk(meta.x, meta.z)
                except:
                    continue
                
                # 用 AnvilChunk 自动解析所有section
                try:
                    chunk = AnvilChunk(chunk_nbt)
                except Exception as e:
                    continue
                
                chunk_x = region_rx * 32 + meta.x
                chunk_z = region_rz * 32 + meta.z
                
                # iter_block 返回 (section_y, local_index, block_name)
                # 但更可靠的方式是遍历sections
                for section_y_idx, section in chunk.sections.items():
                    for local_idx, block_name in enumerate(section.iter_block()):
                        # block_name 已经是完整名如 'minecraft:stone'
                        clean_name = block_name.replace('minecraft:', '')
                        
                        if clean_name in AIR_NAMES:
                            continue
                        
                        bloxd_id = mc_to_bloxd_func(clean_name)
                        if bloxd_id is None:
                            continue
                        
                        # local_idx → local coords (YZX order)
                        local_x = local_idx & 0xF
                        local_z = (local_idx >> 4) & 0xF
                        local_y = (local_idx >> 8) & 0xF
                        wx = chunk_x * 16 + local_x
                        wy = section_y_idx * 16 + local_y
                        wz = chunk_z * 16 + local_z
                        
                        result.append((wx, wy, wz, bloxd_id))
                
                processed += 1
                if processed % 50 == 0:
                    print(f"  已处理 {processed} 个区块, 有效方块 {len(result)}...")
            
            region.close()
        except Exception as e:
            print(f"[WARN] 读取 {mca_path.name} 失败: {e}")
    
    return result


def unpack_block_states(packed_list, palette_size):
    """解压MC的BlockStates packed long数组"""
    if palette_size <= 1:
        return [0] * 4096
    
    # nbt TAG_Long_Array 转 Python list
    longs = list(packed_list)
    
    bits_per_block = max(1, (palette_size - 1).bit_length())
    
    # 手动解压 (MC的packed array是小端位序)
    result = []
    for long_val in longs:
        remaining = long_val & 0xFFFFFFFFFFFFFFFF  # 保证无符号
        for _ in range(64 // bits_per_block):
            val = remaining & ((1 << bits_per_block) - 1)
            result.append(val)
            remaining >>= bits_per_block
            if len(result) >= 4096:
                break
        if len(result) >= 4096:
            break
    
    return result[:4096]


def mc_name_to_bloxd_id(mc_name):
    """MC方块名 → Bloxd方块ID"""
    bloxd_name = MC_TO_BLOXD.get(mc_name)
    if bloxd_name and bloxd_name in BLOXD_NAME_TO_ID:
        return BLOXD_NAME_TO_ID[bloxd_name]
    return None


# ============ 5. 分块写入 ============
def split_into_bloxd_chunks(blocks, chunk_size=16):
    """
    blocks: [(x,y,z,bloxd_id), ...]
    返回: [(cx,cy,cz, bytes), ...]
    bytes: 1字节数组, 布局按 (local_z * sizeY + local_y) * chunkSize + local_x
    """
    if not blocks:
        return []
    
    # 计算边界
    min_x = min(b[0] for b in blocks)
    min_y = min(b[1] for b in blocks)
    min_z = min(b[2] for b in blocks)
    max_x = max(b[0] for b in blocks)
    max_y = max(b[1] for b in blocks)
    max_z = max(b[2] for b in blocks)
    
    # 按 chunk_size 分块
    chunk_map = {}  # (cx,cy,cz) → {local_idx: block_id}
    
    for x, y, z, bid in blocks:
        cx = (x - min_x) // chunk_size
        cy = (y - min_y) // chunk_size
        cz = (z - min_z) // chunk_size
        lx = (x - min_x) % chunk_size
        ly = (y - min_y) % chunk_size
        lz = (z - min_z) % chunk_size
        
        key = (cx, cy, cz)
        if key not in chunk_map:
            chunk_map[key] = bytearray(chunk_size * chunk_size * chunk_size)  # 全部0=空气
        # Bloxd chunks 的字节布局: local_x + local_z * chunkSize + local_y * chunkSize * chunkSize
        # 或者: (local_y * chunkSize + local_z) * chunkSize + local_x
        # 从sample解析来看, sizeY=64, 每个chunk的blocks大小 = chunk_size^3
        idx = (ly * chunk_size + lz) * chunk_size + lx
        chunk_map[key][idx] = bid
    
    result = []
    for (cx, cy, cz), arr in sorted(chunk_map.items()):
        result.append((cx, cy, cz, bytes(arr)))
    
    return result, (min_x, min_y, min_z, max_x, max_y, max_z)


# ============ 6. 主转换 ============
def convert(mca_dir, output_prefix, max_schem_size=100000):
    load_bloxd_names()
    print(f"[INFO] Bloxd 方块名: {len(BLOXD_NAMES)} 种")
    print(f"[INFO] MC→Bloxd 映射: {len(MC_TO_BLOXD)} 种")
    
    print(f"\n[INFO] 读取 MCA 目录: {mca_dir}")
    blocks = load_mca_chunks(mca_dir, mc_name_to_bloxd_id)
    
    if not blocks:
        print("[ERROR] 没有读取到任何方块!")
        return 0
    
    print(f"[INFO] 有效方块数 (非空气): {len(blocks)}")
    
    # 分块
    bloxd_chunks, bounds = split_into_bloxd_chunks(blocks)
    min_x, min_y, min_z, max_x, max_y, max_z = bounds
    size_x = max_x - min_x + 1
    size_y = max_y - min_y + 1
    size_z = max_z - min_z + 1
    
    print(f"[INFO] 尺寸: {size_x}×{size_y}×{size_z}")
    print(f"[INFO] Bloxd chunks: {len(bloxd_chunks)}")
    
    # 生成蓝图 (可能需要拆分)
    total_size = 0
    schem_num = 1
    current_chunks = []
    
    def flush():
        nonlocal total_size, current_chunks, schem_num
        if not current_chunks:
            return
        data = write_bloxd_schematic(
            f"{output_prefix}-x{schem_num}",
            size_x, size_y, size_z,
            current_chunks
        )
        out_name = f"{output_prefix}-x{schem_num}.bloxdschem"
        with open(out_name, 'wb') as f:
            f.write(data)
        print(f"[OUTPUT] {out_name} ({len(data)} bytes, {len(current_chunks)} chunks)")
        schem_num += 1
        current_chunks = []
        total_size = 0
    
    for cx, cy, cz, chunk_bytes in bloxd_chunks:
        chunk_serialized_len = len(chunk_bytes) + 20  # 粗略估计
        if total_size + chunk_serialized_len > max_schem_size and current_chunks:
            flush()
        current_chunks.append((cx, cy, cz, chunk_bytes))
        total_size += chunk_serialized_len
    
    flush()
    print(f"\n[DONE] 共生成 {schem_num - 1} 个蓝图文件")
    return schem_num - 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MCA → Bloxd Schematic 转换器")
    parser.add_argument("mca_dir", help="MCA文件目录")
    parser.add_argument("output", help="输出文件名前缀")
    parser.add_argument("--max-size", type=int, default=100000, help="单个蓝图最大bytes (默认100KB)")
    args = parser.parse_args()
    convert(args.mca_dir, args.output, args.max_size)
