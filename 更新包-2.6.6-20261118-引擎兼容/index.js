// ============================================
// index.js - 主入口文件 (Bloxd世界代码)
// 只有 require() 和官方回调名赋值会执行
// 初始化逻辑放在 tick 第一次执行时(此时api已就绪)
// 官方回调列表见: github.com/Bloxdy/code-api/blob/main/CALLBACKS.md
// ============================================

/* ===== 模块引用(按官网多文件规则) =====
 * 规则: require 参数必须是 ./ 或 / 开头的相对路径字面量, 打包期静态解析;
 *       不能是裸文件名, 也不能是变量/包在函数里(静态扫描建不出模块图)。
 * index.js 是唯一回调入口, 且不能被其他文件 import。 */
console.log('[搜打撤] ini开始');
const config = require("./config.js");
const CONST = config.CONST;
const db = require("./db.js");
const menu = require("./menu.js");
const initMenus = menu.initMenus;
const customweapons = require("./customweapons.js");
const game = require("./game.js");
const fittings = require("./fittings.js");
console.log('[搜打撤] init 模块加载完成, 代码版本 ' + (config.VERSION || '未知'));

/* ============================================================
 * 聊天钩子(放在 index.js 最前,方便你直接改这里)
 * 全局函数 Chat(玩家名, 原话, 频道名):
 *   在每条玩家聊天消息进入处理前调用一次。
 *   返回 true  → 拦截这条原话(不广播给其他人)
 *   返回其他值 → 放行(undefined / false 都算放行)
 *
 * 想"代替原话发言": 在函数里用 api.sendMessage / api.broadcastMessage 自己发,然后 return true。
 * 注意: 以 "/" 开头的原生命令(如 /give /tp)也会经过这里,别对它们 return true,否则会挡住服主指令。
 * 不改逻辑时保持 return false 即可。
 * ============================================================ */
globalThis.Chat = (playerName, message, channelName) => {
  // ↓↓↓ 在这里写你自己的代码 ↓↓↓

  return false;   // 默认放行(改为 return true 可拦截本条原话)
};

/* ===== 全局函数入口(绑定在主世界代码,Code Block/指令方块可直接调用) =====
 * Money(玩家id, 数量): 正数加钱,负数扣钱(下限0),返回玩家当前余额。例: Money(1, 100)
 * Data(键): 读全局数据;Data(键, 值): 写全局数据(持久化,对象自动JSON)
 * PlayerData(玩家id, 键 [, 值]): 玩家级数据读/写(持久化)
 * Checkin(玩家id): 每日签到,返回 {success, streak, reward}
 * Quest(玩家id): 查全部任务进度;Quest(玩家id, 类型, 数量): 加进度(kill/extract/loot) */
Money = (pId, amount) => game.moneyEntry(pId, amount);
/* CheckMoney(玩家id, 金额): 剩余钱数 ≥ 金额返回 true,小于返回 false。例: CheckMoney(1, 500) */
CheckMoney = (pId, amount) => game.checkMoney(pId, amount);
/* Mojin(类型, x, y, z): 在指定箱子坐标装填摸金物品。
 * 类型=地图key(用该图统一摸金分区,如 'gt'/'jianyu'/'dam') 或 箱子样式key(如 'Block of Gold');
 * 物品带 sanjiaozhou 附魔。返回装填格数,类型未知返回 -1。例: Mojin('dam', 100, 70, 100) */
Mojin = (type, x, y, z) => game.mojin(type, x, y, z);
/* 注意: 必须用"值是否为undefined"判断读写,不能用arguments.length —— 箭头函数没有自己的arguments */
Data = (key, value) => {
  if (value !== undefined) { db.setGlobalData(key, value); return value; }
  return db.getGlobalData(key);
};
PlayerData = (pId, key, value) => {
  if (value !== undefined) { db.setPlayerData(pId, key, value); return value; }
  return db.getPlayerData(pId, key);
};
Checkin = (pId) => game.doCheckin(pId);
Quest = (pId, type, amount) => game.questInterface(pId, type, amount);
/* PullLever(玩家名, 撤离点名字): 条件撤离点拉闸。
 * 同一地图同一对局内每个撤离点只能拉一次(重复拉不加次数并返回失败原因);
 * 拉闸次数达到地图/撤离点要求(leverRequired)后给 5 分钟撤离buff,可踩黑色羊毛撤离。
 * 返回 { ok:true, exfil, count, required, buff, buffUntil } 或 { ok:false, reason } */
PullLever = (playerName, exfilName) => game.pullLever(playerName, exfilName);
/* 自定义武器注册接口(详见 customweapons.js 头部说明):
 * CustomWeapon.add('Knight Sword', (ctx)=>{})        万能处理器
 * CustomWeapon.add('Knight Sword', { hitPlayer: fn, hitMob: fn, damagedByPlayer: fn, mobHitYou: fn, click: fn })
 *   ctx = { event, a, hasSecond, b, c, d, isSelf }  返回数字改伤害/'preventDamage'取消
 * CustomWeapon.remove('Knight Sword') / CustomWeapon.list() / CustomWeapon.has(名字) */
CustomWeapon = {
  add: customweapons.add,
  remove: customweapons.remove,
  list: customweapons.list,
  has: customweapons.has,
};

/* 配件/子弹工具接口(详见 fittings.js 头部说明):
 * Fittings.list()                          列出所有配件物品名
 * Fittings.give(玩家id, 物品名, 数量)       发配件或子弹到玩家背包
 * Fittings.mount(玩家id, 配件名, 枪所在格)   直接把配件装到某格的枪上
 * Fittings.unmountAll(玩家id)              卸下该玩家全部配件(退回背包) */
Fittings = {
  list: () => Object.keys(fittings.FITTINGS || {}),
  give: (pId, name, amount) => {
    try {
      if (fittings.FITTINGS[name]) return fittings.giveFitting(pId, name, amount);   // 配件: 底层物品+自定义名
      return api.giveItem(pId, name, amount || 1);                                    // 子弹等普通物品
    } catch(e) { return 0; }
  },
  mount: (pId, fitName, gunSlot) => fittings.mount(pId, fitName, gunSlot),
  unmountAll: (pId) => fittings.unmountAll(pId),
};

/* ===== 懒初始化标志 ===== */
let initialized = false;

/* 跨模块版本自检: 手动粘贴世界代码时最容易出现"漏贴/贴了旧版文件",
 * require阶段不报错,但运行期函数缺失会把tick炸掉。启动时点名缺谁。
 * game.selfCheck() 校验game.js内部引用的loot/menu/maps/operators/team/db函数,
 * 这里再校验game.js自身暴露的回调。 */
const verifyModules = () => {
  const missing = [];
  const gameFns = ['onTick', 'onPlayerClick', 'onJoin', 'onLeave', 'onRespawn', 'onKill', 'onMobKill',
    'onDamage', 'onDamageMob', 'onMobDamagingPlayer', 'onPlayerAttemptOpenChest', 'onDropItem', 'onPlayerMoveInvenItem',
    'onPlayerMoveItemOutOfInventory', 'onPlayerToggledShopMenu', 'onWorldSpawnMob', 'onPlayerCommand', 'onBought'];
  for (const fn of gameFns) {
    if (typeof game[fn] !== 'function') missing.push(`game.${fn}`);
  }
  try {
    const inner = game.selfCheck();
    if (Array.isArray(inner)) missing.push(...inner);
  } catch(e) {
    missing.push('game.selfCheck() 执行异常: ' + (e && e.message));
  }
  if (missing.length > 0) {
    const msg = `❌ 版本自检失败: ${missing.join(', ')} 缺失 —— 对应js文件是旧版或没粘贴,请重新粘贴全部文件!`;
    console.log('[搜打撤] ' + msg);
    try { api.broadcastMessage([{str: msg, style:{color:'#FF0000',fontWeight:'bold',fontSize:'1.1rem'}}]); } catch(e) {}
  } else {
    console.log('[搜打撤] 版本自检通过: 全部模块函数就绪');
  }
};

const doInit = () => {
  if (initialized) return;
  initialized = true;
  try { console.log(`[搜打撤] 启动,代码版本 ${config.VERSION || '未知(旧config.js)'}`); } catch(e) {}
  try { api.setMaxPlayers(20, 24); } catch(e) {}
  try { initMenus(); } catch(e) {}
  try { game.applyMobNerf(); } catch(e) { console.log('[搜打撤] 小怪削弱应用异常: ' + (e && e.message)); }
  try { verifyModules(); } catch(e) { console.log('[搜打撤] 自检执行异常: ' + (e && e.message)); }
  /* 地图为玩家各自独立选择(存在各自玩家db中),无需全局恢复 */
};

/* 错误上报: 完整堆栈进控制台,并把错误发给在线玩家(5秒限频,避免刷屏) */
let lastErrReport = 0;
const reportError = (where, e) => {
  const stack = (e && e.stack) ? String(e.stack) : String(e);
  console.log(`[搜打撤] ${where}异常: ` + stack);
  const now = Date.now();
  if (now - lastErrReport < 5000) return;
  lastErrReport = now;
  try {
    for (const pId of api.getPlayerIds()) {
      try { api.sendFlyingMiddleMessage(pId, [
        {str:`⚠ 代码异常(${where}): `, style:{color:'#FF0000',fontWeight:'bold'}},
        {str:`${(e && e.message) || e}`, style:{color:'#FF8800',fontSize:'0.9rem'}},
      ], 5, 3000); } catch(e2) {}
    }
  } catch(e3) {}
};

/* 回调包装: 任何官方回调抛错都改为"上报+吞掉",不再无名崩溃(返回undefined走引擎默认行为) */
const safe = (where, fn) => (...args) => {
  try { return fn(...args); } catch(e) { reportError(where, e); }
};

/* ===== 官方回调注册(全部经safe包装) ===== */

// 主循环 - 第一次执行时触发初始化
tick = safe('tick', () => {
  doInit();
  game.onTick();
});

// 玩家点击(技能物品单击释放+自定义武器单击) - 官方签名: (playerId, wasAltClick, x, y, z, block, targetEId)
onPlayerClick = safe('onPlayerClick', (pId, wasAltClick, x, y, z, block, targetEId) => {
  game.onPlayerClick(pId, wasAltClick, x, y, z, block, targetEId);
});

// 玩家加入
onPlayerJoin = safe('onPlayerJoin', (pId, fromGameReset) => {
  doInit();
  game.onJoin(pId);
});

// 玩家离开
onPlayerLeave = safe('onPlayerLeave', (pId, serverIsShuttingDown) => {
  game.onLeave(pId);
});

// 重生
onRespawnRequest = safe('onRespawnRequest', (pId) => {
  return game.onRespawn(pId);
});

// 击杀
onPlayerKilledOtherPlayer = safe('onPlayerKilledOtherPlayer', (attackerId, victimId, damage, item) => {
  return game.onKill(attackerId, victimId, damage, item);
});

// 怪物击杀玩家(守护者等)
onMobKilledPlayer = safe('onMobKilledPlayer', (mobId, victimId, damage, mobType) => {
  return game.onMobKill(mobId, victimId, damage);
});

// 玩家击杀小怪(本系统小怪主动发奖 + 阻止引擎掉, 兜底真机 onDeathItemDrops 不生效)
onPlayerKilledMob = safe('onPlayerKilledMob', (playerId, mobId, damageDealt, withItem) => {
  return game.onPlayerKilledMob(playerId, mobId, damageDealt, withItem);
});
// 小怪消失(清掉落台账防内存泄漏)
onMobDespawned = safe('onMobDespawned', (mobId) => {
  game.onMobDespawned(mobId);
});

// 伤害其他玩家
onPlayerDamagingOtherPlayer = safe('onPlayerDamagingOtherPlayer', (attackerId, victimId, damage, item, bodyPart) => {
  return game.onDamage(attackerId, victimId, damage, item, bodyPart);   // 必须return: 自定义武器的ctx.damage/取消靠它传给引擎
});

// 伤害怪物
onPlayerDamagingMob = safe('onPlayerDamagingMob', (playerId, mobId, damage, item, damagerDbId) => {
  return game.onDamageMob(playerId, mobId, damage, item);
});

// 怪物伤害玩家(自定义武器通道,可改伤害/取消) - 官方: (attackingMob, damagedPlayer, damageDealt, withItem)
onMobDamagingPlayer = safe('onMobDamagingPlayer', (attackingMob, damagedPlayer, damage, item) => {
  return game.onMobDamagingPlayer(attackingMob, damagedPlayer, damage, item);
});

// 开箱
onPlayerAttemptOpenChest = safe('onPlayerAttemptOpenChest', (pId, x, y, z, isMoonstone, isIron) => {
  return game.onPlayerAttemptOpenChest(pId, x, y, z, isMoonstone, isIron);
});

// 丢弃物品
onPlayerDropItem = safe('onPlayerDropItem', (pId, x, y, z, item, amt, fromIdx) => {
  return game.onDropItem(pId, x, y, z, item, amt, fromIdx);
});

// 背包移动物品(锁定格拦截) - 官方: (pId, fromIdx, toStartIdx, toEndIdx, amt)
onPlayerMoveInvenItem = safe('onPlayerMoveInvenItem', (pId, fromIdx, toStartIdx, toEndIdx, amt) => {
  return game.onPlayerMoveInvenItem(pId, fromIdx, toStartIdx, toEndIdx, amt);
});

// 移出背包(丢入其他容器等旁路,同样拦截锁定格)
// 官方签名: (playerId, itemName, itemAmount, fromIdx, movementType) —— 注意 fromIdx 是第4个参数!
onPlayerMoveItemOutOfInventory = safe('onPlayerMoveItemOutOfInventory', (pId, itemName, itemAmount, fromIdx, movementType) => {
  return game.onPlayerMoveItemOutOfInventory(pId, fromIdx, itemAmount);
});

// 交换背包两格 - 官方: (pId, i, j)
onPlayerSwapInvenSlots = safe('onPlayerSwapInvenSlots', (pId, i, j) => {
  return game.onPlayerMoveInvenItem(pId, i, j, j, 0);
});

// 带数量的物品移动 - 官方: (pId, i, j, amt)
onPlayerMoveInvenItemWithAmt = safe('onPlayerMoveInvenItemWithAmt', (pId, i, j, amt) => {
  return game.onPlayerMoveInvenItem(pId, i, j, j, amt);
});

// 物品移入某索引范围 - 官方: (pId, start, end, moveIdx, itemAmount)
onPlayerMoveItemIntoIdxs = safe('onPlayerMoveItemIntoIdxs', (pId, start, end, moveIdx, itemAmount) => {
  return game.onPlayerMoveInvenItem(pId, moveIdx, start, end, itemAmount);
});

// 玩家切换Shop菜单(比赛中拦截)
onPlayerToggledShopMenu = safe('onPlayerToggledShopMenu', (pId, isOpened) => {
  game.onPlayerToggledShopMenu(pId, isOpened);
});

// 阻止自然刷怪
onWorldAttemptSpawnMob = safe('onWorldAttemptSpawnMob', (mobType, x, y, z) => {
  return game.onWorldSpawnMob(mobType, x, y, z);
});

// 玩家命令
playerCommand = safe('playerCommand', (pId, cmd) => {
  return game.onPlayerCommand(pId, cmd);
});

// 自定义聊天钩子已定义在 index.js 最上方(globalThis.Chat)

/* 玩家聊天消息入口(onPlayerChat) —— 处理顺序:
 *   1) 先过自定义钩子 Chat(玩家名, 原话, 频道名): 返回 true 则拦截本条原话
 *   2) 全角斜杠"／"兜底: 中文输入法打出的"／jt"不会触发 playerCommand(当普通聊天),
 *      这里剥掉全角斜杠后交给指令处理器,并 return false 拦截广播
 *   3) 其余(含 ASCII "/" 原生命令)一律放行,交回 bloxd 原生处理
 *      —— 千万不要拦 ASCII "/",否则会吞掉服主原生命令(/give /tp 等) */
onPlayerChat = safe('onPlayerChat', (pId, msg, channelName) => {
  if (typeof msg !== 'string') return;

  /* 禁言拦截: 被禁玩家不能公屏聊天(命令"/"或"／"仍放行,不影响其用指令) */
  try {
    const t0 = msg.trim();
    const isCmd = t0.startsWith('/') || t0.startsWith('／');
    if (!isCmd && typeof game.isMuted === 'function' && game.isMuted(pId)) {
      try { api.sendMessage(pId, [{str:'🔇 你已被禁言,无法在公屏发言', style:{color:'#FF5555',fontWeight:'bold'}}]); } catch(e) {}
      return false;
    }
  } catch(e) {}

  /* 1) 自定义聊天钩子: 返回 true 则拦截原话(玩家名取不到时回退用 pId) */
  try {
    if (typeof globalThis.Chat === 'function') {
      let name = pId;
      try { name = api.getEntityName(pId) || pId; } catch(e) {}
      if (globalThis.Chat(name, msg, channelName) === true) return false;
    }
  } catch(e) {}

  /* 2) 全角斜杠"／"兜底路由 — 拦截广播,不加格式化 */
  const trimmed = msg.trim();
  if (trimmed.startsWith('／')) {
    const cmd = trimmed.replace(/^／\s*/, '');
    if (!cmd) return;
    try { game.onPlayerCommand(pId, cmd); } catch(e) {}
    return false;   // 拦截聊天广播
  }

  /* 3) ASCII "/" 开头的原生命令(官方 /tp /give 等) — 放行原生,不加格式化前缀 */
  if (trimmed.startsWith('/')) return;

  /* 4) 正常聊天 — 返回格式化前缀(官方回调返回 string = 自定义前缀)
   * 格式: [kd:X/Y]【段位】[【荣誉称号】]【身份】【玩家名】:消息
   * 荣誉称号仅在 CHAT_TITLES 为该玩家单独配置且与段位不同时显示,避免两栏重复 */
  try {
    const name = api.getEntityName(pId) || String(pId);
    const whitelist = (CONST && CONST.whitelist) || [];
    const isAdmin = whitelist.includes(name) || whitelist.includes(pId);
    const identity = isAdmin ? '管理' : '玩家';
    const stats = (db.getStats && db.getStats(pId)) || {};
    const kills = stats.kills || 0;
    const deaths = stats.deaths || 0;
    const extracts = stats.extracts || 0;
    /* 段位: 按 extracts 自动匹配 CONST.titles 里最高可达成的 */
    let rank = '';
    try {
      const titles = CONST && CONST.titles;
      if (titles) {
        let best = null;
        for (const tk of Object.keys(titles)) {
          const r = titles[tk];
          if (r && r.req && (extracts >= (r.req.extracts || 0)) && (!best || r.req.extracts > best.req.extracts)) best = r;
        }
        rank = best ? best.name : '';
      }
    } catch(e) {}
    /* 荣誉称号: 仅取手动配置的专属称号;未配置时不显示该栏,避免与段位重复 */
    const CHAT_TITLES = config && config.CHAT_TITLES;
    const honor = (CHAT_TITLES && CHAT_TITLES[name]) || '';
    const kdStr = `${kills}/${deaths}`;
    const rankTag = `【${rank || honor || '玩家'}】`;
    const honorTag = (honor && honor !== rank) ? `【${honor}】` : '';
    const prefix = `[kd:${kdStr}]${rankTag}${honorTag}【${identity}】【${name}】:`;
    return prefix;
  } catch(e) {
    try { console.log('[搜打撤] 聊天前缀生成失败: ' + ((e && e.message) || e)); } catch(_) {}
  }

  /* 5) 其余情况 — 放行原生格式 */
});

// 商店购买(菜单按钮触发) - 官方: (pId, categoryKey, itemKey, item, userInput)
onPlayerBoughtShopItem = safe('onPlayerBoughtShopItem', (pId, categoryKey, itemKey, item, userInput) => {
  game.onBought(pId, categoryKey, itemKey, item, userInput);
});

// 玩家完成QTE(开箱搜索) - 官方: (playerId, qteId, result); result 为真=成功 → 触发额外奖励
onPlayerFinishQTE = safe('onPlayerFinishQTE', (pId, qteId, result) => {
  game.onPlayerFinishQTE(pId, qteId, result);
});

// 定期保存(选图已按玩家db实时持久化,此处仅作钩子)
doPeriodicSave = () => {
};

// 服务器关闭
onClose = (serverIsShuttingDown) => {};
