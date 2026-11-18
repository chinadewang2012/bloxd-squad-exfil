// ============================================
// fittings.js - 枪械配件 + 子弹系统 (CommonJS)
// ============================================
// 【配件(枪械改装) — 按"枪实例"独立, 不再同名共享】
//   拿"配件物品"点一下枪械所在的格子(=原来的交换操作)就装上了:
//     · 同一把枪同一挂点只能装一个;重复装旧的自动退回背包
//     · 配件以"附魔标记"写在该枪实例上: attributes.customAttributes['fit_<挂点>']=配件名。
//       所以身上两把同名枪(如两把 AK)各配各的, 互不影响 —— 捡起/掉落跟着枪走。
//     · gunStats 按"物品名"下发(Bloxd 限制, 同名枪共享同一份), 但每次检测"手持枪"的
//       配件附魔来动态下发: 手持带附魔的枪 → 基础+配件参数; 手持没附魔的同名枪 → 基础参数。
//       (玩家同一时刻只用一把, 等效实现"每把枪独立配件"; 切换手持在 tick 里检测。)
//     · 装错的配件用指令 /pj off 全部卸下(配件退回背包)
//
// 【子弹系统】
//   手里的枪使用第 AMMO_SLOT 格(config.js)的子弹,真正消耗:每开一枪扣 1 颗。
//   伤害倍率表见 config.js 的 GUN_AMMO:{ 枪名: { 子弹名: 倍率|false } }
//     number → 伤害 = 枪默认伤害 × 倍率(普通伤害); false → 默认伤害(真伤); 表格没有该枪 → 不干预。
//   第 AMMO_SLOT 格没有子弹 → 该枪打不出伤害。扣弹在 onDamage/onDamageMob 命中时扣(见 game.js)。
//
// 本模块不直接注册官方回调,由 game.js 转发调用。
// ============================================

const config = require("./config.js");
const GUN_AMMO = config.GUN_AMMO || {};
const AMMO_SLOT = config.AMMO_SLOT;
const guns = require("./guns.js");
const GUNS = guns.GUNS;

/* ===== 配件表 =====
 * 键 = 配件名(自定义名)。游戏内识别只认 attributes.customDisplayName(自定义名),
 * 底层用什么官方物品都行 —— 拿任何物品只要自定义名叫"二倍镜"就能装上。
 * item = 发放配件时用的底层官方物品名(必须是 bloxd 官方物品名,想换底料直接改这里)。
 * setGunStat 覆盖的枪支参数 / blockedGuns 禁用的枪 / desc 说明。
 * 数据来源: SNlobbyGames['GunPJ'](倍镜: 二/四/八倍镜; AmmoH: 快扩/弹鼓)。
 * 改配件/加配件直接改这里,重贴本文件即可。 */
const FITTINGS = {
  '二倍镜':   { item: 'Compass',  group: '倍镜',  setGunStat: { aimZoomFactor: 1.5, scopeType: 'none' },   blockedGuns: [],        desc: '开镜放大倍数:2' },
  '四倍镜':   { item: 'Compass',  group: '倍镜',  setGunStat: { aimZoomFactor: 2.5, scopeType: 'none' },   blockedGuns: [],        desc: '开镜放大倍数:4' },
  '八倍镜':   { item: 'Compass',  group: '倍镜',  setGunStat: { aimZoomFactor: 3.5, scopeType: 'sniper' }, blockedGuns: [],        desc: '开镜放大倍数:8' },
  '快速弹夹': { item: 'Iron Bar', group: 'AmmoH', setGunStat: { reloadTime: '80%', clipSize: 20 },         blockedGuns: [],        desc: '子弹数量:20 换弹速度:-20%' },
  '扩容弹夹': { item: 'Iron Bar', group: 'AmmoH', setGunStat: { clipSize: 40 },                            blockedGuns: [],        desc: '子弹数量:40' },
  '弹鼓':     { item: 'Iron Bar', group: 'AmmoH', setGunStat: { reloadTime: 3300, clipSize: 60 },          blockedGuns: [],        desc: '子弹数量:60 换弹速度:3.3秒' },
  '重型弹鼓': { item: 'Iron Bar', group: 'AmmoH', setGunStat: { reloadTime: 4000, clipSize: 100 },         blockedGuns: ['AWP'],   desc: '子弹数量:100 换弹速度:4秒' },
};

const isFitting = (name) => !!FITTINGS[name];
const isGun = (name) => !!GUNS[name];

/* 物品的配件识别名: 优先自定义名(attributes.customDisplayName),回退底层物品名 */
const fittingNameOf = (item) => {
  if (!item) return null;
  const a = item.attributes;
  return (a && a.customDisplayName) || item.name || null;
};

/* ===== GUN_AMMO 规范化索引(大小写不敏感) =====
 * bloxd 物品名精确区分大小写(getItemSlot 返回如 'Diamond'),但配置里手写
 * 'diamond' / 'Diamond' 应该都能命中 —— 全部转小写建索引,彻底杜绝大小写打错
 * 导致"永远无弹/子弹被违禁品清除"的问题。 */
const GUN_AMMO_LC = {};
/* 引擎无关写法: 不用 Object.entries / 数组解构 / for...of (某些沙箱对非数组结果会抛
 * "object is not iterable (cannot read property Symbol(Symbol.iterator))"), 全部走 Object.keys + 索引 */
const __ammoTable = GUN_AMMO || {};
const __gunKeys = Object.keys(__ammoTable);
for (let gi = 0; gi < __gunKeys.length; gi++) {
  const gun = __gunKeys[gi];
  const map = __ammoTable[gun] || {};
  const m = {};
  const bs = Object.keys(map);
  for (let bi = 0; bi < bs.length; bi++) m[bs[bi].toLowerCase()] = map[bs[bi]];
  GUN_AMMO_LC[gun.toLowerCase()] = m;
}
/* 枪识别名候选: 优先自定义名(剥离[配件]后缀),回退底层物品名。
 * 兼容三种形态: 底层名 "AK-47" / 装配件后 "AK-47 [四倍镜]" / 箱子出的 "突击步枪 AK-47"(自定义名里含真实枪名) */
const GUN_KEY_TAG_RE = /\s*\[[^\]]*\]$/;
const gunNameCandidates = (input) => {
  const out = [];
  if (!input) return out;
  if (typeof input === 'object') {
    const a = input.attributes;
    if (a && a.customDisplayName) out.push(String(a.customDisplayName));
    if (input.name) out.push(String(input.name));
  } else {
    out.push(String(input));
  }
  return out.map((c) => c.replace(GUN_KEY_TAG_RE, '').trim()).filter(Boolean);
};
/* 枪名 -> 该枪的子弹倍率表
 * 识别优先自定义名,回退底层物品名(详见 gunNameCandidates)。
 * 关键: 只要枪在 guns.js 的 GUNS 表内,即使 GUN_AMMO 没单独配也纳入子弹系统(返回 {} 空表,
 * 任意已知子弹按 ×1 伤害),避免"漏配一把枪=无限子弹"。 */
const ammoMapOf = (input) => {
  for (const c of gunNameCandidates(input)) {
    const m = GUN_AMMO_LC[c.toLowerCase()];
    if (m) return m;
  }
  for (const c of gunNameCandidates(input)) {
    if (GUNS[c]) return {};
  }
  return null;
};

/* 已知子弹名集合(小写): 第11格只认这些物品为子弹,
 * 其他物品(如玩家放在保险格的贵重物品)既不算"有弹"也绝不会被当子弹消耗 */
const ammoNamesLower = new Set();
const __lcKeys = Object.keys(GUN_AMMO_LC);
for (let i = 0; i < __lcKeys.length; i++) {
  const m = GUN_AMMO_LC[__lcKeys[i]] || {};
  const bs = Object.keys(m);
  for (let j = 0; j < bs.length; j++) ammoNamesLower.add(bs[j]);
}
const isAmmo = (name) => !!name && ammoNamesLower.has(name.toLowerCase());

/* 是否为本系统枪械(在 GUN_AMMO 表内) —— 命中扣弹判断用 */
const isAmmoGun = (input) => ammoMapOf(input) != null;

/* ===== 配件附魔标记(写在枪实例上, 按实例独立) ===== */
const FIT_PREFIX = 'fit_';
/* 读一把枪实例上已挂配件: { 挂点: 配件名 } */
const readGunFittings = (item) => {
  const out = {};
  const cc = item && item.attributes && item.attributes.customAttributes;
  if (!cc) return out;
  for (const k of Object.keys(cc)) {
    if (k.indexOf(FIT_PREFIX) === 0) {
      const fn = cc[k];
      if (FITTINGS[fn]) out[k.slice(FIT_PREFIX.length)] = fn;
    }
  }
  return out;
};
/* 由 枪名 + 配件表 算 gunStats(基础 + 配件依次覆盖)
 * gunName 必须是 GUNS 表 key(枪名, 不是真实物品名) */
const computeStats = (gunName, fittings) => {
  const base = GUNS[gunName];
  if (!base) return null;
  let stats = Object.assign({}, base);
  for (const fn of Object.values(fittings || {})) {
    const f = FITTINGS[fn];
    if (!f || !f.setGunStat) continue;
    for (const [k, v] of Object.entries(f.setGunStat)) {
      /* 支持 '80%' 这类百分比: 对当前数值乘算, 避免把字符串直接写进 gunStats */
      if (typeof v === 'string' && /^\d+(\.\d+)?%$/.test(v) && typeof stats[k] === 'number') {
        stats[k] = Math.round(stats[k] * parseFloat(v) / 100);
      } else {
        stats[k] = v;
      }
    }
  }
  return stats;
};
/* 从一把枪实例里识别出它的枪名(候选: 先 customDisplayName 再 item.name),
 * 只要有一个命中 GUNS 表就算是枪 —— 这就是"用枪械名而非真实名字"的关键 */
const gunKeyOf = (item) => {
  if (!item) return null;
  for (const c of gunNameCandidates(item)) {
    if (GUNS[c]) return c;
  }
  return null;
};
/* 按某把枪实例下发它的 gunStats(带它自己的配件附魔)
 * 用 gunKeyOf 拿到枪名作为 setItemStat 的 itemName —— 和伤害回调 withItem 口径一致 */
const applyGunStats = (pId, gunItem) => {
  const gk = gunKeyOf(gunItem);
  if (!gk) return;
  const stats = computeStats(gk, readGunFittings(gunItem));
  if (stats) { try { api.setItemStat(pId, gk, 'gunStats', stats); } catch(e) {} }
};
/* 按当前手持枪下发 gunStats(手持没附魔的同名枪 → 基础参数) */
const applyHeldGunStats = (pId) => {
  let gun = null;
  try { gun = api.getItemSlot(pId, api.getSelectedInventorySlotI(pId)); } catch(e) {}
  applyGunStats(pId, gun);
};

/* 提示(飘字) */
const hint = (pId, text, color) => {
  try { api.sendFlyingMiddleMessage(pId, [{str: text, style:{color: color || '#8FE3FF', fontWeight:'bold', fontSize:'1.2rem'}}], 5, 2000); } catch(e) {}
};

/* 发放配件: 用底层官方物品(item)发放并打上 customDisplayName 自定义名。
 * 优先找背包空格整格放入(确定性、一定带自定义名);giveItem 只做兜底。 */
const giveFitting = (pId, fitName, amount) => {
  const f = FITTINGS[fitName] || {};
  const itemName = f.item || fitName;
  const attrs = { customDisplayName: fitName };
  const n = amount || 1;
  try {
    for (let i = 11; i <= 45; i++) {
      const it = api.getItemSlot(pId, i);
      if (!it || !it.name) { api.setItemSlot(pId, i, itemName, n, attrs); return true; }
    }
  } catch(e) {}
  try {
    const added = api.giveItem(pId, itemName, n, attrs);
    if (added && added > 0) return true;
  } catch(e) {}
  return false;
};
/* 把配件物品退回背包 */
const giveBack = (pId, fitName) => giveFitting(pId, fitName, 1);

/* 枪显示名(介绍): "原名 [配件1·配件2]";装/卸配件后刷新。只追加/还原我们自己加的 "[...]" 后缀。 */
const GUN_NAME_TAG_RE = /\s*\[[^\]]*\]$/;
const refreshGunDisplayName = (pId, gunSlot) => {
  try {
    const gun = api.getItemSlot(pId, gunSlot);
    const gk = gunKeyOf(gun);
    if (!gun || !gk) return;
    const dn0 = (gun.attributes && gun.attributes.customDisplayName) || gun.name;
    const base = dn0.replace(GUN_NAME_TAG_RE, '');
    const parts = Object.values(readGunFittings(gun));
    const attrs = Object.assign({}, gun.attributes);   // 浅拷贝: 保留 customAttributes(含 fit_ 附魔与认证)
    if (parts.length) {
      attrs.customDisplayName = `${base} [${parts.join('·')}]`;
    } else if (attrs.customDisplayName && GUN_NAME_TAG_RE.test(attrs.customDisplayName)) {
      if (base === gun.name) delete attrs.customDisplayName;
      else attrs.customDisplayName = base;
    }
    api.setItemSlot(pId, gunSlot, gun.name, gun.amount || 1, attrs);
  } catch(e) {}
};

/* 把配件装到 gunSlot 上的枪(写实例附魔 + 旧件退回 + 刷新显示 + 下发参数)
 * 全程用 gunKeyOf 识别枪名(GUNS 表 key), 不直接用真实物品名 */
const mount = (pId, fitName, gunSlot) => {
  const f = FITTINGS[fitName];
  if (!f) return { success: false, reason: '不是配件' };
  const gun = api.getItemSlot(pId, gunSlot);
  const gk = gunKeyOf(gun);
  if (!gun || !gk) return { success: false, reason: '目标不是枪械' };
  if (f.blockedGuns && f.blockedGuns.includes(gk)) return { success: false, reason: `${gk} 无法使用 ${fitName}` };

  /* 该枪实例上同挂点的旧配件 → 先退回背包;退不回(背包满)就中止挂载,避免旧件丢失 */
  const cur = readGunFittings(gun);
  const old = cur[f.group] || null;
  if (old) {
    if (!giveBack(pId, old)) return { success: false, reason: '背包已满,旧配件退回失败' };
  }
  /* 把配件附魔写到枪实例(保留原 marker / displayName / 其它挂点配件) */
  const attrs = Object.assign({}, gun.attributes);
  const cc = Object.assign({}, attrs.customAttributes || {});
  cc[FIT_PREFIX + f.group] = fitName;
  attrs.customAttributes = cc;
  try { api.setItemSlot(pId, gunSlot, gun.name, gun.amount || 1, attrs); } catch(e) {}
  refreshGunDisplayName(pId, gunSlot);
  applyGunStats(pId, api.getItemSlot(pId, gunSlot));   // 立即按这把枪下发(刚装的大概率在手)
  return { success: true, gun: gun.name, group: f.group, replaced: old };
};

/* 由 onPlayerMoveInvenItem 调用: 把配件从一个格子移到"枪械所在格"= 挂载。
 * 返回 { handled } —— handled=true 表示这次移动已被挂载逻辑吃掉(调用方应 return 'preventChange')。 */
const tryMountByMove = (pId, fromIdx, toIdx) => {
  if (fromIdx === toIdx) return { handled: false };
  let src, dst;
  try { src = api.getItemSlot(pId, fromIdx); } catch(e) { return { handled: false }; }
  const srcFit = fittingNameOf(src);
  if (!srcFit || !isFitting(srcFit)) return { handled: false };
  try { dst = api.getItemSlot(pId, toIdx); } catch(e) { return { handled: false }; }
  if (!dst || !gunKeyOf(dst)) return { handled: false };

  const r = mount(pId, srcFit, toIdx);
  if (!r.success) { hint(pId, '🔧 ' + r.reason, '#FF8800'); return { handled: true }; }
  /* 消耗源格 1 个配件;消耗失败则回滚(从枪实例移除刚装的附魔),防止配件被复制 */
  const amt = src.amount || 1;
  try {
    if (amt > 1) api.setItemSlot(pId, fromIdx, src.name, amt - 1, src.attributes);
    else api.setItemSlot(pId, fromIdx, 'Air', 0);
  } catch(e) {
    try {
      stripFit(pId, toIdx, r.group);            // 回滚: 只去掉"这次挂载的那把枪实例"上的配件附魔
      refreshGunDisplayName(pId, toIdx);
      applyHeldGunStats(pId);
    } catch(e2) {}
    hint(pId, '🔧 挂载失败,请重试', '#FF8800');
    return { handled: true };
  }
  hint(pId, `🔧 ${r.gun} 装上 ${srcFit}${r.replaced ? ` (旧件 ${r.replaced} 已退回背包)` : ''}`);
  return { handled: true };
};

/* 从"指定格子的那一把枪实例"上移除某个挂点的配件附魔(保留其它挂点/其它枪)
 * 注意: 这里只按槽位操作,绝不按枪名扫描 —— 同名另一把枪不受任何影响 */
const stripFit = (pId, gunSlot, group) => {
  let gun = null;
  try { gun = api.getItemSlot(pId, gunSlot); } catch(e) { return false; }
  if (!gun || !gunKeyOf(gun)) return false;
  const cc = gun.attributes && gun.attributes.customAttributes;
  if (!cc || !(FIT_PREFIX + group in cc)) return false;
  const attrs = Object.assign({}, gun.attributes);
  const cc2 = Object.assign({}, cc);
  delete cc2[FIT_PREFIX + group];
  attrs.customAttributes = cc2;
  try { api.setItemSlot(pId, gunSlot, gun.name, gun.amount || 1, attrs); } catch(e) { return false; }
  return true;
};

/* 卸下"指定格子的那一把枪"的全部配件(逐件退回,退不回的就保留在枪上不丢) */
const unmountSlot = (pId, gunSlot) => {
  let gun = null;
  try { gun = api.getItemSlot(pId, gunSlot); } catch(e) { return { success: true, count: 0, failed: 0 }; }
  if (!gun || !gunKeyOf(gun)) return { success: true, count: 0, failed: 0 };
  let n = 0, failed = 0;
  for (const [group, fit] of Object.entries(readGunFittings(gun))) {
    if (giveBack(pId, fit)) {
      if (stripFit(pId, gunSlot, group)) n++;
      else failed++;
    } else failed++;
  }
  refreshGunDisplayName(pId, gunSlot);
  applyHeldGunStats(pId);
  return { success: failed === 0, count: n, failed };
};

/* 卸下该玩家所有枪实例上的所有配件(逐槽扫描,不按枪名分组) */
const unmountAll = (pId) => {
  let n = 0, failed = 0;
  for (let slot = 1; slot <= 45; slot++) {
    const r = unmountSlot(pId, slot);
    n += r.count; failed += r.failed;
  }
  applyHeldGunStats(pId);
  return { success: failed === 0, count: n, failed };
};

/* 当前挂载清单(扫背包所有枪实例, 按实例独立; 供 /pj 展示) */
const listMounts = (pId) => {
  const out = [];
  for (let i = 1; i <= 45; i++) {
    let gun = null; try { gun = api.getItemSlot(pId, i); } catch(e) {}
    const gk = gunKeyOf(gun);
    if (!gun || !gk) continue;
    for (const [group, fit] of Object.entries(readGunFittings(gun))) out.push({ gun: gk, group, fit, slot: i });
  }
  return out;
};

/* 进服/重贴时按当前手持枪下发(配件已在枪实例上, 无需按枪名重放) */
const reapplyAll = (pId) => { applyHeldGunStats(pId); };

/* 手持枪变化检测(每 tick): 槽位/枪名/该实例的配件指纹任一变化 → 按当前实例重下发 gunStats。
 * 指纹来自这一把枪自身的 attributes(不是枪名),所以同名两把枪切换、装上/卸下、捡起/掉落、
 * 保险格存取都会触发重新下发;缓存只做"没变化就跳过"的优化,不参与配件存储。 */
const fitSignature = (gun) => {
  const f = readGunFittings(gun);
  return Object.keys(f).sort().map((k) => k + '=' + f[k]).join('|');
};
const heldSeen = new Map();   // pId -> { slot, name, sig }
const tickFittings = (pId) => {
  let slot = -1, gun = null;
  try { slot = api.getSelectedInventorySlotI(pId); gun = api.getItemSlot(pId, slot); } catch(e) {}
  const name = gunKeyOf(gun);   // 用枪名(不是真实物品名)识别
  const sig = name ? fitSignature(gun) : '';
  const last = heldSeen.get(pId);
  if (last && last.slot === slot && last.name === name && last.sig === sig) return;   // 手持未变, 跳过
  heldSeen.set(pId, { slot, name, sig });
  applyHeldGunStats(pId);
};
/* 背包/手持发生移动、拾取、丢弃、死亡掉落、保险格存取时由 game.js 调用: 丢弃缓存,下一tick重下发 */
const invalidateHeld = (pId) => { heldSeen.delete(pId); };

/* ===== 子弹系统 ===== */

/* 第 AMMO_SLOT 格的子弹(只认已知子弹名,其他物品不算有弹) */
const ammoItemOf = (pId) => {
  try {
    const it = api.getItemSlot(pId, AMMO_SLOT);
    return (it && isAmmo(it.name)) ? it : null;
  } catch(e) { return null; }
};

/* 伤害修正: 返回 undefined=不干预原伤害 | 'preventDamage'=无弹拦截 | number=改后伤害 */
const applyAmmoDamage = (pId, gunName, damage) => {
  const map = ammoMapOf(gunName);
  if (!map) return undefined;                    // 非本系统枪械 → 不干预
  const bullet = ammoItemOf(pId);
  if (!bullet) return 'preventDamage';           // 第11格没子弹 → 打不出伤害
  const mult = (bullet.name.toLowerCase() in map) ? map[bullet.name.toLowerCase()] : 1;
  if (mult === false) return undefined;          // 真伤: 用默认伤害,不改
  if (typeof mult === 'number') return damage * mult;
  return undefined;
};

/* 消耗第 AMMO_SLOT 格的子弹 n 颗,返回实际消耗数
 * 只扣已知子弹: 第11格放了别的物品(保险格贵重物品等)绝不误吞
 * tellClient=true: 服务器主动改背包时必须通知客户端,否则客户端显示旧数量(看起来"没扣弹") */
let ammoDebug = false;
const setAmmoDebug = (v) => { ammoDebug = !!v; return ammoDebug; };
const isAmmoDebug = () => ammoDebug;
const consumeBullets = (pId, n) => {
  if (!n || n <= 0) return 0;
  try {
    const it = api.getItemSlot(pId, AMMO_SLOT);
    if (!it || !isAmmo(it.name)) return 0;
    const amt = it.amount || 1;
    const take = Math.min(amt, n);
    const remain = amt - take;
    if (ammoDebug) console.log(`[子弹] 扣弹 pId=${pId} 子弹=${it.name} ${amt}→${remain} (x${take})`);
    if (remain <= 0) api.setItemSlot(pId, AMMO_SLOT, 'Air', 0, null, true);
    else api.setItemSlot(pId, AMMO_SLOT, it.name, remain, it.attributes, true);
    return take;
  } catch(e) { return 0; }
};

/* 开火检测(轮询 shotsLeft) —— 现网 getItemSlot 通常不回报实时 shotsLeft,默认不启用;
 * 调试模式(/pj ammo dbg)下只记录日志、不扣弹,用来实测"轮询是否可靠";
 * 若官方将来回报 shotsLeft,可把 logOnly 关掉直接作为扣弹主路径(需同时关闭命中扣弹防双扣)。 */
const gunAmmoSeen = new Map();   // pId -> { slot, gun, shots }
const tickAmmo = (pId, opts) => {
  const logOnly = !!(opts && opts.logOnly);
  let slot = -1, gun = null;
  try {
    slot = api.getSelectedInventorySlotI(pId);
    gun = api.getItemSlot(pId, slot);
  } catch(e) { gunAmmoSeen.delete(pId); return; }
  if (!gun || !gun.name || !ammoMapOf(gun)) { gunAmmoSeen.delete(pId); return; }
  const a = gun.attributes;
  const shots = (a && typeof a.shotsLeft === 'number') ? a.shotsLeft : null;
  if (shots === null) {
    if (ammoDebug) console.log(`[子弹] 轮询: pId=${pId} slot=${slot} 枪=${gun.name} attributes.shotsLeft 未回报`);
    return;
  }
  const last = gunAmmoSeen.get(pId);
  if (last && last.slot === slot && last.gun === gun.name && typeof last.shots === 'number' && shots < last.shots) {
    const diff = last.shots - shots;
    if (ammoDebug) console.log(`[子弹] 轮询: pId=${pId} slot=${slot} 枪=${gun.name} shotsLeft ${last.shots}→${shots}`);
    if (!logOnly) consumeBullets(pId, diff);
  }
  gunAmmoSeen.set(pId, { slot, gun: gun.name, shots });
};

/* 玩家离开时清理 */
const forget = (pId) => { gunAmmoSeen.delete(pId); heldSeen.delete(pId); };

/* 子弹系统诊断(/pj ammo): 逐环打印手持枪/第11格物品/配置匹配结果 */
const diagnose = (pId) => {
  const lines = [];
  let sel = -1, held = null;
  try { sel = api.getSelectedInventorySlotI(pId); } catch(e) {}
  try { held = api.getItemSlot(pId, sel); } catch(e) {}
  const showName = (it) => {
    if (!it || !it.name) return '(空)';
    const dn = it.attributes && it.attributes.customDisplayName;
    return dn ? `${JSON.stringify(it.name)} 自定义名:${JSON.stringify(dn)}` : JSON.stringify(it.name);
  };
  lines.push(`手持格 ${sel}: ${showName(held)}`);
  lines.push(`  → 子弹系统: ${held && held.name ? (ammoMapOf(held.name) ? '√ 该枪已纳入子弹系统' : '✗ 不是guns.js表内的枪(不扣弹也不拦截)') : '— 手持的不是配置内的枪'}`);
  const shots = held && held.attributes ? held.attributes.shotsLeft : undefined;
  lines.push(`  → shotsLeft: ${typeof shots === 'number' ? shots : '未回报(轮询不可用,按命中扣弹)'}`);
  let it = null;
  try { it = api.getItemSlot(pId, AMMO_SLOT); } catch(e) {}
  lines.push(`第${AMMO_SLOT}格: ${showName(it)}${it && it.name ? ` x${it.amount || 1}` : ''}`);
  if (it && it.name) {
    lines.push(`  → 认作子弹: ${isAmmo(it.name) ? '√' : `✗ 与GUN_AMMO配置不一致(配置里的子弹名: ${Object.keys(ammoMapOf(held && held.name) || {}).join(', ') || '(无)'})`}`);
    lines.push(`  → 违禁品豁免: ${isExemptItem(it) ? '√' : '✗ 会被违禁品扫描清除!(每2秒扫一次,请观察该物品是否自动消失)'}`);
  }
  const fits = held ? Object.entries(readGunFittings(held)) : [];
  lines.push(`  → 手持枪配件: ${fits.length ? fits.map(([g, f]) => `${g}=${f}`).join(', ') : '(无)'}`);
  lines.push(`GUN_AMMO 配置: ${JSON.stringify(GUN_AMMO)}`);
  lines.push(`AMMO_SLOT = ${AMMO_SLOT}`);
  return lines;
};

/* 违禁品扫描豁免:
 * 1. FITTINGS 表出现过的配件物品名
 * 2. 配置表里出现过的子弹名下的物品
 * 3. OPERATORS 里每个干员的 skillItem (技能物品无认证附魔也应合法)
 * 4. 护甲/武器(GEAR 里的 weaponSlot + armorSlots)里的物品名 */
/* 关键: 不把任何外部对象传给 new Set(...) —— 参数若非可迭代会抛
 * "object is not iterable (cannot read property Symbol(Symbol.iterator))" 直接炸掉 world code init。
 * 改成无参构造 + 逐项 add; const 只是锁定引用, add 改内容是完全合法的。 */
const exemptNames = new Set();
const __fitKeys = Object.keys(FITTINGS || {});
for (let i = 0; i < __fitKeys.length; i++) exemptNames.add(__fitKeys[i]);
/* 加所有技能物品 */
try {
  if (config && config.OPERATORS) {
    const __ops = config.OPERATORS;
    const __opKeys = Object.keys(__ops);
    for (let i = 0; i < __opKeys.length; i++) {
      const op = __ops[__opKeys[i]];
      if (op && op.skillItem) exemptNames.add(op.skillItem);
    }
  }
} catch(e) {}
const isExemptItem = (nameOrItem) => {
  if (!nameOrItem) return false;
  const chk = (n) => exemptNames.has(n) || ammoNamesLower.has(String(n).toLowerCase());
  if (typeof nameOrItem === 'object') {
    const a = nameOrItem.attributes;
    const dn = a && a.customDisplayName;
    if (dn && chk(dn)) return true;   // 自定义名是配件/子弹/技能物品 → 豁免
    return chk(nameOrItem.name);
  }
  return chk(nameOrItem);
};
globalThis.__isExemptItem = isExemptItem;

module.exports = {
  FITTINGS, isFitting, isGun, fittingNameOf, giveFitting,
  mount, unmountSlot, unmountAll, listMounts, tryMountByMove, reapplyAll,
  applyHeldGunStats, applyGunStats, readGunFittings, tickFittings, invalidateHeld,
  applyAmmoDamage, consumeBullets, tickAmmo, forget, isExemptItem, diagnose, isAmmoGun,
  setAmmoDebug, isAmmoDebug, isAmmo,
};
