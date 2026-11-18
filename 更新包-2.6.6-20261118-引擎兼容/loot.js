// ============================================
// loot.js - 战利品/箱子/保险/战备值/违禁品 (CommonJS)
// ============================================

const config = require("./config.js");
const MAPS = config.MAPS;
const CHEST_STYLES = config.CHEST_STYLES;
const INSURANCE = config.INSURANCE;
const GEAR = config.GEAR;
const CONST = config.CONST;
const SELL_CATALOG = config.SELL_CATALOG;
const SELL_TIER_CAP = config.SELL_TIER_CAP;
const maps = require("./maps.js");
const spawnGuard = maps.spawnGuard;
/* 玩家地图key由game.js统一解析(单一状态源),本模块不持有玩家地图状态 */
const getCurrentMapKey = (pId) => {
  try { return typeof globalThis.__getPlayerMapKey === 'function' ? globalThis.__getPlayerMapKey(pId) : null; } catch(e) { return null; }
};
const db = require("./db.js");

/* ===== 认证附魔(物品合法性标记) =====
 * 所有合法发放的物品都带 GEAR.markerEnch 附魔(等级即战备值)
 * 无该附魔的物品 = 违禁品,由 game.js 周期调用 scanContraband 清除
 */

/* 常见附魔名(模块级常量,避免每次解析重建数组) */
const KNOWN_ENCH_NAMES = [GEAR.markerEnch.toLowerCase(), 'sharpness', 'protection', 'unbreaking', 'efficiency', 'power', 'punch', 'fireaspect', 'looting', 'fortune', 'smite', 'baneofarthropods', 'knockback', 'featherfalling', 'thorns', 'depthstrider', 'mending'];

/* 宽松解析物品附魔数据,兼容多种返回结构
 * 官方getItemSlot返回 {name, amount, attributes: ItemAttributes},附魔可能在attributes本身或其嵌套字段
 * 返回 {原始键名: 等级} 或 null(无法识别) —— 键名保持游戏返回的原样大小写 */
const parseEnchants = (item) => {
  if (!item) return null;
  let raw = item.enchantments ?? item.enchants ?? item.enchantment ?? item.enchantmentData;
  if (!raw && item.attributes && typeof item.attributes === 'object') {
    const a = item.attributes;
    raw = a.enchantments ?? a.enchants ?? a.enchantment ?? null;
    /* attributes本身可能就是附魔表(键名含认证附魔或常见附魔名) */
    if (!raw) {
      const enchNames = KNOWN_ENCH_NAMES;   // 已含 GEAR.markerEnch,不再重复硬编码
      const keys = Object.keys(a);
      if (keys.length > 0 && keys.every(k => enchNames.some(e => k.toLowerCase().includes(e) || e.includes(k.toLowerCase())))) {
        raw = a;
      }
    }
  }
  if (!raw) return null;
  const out = {};
  if (Array.isArray(raw)) {
    for (const e of raw) {
      if (e && typeof e === 'object') {
        const name = e.name || e.enchantment || e.type;
        const lvl = e.level ?? e.lvl ?? e.amplifier ?? 1;
        if (name) out[String(name)] = Number(lvl) || 1;
      } else if (Array.isArray(e) && e.length >= 2) {
        out[String(e[0])] = Number(e[1]) || 1;
      }
    }
  } else if (typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw)) {
      out[String(k)] = Number(v) || 1;
    }
  }
  return Object.keys(out).length > 0 ? out : null;
};

/* 大小写不敏感读取附魔等级 */
const getEnchLevel = (ench, name) => {
  if (!ench) return 0;
  const target = String(name).toLowerCase();
  for (const [k, v] of Object.entries(ench)) {
    if (String(k).toLowerCase() === target) return Number(v) || 1;
  }
  return 0;
};

/* 深度查找附魔等级(受控深搜,深度<=4,防循环):
 * 兼容 扁平{name:lvl} / {enchantments:{...}} / [{name,level}] / [[name,lvl]] 及多层嵌套。
 * 盔甲物品常带额外属性字段(耐久/染色等)且嵌套各异,浅层解析会漏读 sanjiaozhou,故用深搜。 */
const deepEnchLevel = (item, name) => {
  if (!item) return 0;
  const target = String(name).toLowerCase();
  const seen = new Set();
  const lvOf = (v) => {
    if (v && typeof v === 'object') v = v.level ?? v.lvl ?? v.amplifier ?? v.value ?? 1;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  const named = (o) => {
    const nm = o.name || o.enchantment || o.enchantmentName || o.type || o.id || o.key;
    if (nm && String(nm).toLowerCase() === target) return lvOf(o.level ?? o.lvl ?? o.amplifier ?? o.value ?? 1);
    return 0;
  };
  const scan = (o, depth) => {
    if (!o || typeof o !== 'object' || depth > 4 || seen.has(o)) return 0;
    seen.add(o);
    if (Array.isArray(o)) {
      for (const e of o) {
        if (Array.isArray(e) && e.length >= 2 && String(e[0]).toLowerCase() === target) return lvOf(e[1]);
        if (e && typeof e === 'object') { const r = named(e) || scan(e, depth + 1); if (r) return r; }
      }
      return 0;
    }
    const nm = named(o);
    if (nm) return nm;
    for (const [k, v] of Object.entries(o)) {
      if (String(k).toLowerCase() === target) return lvOf(v);
      const r = scan(v, depth + 1);
      if (r) return r;
    }
    return 0;
  };
  try { return scan(item, 0); } catch(e) { return 0; }
};

/* 物品上的认证附魔等级(0=没有) —— 深搜,兼容盔甲各种附加属性结构 */
const getMarkerLevel = (item) => {
  if (!item || !item.name) return 0;
  return deepEnchLevel(item, GEAR.markerEnch);
};

/* 是否合法物品: 只要带 sanjiaozhou(认证)附魔即合法;空格不算违禁。
 * 服主/副服主白名单在 game.js 扫描前整体豁免(见 CONST.whitelist) */
const isMarked = (pId, item) => {
  if (!item || !item.name) return true;   // 空格不算违禁
  /* 带 sanjiaozhou(认证) 或 zhanbei(战备) 附魔即合法 —— 战备物品一律不当违禁品清除 */
  return getMarkerLevel(item) > 0 || deepEnchLevel(item, GEAR.scoreEnch) > 0;
};

/* 发放带认证的物品到指定格
 * 认证附魔按键名原样写入(sanjiaozhou为全小写,勿做大小写变换);其他附魔按配置原样写入 */
const giveMarkedItem = (pId, slot, itemName, amount, markLevel, extraEnchs) => {
  const ench = Object.assign({}, extraEnchs || {});
  ench[GEAR.markerEnch] = markLevel || 1;
  try { api.setItemSlot(pId, slot, itemName, amount, ench); } catch(e) {
    try { api.setItemSlot(pId, slot, itemName, amount); } catch(e2) {}
  }
};

/* 自动给一件带认证标记的物品到背包空格(跳过保险格/子弹槽); 背包满兜底 giveItem。成功返回true。
 * 供小怪击杀发奖等"直接入包"场景(带标记以免被违禁品扫描清掉)。 */
const giveMarkedItemAuto = (pId, itemName, amount, markLevel) => {
  const insured = insuredSlotsOf(pId);
  for (let i = 11; i <= 45; i++) {
    if (i === config.AMMO_SLOT) continue;        // 保护子弹槽
    if (insured.includes(i)) continue;            // 保护保险格
    let it = null; try { it = api.getItemSlot(pId, i); } catch(e) {}
    if (!it || !it.name) { giveMarkedItem(pId, i, itemName, amount, markLevel || 1); return true; }
  }
  try {
    const ench = {}; ench[GEAR.markerEnch] = markLevel || 1;
    const added = api.giveItem(pId, itemName, amount, ench);
    return !!(added && added > 0);
  } catch(e) { return false; }
};

/* 违禁品扫描: 清除所有无认证附魔的物品,返回被清除列表 [{slot,name}] */
const scanContraband = (pId) => {
  const cleared = [];
  const insured = insuredSlotsOf(pId);
  try {
    for (let i = 0; i <= 45; i++) {
      if (insured.includes(i)) continue;   // 保险格豁免: 与"保险保留"承诺一致
      let item = null;
      try { item = api.getItemSlot(pId, i); } catch(e) { continue; }
      if (!item || !item.name) continue;
      if (isMarked(pId, item)) continue;
      /* 配件/子弹物品豁免(由 fittings.js 注册的全局钩子判定,传完整物品对象以支持自定义名识别) */
      try { if (globalThis.__isExemptItem && globalThis.__isExemptItem(item)) continue; } catch(e) {}
      try { api.setItemSlot(pId, i, 'Air', 0); } catch(e) {}
      cleared.push({ slot: i, name: item.name });
    }
  } catch(e) {}
  return cleared;
};

/* ===== 战备值 =====
 * 战备值扫描全身装备(武器槽+护甲槽)的附魔:
 *   有 zhanbei 附魔 → 以 zhanbei 等级为准;
 *   没有 zhanbei → 以 sanjiaozhou(认证)附魔等级为准 */

const gearSlots = () => [GEAR.weaponSlot, ...GEAR.armorSlots];

/* 读取单件物品的战备分: zhanbei 优先, 无则回退 sanjiaozhou(均用深搜,兼容盔甲属性结构) */
const itemGearScore = (item) => {
  if (!item || !item.name) return 0;
  const zb = deepEnchLevel(item, GEAR.scoreEnch);
  return zb > 0 ? zb : deepEnchLevel(item, GEAR.markerEnch);
};

/* 暂存仓库物品的简化结构 -> 计分用(同样 zhanbei 优先, 无则 sanjiaozhou) */
const pendingGearScore = (pId) => {
  let total = 0;
  for (const it of db.getInsPending(pId)) {
    if (!it || !it.name) continue;
    const zb = getEnchLevel(it.ench, GEAR.scoreEnch);
    total += zb > 0 ? zb : getEnchLevel(it.ench, GEAR.markerEnch);
  }
  return total;
};

/* 战备值: 扫描全身+背包全部格子,凡带 zhanbei(战备)附魔的都计入 —— 背包里的备用枪/甲也视为战备(战备=带入战场的装备,不拘泥于装备槽) */
const calculateGearScore = (pId) => {
  let total = 0;
  for (let i = 0; i <= 45; i++) {
    try {
      const item = api.getItemSlot(pId, i);
      if (item && item.name) total += itemGearScore(item);
    } catch(e) {}
  }
  total += pendingGearScore(pId);   // 保险暂存装备计入(死亡后仍有战备值,保险不白买)
  return total;
};

/* /gear 调试: 逐件明细(含原始attributes数据,用于排查附魔格式) */
const getGearBreakdown = (pId) => {
  const rows = [];
  for (let i = 0; i <= 45; i++) {
    try {
      const item = api.getItemSlot(pId, i);
      if (item && item.name) {
        rows.push({
          slot: i, name: item.name,
          marker: getMarkerLevel(item),
          zhanbei: itemGearScore(item),   // 战备附魔等级
          tier: GEAR.tierScores[item.name] || 0,
          score: itemGearScore(item),
          raw: parseEnchants(item),
          rawKeys: Object.keys(item),
          attributes: item.attributes,
        });
      }
    } catch(e) {}
  }
  return rows;
};

/* ===== 开箱体系(早期搜打撤版: 战利品写入箱子容器,玩家开箱自己拿) =====
 * 上方块决定箱子样式(CHEST_STYLES),每行物品独立掷骰;冷却期内再开只能看到剩下的东西 */

/* ===== 变卖价值总表(变卖物纯净池: 只认纯装饰方块) =====
 * 硬规则: 变卖物禁止任何功能物品 —— 武器/装备/工具/食物/药水/弹药/钥匙/羊毛(撤离点)/机关方块
 *         (信标/灯/漏斗/代码块/书架/地图/炸药 …) 一律不可变卖。
 * 可卖白名单 = SELL_CATALOG 的载体(config.js 已清洗成纯装饰方块: 混凝土/玻璃/地毯/木板/陶瓦/矿石/宝石块/金属锭);
 * 地图 lootTable 与箱子样式里的东西只有命中白名单才登记价格, 其余只是战利品/装备本身, 不进变卖面板。 */
const SELL_VALUE_MAP = new Map();
/* 变卖目录索引: 官方物品名 -> {item,display,cat,tier,value}(变卖面板分类展示用) */
const SELL_INFO = new Map();
/* 功能物品兜底黑名单: 即使 config 目录被误改回功能方块, 也不会进变卖池(只装饰方块才能卖) */
const FUNCTIONAL_ITEM_PATTERNS = [
  /wool/i,                                              // 羊毛 = 撤离点/箱子样式触发块
  /potion/i,                                            // 药水
  /sword|bow|crossbow|dagger|spear|axe|pickaxe|hoe|spade|helmet|chestplate|leggings|boots|shield/i,   // 武器/装备/工具
  /beacon|code block|hopper|lamp|bookshelf|chunk map|tnt|charcoal|furnace|anvil|lever|button|pressure plate|dispenser|dropper|piston|door/i,   // 机关/交互方块
  /bread|apple|rice|steak|chicken|porkchop|mutton|venison|carrot|watermelon|fish|chips|sugar cane|egg/i,   // 食物
  /bullet|ammo|arrow|snowball|gunpowder/i,               // 弹药/投掷物
];
const isFunctionalItemName = (name) => !!name && FUNCTIONAL_ITEM_PATTERNS.some(re => re.test(name));
/* ===== 目录规范化(容错: 数组 / {键:条目} 对象 / Map / Set 都能吃) =====
 * 线上自改版 config 若把 SELL_CATALOG 写成对象, 直接 for...of 会抛
 * "object is not iterable (cannot read property Symbol(Symbol.iterator))"
 * 把整个世界代码 init 炸掉, 所以这里先统一成数组再消费 */
const normalizeSellCatalog = (raw) => {
  const pick = (v, k) => {
    if (!v) return null;
    if (Array.isArray(v)) {
      return v[0] ? { item: v[0], display: v[1] || v[0], cat: v[2] || '其他', tier: Number(v[3]) || 1, value: Number(v[4]) || 0 } : null;
    }
    if (typeof v !== 'object') { return k ? { item: k, display: k, cat: '其他', tier: 1, value: Number(v) || 0 } : null; }
    const item = v.item || v.name || v.id || v.key || k;
    if (!item) return null;
    return { item, display: v.display || item, cat: v.cat || '其他', tier: Number(v.tier) || 1, value: Number(v.value) || 0 };
  };
  const out = [];
  if (!raw) return out;
  if (Array.isArray(raw)) { for (let i = 0; i < raw.length; i++) { const e = pick(raw[i]); if (e) out.push(e); } return out; }
  if (typeof raw.forEach === 'function') { raw.forEach((v, k) => { const e = pick(v, k); if (e) out.push(e); }); return out; }
  if (typeof raw === 'object') {
    const ks = Object.keys(raw);
    for (let i = 0; i < ks.length; i++) { const e = pick(raw[ks[i]], ks[i]); if (e) out.push(e); }
    return out;
  }
  return out;
};
let SELL_CATALOG_LIST = [];
try { SELL_CATALOG_LIST = normalizeSellCatalog(SELL_CATALOG); } catch (e) { console.log('[搜打撤] 变卖目录解析失败: ' + (e && e.message)); }
/* 以下顶层初始化全部用索引循环, 不依赖 Symbol.iterator(兼容各沙箱引擎) */
for (let i = 0; i < SELL_CATALOG_LIST.length; i++) {
  const c = SELL_CATALOG_LIST[i];
  if (isFunctionalItemName(c.item)) continue;   // 功能物品禁止作为变卖物
  SELL_VALUE_MAP.set(c.item, c.value);
  SELL_INFO.set(c.item, c);
}
console.log('[搜打撤] 变卖目录载入 ' + SELL_INFO.size + ' 条(原始类型: '
  + (Array.isArray(SELL_CATALOG) ? '数组' : (SELL_CATALOG && typeof SELL_CATALOG) || '空') + ')');
/* 白名单判定: 只有变卖目录里的装饰载体才可卖 */
const isSellableName = (name) => SELL_INFO.has(name);
try {
  const mapKeys = Object.keys(MAPS || {});
  for (let i = 0; i < mapKeys.length; i++) {
    const k = mapKeys[i];
    const t = MAPS[k] && MAPS[k].lootTable;
    if (!Array.isArray(t)) continue;
    for (let j = 0; j < t.length; j++) { const it = t[j]; if (isSellableName(it[0])) SELL_VALUE_MAP.set(it[0], it[2]); }
  }
  /* 箱子样式物品价优先(覆盖目录/地图战利品表旧价),仅限白名单内的装饰方块 */
  const styles = CHEST_STYLES || {};
  const styleKeys = Object.keys(styles);
  for (let i = 0; i < styleKeys.length; i++) {
    const items = (styles[styleKeys[i]] || {}).items || [];
    for (let j = 0; j < items.length; j++) { const it = items[j]; if (isSellableName(it.name)) SELL_VALUE_MAP.set(it.name, it.value); }
  }
} catch (e) { console.log('[搜打撤] 变卖价格合并失败: ' + (e && e.message)); }

const getChestStyleAt = (x, y, z) => {
  try {
    const blockAbove = api.getBlock(x, y + 1, z);
    const blockName = blockAbove?.name || blockAbove || 'Air';
    return CHEST_STYLES[blockName] || CHEST_STYLES['Air'];
  } catch(e) { return CHEST_STYLES['Air']; }
};

/* 清空箱子容器(改进: 早期版本不清残留,冷却刷新后旧物品还在,会被白嫖) */
const CHEST_SLOT_MAX = 26;
const clearChestSlots = (x, y, z) => {
  for (let i = 0; i <= CHEST_SLOT_MAX; i++) {
    try { api.setStandardChestItemSlot([x, y, z], i, 'Air', 0, undefined, {}); } catch(e) {}
  }
};

/* ===== 摸金禁止清单: 武器/枪械/装备一律不许从箱子里摸出 =====
 * 理由: 三角洲行动里武器/装备是系统发放/击杀掉落, 不开箱获得;
 *       开箱只给消耗品/材料/情报/食品/变卖物 */
const FORBIDDEN_DROP_NAMES = new Set([
  /* 枪械(GUNS 表里的) */
  'AK-47', 'M16', 'MP40', 'AWP', 'GPMG', 'SKAR', 'Double Barrel',
  /* 近战武器 */
  'Iron Sword', 'Diamond Sword', 'Knight Sword', 'Stone Sword', 'Gold Sword', 'Moonstone Dagger',
  'Iron Dagger', 'Wood Dagger',
  /* 远程 */
  'Wood Bow', 'Diamond Bow', 'Iron Bow', 'Wood Crossbow',
  /* 护甲 */
  'Iron Helmet', 'Iron Chestplate', 'Iron Leggings', 'Iron Boots',
  'Diamond Helmet', 'Diamond Chestplate', 'Diamond Leggings', 'Diamond Boots',
  'Gold Helmet', 'Gold Chestplate', 'Gold Leggings', 'Gold Boots',
  /* 工具(也算装备类) */
  'Iron Pickaxe', 'Diamond Pickaxe', 'Gold Pickaxe', 'Stone Pickaxe',
  'Iron Hoe', 'Gold Hoe', 'Diamond Hoe', 'Stone Hoe',
  'Iron Axe', 'Diamond Axe', 'Gold Axe', 'Stone Axe',
  'Iron Spade', 'Diamond Spade', 'Gold Spade', 'Stone Spade',
  'Iron Spear',
  /* 投掷(手雷类三角洲有, 这里禁) */
  'Snowball', 'Egg',
  /* 顶级材质装备(官方真实名: bloxd 无 Netherite; 顶层 Moonstone 之上为 Amethite/Serpentite/Rubellite/Magmasteel) */
  'Amethite Sword', 'Amethite Pickaxe', 'Amethite Axe', 'Amethite Spade', 'Amethite Hoe',
  'Amethite Helmet', 'Amethite Chestplate', 'Amethite Leggings', 'Amethite Boots',
  'Serpentite Sword', 'Serpentite Pickaxe', 'Serpentite Axe', 'Serpentite Spade', 'Serpentite Hoe',
  'Serpentite Helmet', 'Serpentite Chestplate', 'Serpentite Leggings', 'Serpentite Boots',
  'Rubellite Sword', 'Rubellite Pickaxe', 'Rubellite Axe', 'Rubellite Spade', 'Rubellite Hoe',
  'Rubellite Helmet', 'Rubellite Chestplate', 'Rubellite Leggings', 'Rubellite Boots',
  'Magmasteel Sword', 'Magmasteel Pickaxe', 'Magmasteel Axe', 'Magmasteel Spade', 'Magmasteel Hoe',
  'Magmasteel Helmet', 'Magmasteel Chestplate', 'Magmasteel Leggings', 'Magmasteel Boots',
  /* 弹药保留(Gunpowder/Arrow 等是消耗品, 不禁) */
]);
const isForbiddenDrop = (name) => !!FORBIDDEN_DROP_NAMES.has(name);

/* ===== 摸金统一物品表(每图一个独立分区,该图所有箱子共用) =====
 * 统一来源 = 各地图 MAPS[k].lootTable(已过滤掉武器/装备) + 三角洲变卖目录 SELL_CATALOG(按 SELL_TIER_CAP 取该图稀有度上限);
 * 同图内不分箱子样式,全部从该图分区掷骰;掷出的摸金物品带 sanjiaozhou(认证)附魔;
 * 禁止摸出: FORBIDDEN_DROP_NAMES 里的武器/枪械/装备 */
const MAP_CHEST_LOOT = {};
const __mcKeys = Object.keys(MAPS || {});
for (let mi = 0; mi < __mcKeys.length; mi++) {
  const k = __mcKeys[mi];
  const t = MAPS[k] && MAPS[k].lootTable;
  if (!Array.isArray(t)) continue;
  const pool = [];
  for (let ti = 0; ti < t.length; ti++) {
    const row = t[ti];
    const name = row && row[0];
    if (!name || isForbiddenDrop(name)) continue;
    pool.push({
      name,
      chance: Math.min(0.9, (Number(row[3]) || 1) / 40),
      value: Number(row[2]) || 0,
      tier: (GEAR.lootMarkerLevel && GEAR.lootMarkerLevel[name]) || 1,
      display: name,
    });
  }
  const cap = (SELL_TIER_CAP && SELL_TIER_CAP[k]) || 6;
  for (let ci = 0; ci < SELL_CATALOG_LIST.length; ci++) {
    const c = SELL_CATALOG_LIST[ci];
    if (c.tier > cap) continue;
    if (isForbiddenDrop(c.item)) continue;
    pool.push({ name: c.item, chance: Math.min(0.5, 0.5 / c.tier), value: c.value, tier: c.tier, display: c.display });
  }
  MAP_CHEST_LOOT[k] = pool;
}
/* 取当前玩家所在图的摸金分区(无该图分区时返回null,回退箱子样式自带items) */
const chestLootForMap = (pId) => {
  const mk = getCurrentMapKey(pId);
  return (mk && MAP_CHEST_LOOT[mk]) || null;
};

/* 把一份摸金列表按概率掷骰写入指定坐标箱子,返回装填格数 */
const writeChestLoot = (list, x, y, z) => {
  clearChestSlots(x, y, z);
  let slot = 0;
  const placed = [];
  for (const it of (list || [])) {
    if (Math.random() >= it.chance) continue;
    if (slot > CHEST_SLOT_MAX) break;
    const tier = it.tier || 1;
    try {
      api.setStandardChestItemSlot([x, y, z], slot, it.name, 1, undefined, {
        customDisplayName: it.display,
        customAttributes: { [GEAR.markerEnch]: tier, enchantmentTier: `Tier ${tier}` },
      });
      slot++;
      placed.push({ name: it.name, tier, display: it.display });
    } catch(e) {}
  }
  return { count: slot, placed };
};

/* 优先用箱子样式自带主题货池(八种箱子各有独立枪械/战利品);无则回退该图统一分区 */
const fillChestLoot = (pId, x, y, z, style) => {
  const list = (style && style.items && style.items.length) ? style.items : (chestLootForMap(pId) || []);
  return writeChestLoot(list, x, y, z);
};

/* ===== 外部调用口: Mojin(类型, x, y, z) =====
 * 第一个参数"类型" = 地图key(用该图统一摸金分区) 或 箱子样式key(用样式自带物品);
 * 后三个参数 = 箱子坐标。按概率掷骰装填,物品带sanjiaozhou附魔。返回装填格数,类型未知返回-1。*/
const mojinFill = (type, x, y, z) => {
  const key = String(type == null ? '' : type);
  const list = MAP_CHEST_LOOT[key] || (CHEST_STYLES[key] && CHEST_STYLES[key].items);
  if (!Array.isArray(list)) return -1;
  const r = writeChestLoot(list, x, y, z);
  return r.count;
};

/* ===== 箱子冷却: 开启后 CONST.chestRespawnMs 内无法再开(全局共享) ===== */
const chestCooldowns = new Map();   // "x,y,z" -> 开启完成时间戳
const chestKey = (x, y, z) => `${x},${y},${z}`;
/* 周期修剪: 已过期的坐标从Map移除,防止长局内存无限增长 */
const pruneExpiredChests = () => {
  const now = Date.now();
  const toDelete = [];
  chestCooldowns.forEach((t, key) => {
    if (now - t >= CONST.chestRespawnMs) toDelete.push(key);
  });
  toDelete.forEach((k) => chestCooldowns.delete(k));
};
const chestCooldownLeft = (x, y, z) => {
  const t = chestCooldowns.get(chestKey(x, y, z));
  if (!t) return 0;
  const left = CONST.chestRespawnMs - (Date.now() - t);
  return left > 0 ? left : 0;
};
const stampChestCooldown = (x, y, z) => { chestCooldowns.set(chestKey(x, y, z), Date.now()); };

/* 开箱主流程(转录早期版逻辑+系统整合):
 * 冷却内再开 = 旁观(不刷新,能看到别人剩下的);冷却结束的首次开启 = 掷骰装填+盖冷却章
 * 大保险箱(原"房卡箱",数据库key仍为Blue Wool)需要背包里有 keyItem,开箱消耗一把;月石箱不碰(走保险逻辑) */
const openChestFlow = (pId, x, y, z, isMoonstone, isIron) => {
  if (isMoonstone) return;   // 月石箱走保险检测,不装填
  /* 正在搜索(QTE)时禁止再开任何箱子: 防止重开菜单/连点绕过QTE或叠加刷物品 */
  if (activeChestQTE.has(pId)) {
    try { api.sendFlyingMiddleMessage(pId, [{str:'⏳ 正在搜索中,先完成当前箱子再开下一个', style:{color:'#FF8800',fontWeight:'bold'}}], 5, 1500); } catch(e) {}
    return 'preventOpen';
  }
  const style = getChestStyleAt(x, y, z);
  const cdLeft = chestCooldownLeft(x, y, z);
  if (cdLeft > 0) {
    try { api.sendFlyingMiddleMessage(pId, [{str:`📦 箱子冷却中(${Math.ceil(cdLeft/1000)}秒),可能有人先你一步了`, style:{color:'#FF8800',fontWeight:'bold'}}], 5, 1500); } catch(e) {}
    return;   // 允许打开看剩余,但不刷新(官方返回值只有 void | "preventOpen")
  }
  /* 房卡校验 */
  if (style.keyItem) {
    let hasCard = false;
    try { hasCard = !!api.hasItem(pId, style.keyItem); } catch(e) { hasCard = false; }
    if (!hasCard) {
      try { api.sendFlyingMiddleMessage(pId, [{str:`❌ 你没有${style.keyName}!`, style:{color:'#FF0000',fontWeight:'bold',fontSize:'1.3rem'}}], 5, 1800); } catch(e) {}
      return 'preventOpen';
    }
    try { api.removeItemName(pId, style.keyItem, 1); } catch(e) {}
  }
  stampChestCooldown(x, y, z);
  const res = fillChestLoot(pId, x, y, z, style);
  const count = res.count;
  const maxTier = res.placed.length ? Math.max(...res.placed.map(i => i.tier || 1)) : 1;
  try { api.sendFlyingMiddleMessage(pId, [
    {str:`📦 ${style.openMsg}`, style:{color:'#FFD700',fontWeight:'bold',fontSize:'1.3rem'}},
    {str: count > 0 ? ` (${style.name})` : ' (空的...)', style:{color:'#FF8800'}},
  ], 5, 1500); } catch(e) {}
  if (style.spawnGuard) {
    spawnGuard(x, y, z, style.guardMob || 'Draugr Knight');
    try { api.sendFlyingMiddleMessage(pId, [{str:'⚠ 触发守护者!', style:{color:'#FF0000',fontWeight:'bold',fontSize:'1.8rem'}}], 5, 1500); } catch(e) {}
  }
  startChestQTE(pId, style, maxTier);   // 触发开箱QTE(成功额外掉落高级战利品)
  return;   // 允许引擎开箱,玩家从箱子里自己拿(官方返回值只有 void | "preventOpen")
};

/* ===== 开箱 QTE(官方 bloxd QTE) =====
 * 用官方 api.addQTE 发起,结果经 onPlayerFinishQTE(playerId,qteId,result) 回收(result 为真=成功)。
 * 成功额外掉落一件高级战利品(该箱 tier>=5 的枪械/贵重物)到背包;失败/超时无额外奖励。
 * 箱子本身的正常战利品已在上方立即装填,不受QTE影响,避免空箱等待。
 * 搜索时长按稀有度: 刷出物品越稀有(maxTier 越高),QTE 越久(越稀有的物品搜索时间越长)。
 *   - 普通箱: timedClick, timeWindow 随 maxTier 增大(更久)
 *   - 大保险(BOSS箱, style.bigInsurance): rhythmClick 点圈圈, requiredSuccesses 随 maxTier 增多(更久) */
const grantBonusItem = (pId, item) => {
  const insured = insuredSlotsOf(pId);   // 复用保险格列表, 避免覆盖保险物品
  for (let i = 11; i <= 45; i++) {
    if (i === config.AMMO_SLOT) continue;   // 保护子弹槽(11)
    if (insured.includes(i)) continue;        // 保护保险格(与"保险保留"承诺一致)
    let it = null; try { it = api.getItemSlot(pId, i); } catch(e) {}
    if (!it || !it.name) {
      const tier = item.tier || 1;
      try { api.setItemSlot(pId, i, item.name, 1, {
        customDisplayName: item.display,
        customAttributes: { [GEAR.markerEnch]: tier, enchantmentTier: `Tier ${tier}` },
      }, true); } catch(e) {}
      return true;
    }
  }
  return false;
};
const activeChestQTE = new Map();   // pId -> { qteId, style, maxTier }
const SEARCH_MS_BY_TIER = { 1: 2000, 2: 2500, 3: 3000, 4: 4000, 5: 5000, 6: 6000 };
const RHYTHM_REQ_BY_TIER = { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 9 };
const RHYTHM_SHRINK_BY_TIER = { 1: 1100, 2: 1000, 3: 900, 4: 800, 5: 700, 6: 600 };
const startChestQTE = (pId, style, maxTier) => {
  if (activeChestQTE.has(pId)) return;   // 已有进行中的开箱QTE,避免叠加
  const tier = Math.max(1, Math.min(6, maxTier || 1));
  /* 优先用 style.qteType / style.qteTune (config.js 每种箱子可独立配 QTE)
   * 没有就回退到按 tier 的旧逻辑(兼容老 CHEST_STYLES) */
  let qteType = (style && style.qteType) || (style && style.bigInsurance ? 'rhythmClick' : 'timedClick');
  let tune = (style && style.qteTune) || {};
  let qteId;
  try {
    if (qteType === 'rhythmClick') {
      /* rhythmTier 1-6 对应不同收缩速度和次数:
       * tune.rhythmTier 直接覆盖 tier; tune.requiredSuccesses/shrinkDurationMs 更细粒度 */
      const rt = tune.rhythmTier || (style && style.bigInsurance ? 6 : tier);
      const req = tune.requiredSuccesses || RHYTHM_REQ_BY_TIER[rt] || RHYTHM_REQ_BY_TIER[tier];
      const shrink = tune.shrinkDurationMs || Math.max(500, RHYTHM_SHRINK_BY_TIER[rt] || (1400 - rt * 90));
      qteId = api.addQTE(pId, {
        type: 'rhythmClick',
        parameters: {
          requiredSuccesses: req,
          shrinkDurationMs: shrink,
          toleranceFraction: tune.toleranceFraction || 0.18,
          maxMisses: tune.maxMisses || 99,
          label: [{
            str: (style && style.bigInsurance ? '🔒 ' : '') + `点开箱QTE(节奏${rt}★,点圈×${req})`,
            style: { color: style && style.bigInsurance ? '#FFD700' : '#B0F0FF', fontWeight: 'bold' },
          }],
        },
      });
    } else {
      /* timedClick: tune.timeWindowMs 直接覆盖 tier; tune.tier 也能改
       * 体感差异: 1500ms(极紧张) vs 3000ms(充裕) */
      const tw = tune.timeWindowMs || SEARCH_MS_BY_TIER[tier];
      qteId = api.addQTE(pId, {
        type: 'timedClick',
        parameters: {
          timeWindow: tw,
          showTimer: true,
          label: [{
            str: `🔍 ${(style && style.name) || '搜索中'}…(限时${Math.round(tw / 100) / 10}秒)`,
            style: { color: '#FFFFFF', fontWeight: 'bold' },
          }],
        },
      });
    }
  } catch(e) { return; }
  if (!qteId) return;
  activeChestQTE.set(pId, { qteId, style, maxTier: tier });
  try {
    api.sendFlyingMiddleMessage(pId, [
      { str: (qteType === 'rhythmClick' ? '🎯 节奏点击!' : '⚡ 限时搜索!'), style: { color: '#FFD700', fontWeight: 'bold', fontSize: '1.4rem' } },
    ], 3, 1600);
  } catch(e) {}
};
const cancelChestQTE = (pId) => {
  const a = activeChestQTE.get(pId);
  if (!a) return;
  try { api.deleteQTE(pId, a.qteId); } catch(e) {}
  activeChestQTE.delete(pId);
};
const resolveChestQTE = (pId, success, qteId) => {
  const a = activeChestQTE.get(pId);
  if (!a) return false;
  /* 校验 qteId: 过期的QTE结果(取消后/新一轮)不得结算,防止旧回调刷奖励 */
  if (qteId != null && String(qteId) !== String(a.qteId)) return false;
  activeChestQTE.delete(pId);
  if (success) {
    const pool = (a.style.items || []).filter(it => (it.tier || 1) >= 5);
    let chosen = null;
    if (pool.length) {
      const total = pool.reduce((s, it) => s + (it.chance || 0.2), 0);
      let r = Math.random() * total;
      for (const it of pool) { r -= (it.chance || 0.2); if (r <= 0) { chosen = it; break; } }
      if (!chosen) chosen = pool[pool.length - 1];
    }
    if (chosen) {
      const ok = grantBonusItem(pId, chosen);
      try { api.sendFlyingMiddleMessage(pId, [{str: ok ? `🎯 QTE 成功! 额外获得 ${chosen.display}` : '🎯 QTE 成功! 但背包已满', style:{color:'#00FF00',fontWeight:'bold',fontSize:'1.4rem'}}], 5, 1800); } catch(e) {}
    } else {
      try { api.sendFlyingMiddleMessage(pId, [{str:'🎯 QTE 成功!', style:{color:'#00FF00',fontWeight:'bold',fontSize:'1.4rem'}}], 5, 1800); } catch(e) {}
    }
  } else {
    try { api.sendFlyingMiddleMessage(pId, [{str:'💢 QTE 失败或超时,无额外奖励(箱子本体战利品已保留)', style:{color:'#FF8800',fontWeight:'bold',fontSize:'1.4rem'}}], 5, 1800); } catch(e) {}
  }
  return true;
};

/* ===== 保险(位置固定不可选: 背包左上角前N格,N=保险套餐格数) =====
 * 保险格: 12, 13, ... 11+N (背包左上角起, 紧接弹药槽AMMO_SLOT之后);玩家不能选择/更换位置;物品原样保留在格子里 */

/* 当前玩家的保险格列表(固定: 背包左上角前N格) */
/* ===== 保险槽位拆分(对齐三角洲行动) =====
 * 大保险槽 = GEAR.largeInsureSlots(固定 2 格 slot 12,13): 开大保险箱(Blue Wool)开出的物品自动进这两格,
 *   死亡不丢, 撤离不进仓库(直接带回大厅)
 * 小保险槽 = 接在大保险后面(玩家买的套餐数量决定): slot 14+, 死亡保留但撤离进仓库
 * insuredSlotsOf = 大保险 + 小保险的并集(死亡/清包逻辑共用) */
const largeInsureSlotsOf = () => GEAR.largeInsureSlots || [12, 13];
const smallInsureSlotsOf = (pId) => {
  let n = 2;   // 默认初始 2 格(Gold Bar)
  try { n = db.getInsuredPackage(pId).slots || 2; } catch(e) {}
  n = Math.max(0, Math.min(n, 27));
  const start = Math.max(...(GEAR.largeInsureSlots || [12, 13])) + 1;
  const out = [];
  for (let i = 0; i < n; i++) out.push(start + i);
  return out;
};
const insuredSlotsOf = (pId) => {
  const combined = [];
  combined.push(...largeInsureSlotsOf());
  combined.push(...smallInsureSlotsOf(pId));
  /* 去重: 不用 [...new Set(arr)] — Bloxd 引擎 Set 不可迭代 */
  const seen = {};
  const out = [];
  for (let i = 0; i < combined.length; i++) {
    const v = combined[i];
    if (!seen[v]) { seen[v] = 1; out.push(v); }
  }
  return out;
};

/* ===== 撤离仓库(三角洲行动语义: 撤离成功非保险格物品进仓库) =====
 * 仓库是一个简单 JSON 数组存 db(CONST.dbKeys.warehouse), 每件物品 { name, amount, attributes };
 * initPlayer 时拉回玩家背包(塞到空槽位), 仓库保留, 清空仓库后物品才真正消失 */
const WAREHOUSE_MAX_SLOTS = 50;   /* 仓库最多存 50 件物品, 满了塞不进就丢 */
const saveLootToWarehouse = (pId) => {
  /* 把玩家当前背包里所有"非保险格"物品存进仓库 db
   * - 大保险格(largeInsureSlots): 直接带走, 不进仓库
   * - 小保险格: 直接带走, 不进仓库(和大保险一样带)
   * - 普通格: 进仓库
   * 玩家仓库里已有物品不动(只 append 新撤离的物品) */
  const insured = insuredSlotsOf(pId);
  const inv = [];
  /* 只收 11-45: 0-10 是武器/技能/子弹格, 撤离成功后保留在背包, 不入库(否则与清包范围不一致会双份) */
  for (let i = 11; i <= 45; i++) {
    if (insured.includes(i)) continue;
    let it = null;
    try { it = api.getItemSlot(pId, i); } catch(e) {}
    if (!it || !it.name) continue;
    inv.push({ name: it.name, amount: it.amount || 1, attributes: it.attributes || null });
  }
  if (inv.length === 0) return 0;
  let cur = [];
  try {
    const raw = api.getPlayerDbValue(pId, CONST.dbKeys.warehouse);
    cur = raw ? JSON.parse(raw) : [];
  } catch(e) { cur = []; }
  cur = cur.concat(inv).slice(-WAREHOUSE_MAX_SLOTS);   /* 只保留最新 50 件 */
  try { api.setPlayerDbValue(pId, CONST.dbKeys.warehouse, JSON.stringify(cur)); } catch(e) {}
  return inv.length;
};

const loadLootFromWarehouse = (pId) => {
  /* 进服/进图前把仓库里的物品拉回玩家背包(塞到空槽位), 清空仓库 db
   * - 只塞空槽, 背包满了塞不下的留在仓库里, 下次再拉
   * - 返回塞进去的件数 */
  let cur = [];
  try {
    const raw = api.getPlayerDbValue(pId, CONST.dbKeys.warehouse);
    cur = raw ? JSON.parse(raw) : [];
  } catch(e) { cur = []; }
  if (!cur.length) return 0;
  let loaded = 0;
  for (const w of cur) {
    let slot = -1;
    for (let i = 11; i <= 45; i++) {
      try {
        const it = api.getItemSlot(pId, i);
        if (!it || !it.name) { slot = i; break; }
      } catch(e) {}
    }
    if (slot < 0) break;   /* 背包满了, 留仓库里下次 */
    try { api.setItemSlot(pId, slot, w.name, w.amount || 1, w.attributes || null, true); loaded++; } catch(e) {}
  }
  /* 把塞进去的从仓库里去掉, 没塞进去的保留 */
  const remaining = cur.slice(loaded);
  try { api.setPlayerDbValue(pId, CONST.dbKeys.warehouse, remaining.length ? JSON.stringify(remaining) : null); } catch(e) {}
  return loaded;
};

/* 初始化玩家免费保险 */
const initStarterInsurance = (pId) => {
  try {
    const cur = db.getInsuredPackage(pId);
    if (cur && cur.slots) return;
    db.setInsuredPackage(pId, { item: INSURANCE.starter.item, slots: INSURANCE.starter.slots, name: '初始保险' });
  } catch(e) {}
};

/* 清背包但保险格保留(丢包撤离用;装备槽不在背包范围,天然不受影响) */
const clearBagKeepInsured = (pId) => {
  const insured = insuredSlotsOf(pId);
  let cleared = 0;
  for (let i = 11; i <= 45; i++) {
    if (insured.includes(i)) continue;
    try {
      const it = api.getItemSlot(pId, i);
      if (it && it.name) { api.setItemSlot(pId, i, 'Air', 0); cleared++; }
    } catch(e) {}
  }
  return cleared;
};

/* 清背包 + 快捷栏(0-10格)但保险格保留(死亡/超时/退出用)
 * 说明: 0-10 含武器格/技能格/子弹格, 死亡后确实是空手, 由 onRespawn 补刀、ensureSkillItems 补技能;
 *       12、13 等保险格跳过, 身上护甲/副手(47-51)不在本范围, 保留 */
const clearAllKeepInsured = (pId) => {
  const insured = insuredSlotsOf(pId);
  let cleared = 0;
  for (let i = 0; i <= 45; i++) {
    if (insured.includes(i)) continue;
    try {
      const it = api.getItemSlot(pId, i);
      if (it && it.name) { api.setItemSlot(pId, i, 'Air', 0); cleared++; }
    } catch(e) {}
  }
  return cleared;
};

/* ===== 变卖 ===== */

/* ===== 变卖/估值(公共迭代器,四处去重) =====
 * 遍历背包11-45格中"SELL_VALUE_MAP里有价"的非保险物品,cb用于卖出时移除 */
const eachSellable = (pId, cb) => {
  const insured = insuredSlotsOf(pId);
  let total = 0;
  for (let i = 11; i <= 45; i++) {
    if (insured.includes(i)) continue;
    try {
      const item = api.getItemSlot(pId, i);
      if (!item || !item.name) continue;
      const value = SELL_VALUE_MAP.get(item.name);
      if (value === undefined) continue;
      total += value * (item.amount || 1);
      if (cb) cb(i, item, value);
    } catch(e) {}
  }
  return total;
};

/* 行动中实时估值 */
const calculateLootValue = (pId) => eachSellable(pId);

/* 背包(11-45格,跳过保险格)中可变卖物品的总估值 */
const calculateSellValue = calculateLootValue;   // 与 calculateLootValue 同实现, 仅保留别名

/* 一键变卖: 卖掉所有有价的非保险物品(其余物品原样保留),入账并返回所得 */
const sellAllLoot = (pId) => {
  const totalEarned = eachSellable(pId, (slot) => {
    try { api.setItemSlot(pId, slot, 'Air', 0); } catch(e) {}
  });
  if (totalEarned > 0) db.addMoney(pId, totalEarned);
  return totalEarned;
};

/* 变卖面板数据: 按三角洲分类汇总背包(11-45,跳保险格)中可变卖的物品
 * 返回 { total, byCat: Map(分类 -> [{display,tier,value,amount}]) } */
const sellPanel = (pId) => {
  const byCat = new Map();
  let total = 0;
  const insured = insuredSlotsOf(pId);
  for (let i = 11; i <= 45; i++) {
    if (insured.includes(i)) continue;
    let item; try { item = api.getItemSlot(pId, i); } catch(e) { continue; }
    if (!item || !item.name) continue;
    const value = SELL_VALUE_MAP.get(item.name);
    if (value === undefined) continue;
    const amount = item.amount || 1;
    total += value * amount;
    const info = SELL_INFO.get(item.name);
    const cat = info ? info.cat : '其他';
    const tier = info ? info.tier : (GEAR.lootMarkerLevel[item.name] || 1);
    const display = info ? info.display : item.name;
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat).push({ display, tier, value, amount });
  }
  return { total, byCat };
};

module.exports = {
  parseEnchants, getEnchLevel, deepEnchLevel, getMarkerLevel, isMarked, giveMarkedItem, giveMarkedItemAuto, scanContraband,
  calculateGearScore, getGearBreakdown, itemGearScore,
  getChestStyleAt, fillChestLoot, mojinFill,
  openChestFlow, pruneExpiredChests,
  startChestQTE, resolveChestQTE, cancelChestQTE,
  initStarterInsurance,
  calculateLootValue, calculateSellValue, sellAllLoot, clearBagKeepInsured, clearAllKeepInsured,
  insuredSlotsOf, largeInsureSlotsOf, smallInsureSlotsOf,
  saveLootToWarehouse, loadLootFromWarehouse, WAREHOUSE_MAX_SLOTS,
  SELL_INFO, sellPanel,
};
