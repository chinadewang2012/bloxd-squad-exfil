// ============================================
// db.js - 数据库操作层 (CommonJS)
// ============================================

const config = require("./config.js");
const CONST = config.CONST;
const RANKS = config.RANKS;

/* 玩家干员 */
const setOperator = (pId, opKey) => { try { api.setPlayerDbValue(pId, CONST.dbKeys.operator, opKey); } catch(e) {} };
const getOperator = (pId) => { try { return api.getPlayerDbValue(pId, CONST.dbKeys.operator); } catch(e) { return null; } };

/* 队伍 */
const setTeam = (pId, teamId) => { try { api.setPlayerDbValue(pId, CONST.dbKeys.team, teamId); } catch(e) {} };
const getTeam = (pId) => { try { return api.getPlayerDbValue(pId, CONST.dbKeys.team); } catch(e) { return null; } };
const setTeamLead = (pId, isLead) => { try { api.setPlayerDbValue(pId, CONST.dbKeys.teamLead, isLead ? 1 : 0); } catch(e) {} };
const isTeamLead = (pId) => { try { return api.getPlayerDbValue(pId, CONST.dbKeys.teamLead) === 1; } catch(e) { return false; } };

/* 玩家独立选图 */
const setMapKey = (pId, mapKey) => { try { api.setPlayerDbValue(pId, CONST.dbKeys.mapKey, mapKey); } catch(e) {} };
const getMapKey = (pId) => { try { return api.getPlayerDbValue(pId, CONST.dbKeys.mapKey); } catch(e) { return null; } };

/* 经济 — 持久化失败必须留痕,否则余额写丢无感知 */
const dbErr = (where, e) => { try { console.log('[搜打撤] db.' + where + '失败: ' + ((e && e.message) || e)); } catch(_) {} };
const addMoney = (pId, amount) => {
  try { const cur = getMoney(pId) || 0; api.setPlayerDbValue(pId, CONST.dbKeys.money, cur + amount); } catch(e) { dbErr('addMoney', e); }
};
const subMoney = (pId, amount) => {
  try { const cur = getMoney(pId) || 0; api.setPlayerDbValue(pId, CONST.dbKeys.money, Math.max(0, cur - amount)); } catch(e) { dbErr('subMoney', e); }
};
const canAfford = (pId, amount) => { return (getMoney(pId) || 0) >= amount; };
const getMoney = (pId) => { try { return api.getPlayerDbValue(pId, CONST.dbKeys.money) || 0; } catch(e) { dbErr('getMoney', e); return 0; } };
const payInsurance = (pId, amount) => {
  const cur = getMoney(pId);
  if (cur < amount) return false;
  try { api.setPlayerDbValue(pId, CONST.dbKeys.money, cur - amount); return true; } catch(e) { dbErr('payInsurance', e); return false; }
};

/* 统计(tick路径高频读取: 侧边栏/排行榜每0.5-5秒/人)
 * JSON.parse每次调用都跑 —— 加内存缓存,写时失效 */
const _statsCache = new Map();   // pId -> stats对象
const updateStats = (pId, field, add = 1) => {
  try {
    const stats = getStats(pId);
    stats[field] = (stats[field] || 0) + add;
    _statsCache.set(pId, stats);
    api.setPlayerDbValue(pId, CONST.dbKeys.stats, JSON.stringify(stats));
  } catch(e) {}
};
const getStats = (pId) => {
  const cached = _statsCache.get(pId);
  if (cached) return cached;
  try {
    const raw = api.getPlayerDbValue(pId, CONST.dbKeys.stats);
    const stats = raw ? JSON.parse(raw) : { kills:0, extracts:0, deaths:0 };
    _statsCache.set(pId, stats);
    return stats;
  } catch(e) { return { kills:0, extracts:0, deaths:0 }; }
};

/* 保险(tick路径高频: 战备值/变卖估值/撤离结算) */
const _insPendingCache = new Map();    // pId -> 数组
const _insuredSlotsCache = new Map();  // pId -> 数组
const setInsuredSlots = (pId, slots) => {
  _insuredSlotsCache.set(pId, slots || []);
  try { api.setPlayerDbValue(pId, 'insured', JSON.stringify(slots || [])); } catch(e) {}
};
const getInsuredSlots = (pId) => {
  const cached = _insuredSlotsCache.get(pId);
  if (cached) return cached;
  try {
    const raw = api.getPlayerDbValue(pId, 'insured');
    const arr = raw ? JSON.parse(raw) : [];
    _insuredSlotsCache.set(pId, arr);
    return arr;
  } catch(e) { return []; }
};
const setInsPending = (pId, list) => {
  _insPendingCache.set(pId, list || []);
  try { api.setPlayerDbValue(pId, 'insPending', JSON.stringify(list || [])); } catch(e) {}
};
const getInsPending = (pId) => {
  const cached = _insPendingCache.get(pId);
  if (cached) return cached;
  try {
    const raw = api.getPlayerDbValue(pId, 'insPending');
    const arr = raw ? JSON.parse(raw) : [];
    _insPendingCache.set(pId, arr);
    return arr;
  } catch(e) { return []; }
};
/* 玩家离开时清理三张高频缓存, 防止离线玩家对象永久驻留(统计/保险/保险格) */
const clearPlayerCaches = (pId) => {
  _statsCache.delete(pId);
  _insPendingCache.delete(pId);
  _insuredSlotsCache.delete(pId);
};
const setInsuredPackage = (pId, pkg) => { try { api.setPlayerDbValue(pId, 'insPkg', JSON.stringify(pkg)); } catch(e) {} };
const getInsuredPackage = (pId) => {
  try {
    const raw = api.getPlayerDbValue(pId, 'insPkg');
    return raw ? JSON.parse(raw) : { slots: 2, name: '初始保险' };
  } catch(e) { return { slots: 2, name: '初始保险' }; }
};

/* 服务器级 */
const setCurrentMap = (mapKey) => { try { api.setLobbyDbValue('currentMap', mapKey); } catch(e) {} };
const getCurrentMap = () => { try { return api.getLobbyDbValue('currentMap'); } catch(e) { return null; } };

/* 称号 */
const getTitle = (pId) => { try { return api.getPlayerDbValue(pId, CONST.dbKeys.title) || 'rookie'; } catch(e) { return 'rookie'; } };
const setTitle = (pId, titleKey) => { try { api.setPlayerDbValue(pId, CONST.dbKeys.title, titleKey); } catch(e) {} };

/* 任务进度 (存 {questKey: progress, done: {questKey: true}}) */
const getQuests = (pId) => {
  try {
    const raw = api.getPlayerDbValue(pId, CONST.dbKeys.quests);
    const q = raw ? JSON.parse(raw) : {};
    if (!q.done) q.done = {};
    return q;
  } catch(e) { return { done: {} }; }
};
const setQuests = (pId, quests) => { try { api.setPlayerDbValue(pId, CONST.dbKeys.quests, JSON.stringify(quests)); } catch(e) {} };

/* 负重 */
const getWeight = (pId) => { try { return api.getPlayerDbValue(pId, CONST.dbKeys.weight) || 0; } catch(e) { return 0; } };
const setWeight = (pId, wt) => { try { api.setPlayerDbValue(pId, CONST.dbKeys.weight, wt); } catch(e) {} };

/* 刀皮 */
const getKnifeSkin = (pId) => { try { return api.getPlayerDbValue(pId, 'knifeSkin') || 'default'; } catch(e) { return 'default'; } };
const setKnifeSkin = (pId, skinKey) => { try { api.setPlayerDbValue(pId, 'knifeSkin', skinKey); } catch(e) {} };

/* 段位: 上次播报的段位key(用于升级播报) */
const getRankSeen = (pId) => { try { return api.getPlayerDbValue(pId, CONST.dbKeys.rankSeen) || null; } catch(e) { return null; } };
const setRankSeen = (pId, rankKey) => { try { api.setPlayerDbValue(pId, CONST.dbKeys.rankSeen, rankKey); } catch(e) {} };

/* ===== 段位计算 =====
 * 分数 = 撤离x3 + 击杀x1
 */
const getRankScore = (pId) => {
  const s = getStats(pId);
  return (s.extracts || 0) * 3 + (s.kills || 0);
};
const getRank = (pId) => {
  const score = getRankScore(pId);
  let rank = RANKS[0];
  for (const r of RANKS) if (score >= r.minScore) rank = r;
  return rank;
};
const getNextRank = (pId) => {
  const score = getRankScore(pId);
  for (const r of RANKS) if (score < r.minScore) return r;
  return null;  // 已满级
};

/* 工具 */
const getDbId = (pId) => { try { return api.getPlayerDbId(pId); } catch(e) { return null; } };
const getIdFromDb = (dbId) => { try { return api.getPlayerIdFromDbId(dbId); } catch(e) { return null; } };

/* ===== 每日签到记录 {lastDate:'2026-10-2', streak:3} ===== */
/* 日期键(自然日,跨模块共用: game.js签到 / menu.js按钮展示)
 * 注意: bloxd 沙盒不支持 Date 构造 —— 写 new Date() 会抛 "Date is not a constructor"
 * (官方只保证 Date.now())。所以这里不再用 new Date(),改用纯算术按 UTC+8(北京时间)取自然日。*/
const dateKeyOf = (t) => {
  const ms = (typeof t === 'number' && isFinite(t)) ? t : Date.now();
  /* epoch 毫秒 → 天数(加 8h 偏移到北京时间) → 用 Howard Hinnant 算法反推 年-月-日 */
  const days = Math.floor((ms + 8 * 3600000) / 86400000) + 719468;
  const era = Math.floor(days / 146097);
  const doe = days - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const y = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp + (mp < 10 ? 3 : -9);
  const year = y + (month <= 2 ? 1 : 0);
  return `${year}-${month}-${day}`;
};
const getCheckin = (pId) => {
  try {
    const raw = api.getPlayerDbValue(pId, 'checkin');
    const rec = raw ? JSON.parse(raw) : {};
    return { lastDate: rec.lastDate || '', streak: rec.streak || 0 };
  } catch(e) { return { lastDate: '', streak: 0 }; }
};
const setCheckin = (pId, rec) => { try { api.setPlayerDbValue(pId, 'checkin', JSON.stringify(rec || {})); } catch(e) {} };
/* 签到核心逻辑(放在db层,供 game.js 与 menu.js 直接调用,不依赖 globalThis 跨模块)
 * 每个自然日限一次;昨天签过连签+1,断签从1重算;奖励=第(streak-1)%档数 档 */
const CHECKIN_REWARDS = (config.CHECKIN && Array.isArray(config.CHECKIN.rewards) && config.CHECKIN.rewards.length > 0) ? config.CHECKIN.rewards : [50];
const doCheckin = (pId) => {
  try {
    const rec = getCheckin(pId);
    const today = dateKeyOf(Date.now());
    if (rec.lastDate === today) return { success: false, reason: '今日已签到', streak: rec.streak, reward: 0 };
    const yesterday = dateKeyOf(Date.now() - 86400000);
    const streak = (rec.lastDate === yesterday) ? (rec.streak || 0) + 1 : 1;
    const reward = CHECKIN_REWARDS[(streak - 1) % CHECKIN_REWARDS.length];
    addMoney(pId, reward);
    setCheckin(pId, { lastDate: today, streak });
    return { success: true, streak, reward };
  } catch(e) { return { success: false, reason: '签到异常: ' + (e && e.message) }; }
};

/* ===== 通用数据接口(Data/PlayerData全局函数的存储层) =====
 * 原始类型原样存,对象/数组JSON序列化;读取时自动尝试反序列化 */
const serializeData = (value) => {
  if (value === undefined) return null;
  if (value !== null && typeof value === 'object') {
    try { return JSON.stringify(value); } catch(e) { return null; }
  }
  return value;
};
const deserializeData = (raw) => {
  if (typeof raw !== 'string') return raw === undefined || raw === null ? null : raw;
  const s = raw.trim();
  if (s.startsWith('{') || s.startsWith('[')) {
    try { return JSON.parse(s); } catch(e) { return raw; }
  }
  return raw;
};
/* 全局数据(lobby db,全服共享,重启不丢) */
const getGlobalData = (key) => { try { return deserializeData(api.getLobbyDbValue('gdata_' + key)); } catch(e) { return null; } };
const setGlobalData = (key, value) => { try { api.setLobbyDbValue('gdata_' + key, serializeData(value)); } catch(e) {} };
/* 玩家数据(玩家db,按玩家隔离) */
const getPlayerData = (pId, key) => { try { return deserializeData(api.getPlayerDbValue(pId, 'pdata_' + key)); } catch(e) { return null; } };
const setPlayerData = (pId, key, value) => { try { api.setPlayerDbValue(pId, 'pdata_' + key, serializeData(value)); } catch(e) {} };

module.exports = {
  setOperator, getOperator,
  setTeam, getTeam, setTeamLead, isTeamLead,
  setMapKey, getMapKey,
  addMoney, subMoney, canAfford, getMoney, payInsurance,
  updateStats, getStats, clearPlayerCaches,
  setInsuredSlots, getInsuredSlots, setInsuredPackage, getInsuredPackage,
  getInsPending, setInsPending,
  setCurrentMap, getCurrentMap,
  getTitle, setTitle,
  getQuests, setQuests,
  getWeight, setWeight,
  getKnifeSkin, setKnifeSkin,
  getRankSeen, setRankSeen,
  getRankScore, getRank, getNextRank,
  getCheckin, setCheckin, dateKeyOf, doCheckin,
  getGlobalData, setGlobalData, getPlayerData, setPlayerData,
  getDbId, getIdFromDb,
};
