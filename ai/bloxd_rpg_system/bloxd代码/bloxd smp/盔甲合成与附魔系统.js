// 附魔效果列表 - 可手动调整
var EnchEffects = {
    // Bloxd官方附魔
    "Damage Boost": { // 损坏情况
        description: "1级伤害提升20%，2级32%，3级40%",
        applicable: ["WEAPON", "STICK"],
        type: "官方",
        effect: null, // 官方附魔使用内置效果
        level: 1 // 效果等级
    },
    "Mining Speed": { // 制动速度
        description: "提高破碎方块的速度",
        applicable: ["TOOL"],
        type: "官方",
        effect: null, // 官方附魔使用内置效果
        level: 1 // 效果等级
    },
    "Momentum": { // 动量
        description: "随着你在短时间内破坏更多方块，进一步加快破坏方块的速度",
        applicable: ["TOOL"],
        type: "官方",
        effect: null, // 官方附魔使用内置效果
        level: 1 // 效果等级
    },
    "Mining Aura": { // 采矿光环
        description: "开采矿石时获得的光环经验值增加",
        applicable: ["TOOL"],
        type: "官方",
        effect: null, // 官方附魔使用内置效果
        level: 1 // 效果等级
    },
    "Mining Yield": { // 采矿产量
        description: "增加采矿时掉落的材料量",
        applicable: ["TOOL"],
        type: "官方",
        effect: null, // 官方附魔使用内置效果
        level: 1 // 效果等级
    },
    "Farming Aura": { // 农业气场
        description: "刷怪时获得的光环经验值增加",
        applicable: ["TOOL"],
        type: "官方",
        effect: null, // 官方附魔使用内置效果
        level: 1 // 效果等级
    },
    "Farming Yield": { // 农业产量
        description: "增加刷怪时掉落的材料数量",
        applicable: ["TOOL"],
        type: "官方",
        effect: null, // 官方附魔使用内置效果
        level: 1 // 效果等级
    },
    "Woodcutting Aura": { // 木材气场
        description: "砍树时获得的光环经验值增加",
        applicable: ["TOOL"],
        type: "官方",
        effect: null, // 官方附魔使用内置效果
        level: 1 // 效果等级
    },
    "Woodcutting Yield": { // 木材产出
        description: "砍树时掉落的材料量增加",
        applicable: ["TOOL"],
        type: "官方",
        effect: null, // 官方附魔使用内置效果
        level: 1 // 效果等级
    },
    "Arrow Speed": { // 箭速
        description: "增加射箭速度和射程",
        applicable: ["BOW"],
        type: "官方",
        effect: null, // 官方附魔使用内置效果
        level: 1 // 效果等级
    },
    "Arrow Damage": { // 箭矢伤害
        description: "增加箭矢造成的伤害，1级伤害提升23.5%，2级提升35%，3级提升44%",
        applicable: ["BOW"],
        type: "官方",
        effect: null, // 官方附魔使用内置效果
        level: 1 // 效果等级
    },
    "Quick Charge": { // 快速充电
        description: "减少弓箭充能时间",
        applicable: ["BOW"],
        type: "官方",
        effect: null, // 官方附魔使用内置效果
        level: 1 // 效果等级
    },
    "Horizontal Knockback": { // 水平击退
        description: "增加击中的水平击退力",
        applicable: ["WEAPON", "STICK"],
        type: "官方",
        effect: null, // 官方附魔使用内置效果
        level: 1 // 效果等级
    },
    "Vertical Knockback": { // 垂直反弹
        description: "增加命中时的垂直击退",
        applicable: ["STICK"],
        type: "官方",
        effect: null, // 官方附魔使用内置效果
        level: 1 // 效果等级
    },
    "Stomp Damage": { // 踩踏伤害
        description: "当你落在玩家或其他怪物身上时，伤害会更高",
        applicable: ["BOOTS"],
        type: "官方",
        effect: null, // 官方附魔使用内置效果
        level: 1 // 效果等级
    },
    
    // 自定义MC风格附魔
    "Protection": { // 保护
        description: "减少所受伤害",
        applicable: ["ARMOR"],
        type: "自定义",
        effect: "Damage Reduction", // 应用的效果 - 对应防御药水
        level: 1 // 效果等级
    },
    "Health": { // 生命
        description: "增加生命值",
        applicable: ["ARMOR"],
        type: "自定义",
        effect: "Health Regeneration", // 应用的效果 - 对应生命恢复药水
        level: 1 // 效果等级
    },
    "Speed": { // 速度提升
        description: "增加移动速度",
        applicable: ["BOOTS"],
        type: "自定义",
        effect: "Speed", // 应用的效果 - 对应速度药水
        level: 1 // 效果等级
    },
    "Jump Boost": { // 跳跃提升
        description: "增加跳跃高度",
        applicable: ["BOOTS"],
        type: "自定义",
        effect: "Jump Boost", // 应用的效果 - 对应跳跃药水
        level: 1 // 效果等级
    },
    "Sharpness": { // 锋利
        description: "增加剑的伤害",
        applicable: ["WEAPON"],
        type: "自定义",
        effect: "Damage", // 应用的效果 - 对应力量药水
        level: 1 // 效果等级
    },
    "Knockback": { // 击退
        description: "增加击退效果",
        applicable: ["WEAPON"],
        type: "自定义",
        effect: "Double Jump", // 应用的效果 - 对应击退药水
        level: 1 // 效果等级
    },
    "Fire Aspect": { // 火焰附加
        description: "使剑附带火焰效果",
        applicable: ["WEAPON"],
        type: "自定义",
        effect: "Heat Resistance", // 应用的效果 - 对应抗火药水
        level: 1 // 效果等级
    },
    "Looting": { // 抢夺
        description: "增加掉落物数量",
        applicable: ["WEAPON"],
        type: "自定义",
        effect: "Damage", // 应用的效果 - 对应力量药水
        level: 1 // 效果等级
    },
    "Smite": { // 亡灵杀手
        description: "对亡灵生物造成额外伤害",
        applicable: ["WEAPON"],
        type: "自定义",
        effect: "Damage", // 应用的效果 - 对应力量药水
        level: 1 // 效果等级
    },
    "Bane of Arthropods": { // 节肢杀手
        description: "对节肢生物造成额外伤害",
        applicable: ["WEAPON"],
        type: "自定义",
        effect: "Damage", // 应用的效果 - 对应力量药水
        level: 1 // 效果等级
    },
    "Efficiency": { // 效率
        description: "提高工具的工作速度",
        applicable: ["TOOL"],
        type: "自定义",
        effect: "Haste", // 应用的效果 - 对应急迫药水
        level: 1 // 效果等级
    },
    "Fortune": { // 时运
        description: "增加稀有掉落物的几率",
        applicable: ["TOOL"],
        type: "自定义",
        effect: "Damage", // 应用的效果 - 对应力量药水
        level: 1 // 效果等级
    },
    "Silk Touch": { // 丝绸之触
        description: "采集方块时获得完整方块",
        applicable: ["TOOL"],
        type: "自定义",
        effect: "Haste", // 应用的效果 - 对应急迫药水
        level: 1 // 效果等级
    },
    "Unbreaking": { // 不破
        description: "增加工具和武器的耐久度",
        applicable: ["TOOL", "WEAPON"],
        type: "自定义",
        effect: "Damage Reduction", // 应用的效果 - 对应防御药水
        level: 1 // 效果等级
    },
    "Power": { // 力量
        description: "增加弓的伤害",
        applicable: ["BOW"],
        type: "自定义",
        effect: "Damage", // 应用的效果 - 对应力量药水
        level: 1 // 效果等级
    },
    "Punch": { // 冲击
        description: "增加弓的击退效果",
        applicable: ["BOW"],
        type: "自定义",
        effect: "Double Jump", // 应用的效果 - 对应击退药水
        level: 1 // 效果等级
    },
    "Flame": { // 火矢
        description: "使箭附带火焰效果",
        applicable: ["BOW"],
        type: "自定义",
        effect: "Heat Resistance", // 应用的效果 - 对应抗火药水
        level: 1 // 效果等级
    },
    "Infinity": { // 无限
        description: "弓不需要箭",
        applicable: ["BOW"],
        type: "自定义",
        effect: "Damage", // 应用的效果 - 对应力量药水
        level: 1 // 效果等级
    },
    "Feather Falling": { // 摔落保护
        description: "减少摔落伤害",
        applicable: ["ARMOR", "BOOTS"],
        type: "自定义",
        effect: "Feather Falling", // 应用的效果 - 对应摔落保护
        level: 1 // 效果等级
    }
};

var I = {
    D: "Diamond", G: "Gold Bar", I: "Iron Bar", C: "Coal", W: "Wood", S: "Stick",
    M: "Moonstone", MF: "Moonstone Fragment", DF: "Diamond Fragment", GF: "Gold Fragment", IF: "Iron Fragment",
    GE: "Golem Eye", KH: "Knight Heart", SK: "Spawn Orb", DK: "Draugr Knight Spawn Orb", DG: "Draugr Zombie Spawn Orb",
    A: "Apple", B: "Bread", Ca: "Carrot", Po: "Potato", Me: "Melon Slice", Co: "Coconut", Ch: "Cherry",
    RI: "Raw Iron", RG: "Raw Gold", L: "Lapis Lazuli", R: "Redstone", O: "Obsidian",
    WP: "Wood Pickaxe", IP: "Iron Pickaxe", DP: "Diamond Pickaxe", GP: "Golem Pickaxe",
    WS: "Wood Sword", IS: "Iron Sword", DS: "Diamond Sword", KS: "Knight Sword",
    WB: "Wood Bow", DB: "Diamond Bow",
    IH: "Iron Helmet", IC: "Iron Chestplate", IL: "Iron Leggings", IBo: "Iron Boots",
    GH: "Gold Helmet", GC: "Gold Chestplate", GL: "Gold Leggings", GB: "Gold Boots",
    DH: "Diamond Helmet", DC: "Diamond Chestplate", DL: "Diamond Leggings", DBo: "Diamond Boots",
    BH: "Black Wood Helmet", BC: "Black Wood Chestplate", BL: "Black Wood Leggings", BB: "Black Wood Boots",
    RP: "Red Paintball", YP: "Yellow Paintball",
    SB: "Spiked Boots", AA: "Artisan Axe", GCa: "Gold Watermelon Slice", GM: "Gold Melon Slice",
    BE: "Block of Emerald",
    // 枪械
    M1911: "M1911|RequiresAmmo",
    AK47: "AK-47|RequiresAmmo",
    M16: "M16|RequiresAmmo", 
    TAR21: "TAR-21|RequiresAmmo",
    DoubleBarrel: "Double Barrel|RequiresAmmo",
    AWP: "AWP|RequiresAmmo",
    Minigun: "Minigun|RequiresAmmo",
    Deagle: "Deagle|RequiresAmmo",
    Striker12: "Striker-12|RequiresAmmo",
    VSR: "VSR|RequiresAmmo",
    FMR: "FMR|RequiresAmmo",
    // 子弹
    Ammo: "Ammo"
};

var E = {
    P: "Protection", T: "Thorns", H: "Health", HR: "Health Regen", KR: "Knockback Resist",
    Sp: "Speed", J: "Jump Boost", Sh: "Sharpness", K: "Knockback", F: "Fire Aspect", L: "Looting",
    Sm: "Smite", BA: "Bane of Arthropods", Ef: "Efficiency", Fo: "Fortune", ST: "Silk Touch", U: "Unbreaking",
    Po: "Power", Pu: "Punch", Fl: "Flame", In: "Infinity", FF: "Feather Falling"
};

// 坐标对数组 - 每个坐标对定义一个限制区域
var restrictedAreas = [
    { min: { x: -100, y: -100, z: -100 }, max: { x: 100, y: 100, z: 100 } },
    { min: { x: 200, y: -50, z: 200 }, max: { x: 300, y: 50, z: 300 } },
    { min: { x: 0, y: 0, z: 0 }, max: { x: 100, y: 100, z: 100 } } // 新的保护区
];

// 白名单列表 - 可以在限制区域内活动的玩家
var whitelistPlayers = [
    "player1", "player2", "player3", "fengtai"
];

var EnchType = {
    ARMOR: ["Health Boost", "Health Regen", "Knockback Resist", "Protection", "Health", "Feather Falling"],
    BOOTS: ["Stomp Damage", "Speed", "Jump Boost", "Feather Falling"],
    WEAPON: ["Attack Speed", "Critical Damage", "Damage Boost", "Horizontal Knockback", "Sharpness", "Knockback", "Fire Aspect", "Looting", "Smite", "Bane of Arthropods"],
    TOOL: ["Mining Speed", "Momentum", "Mining Aura", "Mining Yield", "Farming Aura", "Farming Yield", "Woodcutting Aura", "Woodcutting Yield", "Efficiency", "Fortune", "Silk Touch", "Unbreaking"],
    BOW: ["Arrow Speed", "Arrow Damage", "Quick Charge", "Power", "Punch", "Flame", "Infinity"],
    STICK: ["Damage Boost", "Horizontal Knockback", "Vertical Knockback"]
};

var EnchMap = {
    "医疗": "Health Boost",
    "健康再生": "Health Regen",
    "击退抗性": "Knockback Resist",
    "攻击速度": "Attack Speed",
    "致命伤害": "Critical Damage",
    "损坏情况": "Damage Boost",
    "制动速度": "Mining Speed",
    "动量": "Momentum",
    "采矿光环": "Mining Aura",
    "采矿产量": "Mining Yield",
    "挖掘灵气": "Mining Aura",
    "农业气场": "Farming Aura",
    "农业产量": "Farming Yield",
    "木材气场": "Woodcutting Aura",
    "木材产出": "Woodcutting Yield",
    "箭速": "Arrow Speed",
    "箭矢伤害": "Arrow Damage",
    "快速充电": "Quick Charge",
    "水平击退": "Horizontal Knockback",
    "垂直反弹": "Vertical Knockback",
    "踩踏伤害": "Stomp Damage",
    "保护": "Protection",
    "生命": "Health",
    "生命回复": "Health Regen",
    "速度提升": "Speed",
    "跳跃提升": "Jump Boost",
    "锋利": "Sharpness",
    "击退": "Knockback",
    "火焰附加": "Fire Aspect",
    "抢夺": "Looting",
    "亡灵杀手": "Smite",
    "节肢杀手": "Bane of Arthropods",
    "效率": "Efficiency",
    "时运": "Fortune",
    "丝绸之触": "Silk Touch",
    "不破": "Unbreaking",
    "力量": "Power",
    "冲击": "Punch",
    "火矢": "Flame",
    "无限": "Infinity",
    "摔落保护": "Feather Falling"
};

var armorItems = [I.IH, I.IC, I.IL, I.IBo, I.GH, I.GC, I.GL, I.GB, I.DH, I.DC, I.DL, I.DB, I.BH, I.BC, I.BL, I.BB];
var newRecipes = {};
var extRecipes = {};
var ENCHANT_TABLE = "Lucky Block";
var enchCfg = {};
var playerState = {};
var EMERALD_BLOCK = I.BE;
function initRecipes(player) {
    newRecipes[I.IH] = [{requires: [{items: [I.I], amt: 5}], produces: 1, station: "Workbench"}];
    newRecipes[I.IC] = [{requires: [{items: [I.I], amt: 8}], produces: 1, station: "Workbench"}];
    newRecipes[I.IL] = [{requires: [{items: [I.I], amt: 7}], produces: 1, station: "Workbench"}];
    newRecipes[I.IBo] = [{requires: [{items: [I.I], amt: 4}], produces: 1, station: "Workbench"}];
    newRecipes[I.GH] = [{requires: [{items: [I.G], amt: 5}], produces: 1, station: "Workbench"}];
    newRecipes[I.GC] = [{requires: [{items: [I.G], amt: 8}], produces: 1, station: "Workbench"}];
    newRecipes[I.GL] = [{requires: [{items: [I.G], amt: 7}], produces: 1, station: "Workbench"}];
    newRecipes[I.GB] = [{requires: [{items: [I.G], amt: 4}], produces: 1, station: "Workbench"}];
    newRecipes[I.DH] = [{requires: [{items: [I.D], amt: 5}], produces: 1, station: "Workbench"}];
    newRecipes[I.DC] = [{requires: [{items: [I.D], amt: 8}], produces: 1, station: "Workbench"}];
    newRecipes[I.DL] = [{requires: [{items: [I.D], amt: 7}], produces: 1, station: "Workbench"}];
    newRecipes[I.DB] = [{requires: [{items: [I.D], amt: 4}], produces: 1, station: "Workbench"}];
    
    newRecipes[I.BH] = [{requires: [{items: [I.D], amt: 50}, {items: [I.G], amt: 25}, {items: [I.C], amt: 70}, {items: [I.M], amt: 1}, {items: [I.D], amt: 15}], produces: 1, station: "Workbench"}];
    newRecipes[I.BC] = [{requires: [{items: [I.D], amt: 50}, {items: [I.G], amt: 25}, {items: [I.C], amt: 70}, {items: [I.M], amt: 1}, {items: [I.D], amt: 15}], produces: 1, station: "Workbench"}];
    newRecipes[I.BL] = [{requires: [{items: [I.D], amt: 50}, {items: [I.G], amt: 25}, {items: [I.C], amt: 70}, {items: [I.M], amt: 1}, {items: [I.D], amt: 15}], produces: 1, station: "Workbench"}];
    newRecipes[I.BB] = [{requires: [{items: [I.D], amt: 50}, {items: [I.G], amt: 25}, {items: [I.C], amt: 70}, {items: [I.M], amt: 1}, {items: [I.D], amt: 15}], produces: 1, station: "Workbench"}];

    extRecipes[I.YP] = [{requires: [{items: [I.G], amt: 64}, {items: [I.A], amt: 1}], produces: 1, station: "Workbench"}];
    extRecipes[I.RP] = [{requires: [{items: [I.D], amt: 20}, {items: [I.G], amt: 10}, {items: [I.GE], amt: 5}], produces: 1, station: "Workbench"}];
    extRecipes[I.AA] = [{requires: [{items: [I.D], amt: 15}, {items: [I.G], amt: 8}, {items: [I.M], amt: 2}], produces: 1, station: "Workbench"}];
    extRecipes[I.SB] = [{requires: [{items: [I.I], amt: 10}, {items: [I.D], amt: 5}], produces: 1, station: "Workbench"}];
    extRecipes[I.GCa] = [{requires: [{items: [I.G], amt: 8}, {items: [I.Ca], amt: 1}], produces: 1, station: "Workbench"}];
    extRecipes[I.GM] = [{requires: [{items: [I.G], amt: 8}, {items: [I.Me], amt: 1}], produces: 1, station: "Workbench"}];

    extRecipes[ENCHANT_TABLE] = [{requires: [{items: [I.M], amt: 25}, {items: [I.D], amt: 30}, {items: [I.G], amt: 20}], produces: 1, station: "Workbench"}];
    
    // 枪械合成配方
    extRecipes[I.M1911] = [{requires: [{items: [I.I], amt: 10}, {items: [I.G], amt: 2}, {items: [I.M], amt: 1}], produces: 1, station: "Workbench"}]; // 手枪
    extRecipes[I.Deagle] = [{requires: [{items: [I.I], amt: 10}, {items: [I.G], amt: 2}, {items: [I.M], amt: 1}], produces: 1, station: "Workbench"}]; // 手枪
    extRecipes[I.AK47] = [{requires: [{items: [I.I], amt: 25}, {items: [I.G], amt: 12}, {items: [I.M], amt: 9}], produces: 1, station: "Workbench"}]; // 步枪
    extRecipes[I.M16] = [{requires: [{items: [I.I], amt: 25}, {items: [I.G], amt: 12}, {items: [I.M], amt: 9}], produces: 1, station: "Workbench"}]; // 步枪
    extRecipes[I.TAR21] = [{requires: [{items: [I.I], amt: 25}, {items: [I.G], amt: 12}, {items: [I.M], amt: 9}], produces: 1, station: "Workbench"}]; // 步枪
    extRecipes[I.FMR] = [{requires: [{items: [I.I], amt: 25}, {items: [I.G], amt: 12}, {items: [I.M], amt: 9}], produces: 1, station: "Workbench"}]; // 步枪
    extRecipes[I.DoubleBarrel] = [{requires: [{items: [I.I], amt: 10}, {items: [I.G], amt: 25}, {items: [I.M], amt: 9}], produces: 1, station: "Workbench"}]; // 喷子
    extRecipes[I.Striker12] = [{requires: [{items: [I.I], amt: 10}, {items: [I.G], amt: 25}, {items: [I.M], amt: 9}], produces: 1, station: "Workbench"}]; // 喷子
    extRecipes[I.AWP] = [{requires: [{items: [I.I], amt: 70}, {items: [I.G], amt: 35}, {items: [I.D], amt: 10}, {items: [I.M], amt: 20}], produces: 1, station: "Workbench"}]; // 狙击枪
    extRecipes[I.VSR] = [{requires: [{items: [I.I], amt: 70}, {items: [I.G], amt: 35}, {items: [I.D], amt: 10}, {items: [I.M], amt: 20}], produces: 1, station: "Workbench"}]; // 狙击枪
    extRecipes[I.Minigun] = [{requires: [{items: [I.I], amt: 100}, {items: [I.G], amt: 70}, {items: [I.D], amt: 60}, {items: [I.M], amt: 60}], produces: 1, station: "Workbench"}]; // 加特林
    
    // 子弹合成配方
    extRecipes[I.Ammo] = [{requires: [{items: [I.I], amt: 5}, {items: [I.G], amt: 1}], produces: 1, station: "Workbench"}];


    
    for (var item in newRecipes) {
        try {
            api.editItemCraftingRecipes(player, item, newRecipes[item]);
        } catch (e) {
            console.log("Error setting recipe for " + item + ": " + e.message);
        }
    }
    for (var extItem in extRecipes) {
        try {
            api.editItemCraftingRecipes(player, extItem, extRecipes[extItem]);
        } catch (e) {
            console.log("Error setting ext recipe for " + extItem + ": " + e.message);
        }
    }
}

function initEnchCfg() {
    enchCfg[I.IH] = {enchants: [{id: E.P, l: 1}, {id: E.H, l: 1}], special: {id: E.HR, l: 1}};
    enchCfg[I.IC] = {enchants: [{id: E.P, l: 2}, {id: E.H, l: 2}], special: {id: E.KR, l: 1}};
    enchCfg[I.IL] = {enchants: [{id: E.P, l: 2}, {id: E.H, l: 1}], special: {id: E.T, l: 1}};
    enchCfg[I.IBo] = {enchants: [{id: E.P, l: 1}, {id: E.H, l: 1}], special: {id: E.FF, l: 1}};
    enchCfg[I.GH] = {enchants: [{id: E.P, l: 1}, {id: E.H, l: 2}], special: {id: E.HR, l: 2}};
    enchCfg[I.GC] = {enchants: [{id: E.P, l: 2}, {id: E.H, l: 3}], special: {id: E.KR, l: 2}};
    enchCfg[I.GL] = {enchants: [{id: E.P, l: 2}, {id: E.H, l: 2}], special: {id: E.T, l: 2}};
    enchCfg[I.GB] = {enchants: [{id: E.P, l: 1}, {id: E.H, l: 2}], special: {id: E.FF, l: 2}};
    enchCfg[I.DH] = {enchants: [{id: E.P, l: 3}, {id: E.H, l: 3}], special: {id: E.HR, l: 3}};
    enchCfg[I.DC] = {enchants: [{id: E.P, l: 4}, {id: E.H, l: 4}], special: {id: E.KR, l: 3}};
    enchCfg[I.DL] = {enchants: [{id: E.P, l: 3}, {id: E.H, l: 3}], special: {id: E.T, l: 3}};
    enchCfg[I.DB] = {enchants: [{id: E.P, l: 2}, {id: E.H, l: 3}], special: {id: E.FF, l: 3}};
    enchCfg[I.BH] = {enchants: [{id: E.P, l: 4}, {id: E.H, l: 5}], special: {id: E.HR, l: 4}};
    enchCfg[I.BC] = {enchants: [{id: E.P, l: 5}, {id: E.H, l: 6}], special: {id: E.KR, l: 4}};
    enchCfg[I.BL] = {enchants: [{id: E.P, l: 4}, {id: E.H, l: 5}], special: {id: E.T, l: 4}};
    enchCfg[I.BB] = {enchants: [{id: E.P, l: 3}, {id: E.H, l: 5}], special: {id: E.FF, l: 4}};
}

function initPlayerState(player) {
    if (!playerState[player]) {
        playerState[player] = {protection: 0, thorns: 0};
    }
}

function getItemType(itemName) {
    if (!itemName) return null;
    if (itemName.indexOf("Helmet") !== -1 || itemName.indexOf("Chestplate") !== -1 || itemName.indexOf("Leggings") !== -1 || itemName.indexOf("Boots") !== -1) return "armor";
    if (itemName.indexOf("Sword") !== -1) return "weapon";
    if (itemName.indexOf("Pickaxe") !== -1 || itemName.indexOf("Axe") !== -1 || itemName.indexOf("Shovel") !== -1 || itemName.indexOf("Hoe") !== -1) return "tool";
    if (itemName.indexOf("Bow") !== -1 || itemName.indexOf("Crossbow") !== -1) return "bow";
    if (itemName.indexOf("Stick") !== -1) return "stick";
    if (itemName.indexOf("AK-47") !== -1 || itemName.indexOf("M16") !== -1 || itemName.indexOf("MP40") !== -1 || itemName.indexOf("TAR-21") !== -1 || itemName.indexOf("M1911") !== -1 || itemName.indexOf("One Shot Pistol") !== -1 || itemName.indexOf("Double Barrel") !== -1 || itemName.indexOf("AWP") !== -1 || itemName.indexOf("Minigun") !== -1 || itemName.indexOf("Deagle") !== -1 || itemName.indexOf("Striker-12") !== -1 || itemName.indexOf("VSR") !== -1 || itemName.indexOf("FMR") !== -1) return "weapon";
    return null;
}

function getValidEnchants(itemName) {
    var type = getItemType(itemName);
    if (!type) return [];
    var list = [];
    var ChineseEnchants = {
        "Health Boost": "医疗",
        "Health Regen": "健康再生",
        "Knockback Resist": "击退抗性",
        "Attack Speed": "攻击速度",
        "Critical Damage": "致命伤害",
        "Damage Boost": "损坏情况",
        "Mining Speed": "制动速度",
        "Momentum": "动量",
        "Mining Aura": "采矿光环",
        "Mining Yield": "采矿产量",
        "Farming Aura": "农业气场",
        "Farming Yield": "农业产量",
        "Woodcutting Aura": "木材气场",
        "Woodcutting Yield": "木材产出",
        "Arrow Speed": "箭速",
        "Arrow Damage": "箭矢伤害",
        "Quick Charge": "快速充电",
        "Horizontal Knockback": "水平击退",
        "Vertical Knockback": "垂直反弹",
        "Stomp Damage": "踩踏伤害",
        "Protection": "保护",
        "Health": "生命",
        "Speed": "速度提升",
        "Jump Boost": "跳跃提升",
        "Sharpness": "锋利",
        "Knockback": "击退",
        "Fire Aspect": "火焰附加",
        "Looting": "抢夺",
        "Smite": "亡灵杀手",
        "Bane of Arthropods": "节肢杀手",
        "Efficiency": "效率",
        "Fortune": "时运",
        "Silk Touch": "丝绸之触",
        "Unbreaking": "不破",
        "Power": "力量",
        "Punch": "冲击",
        "Flame": "火矢",
        "Infinity": "无限",
        "Feather Falling": "摔落保护"
    };
    var customEnchants = [];
    for (var ench in EnchEffects) {
        if (EnchEffects[ench].type === "自定义") {
            customEnchants.push(ench);
        }
    }
    if (type === "armor") {
        customEnchants.forEach(function(ench) {
            if (EnchEffects[ench].applicable.indexOf("ARMOR") !== -1) {
                if (ChineseEnchants[ench]) list.push(ChineseEnchants[ench]);
            }
        });
        if (itemName.indexOf("Boots") !== -1) {
            customEnchants.forEach(function(ench) {
                if (EnchEffects[ench].applicable.indexOf("BOOTS") !== -1) {
                    if (ChineseEnchants[ench] && list.indexOf(ChineseEnchants[ench]) === -1) list.push(ChineseEnchants[ench]);
                }
            });
        }
    } else if (type === "weapon") {
        customEnchants.forEach(function(ench) {
            if (EnchEffects[ench].applicable.indexOf("WEAPON") !== -1) {
                if (ChineseEnchants[ench]) list.push(ChineseEnchants[ench]);
            }
        });
    } else if (type === "tool") {
        customEnchants.forEach(function(ench) {
            if (EnchEffects[ench].applicable.indexOf("TOOL") !== -1) {
                if (ChineseEnchants[ench]) list.push(ChineseEnchants[ench]);
            }
        });
    } else if (type === "bow") {
        customEnchants.forEach(function(ench) {
            if (EnchEffects[ench].applicable.indexOf("BOW") !== -1) {
                if (ChineseEnchants[ench]) list.push(ChineseEnchants[ench]);
            }
        });
    } else if (type === "stick") {
        customEnchants.forEach(function(ench) {
            if (EnchEffects[ench].applicable.indexOf("STICK") !== -1) {
                if (ChineseEnchants[ench]) list.push(ChineseEnchants[ench]);
            }
        });
    }
    return list;
}

function getEnchLvl(player,ench){
    try{
        var slots=[47,48,49,50,51],level=0;
        for(var i=0;i<slots.length;i++){
            var item=api.getItemSlot(player,slots[i]);
            if(item){
                if(item.attributes&&item.attributes.customAttributes&&item.attributes.customAttributes.enchantments){
                    var customEnchants=item.attributes.customAttributes.enchantments||{};
                    if(customEnchants[ench])level+=customEnchants[ench];
                }
                if(item.enchantments&&item.enchantments[ench]){
                    level+=item.enchantments[ench];
                }
            }
        }
        return level;
    }catch(e){
        console.log("Error getting enchantment level: "+e.message);
        return 0;
    }
}

// 检查玩家是否在限制区域内
function isInRestrictedArea(x, y, z) {
    for (var i = 0; i < restrictedAreas.length; i++) {
        var area = restrictedAreas[i];
        if (x >= area.min.x && x <= area.max.x &&
            y >= area.min.y && y <= area.max.y &&
            z >= area.min.z && z <= area.max.z) {
            return true;
        }
    }
    return false;
}

// 检查玩家是否在白名单中
function isWhitelistPlayer(player) {
    return whitelistPlayers.indexOf(player) !== -1;
}

function applyAttributes(player,item){
try{
var cfg=enchCfg[item.name];
if(!cfg)return;
var maxHealth=api.getMaxHealth(player),health=api.getHealth(player);
var healthLevel=getEnchLvl(player,E.H);
if(healthLevel>0)api.setMaxHealth(player,maxHealth*(1+healthLevel*0.1));
var protectionLevel=getEnchLvl(player,E.P);
var thornsLevel=getEnchLvl(player,E.T);
if(playerState[player]){
playerState[player].protection=protectionLevel;
playerState[player].thorns=thornsLevel;
}
}catch(e){
console.log("Error applying attributes: "+e.message);
}
}

function spawnParticle(player,type){
try{api.spawnParticle(player,type,1,0.5);}catch(e){}
}

onPlayerJoin=(player,firstTime)=>{
initPlayerState(player);
initRecipes(player);
api.sendMessage(player,"盔甲系统已加载",{color:"green"});
};

onPlayerCraft=(player,item,index,recipe,times)=>{
if(item===ENCHANT_TABLE){
api.sendMessage(player,"§a成功合成Lucky Block!",{color:"green"});
return;
}

if(item===I.YP||item===I.RP){
var inventory=[];
for(var i=0;i<36;i++){
var slotItem=api.getItemSlot(player,i);
if(slotItem){
inventory.push({slot:i,item:slotItem});
}
}
for(var j=inventory.length-1;j>=0;j--){ 
var invItem=inventory[j];
if(invItem.item.name===item){
var displayName=item===I.RP?"金苹果":"不死图腾";
var attributes={customDisplayName:displayName};
api.setItemSlot(player,invItem.slot,item,1,attributes,true);
api.sendMessage(player,"§a成功合成 §e"+displayName,{color:"green"});
break;
}
}
return;
}

if(armorItems.indexOf(item)<0)return;
var inventory=[];
for(var i=0;i<36;i++){
var slotItem=api.getItemSlot(player,i);
if(slotItem){
inventory.push({slot:i,item:slotItem});
}
}
for(var j=inventory.length-1;j>=0;j--){ 
var invItem=inventory[j];
if(invItem.item.name===item){
var cfg=enchCfg[item];
if(cfg){
var attributes={customDisplayName:item,customAttributes:{enchantments:{}}};
for(var k=0;k<cfg.enchants.length;k++){
var enchant=cfg.enchants[k];
attributes.customAttributes.enchantments[enchant.id]=enchant.l;
}
if(cfg.special)attributes.customAttributes.enchantments[cfg.special.id]=cfg.special.l;
api.setItemSlot(player,invItem.slot,item,1,attributes,true);
applyAttributes(player,{name:item});
}
break;
}
}
};

onPlayerEquip=(player,item,slot)=>{
if(!item)return;
applyAttributes(player,item);
};

onPlayerDamagingOtherPlayer=(attacker,victim,damage)=>{
var thornsLevel=playerState[victim]?playerState[victim].thorns:0;
if(thornsLevel>0){
var thornsDamage=damage*(thornsLevel*0.1);
api.setHealth(attacker,api.getHealth(attacker)-thornsDamage);
try{api.applyEffect(attacker,"Poisoned",thornsLevel*1000,{inbuiltLevel:thornsLevel});}catch(e){}
spawnParticle(attacker,"angry");
}
try{
var handSlot=api.getSelectedInventorySlotI(attacker);
if(typeof handSlot==="number"&&handSlot>=0&&handSlot<36){
var heldItem=api.getItemSlot(attacker,handSlot);
if(heldItem&&heldItem.attributes&&heldItem.attributes.customAttributes){
var enchants=heldItem.attributes.customAttributes.enchantments||{};
if(enchants.Poison){
try{api.applyEffect(victim,"Poisoned",enchants.Poison*1000,{inbuiltLevel:enchants.Poison});}catch(e){}
spawnParticle(victim,"spell");
}
}
}
}catch(e){}
};

onMobDamagingPlayer=(mob,player,damage)=>{
var thornsLevel=playerState[player]?playerState[player].thorns:0;
if(thornsLevel>0&&mob){
try{api.setHealth(mob,api.getHealth(mob)-damage*(thornsLevel*0.1));}catch(e){}
}
};

function applyEffect(player, effect, duration, level){
    try{
        api.applyEffect(player, effect, duration, {inbuiltLevel: level});
        return true;
    }catch(e){
        console.log("Error applying potion effect: " + e.message);
        return false;
    }
}

onAttemptKillPlayer=(killedPlayer,attackingLifeform)=>{
var hasTotem=false;
var totemSlot=-1;
for(var i=0;i<36;i++){
var item=api.getItemSlot(killedPlayer,i);
if(item&&item.name===I.RP){
hasTotem=true;
totemSlot=i;
break;
}
}

if(hasTotem){
var item=api.getItemSlot(killedPlayer,totemSlot);
if(item.amount<=1){
api.setItemSlot(killedPlayer,totemSlot,"Air",0,{},true);
}else{
api.setItemSlot(killedPlayer,totemSlot,I.RP,item.amount-1,{},true);
}
try{
var maxH=api.getMaxHealth(killedPlayer);
try{
api.setHealth(killedPlayer,maxH);
}catch(e1){
try{
api.setPlayerHealth(killedPlayer,maxH);
}catch(e2){}
}
}catch(e){}
try{api.setShieldAmount(killedPlayer,50);}catch(e){}
applyEffect(killedPlayer,"Speed",20000,3);
applyEffect(killedPlayer,"Jump Boost",20000,3);
applyEffect(killedPlayer,"Health Regeneration",20000,3);
applyEffect(killedPlayer,"Damage",20000,3);
api.sendMessage(killedPlayer,"不死图腾触发!血量回满+护盾+正面效果20秒",{color:"gold"});
return "preventDeath";
}



return "";
};

// 处理玩家破坏方块
onPlayerDestroy=(player,x,y,z,block)=>{
    if(isInRestrictedArea(x,y,z)&&!isWhitelistPlayer(player)){
        api.sendMessage(player,"§c你不能在限制区域内破坏方块",{color:"red"});
        return "preventAction";
    }
    return "";
};

// 处理玩家放置方块
onPlayerPlace=(player,x,y,z,block,target)=>{
    if(isInRestrictedArea(x,y,z)&&!isWhitelistPlayer(player)){
        api.sendMessage(player,"§c你不能在限制区域内放置方块",{color:"red"});
        return "preventAction";
    }
    return "";
};

// 处理玩家移动
onPlayerMove=(player,oldX,oldY,oldZ,newX,newY,newZ)=>{
    if(isInRestrictedArea(newX,newY,newZ)&&!isWhitelistPlayer(player)){
        api.sendMessage(player,"§c你不能进入限制区域",{color:"red"});
        return "preventAction";
    }
    return "";
};

var tickCount=0;
tick=(ms)=>{
tickCount++;
var players=api.getPlayerIds();
if(!players)return;

if(tickCount%100===0){
for(var i=0;i<players.length;i++){
var player=players[i];
try{
var pos=api.getPlayerPosition(player);
if(pos&&pos.y<=-75&&pos.y>=-99){
if(Math.random()<0.01){
var count=Math.floor(Math.random()*5)+1;
for(var b=0;b<count;b++){
var x=Math.floor(pos.x)+Math.floor(Math.random()*10)-5;
var z=Math.floor(pos.z)+Math.floor(Math.random()*10)-5;
var y=Math.floor(pos.y)+Math.floor(Math.random()*5)-2;
api.setBlock(x,y,z,EMERALD_BLOCK);

}
}
}
}catch(e){}
}
}

if(tickCount%100===0){
for(var i=0;i<players.length;i++){
var player=players[i];
var slots=[47,48,49,50,51];

var hasDebug=false;

try{
var handSlot=api.getSelectedInventorySlotI(player);
if(typeof handSlot==="number"&&handSlot>=0&&handSlot<36){
if(slots.indexOf(handSlot)<0){
slots.push(handSlot);
}
}
}catch(e){}

var duration=5000;
var appliedEffects={};

for(var j=0;j<slots.length;j++){
try{
var slotIndex=slots[j];
if(typeof slotIndex!=="number"||slotIndex<0)continue;

var item=api.getItemSlot(player,slotIndex);
if(!item)continue;

var enchants={};

if(item.attributes&&item.attributes.customAttributes&&item.attributes.customAttributes.enchantments){
Object.assign(enchants,item.attributes.customAttributes.enchantments);
}

if(item.enchantments){
Object.assign(enchants,item.enchantments);
}

if(Object.keys(enchants).length===0)continue;

var processedEnchants={};
for(var key in enchants){
if(EnchMap[key]){
processedEnchants[EnchMap[key]]=enchants[key];
}else{
processedEnchants[key]=enchants[key];
}
}

// 官方附魔效果 - 不需要应用，因为它们已经有内置效果
// 仅记录调试信息
// 遍历所有附魔，根据EnchEffects列表处理效果
for(var key in processedEnchants){
    if(EnchEffects[key]){
        var enchant = EnchEffects[key];
        var level = processedEnchants[key];
        
        if(enchant.type === "官方"){
            // 官方附魔 - 只记录调试信息，不应用效果
        }else if(enchant.type === "自定义" && enchant.effect && !appliedEffects[key]){
            // 自定义附魔 - 应用效果
            applyEffect(player, enchant.effect, duration, level);
            appliedEffects[key] = true;
        }
    }
}
}catch(e){
}
}


}
}
};

onPlayerClick=(player,wasAlt,x,y,z,block,target)=>{
try{
if(block===ENCHANT_TABLE){
var slot=api.getSelectedInventorySlotI(player);
if(typeof slot!=="number"||slot<0){
api.sendMessage(player,"§c无法获取手持物品",{color:"red"});
return "preventAction";
}
var item=api.getItemSlot(player,slot);
if(!item||!item.name){
api.sendMessage(player,"§c请手持物品点击Lucky Block进行附魔",{color:"red"});
return "preventAction";
}

var canEnchant=false;
var armorTypes=["Helmet","Chestplate","Leggings","Boots"];
var weaponTypes=["Sword","Bow","Pickaxe","Axe","AK-47","M16","MP40","TAR-21","M1911","One Shot Pistol","Double Barrel","AWP","Minigun"];
for(var i=0;i<armorTypes.length;i++){
if(item.name.indexOf(armorTypes[i])!==-1){
canEnchant=true;
break;
}
}
if(!canEnchant){
for(var j=0;j<weaponTypes.length;j++){
if(item.name.indexOf(weaponTypes[j])!==-1){
canEnchant=true;
break;
}
}
}

if(!canEnchant){
api.sendMessage(player,"§c该物品无法附魔",{color:"red"});
return "preventAction";
}

var emeraldCount=0;
for(var invIdx=0;invIdx<36;invIdx++){
var invItem=api.getItemSlot(player,invIdx);
if(invItem&&invItem.name===EMERALD_BLOCK)emeraldCount+=invItem.amount;
}
if(emeraldCount<3){
api.sendMessage(player,"§c绿宝石块不足!需要3个绿宝石块",{color:"red"});
return "preventAction";
}

var needRemove=3;
for(var rmIdx=0;rmIdx<36&&needRemove>0;rmIdx++){
var rmItem=api.getItemSlot(player,rmIdx);
if(rmItem&&rmItem.name===EMERALD_BLOCK){
var removeAmt=Math.min(rmItem.amount,needRemove);
if(rmItem.amount<=removeAmt){
api.setItemSlot(player,rmIdx,"Air",0,{},true);
}else{
api.setItemSlot(player,rmIdx,EMERALD_BLOCK,rmItem.amount-removeAmt,{},true);
}
needRemove-=removeAmt;
}
}

var attrs=item.attributes?JSON.parse(JSON.stringify(item.attributes)):{};
var ca=attrs.customAttributes?attrs.customAttributes:{};
var ce=ca.enchantments?ca.enchantments:{};

var isOriginalName=!attrs.customDisplayName||attrs.customDisplayName===item.name

var validEnchants=getValidEnchants(item.name);
if(!validEnchants||validEnchants.length===0){
api.sendMessage(player,"§c该物品没有可用附魔",{color:"red"});
return "preventAction";
}

var customEnchants=[];
var count=Math.floor(Math.random()*3)+1;
for(var k=0;k<count;k++){
var randEnch=validEnchants[Math.floor(Math.random()*validEnchants.length)];
var randLvl=Math.floor(Math.random()*5)+1;
customEnchants.push({id:randEnch,l:randLvl});
}

for(var m=0;m<customEnchants.length;m++){
var ceData=customEnchants[m];
if(!ce[ceData.id]){
ce[ceData.id]=ceData.l;
}else{
ce[ceData.id]=Math.max(ce[ceData.id],ceData.l);
}
}
ca.enchantments=ce;
attrs.customAttributes=ca;

if(isOriginalName){
attrs.customDisplayName=item.name+"+"+customEnchants.length;
}

try{
api.playParticleEffect({type:"enchantment",x:x,y:y+1,z:z,r:0.5,g:0.5,b:1,count:30});
}catch(e){}

try{
api.setItemSlot(player,slot,item.name,item.amount,attrs,true);
}catch(e){
api.sendMessage(player,"§c附魔失败:无法保存物品",{color:"red"});
return "preventAction";
}

var typeName=getItemType(item.name);
var typeStr=typeName==="armor"?"盔甲":typeName==="weapon"?"武器":typeName==="tool"?"工具":typeName==="bow"?"弓":"物品";
api.sendMessage(player,"§b✦ 附魔成功! §a["+typeStr+"] §e"+item.name+" §e获得 §c"+customEnchants.length+" §e个附魔",{color:"green"});
for(var n=0;n<customEnchants.length;n++){
api.sendMessage(player,"  §7- §b"+customEnchants[n].id+" §7Lv.§c"+customEnchants[n].l,{color:"aqua"});
}

return "preventAction";
}

var handSlot=api.getSelectedInventorySlotI(player);
if(typeof handSlot==="number"&&handSlot>=0&&handSlot<36){
var item=api.getItemSlot(player,handSlot);
if(item&&item.name===I.YP){
if(item.amount<=1){
api.setItemSlot(player,handSlot,"Air",0,{},true);
}else{
api.setItemSlot(player,handSlot,I.YP,item.amount-1,{},true);
}
try{api.setShieldAmount(player,200);}catch(e){}
applyEffect(player,"Speed",10000,3);
applyEffect(player,"Jump Boost",10000,3);
applyEffect(player,"Health Regeneration",10000,3);
applyEffect(player,"Damage",10000,3);
api.sendMessage(player,"金苹果使用!护盾+正面效果10秒",{color:"gold"});
return "preventAction";
}
}
}catch(e){
api.sendMessage(player,"§c操作出错:"+e.message,{color:"red"});
return "preventAction";
}
};

onPlayerChat=(player,msg,ch)=>{
var cmd=msg.replace(/^\//,"");
if(cmd==="armor"){
api.sendMessage(player,"=== 盔甲系统 ===",{color:"gold"});
api.sendMessage(player,"Protection:"+getEnchLvl(player,E.P),{color:"green"});
api.sendMessage(player,"Thorns:"+getEnchLvl(player,E.T),{color:"red"});
api.sendMessage(player,"Health:"+getEnchLvl(player,E.H),{color:"dark_red"});
}else if(cmd==="enchant"){
api.sendMessage(player,"=== 附魔检测 ===",{color:"gold"});
var slots=[47,48,49,50,51];
var handSlot=api.getSelectedInventorySlotI(player);
if(typeof handSlot==="number"&&handSlot>=0&&handSlot<36){
slots.push(handSlot);
}
var hasEnchants=false;
for(var i=0;i<slots.length;i++){
try{
var slotIndex=slots[i];
var item=api.getItemSlot(player,slotIndex);
if(!item)continue;
var enchants={};
if(item.attributes&&item.attributes.customAttributes&&item.attributes.customAttributes.enchantments){
Object.assign(enchants,item.attributes.customAttributes.enchantments);
}
if(item.enchantments){
Object.assign(enchants,item.enchantments);
}
if(Object.keys(enchants).length>0){
api.sendMessage(player,"§b["+(i+1)+"] §e"+item.name,{color:"yellow"});
hasEnchants=true;
for(var key in enchants){
var level=enchants[key];
var status="§a✓";
var effectName="未知";
if(EnchMap[key]){
effectName=EnchMap[key];
status="§a✓";
}else if(key in EnchMap){
effectName=key;
status="§a✓";
}else{
status="§c✗";
}
api.sendMessage(player,"  §7- §b"+key+" §7Lv.§c"+level+" §7["+status+" §7- "+(effectName||"未知")+"]",{color:"aqua"});
}
}
}catch(e){
api.sendMessage(player,"§c检测槽位"+slots[i]+"时出错:"+e.message,{color:"red"});
}
}
if(!hasEnchants){
api.sendMessage(player,"§c未检测到任何附魔",{color:"red"});
}
api.sendMessage(player,"§7使用 /enchant 命令重新检测",{color:"gray"});
}
};

initEnchCfg();