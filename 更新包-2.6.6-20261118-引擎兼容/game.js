// ============================================
// game.js - 搜打撤核心逻辑 (CommonJS)
// ============================================
// 职责:个人行动(raid)流程编排 —— 每个玩家独立选图/进图/撤离,互不影响
//   选择地图 → 战备(战备值门槛/保险标记) → 进图搜索(PVP+开箱) → 撤离/阵亡/超时 → 结算
// 依赖模块:
//   maps.js      玩家独立选图/区域检测/传送/刷怪
//   operators.js 干员技能与被动(手持技能物品单击释放)
//   loot.js      箱子战利品/保险/战备值/违禁品检测
//   menu.js      Shop菜单交互
//   team.js      3人组队与友伤控制
//   db.js        玩家数据持久化
//
// 本模块不直接注册官方回调,统一由 index.js 转发调用。

const config = require("./config.js");
const MAPS = config.MAPS;
const CONST = config.CONST;
const THEME = config.THEME;
const STATUS = config.STATUS;
const GEAR = config.GEAR;
const RANKS = config.RANKS;
const EXTRACT = config.EXTRACT;
const maps = require("./maps.js");
const mobs = require("./mobs.js");   // 小怪生成/掉落台账
const customweapons = require("./customweapons.js");
const guns = require("./guns.js");
const gunsApplyAll = guns.applyAll;   // 枪械参数: onPlayerJoin时对每个玩家应用guns.js表内全部枪械
const fittings = require("./fittings.js");   // 枪械配件 + 子弹系统
/* maps.js不再持有玩家地图状态;以下函数均显式接收map对象(pId, map) */
const teleportToSpawn = maps.teleportToSpawn;
const getSpawnPos = maps.getSpawnPos;
const teleportToSearch = maps.teleportToSearch;
const getExtractCenter = maps.getExtractCenter;
const getNearestExfilCenter = maps.getNearestExfilCenter;
const updatePlayerZone = maps.updatePlayerZone;
const getCachedZone = maps.getCachedZone;
const clearPlayerZone = maps.clearPlayerZone;
const getActiveExfil = maps.getActiveExfil;
const trySpawnMobs = maps.trySpawnMobs;
const resetMobTick = maps.resetMobTick;
const operators = require("./operators.js");
const getPlayerOperator = operators.getPlayerOperator;
const clearPlayerOperator = operators.clearPlayerOperator;
const initPlayerOperator = operators.initPlayerOperator;
const useSkill = operators.useSkill;
const tryUseSkillFromItem = operators.tryUseSkillFromItem;
const getSkillCooldown = operators.getSkillCooldown;
const updateEffects = operators.updateEffects;
const ensureSkillItems = operators.ensureSkillItems;
const getOperatorBaseSpeed = operators.getOperatorBaseSpeed;
const loot = require("./loot.js");
const handleOpenChest = loot.openChestFlow;
const clearBagKeepInsured = loot.clearBagKeepInsured;
const clearAllKeepInsured = loot.clearAllKeepInsured;
const insuredSlotsOf = loot.insuredSlotsOf;
const loot_initStarterInsurance = loot.initStarterInsurance;
const calculateLootValue = loot.calculateLootValue;
const calculateGearScore = loot.calculateGearScore;
const getGearBreakdown = loot.getGearBreakdown;
const scanContraband = loot.scanContraband;
const giveMarkedItem = loot.giveMarkedItem;
const parseEnchants = loot.parseEnchants;
const getEnchLevel = loot.getEnchLevel;
const pruneExpiredChests = loot.pruneExpiredChests;
const cancelChestQTE = loot.cancelChestQTE;
/* 三角洲行动撤离仓库: 撤离成功非保险格物品自动入库, initPlayer 时拉回 */
const saveLootToWarehouse = loot.saveLootToWarehouse;
const loadLootFromWarehouse = loot.loadLootFromWarehouse;
const createExtractMarkers = maps.createExtractMarkers;
const removeExtractMarkers = maps.removeExtractMarkers;
const menu = require("./menu.js");
const openMapMenu = menu.openMapMenu;
const updateTeamMenuForPlayer = menu.updateTeamMenuForPlayer;
const updateStatusMenuForPlayer = menu.updateStatusMenuForPlayer;
const handleInviteCommand = menu.handleInviteCommand;
const handleAcceptCommand = menu.handleAcceptCommand;
const handleLeaveCommand = menu.handleLeaveCommand;
const team = require("./team.js");
const clearPlayerTeam = team.clearPlayerTeam;
const isSameTeam = team.isSameTeam;
const team_setInMatch = team.setInMatch;
const cleanExpiredInvites = team.cleanExpiredInvites;
const db = require("./db.js");

/* ===== 全局状态 ===== */
let G = {
  tick: 0,
  uiTick: 0,
  players: new Map(),   // pId -> PlayerState
};

/* Bloxd 代码块引擎兼容: Set/Map 无 Symbol.iterator, 必须用原型方法 */
const setToArray = (s) => { const a = []; s.forEach(v => a.push(v)); return a; };
const mapKeys = (m) => { const a = []; m.forEach((_, k) => a.push(k)); return a; };
const mapEntries = (m) => { const a = []; m.forEach((v, k) => a.push([k, v])); return a; };
/* unique: 替代 [...new Set(arr)] 惯用写法, 因为 Set 不可迭代 */
const unique = (arr) => { const seen = {}; const a = []; arr.forEach(v => { if (!seen[v]) { seen[v] = 1; a.push(v); } }); return a; };

const createPlayerState = () => ({
  inRaid: false, alive: false, timeLeft: 0,
  loot: 0, kills: 0,
  /* 撤离读条: extracting=已开始, extTime=已读tick数, extTotal=总秒数, extKey=当前撤离点+羊毛标识 */
  extracting: false, extTime: 0, extTotal: 0, extKey: null, extWarnAt: 0,
  zone: 'lobby', weight: 0, mapKey: null,
  exfilBlocked: 0, extractExfil: null, openRandomKey: null,
  /* 拉闸(条件撤离): leverKeys=本局已拉过的撤离点, leverBuffUntil=buff到期时间戳, leverArmed=本局已达成拉闸条件 */
  leverKeys: null, leverBuffUntil: 0, leverArmed: false,
});

const getState = (pId) => G.players.get(pId);

/* ===== 玩家地图选择:唯一解析口(单一状态源) =====
 * 状态存 G.players(pId).mapKey,本模块独有,杜绝跨模块状态失联;
 * db(mapKey键)做持久化兜底,重进服务器自动恢复。
 * menu.js / loot.js 一律通过 globalThis.__getPlayerMapKey 读取,不得自行缓存
 * 性能: 玩家状态存在时mapKey即权威,绝不回源db(否则未选图玩家每tick打一次API);
 *       仅贴码后状态缺失的窗口期走db,并用缓存挡住重复查询 */
const lobbyMapKeyCache = new Map();   // pId -> mapKey(仅用于无状态窗口期,离线清除)
const getPlayerMapKey = (pId) => {
  const d = G.players.get(pId);
  if (d) {
    if (d.mapKey && MAPS[d.mapKey]) return d.mapKey;
    return null;   // 状态存在但未选图: 不回源(initPlayer已恢复过db)
  }
  const cached = lobbyMapKeyCache.get(pId);
  if (cached !== undefined) return cached && MAPS[cached] ? cached : null;
  const saved = db.getMapKey(pId);
  const resolved = (saved && MAPS[saved]) ? saved : null;
  lobbyMapKeyCache.set(pId, resolved);
  return resolved;
};
globalThis.__getPlayerMapKey = getPlayerMapKey;

const countRaiders = () => {
  let n = 0;
  G.players.forEach((d) => { if (d.inRaid) n++; });
  return n;
};

/* 当前有玩家行动中的地图集合(按图独立刷怪) */
const activeMapKeys = () => {
  const set = new Set();
  G.players.forEach((d, pId) => {
    if (!d.inRaid) return;
    const mk = getPlayerMapKey(pId);
    if (mk) set.add(mk);
  });
  return set;
};

/* ===== 撤离点光点同步(mesh entity,按图共享) =====
 * 有玩家行动的图: 确保每个撤离点都有常驻绿色光点(球体,emissive发光);
 * 无人行动的图: 删除光点。幂等,进图/onTick周期调用皆可。 */
const markerMaps = new Set();
const syncExtractMarkers = () => {
  const active = activeMapKeys();
  active.forEach((mk) => {
    if (!markerMaps.has(mk)) {
      createExtractMarkers(mk);
      markerMaps.add(mk);
    }
  });
  setToArray(markerMaps).forEach((mk) => {
    if (!active.has(mk)) {
      removeExtractMarkers(mk);
      markerMaps.delete(mk);
    }
  });
};

/* 服主检测(含 zhongmo_xinhao48) */
const isWhitelisted = (pId) => {
  try { return CONST.whitelist.includes(api.getEntityName(pId)); } catch(e) { return false; }
};

/* menu.js查询行动状态(购买装备/保险/刀皮时拦截) */
globalThis.__isRaiding = (pId) => {
  const d = getState(pId);
  return !!(d && d.inRaid);
};

/* 冲刺结束后由operators.js回调,按 干员被动x负重 重算移速 */
globalThis.onSpeedRecalc = (pId) => { updateWeight(pId); };

/* ===== 工具 ===== */

/* 读取并保存装备槽物品(1武器 + 38-42护甲),进图重置时保留 */
const preserveGear = (pId) => {
  const preserved = [];
  for (const slot of [GEAR.weaponSlot, ...GEAR.armorSlots]) {
    try {
      const item = api.getItemSlot(pId, slot);
      if (item && item.name) preserved.push({ slot, name: item.name, amount: item.amount || 1, ench: parseEnchants(item) });
    } catch(e) {}
  }
  return preserved;
};

const restoreGear = (pId, preserved) => {
  for (const it of preserved || []) {
    const ench = Object.assign({}, it.ench || {});
    /* 认证附魔统一写到配置键名(sanjiaozhou),原等级保留 */
    let markerLvl = 0;
    for (const k of Object.keys(ench)) {
      if (k.toLowerCase() === GEAR.markerEnch.toLowerCase()) {
        markerLvl = Number(ench[k]) || 1;
        if (k !== GEAR.markerEnch) delete ench[k];
      }
    }
    ench[GEAR.markerEnch] = markerLvl || GEAR.tierScores[it.name] || 1;
    try { api.setItemSlot(pId, it.slot, it.name, it.amount, ench); } catch(e) {
      try { api.setItemSlot(pId, it.slot, it.name, it.amount); } catch(e2) {}
    }
  }
};

/* 按刀皮发主武器(仅当武器格为空) */
const giveKnifeIfEmpty = (pId) => {
  try {
    const cur = api.getItemSlot(pId, GEAR.weaponSlot);
    if (cur && cur.name) return;
    const skinKey = db.getKnifeSkin(pId);
    const skin = STATUS.knifeSkins.find(s => s.key === skinKey) || STATUS.knifeSkins[0];
    giveMarkedItem(pId, GEAR.weaponSlot, skin.item, 1, GEAR.tierScores[skin.item] || 1);
  } catch(e) {}
};

/* 关闭玩家对所有人的攻击(新加入玩家也默认关闭)
 * 双向都关: 既有"该玩家看别人"(setEveryoneSettingForPlayer),也有"别人看该玩家"(setTargetedPlayerSettingForEveryone) */
const disablePvpFor = (pId) => {
  try { api.setEveryoneSettingForPlayer(pId, 'canAttack', false, true); } catch(e) {}
  try { api.setTargetedPlayerSettingForEveryone(pId, 'canAttack', false, true); } catch(e) {}
  /* 兜底: 逐对显式设置 */
  for (const otherId of api.getPlayerIds()) {
    if (otherId === pId) continue;
    try { api.setOtherEntitySetting(pId, otherId, 'canAttack', false); } catch(e2) {}
    try { api.setOtherEntitySetting(otherId, pId, 'canAttack', false); } catch(e2) {}
  }
};

/* 进图PVP: 只要对局中即可对同图行动中非队友玩家开火(不限区域,撤离/死亡时disablePvpFor统一关闭) */
const enableRaidPvp = (pId) => {
  for (const otherId of api.getPlayerIds()) {
    if (otherId === pId) continue;
    const od = getState(otherId);
    if (!od || !od.inRaid || !od.alive) continue;
    if (getPlayerMapKey(otherId) !== getPlayerMapKey(pId)) continue;
    if (isSameTeam(pId, otherId)) continue;          // 队友永不禁友伤
    try { api.setOtherEntitySetting(pId, otherId, 'canAttack', true); api.setOtherEntitySetting(otherId, pId, 'canAttack', true); } catch(e) {}
  }
};

/* ===== 玩家初始化(待命区) ===== */
/* initPlayer: keepInv=true时(进图)保留玩家全部背包物品,不清空不发刀不覆盖箭
 * keepInv=false时(首次进服)完整重置:清背包+发刀皮+发箭 */
const initPlayer = (pId, keepInv) => {
  try {
    const prev = G.players.get(pId);
    let keptMapKey = (prev && prev.mapKey) || null;   // 保留已选地图
    const preserved = keepInv ? null : preserveGear(pId);   // 装备带出带入:武器+护甲保留(仅清包模式)
    if (!keepInv) api.clearInventory(pId);
    api.setClientOption(pId, 'creative', false);
    api.setClientOption(pId, 'canChange', false);
    api.setClientOption(pId, 'invincible', true);   // 待命区免伤,进入行动后解除
    api.setClientOption(pId, 'maxHealth', CONST.maxHP);
    api.setClientOption(pId, 'initialHealth', CONST.maxHP);
    api.setClientOption(pId, 'secsToRespawn', 3);
    api.setClientOption(pId, 'canSeeNametagsThroughWalls', false);
    api.setClientOption(pId, 'speedMultiplier', 1.0);
    G.players.set(pId, createPlayerState());
    if (!keptMapKey) {
      const saved = db.getMapKey(pId);
      if (saved && MAPS[saved]) keptMapKey = saved;
    }
    G.players.get(pId).mapKey = keptMapKey;
    if (!keepInv) restoreGear(pId, preserved);
    initPlayerOperator(pId);          // 恢复干员并下发技能物品(2/3/4格,缺啥补啥不覆盖)
    /* [2026-11-13 新增] 2/3/4格如果仍是空的(没选干员/干员无技能), 塞一个 Invisible Solid 占位,
     * 防止玩家拿这三格放违禁品/捡不该捡的东西; 已被技能物品占了的不动 */
    try {
      for (const slot of [2, 3, 4]) {
        let it = null;
        try { it = api.getItemSlot(pId, slot); } catch(e) { continue; }
        if (!it || !it.name) {
          api.setItemSlot(pId, slot, 'Invisible Solid', 1);
        }
      }
    } catch(e) {}
    loot_initStarterInsurance(pId);   // 初始化免费保险
    /* 三角洲行动: 进服/回大厅时从仓库拉回撤离成功的战利品(keepInv=false 才拉, 进图时背包不清空) */
    if (!keepInv) {
      try { const whLoaded = loadLootFromWarehouse(pId); if (whLoaded > 0) api.sendMessage(pId, [{ str: `📦 从仓库取回 ${whLoaded} 件物品`, style: { color: THEME.gold } }]); } catch(e) {}
    }
    if (!keepInv) {
      giveKnifeIfEmpty(pId);            // 武器格为空时按刀皮发刀
      giveMarkedItem(pId, 5, 'Arrow', 64, 1);   // 快捷栏5:箭
    } else {
      try { const a5 = api.getItemSlot(pId, 5); if (!a5 || !a5.name) giveMarkedItem(pId, 5, 'Arrow', 64, 1); } catch(e) {}
    }
    api.setHealth(pId, CONST.maxHP);
    teleportToSpawn(pId, MAPS[G.players.get(pId).mapKey]);  // 传送到自己选择的地图出生点
    clearPlayerZone(pId);
    disablePvpFor(pId);               // 默认全员PVP关闭,进搜索区后开启
  } catch(e) {}
};

/* ===== 任务/称号/段位 ===== */

const questProgress = (pId, type, amount) => {
  try {
    const q = db.getQuests(pId);
    q.done = q.done || {};
    let changed = false;
    for (const [qk, qc] of Object.entries(CONST.quests)) {
      if (qc.type !== type || q.done[qk]) continue;
      q[qk] = (q[qk] || 0) + amount;
      changed = true;
      if (q[qk] >= qc.target) {
        q.done[qk] = true;
        db.addMoney(pId, qc.reward);
        try {
          api.sendFlyingMiddleMessage(pId, [
            {str:`🏆 任务完成: ${qc.name}`, style:{color:THEME.gold,fontWeight:'bold',fontSize:'1.4rem'}},
            {str:` +${qc.reward}💰`, style:{color:THEME.success,fontWeight:'bold'}},
          ], 5, 3000);
        } catch(e) {}
      }
    }
    if (changed) db.setQuests(pId, q);
  } catch(e) {}
};

const checkTitle = (pId) => {
  try {
    const s = db.getStats(pId);
    let best = 'rookie';
    for (const [tk, t] of Object.entries(CONST.titles)) {
      if ((s.extracts || 0) >= t.req.extracts) best = tk;
    }
    if (best !== db.getTitle(pId)) {
      db.setTitle(pId, best);
      const t = CONST.titles[best];
      try {
        api.sendFlyingMiddleMessage(pId, [
          {str:`🎖 获得称号: ${t.name}`, style:{color:t.color,fontWeight:'bold',fontSize:'1.5rem'}},
        ], 5, 3000);
      } catch(e) {}
    }
  } catch(e) {}
};

/* 排行榜:段位+KD+存款标签,段位颜色名字;升段播报 */
/* ===== 排行榜(大厅Tab面板) =====
 * 关键点(踩过的坑):
 * 1. lobbyLeaderboardInfo(列定义)是每玩家客户端选项,不配置它整个面板不显示;
 *    贴代码时已在线的玩家不会重新触发onJoin → 必须周期性补发,不能只在onJoin设
 * 2. 名字颜色nameColour只接受命名颜色(orange/yellow/aqua...),hex会静默失效
 * 3. "别人看这个玩家"的设置必须用setTargetedPlayerSettingForEveryone(方向别反)
 * 4. 数值列lobbyLeaderboardValues只放数字最稳;段位/称号文字走名字左侧标签lobbyLeaderboardTags */

const LOBBY_LEADERBOARD_INFO = {
  name:  { displayName: '玩家', sortPriority: 0 },
  kd:    { displayName: 'KD', sortPriority: 1 },
  money: { displayName: '存款', sortPriority: 2 },
};

const setupLeaderboardPanel = (pId) => {
  try { api.setClientOption(pId, 'lobbyLeaderboardInfo', LOBBY_LEADERBOARD_INFO); } catch(e) {}
};

const updatePlayerBoard = (pId) => {
  try {
    const rank = db.getRank(pId);
    const s = db.getStats(pId);
    const kd = (s.deaths || 0) > 0 ? ((s.kills || 0) / (s.deaths || 1)) : (s.kills || 0);
    const money = db.getMoney(pId);
    setupLeaderboardPanel(pId);   // 周期性补发面板列定义(覆盖贴码时已在线的玩家)
    /* 名字颜色: 命名颜色;排行榜行色: 任意hex */
    try { api.setTargetedPlayerSettingForEveryone(pId, 'nameColour', rank.nameColor || 'default', true); } catch(e) {}
    try { api.setTargetedPlayerSettingForEveryone(pId, 'colorInLobbyLeaderboard', rank.color, true); } catch(e) {}
    /* 数值列(纯数字,键=列id) */
    try { api.setTargetedPlayerSettingForEveryone(pId, 'lobbyLeaderboardValues', { kd: Number(kd.toFixed(2)) || 0, money: money }, true); } catch(e) {}
    /* 名字左侧标签: 段位+称号文字(尽力而为,格式不对也只是不显示) */
    const titleObj = CONST.titles[db.getTitle(pId)] || CONST.titles.rookie;
    try { api.setTargetedPlayerSettingForEveryone(pId, 'lobbyLeaderboardTags', [rank.name, titleObj.name], true); } catch(e) {}
    /* 升段播报(只升不降) */
    const seen = db.getRankSeen(pId);
    const curIdx = RANKS.findIndex(r => r.key === rank.key);
    const seenIdx = seen ? RANKS.findIndex(r => r.key === seen) : -1;
    if (curIdx > seenIdx) {
      db.setRankSeen(pId, rank.key);
      try {
        api.broadcastMessage([
          {str:`🏅 ${api.getEntityName(pId)} 晋升段位: ${rank.name}!`, style:{color:rank.color,fontWeight:'bold',fontSize:'1.2rem'}},
        ]);
      } catch(e) {}
    }
  } catch(e) {}
};

/* Money入口实现(index.js把它绑成主世界代码的全局Money;世界代码内部也可直接用) */
const moneyEntry = (pId, amount) => {
  amount = Math.floor(Number(amount) || 0);
  if (amount >= 0) db.addMoney(pId, amount);
  else db.subMoney(pId, -amount);
  try { updatePlayerBoard(pId); } catch(e) {}
  return db.getMoney(pId);
};
globalThis.Money = moneyEntry;
/* 金钱校验接口(index.js绑成全局CheckMoney;也可直接调用):
 * 检测玩家剩余钱数是否 ≥ 传参值 —— 小于返回false,大于等于返回true */
const checkMoney = (pId, amount) => {
  const need = Math.floor(Number(amount) || 0);
  return (db.getMoney(pId) || 0) >= need;
};
globalThis.CheckMoney = checkMoney;
/* 摸金调用口(index.js绑成全局Mojin,Code Block可直接调用):
 * Mojin(类型, x, y, z) —— 类型=地图key 或 箱子样式key; 在坐标箱子装填摸金物品(带sanjiaozhou),返回格数 */
const mojin = (type, x, y, z) => loot.mojinFill(type, x, y, z);
globalThis.Mojin = mojin;
/* 变卖商人出售计入 搜刮 任务进度 */
globalThis.onLootSold = (pId, earned) => { try { questProgress(pId, 'loot', earned); } catch(e) {} };

/* ===== 每日签到(index.js绑成全局Checkin;/签到指令/主菜单按钮共用) =====
 * 核心逻辑在 db.doCheckin(不依赖 globalThis 跨模块);此处只负责成功播报与面板刷新 */
const doCheckin = (pId) => {
  let r;
  try { r = db.doCheckin(pId); }
  catch(e) { return { success: false, reason: '签到异常: ' + ((e && e.message) ? e.message : e) }; }
  if (r && r.success) {
    try {
      api.sendFlyingMiddleMessage(pId, [
        {str:`📅 签到成功 第${r.streak}天`, style:{color:'#FFD700',fontWeight:'bold',fontSize:'1.5rem'}},
        {str:` +${r.reward}💰 (连签奖励)`, style:{color:'#00FF00',fontWeight:'bold'}},
      ], 5, 3000);
    } catch(e) {}
    try { updatePlayerBoard(pId); } catch(e) {}
  }
  return r;
};
globalThis.Checkin = doCheckin;

/* ===== 任务接口(index.js绑成全局Quest) =====
 * Quest(玩家id) → 全部任务进度快照;Quest(玩家id, 类型, 数量) → 加进度(达标自动发奖) */
const questInterface = (pId, type, amount) => {
  try {
    if (type === undefined) {
      const q = db.getQuests(pId);
      const out = {};
      for (const [qk, qc] of Object.entries(CONST.quests)) {
        out[qk] = { name: qc.name, progress: Math.min(q[qk] || 0, qc.target), target: qc.target, done: !!(q.done && q.done[qk]), reward: qc.reward };
      }
      return out;
    }
    if (!CONST.quests || !Object.values(CONST.quests).some(qc => qc.type === type)) {
      return { success: false, reason: `未知任务类型: ${type}(可用: kill/extract/loot)` };
    }
    amount = Math.floor(Number(amount) || 0);
    if (amount === 0) return { success: false, reason: '进度增量不能为0' };
    questProgress(pId, type, amount);
    return { success: true, quests: questInterface(pId) };
  } catch(e) {
    return { success: false, reason: '任务接口异常: ' + (e && e.message) };
  }
};
globalThis.Quest = questInterface;

const updateLeaderboard = () => {
  for (const pId of api.getPlayerIds()) updatePlayerBoard(pId);
};

/* ===== 个人行动流程 ===== */

globalThis.onDeployRequest = (pId) => {
  const d = getState(pId);
  if (d && d.inRaid) {
    try { api.sendFlyingMiddleMessage(pId, [{str:'你正在行动中', style:{color:'#FFAA00',fontWeight:'bold'}}], 5, 1500); } catch(e) {}
    return false;
  }
  if (!getPlayerOperator(pId)) {
    try { api.sendFlyingMiddleMessage(pId, [{str:'请先选择干员!', style:{color:'#FF0000',fontWeight:'bold',fontSize:'1.5rem'}}], 5, 2000); } catch(e) {}
    return false;
  }
  const mapKey = getPlayerMapKey(pId);
  if (!mapKey) {
    try { api.sendFlyingMiddleMessage(pId, [{str:'请先选择地图!', style:{color:'#FF0000',fontWeight:'bold',fontSize:'1.5rem'}}], 5, 2000); } catch(e) {}
    return false;
  }
  const map = MAPS[mapKey];
  if (!map || map.disabled) {   /* 坐标未填/维护中的图禁止进图, 防止传送到 0,0,0 卡死 */
    try { api.sendFlyingMiddleMessage(pId, [{str:'该地图暂未开放', style:{color:'#FF0000',fontWeight:'bold',fontSize:'1.5rem'}}], 5, 2000); } catch(e) {}
    return false;
  }
  /* 战备值门槛校验 */
  const req = map.gearReq || 0;
  if (!isWhitelisted(pId) && req > 0) {
    const gear = calculateGearScore(pId);
    if (gear < req) {
      try {
        api.sendFlyingMiddleMessage(pId, [
          {str:`⛔ 战备值不足!`, style:{color:'#FF0000',fontWeight:'bold',fontSize:'1.4rem'}},
          {str:` 当前${gear}/需要${req}`, style:{color:'#FFAA00',fontWeight:'bold'}},
          {str:` (装备附魔可提升)`, style:{color:'#4DA6FF'}},
        ], 5, 3000);
      } catch(e) {}
      return false;
    }
  }
  enterRaid(pId);
  return true;
};

/* 选图(玩家独立,只影响自己): 写入本模块状态+db持久化,不传送不自动进图 */
globalThis.onMapSelectRequest = (pId, mapKey) => {
  if (!MAPS[mapKey] || MAPS[mapKey].disabled) return;
  const d = getState(pId);
  if (d && d.inRaid) { try { api.sendFlyingMiddleMessage(pId, [{str:'行动中无法换图', style:{color:'#FF0000'}}], 5, 1500); } catch(e) {} return; }
  if (!d) G.players.set(pId, createPlayerState());
  const sd = G.players.get(pId);
  sd.mapKey = mapKey;              // 内存记录(立即生效)
  db.setMapKey(pId, mapKey);       // db持久化(重进恢复)
  try {
    api.sendMessage(pId, [
      {str:`✅ 地图已记录: ${MAPS[mapKey].name}`, style:{color:THEME.info,fontWeight:'bold'}},
      {str:` (${MAPS[mapKey].searchTime}秒 | 战备门槛${MAPS[mapKey].gearReq || 0})`, style:{color:THEME.secondary}},
    ]);
  } catch(e) {}
};

/* 进入行动:重置并传送该玩家本人到其地图的搜索区 */
const enterRaid = (pId) => {
  const mapKey = getPlayerMapKey(pId);
  const map = mapKey ? MAPS[mapKey] : null;
  if (!map) return;
  initPlayer(pId, true);   // 进图保留全部背包物品(不清装备不清物资)
  const d = getState(pId);
  if (!d) return;
  d.inRaid = true;
  d.alive = true;
  d.timeLeft = map.searchTime;
  d.loot = 0;
  d.kills = 0;
  d.extracting = false;
  d.extTime = 0;
  d.extTotal = 0;
  d.extKey = null;
  d.extWarnAt = 0;
  d.zone = 'search';
  d.exfilBlocked = 0;
  d.extractExfil = null;
  /* 拉闸状态: 每局重置,禁止跨局残留 */
  d.leverKeys = new Set();
  d.leverBuffUntil = 0;
  d.leverArmed = false;
  /* 随机撤离点: 每局只开放1处(无随机点的老图为null) */
  const rands = (map.exfils || []).filter(e => e.type === '随机');
  d.openRandomKey = rands.length ? rands[Math.floor(Math.random() * rands.length)].key : null;
  team_setInMatch(pId, true);
  if (countRaiders() === 1) resetMobTick();
  enableRaidPvp(pId);   // 只要进图即可对同图行动中非队友开火(不再要求搜索区)
  try {
    api.setClientOption(pId, 'invincible', false);   // 解除待命区保护
    api.setHealth(pId, CONST.maxHP);
    clearPlayerZone(pId);
    teleportToSearch(pId, map);
    /* 撤离点导航箭头(三角洲式指引,指向最近的撤离点) */
    const ext = getNearestExfilCenter(pId, map);
    if (ext) {
      try { api.setDirectionArrow(pId, 'extract', ext, '撤离点', true, {colour: THEME.success}); } catch(e) {}
    }
  } catch(e) {}
  updateWeight(pId);
  syncExtractMarkers();   // 撤离点光点立即点亮(幂等)
  try {
    const exfilInfo = (map.exfils
      ? `本图 ${map.exfils.length} 处撤离点: ${unique(map.exfils.map(e => e.type)).join('/')}` +
        (d.openRandomKey ? ` | 本局随机点: ${map.exfils.find(e => e.key === d.openRandomKey).name}` : '') + '\n'
      : '') + `撤离读条: 绿羊毛 ${EXTRACT.readSec.green}秒 | 红羊毛 ${EXTRACT.readSec.red}秒 | 黑羊毛需先拉闸\n`;
    api.sendMessage(pId, [
      {str:`\n⚔ 进入 ${map.name} ⚔\n`, style:{color:THEME.primary,fontWeight:'bold',fontSize:'1.6rem'}},
      {str:`搜索时间: ${Math.floor(map.searchTime/60)}分${map.searchTime%60}秒\n`, style:{color:THEME.secondary}},
      {str:'进图即可PVP与摸金,踩撤离羊毛完成读条撤离,失败将丢失背包\n', style:{color:THEME.danger}},
      {str:exfilInfo, style:{color:THEME.success}},
    ]);
  } catch(e) {}
};

/* 死亡掉落: 把背包物品(0-45格,跳过保险格)掉在阵亡点附近地面
 * - 物品实例的 attributes 原样带出(违禁品/配件/附魔/自定义名不丢)
 * - 1格武器 + 2/3/4格干员技能/补给由复活逻辑自动补发,不参与掉落(否则会复制)
 * - 47-51护甲/副手按原规则保留
 * - 多件物品按 0.55 格小范围散开,避免全部堆在同一格;引擎掉落实体上限满时该件丢失 */
const dropBackpackOnDeath = (pId, pos) => {
  const insured = insuredSlotsOf(pId) || [];
  /* 保留槽位: 只有主武器(slot 1, 死亡补刀用) + 保险格
   * —— 护甲 47-51 / outfit 52-53 / 快捷栏 0,2,3,4 / 背包 5-45 全部一起掉 (三角洲行动全装备掉落语义) */
  const skip = new Set();
  skip.add(GEAR.weaponSlot);
  const bx = Array.isArray(pos) && pos.length >= 3 ? Number(pos[0]) || 0 : 0;
  const by = Array.isArray(pos) && pos.length >= 3 ? Number(pos[1]) || 0 : 0;
  const bz = Array.isArray(pos) && pos.length >= 3 ? Number(pos[2]) || 0 : 0;
  let dropped = 0, lost = 0, idx = 0;
  /* 循环上限 51: 覆盖 0-45 背包 + 47-51 护甲 (Bloxd 无 52-53 outfit 槽) */
  for (let i = 0; i <= 51; i++) {
    if (skip.has(i) || insured.includes(i)) continue;
    let it = null;
    try { it = api.getItemSlot(pId, i); } catch(e) { it = null; }
    if (!it || !it.name) continue;
    const dx = ((idx % 5) - 2) * 0.55;
    const dz = ((Math.floor(idx / 5) % 5) - 2) * 0.55;
    const dy = 0.35 + (Math.floor(idx / 25) % 2) * 0.45;
    let ok = false;
    try {
      ok = !!api.createItemDrop(bx + dx, by + dy, bz + dz, it.name, it.amount || 1, false, it.attributes, 300000, pId);
    } catch(e) { ok = false; }
    if (ok) dropped++; else lost++;
    /* 掉落成功与否都清空该格: 死亡不应保留原件(防复制) */
    try { api.setItemSlot(pId, i, 'Air', 0, null, true); } catch(e) {}
    idx++;
  }
  return { dropped, lost };
};

/* 退出行动: mode = 'extract' | 'dead' | 'timeout' | 'quit' | 'disconnect'
 * 语义: dead=被击杀/摔死 → 背包掉地面; timeout/quit(主动/jt)/disconnect(断线) → 按原逻辑清空 */
const exitRaid = (pId, mode) => {
  const d = getState(pId);
  if (!d || !d.inRaid) return;
  const finishedExfil = d.extractExfil;
  /* 死亡点必须在传送前取(用于掉落位置) */
  let deathPos = null;
  if (mode === 'dead') { try { deathPos = api.getPosition(pId); } catch(e) {} }
  d.inRaid = false;
  d.alive = false;
  d.extracting = false;
  d.extTime = 0;
  d.extTotal = 0;
  d.extKey = null;
  d.extWarnAt = 0;
  d.extractExfil = null;
  /* 拉闸限制/计数/buff: 撤离成功、死亡、超时、退出都清空,下一把重新开始 */
  d.leverKeys = null;
  d.leverBuffUntil = 0;
  d.leverArmed = false;

  cancelChestQTE(pId);   // 任何退出路径都终止进行中的开箱QTE

  let earned = 0;
  let dropInfo = null;
  let whSaved = 0;
  if (mode === 'extract') {
    /* 撤离成功(三角洲行动语义): 非保险格物品自动存进仓库(db), 大保险+小保险格物品直接带回大厅
     * initPlayer 时再从仓库拉回玩家背包; 丢包撤离点: 直接清空非保险格 */
    if (finishedExfil && finishedExfil.type === '丢包') {
      try { clearBagKeepInsured(pId); } catch(e) {}
    } else {
      /* 先入库、再清非保险格: 只入库不清包 = 背包原件 + 仓库副本, 可反复撤离刷物资 */
      try { whSaved = saveLootToWarehouse(pId); } catch(e) {}
      try { clearBagKeepInsured(pId); } catch(e) {}
    }
    db.updateStats(pId, 'extracts');
    questProgress(pId, 'extract', 1);
    checkTitle(pId);
  } else if (mode === 'dead') {
    /* 死亡: 背包掉落在阵亡点地面,保险格/护甲保留 */
    try { dropInfo = dropBackpackOnDeath(pId, deathPos); } catch(e) { dropInfo = { dropped: 0, lost: 0 }; }
    try { giveKnifeIfEmpty(pId); } catch(e) {}
    db.updateStats(pId, 'deaths');
  } else {
    /* 超时/主动退出/断线: 沿用原逻辑,背包+快捷栏全部清空,保险格与身上装备保留 */
    try { clearAllKeepInsured(pId); } catch(e) {}
    try { giveKnifeIfEmpty(pId); } catch(e) {}   // 清空后补回基础刀,避免待命区空手
    db.updateStats(pId, 'deaths');
  }
  d.loot = earned;

  disablePvpFor(pId);
  try {
    api.setClientOption(pId, 'invincible', true);
    api.setHealth(pId, CONST.maxHP);
    teleportToSpawn(pId, MAPS[getPlayerMapKey(pId)]);
  } catch(e) {}
  try { api.clearDirectionArrow(pId, 'extract'); } catch(e) {}
  try { api.progressBarUpdate(pId, 0, 200); } catch(e) {}
  team_setInMatch(pId, false);
  clearPlayerZone(pId);
  try { fittings.invalidateHeld(pId); } catch(e) {}   // 背包已变动,配件缓存失效
  updateWeight(pId);

  const head = mode === 'extract'
    ? {str:'✅ 撤离成功!', style:{color:THEME.success,fontWeight:'bold',fontSize:'1.5rem'}}
    : (mode === 'timeout'
      ? {str:'⏰ 撤离失败(超时)', style:{color:THEME.danger,fontWeight:'bold',fontSize:'1.5rem'}}
      : (mode === 'quit' || mode === 'disconnect'
        ? {str:'🚪 已退出对局', style:{color:THEME.warning || THEME.gold,fontWeight:'bold',fontSize:'1.5rem'}}
        : {str:'💀 撤离失败', style:{color:THEME.danger,fontWeight:'bold',fontSize:'1.5rem'}}));
  let detail;
  if (mode === 'extract') {
    const whMsg = whSaved > 0 ? `, ${whSaved}件物品已存入仓库(进服自动取回)` : '';
    detail = {str:`\n${(finishedExfil && finishedExfil.type === '丢包') ? '（丢包撤离）背包物资已丢弃,保险格物品保留' : '撤离成功! 战利品已存入仓库'}${whMsg} | 击杀: ${d.kills}\n`, style:{color:THEME.gold,fontWeight:'bold'}};
  } else if (mode === 'dead') {
    const n = dropInfo ? dropInfo.dropped : 0;
    const l = dropInfo ? dropInfo.lost : 0;
    detail = {str:`\n背包物品已掉落在阵亡点(${n}件)${l > 0 ? `,${l}件因掉落上限丢失` : ''}(保险格与身上装备保留) | 击杀: ${d.kills}\n`, style:{color:THEME.gray}};
  } else {
    detail = {str:`\n背包+快捷栏已清空(保险格物品与身上装备保留) | 击杀: ${d.kills}\n`, style:{color:THEME.gray}};
  }
  try { api.sendMessage(pId, [head, detail]); } catch(e) {}
  updatePlayerBoard(pId);
  openMapMenu(pId);   // 单链流程: 退出对局回到首步选图(主菜单已删除)
};

/* ===== 区域检测与UI ===== */

/* ===== 撤离判定(maps.js 区域检测 + 羊毛颜色 + exfil.type 规则) ===== */

/* 脚下方块名(兼容字符串/对象;主API + y-1/y-2/y 兜底,大小写不敏感) */
const blockNameOf = (b) => (b && typeof b === 'object') ? String(b.name || '') : String(b || '');
const standingBlockOf = (pId) => {
  try {
    const types = api.getBlockTypesPlayerStandingOn(pId);
    if (Array.isArray(types)) {
      for (const t of types) {
        const nm = blockNameOf(t);
        if (nm) return nm;
      }
    }
  } catch(e) {}
  try {
    const pos = api.getPosition(pId);
    for (const dy of [1, 2, 0]) {
      const nm = blockNameOf(api.getBlock(Math.floor(pos[0]), Math.floor(pos[1]) - dy, Math.floor(pos[2])));
      if (nm && nm.toLowerCase() !== 'air') return nm;
    }
  } catch(e) {}
  return '';
};

/* 羊毛颜色 → 撤离类型(green/red/black),非撤离羊毛返回 null */
const woolKindOf = (name) => {
  const lname = String(name || '').toLowerCase();
  if (EXTRACT && EXTRACT.wool) return EXTRACT.wool[lname] || null;
  const legacy = (CONST.extractBlocks || ['Green Wool', 'Lime Wool']).map(b => String(b).toLowerCase());
  return legacy.includes(lname) ? 'green' : null;
};

/* 拉闸次数要求: 撤离点 leverRequired > 地图 leverRequired > 默认值 */
const leverRequiredOf = (map, exfil) => {
  const raw = (exfil && exfil.leverRequired != null) ? exfil.leverRequired
    : (map && map.leverRequired != null) ? map.leverRequired
    : ((EXTRACT && EXTRACT.leverRequiredDefault) || 1);
  const n = Math.floor(Number(raw));
  return (isFinite(n) && n > 0) ? n : 1;
};

/* 取消读条并清零进度 */
const cancelExtract = (d) => {
  if (d.extracting || d.extTime) {
    d.extracting = false; d.extTime = 0; d.extTotal = 0; d.extKey = null; d.extractExfil = null;
  }
};

/* 撤离受阻提示(每人3秒最多一条,防刷屏) */
const warnExfil = (pId, d, msg) => {
  const now = Date.now();
  if (now - (d.extWarnAt || 0) < 3000) return;
  d.extWarnAt = now;
  try { api.sendFlyingMiddleMessage(pId, [{str: msg, style:{color:THEME.secondary, fontWeight:'bold'}}], 5, 1500); } catch(e) {}
};

/* 撤离点按名字查找(大小写/空格不敏感;也接受 key) */
const findExfilByName = (map, name) => {
  if (!map || !Array.isArray(map.exfils)) return null;
  const want = String(name || '').trim().toLowerCase();
  if (!want) return null;
  for (const ex of map.exfils) {
    if (String(ex.name || '').trim().toLowerCase() === want) return ex;
    if (String(ex.key || '').trim().toLowerCase() === want) return ex;
  }
  return null;
};

/* ===== 拉闸接口(条件撤离) =====
 * pullLever(玩家名, 撤离点名字)
 *   → { ok, reason?, exfil?, count, required, buff, buffUntil }
 * 同一地图、同一对局内每个撤离点只能拉一次(重复调用不计数并返回失败原因);
 * 达标后给 EXTRACT.leverBuffMs(5分钟) buff,踩黑色羊毛时消耗 buff 并进入 5 秒读条 */
const pullLever = (playerName, exfilName) => {
  try {
    const pId = findOnlinePlayer(playerName);
    if (pId == null) return { ok:false, reason:'玩家不在线' };
    const d = getState(pId);
    if (!d || !d.inRaid || !d.alive) return { ok:false, reason:'玩家不在行动中' };
    const map = MAPS[getPlayerMapKey(pId)];
    if (!map) return { ok:false, reason:'玩家未选择地图' };
    const ex = findExfilByName(map, exfilName);
    if (!ex) return { ok:false, reason:`该地图没有撤离点: ${exfilName}` };
    const required = leverRequiredOf(map, ex);
    if (!d.leverKeys) d.leverKeys = new Set();
    if (d.leverKeys.has(ex.key)) {
      return { ok:false, reason:`本局已拉过「${ex.name}」,不能重复拉闸`, count:d.leverKeys.size, required, buff:false };
    }
    d.leverKeys.add(ex.key);
    const count = d.leverKeys.size;
    const reached = count >= required;
    if (reached) {
      const buffMs = (EXTRACT && EXTRACT.leverBuffMs) || 300000;
      d.leverBuffUntil = Math.max(d.leverBuffUntil || 0, Date.now() + buffMs);
      d.leverArmed = true;   // 本局已达成条件,读条中断后仍可再次撤离(防软锁)
      try {
        api.sendFlyingMiddleMessage(pId, [
          {str:`⚡ 拉闸完成 ${count}/${required}!`, style:{color:THEME.success, fontWeight:'bold', fontSize:'1.3rem'}},
          {str:`\n获得 ${Math.floor(buffMs/60000)} 分钟撤离buff,可踩黑色羊毛撤离`, style:{color:THEME.gold}},
        ], 5, 2500);
      } catch(e) {}
    } else {
      try {
        api.sendFlyingMiddleMessage(pId, [{str:`🔧 已拉闸「${ex.name}」 ${count}/${required}`, style:{color:THEME.info, fontWeight:'bold'}}], 5, 1500);
      } catch(e) {}
    }
    return { ok:true, exfil:ex.name, count, required, buff:reached, buffUntil:reached ? d.leverBuffUntil : 0 };
  } catch(e) {
    return { ok:false, reason:'拉闸异常: ' + ((e && e.message) || e) };
  }
};
globalThis.PullLever = pullLever;

const checkZones = () => {
  const now = Date.now();
  for (const pId of api.getPlayerIds()) {
    const d = getState(pId);
    if (!d || !d.inRaid || !d.alive) continue;
    const mk = getPlayerMapKey(pId);
    const map = mk ? MAPS[mk] : null;
    updatePlayerZone(pId, map);            // 同时刷新 maps.js activeExfils 缓存
    d.zone = getCachedZone(pId);

    const exfil = getActiveExfil(pId);                  // 区域检测(maps.js 唯一来源)
    const woolKind = woolKindOf(standingBlockOf(pId));  // 羊毛颜色 → 行为
    if (!woolKind) { cancelExtract(d); continue; }      // 没踩撤离羊毛: 不撤离

    /* 本图有 exfils 配置时,必须命中真实撤离点: 装饰性羊毛(dam停车场黑羊毛等)一律不算,
     * 不再合成 legacy 撤离点,避免任何羊毛都能免费撤离 */
    const hasExfils = !!(map && Array.isArray(map.exfils) && map.exfils.length > 0);
    if (hasExfils && !exfil) {
      cancelExtract(d);
      warnExfil(pId, d, '⚠ 此处的羊毛不是撤离点');
      continue;
    }

    /* 老图/未登记 exfils 的区域: 合成常规撤离点(仅无 exfils 配置的地图) */
    const ex = exfil || { key:'__legacy__', name:'撤离区', type:'固定' };

    /* 随机撤离点: 每局只开放 1 处 */
    if (ex.type === '随机' && ex.key !== d.openRandomKey) {
      cancelExtract(d);
      warnExfil(pId, d, `⚠「${ex.name}」本局未开放`);
      continue;
    }

    /* 条件撤离(黑色羊毛): 需要拉闸 buff —— 老图无 exfils 配置(合成点)时没有闸可拉,按常规撤离处理
     * 状态机:
     *   leverBuffUntil > now      → buff 有效,消耗并进入读条
     *   leverBuffUntil === 0      → buff 已消耗,配合 leverArmed=true 防读条中断后软锁
     *   leverBuffUntil <= now 且 ≠0 → buff 过期未消耗,重置 leverKeys 让玩家重新拉闸
     */
    if (woolKind === 'black' && ex.key !== '__legacy__') {
      if (d.leverBuffUntil !== 0 && d.leverBuffUntil <= now) {
        /* buff 过期未消耗: 清去重,允许玩家重新拉闸(仍需拉满 required 次) */
        d.leverKeys = new Set();
        d.leverBuffUntil = 0;
        d.leverArmed = false;
        cancelExtract(d);
        warnExfil(pId, d, `⏱ 拉闸buff已过期,请重新拉闸 ${leverRequiredOf(map, ex)} 次`);
        continue;
      }
      if (!(d.leverBuffUntil > now) && !(d.leverBuffUntil === 0 && d.leverArmed)) {
        cancelExtract(d);
        warnExfil(pId, d, `🔒「${ex.name}」需先拉闸 ${leverRequiredOf(map, ex)} 次`);
        continue;
      }
      if (d.leverBuffUntil > now) {
        d.leverBuffUntil = 0;   // 踩上即消耗 buff
        d.leverArmed = true;    // 保留"本局已达成",避免读条中断后无法再撤
        try { api.sendFlyingMiddleMessage(pId, [{str:'🔓 拉闸buff已消耗,开始撤离', style:{color:THEME.success, fontWeight:'bold'}}], 5, 1500); } catch(e) {}
      }
    }

    /* 限重撤离 */
    if (ex.type === '限重') {
      const maxW = Math.floor(Number(ex.maxWeight != null ? ex.maxWeight : EXTRACT.maxLoad) || 0) || EXTRACT.maxLoad;
      if ((d.weight || 0) > maxW) {
        cancelExtract(d);
        warnExfil(pId, d, `⚖ 超重 ${Math.floor(d.weight || 0)}/${maxW},无法通过「${ex.name}」`);
        continue;
      }
    }

    /* 付费撤离: 读条前确认余额,读条完成时扣费 */
    if (ex.type === '付费') {
      const cost = Math.floor(Number(ex.cost) || 0);
      if (cost > 0 && !checkMoney(pId, cost)) {
        cancelExtract(d);
        warnExfil(pId, d, `💵 金币不足,「${ex.name}」需 ${cost}`);
        continue;
      }
    }

    /* 读条时长: 红羊毛/电梯/延时 = 15秒,绿/黑 = 5秒 */
    const rc = (EXTRACT && EXTRACT.readSec) || { green:5, red:15, black:5 };
    const total = (woolKind === 'red' || ex.type === '电梯' || ex.type === '延时')
      ? Math.max(1, Math.floor(Number(rc.red) || 15))
      : Math.max(1, Math.floor(Number(rc[woolKind]) || 5));
    const key = `${ex.key}:${woolKind}`;
    if (!d.extracting || d.extKey !== key || d.extTotal !== total) {
      d.extracting = true;
      d.extTime = 0;
      d.extTotal = total;
      d.extKey = key;
      d.extractExfil = ex;
      d.extWarnAt = 0;
    }
  }
};

/* 违禁品扫描(服主豁免;可在config关闭)
 * 分频: 行动中玩家每轮都扫(背包高频变动),大厅玩家每5轮扫一次(背包几乎不变,省80%扫描量) */
let scanRound = 0;
const runContrabandScan = () => {
  if (!GEAR.contrabandEnabled) return;
  scanRound++;
  for (const pId of api.getPlayerIds()) {
    if (isWhitelisted(pId)) continue;
    const d = getState(pId);
    if (!(d && d.inRaid) && scanRound % 5 !== 1) continue;   // 大厅玩家: 每5轮扫1轮
    const cleared = scanContraband(pId);
    if (cleared.length > 0) {
      const names = unique(cleared.map(c => c.name)).slice(0, 5).join(', ');
      try {
        api.sendFlyingMiddleMessage(pId, [
          {str:`🚫 清除违禁品 x${cleared.length}`, style:{color:'#FF0000',fontWeight:'bold',fontSize:'1.3rem'}},
          {str:` ${names}`, style:{color:'#FF8800'}},
        ], 5, 2500);
      } catch(e) {}
      updateWeight(pId);
    }
  }
};

/* 侧边栏UI(每0.5秒按玩家独立刷新) */
const updateUI = () => {
  G.uiTick++;
  if (G.uiTick < 20) return;
  G.uiTick = 0;
  const raiders = countRaiders();
  for (const pId of api.getPlayerIds()) {
    const d = getState(pId);
    /* 技能物品/补给自动补充(消耗后0.5秒内恢复) */
    const opKey = getPlayerOperator(pId);
    if (opKey) ensureSkillItems(pId, opKey);
    /* 管理员入口可见性动态刷新: 权限被撤销/换人后0.5秒内移除入口(仅状态变化时打API) */
    try { menu.refreshAdminEntry(pId); } catch(e) {}
    const mapKey = getPlayerMapKey(pId);
    const map = mapKey ? MAPS[mapKey] : null;
    const sidebar = [
      {str:'搜打撤\n', style:{color:THEME.primary,fontSize:'1.4rem',fontWeight:'bold'}},
      {str:'━━━━━━━━\n', style:{color:THEME.gray}},
    ];
    if (d && d.inRaid) {
      const min = Math.floor(Math.max(0, d.timeLeft) / 60);
      const sec = Math.max(0, d.timeLeft) % 60;
      const timeColor = d.timeLeft < 60 ? THEME.danger : THEME.gold;
      const liveLoot = calculateLootValue(pId);
      sidebar.push({str:'⚔ 行动中\n', style:{color:THEME.primary,fontWeight:'bold',fontSize:'1.1rem'}});
      sidebar.push({str:`🗺 ${map ? map.name : '?'}\n`, style:{color:THEME.info,fontWeight:'bold'}});
      sidebar.push({str:`⏱ 剩余 ${min}:${String(sec).padStart(2,'0')}\n`, style:{color:timeColor,fontWeight:'bold',fontSize:'1.2rem'}});
      sidebar.push({str:`👥 场上: ${raiders}\n`, style:{color:THEME.success,fontWeight:'bold'}});
      sidebar.push({str:'━━━━━━━━\n', style:{color:THEME.gray}});
      sidebar.push({str:`💰 战利品: ${liveLoot}\n`, style:{color:THEME.gold,fontWeight:'bold'}});
      sidebar.push({str:`☠ 击杀: ${d.kills}\n`, style:{color:THEME.primary,fontWeight:'bold'}});
      const wtRatio = Math.floor((d.weight / CONST.weight.maxLoad) * 100);
      const wtColor = wtRatio > 70 ? THEME.danger : (wtRatio > 40 ? THEME.secondary : THEME.success);
      sidebar.push({str:`🎒 负重: ${wtRatio}%\n`, style:{color:wtColor,fontWeight:'bold'}});
      const cd = getSkillCooldown(pId);
      if (cd > 0) sidebar.push({str:`⏳ 技能CD: ${cd}s\n`, style:{color:THEME.secondary}});
      else sidebar.push({str:'✅ 技能就绪(手持物品单击)\n', style:{color:THEME.success}});
      if (d.extracting) {
        const left = Math.max(0, Math.ceil((Math.max(1, d.extTotal) * 20 - d.extTime) / 20));
        sidebar.push({str:`🚁 撤离读条: ${left}s / ${Math.max(1, d.extTotal)}s\n`, style:{color:THEME.success,fontWeight:'bold',fontSize:'1.1rem'}});
      }
      if (d.leverBuffUntil > Date.now()) {
        const bl = Math.ceil((d.leverBuffUntil - Date.now()) / 1000);
        sidebar.push({str:`⚡ 撤离buff: ${Math.floor(bl/60)}分${bl%60}秒\n`, style:{color:THEME.gold,fontWeight:'bold'}});
      } else if (d.leverArmed) {
        sidebar.push({str:'⚡ 拉闸条件已完成(可踩黑羊毛)\n', style:{color:THEME.success}});
      }
      sidebar.push({str:'━━━━━━━━\n', style:{color:THEME.gray}});
      sidebar.push({str:`💵 余额: ${db.getMoney(pId)}\n`, style:{color:THEME.gold}});
      sidebar.push({str:'⌨ /jt 退出对局\n', style:{color:THEME.gray}});
    } else if (d) {
      const rank = db.getRank(pId);
      const gear = calculateGearScore(pId);
      sidebar.push({str:'🏠 待命区\n', style:{color:THEME.info,fontWeight:'bold',fontSize:'1.1rem'}});
      sidebar.push({str:`🗺 ${map ? map.name : '未选图'} | ⚔战备 ${gear}${map ? `/${map.gearReq || 0}` : ''}\n`, style:{color:THEME.secondary,fontWeight:'bold'}});
      sidebar.push({str:`🏅 ${rank.name} | 💵 ${db.getMoney(pId)}\n`, style:{color:rank.color,fontWeight:'bold'}});
      sidebar.push({str:`👥 场上: ${raiders}\n`, style:{color:THEME.success,fontWeight:'bold'}});
      sidebar.push({str:'━━━━━━━━\n', style:{color:THEME.gray}});
      sidebar.push({str:'按 M 打开菜单\n', style:{color:THEME.gray}});
      sidebar.push({str:'选地图→选干员→战备→进入地图\n', style:{color:THEME.gray}});
      sidebar.push({str:'━━━━━━━━\n', style:{color:THEME.gray}});
    }
    try { api.setClientOption(pId, 'RightInfoText', sidebar); } catch(e) {}
    if (d && d.inRaid && !d.extracting) {
      try { api.progressBarUpdate(pId, Math.max(0, d.timeLeft) / (map ? map.searchTime : 300), 1000); } catch(e) {}
    }
  }
};

/* ===== 主循环 ===== */
const onTick = () => {
  G.tick++;
  try { sweepExpiredMutes(); } catch(e) {}   // 禁言到期自动解禁
  for (const pId of api.getPlayerIds()) {
    updateEffects(pId);
    /* 子弹系统: 现网 getItemSlot 不回报实时 shotsLeft,轮询不可靠 → 扣弹在命中回调里做(见 onDamage)。
     * 调试开关(/pj ammo dbg)打开时每tick只打印轮询结果,不扣弹,用于进服实测确认引擎是否回报 shotsLeft。 */
    try { if (fittings.isAmmoDebug()) fittings.tickAmmo(pId, { logOnly: true }); } catch(e) {}
    /* 配件: 检测手持枪变化 → 按当前手持枪实例的配件附魔动态下发 gunStats(实现同名枪各配各的) */
    try { fittings.tickFittings(pId); } catch(e) {}
  }
  /* 撤离读条: 每tick推进(20tick=1秒);读到0才结算撤离 */
  G.players.forEach((d, pId) => {
    if (!d.inRaid || !d.alive || !d.extracting) return;
    const need = Math.max(1, d.extTotal) * 20;
    d.extTime++;
    if (d.extTime >= need) {
      const ex = d.extractExfil;
      /* 付费撤离: 读条完成时扣费(读条前的余额校验见 checkZones) */
      if (ex && ex.type === '付费') {
        const cost = Math.floor(Number(ex.cost) || 0);
        if (cost > 0) {
          if (!checkMoney(pId, cost)) {
            cancelExtract(d);
            warnExfil(pId, d, `💵 金币不足,「${ex.name}」撤离中断`);
            return;
          }
          db.subMoney(pId, cost);
          try { updatePlayerBoard(pId); } catch(e) {}
        }
      }
      exitRaid(pId, 'extract');
      return;
    }
    if (G.tick % 4 === 0) {   // 200ms 一次(API 建议下限,避免排队跳过)
      try { api.progressBarUpdate(pId, Math.min(1, d.extTime / need), 200); } catch(e) {}
    }
  });
  if (G.tick % 20 === 0) {
    G.players.forEach((d, pId) => {
      if (!d.inRaid) return;
      d.timeLeft--;
      if (d.timeLeft <= 0) exitRaid(pId, 'timeout');
    });
  }
  if (G.tick % 10 === 0) checkZones();
  if (G.tick % 40 === 0) runContrabandScan();
  if (G.tick % 100 === 0) updateLeaderboard();
  if (G.tick % 20 === 0) syncExtractMarkers();   // 撤离点光点: 有图点亮/无图熄灭(幂等)
  if (G.tick % 200 === 0) {         // 低频修剪: 防Map无限增长
    try { cleanExpiredInvites(); } catch(e) {}
    try { pruneExpiredChests(); } catch(e) {}
  }
  const act = activeMapKeys();
  if (act.size > 0) trySpawnMobs(act);
  updateUI();
};

/* ===== 玩家生命周期 ===== */

const onJoin = (pId) => {
  try { api.setClientOption(pId, 'canSeeNametagsThroughWalls', false); } catch(e) {}
  setupLeaderboardPanel(pId);   // 激活排行榜面板(定义列,每人进服一次)
  updatePlayerBoard(pId);
  try { gunsApplyAll(pId); } catch(e) {}   // 枪械参数: 每个进服玩家都应用guns.js表内全部枪械
  try { fittings.reapplyAll(pId); } catch(e) {}   // 恢复该玩家已挂载的配件参数(覆盖基础参数)
  /* 出生点固定 (0,0,0): 显式传送,覆盖引擎默认的随机落点(死亡/撤离/重进共用 teleportToSpawn) */
  try { teleportToSpawn(pId, MAPS[getPlayerMapKey(pId)]); } catch(e) {}
  if (isWhitelisted(pId)) {
    try {
      api.sendFlyingMiddleMessage(pId, [{str:'⚡ 服主模式 - 不受限制', style:{color:'#FFD700',fontWeight:'bold',fontSize:'1.5rem'}}], 5, 3000);
    } catch(e) {}
    return;
  }
  initPlayer(pId);
  try {
    api.sendFlyingMiddleMessage(pId, [
      {str:'欢迎来到搜打撤!\n', style:{color:THEME.gold,fontWeight:'bold',fontSize:'1.8rem'}},
      {str:'按M打开菜单 → 选择地图\n选地图 → 选干员 → 玩家状态 → 进入游戏', style:{color:THEME.info}},
    ], 5, 4000);
    openMapMenu(pId);
  } catch(e) {}
};

const onPlayerFinishQTE = (pId, qteId, result) => {
  try { loot.resolveChestQTE(pId, Boolean(result), qteId); } catch(e) {}
};

/* 玩家击杀小怪: 本系统小怪在死亡位置刷出地面掉落物(玩家走过去捡), 并阻止引擎默认掉(避免双掉);
 * 其它怪走引擎默认。掉落物带认证标记, 捡起不被违禁品扫描清掉。 */
const onPlayerKilledMob = (playerId, mobId, damageDealt, withItem) => {
  let items = null;
  try { items = mobs.rollSmallMobDrops(mobId); } catch(e) { items = null; }
  if (items === null) return;   // 非本系统小怪 → 引擎默认掉落
  let pos = null; try { pos = api.getPosition(mobId); } catch(e) {}
  if (!pos) { try { pos = api.getPosition(playerId); } catch(e) {} }   // 取不到怪物位置则退化到击杀者位置
  const X = pos ? pos[0] : 0, Y = pos ? pos[1] : 0, Z = pos ? pos[2] : 0;
  let n = 0;
  for (const it of items) {
    /* it.attributes 已含 sanjiaozhou 认证 + customDisplayName(缴获的 枪名) — 直接传, 别丢 */
    try { api.createItemDrop(X, Y, Z, it.name, it.amount, false, it.attributes || null, 300000, mobId); n++; } catch(e) {}
  }
  if (n > 0) {
    try { api.sendFlyingMiddleMessage(playerId, [{str:`💀 小怪掉落 ×${n}(掉在原地)`, style:{color:THEME.success, fontWeight:'bold', fontSize:'1.2rem'}}], 5, 1500); } catch(e) {}
  }
  return 'preventDrop';
};
/* 小怪消失(非击杀): 清掉落台账防内存泄漏 */
const onMobDespawned = (mobId) => { try { mobs.forgetMob(mobId); } catch(e) {} };

const onLeave = (pId) => {
  const d = getState(pId);
  /* 断线按非死亡退出处理: 不清空为掉落(避免玩家掉线后物资被别人白捡) */
  if (d && d.inRaid) exitRaid(pId, 'disconnect');
  G.players.delete(pId);
  lobbyMapKeyCache.delete(pId);
  lastClickSkill.delete(pId);
  try { cancelChestQTE(pId); } catch(e) {}
  try { clearInvisible(pId); } catch(e) {}
  try { fittings.forget(pId); } catch(e) {}
  try { db.clearPlayerCaches(pId); } catch(e) {}   // 清理统计/保险缓存,防离线玩家驻留
  try { menu.forgetPlayer(pId); } catch(e) {}   // 清理菜单页面/点击锁/管理员缓存,重进从选图开始
  clearPlayerZone(pId);
  clearPlayerOperator(pId);
  clearPlayerTeam(pId);
};

/* 重生请求:返回自己地图的出生点(与 teleportToSpawn 同一落地修正逻辑),并补发基础物品 */
const onRespawn = (pId) => {
  const d = getState(pId);
  /* 摔死/虚空死等未走 onKill 的死亡,同样按死亡掉落结算 */
  if (d && d.inRaid) exitRaid(pId, 'dead');
  /* 重生后武器/箭补齐(避免待命区背包全空) */
  try {
    giveKnifeIfEmpty(pId);
    let arrows = 0;
    try { const a = api.getItemSlot(pId, 5); if (a && a.name === 'Arrow') arrows = a.amount || 0; } catch(e) {}
    if (arrows < 64) giveMarkedItem(pId, 5, 'Arrow', 64, 1);
    updateWeight(pId);
  } catch(e) {}
  const mk = getPlayerMapKey(pId);
  const map = mk ? MAPS[mk] : null;
  return getSpawnPos(map);   // 固定(0,0,0) + 落地修正,不回到随机出生
};

/* ===== 战斗回调 ===== */

const onKill = (attackerId, victimId, damage, item) => {
  const da = getState(attackerId);
  if (da && da.inRaid) da.kills++;
  const dv = getState(victimId);
  if (dv && dv.inRaid) exitRaid(victimId, 'dead');
  /* 击杀奖励金+任务+段位 */
  if (da && da.inRaid && CONST.killReward > 0) {
    db.addMoney(attackerId, CONST.killReward);
    try { api.sendFlyingMiddleMessage(attackerId, [{str:`击杀奖励 +${CONST.killReward}💰`, style:{color:THEME.gold,fontWeight:'bold'}}], 5, 1500); } catch(e) {}
  }
  db.updateStats(attackerId, 'kills');
  questProgress(attackerId, 'kill', 1);
  try {
    api.addCustomKillfeedMessage({eId: attackerId}, {eId: victimId}, item || 'Iron Sword');
    api.sendMessage(attackerId, [{str:`💀 你击杀了 ${api.getEntityName(victimId)}`, style:{color:THEME.primary,fontWeight:'bold'}}]);
    api.sendMessage(victimId, [{str:`💀 你被 ${api.getEntityName(attackerId)} 击杀`, style:{color:THEME.danger,fontWeight:'bold'}}]);
  } catch(e) {}
  updatePlayerBoard(attackerId);
  return 'keepInventory';
};

/* 怪物击杀玩家(守护者等): 同样按死亡结算 */
const onMobKill = (mobId, victimId, damage) => {
  const dv = getState(victimId);
  if (dv && dv.inRaid) exitRaid(victimId, 'dead');
  try {
    api.sendMessage(victimId, [{str:'💀 你被怪物击杀', style:{color:THEME.danger,fontWeight:'bold'}}]);
  } catch(e) {}
  return 'keepInventory';
};

/* 受击飘字+命中标记 */
const onDamage = (attackerId, victimId, damage, item, bodyPart) => {
  /* 自定义武器通道先算最终伤害,飘字显示改伤后的数字(改过的显示紫色,一眼确认生效) */
  let final = damage;
  try {
    const r = customweapons.onPlayerDamagePlayer(attackerId, victimId, damage, item);
    if (r === 'preventDamage') {
      try { api.sendFlyingMiddleMessage(attackerId, [{str:'✖ 被武器格挡', style:{color:'#888888',fontSize:'1.2rem'}}], 5, 800); } catch(e) {}
      return 'preventDamage';
    }
    if (typeof r === 'number') final = r;
  } catch(e) {}
  /* 子弹系统: 手里的枪按第11格子弹的倍率改伤(无弹则打不出伤害) */
  try {
    const ar = fittings.applyAmmoDamage(attackerId, item, final);
    if (ar === 'preventDamage') {
      try { api.sendFlyingMiddleMessage(attackerId, [{str:'✖ 没子弹了', style:{color:'#888888',fontSize:'1.2rem'}}], 5, 800); } catch(e) {}
      return 'preventDamage';
    }
    if (typeof ar === 'number') final = ar;
    /* 命中即扣 1 发(可靠路径) */
    try {
      if (fittings.isAmmoGun(item)) {
        if (fittings.isAmmoDebug()) console.log(`[子弹] 命中回调: 攻击者=${attackerId} 武器=${typeof item === 'string' ? item : (item && item.name)} 伤害=${final}`);
        fittings.consumeBullets(attackerId, 1);
      }
    } catch(e) {}
  } catch(e) {}
  try {
    let color = final !== damage ? '#FF00FF' : '#FF0000';   // 被自定义武器改过 = 紫色
    let size = '1.5rem';
    if (bodyPart === 'head') { color = final !== damage ? '#FF66FF' : '#FF00FF'; size = '2.5rem'; }
    api.sendFlyingMiddleMessage(attackerId, [{str:`-${Math.round(final)}`, style:{color,fontSize:size,fontWeight:'bold'}}], 5, 800);
    try { api.sendHitmarker(attackerId, bodyPart === 'head'); } catch(e) {}
  } catch(e) {}
  return final;
};

const onDamageMob = (playerId, mobId, damage, item) => {
  /* 自定义武器通道先算最终伤害,飘字显示改伤后的数字(改过的显示紫色) */
  let final = damage;
  try {
    const r = customweapons.onPlayerDamageMob(playerId, mobId, damage, item);
    if (r === 'preventDamage') {
      try { api.sendFlyingMiddleMessage(playerId, [{str:'✖ 被武器格挡', style:{color:'#888888',fontSize:'1.2rem'}}], 5, 800); } catch(e) {}
      return 'preventDamage';
    }
    if (typeof r === 'number') final = r;
  } catch(e) {}
  /* 子弹系统: 手里的枪按第11格子弹的倍率改伤(无弹则打不出伤害) */
  try {
    const ar = fittings.applyAmmoDamage(playerId, item, final);
    if (ar === 'preventDamage') {
      try { api.sendFlyingMiddleMessage(playerId, [{str:'✖ 没子弹了', style:{color:'#888888',fontSize:'1.2rem'}}], 5, 800); } catch(e) {}
      return 'preventDamage';
    }
    if (typeof ar === 'number') final = ar;
    /* 命中即扣 1 发(可靠路径) */
    try {
      if (fittings.isAmmoGun(item)) {
        if (fittings.isAmmoDebug()) console.log(`[子弹] 命中怪物: 玩家=${playerId} 武器=${typeof item === 'string' ? item : (item && item.name)} 伤害=${final}`);
        fittings.consumeBullets(playerId, 1);
      }
    } catch(e) {}
  } catch(e) {}
  try {
    api.sendFlyingMiddleMessage(playerId, [{str:`-${Math.round(final)}`, style:{color: final !== damage ? '#FF00FF' : '#FF6600', fontSize:'1.5rem',fontWeight:'bold'}}], 5, 800);
  } catch(e) {}
  return final;
};

/* 怪物伤害玩家(官方onMobDamagingPlayer): 自定义武器通道,可改伤害/取消 */
const onMobDamagingPlayer = (attackingMob, damagedPlayer, damage, item) => {
  try {
    const r = customweapons.onMobDamagePlayer(attackingMob, damagedPlayer, damage, item);
    if (r === 'preventDamage') return 'preventDamage';
    if (typeof r === 'number') return r;
  } catch(e) {}
  return damage;
};

/* ===== 物品/世界 ===== */

const onPlayerAttemptOpenChest = (pId, x, y, z, isMoonstone, isIron) => {
  const d = getState(pId);
  if (!isWhitelisted(pId)) {
    /* 任何位置都能开箱(区域限制已移除),只需在对局中且存活 —— 被拒时必须给明确原因 */
    if (!d || !d.inRaid) {
      try { api.sendFlyingMiddleMessage(pId, [{str:'❌ 开箱需在对局中(主菜单→开始游戏)', style:{color:'#FF0000',fontWeight:'bold'}}], 5, 2000); } catch(e) {}
      return 'preventOpen';
    }
    if (!d.alive) {
      try { api.sendFlyingMiddleMessage(pId, [{str:'❌ 阵亡状态无法开箱', style:{color:'#FF0000',fontWeight:'bold'}}], 5, 1500); } catch(e) {}
      return 'preventOpen';
    }
  }
  let r;
  try {
    r = handleOpenChest(pId, x, y, z, isMoonstone, isIron);
  } catch(e) {
    /* 典型原因: loot.js/config.js 版本不匹配(如旧loot.js读新config已删除的lootCount) */
    try { console.log('[搜打撤] 开箱异常: ' + ((e && e.stack) || e)); } catch(e2) {}
    try { api.sendFlyingMiddleMessage(pId, [
      {str:'⚠ 开箱出错(检查loot.js/config.js是否为最新版): ', style:{color:'#FF0000',fontWeight:'bold'}},
      {str:`${(e && e.message) || e}`, style:{color:'#FF8800',fontSize:'0.9rem'}},
    ], 5, 4000); } catch(e2) {}
    return 'preventOpen';
  }
  updateWeight(pId);
  return r;
};

/* 仅禁止从技能格/武器格(1-4)丢弃;其余背包/装备格允许正常丢弃(战利品可丢地) */
const onDropItem = (pId, x, y, z, item, amt, idx) => {
  /* 真正禁止丢弃: 原返回 'allowButNoDroppedItemCreated' 会允许丢弃但不生成掉落物(物品被销毁) */
  if (idx >= 1 && idx <= 4) return 'preventDrop';
};

/* 刷怪白名单: 所有地图配置过的怪物类型允许自然刷新(集合预计算,避免每次刷怪重建) */
const SPAWNABLE_MOBS = (() => {
  const s = new Set();
  const add = (v) => { if (typeof v === 'string' && v) s.add(v); };
  const mapsObj = (MAPS && typeof MAPS === 'object') ? MAPS : {};
  const mk = Object.keys(mapsObj);
  for (let i = 0; i < mk.length; i++) {
    const mt = mapsObj[mk[i]] && mapsObj[mk[i]].mobTypes;
    if (!mt) continue;                                  // 老配置没写 mobTypes 不再炸
    if (Array.isArray(mt)) { for (let j = 0; j < mt.length; j++) add(mt[j]); }
    else if (typeof mt === 'object') { const tk = Object.keys(mt); for (let j = 0; j < tk.length; j++) add(tk[j]); }
    else add(mt);                                       // 兼容单个字符串
  }
  return s;
})();
const onWorldSpawnMob = (mobType, x, y, z) => {
  if (SPAWNABLE_MOBS.has(mobType)) return;
  return 'preventSpawn';
};

/* 小怪削弱: 开服对所有图内怪物类型按 CONST.mobNerf 统一设置类型默认值
 * (config 可调;守护者Draugr Knight与城市自然骑士同类型,会被一起削) */
const applyMobNerf = () => {
  const nerf = CONST.mobNerf || {};
  let n = 0;
  SPAWNABLE_MOBS.forEach((type) => {
    Object.keys(nerf).forEach((k) => {
      try { api.setDefaultMobSetting(type, k, nerf[k]); n++; } catch(e) {}
    });
  });
  try { console.log(`[搜打撤] 小怪削弱已应用: ${n}项 (${setToArray(SPAWNABLE_MOBS).join(', ')})`); } catch(e) {}
  return n;
};

/* ===== 管理员系统(仅白名单: 服主/副服主) =====
 * 入口: /admin 指令 或 主菜单"⚙ 管理员"按钮(仅白名单可见)。
 * 动作统一走 adminAction(action, adminId, targetId, arg); menu.js 经 globalThis.__adminAction 调用。
 * 每个动作都二次校验 adminId 必须是白名单。禁言名单按玩家名存 lobby db(重启不丢)。 */
const isAdmin = isWhitelisted;
globalThis.__isAdmin = isAdmin;

const adminSay = (pId, text, color) => {
  try { api.sendFlyingMiddleMessage(pId, [{str: String(text), style:{color: color || THEME.gold, fontWeight:'bold'}}], 5, 1800); } catch(e) {}
};

/* 禁言(按玩家名 -> 到期时间戳, 全服持久; 到期自动解禁, 管理员可中途解除) */
const MUTE_PERMA = 8640000000000000;   // 永久禁言(远未来时间戳)
const mutedPlayers = new Map();        // name -> expiryMs
try {
  const saved = db.getGlobalData('mutedPlayers');
  if (Array.isArray(saved)) { for (const n of saved) mutedPlayers.set(String(n), MUTE_PERMA); }   // 旧版数组数据迁移为永久
  else if (saved && typeof saved === 'object') { for (const [n, exp] of Object.entries(saved)) { const e = Number(exp); if (isFinite(e)) mutedPlayers.set(String(n), e); } }
} catch(e) {}
const saveMutedList = () => { try { db.setGlobalData('mutedPlayers', Object.fromEntries(mutedPlayers)); } catch(e) {} };
const fmtMuteDur = (ms) => {
  if (!isFinite(ms) || ms >= MUTE_PERMA) return '永久';
  const s = Math.max(1, Math.round(ms / 1000));
  if (s >= 3600) return `${Math.floor(s/3600)}时${Math.floor((s%3600)/60)}分`;
  if (s >= 60) return `${Math.floor(s/60)}分${s%60}秒`;
  return `${s}秒`;
};
const isMuted = (pId) => {
  let name = null; try { name = String(api.getEntityName(pId)); } catch(e) { return false; }
  if (!mutedPlayers.has(name)) return false;
  if (Date.now() >= mutedPlayers.get(name)) { mutedPlayers.delete(name); saveMutedList(); return false; }
  return true;
};
const muteRemaining = (pId) => {
  let name = null; try { name = String(api.getEntityName(pId)); } catch(e) { return 0; }
  if (!mutedPlayers.has(name)) return 0;
  return Math.max(0, mutedPlayers.get(name) - Date.now());
};
const mutePlayer = (targetId, durationMs) => {
  let name = null; try { name = api.getEntityName(targetId); } catch(e) {}
  if (!name) return { ok:false, msg:'目标不在线' };
  const dur = Number(durationMs) || 0;
  const exp = dur > 0 ? (Date.now() + dur) : MUTE_PERMA;
  mutedPlayers.set(String(name), exp); saveMutedList();
  return { ok:true, name:String(name), until:exp, dur:fmtMuteDur(dur > 0 ? dur : Infinity) };
};
const unmutePlayer = (targetId) => {
  let name = null; try { name = api.getEntityName(targetId); } catch(e) {}
  if (!name) return { ok:false, msg:'目标不在线' };
  mutedPlayers.delete(String(name)); saveMutedList(); return { ok:true, name:String(name) };
};
/* 按名字解除禁言(可解离线玩家, 管理员中途结束) */
const unmuteByName = (name) => {
  if (!name) return { ok:false, msg:'名称为空' };
  const key = String(name);
  if (!mutedPlayers.has(key)) return { ok:false, msg:`${key} 未被禁言` };
  mutedPlayers.delete(key); saveMutedList(); return { ok:true, name:key };
};
const getMutedList = () => mapKeys(mutedPlayers);
const getMutedEntries = () => mapEntries(mutedPlayers);
/* 清理已到期禁言(到期自动解禁)并通知在线玩家 */
const sweepExpiredMutes = () => {
  const now = Date.now(); let changed = false;
  const toDelete = [];
  mutedPlayers.forEach((exp, name) => {
    if (now >= exp) {
      toDelete.push(name); changed = true;
      try {
        for (const id of api.getPlayerIds()) {
          try { if (String(api.getEntityName(id)) === name) { api.sendMessage(id, [{str:'🔊 你的禁言已到期,自动解除', style:{color:'#00FF00'}}]); break; } } catch(e) {}
        }
      } catch(e) {}
    }
  });
  toDelete.forEach((n) => mutedPlayers.delete(n));
  if (changed) saveMutedList();
};

/* 按名字大小写不敏感查找在线玩家(指令快捷方式用) */
const findOnlinePlayer = (name) => {
  if (!name) return null;
  const lower = String(name).toLowerCase();
  for (const id of api.getPlayerIds()) {
    try { if (String(api.getEntityName(id)).toLowerCase() === lower) return id; } catch(e) {}
  }
  return null;
};

/* 隐身(管理员): 其他玩家看不到自己(opacity=0 且清名牌; 恢复=1) */
const invisibleAdmins = new Set();
const setInvisible = (pId, on) => {
  try {
    api.setTargetedPlayerSettingForEveryone(pId, 'opacity', on ? 0 : 1, true);
    api.setTargetedPlayerSettingForEveryone(pId, 'nameTagInfo', on ? { content: [] } : null, true);
  } catch(e) {}
  if (on) invisibleAdmins.add(pId); else invisibleAdmins.delete(pId);
};
const isInvisible = (pId) => invisibleAdmins.has(pId);
const clearInvisible = (pId) => { if (invisibleAdmins.has(pId)) { try { setInvisible(pId, false); } catch(e) {} } };

/* 统一管理员动作分发(menu.js 与指令共用) */
const adminAction = (action, adminId, targetId, arg) => {
  try { if (!isAdmin(adminId)) return { ok:false, msg:'权限不足' }; } catch(e) { return { ok:false, msg:'权限校验失败' }; }
  const tName = (id) => { try { return api.getEntityName(id) || String(id); } catch(e) { return String(id); } };
  switch (action) {
    case 'give': {
      const amt = Math.floor(Number(arg) || 0);
      if (targetId == null) return { ok:false, msg:'请先选择目标玩家' };
      if (amt <= 0) return { ok:false, msg:'金额必须大于0' };
      db.addMoney(targetId, amt);
      try { updatePlayerBoard(targetId); } catch(e) {}
      try { api.sendFlyingMiddleMessage(targetId, [{str:`💰 管理员给你加了 ${amt} 金币!`, style:{color:THEME.gold, fontWeight:'bold'}}], 5, 2500); } catch(e) {}
      return { ok:true, msg:`✅ 已给 ${tName(targetId)} +${amt}💰` };
    }
    case 'goto': {
      if (targetId == null) return { ok:false, msg:'请先选择目标玩家' };
      let pos = null; try { pos = api.getPosition(targetId); } catch(e) {}
      if (!pos) return { ok:false, msg:'取不到目标位置' };
      try { api.setPosition(adminId, pos[0], pos[1], pos[2]); } catch(e) { return { ok:false, msg:'传送失败' }; }
      return { ok:true, msg:`🚀 已传送至 ${tName(targetId)}` };
    }
    case 'bring': {
      if (targetId == null) return { ok:false, msg:'请先选择目标玩家' };
      let pos = null; try { pos = api.getPosition(adminId); } catch(e) {}
      if (!pos) return { ok:false, msg:'取不到你的位置' };
      try { api.setPosition(targetId, pos[0], pos[1], pos[2]); } catch(e) { return { ok:false, msg:'传送失败' }; }
      return { ok:true, msg:`📥 已将 ${tName(targetId)} 传送至你` };
    }
    case 'clear': {
      if (targetId == null) return { ok:false, msg:'请先选择目标玩家' };
      try { api.clearInventory(targetId); } catch(e) { return { ok:false, msg:'清理失败' }; }
      return { ok:true, msg:`🧹 已清空 ${tName(targetId)} 的背包` };
    }
    case 'mute': {
      if (targetId == null) return { ok:false, msg:'请先选择目标玩家' };
      const r = mutePlayer(targetId, arg); return r.ok ? { ok:true, msg:`🔇 已禁言 ${r.name} (${r.dur})` } : r;
    }
    case 'unmute': {
      if (targetId == null) return { ok:false, msg:'请先选择目标玩家' };
      const r = unmutePlayer(targetId); return r.ok ? { ok:true, msg:`🔊 已解除 ${r.name} 的禁言` } : r;
    }
    case 'invis': {
      const on = !isInvisible(adminId); setInvisible(adminId, on);
      return { ok:true, msg: on ? '👻 隐身已开启(其他玩家看不到你)' : '👁 隐身已关闭' };
    }
    case 'info': {
      if (targetId == null) return { ok:false, msg:'请先选择目标玩家' };
      const money = db.getMoney(targetId) || 0;
      const s = db.getStats(targetId) || {};
      const rank = db.getRank(targetId) || {};
      let titleName = '—'; try { const tk = db.getTitle(targetId); titleName = (CONST.titles && CONST.titles[tk]) ? CONST.titles[tk].name : (tk || '—'); } catch(e) {}
      let opName = '—'; try { const ok2 = getPlayerOperator(targetId); opName = (config.OPERATORS && config.OPERATORS[ok2]) ? config.OPERATORS[ok2].name : (ok2 || '—'); } catch(e) {}
      let pkg = {}; try { pkg = db.getInsuredPackage(targetId) || {}; } catch(e) {}
      let wt = 0; try { wt = db.getWeight(targetId) || 0; } catch(e) {}
      let mk = '—'; try { mk = getPlayerMapKey(targetId) || '大厅'; } catch(e) {}
      const msg = `📊 ${tName(targetId)} 数据\n💵 金币: ${money}\n⚔击杀 ${s.kills||0} | 🚁撤离 ${s.extracts||0} | 💀死亡 ${s.deaths||0}\n🏅 段位: ${rank.name||'—'} | 🎖 称号: ${titleName}\n🧑 干员: ${opName} | 🛡 保险: ${pkg.name||'—'}(${pkg.slots||0}格)\n⚖ 负重: ${wt} | 🗺 所在: ${mk}`;
      return { ok:true, msg };
    }
    case 'inv': {
      if (targetId == null) return { ok:false, msg:'请先选择目标玩家' };
      const items = [];
      for (let slot = 0; slot <= 51; slot++) {
        let it = null; try { it = api.getItemSlot(targetId, slot); } catch(e) {}
        if (it && it.name && it.name !== 'Air') items.push(`[${slot}] ${it.name}${it.amount > 1 ? ' ×'+it.amount : ''}`);
      }
      const gear = (typeof calculateGearScore === 'function') ? calculateGearScore(targetId) : 0;
      let sell = 0; try { sell = loot.calculateSellValue(targetId) || 0; } catch(e) {}
      const head = `🎒 ${tName(targetId)} 背包(${items.length}格有物)\n⚔战备值 ${gear} | 💵可变卖估值 ${sell}`;
      const MAX = 22;
      const shown = items.slice(0, MAX).join('\n');
      const more = items.length > MAX ? `\n…还有 ${items.length - MAX} 格` : '';
      const body = items.length ? ('\n' + shown + more) : '\n(背包为空)';
      return { ok:true, msg: head + body };
    }
    case 'mutelist': {
      const now = Date.now();
      const entries = getMutedEntries().filter(([n, e]) => now < e);
      const list = entries.map(([n]) => n);
      const msg = list.length
        ? `📋 禁言名单 (${list.length}人):\n` + entries.map(([n, e], i) => `${i+1}. ${n} — 剩余 ${fmtMuteDur(e - now)}`).join('\n') + `\n(点对应"解除禁言"按钮可中途解除,支持离线玩家)`
        : '📋 当前无人被禁言';
      return { ok:true, msg, list };
    }
    case 'unmutename': {
      const r = unmuteByName(arg);
      return r.ok ? { ok:true, msg:`🔊 已解除 ${r.name} 的禁言`, name:r.name } : r;
    }
    default: return { ok:false, msg:'未知操作' };
  }
};
globalThis.__adminAction = adminAction;
globalThis.__adminIsMuted = (id) => { try { return isMuted(id); } catch(e) { return false; } };
globalThis.__adminMuteRemaining = (id) => { try { return muteRemaining(id); } catch(e) { return 0; } };

/* ===== 指令系统 =====
 * 指令表:
 *   /ver                      查看当前代码版本(确认重贴是否生效)
 *   /签到|qd|checkin          每日签到(连签奖励递增,7天一循环)
 *   /addmoney <玩家名> <金额>  服主专用加金币(名字大小写不敏感)
 *   /admin                    打开管理员菜单(仅白名单可见)
 *   /mute <玩家名> [分钟]     禁言(默认10分钟,0=永久; 到期自动解禁,仅白名单)
 *   /unmute <玩家名>          解除禁言(仅白名单)
 *   /goto <玩家名>            传送至该玩家(仅白名单)
 *   /bring <玩家名>           强制把该玩家传送至你(仅白名单)
 *   /invis                    切换隐身(其他玩家看不到你,仅白名单)
 *   /jt|quitraid              退出对局(对局中,按撤离失败结算)
 *   /menu|m                   打开主菜单(对局中不可用)
 *   /skill|s                  释放干员技能(也可手持技能物品单击)
 *   /gear                     查看战备值明细(战备=zhanbei附魔和)
 *   /pj|配件                  查看当前枪械配件(; /pj off 卸下全部配件退回背包)
 *   /debug                    显示位置和脚下方块(撤离排查)
 *   /invite <玩家名>          邀请入队(名字大小写不敏感)
 *   /ty|accept                同意队伍邀请
 *   /jj|quit                  拒绝邀请或退出队伍
 *   /team                     打开队伍管理(对局中不可用)
 *   /status|me                查看自身状态(对局中不可用)
 * 全局函数入口(绑定在index.js主世界代码,Code Block可直接调用):
 *   Money(玩家id, 数量)                 加减钱(正加负扣,返回余额)
 *   Checkin(玩家id)                     签到,返回 {success, streak, reward}
 *   Quest(玩家id)                       查全部任务进度
 *   Quest(玩家id, 类型, 数量)            加任务进度(类型: kill/extract/loot)
 *   Data(键) / Data(键, 值)             全局数据读/写(持久化)
 *   PlayerData(玩家id, 键 [, 值])       玩家数据读/写(持久化)
 *   CustomWeapon.add/remove/list        自定义武器注册(见 customweapons.js 头部说明)
 */
const onPlayerCommand = (pId, cmd) => {
  /* 只有指令词转小写;参数保留原样(玩家名大小写必须保真,/addmoney /invite 才能匹配带大写的ID) */
  const rawParts = String(cmd || '').trim().split(/\s+/);
  const cmd0 = (rawParts[0] || '').toLowerCase();
  const args = rawParts.slice(1);
  switch (cmd0) {
    case 'ver': case 'version': {
      const missing = (() => { try { return selfCheck(); } catch(e) { return ['selfCheck异常: ' + (e && e.message)]; } })();
      const status = missing.length === 0 ? '✅ 全部模块就绪' : `❌ 缺失: ${missing.join(', ')}`;
      try {
        api.sendFlyingMiddleMessage(pId, [
          {str:`📦 搜打撤 ${config.VERSION || '未知版本(旧config)'}`, style:{color:'#FFD700',fontWeight:'bold',fontSize:'1.4rem'}},
          {str:` ${status}`, style:{color: missing.length === 0 ? '#00FF00' : '#FF0000', fontSize:'0.9rem'}},
        ], 5, 6000);
      } catch(e) {}
      try { console.log(`[搜打撤] /ver -> ${config.VERSION} | ${status}`); } catch(e) {}
      return true;
    }
    case 'cw': {
      /* 查看当前已注册的自定义武器(重贴代码/重启后注册表清空,用这个确认) */
      let lw;
      try { lw = customweapons.list(); } catch(e) { lw = ['list异常: ' + (e && e.message)]; }
      const lines = [{str:'⚔ 已注册自定义武器:\n', style:{color:THEME.gold,fontWeight:'bold'}}];
      if (lw.length === 0) lines.push({str:'  (空 —— 注册表已清空,重新点你的注册方块/重贴注册区)\n', style:{color:'#FF8800'}});
      for (const w of lw) {
        lines.push({str:`  ${w.item} | 事件: ${w.events.join('/')} | 处理器x${w.handlers}${w.buffs ? ` | buff行x${w.buffs}` : ''}\n`, style:{color:'#FFFFFF'}});
      }
      lines.push({str:'(改伤害要写 ctx.damage=数字 / ctx.cancel=true,return无效)', style:{color:'#4DA6FF'}});
      try { api.sendMessage(pId, lines); } catch(e) {}
      return true;
    }
    case 'debug': {
      /* /debug: 显示位置+脚下方块(排查绿羊毛撤离不触发用) */
      let lines = [{str:'🐛 调试信息:\n', style:{color:THEME.gold,fontWeight:'bold'}}];
      try {
        const pos = api.getPosition(pId);
        lines.push({str:`位置: ${pos[0].toFixed(1)}, ${pos[1].toFixed(1)}, ${pos[2].toFixed(1)}\n`, style:{color:'#FFFFFF'}});
        try {
          const types = api.getBlockTypesPlayerStandingOn(pId);
          lines.push({str:`站立方块API: ${JSON.stringify(types)}\n`, style:{color:'#4DA6FF'}});
        } catch(e) { lines.push({str:`站立方块API: 不可用(${(e && e.message) || e})\n`, style:{color:'#FF0000'}}); }
        for (const dy of [1, 0]) {
          const b = api.getBlock(Math.floor(pos[0]), Math.floor(pos[1]) - dy, Math.floor(pos[2]));
          const nm = (b && typeof b === 'object') ? (b.name || JSON.stringify(b)) : String(b || '');
          lines.push({str:`脚下-${dy}: ${nm}\n`, style:{color:'#FFFFFF'}});
        }
      } catch(e) { lines.push({str:`异常: ${(e && e.message) || e}\n`, style:{color:'#FF0000'}}); }
      try { api.sendMessage(pId, lines); } catch(e) {}
      return true;
    }
    case 'addmoney': case 'addm': {
      if (!isWhitelisted(pId)) { try { api.sendFlyingMiddleMessage(pId, [{str:'权限不足', style:{color:'#FF0000',fontWeight:'bold'}}], 5, 1500); } catch(e) {} return true; }
      const targetName = args[0];   // 原样大小写
      const amount = parseInt(args[1]) || 0;
      if (!targetName || amount <= 0) {
        try { api.sendFlyingMiddleMessage(pId, [{str:'用法: /addmoney <玩家名> <金额>', style:{color:'#FFAA00'}}], 5, 2000); } catch(e) {}
        return true;
      }
      /* 名字匹配大小写不敏感(原实现整句转小写,带大写字母的ID永远匹配不上) */
      const targetLower = targetName.toLowerCase();
      let targetId = null;
      for (const id of api.getPlayerIds()) {
        try { if (String(api.getEntityName(id)).toLowerCase() === targetLower) { targetId = id; break; } } catch(e) {}
      }
      if (!targetId) { try { api.sendFlyingMiddleMessage(pId, [{str:'玩家不在线', style:{color:'#FF0000'}}], 5, 1500); } catch(e) {} return true; }
      db.addMoney(targetId, amount);
      updatePlayerBoard(targetId);
      try { api.sendFlyingMiddleMessage(pId, [{str:`✅ 给 ${targetName} +${amount}💰`, style:{color:THEME.gold,fontWeight:'bold'}}], 5, 1500); } catch(e) {}
      try { api.sendFlyingMiddleMessage(targetId, [{str:`💰 服主给你加了 ${amount} 金币!`, style:{color:THEME.gold,fontWeight:'bold'}}], 5, 2500); } catch(e) {}
      return true;
    }
    case 'admin': {
      if (!isWhitelisted(pId)) { adminSay(pId, '权限不足', '#FF0000'); return true; }
      try { menu.openAdminMenu(pId); } catch(e) { adminSay(pId, '管理员菜单打开失败', '#FF0000'); }
      return true;
    }
    case 'mute': {
      if (!isWhitelisted(pId)) { adminSay(pId, '权限不足', '#FF0000'); return true; }
      const t = findOnlinePlayer(args[0]);
      if (!t) { adminSay(pId, '用法: /mute <在线玩家名> [分钟,默认10,0=永久]', '#FFAA00'); return true; }
      let mins = 10;
      if (args[1] !== undefined && args[1] !== '') { const p = parseInt(args[1]); if (!isNaN(p)) mins = p; }
      const dur = mins <= 0 ? 0 : mins * 60000;
      adminSay(pId, adminAction('mute', pId, t, dur).msg); return true;
    }
    case 'unmute': {
      if (!isWhitelisted(pId)) { adminSay(pId, '权限不足', '#FF0000'); return true; }
      const t = findOnlinePlayer(args[0]);
      if (!t) { adminSay(pId, '用法: /unmute <在线玩家名>', '#FFAA00'); return true; }
      adminSay(pId, adminAction('unmute', pId, t).msg); return true;
    }
    case 'goto': {
      if (!isWhitelisted(pId)) { adminSay(pId, '权限不足', '#FF0000'); return true; }
      const t = findOnlinePlayer(args[0]);
      if (!t) { adminSay(pId, '用法: /goto <在线玩家名>', '#FFAA00'); return true; }
      adminSay(pId, adminAction('goto', pId, t).msg); return true;
    }
    case 'bring': {
      if (!isWhitelisted(pId)) { adminSay(pId, '权限不足', '#FF0000'); return true; }
      const t = findOnlinePlayer(args[0]);
      if (!t) { adminSay(pId, '用法: /bring <在线玩家名>', '#FFAA00'); return true; }
      adminSay(pId, adminAction('bring', pId, t).msg); return true;
    }
    case 'invis': {
      if (!isWhitelisted(pId)) { adminSay(pId, '权限不足', '#FF0000'); return true; }
      adminSay(pId, adminAction('invis', pId).msg); return true;
    }
    case 'jt': case 'quitraid': {
      /* 主动退出对局: 按非死亡退出结算(清空背包+快捷栏,保险格与身上装备保留) */
      const d = getState(pId);
      if (d && d.inRaid) {
        exitRaid(pId, 'quit');
        try { api.sendFlyingMiddleMessage(pId, [{str:'📤 已退出对局(背包已清空,保险格保留)', style:{color:'#FF8800',fontWeight:'bold'}}], 5, 2500); } catch(e) {}
      } else {
        try { api.sendFlyingMiddleMessage(pId, [{str:'你不在对局中', style:{color:'#FF8800'}}], 5, 1500); } catch(e) {}
      }
      return true;
    }
    case 'menu': case 'm': {
      const d = getState(pId);
      if (d && d.inRaid && !isWhitelisted(pId)) {
        try { api.sendFlyingMiddleMessage(pId, [{str:'行动中无法打开菜单!输入 /jt 退出对局', style:{color:'#FF0000',fontWeight:'bold'}}], 5, 2000); } catch(e) {}
        return true;
      }
      openMapMenu(pId);   // 单链根页面=选图
      return true;
    }
    case 'checkin': case '签到': case 'qd': {
      const r = doCheckin(pId);
      if (!r.success) {
        try { api.sendFlyingMiddleMessage(pId, [{str:`📅 ${r.reason}${r.streak ? `(连签${r.streak}天)` : ''}`, style:{color:'#FF8800',fontWeight:'bold'}}], 5, 2000); } catch(e) {}
      }
      return true;
    }
    case 'skill': case 's': {
      const result = useSkill(pId);
      try {
        if (result.success) api.sendFlyingMiddleMessage(pId, [{str:`技能: ${result.skillName}!`, style:{color:'#FFAA00',fontWeight:'bold',fontSize:'1.5rem'}}], 5, 1500);
        else api.sendFlyingMiddleMessage(pId, [{str: result.reason, style:{color:'#FF0000'}}], 5, 1500);
      } catch(e) {}
      return true;
    }
    case 'gear': {
      /* 战备值调试:逐件打印附魔明细(排查附魔格式) */
      const rows = getGearBreakdown(pId);
      const msg = [{str:`\n⚔ 战备值明细 (总${calculateGearScore(pId)}):\n`, style:{color:THEME.gold,fontWeight:'bold'}}];
      if (rows.length === 0) msg.push({str:'  (无装备)\n', style:{color:THEME.gray}});
      for (const r of rows) {
        msg.push({str:`  [${r.slot}] ${r.name}: zhanbei${r.zhanbei} → 得分${r.score} (认证${r.marker})\n`, style:{color:'#FFFFFF'}});
        msg.push({str:`      attributes: ${JSON.stringify(r.attributes)}\n`, style:{color:'#888888'}});
      }
      try { api.sendMessage(pId, msg); } catch(e) {}
      return true;
    }
    case 'pj': case '配件': {
      /* /pj 查看当前配件; /pj ammo 子弹系统诊断; /pj off 卸下全部配件(退回背包) */
      const sub = (args[0] || '').toLowerCase();
      if (sub === 'ammo' || sub === '子弹') {
        if ((args[1] || '').toLowerCase() === 'dbg') {
          const on = fittings.setAmmoDebug(!fittings.isAmmoDebug());
          try { api.sendFlyingMiddleMessage(pId, [{str: on ? '🔍 子弹调试已开启(每tick打印轮询/命中扣弹日志)' : '子弹调试已关闭', style:{color:'#8FE3FF',fontWeight:'bold'}}], 5, 2200); } catch(e) {}
          return true;
        }
        const lines = [{str:'🔍 子弹系统诊断:\n', style:{color:THEME.gold,fontWeight:'bold'}}];
        try {
          for (const l of fittings.diagnose(pId)) lines.push({str: l + '\n', style:{color:'#FFFFFF'}});
        } catch(e) {
          lines.push({str:'诊断异常: ' + ((e && e.message) || e), style:{color:'#FF0000'}});
        }
        try { api.sendMessage(pId, lines); } catch(e) {}
        return true;
      }
      if (sub === 'off' || sub === 'clear' || sub === '卸') {
        const r = fittings.unmountAll(pId);
        try { api.sendFlyingMiddleMessage(pId, [{str: r.count > 0 ? `🔧 已卸下全部配件 x${r.count}(退回背包)` : '没有可卸下的配件', style:{color:'#8FE3FF',fontWeight:'bold'}}], 5, 2200); } catch(e) {}
        return true;
      }
      const list = fittings.listMounts(pId);
      const lines = [{str:'🔧 当前配件:\n', style:{color:THEME.gold,fontWeight:'bold'}}];
      if (list.length === 0) lines.push({str:'  (无 —— 拿配件物品点一下枪械所在格即可装上)\n', style:{color:'#FF8800'}});
      for (const m of list) lines.push({str:`  ${m.gun} · ${m.group}: ${m.fit}\n`, style:{color:'#FFFFFF'}});
      lines.push({str:'(用 /pj off 卸下全部配件)', style:{color:'#4DA6FF'}});
      try { api.sendMessage(pId, lines); } catch(e) {}
      return true;
    }
    case 'invite': handleInviteCommand(pId, args.join(' ')); return true;   // 名字原样大小写
    case 'ty': case 'accept': handleAcceptCommand(pId); return true;
    case 'jj': case 'quit': handleLeaveCommand(pId); return true;
    case 'team': {
      const d = getState(pId);
      if (d && d.inRaid && !isWhitelisted(pId)) {
        try { api.sendFlyingMiddleMessage(pId, [{str:'行动中无法打开队伍菜单!', style:{color:'#FF0000',fontWeight:'bold'}}], 5, 2000); } catch(e) {}
        return true;
      }
      updateTeamMenuForPlayer(pId);
      try { api.openShop(pId, true, 'team_menu', false); } catch(e) {}
      return true;
    }
    case 'status': case 'me': {
      const d = getState(pId);
      if (d && d.inRaid && !isWhitelisted(pId)) {
        try { api.sendFlyingMiddleMessage(pId, [{str:'行动中无法打开状态菜单!', style:{color:'#FF0000',fontWeight:'bold'}}], 5, 2000); } catch(e) {}
        return true;
      }
      updateStatusMenuForPlayer(pId);
      try { api.openShop(pId, true, 'player_status', false); } catch(e) {}
      return true;
    }
  }
  return false;
};

const onBought = (pId, cat, item, boughtItem, userInput) => {
  menu.onBoughtShopItem(pId, cat, item, boughtItem, userInput);
};

/* ===== 背包锁定与负重 ===== */

/* 锁定格拦截(移入/背包内移动): 1格武器只进不出(系统专属),2-4格技能物品双向锁定
 * 武器格也必须禁"移入": 否则战利品会卡在1格,既取不出又会被preserveGear永久保留
 * (且giveKnifeIfEmpty因该格非空而不再发刀) */
const onPlayerMoveInvenItem = (pId, fromIdx, toStartIdx, toEndIdx, amt) => {
  /* 配件挂载: 把"配件物品"移到"枪械所在格"= 装上(吃掉原始移动,改走挂载逻辑) */
  try {
    const r = fittings.tryMountByMove(pId, fromIdx, toStartIdx);
    if (r && r.handled) {
      try { fittings.invalidateHeld(pId); } catch(e) {}   // 背包内容变化: 手持枪缓存失效
      updateWeight(pId);   // 挂载会消耗/退回配件,背包内容变了,同步负重
      return "preventChange";
    }
  } catch(e) {}
  if (fromIdx >= 1 && fromIdx <= 4) return "preventChange";
  if ((toStartIdx >= 1 && toStartIdx <= 4) || (toEndIdx >= 1 && toEndIdx <= 4)) return "preventChange";
  try { fittings.invalidateHeld(pId); } catch(e) {}   // 转移/拾取/保险格存取后按新物品实例重新下发
  updateWeight(pId);
};

/* 移出背包(丢入其他容器等旁路)同样拦截锁定格 */
const onPlayerMoveItemOutOfInventory = (pId, fromIdx, itemAmount) => {
  if (fromIdx >= 1 && fromIdx <= 4) return "preventChange";
  try { fittings.invalidateHeld(pId); } catch(e) {}   // 丢弃后手持枪缓存失效
  updateWeight(pId);
};

/* 负重: 干员被动移速 x 负重减速
 * 性能: 负重只在变化时写db(背包移动高频触发)。
 * 注意: speedMultiplier每次都写,不做节流 —— 冲刺技能结束的复原依赖这次写入,
 *       若按缓存跳过,技能结束时移速会永久卡在加速值 */
const speedMultForRatio = (ratio) => {
  if (ratio <= CONST.weight.slowThreshold) return 1.0;
  const overRatio = (ratio - CONST.weight.slowThreshold) / (1 - CONST.weight.slowThreshold);
  return 1.0 - overRatio * (1 - CONST.weight.minSpeedMult);
};
const updateWeight = (pId) => {
  try {
    const wcfg = CONST.weight || {};
    const lightItems = wcfg.lightItems || {};
    const midItems = wcfg.midItems || {};
    const heavyItems = wcfg.heavyItems || {};
    const perKg = wcfg.perItemWeight || 1;
    /* 三角洲行动: 读 outfit 套装加成(GEAR.outfitSlots=[52,53] 穿进去生效) */
    let outfitMaxLoadBonus = 0, outfitSpeedBonus = 0;
    try {
      const outfits = config.GEAR.outfits || {};
      for (const slot of config.GEAR.outfitSlots || [52, 53]) {
        const it = api.getItemSlot(pId, slot);
        if (!it) continue;
        /* 兼容两种发放方式: 直接用物品名, 或"底层物品 + customDisplayName"(项目其它系统普遍这么做) */
        const outfitKey = [it.name, it.attributes && it.attributes.customDisplayName].find(k => k && outfits[k]);
        if (outfitKey) {
          const o = outfits[outfitKey];
          outfitMaxLoadBonus += o.maxLoadBonus || 0;
          outfitSpeedBonus += o.speedBonus || 0;
        }
      }
    } catch(e) {}
    let wt = 0;
    for (let i = 11; i <= 45; i++) {
      try {
        const it = api.getItemSlot(pId, i);
        if (!it || !it.name) continue;
        const amt = it.amount || 1;
        /* 查表优先: light → mid → heavy → 默认 perKg */
        let single = lightItems[it.name];
        if (single === undefined) single = midItems[it.name];
        if (single === undefined) single = heavyItems[it.name];
        if (single === undefined) single = perKg;
        wt += single * amt;
      } catch(e) {}
    }
    const effectiveMaxLoad = (wcfg.maxLoad || 200) + outfitMaxLoadBonus;   /* 套装加负重上限 */
    wt = Math.min(wt, effectiveMaxLoad);
    const pState = G.players.get(pId);
    const oldWt = pState ? pState.weight : null;
    if (pState) pState.weight = wt;
    if (oldWt !== wt) db.setWeight(pId, wt);
    if (typeof globalThis.isSprinting === 'function' && globalThis.isSprinting(pId)) {
      /* 冲刺技能生效中: 移速由技能buff接管, 不按负重重算 */
    } else {
      const baseSpd = getOperatorBaseSpeed(pId) * (1 + outfitSpeedBonus);   /* 套装加移速 */
      api.setClientOption(pId, 'speedMultiplier', baseSpd * speedMultForRatio(wt / effectiveMaxLoad));
    }
    return wt;
  } catch(e) { return 0; }
};

/* 行动中禁止打开Shop菜单(服主不受限) */
const onPlayerToggledShopMenu = (pId, isOpened) => {
  /* 玩家手动开/关: 清空当前页面与点击锁,下次打开从选图重新确认(服务器主动切页不受影响) */
  try { menu.onShopOpened(pId); } catch(e) {}
  if (!isOpened) return;
  if (isWhitelisted(pId)) return;
  const d = getState(pId);
  if (d && d.inRaid) {
    try { api.openShop(pId, false, null, false); } catch(e) {}
    try { api.sendFlyingMiddleMessage(pId, [{str:'行动中无法打开菜单!', style:{color:'#FF0000',fontWeight:'bold',fontSize:'1.3rem'}}], 5, 1500); } catch(e) {}
  }
};

/* ===== 技能单击释放 =====
 * 官方签名: onPlayerClick(playerId, wasAltClick, x, y, z, block, targetEId) — 每次左键单击(攻击/挖块)都会触发
 * 手持技能物品单击即释放;与技能物品同名物品在其它格不会被误触(只看手持)
 * 自定义武器通道: 单击事件原样喂给 customweapons(手持物品匹配的click处理器)
 */
let lastClickSkill = new Map();   // pId -> 上次单击释放时间(防抖,bloxd连点会重复触发)
const onPlayerClick = (pId, wasAltClick, x, y, z, block, targetEId) => {
  if (wasAltClick) return;
  try {
    const now = Date.now();
    const last = lastClickSkill.get(pId) || 0;
    if (now - last < 500) return;   // 500ms防抖: 单次点击不会连放
    const held = api.getHeldItem(pId);
    if (!held || !held.name) return;
    /* 自定义武器单击通道(先于技能,互不干扰) */
    try { customweapons.onPlayerClick(pId, targetEId !== undefined ? targetEId : null, 0, held.name); } catch(e) {}
    const result = tryUseSkillFromItem(pId, held.name);
    if (result) {
      lastClickSkill.set(pId, now);
      try {
        if (result.success) api.sendFlyingMiddleMessage(pId, [{str:`技能: ${result.skillName}!`, style:{color:'#FFAA00',fontWeight:'bold',fontSize:'1.5rem'}}], 5, 1200);
        else api.sendFlyingMiddleMessage(pId, [{str: result.reason, style:{color:'#FF0000'}}], 5, 1200);
      } catch(e) {}
    }
  } catch(e) {}
};

/* ===== 模块导出 ===== */
/* 跨模块版本自检: 校验game.js内部引用的其他模块关键函数是否齐全(手动粘贴漏文件/旧版时点名)
 * 本轮新增的函数旧版文件里没有 —— 缺了哪个就点名哪个文件是旧版 */
const selfCheck = () => {
  const missing = [];
  const need = (name, fn) => { if (typeof fn !== 'function') missing.push(name); };
  need('loot.fillChestLoot [loot.js是旧版,需开箱入箱版!]', loot.fillChestLoot);
  need('loot.giveMarkedItem', giveMarkedItem);
  need('loot.scanContraband', scanContraband);
  need('loot.pruneExpiredChests', pruneExpiredChests);
  need('team.cleanExpiredInvites', cleanExpiredInvites);
  need('loot.calculateGearScore', calculateGearScore);
  /* ↓ 本轮(v2.1)新增: 旧版loot.js没有这两个函数 */
  need('loot.calculateSellValue [loot.js是旧版!]', loot.calculateSellValue);
  need('loot.sellAllLoot [loot.js是旧版!]', loot.sellAllLoot);
  need('menu.openMapMenu [menu.js是旧版!]', openMapMenu);
  need('menu.forgetPlayer [menu.js是旧版!]', menu.forgetPlayer);
  need('menu.onBoughtShopItem', menu.onBoughtShopItem);
  need('menu.updateTeamMenuForPlayer', updateTeamMenuForPlayer);
  need('menu.updateStatusMenuForPlayer', updateStatusMenuForPlayer);
  need('menu.handleInviteCommand', handleInviteCommand);
  /* ↓ 本轮(v2.1)新增: 旧版menu.js没有 */
  need('menu.openSellShopMenu [menu.js是旧版!]', menu.openSellShopMenu);
  need('menu.openAdminMenu [menu.js是旧版!]', menu.openAdminMenu);
  need('maps.updatePlayerZone', updatePlayerZone);
  /* ↓ 本轮(v2.3)新增: 旧版maps.js没有撤离点光点 */
  need('maps.createExtractMarkers [maps.js是旧版!]', createExtractMarkers);
  /* ↓ 本轮(v2.3)新增: customweapons.js 没贴或贴旧版会点名 */
  need('customweapons.onPlayerDamagePlayer [customweapons.js没贴或旧版!]', customweapons.onPlayerDamagePlayer);
  need('customweapons.onPlayerDamageMob', customweapons.onPlayerDamageMob);
  need('customweapons.onMobDamagePlayer', customweapons.onMobDamagePlayer);
  need('customweapons.onPlayerClick', customweapons.onPlayerClick);
  need('customweapons.add', customweapons.add);
  /* ↓ 本轮(v2.4)新增: guns.js 没贴会点名 */
  need('guns.applyAll [guns.js没贴!]', gunsApplyAll);
  /* ↓ 本轮新增: fittings.js 没贴或旧版会点名 */
  need('fittings.tryMountByMove [fittings.js没贴或旧版!]', fittings.tryMountByMove);
  need('fittings.applyAmmoDamage', fittings.applyAmmoDamage);
  need('fittings.tickAmmo', fittings.tickAmmo);
  need('fittings.reapplyAll', fittings.reapplyAll);
  need('fittings.tickFittings [fittings.js是旧版!]', fittings.tickFittings);
  need('fittings.diagnose [fittings.js是旧版!]', fittings.diagnose);
  need('mobs.rollSmallMobDrops [mobs.js是旧版!]', mobs.rollSmallMobDrops);
  need('loot.giveMarkedItemAuto [loot.js是旧版!]', loot.giveMarkedItemAuto);
  need('maps.getCachedZone', getCachedZone);
  need('maps.trySpawnMobs', trySpawnMobs);
  need('maps.teleportToSpawn', teleportToSpawn);
  need('maps.teleportToSearch', teleportToSearch);
  need('maps.getExtractCenter', getExtractCenter);
  need('operators.ensureSkillItems', ensureSkillItems);
  need('operators.useSkill', useSkill);
  need('operators.tryUseSkillFromItem', tryUseSkillFromItem);
  need('operators.updateEffects', updateEffects);
  need('operators.getSkillCooldown', getSkillCooldown);
  need('operators.getPlayerOperator', getPlayerOperator);
  need('operators.initPlayerOperator', initPlayerOperator);
  need('operators.getOperatorBaseSpeed', getOperatorBaseSpeed);
  need('team.isSameTeam', isSameTeam);
  need('team.setInMatch', team_setInMatch);
  need('db.getRank', db.getRank);
  need('db.getMoney', db.getMoney);
  need('db.addMoney', db.addMoney);
  need('db.subMoney', db.subMoney);
  need('db.getStats', db.getStats);
  need('db.getMapKey', db.getMapKey);
  need('db.getInsuredSlots', db.getInsuredSlots);
  /* ↓ 本轮(v2.2)新增: 旧版db.js没有这些函数 */
  need('db.getCheckin [db.js是旧版!]', db.getCheckin);
  need('db.getGlobalData [db.js是旧版!]', db.getGlobalData);
  need('db.getPlayerData [db.js是旧版!]', db.getPlayerData);
  /* ↓ 本轮(v2.3)新增: 旧版config.js没有CHEST_STYLES(且旧loot.js读不到会开箱异常) */
  if (!config.CHEST_STYLES) missing.push('config.CHEST_STYLES [config.js是旧版!]');
  if (!config.VERSION) missing.push('config.VERSION [config.js是旧版!]');
  return missing;
};

module.exports = {
  onTick,
  onJoin, onLeave, onRespawn,
  onKill, onDamage, onDamageMob, onMobKill, onMobDamagingPlayer,
  onPlayerAttemptOpenChest, onDropItem, onWorldSpawnMob, onPlayerFinishQTE, onPlayerKilledMob, onMobDespawned,
  onPlayerCommand, onBought,
  onPlayerMoveInvenItem, onPlayerMoveItemOutOfInventory, onPlayerToggledShopMenu, onPlayerClick, updateWeight,
  selfCheck, moneyEntry, doCheckin, questInterface, applyMobNerf, checkMoney, mojin,
  adminAction, isMuted, mutePlayer, unmutePlayer, unmuteByName, getMutedList, isAdmin, isInvisible, findOnlinePlayer,
  pullLever,
  G,
};
