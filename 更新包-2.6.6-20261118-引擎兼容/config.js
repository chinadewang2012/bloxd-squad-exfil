// ============================================
// config.js - 搜打撤 全局配置 (CommonJS)
// v2.4: MAPS 为实际内容(锚点 1000,0,1000);
// 2026-11-13 清理: 移除 AI 追加的无效物品名/重复键/倒置坐标, 仅保留 bloxd 官方物品名
// ============================================
// [融合说明] 以维护版 config 为基底, 合入小怪系统(SMALL_MOB)、
//            各地图 MobStrong、扩充变卖物; 见文件内标注。
/* 版本戳(游戏内 /ver 查询;启动时控制台打印) */
const VERSION = 'v2.6.6-20261118+engine-fix';
/* ===== 零号大坝: 实际内容已写死(锚点 1000,0,1000) ===== */
const MAPS_REAL_ANCHOR = [1000, 0, 1000];
const MAPS = {
    gt: {
        name: '钻井平台',
        searchTime: 600,
        gearReq: 4,
        spawn: [0, 0, 0],
        zones: {
            search: { min: [1443, 49, 482], max: [1485, 61, 512] },
            extract: { min: [1471, 26, 498], max: [1472, 26, 499] },
        },
        /* cld: 撤离点坐标表("编号": [x,y,z]) */
        cld: { '1': [1471, 26, 499] },

        mobTypes: ['Draugr Zombie', 'Draugr Skeleton', 'Wildcat'],
        MobStrong: 1,   // [融合] 小怪强度倍率(1=最普通图基准, 两三枪能打死)
        mobInterval: 200,
        lootTable: [
            ['Iron Sword', 'gear', 50, 10], ['Iron Bow', 'gear', 45, 8], ['Iron Pickaxe', 'gear', 30, 12],
            ['Iron Helmet', 'gear', 20, 10], ['Iron Chestplate', 'gear', 40, 8], ['Iron Leggings', 'gear', 35, 8], ['Iron Boots', 'gear', 20, 10],
            ['Bread', 'item', 5, 25], ['Apple', 'item', 3, 30], ['Steak', 'item', 8, 15], ['Arrow', 'item', 2, 35],
            ['Diamond Sword', 'gear', 120, 2], ['Knight Sword', 'gear', 80, 5],
        ],
  
    },
    jianyu: {
        name: "极西监狱",
        disabled: true,   /* 坐标仍是 [0,0,0] 占位, 暂不开放: getMapList/onDeployRequest 已过滤 */
        searchTime: 1000,
        gearReq: 15,
        spawn:[0,0,0],
        /* TODO: 以下 search/extract/cld 仍为 [0,0,0] 占位坐标, 需填真机实测值后才能启用该图 */
        zones:{   // [融合] 原为 zone(笔误, 代码读 map.zones 会崩), 已改为 zones
            search:{min:[0,0,0],max:[0,0,0]},
            extract:{min:[0,0,0],max:[0,0,0]}
        },
        cld:{"1":[0,0,0]},
        
        mobTypes: ['Draugr Zombie', 'Draugr Skeleton', 'Wildcat'],
        MobStrong: 3.2,   // [融合] 高难度图(gearReq15/搜索1000s), 小怪更强
        mobInterval: 200,
        lootTable: [
            ['Iron Sword', 'gear', 50, 10], ['Iron Bow', 'gear', 45, 8], ['Iron Pickaxe', 'gear', 30, 12],
            ['Iron Helmet', 'gear', 20, 10], ['Iron Chestplate', 'gear', 40, 8], ['Iron Leggings', 'gear', 35, 8], ['Iron Boots', 'gear', 20, 10],
            ['Bread', 'item', 5, 25], ['Apple', 'item', 3, 30], ['Steak', 'item', 8, 15], ['Arrow', 'item', 2, 35],
            ['Diamond Sword', 'gear', 120, 2], ['Knight Sword', 'gear', 80, 5],
        ],
  
    },
    /* [融合] farm/mine/city 已注释停用; 重新启用时建议补 MobStrong(farm=1, mine=1.5, city=2.3)
    farm: {
      name: '农场',
      searchTime: 240,
      gearReq: 0,
      spawn: [0, 0, 0],
      zones: {
        search:  {min:[20,50,20],  max:[80,90,80]},
        extract: {min:[85,60,85],  max:[100,80,100]},
      },
      
      cld: { '1': [92, 70, 92] },
      mobTypes: ['Draugr Zombie', 'Draugr Skeleton', 'Wildcat'],
      MobStrong: 1,
      mobInterval: 200,
      lootTable: [
        ['Iron Sword','gear',50,10], ['Iron Bow','gear',45,8], ['Iron Pickaxe','gear',30,12],
        ['Iron Helmet','gear',20,10], ['Iron Chestplate','gear',40,8], ['Iron Leggings','gear',35,8], ['Iron Boots','gear',20,10],
        ['Bread','item',5,25], ['Apple','item',3,30], ['Steak','item',8,15], ['Arrow','item',2,35],
        ['Diamond Sword','gear',120,2], ['Knight Sword','gear',80,5],
      ],
    },
    mine: {
      name: '矿洞',
      searchTime: 300,
      gearReq: 8,
      spawn: [0, 0, 0],
      zones: {
        search:  {min:[160,50,160], max:[220,90,220]},
        extract: {min:[225,60,225],  max:[240,80,240]},
      },
      
      cld: { '1': [232, 70, 232] },
      mobTypes: ['Draugr Skeleton', 'Cave Golem', 'Wildcat'],
      MobStrong: 1.5,
      mobInterval: 150,
      lootTable: [
        ['Iron Pickaxe','gear',30,15], ['Diamond Pickaxe','gear',80,5],
        ['Iron Helmet','gear',20,12], ['Iron Chestplate','gear',40,10],
        ['Bread','item',5,20], ['Apple','item',3,25], ['Diamond Sword','gear',120,3], ['Iron Sword','gear',50,10],
      ],
    },
    city: {
      name: '城市废墟',
      searchTime: 360,
      gearReq: 15,
      spawn: [0, 0, 0],
      zones: {
        search:  {min:[310,50,310], max:[380,90,380]},
        extract: {min:[385,60,385],  max:[400,80,400]},
      },
      
      cld: { '1': [392, 70, 392] },
      mobTypes: ['Draugr Zombie', 'Draugr Knight', 'Wildcat'],
      MobStrong: 2.3,
      mobInterval: 120,
      lootTable: [
        ['Knight Sword','gear',80,10], ['Diamond Sword','gear',120,5],
        ['Diamond Helmet','gear',60,6], ['Diamond Chestplate','gear',100,4], ['Diamond Leggings','gear',90,5], ['Diamond Boots','gear',50,6],
        ['Diamond Bow','gear',100,4],
        ['Bread','item',5,20], ['Steak','item',8,15], ['Arrow','item',2,30],
      ],
    },*/
    dam: {
        /* 零号大坝(复原) 实际内容 — 锚点(1000,0,1000), 与 output/dam400 蓝图逐块对应
         * exfils: 固定=直接撤 / 限重=载重≤maxWeight / 丢包=变卖所得归零 / 随机=每局开1处 / 付费=扣cost / 电梯=长读条 */
        name: '零号大坝',
        searchTime: 420,
        gearReq: 12,
        spawn: [0, 0, 0],
        zones: {
            search: { min: [1014, 0, 1016], max: [1386, 31, 1118] },
            extract: { min: [1002, 4, 1062], max: [1006, 8, 1066] },
        },
        exfils: [
            { key: 'west', name: '西侧隧道', type: '固定', time: 10, zone: { min: [1002, 4, 1062], max: [1006, 8, 1066] } },
            { key: 'east', name: '东侧隧道', type: '固定', time: 10, zone: { min: [1393, 4, 1062], max: [1397, 8, 1066] } },
            { key: 'crest', name: '坝顶限重', type: '限重', time: 10, maxWeight: 50, zone: { min: [1190, 23, 1129], max: [1210, 24, 1130] } },
            { key: 'pipe', name: '军营管道', type: '丢包', time: 10, zone: { min: [1033, 5, 1054], max: [1037, 7, 1056] } },
            { key: 'cement', name: '水泥厂', type: '随机', time: 10, zone: { min: [1124, 4, 1106], max: [1130, 6, 1109] } },
            { key: 'visitor', name: '游客中心', type: '随机', time: 10, zone: { min: [1242, 4, 1060], max: [1248, 6, 1063] } },
            { key: 'paid', name: '付费撤离', type: '付费', time: 30, cost: 10000, zone: { min: [1234, 4, 1114], max: [1238, 6, 1118] } },
            { key: 'elev', name: '工业电梯', type: '电梯', time: 30, zone: { min: [1209, 4, 1071], max: [1211, 6, 1073] } }
        ],
        /* leverRequired: 条件撤离(踩黑色羊毛)前必须拉闸的次数, 本图拉闸 1 次即达标
         *   可被单个撤离点的 leverRequired 覆盖; 不写时用 EXTRACT.leverRequiredDefault */
        leverRequired: 1,
        /* cld: 撤离点坐标表("编号": [x,y,z]) — 共 8 个, 与下面 8 个 exfils 一一对应(键序按编号, 非 exfils 顺序) */
        cld: {
            '1': [1004, 4, 1064],    // 西侧隧道
            '2': [1200, 23, 1129],   // 坝顶限重
            '3': [1035, 5, 1055],    // 军营管道
            '4': [1127, 4, 1107],    // 水泥厂
            '5': [1245, 4, 1061],    // 游客中心
            '6': [1236, 4, 1116],    // 付费撤离
            '7': [1210, 4, 1072],    // 工业电梯
            '8': [1395, 6, 1064],    // 东侧隧道(由 exfils.east.zone 中心派生)
        },
        /* POI 实际区域(世界坐标) — 供守卫刷怪/导航/任务用 */
        pois: {
            dam: { min: [1000, 0, 1120], max: [1399, 31, 1131] },
            reservoir: { min: [1014, 0, 1132], max: [1386, 31, 1199] },
            powerhouse: { min: [1030, 0, 1070], max: [1110, 31, 1114] },
            admin: { min: [1180, 0, 1070], max: [1205, 31, 1096] },
            camp: { min: [1016, 0, 1020], max: [1090, 31, 1058] },
            cement: { min: [1115, 0, 1085], max: [1150, 31, 1110] },
            substation_main: { min: [1236, 0, 1090], max: [1290, 31, 1114] },
            substation_backup: { min: [1240, 0, 1098], max: [1275, 31, 1116] },
            visitor: { min: [1238, 0, 1064], max: [1288, 31, 1088] },
            vault: { min: [1192, 5, 1124], max: [1204, 8, 1128] },
            elevator: { min: [1208, 4, 1070], max: [1212, 20, 1074] },
            broken_bridge: { min: [1145, 6, 1100], max: [1180, 8, 1110] },
            river: { min: [1155, 2, 1000], max: [1175, 4, 1131] },
            basin: { min: [1120, 3, 1112], max: [1225, 5, 1117] },
            tunnel_w: { min: [1000, 4, 1062], max: [1011, 8, 1066] },
            tunnel_e: { min: [1388, 4, 1062], max: [1399, 8, 1066] }
        },
        /* 35 个战利品箱实际位置 [x,y,z,类型] — 头顶标记块已含在蓝图内 */
        chests: [
            [1008, 4, 1004, "普通"],
            [1024, 4, 1028, "物资"],
            [1050, 4, 1028, "物资"],
            [1024, 4, 1044, "物资"],
            [1050, 4, 1044, "物资"],
            [1070, 4, 1029, "高级"],
            [1124, 4, 1107, "物资"],
            [1142, 4, 1107, "物资"],
            [1132, 4, 1093, "高级"],
            [1132, 4, 1108, "BOSS"],
            [1040, 4, 1076, "物资"],
            [1058, 4, 1076, "物资"],
            [1076, 4, 1076, "物资"],
            [1094, 4, 1076, "物资"],
            [1060, 4, 1104, "高级"],
            [1094, 4, 1104, "BOSS"],
            [1185, 4, 1075, "物资"],
            [1200, 4, 1075, "物资"],
            [1197, 9, 1080, "高级"],
            [1190, 17, 1088, "BOSS"],
            [1250, 4, 1100, "物资"],
            [1270, 4, 1100, "物资"],
            [1280, 4, 1110, "高级"],
            [1250, 4, 1106, "物资"],
            [1245, 4, 1070, "物资"],
            [1270, 4, 1070, "物资"],
            [1260, 4, 1080, "高级"],
            [1150, 8, 1105, "普通"],
            [1100, 23, 1129, "物资"],
            [1300, 23, 1129, "物资"],
            [1100, 5, 1125, "物资"],
            [1300, 5, 1125, "物资"],
            [1198, 6, 1126, "BOSS"],
            [1003, 4, 1063, "物资"],
            [1396, 4, 1065, "物资"]
        ],
        /* 索降区(世界坐标) */
        dropzones: { west: { min: [1016, 0, 1016], max: [1024, 31, 1024] }, east: { min: [1376, 0, 1016], max: [1384, 31, 1024] } },
        mobTypes: ['Draugr Knight', 'Draugr Zombie', 'Draugr Skeleton'],
        MobStrong: 2.3,   // [融合] 大坝为高难度图
        mobInterval: 130,
        lootTable: [
            ['Knight Sword', 'gear', 80, 8], ['Diamond Sword', 'gear', 120, 4], ['Moonstone Dagger', 'gear', 150, 2],
            ['Diamond Helmet', 'gear', 60, 5], ['Diamond Chestplate', 'gear', 100, 4], ['Diamond Leggings', 'gear', 90, 4], ['Diamond Boots', 'gear', 50, 5],
            ['Diamond Bow', 'gear', 100, 4],
            ['Bread', 'item', 5, 20], ['Steak', 'item', 8, 15], ['Arrow', 'item', 2, 30],
        ],
    },
};
/* ===== 三角洲风格变卖物目录 =====
 * 载体只能用 bloxd 官方物品名(ITEM_NAMES.txt), display=三角洲风格中文名。
 * 2026-11-13 清理: AI 追加的 70 个 Minecraft 风格无效载体已移除(它们在游戏中不存在, 永远无法产出/变卖)。
 * cat=分类, tier=稀有度(1白 2绿 3蓝 4紫 5金 6红), value=变卖价(金币)。
 * 摸金掉落与变卖面板均以本表为准; 各图按 SELL_TIER_CAP 限制可出的稀有度上限。 */
const RARITY = {
    1: { name: '白', color: '#FFFFFF' },
    2: { name: '绿', color: '#55FF55' },
    3: { name: '蓝', color: '#55AAFF' },
    4: { name: '紫', color: '#BB55FF' },
    5: { name: '金', color: '#FFC83D' },
    6: { name: '红', color: '#FF4444' },
};
const SELL_CATALOG = [
    /* ===== 三角洲行动「危险行动」变卖物目录 (纯装饰版 2026-11-14 收口) =====
     * 【硬规则】变卖物只能是"纯装饰方块"——不能是任何功能物品:
     *   禁止载体: 工具/武器/护甲/食物/药水/弹药/钥匙/信标/灯/漏斗/代码块/书架/地图/炸药等机关或交互物
     *   禁止载体: 全部羊毛(撤离点 & 箱子样式触发块) + Red Concrete(AWP 子弹)
     *   允许载体: 各类混凝土/玻璃/地毯/木板/陶瓦(Baked Clay)/矿石/宝石块/金属锭(纯装饰, 不可交互)
     * display 用三角洲收集品原名; 稀有度: 红(6) > 金(5) > 紫(4) > 蓝(3) > 绿(2) > 白(1)
     * 摸金池按 SELL_TIER_CAP 自动取用; 箱子产出同步: CHEST_STYLES 里的变卖物行与本表同名同价同 display */
    /* 贵重物品 */
    { item: 'Block of Moonstone', display: '海洋之泪', cat: '贵重物品', tier: 6, value: 6500000 },
    { item: 'Block of Diamond', display: '非洲之心', cat: '贵重物品', tier: 6, value: 5000000 },
    { item: 'Yellow Baked Clay', display: '曼德尔砖', cat: '贵重物品', tier: 6, value: 2600000 },
    { item: 'Block of Emerald', display: '翡翠王座', cat: '贵重物品', tier: 6, value: 1800000 },
    { item: 'Block of Gold', display: '黄金瞪羚', cat: '贵重物品', tier: 6, value: 1500000 },
    { item: 'Block of Quartz', display: '克劳狄乌斯半身像', cat: '贵重物品', tier: 6, value: 1200000 },
    { item: 'Block of Lapis Lazuli', display: '鱼月徽权杖首', cat: '贵重物品', tier: 6, value: 900000 },
    { item: 'Block of Coal', display: '深渊之核', cat: '贵重物品', tier: 6, value: 800000 },
    { item: 'Golden Decoration', display: '万金泪冠', cat: '贵重物品', tier: 6, value: 700000 },
    { item: 'Block of Iron', display: '装甲车电池', cat: '贵重物品', tier: 6, value: 620000 },
    { item: 'Blue Concrete', display: '绝密服务器', cat: '贵重物品', tier: 5, value: 380000 },
    { item: 'White Concrete', display: '复苏呼吸机', cat: '贵重物品', tier: 5, value: 320000 },
    { item: 'Black Concrete', display: '飞行记录仪', cat: '贵重物品', tier: 5, value: 280000 },
    { item: 'White Baked Clay', display: '微型反应炉', cat: '贵重物品', tier: 5, value: 240000 },
    { item: 'Crystal Block', display: '高速磁盘阵列', cat: '贵重物品', tier: 5, value: 210000 },
    { item: 'Ice Bricks', display: '云存储阵列', cat: '贵重物品', tier: 5, value: 180000 },
    { item: 'Magenta Baked Clay', display: '曼德尔超算单元', cat: '贵重物品', tier: 5, value: 160000 },
    { item: 'Gray Baked Clay', display: '便携军用雷达', cat: '贵重物品', tier: 5, value: 150000 },
    { item: 'Obsidian', display: '强化碳纤维板', cat: '贵重物品', tier: 5, value: 120000 },
    { item: 'Gold Bar', display: '金条', cat: '贵重物品', tier: 5, value: 100000 },
    { item: 'Copper Bar', display: '主战坦克模型', cat: '贵重物品', tier: 4, value: 42000 },
    { item: 'Magenta Concrete', display: '陨石切片标本', cat: '贵重物品', tier: 4, value: 33000 },
    { item: 'Lime Concrete', display: '天然红珊瑚雕件', cat: '贵重物品', tier: 4, value: 12000 },
    { item: 'Pink Concrete', display: '钻石项链', cat: '贵重物品', tier: 3, value: 7000 },
    { item: 'Light Gray Concrete', display: '铂金戒指', cat: '贵重物品', tier: 3, value: 6000 },
    { item: 'Gray Carpet', display: '金表', cat: '贵重物品', tier: 3, value: 5000 },
    { item: 'White Planks', display: '古董钟', cat: '贵重物品', tier: 3, value: 4200 },
    /* 电子产品 */
    { item: 'Gray Concrete', display: '笔记本电脑', cat: '电子产品', tier: 4, value: 68000 },
    { item: 'Green Concrete', display: '显卡', cat: '电子产品', tier: 4, value: 28000 },
    { item: 'Brown Concrete', display: '相机', cat: '电子产品', tier: 4, value: 24000 },
    { item: 'Cyan Concrete', display: '电子脚镣', cat: '电子产品', tier: 3, value: 9000 },
    { item: 'Light Blue Concrete', display: '刀片服务器', cat: '电子产品', tier: 3, value: 8000 },
    /* 情报文件 */
    { item: 'Brown Baked Clay', display: '加密数据芯片', cat: '情报文件', tier: 4, value: 52000 },
    { item: 'Orange Carpet', display: '印象派名画', cat: '情报文件', tier: 4, value: 45000 },
    /* 医疗物资 */
    { item: 'Purple Concrete', display: 'ECMO', cat: '医疗物资', tier: 4, value: 38000 },
    { item: 'Red Baked Clay', display: '自动体外除颤器', cat: '医疗物资', tier: 4, value: 20000 },
    { item: 'Red Planks', display: '手术包', cat: '医疗物资', tier: 3, value: 2800 },
    { item: 'Light Gray Planks', display: '医疗包', cat: '医疗物资', tier: 3, value: 2400 },
    /* 工业材料 */
    { item: 'Orange Concrete', display: '等离子切割机', cat: '工业材料', tier: 4, value: 16000 },
    { item: 'Iron Fragment', display: '螺丝', cat: '工业材料', tier: 1, value: 80 },
    { item: 'Gold Fragment', display: '硬币', cat: '工业材料', tier: 1, value: 100 },
    { item: 'Iron Ore', display: '铁矿石', cat: '工业材料', tier: 1, value: 100 },
    { item: 'Coal Ore', display: '煤矿脉', cat: '工业材料', tier: 1, value: 80 },
    { item: 'Lapis Lazuli Ore', display: '青金石矿脉', cat: '工业材料', tier: 2, value: 1200 },
    { item: 'Pure Coal Ore', display: '红石矿脉', cat: '工业材料', tier: 2, value: 1500 },
    { item: 'Gold Ore', display: '金矿脉', cat: '工业材料', tier: 3, value: 12000 },
    { item: 'Diamond Ore', display: '金伯利岩', cat: '工业材料', tier: 4, value: 58000 },
    { item: 'Emerald Ore', display: '祖母绿矿脉', cat: '工业材料', tier: 4, value: 82000 },
    /* 生活用品 */
    { item: 'Yellow Concrete', display: '扫拖一体机器人', cat: '生活用品', tier: 4, value: 14000 },
    { item: 'Brown Planks', display: '咖啡', cat: '生活用品', tier: 2, value: 900 },
    { item: 'Brown Carpet', display: '巧克力', cat: '生活用品', tier: 2, value: 800 },
    { item: 'White Glass', display: '香烟', cat: '生活用品', tier: 2, value: 700 },
    { item: 'Green Glass', display: '酒', cat: '生活用品', tier: 2, value: 600 },
    { item: 'Yellow Planks', display: '罐头', cat: '生活用品', tier: 2, value: 500 },
    { item: 'Lime Planks', display: '牙膏', cat: '生活用品', tier: 2, value: 420 },
    { item: 'Cyan Planks', display: '钢笔', cat: '生活用品', tier: 2, value: 350 },
    { item: 'Pink Planks', display: '肥皂', cat: '生活用品', tier: 2, value: 300 },
    { item: 'Purple Planks', display: '打火机', cat: '生活用品', tier: 2, value: 260 },
    { item: 'Magenta Planks', display: '灯泡', cat: '生活用品', tier: 2, value: 220 },
    { item: 'Black Carpet', display: '钥匙扣', cat: '生活用品', tier: 1, value: 150 },
    { item: 'White Carpet', display: '邮票', cat: '生活用品', tier: 1, value: 120 },
    /* 军用物资 */
    { item: 'Black Planks', display: '防弹插板', cat: '军用物资', tier: 3, value: 3200 },
    { item: 'Green Planks', display: '战术背包', cat: '军用物资', tier: 3, value: 2000 },
];
/* 各图摸金分区的稀有度上限(越大越可能出高级变卖物) */
const SELL_TIER_CAP = { gt: 3, jianyu: 6, dam: 6 };   // 键必须与 MAPS 一致(已移除停用的 farm/mine/city)
/* ===== 箱子样式(v2.3 开箱体系: 头顶方块决定样式, 每行物品独立掷骰) =====
 * items: name=官方物品名, chance=掷骰概率, value=变卖价, tier=认证等级展示
 * keyItem/keyName=大保险箱, spawnGuard/guardMob=触发守卫 */
const CHEST_STYLES = {
    'Block of Gold': {
        name: '高级箱', openMsg: '高级箱!!',
        spawnGuard: true,
        items: [
            { name: 'Knight Sword', chance: 0.3, value: 80, tier: 3, display: '骑士剑' },
            { name: 'Diamond Sword', chance: 0.15, value: 120, tier: 5, display: '钻石剑' },
            { name: 'Diamond Bow', chance: 0.18, value: 100, tier: 4, display: '钻石弓' },
            { name: 'Diamond Leggings', chance: 0.2, value: 90, tier: 4, display: '钻石护腿' },
            { name: 'Diamond Boots', chance: 0.2, value: 50, tier: 3, display: '钻石靴' },
            { name: 'Pink Concrete', chance: 0.2, value: 7000, tier: 3, display: '钻石项链' },
            { name: 'Light Gray Concrete', chance: 0.15, value: 6000, tier: 3, display: '铂金戒指' },
            { name: 'Gray Carpet', chance: 0.12, value: 5000, tier: 3, display: '金表' },
            { name: 'White Planks', chance: 0.1, value: 4200, tier: 3, display: '古董钟' },
            { name: 'Blue Concrete', chance: 0.01, value: 380000, tier: 5, display: '绝密服务器' },
            { name: 'Block of Gold', chance: 0.004, value: 1500000, tier: 6, display: '黄金瞪羚' },
            { name: 'Block of Moonstone', chance: 0.001, value: 6500000, tier: 6, display: '海洋之泪' },
            { name: 'Steak', chance: 0.4, value: 8, tier: 1, display: '美味炒面' },
            { name: 'Gold Carrot', chance: 0.15, value: 60, tier: 1, display: '战地医疗包' },
        ],
    },
    'Block of Diamond': {
        name: 'BOSS箱', openMsg: 'BOSS 级物资!!',
        spawnGuard: true, guardMob: 'Draugr Knight', bigInsurance: true,   // [融合] 大保险→点圈圈QTE
        items: [
            { name: 'Diamond Sword', chance: 0.5, value: 120, tier: 5, display: '钻石剑' },
            { name: 'Moonstone Dagger', chance: 0.2, value: 150, tier: 7, display: '月光石匕首' },
            { name: 'Diamond Bow', chance: 0.4, value: 100, tier: 4, display: '复合弓' },
            { name: 'Diamond Leggings', chance: 0.4, value: 90, tier: 4, display: '钻石护腿' },
            { name: 'Diamond Boots', chance: 0.4, value: 50, tier: 3, display: '钻石靴' },
            { name: 'Diamond Helmet', chance: 0.4, value: 60, tier: 3, display: '钻石盔' },
            { name: 'Block of Diamond', chance: 0.005, value: 5000000, tier: 6, display: '非洲之心' },
            { name: 'Block of Moonstone', chance: 0.003, value: 6500000, tier: 6, display: '海洋之泪' },
            { name: 'Block of Emerald', chance: 0.008, value: 1800000, tier: 6, display: '翡翠王座' },
            { name: 'Yellow Baked Clay', chance: 0.006, value: 2600000, tier: 6, display: '曼德尔砖' },
            { name: 'Golden Decoration', chance: 0.015, value: 700000, tier: 6, display: '万金泪冠' },
            { name: 'Block of Quartz', chance: 0.01, value: 1200000, tier: 6, display: '克劳狄乌斯半身像' },
        ],
    },
    /* ===== 主题箱样式 =====
     * key = bloxd.io 官方方块名(getBlock 返回值); 全表共 14 个样式(含上方 2 个旧版样式)。
     * 2026-11-13 清理: 旧版 Air/Stone Bricks 重复定义已删除(JS 对象重复键会静默覆盖);
     * 所有 style.items 载体已换成官方存在的物品名, 中文 display/概率/价格保持不变。 */
    'Air': {
        name: '杂物箱', openMsg: '你翻了翻旧箱子',
        qteType: 'timedClick', qteTune: { timeWindowMs: 1500 },
        items: [
            { name: 'Bread', chance: 0.55, value: 5, tier: 1, display: '面包' },
            { name: 'Apple', chance: 0.5, value: 3, tier: 1, display: '苹果' },
            { name: 'Rice', chance: 0.45, value: 10, tier: 1, display: '大米' },
            { name: 'Brown Planks', chance: 0.25, value: 900, tier: 2, display: '咖啡' },
            { name: 'Brown Carpet', chance: 0.2, value: 800, tier: 2, display: '巧克力' },
            { name: 'Iron Fragment', chance: 0.4, value: 80, tier: 1, display: '螺丝' },
            { name: 'White Carpet', chance: 0.3, value: 120, tier: 1, display: '邮票' },
        ],
    },
    'White Wool': {
        name: '食品箱', openMsg: '补给食品!',
        qteType: 'timedClick', qteTune: { timeWindowMs: 2000 },
        items: [
            { name: 'Bread', chance: 0.6, value: 5, tier: 1, display: '面包' },
            { name: 'Cooked Porkchop', chance: 0.55, value: 160, tier: 1, display: '战地口粮B' },
            { name: 'Cooked Mutton', chance: 0.5, value: 140, tier: 1, display: '烤羊肉' },
            { name: 'Chicken', chance: 0.5, value: 150, tier: 1, display: '烤鸡' },
            { name: 'Cooked Venison', chance: 0.4, value: 220, tier: 1, display: '煎三文鱼' },
            { name: 'Yellow Planks', chance: 0.3, value: 500, tier: 2, display: '罐头' },
            { name: 'Brown Planks', chance: 0.2, value: 900, tier: 2, display: '咖啡' },
            { name: 'Gold Watermelon Slice', chance: 0.04, value: 90000, tier: 4, display: '黄金急救片' },
        ],
    },
    'Gray Wool': {
        name: '材料箱', openMsg: '发现工业材料',
        qteType: 'timedClick', qteTune: { timeWindowMs: 2500 },
        items: [
            { name: 'Gray Concrete', chance: 0.08, value: 68000, tier: 4, display: '笔记本电脑' },
            { name: 'Green Concrete', chance: 0.12, value: 28000, tier: 4, display: '显卡' },
            { name: 'Cyan Concrete', chance: 0.1, value: 9000, tier: 3, display: '电子脚镣' },
            { name: 'Orange Concrete', chance: 0.08, value: 16000, tier: 4, display: '等离子切割机' },
            { name: 'Block of Iron', chance: 0.005, value: 620000, tier: 6, display: '装甲车电池' },
            { name: 'Iron Fragment', chance: 0.3, value: 80, tier: 1, display: '螺丝' },
        ],
    },
    'Yellow Wool': {
        name: '情报箱', openMsg: '机密文件!',
        qteType: 'rhythmClick', qteTune: { rhythmTier: 3 },
        items: [
            { name: 'Brown Baked Clay', chance: 0.15, value: 52000, tier: 4, display: '加密数据芯片' },
            { name: 'Orange Carpet', chance: 0.12, value: 45000, tier: 4, display: '印象派名画' },
            { name: 'White Planks', chance: 0.2, value: 4200, tier: 3, display: '古董钟' },
            { name: 'Magenta Baked Clay', chance: 0.01, value: 160000, tier: 5, display: '曼德尔超算单元' },
            { name: 'Gray Carpet', chance: 0.15, value: 5000, tier: 3, display: '金表' },
        ],
    },
    'Red Wool': {
        name: '医疗箱', openMsg: '医疗补给!',
        qteType: 'timedClick', qteTune: { timeWindowMs: 1800 },
        items: [
            { name: 'Sugar Cane Plant', chance: 0.55, value: 80, tier: 1, display: '营养补充包' },
            { name: 'Splash Slowness Potion', chance: 0.2, value: 1600, tier: 2, display: '战术喷雾' },
            { name: 'Poison Potion', chance: 0.1, value: 18000, tier: 3, display: '持久药剂' },
            { name: 'Splash Poison Potion', chance: 0.18, value: 9200, tier: 3, display: '能量粉末' },
            { name: 'Splash Shield Potion', chance: 0.08, value: 58000, tier: 4, display: '生命精华' },
            { name: 'Red Baked Clay', chance: 0.06, value: 20000, tier: 4, display: '自动体外除颤器' },
            { name: 'Light Gray Planks', chance: 0.2, value: 2400, tier: 3, display: '医疗包' },
            { name: 'Red Planks', chance: 0.12, value: 2800, tier: 3, display: '手术包' },
            { name: 'Purple Concrete', chance: 0.02, value: 38000, tier: 4, display: 'ECMO' },
        ],
    },
    'Green Wool': {
        name: '食材补给箱', openMsg: '丰富食材!',
        qteType: 'timedClick', qteTune: { timeWindowMs: 2200 },
        items: [
            { name: 'Crystalized Wheatfish', chance: 0.1, value: 70000, tier: 4, display: '晶化鳇鱼籽' },
            { name: 'Crowned Flame Angelfish', chance: 0.18, value: 6000, tier: 3, display: '火冠神仙鱼' },
            { name: 'Glacial Lanternfish', chance: 0.2, value: 5500, tier: 3, display: '冰河灯笼鱼' },
            { name: 'Barefrost Toothfish', chance: 0.35, value: 800, tier: 2, display: '寒霜鳕鱼' },
            { name: 'Fish N Chips', chance: 0.45, value: 200, tier: 1, display: '炸鱼薯条' },
            { name: 'Yellow Planks', chance: 0.25, value: 500, tier: 2, display: '罐头' },
            { name: 'Brown Planks', chance: 0.15, value: 900, tier: 2, display: '咖啡' },
        ],
    },
    'Blue Wool': {
        /* 展示层改名"大保险箱"; 数据库/地图方块key 仍为 Blue Wool, 不改存档键 */
        name: '大保险箱', openMsg: '大保险箱——房卡已消耗',
        keyItem: 'Blue Wool', keyName: '蓝色房卡',
        qteType: 'rhythmClick', qteTune: { rhythmTier: 6 },
        items: [
            { name: 'Blue Concrete', chance: 0.2, value: 380000, tier: 5, display: '绝密服务器' },
            { name: 'White Concrete', chance: 0.15, value: 320000, tier: 5, display: '复苏呼吸机' },
            { name: 'Black Concrete', chance: 0.12, value: 280000, tier: 5, display: '飞行记录仪' },
            { name: 'White Baked Clay', chance: 0.1, value: 240000, tier: 5, display: '微型反应炉' },
            { name: 'Crystal Block', chance: 0.08, value: 210000, tier: 5, display: '高速磁盘阵列' },
            { name: 'Ice Bricks', chance: 0.06, value: 180000, tier: 5, display: '云存储阵列' },
            { name: 'Magenta Baked Clay', chance: 0.1, value: 160000, tier: 5, display: '曼德尔超算单元' },
            { name: 'Block of Moonstone', chance: 0.003, value: 6500000, tier: 6, display: '海洋之泪' },
        ],
    },
    'Purple Wool': {
        name: '绝密箱', openMsg: '最高机密物资!!',
        spawnGuard: true, guardMob: 'Draugr Knight',
        qteType: 'rhythmClick', qteTune: { rhythmTier: 5 },
        items: [
            { name: 'Purple Concrete', chance: 0.15, value: 38000, tier: 4, display: 'ECMO' },
            { name: 'Magenta Concrete', chance: 0.12, value: 33000, tier: 4, display: '陨石切片标本' },
            { name: 'Lime Concrete', chance: 0.12, value: 12000, tier: 4, display: '天然红珊瑚雕件' },
            { name: 'Block of Diamond', chance: 0.004, value: 5000000, tier: 6, display: '非洲之心' },
            { name: 'Yellow Baked Clay', chance: 0.006, value: 2600000, tier: 6, display: '曼德尔砖' },
            { name: 'Golden Decoration', chance: 0.01, value: 700000, tier: 6, display: '万金泪冠' },
        ],
    },
    'Black Wool': {
        name: '陷阱箱', openMsg: '⚠ 危险!',
        qteType: 'rhythmClick', qteTune: { rhythmTier: 6 },
        items: [
            { name: 'Block Destroyer TNT', chance: 0.5, value: 25000, tier: 3, display: '高爆炸药' },
            { name: 'Charcoal', chance: 0.8, value: 200, tier: 1, display: '火药' },
            { name: 'Pearlescent Moonfish', chance: 0.15, value: 68000, tier: 4, display: '空间传送核心' },
            { name: 'Black Carpet', chance: 0.2, value: 150, tier: 1, display: '钥匙' },
            { name: 'Iron Fragment', chance: 0.3, value: 80, tier: 1, display: '螺丝' },
        ],
    },
    'Stone Bricks': {
        name: '杂物箱', openMsg: '旧箱子',
        qteType: 'timedClick', qteTune: { timeWindowMs: 1500 },
        items: [
            { name: 'Rice', chance: 0.5, value: 10, tier: 1, display: '大米' },
            { name: 'Iron Hoe', chance: 0.1, value: 120, tier: 1, display: '工具废铁' },
            { name: 'Brown Carpet', chance: 0.2, value: 800, tier: 2, display: '巧克力' },
            { name: 'White Carpet', chance: 0.2, value: 120, tier: 1, display: '邮票' },
        ],
    },
    'Gray Concrete': {
        name: '电子元件箱', openMsg: '电子设备!',
        qteType: 'timedClick', qteTune: { timeWindowMs: 2800 },
        items: [
            { name: 'Gray Concrete', chance: 0.15, value: 68000, tier: 4, display: '笔记本电脑' },
            { name: 'Green Concrete', chance: 0.2, value: 28000, tier: 4, display: '显卡' },
            { name: 'Cyan Concrete', chance: 0.08, value: 9000, tier: 3, display: '电子脚镣' },
            { name: 'Light Blue Concrete', chance: 0.1, value: 8000, tier: 3, display: '刀片服务器' },
            { name: 'Crystal Block', chance: 0.03, value: 210000, tier: 5, display: '高速磁盘阵列' },
            { name: 'Copper Bar', chance: 0.03, value: 42000, tier: 4, display: '主战坦克模型' },
            { name: 'Iron Fragment', chance: 0.3, value: 80, tier: 1, display: '螺丝' },
        ],
    },
    'Brown Concrete': {
        name: '矿物箱', openMsg: '矿物资源!',
        qteType: 'timedClick', qteTune: { timeWindowMs: 2600 },
        items: [
            { name: 'Iron Ore', chance: 0.45, value: 100, tier: 1, display: '铁矿石' },
            { name: 'Coal Ore', chance: 0.45, value: 80, tier: 1, display: '煤矿脉' },
            { name: 'Lapis Lazuli Ore', chance: 0.15, value: 1200, tier: 2, display: '青金石矿脉' },
            { name: 'Gold Ore', chance: 0.18, value: 12000, tier: 3, display: '金矿脉' },
            { name: 'Pure Coal Ore', chance: 0.2, value: 1500, tier: 2, display: '红石矿脉' },
            { name: 'Diamond Ore', chance: 0.08, value: 58000, tier: 4, display: '金伯利岩' },
            { name: 'Emerald Ore', chance: 0.05, value: 82000, tier: 4, display: '祖母绿矿脉' },
            { name: 'Block of Coal', chance: 0.005, value: 800000, tier: 6, display: '深渊之核' },
            { name: 'Block of Lapis Lazuli', chance: 0.003, value: 900000, tier: 6, display: '鱼月徽权杖首' },
            { name: 'Block of Emerald', chance: 0.002, value: 1800000, tier: 6, display: '翡翠王座' },
        ],
    },
};
/* ===== 聊天格式化配置 =====
 * 聊天格式 = [kd:X/Y]【段位】【荣誉称号】【身份】【玩家名】:消息
 * 段位从 db stats (kills/deaths/extracts) 自动计算
 * 荣誉称号 = CHAT_TITLES[玩家名] || CONST.titles[自动称号]
 * 身份 = whitelist → "管理", 其他 → "玩家" */
const CHAT_TITLES = {
    /* 手动配置的荣誉称号 (按玩家名匹配, 格式 "玩家名": "称号")
     * 不在此表的玩家自动用 CONST.titles 里按 extracts 数量的段位称号 */
    'zhongmo_xinhao48': '缔造者',
    'Admin': '服主',
    'Owner': '服主',
    'the_______': '创始人',
};
/* ===== 每日签到(rewards 按天数循环) ===== */
const CHECKIN = {
    /* TODO: 第4档 180000 与第3档 12000 相差 15 倍, 疑似多写一个 0; 属业务数值, 待服主确认 */
    rewards: [5000, 8000, 12000, 180000, 260000, 350000, 500000],
};
/* ===== 子弹系统 =====
 * 手里的枪使用第 AMMO_SLOT 格的子弹(真正消耗:每开一枪扣 1 颗,打空打不出伤害)。
 * 伤害规则(见 GUN_AMMO):
 *   值为数字 N  → 本次伤害 = 枪默认伤害 × N(普通伤害,受护甲/保护减免)
 *   值为 false  → 不改伤害,按枪默认伤害结算(真伤)
 *   子弹名未在表中 → 按 ×1 处理(仍是普通伤害)
 *   该枪压根没在表里 → 不走子弹系统,沿用原伤害
 */
const AMMO_SLOT = 11;
/* 枪械→子弹→伤害倍率。键=枪械物品名(guns.js 里的名字),内层键=子弹物品名。
 * 【按需填写】下面放了示例(子弹用 bloxd 原生 'Bullet' / 'Ammo'),实际请改成你自己的子弹物品名。*/
const GUN_AMMO = {
    'AK-47': { 'Bullet': 1.5, 'Ammo': false },
    'M16': { 'Bullet': 1.5, 'Ammo': false },
    'MP40': { 'Bullet': 1.2 },
    'AWP': { 'Red Concrete': 10 },
};
/* ===== 干员配置 =====
 * skillItem: 技能物品,手持单击即释放(保留 /skill 指令备用)
 * supplies: 无限补给的口粮/弹药(每0.5秒自动补充)
 */
const OPERATORS = {
    assault: {
        name: '暗影', desc: '近战唯一的王',
        icon: 'fa-solid fa-bolt', color: '#FF4444',
        passive: { speedMultiplier: 1.15 },
        skill: { name: '肾上腺素药剂', cooldown: 30000, durationMs: 5000, type: 'speed', power: 2.0 },
        skillItem: 'Blue Concrete', supplies: [['Bread', 5], ['Arrow', 32]],
    },
    medic: {
        name: '医疗兵', desc: '团队续航,可快速自救',
        icon: 'fa-solid fa-hand-holding-medical', color: '#00FF44',
        passive: { maxHealth: 120 },
        skill: { name: '急救药剂', cooldown: 60000, durationMs: 0, type: 'heal', power: 50 },
        skillItem: 'Red Concrete Slab', supplies: [['Bread', 5], ['Arrow', 32]],
    },
    recon: {
        name: '侦察兵', desc: '情报专家,可短暂透视',
        icon: 'fa-solid fa-eye', color: '#4488FF',
        passive: { canSeeNametagsThroughWalls: false },
        skill: { name: '红外扫描', cooldown: 60000, durationMs: 10000, type: 'reveal', power: 1 },
        skillItem: 'Black Concrete Slab', supplies: [['Bread', 5], ['Arrow', 32]],
    },
    engineer: {
        name: '工程兵', desc: '箱子破解专家,开锁速度x2',
        icon: 'fa-solid fa-wrench', color: '#FFAA00',
        passive: {},
        skill: { name: '震撼弹', cooldown: 40000, durationMs: 3000, type: 'stun', radius: 10, power: 1 },
        skillItem: 'Snowball', supplies: [['Bread', 5], ['Arrow', 32]],
    },
};
/* ===== 保险体系(对齐三角洲行动) =====
 * 分两类保险槽:
 *   1. 大保险槽 (GEAR.largeInsureSlots): 固定 2 格(slot 12,13), 与大保险箱(Blue Wool)打通,
 *      开完大保险箱物品自动进这两格; 大保险槽里的物品: 死亡不丢, 撤离也不进仓库(直接带回大厅)
 *   2. 小保险槽: 接在大保险后面, 玩家花钱买的套餐决定数量(slot 14+); 死亡保留, 撤离进仓库
 * 保险套餐按三角洲风名, 消耗"保险令牌"类道具(任意一张即可标记套餐) */
const INSURANCE = {
    /* 小保险套餐: 越贵格数越多, 死亡保留物品越多 */
    cost: 50,
    packages: {
        'Iron Bar':       { name: '微保险', slots: 1, cost: 50 },      /* 三角洲最低档 */
        'Gold Bar':       { name: '小保险', slots: 2, cost: 150 },     /* 初始免费档 */
        'Diamond':        { name: '中保险', slots: 3, cost: 300 },
        'Block of Diamond': { name: '大保险', slots: 4, cost: 500 },
    },
    starter: { slots: 2, cost: 0, item: 'Gold Bar' },
    /* 大保险箱(Blue Wool)开完物品自动进大保险槽的标志 */
    bigInsureKeyItem: 'Blue Wool',
};
const EXTRACT = {
  time: 10,
  rewardMultiplier: 1.0,
  /* 撤离羊毛颜色映射(小写方块名 → 行为类型) */
  wool: {
    'green wool': 'green',   // 常规撤离
    'lime wool': 'green',    // 浅绿羊毛按常规撤离处理(兼容旧图)
    'red wool': 'red',       // 延时/电梯类撤离
    'black wool': 'black',   // 条件撤离(需拉闸buff)
  },
  /* 撤离读条时长(秒): 绿=5, 红=15, 黑(条件)=5 */
  readSec: { green: 5, red: 15, black: 5 },
  /* 拉闸(条件撤离)默认配置: 地图/撤离点未写 leverRequired 时按 1 次拉闸 */
  leverRequiredDefault: 1,
  /* 拉闸 buff 持续时间(毫秒): 5 分钟 */
  leverBuffMs: 300000,
  /* 限重撤离点默认载重上限(件), 撤离点未写 maxWeight 时使用 */
  maxLoad: 50,
};
/* ===== 战备值 + 违禁品检测系统 =====
 * markerEnch: "认证附魔"——所有系统发放的物品都带这个附魔(等级=战备值)
 *   - 战备值 = 武器槽(1)+护甲槽(47-51)物品得分之和(zhanbei优先,无则sanjiaozhou)
 *   - 违禁品扫描: 每2秒清除"不带 sanjiaozhou 附魔"的物品(服主/副服主白名单豁免)
 * contrabandEnabled: 改 false 可整体关闭违禁品清除
 */
const GEAR = {
    markerEnch: 'sanjiaozhou',
    scoreEnch: 'zhanbei',
    contrabandEnabled: true,
    weaponSlot: 1,
    armorSlots: [47, 48, 49, 50, 51],
    /* 大保险槽固定 2 格(三角洲行动语义: 开 Blue Wool 大保险箱 → 物品自动进这两格) */
    largeInsureSlots: [12, 13],
    /* outfit/套装槽位: slot 52 = 头部套装, slot 53 = 身体套装
     * 穿进这两格的套装有负重/速度加成, 由 updateWeight 读取 */
    outfitSlots: [52, 53],
    /* 三角洲风格 outfit 套装表: item = 放在 outfit 槽的物品名, 穿上去有加成
     * maxLoadBonus = 增加最大载重(kg), speedBonus = 增加移速倍率 */
    outfits: {
        /* 键必须是官方真实物品名(原 Outfit: * 在世界里不存在, 套装加成永远不会触发) */
        'Military Chestplate':   { maxLoadBonus: 20, speedBonus: 0.00, display: '战术背心' },
        'Geo Chestplate':        { maxLoadBonus: 40, speedBonus: -0.05, display: '城市装甲板' },
        'Fur Chestplate':        { maxLoadBonus: 10, speedBonus: 0.05, display: '轻型战术背带' },
        'Magmasteel Chestplate': { maxLoadBonus: 60, speedBonus: -0.08, display: '重型装甲板' },
        'Spectral Chestplate':   { maxLoadBonus:  0, speedBonus: 0.10, display: '流线套装' },
    },
    tierScores: {
        'Iron Sword': 2, 'Gold Sword': 2, 'Knight Sword': 3, 'Diamond Sword': 5, 'Moonstone Dagger': 7,
        'Iron Helmet': 1, 'Iron Chestplate': 3, 'Iron Leggings': 2, 'Iron Boots': 1,
        'Diamond Helmet': 3, 'Diamond Chestplate': 6, 'Diamond Leggings': 4, 'Diamond Boots': 3,
    },
    lootMarkerLevel: {
        'Diamond Sword': 5, 'Diamond Bow': 4, 'Knight Sword': 3,
        'Iron Sword': 2, 'Iron Bow': 2, 'Iron Pickaxe': 1, 'Diamond Pickaxe': 3,
        'Diamond Helmet': 3, 'Diamond Chestplate': 6, 'Diamond Leggings': 4, 'Diamond Boots': 3,
        'Iron Helmet': 1, 'Iron Chestplate': 3, 'Iron Leggings': 2, 'Iron Boots': 1,
    },
};
/* ===== 段位系统(排行榜展示+名字颜色) =====
 * 分数 = 撤离x3 + 击杀x1,段位决定名字颜色与排行榜标签
 */
const RANKS = [
    /* color=hex(用于聊天/播报/排行榜列色); nameColor=官方nameColour设置,只接受命名颜色 */
    { key: 'bronze', name: '青铜', color: '#CD7F32', nameColor: 'orange', minScore: 0 },
    { key: 'silver', name: '白银', color: '#C0C0C0', nameColor: 'default', minScore: 10 },
    { key: 'gold', name: '黄金', color: '#FFD700', nameColor: 'yellow', minScore: 30 },
    { key: 'platinum', name: '铂金', color: '#00D4FF', nameColor: 'aqua', minScore: 60 },
    { key: 'diamond', name: '钻石', color: '#7F8CFF', nameColor: 'blue', minScore: 100 },
    { key: 'delta', name: '战术精英', color: '#FF4444', nameColor: 'red', minScore: 160 },
];
const CONST = {
    maxHP: 100, teamSize: 3, matchStartMin: 1,
    /* 小怪削弱: 开服时对所有图内怪物类型按类型默认值统一设置
     * 想调强度直接改这里的键值(可加任意官方mob设置项,如 initialHealth/hostilityRadius) */
    mobNerf: { attackDamage: 5, maxHealth: 100, initialHealth: 100 },
    /* 撤离方块: 踩到这些方块之一立即撤离(大小写不敏感)。放别的方块当撤离点就往里加名字 */
    extractBlocks: ['Green Wool', 'Lime Wool'],
    /* 白名单(服主+副服主): 免违禁品/免战备门槛/免菜单封锁/免PVP限制 */
    whitelist: [
        'zhongmo_xinhao48',        // 服主
        'Admin', 'Owner',          // TODO: 通用名可被抢注提权, 建议改按 getPlayerDbId 校验或删除(需服主确认)
        'anann12356', 'anann12375', 'China_pvp_92_xinhao', 'mjuu_826', 'ChilyDive179432', 'David2558', 'IM_BACK_GBR'  // 副服主(2026-10-02)
    ],
    lockedSlots: {
        weapon: 1, skill1: 2, skill2: 3, skill3: 4,
    },
    // 箱子开启后全局冷却(毫秒),期间任何玩家无法再开同一箱子
    chestRespawnMs: 40000,
    // 击杀奖励金(0=关闭)
    killReward: 50,
    titles: {
        rookie: { name: '新兵', color: '#999999', req: { extracts: 0 } },
        veteran: { name: '老兵', color: '#4DA6FF', req: { extracts: 5 } },
        elite: { name: '精英', color: '#00FF00', req: { extracts: 20 } },
        master: { name: '大师', color: '#FFD700', req: { extracts: 50 } },
        legend: { name: '传奇', color: '#FF00FF', req: { extracts: 100 } },
    },
    quests: {
        extract1: { name: '首次撤离', target: 1, reward: 100, type: 'extract' },
        extract5: { name: '撤离5次', target: 5, reward: 500, type: 'extract' },
        extract10: { name: '撤离10次', target: 10, reward: 1500, type: 'extract' },
        kill10: { name: '击杀10人', target: 10, reward: 300, type: 'kill' },
        kill30: { name: '击杀30人', target: 30, reward: 800, type: 'kill' },
        loot500: { name: '搜刮500金', target: 500, reward: 200, type: 'loot' },
    },
    weight: {
        /* [2026-11-13 扩充真实重量表]
         * 重量单位 kg, 以"单件物品的重量"为粒度:
         * - 轻物品(食品/电子小元件/文件): 0.3-0.8kg
         * - 普通物品(弹药/药水/普通材料): 1kg (perItemWeight)
         * - 中等重物(矿物/金属锭/电子设备): 3-5kg
         * - 重型物品(压缩块/大体积材料): 8-15kg
         * 超重阈值 = maxLoad * slowThreshold → 触发移速衰减
         * 三角洲参考: 真实物品重量表已查, 以下数据贴近游戏表现 */
        maxLoad: 250,                    // 最大载重(kg), 超出被丢弃/禁止进图
        perItemWeight: 1,                // 默认单件物品 1kg
        /* 单件 0.3-0.8kg 的轻物品(食品/文件/电子小元件) */
        lightItems: {
            'Bread': 0.2, 'Apple': 0.2, 'Rice': 0.2,
            'Cooked Porkchop': 0.3, 'Cooked Mutton': 0.3, 'Fish N Chips': 0.4,
            'Snowball': 0.3,
            /* 生活用品/小件变卖物(0.5-1kg) */
            'Brown Planks': 0.5, 'Brown Carpet': 0.5, 'White Glass': 1, 'Green Glass': 1,
            'Yellow Planks': 0.5, 'Lime Planks': 0.5, 'Cyan Planks': 0.5, 'Pink Planks': 0.5,
            'Purple Planks': 0.5, 'Magenta Planks': 0.5, 'Black Carpet': 0.5, 'White Carpet': 0.5,
            'Red Planks': 0.5, 'Light Gray Planks': 0.5, 'Green Planks': 0.5, 'Black Planks': 0.5,
            'Gray Carpet': 0.5, 'White Planks': 0.5, 'Orange Carpet': 0.5, 'Iron Fragment': 0.1,
        },
        /* 单件 3-5kg 的中等重物 */
        midItems: {
            'Gold Fragment': 5, 'Carbon Rod': 3, 'Obsidian': 4,
            'Gold Ore': 5, 'Iron Ore': 4, 'Coal Ore': 2, 'Pure Coal Ore': 3, 'Lapis Lazuli Ore': 3, 'Diamond Ore': 5, 'Emerald Ore': 5,
            'Arrow': 0.05,
            'Raw Gold': 4, 'Raw Iron': 3, 'Beacon': 10, 'Lunite': 6, 'Aura XP Orb': 2, 'Aura XP Fragment': 0.5,
            /* 方块变卖物(电子产品/医疗/材料, 2-5kg) */
            'Blue Concrete': 4, 'White Concrete': 4, 'Black Concrete': 4,
            'White Baked Clay': 3, 'Magenta Baked Clay': 3, 'Gray Baked Clay': 3, 'Brown Baked Clay': 3,
            'Red Baked Clay': 2, 'Yellow Baked Clay': 2,
            'Purple Concrete': 3, 'Magenta Concrete': 3, 'Lime Concrete': 3, 'Pink Concrete': 3,
            'Light Gray Concrete': 3, 'Gray Concrete': 3, 'Green Concrete': 3, 'Brown Concrete': 3,
            'Cyan Concrete': 3, 'Light Blue Concrete': 3, 'Orange Concrete': 3, 'Yellow Concrete': 3,
            'Copper Bar': 3, 'Gold Bar': 2,
        },
        /* 单件 8-15kg 的重型物品(压缩块/大体积) */
        heavyItems: {
            'Block of Iron': 12, 'Block of Gold': 15, 'Block of Diamond': 15, 'Block of Coal': 8,
            'Block of Lapis Lazuli': 10, 'Block of Moonstone': 10,
            'Block of Emerald': 12, 'Block of Quartz': 10, 'Golden Decoration': 8,
            'Crystal Block': 6, 'Ice Bricks': 8, },
        heavyWeight: 5,                  /* 未被 light/mid/heavy 覆盖的"笼统重物"(遗留兼容) */
        slowThreshold: 0.6,              /* 载重 >= maxLoad * slowThreshold 开始减速 */
        minSpeedMult: 0.5,               /* 最低移速倍率(不低于 0.5x) */
    },
    dbKeys: {
        operator: 'op', team: 'team', teamLead: 'lead', money: 'money', stats: 'stats',
        title: 'title', quests: 'quests', weight: 'wt', mapKey: 'map', rankSeen: 'rankSeen',
        warehouse: 'wh',   /* 撤离仓库: 撤离成功非保险格物品存这里, 下次进服再拉回 */
    },
};
const THEME = {
    primary: '#FF4444', secondary: '#FFAA00', success: '#00FF00', danger: '#FF0000',
    info: '#4DA6FF', gold: '#FFD700', gray: '#666666', dark: '#1a1a2e',
};
/* 玩家自身状态配置(展示用) */
const STATUS = {
    armorSlots: { helmet: 47, chestplate: 48, leggings: 49, boots: 50, offhand: 51 },
    knifeSkins: [
        { key: 'default', name: '战术小刀', item: 'Iron Sword', cost: 0 },
        { key: 'gold', name: '黄金后裔', item: 'Gold Sword', cost: 50000 },
        { key: 'diamond', name: '荣耀之刃', item: 'Diamond Sword', cost: 2000000 },
        { key: 'moon', name: '北极星匕首', item: 'Moonstone Dagger', cost: 500000 },
    ],
};
/* ===== [融合] 小怪(游荡敌人)配置 =====
 * 头顶称号 + 手持烂枪并作为攻击武器 + 按强度(MobStrong)配色 + 强度适中(两三枪死) + 死亡掉落烂枪/变卖物
 * stats 为基准值, 会被地图 MobStrong 倍乘(血量/攻击); 配色档见 strongTiers */
const SMALL_MOB = {
    /* 头顶称号池(每次生成随机抽一个) */
    titles: ['游荡者', '拾荒者', '雇佣兵', '逃兵', '走私贩', '哨兵', '巡逻兵', '散兵', '猎手', '斥候', '佣兵', '叛徒', '流寇', '摸金校尉', '老兵', '新兵'],
    /* 特别烂的枪(手持 + 概率掉落) */
    badGuns: ['Block-19', 'Double Barrel', 'MP40', 'Mini Izu', 'FMR'],
    /* 基准强度(×地图 MobStrong): 最普通图(MobStrong=1)玩家两三枪能打死 */
    stats: { maxHealth: 60, initialHealth: 60, attackDamage: 8, attackRadius: 9 },
    /* 死亡掉落: 变卖物/食品/材料(与箱子一致, 禁止武器/装备) + 偶尔一把烂枪 */
    drops: [
        { itemName: 'Bread',             probabilityOfDrop: 0.60, dropMinAmount: 1, dropMaxAmount: 2 },
        { itemName: 'Apple',             probabilityOfDrop: 0.55, dropMinAmount: 1, dropMaxAmount: 2 },
        { itemName: 'Rice',              probabilityOfDrop: 0.50, dropMinAmount: 1, dropMaxAmount: 2 },
        { itemName: 'Arrow',             probabilityOfDrop: 0.70, dropMinAmount: 3, dropMaxAmount: 8 },
        { itemName: 'Coal Ore',          probabilityOfDrop: 0.30, dropMinAmount: 1, dropMaxAmount: 2 },
        { itemName: 'Gold Fragment',     probabilityOfDrop: 0.08, dropMinAmount: 1, dropMaxAmount: 1 },
    ],
    gunDropChance: 0.38,   // 死亡时额外掉落一把烂枪的概率
    /* 按强度(MobStrong)分档配色: 命中第一个 min<=MobStrong 的档; color=称号色, ench=手持枪发光档 */
    strongTiers: [
        { min: 3.6, color: '#FF5B5B', ench: 'Tier 5' },   // 首领级 红
        { min: 2.7, color: '#C77DFF', ench: 'Tier 4' },   // 危险   紫
        { min: 1.9, color: '#6FB7FF', ench: 'Tier 3' },   // 精锐   蓝
        { min: 1.3, color: '#7CFC7C', ench: 'Tier 2' },   // 强化   绿
        { min: 0,   color: '#D8D8D8', ench: 'Tier 1' },   // 普通   白/灰(最普通图基准)
    ],
};
module.exports = { VERSION, MAPS, MAPS_REAL_ANCHOR, OPERATORS, CHEST_STYLES, CHECKIN, INSURANCE, EXTRACT, CONST, THEME, STATUS, GEAR, RANKS, RARITY, SELL_CATALOG, SELL_TIER_CAP, AMMO_SLOT, GUN_AMMO, SMALL_MOB, CHAT_TITLES };
