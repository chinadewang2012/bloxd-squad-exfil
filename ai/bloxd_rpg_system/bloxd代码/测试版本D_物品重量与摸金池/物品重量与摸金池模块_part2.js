/*==================== 摸金池模块 v4.3 - Part 2 (567池) ====================
 * 功能：包含第5、6、7个摸金池（传说、神话、至尊）
 * 说明：此模块为独立模块，可被外部函数模块引用
 * 更新：增加物品价值系统(三角洲风格)，添加中文显示名(dn)
 *==============================================================*/

/*==================== 摸金池配置 ====================
 * 物品格式：{name: 英文原名, n: 中文命名, dn: 三角洲风格显示名, d: 等级(1-10), min: 最小数量, max: 最大数量, bl: 基本爆率, v: 价值}
 * 爆率计算：实际爆率 = 基本爆率 / KD
 * 价值说明：v字段表示物品价值(三角洲风格)，用于计算玩家总价值
 *===================================================*/

/*========== 5. 传说摸金池 (Chuanshuo) - 传说物品 ==========*/
var ChuanshuoChi = [
    {name: "Legendary Weapon", n: "Legendary Weapon", dn: "传说武器", d: 7, min: 1, max: 1, bl: 0.08, v: 150000},
    {name: "Mythic Rifle", n: "Mythic Rifle", dn: "神话步枪", d: 7, min: 1, max: 1, bl: 0.08, v: 140000},
    {name: "Ancient Sniper", n: "Ancient Sniper", dn: "远古狙击枪", d: 7, min: 1, max: 1, bl: 0.08, v: 160000},
    {name: "Divine Weapon", n: "Divine Weapon", dn: "神圣武器", d: 8, min: 1, max: 1, bl: 0.05, v: 200000},
    {name: "Celestial Armor", n: "Celestial Armor", dn: "天界护甲", d: 7, min: 1, max: 1, bl: 0.08, v: 180000},
    {name: "Ethereal Shield", n: "Ethereal Shield", dn: "以太护盾", d: 7, min: 1, max: 1, bl: 0.08, v: 170000},
    {name: "Phoenix Feather", n: "Phoenix Feather", dn: "凤凰羽毛", d: 7, min: 1, max: 2, bl: 0.1, v: 80000},
    {name: "Dragon Scale", n: "Dragon Scale", dn: "龙鳞", d: 7, min: 2, max: 5, bl: 0.12, v: 45000},
    {name: "Unicorn Horn", n: "Unicorn Horn", dn: "独角兽角", d: 8, min: 1, max: 1, bl: 0.05, v: 250000},
    {name: "Griffin Claw", n: "Griffin Claw", dn: "狮鹫爪", d: 7, min: 2, max: 4, bl: 0.1, v: 70000},
    {name: "Basilisk Eye", n: "Basilisk Eye", dn: "蛇怪之眼", d: 8, min: 1, max: 1, bl: 0.05, v: 220000},
    {name: "Chimera Heart", n: "Chimera Heart", dn: "奇美拉之心", d: 8, min: 1, max: 1, bl: 0.05, v: 240000},
    {name: "Hydra Blood", n: "Hydra Blood", dn: "海德拉之血", d: 7, min: 2, max: 5, bl: 0.1, v: 65000},
    {name: "Kraken Tentacle", n: "Kraken Tentacle", dn: "海怪触手", d: 7, min: 2, max: 4, bl: 0.1, v: 75000},
    {name: "Leviathan Scale", n: "Leviathan Scale", dn: "利维坦鳞片", d: 8, min: 1, max: 2, bl: 0.05, v: 280000},
    {name: "Titan Essence", n: "Titan Essence", dn: "泰坦精华", d: 8, min: 1, max: 1, bl: 0.05, v: 300000},
    {name: "Olympus Key", n: "Olympus Key", dn: "奥林匹斯钥匙", d: 8, min: 1, max: 1, bl: 0.04, v: 350000},
    {name: "Asgard Stone", n: "Asgard Stone", dn: "阿斯加德之石", d: 8, min: 1, max: 1, bl: 0.04, v: 320000},
    {name: "Valhalla Ticket", n: "Valhalla Ticket", dn: "瓦尔哈拉门票", d: 8, min: 1, max: 1, bl: 0.04, v: 380000},
    {name: "Eldritch Artifact", n: "Eldritch Artifact", dn: "古神遗物", d: 8, min: 1, max: 1, bl: 0.04, v: 400000},
    {name: "Cosmic Fragment", n: "Cosmic Fragment", dn: "宇宙碎片", d: 7, min: 1, max: 2, bl: 0.08, v: 120000},
    {name: "Stardust", n: "Stardust", dn: "星尘", d: 7, min: 3, max: 8, bl: 0.12, v: 35000},
    {name: "Moon Crystal", n: "Moon Crystal", dn: "月亮水晶", d: 7, min: 2, max: 5, bl: 0.1, v: 55000},
    {name: "Sun Essence", n: "Sun Essence", dn: "太阳精华", d: 8, min: 1, max: 2, bl: 0.05, v: 180000},
    {name: "Void Stone", n: "Void Stone", dn: "虚空之石", d: 8, min: 1, max: 1, bl: 0.05, v: 200000},
    {name: "Time Crystal", n: "Time Crystal", dn: "时间水晶", d: 8, min: 1, max: 1, bl: 0.04, v: 250000},
    {name: "Space Gem", n: "Space Gem", dn: "空间宝石", d: 8, min: 1, max: 1, bl: 0.04, v: 280000},
    {name: "Reality Shard", n: "Reality Shard", dn: "现实碎片", d: 8, min: 1, max: 1, bl: 0.04, v: 300000},
    {name: "Dimension Core", n: "Dimension Core", dn: "维度核心", d: 8, min: 1, max: 1, bl: 0.04, v: 350000},
    {name: "Multiverse Key", n: "Multiverse Key", dn: "多元宇宙钥匙", d: 8, min: 1, max: 1, bl: 0.03, v: 450000},
    {name: "Infinity Stone", n: "Infinity Stone", dn: "无限宝石", d: 8, min: 1, max: 1, bl: 0.03, v: 500000},
    {name: "Eternal Flame", n: "Eternal Flame", dn: "永恒之火", d: 8, min: 1, max: 1, bl: 0.03, v: 480000},
    {name: "Absolute Zero", n: "Absolute Zero", dn: "绝对零度", d: 8, min: 1, max: 1, bl: 0.03, v: 460000},
    {name: "Omega Device", n: "Omega Device", dn: "欧米茄装置", d: 8, min: 1, max: 1, bl: 0.03, v: 520000},
    {name: "Alpha Core", n: "Alpha Core", dn: "阿尔法核心", d: 8, min: 1, max: 1, bl: 0.03, v: 540000},
    {name: "Genesis Engine", n: "Genesis Engine", dn: "创世引擎", d: 8, min: 1, max: 1, bl: 0.02, v: 600000},
    {name: "Apocalypse Weapon", n: "Apocalypse Weapon", dn: "天启武器", d: 8, min: 1, max: 1, bl: 0.02, v: 650000},
    {name: "Rebirth Artifact", n: "Rebirth Artifact", dn: "重生遗物", d: 8, min: 1, max: 1, bl: 0.02, v: 700000},
    {name: "Immortality Elixir", n: "Immortality Elixir", dn: "长生不老药", d: 8, min: 1, max: 1, bl: 0.02, v: 800000},
    {name: "God Slayer", n: "God Slayer", dn: "弑神武器", d: 8, min: 1, max: 1, bl: 0.01, v: 1000000},
    {name: "World Ender", n: "World Ender", dn: "世界终结者", d: 8, min: 1, max: 1, bl: 0.01, v: 1200000},
    {name: "Universe Creator", n: "Universe Creator", dn: "宇宙创造者", d: 8, min: 1, max: 1, bl: 0.01, v: 1500000},
    {name: "Existence Eraser", n: "Existence Eraser", dn: "存在抹除者", d: 8, min: 1, max: 1, bl: 0.01, v: 2000000},
    {name: "Reality Weaver", n: "Reality Weaver", dn: "现实编织者", d: 8, min: 1, max: 1, bl: 0.01, v: 2500000},
    {name: "Time Lord's Staff", n: "Time Lord's Staff", dn: "时间法杖", d: 8, min: 1, max: 1, bl: 0.01, v: 3000000},
    {name: "Space God's Crown", n: "Space God's Crown", dn: "空间神冠", d: 8, min: 1, max: 1, bl: 0.01, v: 3500000},
    {name: "Omnipotence Orb", n: "Omnipotence Orb", dn: "全能宝珠", d: 8, min: 1, max: 1, bl: 0.005, v: 5000000},
    {name: "Ultimate Artifact", n: "Ultimate Artifact", dn: "终极遗物", d: 8, min: 1, max: 1, bl: 0.005, v: 10000000}
];

/*========== 6. 神话摸金池 (Shenhua) - 神话物品 ==========*/
var ShenhuaChi = [
    {name: "Block of Diamond", n: "Block of Diamond", dn: "钻石块", d: 7, min: 1, max: 2, bl: 0.1, v: 35000},
    {name: "Block of Emerald", n: "Block of Emerald", dn: "绿宝石块", d: 7, min: 1, max: 2, bl: 0.1, v: 32000},
    {name: "Block of Moonstone", n: "Block of Moonstone", dn: "月长石块", d: 7, min: 1, max: 2, bl: 0.1, v: 30000},
    {name: "Diamond Ore", n: "Diamond Ore", dn: "钻石矿石", d: 6, min: 2, max: 5, bl: 0.15, v: 18000},
    {name: "Emerald Ore", n: "Emerald Ore", dn: "绿宝石矿石", d: 6, min: 2, max: 5, bl: 0.15, v: 16000},
    {name: "Moonstone Ore", n: "Moonstone Ore", dn: "月长石矿石", d: 6, min: 2, max: 5, bl: 0.15, v: 14000},
    {name: "Gold Trophy", n: "Gold Trophy", dn: "黄金奖杯", d: 5, min: 1, max: 1, bl: 0.25, v: 5000},
    {name: "Bow", n: "Bow", dn: "战术弓", d: 5, min: 1, max: 1, bl: 0.25, v: 4500},
    {name: "Arrow", n: "Arrow", dn: "战术箭矢", d: 5, min: 10, max: 30, bl: 0.25, v: 4000},
    {name: "Moonstone Explosive", n: "Moonstone Explosive", dn: "月长石炸药", d: 5, min: 2, max: 6, bl: 0.25, v: 3500},
    {name: "Loot Chest", n: "Loot Chest", dn: "战利品箱", d: 5, min: 1, max: 1, bl: 0.2, v: 6000}
];

/*========== 7. 至尊摸金池 (Zhizun) - 顶级物品 ==========*/
var ZhizunChi = [
    {name: "Gold Trophy", n: "Gold Trophy", dn: "黄金奖杯", d: 10, min: 1, max: 1, bl: 0.01, v: 500000},
    {name: "Beacon", n: "Beacon", dn: "信标", d: 10, min: 1, max: 1, bl: 0.01, v: 200000},
    {name: "Block of Diamond", n: "Block of Diamond", dn: "钻石块", d: 10, min: 2, max: 4, bl: 0.015, v: 180000},
    {name: "Block of Emerald", n: "Block of Emerald", dn: "绿宝石块", d: 10, min: 2, max: 4, bl: 0.02, v: 150000},
    {name: "Block of Moonstone", n: "Block of Moonstone", dn: "月长石块", d: 10, min: 2, max: 4, bl: 0.02, v: 130000},
    {name: "Diamond Ore", n: "Diamond Ore", dn: "钻石矿石", d: 9, min: 5, max: 10, bl: 0.02, v: 120000},
    {name: "Emerald Ore", n: "Emerald Ore", dn: "绿宝石矿石", d: 9, min: 5, max: 10, bl: 0.02, v: 100000},
    {name: "Moonstone Ore", n: "Moonstone Ore", dn: "月长石矿石", d: 9, min: 5, max: 10, bl: 0.02, v: 90000},
    {name: "Bow", n: "Bow", dn: "战术弓", d: 9, min: 1, max: 1, bl: 0.03, v: 80000},
    {name: "Arrow", n: "Arrow", dn: "战术箭矢", d: 9, min: 20, max: 50, bl: 0.03, v: 60000},
    {name: "Moonstone Explosive", n: "Moonstone Explosive", dn: "月长石炸药", d: 9, min: 3, max: 8, bl: 0.04, v: 50000},
    {name: "Block of Gold", n: "Block of Gold", dn: "金块", d: 9, min: 3, max: 6, bl: 0.04, v: 45000},
    {name: "Gold Ore", n: "Gold Ore", dn: "金矿石", d: 8, min: 5, max: 15, bl: 0.04, v: 35000},
    {name: "Iron Ore", n: "Iron Ore", dn: "铁矿石", d: 8, min: 10, max: 30, bl: 0.05, v: 25000},
    {name: "Block of Iron", n: "Block of Iron", dn: "铁块", d: 8, min: 3, max: 8, bl: 0.05, v: 30000},
    {name: "Coal Ore", n: "Coal Ore", dn: "煤矿石", d: 7, min: 10, max: 30, bl: 0.06, v: 15000},
    {name: "Block of Coal", n: "Block of Coal", dn: "煤炭块", d: 7, min: 3, max: 8, bl: 0.06, v: 18000},
    {name: "Loot Chest", n: "Loot Chest", dn: "战利品箱", d: 9, min: 1, max: 1, bl: 0.03, v: 70000},
    {name: "Lucky Block", n: "Lucky Block", dn: "幸运方块", d: 9, min: 1, max: 1, bl: 0.03, v: 65000},
    {name: "Ultra Lucky Block", n: "Ultra Lucky Block", dn: "超级幸运方块", d: 9, min: 1, max: 1, bl: 0.03, v: 60000},
    {name: "Generator Spawn Block (Diamond)", n: "Generator Spawn Block (Diamond)", dn: "钻石生成器", d: 10, min: 1, max: 1, bl: 0.02, v: 95000},
    {name: "Generator Spawn Block (Moonstone)", n: "Generator Spawn Block (Moonstone)", dn: "月长石生成器", d: 10, min: 1, max: 1, bl: 0.02, v: 90000},
    {name: "Generator Spawn Block (Ore)", n: "Generator Spawn Block (Ore)", dn: "矿石生成器", d: 10, min: 1, max: 1, bl: 0.02, v: 85000},
    {name: "Diamond Spikes", n: "Diamond Spikes", dn: "钻石尖刺", d: 9, min: 1, max: 2, bl: 0.03, v: 55000},
    {name: "Gold Spikes", n: "Gold Spikes", dn: "金尖刺", d: 8, min: 2, max: 4, bl: 0.04, v: 35000},
    {name: "Iron Spikes", n: "Iron Spikes", dn: "铁尖刺", d: 7, min: 3, max: 6, bl: 0.05, v: 20000},
    {name: "Obsidian", n: "Obsidian", dn: "黑曜石", d: 8, min: 5, max: 15, bl: 0.05, v: 18000},
    {name: "Spectral Log", n: "Spectral Log", dn: "幽灵原木", d: 9, min: 3, max: 8, bl: 0.04, v: 28000},
    {name: "Spectral Wood Planks", n: "Spectral Wood Planks", dn: "幽灵木板", d: 9, min: 5, max: 15, bl: 0.04, v: 25000},
    {name: "Spectral Leaves", n: "Spectral Leaves", dn: "幽灵树叶", d: 8, min: 10, max: 30, bl: 0.05, v: 15000},
    {name: "Spectral Grass", n: "Spectral Grass", dn: "幽灵草", d: 8, min: 5, max: 15, bl: 0.05, v: 12000},
    {name: "Draugr Banner", n: "Draugr Banner", dn: "亡灵旗帜", d: 9, min: 1, max: 1, bl: 0.03, v: 50000},
    {name: "Gold Antlers", n: "Gold Antlers", dn: "黄金鹿角", d: 9, min: 1, max: 1, bl: 0.03, v: 48000},
    {name: "Bone Antlers", n: "Bone Antlers", dn: "骨制鹿角", d: 8, min: 1, max: 2, bl: 0.04, v: 32000},
    {name: "Gold Watermelon Stag Spawner Block", n: "Gold Watermelon Stag Spawner Block", dn: "金西瓜雄鹿生成器", d: 10, min: 1, max: 1, bl: 0.02, v: 80000},
    {name: "Legendary Key", n: "Legendary Key", dn: "传说钥匙", d: 10, min: 1, max: 1, bl: 0.01, v: 250000},
    {name: "Mythic Key", n: "Mythic Key", dn: "神话钥匙", d: 10, min: 1, max: 1, bl: 0.008, v: 400000},
    {name: "Ultimate Key", n: "Ultimate Key", dn: "至尊钥匙", d: 10, min: 1, max: 1, bl: 0.005, v: 800000},
    {name: "Dragon Scale", n: "Dragon Scale", dn: "龙鳞", d: 10, min: 1, max: 1, bl: 0.01, v: 200000},
    {name: "Phoenix Feather", n: "Phoenix Feather", dn: "凤凰羽毛", d: 10, min: 1, max: 1, bl: 0.01, v: 180000},
    {name: "Unicorn Horn", n: "Unicorn Horn", dn: "独角兽角", d: 10, min: 1, max: 1, bl: 0.01, v: 170000},
    {name: "Crystal Heart", n: "Crystal Heart", dn: "水晶之心", d: 10, min: 1, max: 1, bl: 0.01, v: 160000},
    {name: "Soul Gem", n: "Soul Gem", dn: "灵魂宝石", d: 10, min: 1, max: 1, bl: 0.01, v: 150000},
    {name: "Void Essence", n: "Void Essence", dn: "虚空精华", d: 10, min: 1, max: 1, bl: 0.01, v: 140000},
    {name: "Time Shard", n: "Time Shard", dn: "时间碎片", d: 10, min: 1, max: 1, bl: 0.01, v: 130000},
    {name: "Reality Fragment", n: "Reality Fragment", dn: "现实碎片", d: 10, min: 1, max: 1, bl: 0.01, v: 120000},
    {name: "Cosmic Dust", n: "Cosmic Dust", dn: "宇宙尘埃", d: 9, min: 2, max: 5, bl: 0.02, v: 50000},
    {name: "Star Metal", n: "Star Metal", dn: "星铁", d: 9, min: 1, max: 2, bl: 0.02, v: 55000},
    {name: "Ethereal Crystal", n: "Ethereal Crystal", dn: "以太水晶", d: 9, min: 1, max: 2, bl: 0.02, v: 52000},
    {name: "Divine Essence", n: "Divine Essence", dn: "神圣精华", d: 10, min: 1, max: 1, bl: 0.01, v: 110000},
    {name: "Celestial Orb", n: "Celestial Orb", dn: "天界宝珠", d: 10, min: 1, max: 1, bl: 0.01, v: 105000},
    {name: "Astral Fragment", n: "Astral Fragment", dn: "星界碎片", d: 9, min: 2, max: 4, bl: 0.02, v: 48000},
    {name: "Nebula Dust", n: "Nebula Dust", dn: "星云尘埃", d: 9, min: 2, max: 5, bl: 0.02, v: 45000},
    {name: "Galaxy Core", n: "Galaxy Core", dn: "银河核心", d: 10, min: 1, max: 1, bl: 0.01, v: 125000}
];

/*导出摸金池信息*/
var mojinchi_part2_info = {
  version: "4.2",
  pools: ["ChuanshuoChi", "ShenhuaChi", "ZhizunChi"],
  poolNames: {
    "ChuanshuoChi": "传说摸金池",
    "ShenhuaChi": "神话摸金池",
    "ZhizunChi": "至尊摸金池"
  },
  totalItems: ChuanshuoChi.length + ShenhuaChi.length + ZhizunChi.length
};
