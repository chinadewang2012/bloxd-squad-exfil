﻿// ============================================
// menu.js - 自定义菜单系统 (CommonJS)
// ============================================

const config = require("./config.js");
const OPERATORS = config.OPERATORS;
const MAPS = config.MAPS;
const CONST = config.CONST;
const THEME = config.THEME;
const STATUS = config.STATUS;
const GEAR = config.GEAR;
const INSURANCE = config.INSURANCE;
const maps = require("./maps.js");
const getMapList = maps.getMapList;
/* 玩家地图key统一走game.js的解析口(单一状态源) */
const getMapKeyOf = (pId) => {
  try { return typeof globalThis.__getPlayerMapKey === 'function' ? globalThis.__getPlayerMapKey(pId) : null; } catch(e) { return null; }
};
const operators = require("./operators.js");
const getOperatorList = operators.getOperatorList;
const setPlayerOperator = operators.setPlayerOperator;
const getPlayerOperator = operators.getPlayerOperator;
const team = require("./team.js");
const createTeam = team.createTeam;
const getTeamInfo = team.getTeamInfo;
const invitePlayer = team.invitePlayer;
const leaveTeam = team.leaveTeam;
const acceptInvite = team.acceptInvite;
const declineInvite = team.declineInvite;
const safeLeaveTeam = team.safeLeaveTeam;
const teamMod = team;
const loot = require("./loot.js");
const giveMarkedItem = loot.giveMarkedItem;
const calculateGearScore = loot.calculateGearScore;
const sellAllLoot = loot.sellAllLoot;
const db = require("./db.js");

const CAT = {
  /* 单链流程根节点=选图(已删除原主菜单,不再作为回退落点) */
  MAP:      'map_select',
  OPERATOR: 'op_select',
  LOADOUT:  'loadout',        // 玩家状态/开始游戏确认界面(进图后销毁,只展示战备相关)
  TEAM:     'team_menu',
  INSURE:   'insure_shop',    // 保险商人
  KNIFE:    'knife_shop',     // 刀皮商店
  SELL:     'sell_merchant',  // 变卖商人
  ADMIN:    'admin_menu',     // 管理员菜单(仅管理员可见)
  /* 删除: STATUS(冗余,LOADOUT已展示战备/装备)、INVITE(合并进 TEAM) */
};

/* ===== 单链页面状态(每个玩家独立) =====
 * 作用: 1) 记录当前所在页,旧页面的按钮点击一律拒绝(界面切换后旧回调立即失效)
 *       2) 兜底同一按钮 350ms 内双击,防止一次点击触发两次跳转
 * 玩家离线/进图/退出时由 forgetPlayer / handleLoadoutMenu 清理 */
const playerPage = new Map();      // pId -> 当前页面 category
const lastMenuClick = new Map();   // pId -> { key, at }
const internalOpenUntil = new Map(); // pId -> 服务器主动切页的时间戳(避免被 toggle 回调误清)
const getPlayerPage = (pId) => playerPage.get(pId) || null;
const setPlayerPage = (pId, cat) => { if (cat) playerPage.set(pId, cat); else playerPage.delete(pId); };
/* 切换页面: 先记状态再切 UI; 旧页面的排队点击随后会被 category 校验拒绝 */
const switchToPage = (pId, cat) => {
  setPlayerPage(pId, cat);
  internalOpenUntil.set(pId, Date.now() + 200);
  try { api.openShop(pId, true, cat, false); } catch(e) {}
};
/* 关闭菜单(根页面返回/进图) */
const closeShop = (pId) => {
  setPlayerPage(pId, null);
  internalOpenUntil.set(pId, Date.now() + 200);
  try { api.openShop(pId, false, null, false); } catch(e) {}
};

/* 生成"返回上一级"按钮配置(所有子界面统一) */
const BACK_ITEM = (desc, priority) => ({
  image: 'Maple Door', customTitle: '返回上一级', description: desc,
  buyButtonText: '返回', canBuy: true, cost: 0, sortPriority: priority,
});

/* 菜单层级导航(单链): 选图是根,无主菜单;根页面点返回=关闭菜单 */
const BACK_TARGET = {
  [CAT.OPERATOR]: CAT.MAP,
  [CAT.LOADOUT]:  CAT.OPERATOR,
  [CAT.TEAM]:     CAT.LOADOUT,
  [CAT.INSURE]:   CAT.LOADOUT,
  [CAT.KNIFE]:    CAT.LOADOUT,
  [CAT.SELL]:     CAT.LOADOUT,
  [CAT.ADMIN]:    CAT.LOADOUT,
};

/* 战备/状态界面展示的信息字段(LOADOUT 只展示这些, 纯战备确认页) */
const LOADOUT_FIELDS = ['map', 'operator', 'gear', 'armor', 'knife'];
const INFO_FIELDS = ['map', 'operator', 'gear', 'armor', 'knife', 'money', 'weight', 'insurance', 'title'];
const STATUS_EXTRA_FIELDS = ['rank', 'quests'];

const isRaiding = (pId) => {
  if (typeof globalThis.__isRaiding === 'function') return globalThis.__isRaiding(pId);
  return false;
};

/* ===== 管理员菜单辅助(仅白名单可见) ===== */
const isAdmin = (pId) => (typeof globalThis.__isAdmin === 'function') ? globalThis.__isAdmin(pId) : false;
/* 所有提示统一走聊天消息(用户要求),不再用 fly middle 飞字 */
const adminSay = (pId, r) => {
  const ok = r && r.ok, msg = (r && r.msg) ? r.msg : '操作完成';
  try { api.sendMessage(pId, [{str: String(msg), style:{color: ok ? '#00FF00' : '#FF5555'}}]); } catch(e) {}
};
const adminTargets = new Map();   // 管理员pId -> 当前选中的目标玩家id
const getAdminTarget = (pId) => adminTargets.get(pId) || null;
const adminMuteBtns = new Map();  // 管理员pId -> 已生成"解除禁言"按钮对应的玩家名数组
/* 多行结果(info/inv/禁言名单)也统一走聊天 */
const adminLong = (pId, msg) => { try { api.sendMessage(pId, [{str: String(msg), style:{color:'#FFFFFF'}}]); } catch(e) {} };

const openMenuByKey = (pId, cat) => {
  switch (cat) {
    case CAT.MAP:      openMapMenu(pId); break;
    case CAT.OPERATOR: openOperatorMenu(pId); break;
    case CAT.LOADOUT:  openLoadoutMenu(pId); break;
    case CAT.TEAM:     openTeamMenu(pId); break;
    case CAT.INSURE:   openInsureShopMenu(pId); break;
    case CAT.KNIFE:    openKnifeShopMenu(pId); break;
    case CAT.SELL:     openSellShopMenu(pId); break;
    case CAT.ADMIN:    openAdminMenu(pId); break;
    default:           openMapMenu(pId);   // 单链入口: 无主菜单,默认落到选图
  }
};

/* 所有流程提示走聊天消息, 不再飞字 */
const flowHint = (pId, text) => {
  try { api.sendMessage(pId, [{str: String(text), style:{color:'#FFD700',fontWeight:'bold'}}]); } catch(e) {}
};

/* ===== 菜单初始化 ===== */

const initMapMenu = () => {
  try {
    api.configureShopCategory(CAT.MAP, { customTitle: '选择地图', description: '选好地图后进入干员选择; 下方购买类按钮不要求先选图', autoSelectCategory: true });
    for (const map of getMapList()) {
      const m = MAPS[map.key];
      const exfilLine = m.exfils
        ? (() => {
            /* 去重: 不用 [...new Set(arr)] — Bloxd 引擎 Set 不可迭代 */
            const seen = {}, types = [];
            m.exfils.forEach(e => { const t = e.type; if (!seen[t]) { seen[t] = 1; types.push(t); } });
            return `\n撤离点: ${m.exfils.length}处 (${types.join('/')})`;
          })()
        : '';
      api.createShopItem(CAT.MAP, map.key, {
        image: 'Compass',
        customTitle: `${map.name} (${map.searchTime}秒)`,
        description: `搜索时长: ${Math.floor(map.searchTime/60)}分${map.searchTime%60}秒\n战备门槛: ${m.gearReq || 0}\n怪物: ${m.mobTypes.join(', ')}${exfilLine}`,
        buyButtonText: '选择', canBuy: true, cost: 0, sortPriority: 200,
      });
    }
    /* 购买类 / 服务类入口 —— 初始就可见, 不要求先选图; 战斗中由 handleMapSelect 里的 blockIfRaiding 拦截 */
    api.createShopItem(CAT.MAP, 'sell', { image: 'Block of Iron', customTitle: '💰 变卖商人', description: '一键变卖背包战利品换金币(保险格物品不受影响)', buyButtonText: '打开', canBuy: true, cost: 0, sortPriority: 90 });
    api.createShopItem(CAT.MAP, 'insure', { image: 'Gold Coin', customTitle: '🛡 保险商人', description: '购买保险套餐,死亡保留对应格装备', buyButtonText: '打开', canBuy: true, cost: 0, sortPriority: 89 });
    api.createShopItem(CAT.MAP, 'knife', { image: 'Moonstone Dagger', customTitle: '🗡 刀皮商店', description: '购买主武器刀皮肤', buyButtonText: '打开', canBuy: true, cost: 0, sortPriority: 88 });
    api.createShopItem(CAT.MAP, 'checkin', { image: 'Gold Coin', customTitle: '📅 每日签到', description: '连签奖励递增,7天一循环', buyButtonText: '签到', canBuy: true, cost: 0, sortPriority: 87 });
    api.createShopItem(CAT.MAP, 'team', { image: 'Chest', customTitle: '👥 队伍管理', description: '创建/加入/管理3人小队', buyButtonText: '打开', canBuy: true, cost: 0, sortPriority: 86 });
    api.createShopItem(CAT.MAP, 'back', BACK_ITEM('关闭菜单', -100));
  } catch(e) {}
};

const initOperatorMenu = () => {
  try {
    api.configureShopCategory(CAT.OPERATOR, { customTitle: '选择干员', description: '手持技能物品单击释放技能' });
    for (const op of getOperatorList()) {
      const cfg = OPERATORS[op.key];
      const skillDesc = cfg.skill ? `技能: ${cfg.skill.name}(${cfg.skillItem}单击释放)` : '';
      api.createShopItem(CAT.OPERATOR, op.key, {
        image: 'Knight Sword', imageColour: op.color,
        customTitle: op.name, description: `${op.desc}\n${skillDesc}`,
        buyButtonText: '选择', canBuy: true, cost: 0,
      });
    }
    api.createShopItem(CAT.OPERATOR, 'back', BACK_ITEM('回到地图选择', -100));
  } catch(e) {}
};

/* 玩家状态/开始游戏确认界面:只展示战备相关 + 进入游戏 + 返回
 * 删除了签到/变卖/保险/刀皮/队伍/状态/管理员入口 —— 这些要么是服务要么是指令,不在进图流程里 */
const initLoadoutMenu = () => {
  try {
    api.configureShopCategory(CAT.LOADOUT, { customTitle: '战备确认', description: '确认装备后点"进入游戏"(战备值需达到地图门槛)' });
    let i = 0;
    for (const f of LOADOUT_FIELDS) {
      api.createShopItem(CAT.LOADOUT, f, { image: 'Book', customTitle: '加载中...', description: '', buyButtonText: '-', canBuy: false, cost: 0, sortPriority: 100 - i });
      i++;
    }
    api.createShopItem(CAT.LOADOUT, 'enter', {
      image: 'Spawn Block (Green)', customTitle: '进入游戏',
      description: '传送进搜索区,开始行动', buyButtonText: '进入游戏', canBuy: true, cost: 0, sortPriority: 10,
    });
    api.createShopItem(CAT.LOADOUT, 'back', BACK_ITEM('回到干员选择', -100));
  } catch(e) {}
};

const initTeamMenu = () => {
  try {
    api.configureShopCategory(CAT.TEAM, { customTitle: '队伍管理', description: '最多3人组队,队内禁友伤' });
    api.createShopItem(CAT.TEAM, 'create', { image: 'Spawn Block (Green)', customTitle: '创建队伍', description: '创建新队伍并成为队长', buyButtonText: '创建', canBuy: true, cost: 0 });
    api.createShopItem(CAT.TEAM, 'leave', { image: 'Red Wool', customTitle: '离开队伍', description: '退出当前队伍(比赛中不可退)', buyButtonText: '离开', canBuy: true, cost: 0 });
    api.createShopItem(CAT.TEAM, 'view', { image: 'Name Tag', customTitle: '查看队员', description: '列出当前小队所有队员信息', buyButtonText: '查看', canBuy: true, cost: 0 });
    api.createShopItem(CAT.TEAM, 'invite', {
      image: 'Name Tag', customTitle: '邀请队员',
      description: '下拉选择玩家后点击邀请', buyButtonText: '邀请加入',
      canBuy: true, cost: 0, userInput: { type: 'player' },
    });
    api.createShopItem(CAT.TEAM, 'back', BACK_ITEM('回到玩家状态', -100));
  } catch(e) {}
};

/* tp列表式邀请菜单已删除,邀请走 TEAM 页内 invite 按钮 */

/* 保险商人 */
const initInsureShopMenu = () => {
  try {
    api.configureShopCategory(CAT.INSURE, { customTitle: '保险商人', description: '购买套餐后,保险格固定为背包弹药槽(第11格)之后的前N格,死亡保留' });
    let i = 0;
    for (const [itemKey, pkg] of Object.entries(INSURANCE.packages)) {
      api.createShopItem(CAT.INSURE, itemKey, {
        image: itemKey, customTitle: pkg.name,
        description: `可保险 ${pkg.slots} 格\n价格: ${pkg.cost} 金币`,
        buyButtonText: '购买', canBuy: true, cost: 0, sortPriority: 100 - i,
      });
      i++;
    }
    api.createShopItem(CAT.INSURE, 'back', BACK_ITEM('回到玩家状态', -100));
  } catch(e) {}
};

/* 刀皮商店 */
const initKnifeShopMenu = () => {
  try {
    api.configureShopCategory(CAT.KNIFE, { customTitle: '刀皮商店', description: '购买后立即装备到主武器格' });
    let i = 0;
    for (const skin of STATUS.knifeSkins) {
      api.createShopItem(CAT.KNIFE, skin.key, {
        image: skin.item, customTitle: skin.name,
        description: skin.cost > 0 ? `价格: ${skin.cost} 金币` : '免费默认',
        buyButtonText: '购买', canBuy: true, cost: 0, sortPriority: 100 - i,
      });
      i++;
    }
    api.createShopItem(CAT.KNIFE, 'back', BACK_ITEM('回到玩家状态', -100));
  } catch(e) {}
};

/* 变卖商人: 估值信息项 + 一键变卖 */
const initSellShopMenu = () => {
  try {
    api.configureShopCategory(CAT.SELL, { customTitle: '变卖商人', description: '把搜刮到的战利品卖给我!' });
    api.createShopItem(CAT.SELL, 'value', {
      image: 'Gold Coin', customTitle: '背包估值', description: '加载中...', buyButtonText: '-', canBuy: false, cost: 0, sortPriority: 100,
    });
    api.createShopItem(CAT.SELL, 'sellall', {
      image: 'Spawn Block (Green)', customTitle: '一键变卖',
      description: '卖出背包内全部有价战利品\n(保险格物品不会被卖)', buyButtonText: '变卖', canBuy: true, cost: 0, sortPriority: 90,
    });
    api.createShopItem(CAT.SELL, 'back', BACK_ITEM('回到玩家状态', -100));
  } catch(e) {}
};

/* 自身状态页已删除: 完整信息通过 /status 指令看,LOADOUT 只保留战备相关 */

/* ===== 动态刷新 ===== */

/* per-player商店项: 已存在则更新,不存在则创建 */
const upsertShopItemForPlayer = (pId, cat, key, opts) => {
  try { api.createShopItemForPlayer(pId, cat, key, opts); }
  catch(e) { try { api.updateShopItemForPlayer(pId, cat, key, opts); } catch(e2) {} }
};

/* 邀请列表/状态页已删除: 邀请走 TEAM 页 invite 按钮, 完整状态用 /status 指令 */

/* 刷新玩家信息展示项(LOADOUT 只展示 LOADOUT_FIELDS; 完整信息不再有页面,用指令) */
const refreshPlayerInfo = (pId, cat) => {
  try {
    const fields = (cat === CAT.LOADOUT) ? LOADOUT_FIELDS : INFO_FIELDS;
    const has = (f) => fields.includes(f);
    /* 当前地图 */
    const mk = getMapKeyOf(pId);
    const map = mk && MAPS[mk] ? MAPS[mk] : null;
    if (has('map')) api.updateShopItemForPlayer(pId, cat, 'map', {
      image: 'Compass', customTitle: '当前地图', canBuy: false, buyButtonText: '-',
      description: map ? `${map.name} (战备门槛${map.gearReq || 0})` : '未选择',
    });
    /* 干员 */
    if (has('operator')) {
      const opKey = getPlayerOperator(pId);
      const op = opKey && OPERATORS[opKey] ? OPERATORS[opKey] : null;
      api.updateShopItemForPlayer(pId, cat, 'operator', {
        image: 'Knight Sword', customTitle: '干员', description: op ? `${op.name} - ${op.desc}` : '未选择', canBuy: false, buyButtonText: '-',
      });
    }
    /* 战备值 */
    if (has('gear')) {
      const gear = calculateGearScore(pId);
      const req = map ? (map.gearReq || 0) : 0;
      api.updateShopItemForPlayer(pId, cat, 'gear', {
        image: 'Diamond Chestplate', customTitle: '战备值',
        description: map ? `当前 ${gear} / 门槛 ${req} ${gear >= req ? '(可进入)' : '(不足,给装备打zhanbei附魔提升)'}` : `${gear}(未选图)`,
        canBuy: false, buyButtonText: '-',
      });
    }
    /* 装甲 */
    if (has('armor')) {
      const armorSlots = STATUS.armorSlots;
      const armorInfo = [];
      for (const part of ['helmet', 'chestplate', 'leggings', 'boots', 'offhand']) {
        try {
          const item = api.getItemSlot(pId, armorSlots[part]);
          armorInfo.push(`${part}: ${item && item.name ? item.name : '无'}`);
        } catch(e) { armorInfo.push(`${part}: ?`); }
      }
      api.updateShopItemForPlayer(pId, cat, 'armor', {
        image: 'Iron Chestplate', customTitle: '装甲',
        description: armorInfo.join('\n'), canBuy: false, buyButtonText: '-',
      });
    }
    /* 刀皮 */
    if (has('knife')) {
      const skinKey = db.getKnifeSkin(pId);
      const skin = STATUS.knifeSkins.find(s => s.key === skinKey) || STATUS.knifeSkins[0];
      api.updateShopItemForPlayer(pId, cat, 'knife', {
        image: skin.item, customTitle: '刀皮', description: skin.name, canBuy: false, buyButtonText: '-',
      });
    }
    /* 存款 */
    if (has('money')) {
      const money = db.getMoney(pId);
      api.updateShopItemForPlayer(pId, cat, 'money', {
        image: 'Gold Coin', customTitle: '存款', description: `${money} 金币`, canBuy: false, buyButtonText: '-',
      });
    }
    /* 负重 */
    if (has('weight')) {
      const wt = db.getWeight(pId);
      const wtRatio = Math.floor((wt / CONST.weight.maxLoad) * 100);
      api.updateShopItemForPlayer(pId, cat, 'weight', {
        image: 'Block of Iron', customTitle: '负重',
        description: `${wt}/${CONST.weight.maxLoad} (${wtRatio}%)`, canBuy: false, buyButtonText: '-',
      });
    }
    /* 保险 */
    if (has('insurance')) {
      const pkg = db.getInsuredPackage(pId);
      const pending = db.getInsPending(pId).length;
      api.updateShopItemForPlayer(pId, cat, 'insurance', {
        image: 'Gold Coin', customTitle: '保险',
        description: `${pkg.name} (固定${pkg.slots}格)\n保险格: 背包弹药槽后${pkg.slots}格(不可移动)${pending > 0 ? `\n待归还装备: ${pending}件(下局自动归还)` : ''}`,
        canBuy: false, buyButtonText: '-',
      });
    }
    /* 称号 */
    if (has('title')) {
      const titleKey = db.getTitle(pId);
      const titleObj = CONST.titles[titleKey] || CONST.titles.rookie;
      api.updateShopItemForPlayer(pId, cat, 'title', {
        image: 'Name Tag', customTitle: '称号', description: titleObj.name, canBuy: false, buyButtonText: '-',
      });
    }
  } catch(e) {}
};

/* ===== 管理员菜单 ===== */
const initAdminMenu = () => {
  try {
    api.configureShopCategory(CAT.ADMIN, { customTitle: '⚙ 管理员工具', description: '仅管理员可见: 先点"选择目标玩家"下拉选人, 再执行操作' });
    /* 核心修复: 使用官方 userInput:{type:"player"} 让引擎弹出玩家下拉框
     * 之前按玩家 ID 造的普通按钮不会触发选人, 必须走 userInput 机制 */
    api.createShopItem(CAT.ADMIN, 'target', {
      image: 'Name Tag', customTitle: '🎯 选择目标玩家',
      description: '弹出玩家下拉框, 选中后设为当前操作目标',
      buyButtonText: '选人', canBuy: true, cost: 0, sortPriority: 200,
      userInput: { type: 'player', excludedPlayers: [] },   // 不排除任何人(包括自己)
    });
    api.createShopItem(CAT.ADMIN, 'give1', { image: 'Gold Coin', customTitle: '💰 给与金币 1,000', description: '给选中玩家 +1000 金币', buyButtonText: '给与', canBuy: true, cost: 0, sortPriority: 90 });
    api.createShopItem(CAT.ADMIN, 'give2', { image: 'Gold Bar', customTitle: '💰 给与金币 10,000', description: '给选中玩家 +10000 金币', buyButtonText: '给与', canBuy: true, cost: 0, sortPriority: 89 });
    api.createShopItem(CAT.ADMIN, 'give3', { image: 'Block of Gold', customTitle: '💰 给与金币 100,000', description: '给选中玩家 +100000 金币', buyButtonText: '给与', canBuy: true, cost: 0, sortPriority: 88 });
    api.createShopItem(CAT.ADMIN, 'goto', { image: 'Compass', customTitle: '🚀 传送至该玩家', description: '把你传送到选中玩家当前位置', buyButtonText: '传送', canBuy: true, cost: 0, sortPriority: 80 });
    api.createShopItem(CAT.ADMIN, 'bring', { image: 'Spawn Block (Green)', customTitle: '📥 强制传送该玩家至我', description: '把选中玩家传送到你当前位置', buyButtonText: '拉过来', canBuy: true, cost: 0, sortPriority: 79 });
    api.createShopItem(CAT.ADMIN, 'clear', { image: 'Chest', customTitle: '🧹 清理该玩家背包', description: '清空选中玩家的背包(慎用)', buyButtonText: '清理', canBuy: true, cost: 0, sortPriority: 70 });
    api.createShopItem(CAT.ADMIN, 'mute1', { image: 'Book', customTitle: '🔇 禁言 1 分钟', description: '禁言选中玩家 1 分钟(到期自动解除)', buyButtonText: '禁言', canBuy: true, cost: 0, sortPriority: 64 });
    api.createShopItem(CAT.ADMIN, 'mute5', { image: 'Book', customTitle: '🔇 禁言 5 分钟', description: '禁言选中玩家 5 分钟(到期自动解除)', buyButtonText: '禁言', canBuy: true, cost: 0, sortPriority: 63 });
    api.createShopItem(CAT.ADMIN, 'mute10', { image: 'Book', customTitle: '🔇 禁言 10 分钟', description: '禁言选中玩家 10 分钟(到期自动解除)', buyButtonText: '禁言', canBuy: true, cost: 0, sortPriority: 62 });
    api.createShopItem(CAT.ADMIN, 'mute30', { image: 'Book', customTitle: '🔇 禁言 30 分钟', description: '禁言选中玩家 30 分钟(到期自动解除)', buyButtonText: '禁言', canBuy: true, cost: 0, sortPriority: 61 });
    api.createShopItem(CAT.ADMIN, 'mutePerm', { image: 'Bone Block', customTitle: '⛔ 永久禁言', description: '永久禁言选中玩家(需管理员手动解除)', buyButtonText: '禁言', canBuy: true, cost: 0, sortPriority: 60 });
    api.createShopItem(CAT.ADMIN, 'unmute', { image: 'Moonstone Fragment', customTitle: '🔊 解除禁言', description: '恢复选中玩家的聊天(中途结束禁言)', buyButtonText: '解除', canBuy: true, cost: 0, sortPriority: 59 });
    api.createShopItem(CAT.ADMIN, 'info', { image: 'Book', customTitle: '📊 查看玩家数据', description: '查看选中玩家的金币/战绩/段位/称号/干员/保险/负重', buyButtonText: '查看', canBuy: true, cost: 0, sortPriority: 49 });
    api.createShopItem(CAT.ADMIN, 'inv', { image: 'Chest', customTitle: '🎒 查看背包/数值', description: '查看选中玩家的背包物品 + 战备值 + 可变卖估值', buyButtonText: '查看', canBuy: true, cost: 0, sortPriority: 48 });
    api.createShopItem(CAT.ADMIN, 'mutelist', { image: 'Moonstone Fragment', customTitle: '📋 禁言名单(查看/解除)', description: '查看被禁言玩家及剩余时长,可一键中途解除(含离线)', buyButtonText: '查看', canBuy: true, cost: 0, sortPriority: 47 });
    api.createShopItem(CAT.ADMIN, 'invis', { image: 'Beacon', customTitle: '👻 隐身 开/关', description: '切换隐身: 其他玩家看不到你', buyButtonText: '切换', canBuy: true, cost: 0, sortPriority: 50 });
    api.createShopItem(CAT.ADMIN, 'back', BACK_ITEM('回到玩家状态', -100));
  } catch(e) {}
};

const adminTargetName = (pId) => {
  const t = getAdminTarget(pId);
  if (!t) return '未选择';
  try { return api.getEntityName(t) || String(t); } catch(e) { return String(t); }
};

const fmtRemain = (ms) => {
  if (!isFinite(ms) || ms >= 8640000000000000) return '永久';
  const s = Math.max(1, Math.round(ms / 1000));
  if (s >= 3600) return `${Math.floor(s/3600)}时${Math.floor((s%3600)/60)}分`;
  if (s >= 60) return `${Math.floor(s/60)}分${s%60}秒`;
  return `${s}秒`;
};

/* 更新目标状态展示(info 固定项): 只刷新禁言状态描述, 不再按在线玩家动态造按钮
 * 选人统一走 initAdminMenu 里的 userInput:{type:"player"} 原生下拉 */
const updateAdminMenuForPlayer = (pId) => {
  try {
    const t = getAdminTarget(pId);
    /* 已选中的目标玩家如果已离线, 自动清空并提示 */
    if (t != null) {
      let online = false;
      for (const id of api.getPlayerIds()) { if (String(id) === String(t)) { online = true; break; } }
      if (!online) {
        adminTargets.set(pId, null);
        try { api.sendMessage(pId, [{str:'⚠ 之前选择的目标玩家已离线, 请重新选人', style:{color:'#FF8800',fontWeight:'bold'}}]); } catch(e) {}
      }
    }
    let muted = false, remain = 0;
    if (t) {
      if (typeof globalThis.__adminIsMuted === 'function') { try { muted = globalThis.__adminIsMuted(t); } catch(e) {} }
      if (muted && typeof globalThis.__adminMuteRemaining === 'function') { try { remain = globalThis.__adminMuteRemaining(t); } catch(e) {} }
    }
    const muteLine = muted ? `禁言中,剩余 ${fmtRemain(remain)}` : '正常';
    /* 动态"当前目标"用独立 key: 原 'info' 会覆盖 initAdminMenu 的"查看玩家数据"按钮(key 相同) */
    upsertShopItemForPlayer(pId, CAT.ADMIN, 'targetinfo', {
      image: 'Book', customTitle: `当前目标: ${adminTargetName(pId)}`,
      description: t ? `在线\n禁言状态: ${muteLine}\n点上方"🎯 选择目标玩家"按钮下拉选人` : '请先点上方"🎯 选择目标玩家"下拉选一人',
      canBuy: false, sortPriority: 199,
    });
  } catch(e) {}
};

const openAdminMenu = (pId) => {
  if (!isAdmin(pId)) { flowHint(pId, '⛔ 无权限: 仅管理员可用'); return; }
  updateAdminMenuForPlayer(pId);
  switchToPage(pId, CAT.ADMIN);
};

const handleAdminMenu = (pId, itemKey, userInput) => {
  if (!isAdmin(pId)) { adminSay(pId, { ok:false, msg:'⛔ 无权限' }); return; }
  const act = (action, arg) => (typeof globalThis.__adminAction === 'function') ? globalThis.__adminAction(action, pId, getAdminTarget(pId), arg) : { ok:false, msg:'动作不可用' };
  const run = (action, arg) => { adminSay(pId, act(action, arg)); updateAdminMenuForPlayer(pId); };
  switch (itemKey) {
    /* 原生玩家下拉: userInput 可能是玩家 ID (字符串) 或 玩家名, 统一用 findPlayerByName 解析 */
    case 'target': {
      if (!userInput) { adminSay(pId, { ok:false, msg:'⚠ 未选择玩家' }); break; }
      const t = findPlayerByName(String(userInput));
      if (!t) { adminSay(pId, { ok:false, msg:'⚠ 该玩家已下线或不存在' }); break; }
      adminTargets.set(pId, t);
      adminSay(pId, { ok:true, msg:`🎯 已选中目标: ${adminTargetName(pId)}` });
      updateAdminMenuForPlayer(pId);
      break;
    }
    case 'give1': run('give', 1000); break;
    case 'give2': run('give', 10000); break;
    case 'give3': run('give', 100000); break;
    case 'goto':  run('goto'); break;
    case 'bring': run('bring'); break;
    case 'clear': run('clear'); break;
    case 'mute1':  run('mute', 60000); break;
    case 'mute5':  run('mute', 300000); break;
    case 'mute10': run('mute', 600000); break;
    case 'mute30': run('mute', 1800000); break;
    case 'mutePerm': run('mute', 0); break;
    case 'unmute': run('unmute'); break;
    case 'info': { const r = act('info'); adminLong(pId, r.msg || r); updateAdminMenuForPlayer(pId); break; }
    case 'inv':  { const r = act('inv');  adminLong(pId, r.msg || r); break; }
    case 'mutelist': {
      const r = act('mutelist');
      adminLong(pId, r.msg);
      /* 重建该管理员的"解除禁言"按钮: 先清旧的, 再按当前名单建(可解离线玩家) */
      const old = adminMuteBtns.get(pId) || [];
      for (const n of old) { try { api.resetShopItemForPlayer(pId, CAT.ADMIN, 'unmute_' + n); } catch(e) {} }
      const names = (r && r.list) ? r.list : [];
      let sp = 55;
      for (const n of names) {
        upsertShopItemForPlayer(pId, CAT.ADMIN, 'unmute_' + n, {
          image: 'Moonstone Fragment', customTitle: `🔊 解除禁言: ${n}`, description: '点击中途解除该玩家禁言(可离线)',
          buyButtonText: '解除', canBuy: true, cost: 0, sortPriority: sp--,
        });
      }
      adminMuteBtns.set(pId, names);
      break;
    }
    case 'invis': adminSay(pId, (typeof globalThis.__adminAction === 'function') ? globalThis.__adminAction('invis', pId, pId) : { ok:false, msg:'动作不可用' }); break;
  }
  /* 动态"解除禁言_<玩家名>"按钮(禁言名单里生成, 支持离线玩家) */
  if (itemKey && String(itemKey).indexOf('unmute_') === 0) {
    const name = String(itemKey).slice('unmute_'.length);
    adminSay(pId, act('unmutename', name));
    try { api.resetShopItemForPlayer(pId, CAT.ADMIN, itemKey); } catch(e) {}
    adminMuteBtns.set(pId, (adminMuteBtns.get(pId) || []).filter(n => n !== name));
  }
};

/* 管理员入口(仅管理员可见,动态判定)
 * 不创建全局项: 仅对管理员 createShopItemForPlayer,普通玩家完全看不到;
 * 管理员被撤权/换人后 0.5秒内由 game.updateUI 调 refreshAdminEntry 检测变化并移除入口。 */
const adminEntryState = new Map();   // pId -> 上次判定的管理员状态(只在变化时打API)
const refreshAdminEntry = (pId) => {
  const nowAdmin = !!isAdmin(pId);
  const last = adminEntryState.get(pId);
  if (last === nowAdmin) return;
  adminEntryState.set(pId, nowAdmin);
  if (nowAdmin) {
    upsertShopItemForPlayer(pId, CAT.LOADOUT, 'admin', {
      image: 'Beacon', customTitle: '⚙ 管理员', description: '管理员工具(仅你可见): 给金币/传送/隐身/清背包/禁言',
      buyButtonText: '打开', canBuy: true, cost: 0, sortPriority: 40,
    });
  } else {
    /* 删除该玩家的 override = 该入口消失(全局无此项,普通玩家看不到) */
    try { api.resetShopItemForPlayer(pId, CAT.LOADOUT, 'admin'); } catch(e) {}
    /* 若正停留在管理员页,撤权后立即关闭 */
    if (getPlayerPage(pId) === CAT.ADMIN) {
      try { api.sendMessage(pId, [{str:'⚠ 管理员权限已失效,菜单已关闭', style:{color:'#FF5555',fontWeight:'bold'}}]); } catch(e) {}
      openMapMenu(pId);
    }
  }
};

const initMenus = () => {
  initAdminMenu();
  initMapMenu();
  initOperatorMenu();
  initLoadoutMenu();
  initTeamMenu();
  initInsureShopMenu();
  initKnifeShopMenu();
  initSellShopMenu();
  /* 已删除: initInviteMenu / initStatusMenu —— 邀请走 TEAM 页 invite 按钮, 完整状态用 /status 指令 */
};

/* ===== 菜单打开入口 ===== */

/* 签到按钮动态描述(连签天数/今日状态/下档奖励) */
const CHECKIN_REWARDS = (config.CHECKIN && Array.isArray(config.CHECKIN.rewards)) ? config.CHECKIN.rewards : [50];
const refreshCheckinButton = (pId) => {
  try {
    const rec = db.getCheckin(pId);
    const today = db.dateKeyOf(Date.now());
    const signed = rec.lastDate === today;
    const nextStreak = signed ? rec.streak : ((rec.lastDate === db.dateKeyOf(Date.now() - 86400000)) ? (rec.streak || 0) + 1 : 1);
    const nextReward = CHECKIN_REWARDS[(nextStreak - 1) % CHECKIN_REWARDS.length];
    upsertShopItemForPlayer(pId, CAT.MAP, 'checkin', {   /* 签到按钮建在 CAT.MAP, 刷新也必须写同一分类 */
      image: 'Gold Coin', customTitle: signed ? `每日签到 (已连签${rec.streak}天)` : '每日签到',
      description: signed
        ? `✅ 今日已签到\n连签: ${rec.streak}天\n明天可领 ${CHECKIN_REWARDS[rec.streak % CHECKIN_REWARDS.length]}💰`
        : `今日可领: ${nextReward}💰 (第${nextStreak}档)\n连签天数越多奖励越高,7天一循环`,
      buyButtonText: signed ? '已签到' : '签到',
      canBuy: !signed, cost: 0, sortPriority: 95,
    });
  } catch(e) {}
};

/* 签到按钮/入口统一走签到核心逻辑:优先 game.js 全局 Checkin(带成功播报);
 * 全局缺失时直接回退 db.doCheckin(不依赖 globalThis 跨模块),确保按钮一定可用 */
const handleCheckin = (pId) => {
  let r;
  try {
    if (typeof globalThis.Checkin === 'function') {
      r = globalThis.Checkin(pId);
    } else {
      r = db.doCheckin(pId);
      if (r && r.success) {
        try {
          api.sendMessage(pId, [
            {str:`📅 签到成功 第${r.streak}天`, style:{color:'#FFD700',fontWeight:'bold'}},
            {str:` +${r.reward}💰 (连签奖励)`, style:{color:'#00FF00',fontWeight:'bold'}},
          ]);
        } catch(e) {}
      }
    }
  } catch(e) {
    r = { success: false, reason: '签到异常: ' + ((e && e.message) ? e.message : e) };
  }
  if (!r || !r.success) flowHint(pId, `📅 ${(r && r.reason) || '签到失败'}`);
  refreshCheckinButton(pId);
  return r || { success: false, reason: '签到失败' };
};

/* 对局中封锁一切流程菜单(退出对局走 /jt 指令) */
const blockIfRaiding = (pId) => {
  if (teamMod.isInMatch(pId) || (typeof globalThis.__isRaiding === 'function' && globalThis.__isRaiding(pId))) {
    try { api.sendMessage(pId, [{str:'⚠ 正在行动中,请先撤离或阵亡后再操作菜单(用 /jt 退出)', style:{color:'#FF8800',fontWeight:'bold'}}]); } catch(e) {}
    return true;
  }
  return false;
};

/* 单链首步: 选图(无主菜单) */
const openMapMenu = (pId) => {
  if (blockIfRaiding(pId)) return;
  flowHint(pId, '🗺 请选择地图(选图 → 干员 → 玩家状态 → 进入游戏)');
  switchToPage(pId, CAT.MAP);
};

const openOperatorMenu = (pId) => {
  if (blockIfRaiding(pId)) return;
  if (!getMapKeyOf(pId)) {
    flowHint(pId, '请先选择地图!');
    openMapMenu(pId);
    return;
  }
  const mk = getMapKeyOf(pId);
  flowHint(pId, `当前地图: ${MAPS[mk] ? MAPS[mk].name : '?'} → 请选择干员`);
  switchToPage(pId, CAT.OPERATOR);
};

const openLoadoutMenu = (pId) => {
  if (blockIfRaiding(pId)) return;
  if (!getMapKeyOf(pId)) { flowHint(pId, '请先选择地图!'); openMapMenu(pId); return; }
  if (!getPlayerOperator(pId)) { flowHint(pId, '请先选择干员!'); openOperatorMenu(pId); return; }
  refreshPlayerInfo(pId, CAT.LOADOUT);
  refreshAdminEntry(pId);   // 管理员专属入口(只对管理员可见)
  flowHint(pId, '✅ 战备已确认, 点"进入游戏"开始行动');
  switchToPage(pId, CAT.LOADOUT);
};

const openTeamMenu = (pId) => {
  updateTeamMenuForPlayer(pId);
  switchToPage(pId, CAT.TEAM);
};

/* 保险/刀皮/变卖: 仅战斗外(大厅/待命区)可用; 战斗内由 blockIfRaiding 拒绝 */
const openInsureShopMenu = (pId) => {
  if (blockIfRaiding(pId)) return;
  const pkg = db.getInsuredPackage(pId);
  flowHint(pId, `当前套餐: ${pkg.name}(${pkg.slots}格)`);
  switchToPage(pId, CAT.INSURE);
};

const openKnifeShopMenu = (pId) => {
  if (blockIfRaiding(pId)) return;
  flowHint(pId, `当前刀皮: ${(STATUS.knifeSkins.find(s => s.key === db.getKnifeSkin(pId)) || STATUS.knifeSkins[0]).name}`);
  switchToPage(pId, CAT.KNIFE);
};

/* 变卖商人估值项的描述(打开/变卖后共用,避免两处文案漂移)
 * 按三角洲风格分类列出背包中可变卖的物品(稀有度前缀 + 中文名 + 数量/小计) */
const sellValueDesc = (pId) => {
  if (typeof loot.sellPanel !== 'function') return '⚠ 变卖目录未就绪:loot.js 是旧版,请重新粘贴 loot.js + config.js';
  let total = 0, byCat = new Map();
  try { const r = loot.sellPanel(pId) || {}; total = r.total || 0; byCat = r.byCat || new Map(); } catch(e) {}
  const rar = config.RARITY || {};
  const lines = [];
  byCat.forEach((arr, cat) => {
    const parts = arr.map(x => {
      const r = rar[x.tier] || {};
      return `【${r.name || ''}】${x.display}×${x.amount}(${x.value * x.amount})`;
    });
    lines.push(`${cat}: ${parts.join('、')}`);
  });
  const body = lines.length ? lines.join('\n') : '(背包中没有可变卖的物品)';
  return `当前可变卖总额: ${total} 金币\n\n${body}\n\n(未在变卖目录中的物品无法出售)`;
};

const openSellShopMenu = (pId) => {
  if (blockIfRaiding(pId)) return;
  upsertShopItemForPlayer(pId, CAT.SELL, 'value', {
    image: 'Gold Coin', customTitle: '背包估值',
    description: sellValueDesc(pId),
    buyButtonText: '-', canBuy: false,
  });
  switchToPage(pId, CAT.SELL);
};

/* ===== 购买分发 ===== */
/* 页面状态校验 + 防双击:
 * - 点击来自已销毁的旧页面(category 与当前页不符) → 直接丢弃并恢复当前页
 * - 同一按钮 350ms 内重复点击 → 丢弃 */
const onBoughtShopItem = (pId, categoryKey, itemKey, item, userInput) => {
  const curPage = getPlayerPage(pId);
  if (curPage && categoryKey !== curPage) {
    try { api.openShop(pId, true, curPage, false); } catch(e) {}
    return;
  }
  if (!curPage) setPlayerPage(pId, categoryKey);   // 兼容命令直接打开的情况
  const now = Date.now();
  const clickKey = categoryKey + ':' + itemKey;
  const last = lastMenuClick.get(pId);
  if (last && last.key === clickKey && now - last.at < 350) return;
  lastMenuClick.set(pId, { key: clickKey, at: now });

  if (itemKey === 'back') {
    const target = BACK_TARGET[categoryKey];
    if (target) openMenuByKey(pId, target);
    else closeShop(pId);   // 根页面(选图): 关闭菜单
    return;
  }
  switch (categoryKey) {
    case CAT.MAP:      handleMapSelect(pId, itemKey); break;
    case CAT.OPERATOR: handleOperatorSelect(pId, itemKey); break;
    case CAT.LOADOUT:  handleLoadoutMenu(pId, itemKey); break;
    case CAT.TEAM:     handleTeamMenu(pId, itemKey, userInput); break;
    case CAT.INSURE:   handleInsureShop(pId, itemKey); break;
    case CAT.KNIFE:    handleKnifeShop(pId, itemKey); break;
    case CAT.SELL:     handleSellShop(pId, itemKey); break;
    case CAT.ADMIN:    handleAdminMenu(pId, itemKey, userInput); break;
  }
};

/* 选图页按钮分发: 地图选择 → 干员页; 购买类 → 对应服务页; 签到 → 直接执行 */
const handleMapSelect = (pId, itemKey) => {
  /* 购买类 / 服务类按钮 —— 从选图页直接跳对应服务页, 不要求先选图 */
  switch (itemKey) {
    case 'sell':   openSellShopMenu(pId);   return;
    case 'insure': openInsureShopMenu(pId); return;
    case 'knife':  openKnifeShopMenu(pId);  return;
    case 'checkin': handleCheckin(pId);     return;
    case 'team':   openTeamMenu(pId);       return;
  }
  /* 地图选择: 必须先 blockIfRaiding */
  if (blockIfRaiding(pId)) return;
  if (!MAPS[itemKey] || MAPS[itemKey].disabled) return;
  if (typeof globalThis.onMapSelectRequest === 'function') globalThis.onMapSelectRequest(pId, itemKey);
  flowHint(pId, `✅ 地图已记录: ${MAPS[itemKey].name} → 请选择干员`);
  openOperatorMenu(pId);   // 选完图自动跳干员页(干员页门禁: 没选图会被踢回)
};

/* 选干员 → 销毁干员页,自动跳玩家状态页 */
const handleOperatorSelect = (pId, opKey) => {
  if (!OPERATORS[opKey]) return;
  setPlayerOperator(pId, opKey);
  flowHint(pId, `✅ 干员已记录: ${OPERATORS[opKey].name} → 验证玩家状态`);
  openLoadoutMenu(pId);
};

/* 玩家状态页按钮 */
const handleLoadoutMenu = (pId, itemKey) => {
  switch (itemKey) {
    case 'enter': {
      const started = typeof globalThis.onDeployRequest === 'function' ? globalThis.onDeployRequest(pId) : false;
      if (started) closeShop(pId);       // 进图成功: 销毁战备确认页
      else refreshPlayerInfo(pId, CAT.LOADOUT);   // 进图失败: 刷新战备值显示
      return;
    }
    default: return;   // 战备信息展示项点击无动作
  }
};

/* 保险商人购买 */
const handleInsureShop = (pId, itemKey) => {
  const pkg = INSURANCE.packages[itemKey];
  if (!pkg) return;
  if (isRaiding(pId)) { flowHint(pId, '行动中无法购买保险!'); return; }
  if (!db.canAfford(pId, pkg.cost)) {
    try { api.sendMessage(pId, [{str:`💰 金币不足! 需要 ${pkg.cost}`, style:{color:'#FF5555',fontWeight:'bold'}}]); } catch(e) {}
    return;
  }
  db.subMoney(pId, pkg.cost);
  db.setInsuredPackage(pId, { item: itemKey, slots: pkg.slots, name: pkg.name });
  try { api.sendMessage(pId, [{str:`✅ 已购买 ${pkg.name} (固定${pkg.slots}格)`, style:{color:'#FFD700',fontWeight:'bold'}}]); } catch(e) {}
  flowHint(pId, `保险格已固定为背包弹药槽后${pkg.slots}格,不可移动`);
};

/* 刀皮购买 */
const handleKnifeShop = (pId, skinKey) => {
  const skin = STATUS.knifeSkins.find(s => s.key === skinKey);
  if (!skin) return;
  if (db.getKnifeSkin(pId) === skinKey) { flowHint(pId, '已装备该刀皮'); return; }
  if (isRaiding(pId)) { flowHint(pId, '行动中无法更换刀皮!'); return; }
  if (!db.canAfford(pId, skin.cost)) {
    try { api.sendMessage(pId, [{str:`💰 金币不足! 需要 ${skin.cost}`, style:{color:'#FF5555',fontWeight:'bold'}}]); } catch(e) {}
    return;
  }
  db.subMoney(pId, skin.cost);
  db.setKnifeSkin(pId, skinKey);
  /* 选落点: 武器格空则装备到武器格; 否则发到背包第一空格, 不吞掉玩家原有武器 */
  let target = GEAR.weaponSlot;
  const curWeapon = api.getItemSlot(pId, GEAR.weaponSlot);
  if (curWeapon && curWeapon.name) {
    target = -1;
    for (let i = 11; i <= 45; i++) { const it = api.getItemSlot(pId, i); if (!it || !it.name) { target = i; break; } }
    if (target < 0) { flowHint(pId, '背包已满,无法发放刀皮'); return; }
  }
  giveMarkedItem(pId, target, skin.item, 1, GEAR.tierScores[skin.item] || 1);
  try { api.sendMessage(pId, [{str:`✅ 已装备刀皮: ${skin.name}`, style:{color:'#FFD700',fontWeight:'bold'}}]); } catch(e) {}
};

/* 变卖商人: 一键变卖 */
const handleSellShop = (pId, itemKey) => {
  if (itemKey !== 'sellall') return;
  if (isRaiding(pId)) { flowHint(pId, '对局中无法变卖!先撤离或 /jt 退出'); return; }
  const earned = sellAllLoot(pId);
  if (earned > 0) { try { if (typeof globalThis.onLootSold === 'function') globalThis.onLootSold(pId, earned); } catch(e) {} }
  if (earned <= 0) {
    try { api.sendMessage(pId, [{str:'背包里没有可变卖的战利品', style:{color:'#FF8800',fontWeight:'bold'}}]); } catch(e) {}
  } else {
    try {
      api.sendMessage(pId, [
        {str:`💰 变卖成功 +${earned} 金币`, style:{color:'#FFD700',fontWeight:'bold'}},
        {str:` 余额: ${db.getMoney(pId)}`, style:{color:'#4DA6FF'}},
      ]);
    } catch(e) {}
  }
  /* 刷新估值显示(变卖后应为0) */
  upsertShopItemForPlayer(pId, CAT.SELL, 'value', {
    image: 'Gold Coin', customTitle: '背包估值',
    description: sellValueDesc(pId),
    buyButtonText: '-', canBuy: false,
  });
};

const handleTeamMenu = (pId, itemKey, userInput) => {
  switch (itemKey) {
    case 'create': createTeam(pId); break;
    case 'leave': safeLeaveTeam(pId); break;
    case 'view': {
      const info = getTeamInfo(pId);
      if (!info) { try { api.sendMessage(pId, [{str:'你不在任何队伍中', style:{color:'#FF8800',fontWeight:'bold'}}]); } catch(e) {} break; }
      const msg = [{str:`\n===== 小队 (${info.size}/3) =====\n`, style:{color:'#FFD700',fontWeight:'bold'}}];
      for (const m of info.members) {
        const isLead = m.id === info.leader;
        msg.push({str:`${isLead ? '👑' : '  '} ${m.name}${isLead ? '(队长)' : ''}\n`, style:{color: isLead ? '#FFD700' : '#FFFFFF'}});
      }
      try { api.sendMessage(pId, msg); } catch(e) {}
      break;
    }
    case 'invite': {
      if (!userInput) { try { api.sendMessage(pId, [{str:'⚠ 请输入要邀请的玩家名', style:{color:'#FF8800',fontWeight:'bold'}}]); } catch(e) {} break; }
      const targetId = findPlayerByName(String(userInput));
      if (!targetId) {
        try { api.sendMessage(pId, [{str:'⚠ 找不到该玩家', style:{color:'#FF8800',fontWeight:'bold'}}]); } catch(e) {}
        break;
      }
      invitePlayer(pId, targetId);
      break;
    }
  }
};

/* 邀请列表点击处理(已删除 CAT.INVITE 页面, 仅 handleInviteCommand 通过指令调用) */
const handleInviteMenu = (pId, itemKey) => {
  if (itemKey.startsWith('p_')) {
    const targetId = Number(itemKey.slice(2));
    if (!Number.isInteger(targetId)) return;
    invitePlayer(pId, targetId);
    try { api.openShop(pId, false, null, false); } catch(e) {}
  }
};

const handleInviteCommand = (pId, targetName) => {
  const targetId = findPlayerByName(targetName);
  if (!targetId) { try { api.sendMessage(pId, [{str:`⚠ 找不到玩家 "${targetName}"`, style:{color:'#FF8800',fontWeight:'bold'}}]); } catch(e) {} return; }
  invitePlayer(pId, targetId);
};

const findPlayerByName = (name) => {
  if (!name) return null;
  /* 兼容引擎把 player 类型 userInput 回传成"玩家ID"的情况 */
  const raw = String(name).trim();
  try {
    for (const pId of api.getPlayerIds()) {
      if (String(pId) === raw) return pId;
    }
  } catch(e) {}
  try { const id = api.getPlayerId(raw); if (id != null) return id; } catch(e) {}
  const lower = raw.toLowerCase();
  for (const pId of api.getPlayerIds()) {
    try {
      const n = String(api.getEntityName(pId));
      if (n === raw || n.toLowerCase() === lower) return pId;   // 大小写不敏感兜底
    } catch(e) {}
  }
  return null;
};

const handleAcceptCommand = (pId) => {
  const ok = acceptInvite(pId);
  try {
    if (ok) api.sendMessage(pId, [{str:'✅ 已加入队伍', style:{color:'#00FF00',fontWeight:'bold'}}]);
    else api.sendMessage(pId, [{str:'⚠ 没有可接受的邀请', style:{color:'#FF8800',fontWeight:'bold'}}]);
  } catch(e) {}
};

/* /jj 命令:拒绝邀请 / 退出队伍(二合一) */
const handleLeaveCommand = (pId) => {
  if (declineInvite(pId)) return;
  const t = db.getTeam(pId);
  if (!t || t === '') {
    try { api.sendMessage(pId, [{str:'⚠ 你不在任何队伍中', style:{color:'#FF8800',fontWeight:'bold'}}]); } catch(e) {}
    return;
  }
  safeLeaveTeam(pId);
};

const updateTeamMenuForPlayer = (pId) => {
  const info = getTeamInfo(pId);
  try {
    if (info) {
      const memberList = info.members.map(m => `${m.name}${m.id === info.leader ? '(队长)' : ''}`).join(', ');
      api.updateShopItemForPlayer(pId, CAT.TEAM, 'create', { hidden: true });
      api.updateShopItemForPlayer(pId, CAT.TEAM, 'leave', { customTitle: `离开队伍 (${info.size}/3)`, description: `队员: ${memberList}`, canBuy: true, hidden: false });
      const isLeader = info.leader === pId;
      const notFull = info.size < CONST.teamSize;
      api.updateShopItemForPlayer(pId, CAT.TEAM, 'invite', {
        hidden: !(isLeader && notFull),
        canBuy: isLeader && notFull,
        customTitle: notFull ? `邀请队员 (${info.size}/3)` : '队伍已满',
        description: notFull ? '下拉选择玩家后点击邀请' : '队伍已满3人',
      });
    } else {
      api.updateShopItemForPlayer(pId, CAT.TEAM, 'create', { hidden: false, canBuy: true });
      api.updateShopItemForPlayer(pId, CAT.TEAM, 'leave', { hidden: true });
      api.updateShopItemForPlayer(pId, CAT.TEAM, 'invite', { hidden: true, canBuy: false });
    }
  } catch(e) {}
};

/* 玩家手动打开商店/关闭时: 清掉页面状态与点击锁
 * 手动打开时引擎会回到上次所在分类(选图已设 autoSelectCategory),清空后首次点击重新绑定页面;
 * 服务器主动切页后的 200ms 内不清理,避免 switchToPage 刚设置的页面被回调清掉 */
const onShopOpened = (pId) => {
  const until = internalOpenUntil.get(pId) || 0;
  if (Date.now() < until) return;
  setPlayerPage(pId, null);
  lastMenuClick.delete(pId);
};

/* 玩家离线/重进时清理本玩家的全部菜单临时状态,避免半截流程残留 */
const forgetPlayer = (pId) => {
  playerPage.delete(pId);
  lastMenuClick.delete(pId);
  internalOpenUntil.delete(pId);
  adminEntryState.delete(pId);
  adminMuteBtns.delete(pId);
  adminTargets.delete(pId);
};

/* 完整状态页已删,此函数是 game.js 旧调用的兼容桩: 刷新 LOADOUT 的战备信息 */
const updateStatusMenuForPlayer = (pId) => refreshPlayerInfo(pId, CAT.LOADOUT);

/* ===== 指令块可直接调用的接口 ===== */
/* 按玩家ID签到: 返回 {success, streak, reward, reason}
 * 传入 pId (数字或字符串), 内部会自动走 game.js 全局 Checkin (带全服播报)
 * 或回退 db.doCheckin (仅给本人发消息) */
const checkin = (pId) => handleCheckin(pId);

/* 按玩家名签到: 指令块传 "玩家名" 即可, 内部自动 findPlayerByName 解析
 * 返回 null = 找不到玩家; 否则返回 {success, streak, reward, reason} */
const checkinByName = (playerName) => {
  const pid = findPlayerByName(String(playerName));
  if (pid == null) return null;
  return handleCheckin(pid);
};

module.exports = {
  initMenus,
  openMapMenu, openOperatorMenu, openLoadoutMenu, openTeamMenu,
  openInsureShopMenu, openKnifeShopMenu, openSellShopMenu, openAdminMenu,
  onBoughtShopItem, handleInviteCommand, handleAcceptCommand, handleLeaveCommand,
  updateTeamMenuForPlayer, updateStatusMenuForPlayer,
  refreshAdminEntry, onShopOpened, forgetPlayer, getPlayerPage,
  /* 指令块可直接调用 */
  handleCheckin, checkin, checkinByName, findPlayerByName,
  CAT,
};
