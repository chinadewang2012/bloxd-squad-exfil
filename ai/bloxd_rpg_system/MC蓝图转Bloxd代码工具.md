# MC蓝图转Bloxd代码工具

## 使用说明

由于 `.litematic` 是二进制格式，需要使用外部工具提取数据。以下是转换流程：

### 方法一：使用 WorldEdit 导出

1. **在 MC 中使用 WorldEdit**
   ```
   //copy
   //schematic save <名称>
   ```

2. **使用 WorldEdit 的 .schematic 或 .nbt 格式**

3. **转换为 JSON**（使用外部工具如 MCEdit、NBTExplorer）

4. **使用下面的转换代码**

---

## 方法二：手动记录坐标

如果蓝图不大，可以手动记录方块坐标：

```javascript
// 示例：简单房子的方块列表
var blocks = [
    // 地板 (5x5)
    {x: 0, y: 0, z: 0, block: "Stone"},
    {x: 1, y: 0, z: 0, block: "Stone"},
    {x: 2, y: 0, z: 0, block: "Stone"},
    // ... 更多方块
];

// 批量放置
for (var i = 0; i < blocks.length; i++) {
    var b = blocks[i];
    api.setBlock(b.x, b.y, b.z, b.block);
}
```

---

## 方法三：使用 NBT 解析代码

如果你能将 .litematic 导出为 JSON 格式，使用以下转换器：

```javascript
// NBT JSON 转 Bloxd 代码
// 输入：NBT JSON 对象
// 输出：Bloxd setBlock 代码

function convertLitematicToBloxd(nbtData) {
    var code = "// 自动生成的 Bloxd 地图代码\n";
    code += "// 原蓝图: " + (nbtData.name || "unknown") + "\n\n";
    
    // 方块类型映射表 (MC -> Bloxd)
    var blockMapping = {
        "minecraft:stone": "Stone",
        "minecraft:grass_block": "Grass",
        "minecraft:dirt": "Dirt",
        "minecraft:cobblestone": "Cobblestone",
        "minecraft:planks": "Wood",
        "minecraft:log": "Wood",
        "minecraft:leaves": "Leaves",
        "minecraft:glass": "Glass",
        "minecraft:iron_block": "Iron Block",
        "minecraft:gold_block": "Gold Block",
        "minecraft:diamond_block": "Diamond Block",
        "minecraft:redstone_block": "Redstone Block",
        "minecraft:emerald_block": "Emerald Block",
        "minecraft:lapis_block": "Lapis Block",
        "minecraft:coal_block": "Coal Block",
        "minecraft:concrete": "White Concrete",
        "minecraft:concrete_powder": "White Concrete Powder",
        "minecraft:wool": "White Wool",
        "minecraft:stained_glass": "Glass",
        "minecraft:glowstone": "Glowstone",
        "minecraft:obsidian": "Obsidian",
        "minecraft:bedrock": "Bedrock",
        "minecraft:sand": "Sand",
        "minecraft:gravel": "Gravel",
        "minecraft:water": "Water",
        "minecraft:lava": "Lava",
        "minecraft:torch": "Torch",
        "minecraft:wall_torch": "Torch",
        "minecraft:chest": "Chest",
        "minecraft:crafting_table": "Crafting Table",
        "minecraft:furnace": "Furnace",
        "minecraft:tnt": "TNT",
        // 更多映射...
    };
    
    // 颜色方块映射
    var colorMapping = {
        "white": "White Concrete",
        "orange": "Orange Concrete",
        "magenta": "Magenta Concrete",
        "light_blue": "Light Blue Concrete",
        "yellow": "Yellow Concrete",
        "lime": "Lime Concrete",
        "pink": "Pink Concrete",
        "gray": "Gray Concrete",
        "light_gray": "Light Gray Concrete",
        "cyan": "Cyan Concrete",
        "purple": "Purple Concrete",
        "blue": "Blue Concrete",
        "brown": "Brown Concrete",
        "green": "Green Concrete",
        "red": "Red Concrete",
        "black": "Black Concrete"
    };
    
    // 解析方块数据
    if (nbtData.blocks && nbtData.palette) {
        var palette = nbtData.palette;
        var blocks = nbtData.blocks;
        
        for (var i = 0; i < blocks.length; i++) {
            var block = blocks[i];
            var pos = block.pos;
            var state = palette[block.state];
            
            // 转换方块名称
            var blockName = "Stone"; // 默认
            if (state && state.Name) {
                var mcName = state.Name;
                
                // 处理颜色变体
                if (state.Properties && state.Properties.color) {
                    var color = state.Properties.color;
                    if (mcName.includes("concrete")) {
                        blockName = colorMapping[color] || "White Concrete";
                    } else if (mcName.includes("wool")) {
                        blockName = colorMapping[color] ? colorMapping[color].replace("Concrete", "Wool") : "White Wool";
                    }
                } else {
                    blockName = blockMapping[mcName] || "Stone";
                }
            }
            
            code += "api.setBlock(" + pos.x + ", " + pos.y + ", " + pos.z + ", \"" + blockName + "\");\n";
        }
    }
    
    code += "\napi.broadcastMessage([{str: \"[地图] MC蓝图已转换为Bloxd!\", style: {color: \"green\"}}]);";
    
    return code;
}

// 使用示例：
// var nbtJson = {/* 你的NBT JSON数据 */};
// var bloxdCode = convertLitematicToBloxd(nbtJson);
// console.log(bloxdCode);
```

---

## 常用方块对照表

| MC 方块 | Bloxd 方块 |
|---------|------------|
| stone | Stone |
| grass_block | Grass |
| dirt | Dirt |
| cobblestone | Cobblestone |
| planks/oak_planks | Wood |
| log/oak_log | Wood |
| leaves/oak_leaves | Leaves |
| glass | Glass |
| iron_block | Iron Block |
| gold_block | Gold Block |
| diamond_block | Diamond Block |
| emerald_block | Emerald Block |
| redstone_block | Redstone Block |
| lapis_block | Lapis Block |
| coal_block | Coal Block |
| white_concrete | White Concrete |
| red_concrete | Red Concrete |
| blue_concrete | Blue Concrete |
| glowstone | Glowstone |
| obsidian | Obsidian |
| bedrock | Bedrock |
| sand | Sand |
| gravel | Gravel |
| water | Water |
| lava | Lava |
| torch | Torch |
| chest | Chest |
| crafting_table | Crafting Table |
| furnace | Furnace |
| tnt | TNT |

---

## 快速转换工具（简易版）

如果你有方块坐标列表，直接用这个：

```javascript
// 快速放置工具
// 格式: [[x, y, z, "方块名"], ...]

var blueprint = [
    // 地板 5x5
    [0, 0, 0, "Stone"], [1, 0, 0, "Stone"], [2, 0, 0, "Stone"], [3, 0, 0, "Stone"], [4, 0, 0, "Stone"],
    [0, 0, 1, "Stone"], [1, 0, 1, "Stone"], [2, 0, 1, "Stone"], [3, 0, 1, "Stone"], [4, 0, 1, "Stone"],
    [0, 0, 2, "Stone"], [1, 0, 2, "Stone"], [2, 0, 2, "Stone"], [3, 0, 2, "Stone"], [4, 0, 2, "Stone"],
    [0, 0, 3, "Stone"], [1, 0, 3, "Stone"], [2, 0, 3, "Stone"], [3, 0, 3, "Stone"], [4, 0, 3, "Stone"],
    [0, 0, 4, "Stone"], [1, 0, 4, "Stone"], [2, 0, 4, "Stone"], [3, 0, 4, "Stone"], [4, 0, 4, "Stone"],
    
    // 墙壁
    [0, 1, 0, "Wood"], [4, 1, 0, "Wood"], [0, 1, 4, "Wood"], [4, 1, 4, "Wood"],
    [0, 2, 0, "Wood"], [4, 2, 0, "Wood"], [0, 2, 4, "Wood"], [4, 2, 4, "Wood"],
    [0, 3, 0, "Wood"], [4, 3, 0, "Wood"], [0, 3, 4, "Wood"], [4, 3, 4, "Wood"],
    
    // 门
    [2, 1, 0, "Air"], [2, 2, 0, "Air"],
    
    // 屋顶
    [0, 4, 0, "Cobblestone"], [1, 4, 0, "Cobblestone"], [2, 4, 0, "Cobblestone"], [3, 4, 0, "Cobblestone"], [4, 4, 0, "Cobblestone"],
    [0, 4, 1, "Cobblestone"], [1, 4, 1, "Cobblestone"], [2, 4, 1, "Cobblestone"], [3, 4, 1, "Cobblestone"], [4, 4, 1, "Cobblestone"],
    [0, 4, 2, "Cobblestone"], [1, 4, 2, "Cobblestone"], [2, 4, 2, "Cobblestone"], [3, 4, 2, "Cobblestone"], [4, 4, 2, "Cobblestone"],
    [0, 4, 3, "Cobblestone"], [1, 4, 3, "Cobblestone"], [2, 4, 3, "Cobblestone"], [3, 4, 3, "Cobblestone"], [4, 4, 3, "Cobblestone"],
    [0, 4, 4, "Cobblestone"], [1, 4, 4, "Cobblestone"], [2, 4, 4, "Cobblestone"], [3, 4, 4, "Cobblestone"], [4, 4, 4, "Cobblestone"],
    
    // 内部 - 信标
    [2, 1, 2, "Beacon"],
];

// 放置所有方块
for (var i = 0; i < blueprint.length; i++) {
    var b = blueprint[i];
    if (b[3] !== "Air") {
        api.setBlock(b[0], b[1], b[2], b[3]);
    }
}

api.broadcastMessage([{str: "[蓝图] 小屋已生成!", style: {color: "green"}}]);
```

---

## 如何提取你的蓝图

### 使用 Amulet Editor (推荐)
1. 下载 Amulet Editor：https://www.amuletmc.com/
2. 打开你的 .litematic 文件
3. 导出为 JSON 格式
4. 使用上面的转换代码

### 使用在线工具
1. 访问：https://rebane2001.com/mapartcraft/
2. 或搜索 "Minecraft schematic to JSON"

---

## 需要帮助？

如果你有具体的方块坐标列表，我可以直接帮你生成 Bloxd 代码！
