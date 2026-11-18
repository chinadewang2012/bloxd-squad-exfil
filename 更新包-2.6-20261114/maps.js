// ============================================
// maps.js - 地图系统 (CommonJS)
// ============================================
// 设计: 本模块不持有任何玩家地图状态!
// "玩家选了哪张图"由 game.js 的 G.players 集中持有(单一状态源),
// 本模块所有按玩家的函数都显式接收 map 对象,避免跨模块状态失联。

const config = require("./config.js");
const MAPS = config.MAPS;
const mobs = require("./mobs.js");

const playerZones = new Map();      // pId -> zone
const activeExfils = new Map();     // pId -> 当前站立的撤离点对象(map.exfils项)
const mobTickCounters = new Map();  // mapKey -> 计数器

const getMapByKey = (mapKey) => MAPS[mapKey] || null;

const getMapList = () => {
  /* 停用图(坐标未填/维护中)不进选图列表 */
  return Object.entries(MAPS)
    .filter(([, m]) => !m.disabled)
    .map(([key, m]) => ({ key, name: m.name, searchTime: m.searchTime, gearReq: m.gearReq || 0 }));
};

const isInZone = (pos, zoneName, map) => {
  if (!map || !map.zones[zoneName]) return false;
  try { return api.isInsideRect(pos, map.zones[zoneName].min, map.zones[zoneName].max, true); } catch(e) { return false; }
};

const isInBox = (pos, box) => {
  try { return api.isInsideRect(pos, box.min, box.max, true); } catch(e) { return false; }
};

const getPlayerZone = (pId, map) => {
  let pos;
  try { pos = api.getPosition(pId); } catch(e) { return null; }
  if (!map) { activeExfils.delete(pId); return 'lobby'; }
  /* 撤离点优先于搜索区: 零号大坝的多撤离点分布在搜索区内部 */
  if (Array.isArray(map.exfils)) {
    for (const ex of map.exfils) {
      if (isInBox(pos, ex.zone)) { activeExfils.set(pId, ex); return 'extract'; }
    }
  }
  activeExfils.delete(pId);
  if (isInZone(pos, 'extract', map)) return 'extract';
  if (isInZone(pos, 'search', map))  return 'search';
  return 'lobby';
};

/* 当前站立的撤离点对象(不在撤离点时null; game.js 据此执行限重/付费/随机规则) */
const getActiveExfil = (pId) => activeExfils.get(pId) || null;

/* 距玩家最近的撤离点中心(导航箭头用; 无exfils的老图退化为zones.extract中心) */
const getNearestExfilCenter = (pId, map) => {
  const center = (b) => [ (b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2 ];
  if (!map || !Array.isArray(map.exfils) || map.exfils.length === 0) return getExtractCenter(map);
  let pos = null;
  try { pos = api.getPosition(pId); } catch(e) {}
  if (!pos) return center(map.exfils[0].zone);
  let best = center(map.exfils[0].zone), bd = Infinity;
  for (const ex of map.exfils) {
    const c = center(ex.zone);
    const dd = (c[0] - pos[0]) * (c[0] - pos[0]) + (c[2] - pos[2]) * (c[2] - pos[2]);
    if (dd < bd) { bd = dd; best = c; }
  }
  return best;
};

const teleport = (pId, x, y, z, dir = null) => {
  try { api.setPosition(pId, x, y, z); if (dir) api.setCameraDirection(pId, dir); } catch(e) {}
};

/* 出生点固定 + 落地修正
 * 地图配置 spawn 统一为 [0,0,0]; 但原点可能是实心方块(大厅蓝图从(0,0,0)起铺),
 * 直接传送会卡在方块里。这里从配置点向上/向下找第一个"脚下有方块、身位和头顶是空气"的位置,
 * 只修正 y, x/z 仍严格固定在配置坐标(不引入随机)。
 * 死亡复活(onRespawn)、撤离/超时/退出(exitRaid)、重进(onJoin)三条路径共用本函数。 */
const AIR_BLOCK = new Set(['', 'air', 'empty', 'none']);
const isAirBlock = (nm) => { const s = String(nm == null ? '' : nm).toLowerCase(); return AIR_BLOCK.has(s); };
const blockAt = (x, y, z) => { try { return api.getBlock(Math.floor(x), Math.floor(y), Math.floor(z)); } catch(e) { return 'Air'; } };
const standableAt = (x, y, z) =>
  isAirBlock(blockAt(x, y, z)) && isAirBlock(blockAt(x, y + 1, z)) && !isAirBlock(blockAt(x, y - 1, z));

const getSpawnPos = (map) => {
  const sp = (map && Array.isArray(map.spawn)) ? map.spawn : [0, 0, 0];
  const x = Number(sp[0]) || 0;
  const y0 = Number(sp[1]) || 0;
  const z = Number(sp[2]) || 0;
  const bx = Math.floor(x), bz = Math.floor(z), sy = Math.floor(y0);
  /* 优先向上找(出生点在实心方块内/脚下被埋) */
  for (let dy = 0; dy <= 24; dy++) {
    if (standableAt(bx, sy + dy, bz)) return [x, sy + dy, z];
  }
  /* 其次向下找(出生点悬空但下方有地面,不超过12格) */
  for (let dy = 1; dy <= 12; dy++) {
    if (standableAt(bx, sy - dy, bz)) return [x, sy - dy, z];
  }
  /* 整列都不适合站立(如虚空/纯水): 保持在固定坐标,由引擎重力处理,绝不悄悄改回随机点 */
  return [x, y0, z];
};

const teleportToSpawn = (pId, map) => {
  const p = getSpawnPos(map);
  teleport(pId, p[0], p[1], p[2], [1, 0, 0]);
  return p;
};

const teleportToSearch = (pId, map) => {
  if (!map) return;
  const z = map.zones.search;
  const x = (z.min[0] + z.max[0]) / 2;
  const y = z.min[1] + 5;
  const zz = (z.min[2] + z.max[2]) / 2;
  teleport(pId, x, y, zz);
};

/* 撤离区中心(用于导航箭头) */
const getExtractCenter = (map) => {
  if (!map) return null;
  const z = map.zones.extract;
  return [ (z.min[0] + z.max[0]) / 2, (z.min[1] + z.max[1]) / 2, (z.min[2] + z.max[2]) / 2 ];
};

/* ===== 撤离点光点(mesh entity,常驻悬浮绿点,多撤离点每点一个) =====
 * 官方 API: attemptCreateMeshEntity(type, opts) 返回实体 eId; deleteMeshEntity(eId) 按返回的 eId 删除。
 * 没有自定义 id 参数,故用 Map 存 eId。用一个小尺寸自发光 Box 作标记,创建后 setPosition 定位。 */
const exfilEntityIds = new Map();   // `exfil_${mapKey}_${i}` -> 官方返回的实体 eId
const zoneCenter = (b) => [ (b.min[0] + b.max[0]) / 2, (b.min[1] + b.max[1]) / 2, (b.min[2] + b.max[2]) / 2 ];
const exfilCentersOf = (map) => {
  if (!map) return [];
  if (Array.isArray(map.exfils) && map.exfils.length > 0) return map.exfils.map(ex => zoneCenter(ex.zone));
  const c = getExtractCenter(map);
  return c ? [c] : [];
};

const MARKER_Y_OFFSET = 1.5;   // 悬浮在撤离点中心上方
const createExtractMarkers = (mapKey) => {
  const map = MAPS[mapKey];
  if (!map) return 0;
  const centers = exfilCentersOf(map);
  let made = 0;
  centers.forEach((c, i) => {
    const key = `exfil_${mapKey}_${i}`;
    try {
      const eId = api.attemptCreateMeshEntity('Box', {
        width: 0.6, height: 0.6, depth: 0.6,
        emissiveColor: [0, 255, 136],
      });
      if (!eId) return;
      try { api.setPosition(eId, c[0], c[1] + MARKER_Y_OFFSET, c[2]); } catch(e) {}
      exfilEntityIds.set(key, eId);
      made++;
    } catch(e) {}
  });
  return made;
};

const removeExtractMarkers = (mapKey) => {
  const map = MAPS[mapKey];
  if (!map) return;
  const n = exfilCentersOf(map).length;
  for (let i = 0; i < n; i++) {
    const eId = exfilEntityIds.get(`exfil_${mapKey}_${i}`);
    if (eId) {
      try { api.deleteMeshEntity(eId); } catch(e) {}
      exfilEntityIds.delete(`exfil_${mapKey}_${i}`);
    }
  }
};

const updatePlayerZone = (pId, map) => {
  const newZone = getPlayerZone(pId, map);
  const oldZone = playerZones.get(pId);
  if (newZone !== oldZone) {
    playerZones.set(pId, newZone);
    return { changed: true, from: oldZone, to: newZone };
  }
  return { changed: false, from: oldZone, to: newZone };
};

const getCachedZone = (pId) => playerZones.get(pId) || 'lobby';
const clearPlayerZone = (pId) => { playerZones.delete(pId); activeExfils.delete(pId); };

/* 刷怪: 按地图独立计数,activeMapKeys = Set<mapKey>(当前有玩家行动中的地图) */
const trySpawnMobs = (activeMapKeys) => {
  if (!activeMapKeys || activeMapKeys.size === 0) return;
  for (const mapKey of activeMapKeys) {
    const map = MAPS[mapKey];
    if (!map) continue;
    let counter = (mobTickCounters.get(mapKey) || 0) + 1;
    if (counter < map.mobInterval) { mobTickCounters.set(mapKey, counter); continue; }
    mobTickCounters.set(mapKey, 0);
    const z = map.zones.search;
    for (let i = 0; i < 3; i++) {
      const x = z.min[0] + Math.random() * (z.max[0] - z.min[0]);
      const y = z.min[1] + 5;
      const zz = z.min[2] + Math.random() * (z.max[2] - z.min[2]);
      const mobType = map.mobTypes[Math.floor(Math.random() * map.mobTypes.length)];
      try { mobs.spawnSmallMob(mobType, x, y, zz, map.MobStrong || 1); } catch(e) {}
    }
  }
};

const spawnGuard = (x, y, z, mobType = 'Draugr Knight') => {
  try { api.attemptSpawnMob(mobType, x, y + 1, z); } catch(e) {}
};

const resetMobTick = () => { mobTickCounters.clear(); };

module.exports = {
  getMapByKey, getMapList,
  isInZone, getPlayerZone, updatePlayerZone, getCachedZone, clearPlayerZone,
  getActiveExfil, getNearestExfilCenter,
  teleport, teleportToSpawn, getSpawnPos, teleportToSearch, getExtractCenter,
  createExtractMarkers, removeExtractMarkers,
  trySpawnMobs, spawnGuard, resetMobTick,
};
