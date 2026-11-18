// ============================================
// mobs.js - 小怪(游荡敌人)生成与配置
// 需求: 手持枪并作为攻击武器 + 头顶称号 + 按强度(MobStrong)配色 + 强度适中(两三枪死) + 死亡掉落烂枪/变卖物
// 官方 API: attemptSpawnMob(返回 mobId) / setMobSetting / setTargetedPlayerSettingForEveryone(nameTagInfo) / onDeathItemDrops
// ============================================
const config = require("./config.js");
const { GUNS } = require("./guns.js");   /* GUNS 表在 guns.js, config.js 不导出 GUNS */
const S = config.SMALL_MOB;

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* 本系统小怪掉落台账: mobId -> 预滚动掉落表(与 onDeathItemDrops 一致)。
 * 真机上逐怪物 setMobSetting(onDeathItemDrops) 常不生效, 故击杀时经 onPlayerKilledMob 在死亡位置刷出地面掉落物。 */
const smallMobDrops = new Map();

/* 按强度(MobStrong)取配色档: 从上到下第一个 min<=strong 的档生效 */
const tierOf = (strong) => {
  const tiers = S.strongTiers || [];
  for (const t of tiers) if (strong >= t.min) return t;
  return { color: '#D8D8D8', ench: 'Tier 1' };
};

/* 配置单只小怪: 称号(按强度配色) / 持枪并设为武器 / 血量×MobStrong / 死亡掉落 */
const configureSmallMob = (mobId, mobType, mobStrong) => {
  if (mobId == null) return;
  try {
    const strong = Math.max(0, Number(mobStrong) || 1);
    const title = pick(S.titles);
    const gun = pick(S.badGuns);
    const tier = tierOf(strong);

    // 头顶称号 + 按强度配色(称号/副标题/血条颜色随强度, 副标题显示强度倍率)
    api.setTargetedPlayerSettingForEveryone(mobId, 'nameTagInfo', {
      backgroundColor: 'rgba(18,18,22,0.55)',
      content: [{ str: `「${title}」`, style: { color: tier.color, fontWeight: 'bold', fontSize: '1.15rem' } }],
      subtitle: [{ str: `强度 ×${strong.toFixed(1)}`, style: { color: tier.color, fontSize: '0.85rem' } }],
      healthbar: { display: 'onDamage', height: '1.1rem', backgroundColour: '#2a0000', foregroundColour: tier.color },
    }, true);

    // 手中更换为枪械, 并把该枪设为实际攻击武器(不再空手/爪击); 武器发光档随强度
    api.setMobSetting(mobId, 'heldItemName', gun);
    api.setMobSetting(mobId, 'attackItemName', gun);
    api.setMobSetting(mobId, 'heldItemEnchantmentTier', tier.ench);

    // 强度适中: 最普通图(strong=1)玩家两三枪能打死; 按地图 MobStrong 等比放大(降 maxHealth 会钳制当前血量)
    api.setMobSetting(mobId, 'maxHealth', Math.round(S.stats.maxHealth * strong));
    api.setMobSetting(mobId, 'initialHealth', Math.round(S.stats.initialHealth * strong));
    api.setMobSetting(mobId, 'attackDamage', Math.round(S.stats.attackDamage * strong));
    if (S.stats.attackRadius) api.setMobSetting(mobId, 'attackRadius', S.stats.attackRadius);

    // 死亡掉落: 普通箱风格的变卖物 + 偶尔一把特别烂的枪
    const drops = S.drops.map((d) => Object.assign({}, d));
    if (Math.random() < S.gunDropChance) {
      drops.push({ itemName: gun, probabilityOfDrop: 1, dropMinAmount: 1, dropMaxAmount: 1 });
    }
    api.setMobSetting(mobId, 'onDeathItemDrops', drops);
    smallMobDrops.set(mobId, drops);   // 台账: 击杀时主动发奖兜底
  } catch (e) { try { console.log('[搜打撤] 小怪配置失败: ' + ((e && e.message) || e)); } catch(_) {} }
};

/* 生成并配置一只小怪(供 maps.trySpawnMobs 调用); mobStrong = 地图 MobStrong, 默认1 */
const spawnSmallMob = (mobType, x, y, z, mobStrong) => {
  let id = null;
  try { id = api.attemptSpawnMob(mobType, x, y, z); } catch (e) { return null; }
  if (id != null) configureSmallMob(id, mobType, mobStrong);
  return id;
};

/* 小怪掉落黑名单: 禁止掉武器/装备/工具(与 loot.js FORBIDDEN_DROP_NAMES 同口径, 但**不含枪械**)
 * 不含枪械是设计: 小怪允许掉"缴获的枪", 由 rollSmallMobDrops 打 customDisplayName
 * 虽然 config.SMALL_MOB.drops 已换过, 这里再兜一层防配置回退 */
const FORBIDDEN_NAMES = new Set([
  'Iron Sword','Diamond Sword','Knight Sword','Stone Sword','Gold Sword','Moonstone Dagger','Iron Dagger','Wood Dagger',
  'Wood Bow','Diamond Bow','Iron Bow','Wood Crossbow',
  'Iron Helmet','Iron Chestplate','Iron Leggings','Iron Boots',
  'Diamond Helmet','Diamond Chestplate','Diamond Leggings','Diamond Boots',
  'Gold Helmet','Gold Chestplate','Gold Leggings','Gold Boots',
  'Iron Pickaxe','Diamond Pickaxe','Gold Pickaxe','Stone Pickaxe',
  'Iron Hoe','Gold Hoe','Diamond Hoe','Stone Hoe',
  'Iron Axe','Diamond Axe','Gold Axe','Stone Axe',
  'Iron Spade','Diamond Spade','Gold Spade','Stone Spade',
  'Iron Spear',
  'Snowball','Egg',
  /* 顶级材质装备(官方真实名: bloxd 无 Netherite) */
  'Amethite Sword','Amethite Pickaxe','Amethite Axe','Amethite Spade','Amethite Hoe',
  'Amethite Helmet','Amethite Chestplate','Amethite Leggings','Amethite Boots',
  'Serpentite Sword','Serpentite Pickaxe','Serpentite Axe','Serpentite Spade','Serpentite Hoe',
  'Serpentite Helmet','Serpentite Chestplate','Serpentite Leggings','Serpentite Boots',
  'Rubellite Sword','Rubellite Pickaxe','Rubellite Axe','Rubellite Spade','Rubellite Hoe',
  'Rubellite Helmet','Rubellite Chestplate','Rubellite Leggings','Rubellite Boots',
  'Magmasteel Sword','Magmasteel Pickaxe','Magmasteel Axe','Magmasteel Spade','Magmasteel Hoe',
  'Magmasteel Helmet','Magmasteel Chestplate','Magmasteel Leggings','Magmasteel Boots',
]);
const isForbiddenDrop = (name) => FORBIDDEN_NAMES.has(name);

/* 玩家击杀本系统小怪: 按概率滚动掉落并清台账, 返回物品数组; 非本系统小怪返回 null(走引擎默认)
 * 掉落全部过 FORBIDDEN_NAMES 过滤(即使 config.drops 里误配了武器/装备也会被剔除)
 * 枪械掉落给 customDisplayName(显示"缴获的 枪名") 和 sanjiaozhou 认证附魔 */
const rollSmallMobDrops = (mobId) => {
  const drops = smallMobDrops.get(mobId);
  smallMobDrops.delete(mobId);
  if (!drops) return null;
  const out = [];
  for (const d of drops) {
    if (isForbiddenDrop(d.itemName)) continue;   // ← 兜一层黑名单
    const p = (d.probabilityOfDrop != null) ? d.probabilityOfDrop : 1;
    if (Math.random() >= p) continue;
    const lo = d.dropMinAmount || 1, hi = (d.dropMaxAmount != null ? d.dropMaxAmount : lo);
    const amt = lo + Math.floor(Math.random() * (hi - lo + 1));
    const attrs = { sanjiaozhou: 1 };
    /* 枪械掉落: 给个显示名"缴获的 枪名" */
    if (GUNS[d.itemName] || (config.GUN_AMMO && config.GUN_AMMO[d.itemName])) {
      attrs.customDisplayName = `缴获的 ${d.itemName}`;
    }
    out.push({ name: d.itemName, amount: Math.max(1, amt), attributes: attrs });
  }
  return out;
};
/* 小怪消失(非击杀, 如玩家离图)时清台账, 防内存泄漏 */
const forgetMob = (mobId) => { smallMobDrops.delete(mobId); };

module.exports = { spawnSmallMob, configureSmallMob, tierOf, rollSmallMobDrops, forgetMob };
