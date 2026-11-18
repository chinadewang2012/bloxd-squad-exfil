// ============================================
// operators.js - 干员系统 (CommonJS)
// ============================================
// 技能释放: 手持技能物品单击(onPlayerClick)或 /skill 指令

const config = require("./config.js");
const OPERATORS = config.OPERATORS;
const CONST = config.CONST;
const db = require("./db.js");
const team = require("./team.js");
const lootMod = require("./loot.js");

const playerOperators = new Map();
const skillCooldowns = new Map();
const activeEffects = new Map();
/* 供 game.js 的 updateWeight 判断: 冲刺技能是否仍在生效(避免背包变动按负重重算移速、提前取消加速) */
globalThis.isSprinting = (pId) => { try { const e = activeEffects.get(pId); return !!(e && e.speed && e.speed > Date.now()); } catch(e) { return false; } };

const setPlayerOperator = (pId, opKey) => {
  if (!OPERATORS[opKey]) return false;
  playerOperators.set(pId, opKey);
  db.setOperator(pId, opKey);
  applyPassive(pId, opKey);
  ensureSkillItems(pId, opKey);   // 技能物品+补给放2/3/4格(带认证附魔)
  return true;
};

/* 干员技能物品(2格,带认证标记)+ 无限补给(3/4格),被消耗后由game.js周期性补充 */
const ensureSkillItems = (pId, opKey) => {
  const op = OPERATORS[opKey];
  if (!op) return;
  try {
    const want2 = api.getItemSlot(pId, 2);
    if (!want2 || want2.name !== op.skillItem) lootMod.giveMarkedItem(pId, 2, op.skillItem, 1, 1);
    const s1 = op.supplies[0], s2 = op.supplies[1];
    const want3 = api.getItemSlot(pId, 3);
    if (!want3 || want3.name !== s1[0]) lootMod.giveMarkedItem(pId, 3, s1[0], s1[1], 1);
    const want4 = api.getItemSlot(pId, 4);
    if (!want4 || want4.name !== s2[0]) lootMod.giveMarkedItem(pId, 4, s2[0], s2[1], 1);
  } catch(e) {}
};

const getPlayerOperator = (pId) => {
  if (playerOperators.has(pId)) return playerOperators.get(pId);
  const saved = db.getOperator(pId);
  if (saved && OPERATORS[saved]) { playerOperators.set(pId, saved); return saved; }
  return null;
};

const getOperatorConfig = (opKey) => OPERATORS[opKey] || null;

/* 干员被动基础移速(负重系统在此基础上乘减速系数) */
const getOperatorBaseSpeed = (pId) => {
  const opKey = getPlayerOperator(pId);
  const op = opKey ? OPERATORS[opKey] : null;
  return (op && op.passive && op.passive.speedMultiplier) || 1;
};

const applyPassive = (pId, opKey) => {
  const op = OPERATORS[opKey];
  if (!op || !op.passive) return;
  try {
    const p = op.passive;
    if (p.speedMultiplier !== undefined) api.setClientOption(pId, 'speedMultiplier', p.speedMultiplier);
    if (p.maxHealth !== undefined) { api.setClientOption(pId, 'maxHealth', p.maxHealth); api.setClientOption(pId, 'initialHealth', p.maxHealth); }
    if (p.canSeeNametagsThroughWalls !== undefined) api.setClientOption(pId, 'canSeeNametagsThroughWalls', p.canSeeNametagsThroughWalls);
  } catch(e) {}
};

const canUseSkill = (pId) => {
  const opKey = getPlayerOperator(pId);
  if (!opKey) return false;
  const op = OPERATORS[opKey];
  if (!op || !op.skill) return false;
  const cd = skillCooldowns.get(pId) || {};
  const lastUse = cd[opKey] || 0;
  return Date.now() >= lastUse + op.skill.cooldown;
};

const getSkillCooldown = (pId) => {
  const opKey = getPlayerOperator(pId);
  if (!opKey) return 0;
  const op = OPERATORS[opKey];
  if (!op || !op.skill) return 0;
  const cd = skillCooldowns.get(pId) || {};
  const lastUse = cd[opKey] || 0;
  const remaining = (lastUse + op.skill.cooldown) - Date.now();
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
};

const useSkill = (pId) => {
  const opKey = getPlayerOperator(pId);
  if (!opKey) return { success: false, reason: '未选择干员' };
  const op = OPERATORS[opKey];
  if (!op || !op.skill) return { success: false, reason: '无技能' };
  if (!canUseSkill(pId)) return { success: false, reason: `冷却中: ${getSkillCooldown(pId)}s` };
  const skill = op.skill;
  const cd = skillCooldowns.get(pId) || {};
  cd[opKey] = Date.now();          // 修复: 记录使用时刻,而非"使用时刻+CD"(原实现实际CD翻倍)
  skillCooldowns.set(pId, cd);
  executeSkill(pId, opKey, skill);
  return { success: true, skillName: skill.name };
};

/* 手持技能物品单击释放(game.js的onPlayerClick转发) */
const tryUseSkillFromItem = (pId, heldItemName) => {
  const opKey = getPlayerOperator(pId);
  if (!opKey) return null;
  const op = OPERATORS[opKey];
  if (!op || heldItemName !== op.skillItem) return null;
  return useSkill(pId);
};

const executeSkill = (pId, opKey, skill) => {
  try {
    switch (skill.type) {
      case 'speed':
        api.setClientOption(pId, 'speedMultiplier', skill.power);
        {
          const effects = activeEffects.get(pId) || {};
          effects.speed = Date.now() + skill.durationMs;
          activeEffects.set(pId, effects);
        }
        break;
      case 'heal': {
        let cur = CONST.maxHP;
        try { const h = api.getHealth(pId); if (typeof h === 'number') cur = h; } catch(e) {}
        const op = OPERATORS[opKey];
        const maxHp = (op && op.passive && op.passive.maxHealth) || CONST.maxHP;
        const to = Math.min(maxHp, cur + skill.power);
        api.setHealth(pId, to);
        api.sendFlyingMiddleMessage(pId, [{str:`+${skill.power} HP`, style:{color:'#00FF00',fontSize:'2rem',fontWeight:'bold'}}], 5, 1000);
        break;
      }
      case 'reveal':
        /* 真透视效果(引擎自动到期);bloxd 对无效效果名静默忽略(不抛错),
         * 故无条件同时开启"穿透名牌"兜底,技能结束后由 updateEffects 复原 */
        try { api.applyEffect(pId, 'X-Ray Vision', skill.durationMs); } catch(e) {}
        try {
          api.setClientOption(pId, 'canSeeNametagsThroughWalls', true);
          const effects = activeEffects.get(pId) || {};
          effects.reveal = Date.now() + skill.durationMs;
          activeEffects.set(pId, effects);
        } catch(e) {}
        break;
      case 'stun': {
        const pos = api.getPosition(pId);
        const radius = skill.radius || 10;
        for (const otherId of api.getPlayerIds()) {
          if (otherId === pId) continue;
          if (team.isSameTeam(pId, otherId)) continue;   // 不影响队友
          if (CONST.whitelist.includes(api.getEntityName(otherId))) continue;  // 服主豁免
          try {
            const oPos = api.getPosition(otherId);
            const dist = Math.sqrt((pos[0]-oPos[0])**2 + (pos[1]-oPos[1])**2 + (pos[2]-oPos[2])**2);
            if (dist <= radius) {
              try { api.applyEffect(otherId, 'Slowness', skill.durationMs); } catch(e2) {}
              try { api.shakePlayerCamera(otherId, 1, skill.durationMs); } catch(e2) {}
            }
          } catch(e) {}
        }
        break;
      }
    }
  } catch(e) {}
};

const updateEffects = (pId) => {
  const effects = activeEffects.get(pId);
  if (!effects) return;
  const now = Date.now();
  let changed = false;
  if (effects.speed && now >= effects.speed) {
    delete effects.speed;
    changed = true;
    /* 冲刺结束 -> 交回game.js按 干员被动x负重 重算移速 */
    if (typeof globalThis.onSpeedRecalc === 'function') {
      try { globalThis.onSpeedRecalc(pId); } catch(e) {}
    } else {
      try { api.setClientOption(pId, 'speedMultiplier', getOperatorBaseSpeed(pId)); } catch(e) {}
    }
  }
  if (effects.reveal && now >= effects.reveal) {
    delete effects.reveal;
    changed = true;
    try { api.setClientOption(pId, 'canSeeNametagsThroughWalls', false); } catch(e) {}
  }
  if (!changed) return;
  if (Object.keys(effects).length === 0) activeEffects.delete(pId);
  else activeEffects.set(pId, effects);
};

const initPlayerOperator = (pId) => {
  const saved = db.getOperator(pId);
  if (saved && OPERATORS[saved]) setPlayerOperator(pId, saved);
};

const clearPlayerOperator = (pId) => {
  playerOperators.delete(pId);
  skillCooldowns.delete(pId);
  activeEffects.delete(pId);
};

const getOperatorList = () => {
  return Object.entries(OPERATORS).map(([key, op]) => ({
    key, name: op.name, desc: op.desc, icon: op.icon, color: op.color,
    skillName: op.skill ? op.skill.name : '',   // 防御: 无技能干员不抛错
  }));
};

module.exports = {
  setPlayerOperator, getPlayerOperator, getOperatorConfig, applyPassive,
  canUseSkill, getSkillCooldown, useSkill, tryUseSkillFromItem,
  ensureSkillItems, getOperatorBaseSpeed,
  updateEffects, initPlayerOperator, clearPlayerOperator, getOperatorList,
};
