// ============================================
// customweapons.js - 自定义武器系统 (CommonJS)
// ============================================
// 用途: 玩家(副服主)在指令方块(Code Block)里注册自己的自定义武器,
//       引擎把五个官方战斗/点击接口的输入规范化后喂给武器处理器。
//
// 【五个规范化输入通道】(每个事件统一输入格式)
//   事件               官方回调                      a       b            c      d
//   玩家伤害玩家       onPlayerDamagingOtherPlayer   攻击者   被伤害玩家    伤害值  伤害物品
//   玩家伤害怪物       onPlayerDamagingMob           攻击者   怪物id        伤害值  伤害物品
//   玩家被玩家伤害     onPlayerDamagingOtherPlayer   攻击者   受害者        伤害值  伤害物品
//   怪物伤害玩家       onMobDamagingPlayer           怪物id   被伤害玩家    伤害值  怪物所用物品
//   玩家单击           onPlayerClick                 点击者   目标实体id可空 0       手持物品
//   每个处理器收到的 ctx = { event, a, hasSecond, b, c, d, isSelf, damage, cancel }
//     a         攻击者(或点击者)的实体id
//     hasSecond 是否有第二个人物/怪物id输入 (t/f)
//     b         第二个id(受害者/怪物/点击目标)
//     c         伤害值(单击时为0)
//     d         伤害或手持物品名
//     isSelf    是否自己攻击自己 (t/f)
//     damage    当前伤害值(可改: ctx.damage = 999,基于c加减也行)
//     cancel    设为true取消整次伤害
//
// 【注册方式】(指令方块里调用,绑定在index.js主世界代码的 CustomWeapon 全局对象)
//   CustomWeapon.add('Knight Sword', (ctx) => { ... })            // 万能处理器: 五个事件都收
//   CustomWeapon.add('Knight Sword', {                            // 或按事件分别注册
//     hitPlayer:        (ctx) => { ctx.damage = 999; },   // 改伤害为999
//     hitMob:           (ctx) => { ctx.cancel = true; },  // 取消这次伤害
//     damagedByPlayer:  (ctx) => {},             // 受害者手持该物品被玩家打时触发
//     mobHitYou:        (ctx) => {},             // 手持该物品被怪物打时触发
//     click:            (ctx) => {},             // 手持该物品单击时触发
//   });
//   CustomWeapon.remove('Knight Sword')      // 移除整把武器
//   CustomWeapon.list()                      // 查看已注册武器
//   CustomWeapon.has('Knight Sword')         // 是否已注册
//   CustomWeapon.add('*', (ctx) => {...})    // '*'通配符: 任何物品的该事件都触发
//
// ⚠ 改伤害/取消的唯一方式: ctx.damage = 数字 / ctx.cancel = true
//   处理器的 return 值会被完全忽略(直接 return 999 没有任何效果!)
//
// ⚠ 注册表存在内存里,关服/重启后会清空!
//   想要永久生效: 把注册代码写进本文件底部的【玩家武器注册区】,
//   世界代码每次加载(开服/重贴)都会自动重新注册。
//
// 【buff二维列表】(def.buffs,每行 [对象, 效果名, 时长ms, 强度可省])
//   CustomWeapon.add('Knight Sword', {
//     buffs: [
//       ['attacker', 'Speed', 5000, 2],      // 攻击者: 加速5秒 强度2
//       ['victim', 'Slowness', 3000, 1],     // 被打的另一方: 减速3秒
//       ['clicker', 'Night Vision', 10000],  // 手持单击的人: 夜视10秒
//     ],
//   });
//   触发: 打人/打怪/被打 → attacker+victim行; 手持单击 → clicker行
//   效果名用官方效果(Poison/Wither/Weakness/Speed/Slowness/Regeneration/Night Vision等)
//
// 【处理器如何改伤害/取消】(返回值完全忽略,防止顺手return数字被误判)
//   ctx.damage = 999          // 把这次伤害改成999(也可以基于ctx.damage加减)
//   ctx.cancel = true         // 取消整次伤害
//   处理器不写这两个字段 = 不干预,伤害原样
// 【处理器查找规则】
//   hitPlayer/hitMob/click  → 按 d(伤害/手持物品) 匹配
//   damagedByPlayer/mobHitYou → 按 受害者(b) 的手持物品 匹配(挨打时你手里的武器起反应)
// 【聚合】任一处理器设 ctx.cancel=true → 整次伤害取消('preventDamage');否则最终ctx.damage生效
//
// 本模块不直接注册官方回调,由 index.js/game.js 转发调用。
// ============================================

const config = require("./config.js");
const CONST = config.CONST;

/* 注册表: 物品名(小写) -> { 事件名: [处理器] } */
const EVENTS = ['hitPlayer', 'hitMob', 'damagedByPlayer', 'mobHitYou', 'click'];
const registry = new Map();
/* buff注册表: 物品名(小写) -> 二维列表 [[谁, 效果名, 时长ms, 强度], ...] */
const buffRegistry = new Map();

const blankDef = () => ({ hitPlayer: [], hitMob: [], damagedByPlayer: [], mobHitYou: [], click: [] });

const normalizeItem = (itemName) => String(itemName || '').trim();

/* 处理器入表;def=函数→万能处理器(五个事件都收),def=对象→按事件分别注册
 * def.buffs = 二维列表,每行 [对象, 效果名, 时长ms, 强度(可省,默认1)]:
 *   对象: 'attacker'(攻击者) | 'victim'(被攻击的另一方) | 'clicker'(点击者)
 *   事件映射: hitPlayer/hitMob/damagedByPlayer/mobHitYou → attacker+victim 行
 *             click → clicker 行 */
const add = (itemName, def) => {
  const item = normalizeItem(itemName);
  if (!item) return { success: false, reason: '物品名不能为空' };
  if (typeof def !== 'function' && (typeof def !== 'object' || def === null)) {
    return { success: false, reason: '处理器必须是函数或{事件名:函数}对象' };
  }
  let entry = registry.get(item.toLowerCase());
  if (!entry) { entry = blankDef(); registry.set(item.toLowerCase(), { display: item, def: entry }); }
  const stored = registry.get(item.toLowerCase()).def;
  if (typeof def === 'function') {
    for (const ev of EVENTS) stored[ev].push(def);
  } else {
    for (const ev of EVENTS) {
      if (typeof def[ev] === 'function') stored[ev].push(def[ev]);
    }
    if (Array.isArray(def.buffs)) buffRegistry.set(item.toLowerCase(), def.buffs);
  }
  return { success: true, item, events: EVENTS.filter(ev => stored[ev].length > 0), buffs: Array.isArray(def.buffs) ? def.buffs.length : 0 };
};

const remove = (itemName) => {
  const item = normalizeItem(itemName);
  const existed = registry.delete(item.toLowerCase());
  buffRegistry.delete(item.toLowerCase());
  return { success: existed, reason: existed ? undefined : '未注册的武器' };
};

const has = (itemName) => registry.has(normalizeItem(itemName).toLowerCase());

const list = () => {
  const out = [];
  registry.forEach((val, key) => {
    const buffs = buffRegistry.get(key);
    out.push({
      item: val.display,
      events: EVENTS.filter(ev => val.def[ev].length > 0),
      handlers: EVENTS.reduce((n, ev) => n + val.def[ev].length, 0),
      buffs: buffs ? buffs.length : 0,
    });
  });
  return out;
};

/* 按物品名取某事件的处理器列表(精确匹配 + '*'通配符;无则空数组) */
const handlersFor = (itemName, event) => {
  const out = [];
  const exact = registry.get(normalizeItem(itemName).toLowerCase());
  if (exact) out.push(...exact.def[event]);
  const wild = registry.get('*');
  if (wild) out.push(...wild.def[event]);
  return out;
};

/* 受害者/玩家当前手持物品名(用于挨打类通道的武器匹配) */
const heldNameOf = (pId) => {
  try {
    const held = api.getHeldItem(pId);
    return (held && held.name) ? held.name : '';
  } catch(e) { return ''; }
};

/* ===== buff二维列表应用 =====
 * buffRegistry: 物品名(小写) -> [[对象, 效果名, 时长ms, 强度(可省)], ...]
 * 对象行: 'attacker'=攻击者/点击者(a)  'victim'=被攻击的另一方(b)
 * 每行独立try/catch,目标为null(如打怪时没有victim玩家)自动跳过 */
const applyBuffRows = (itemName, who, aId, bId) => {
  const rows = [];
  const exact = buffRegistry.get(normalizeItem(itemName).toLowerCase());
  if (exact) rows.push(...exact);
  const wild = buffRegistry.get('*');
  if (wild) rows.push(...wild);
  for (const row of rows) {
    try {
      if (!Array.isArray(row) || row.length < 2) continue;
      const [rowWho, effect, duration, amplifier] = row;
      if (rowWho !== who) continue;
      const target = (who === 'victim') ? bId : aId;
      if (target === null || target === undefined) continue;
      if (amplifier !== undefined) {
        try { api.applyEffect(target, effect, duration || 1000, { amplifier }); }
        catch(e1) { try { api.applyEffect(target, effect, duration || 1000); } catch(e2) {} }
      } else {
        api.applyEffect(target, effect, duration || 1000);
      }
    } catch(e) {}
  }
};

/* 聚合执行: 依序喂处理器(返回值忽略),处理器通过 ctx.damage / ctx.cancel 生效。
 * 返回最终伤害number 或 'preventDamage' */
const runHandlers = (handlers, ctx) => {
  for (const fn of handlers) {
    try { fn(ctx); } catch(e) {
      try { console.log(`[自定义武器] ${ctx.event} 处理器异常(${ctx.d || ctx.a}): ` + (e && e.message)); } catch(e2) {}
    }
    if (ctx.cancel === true) return 'preventDamage';
  }
  return typeof ctx.damage === 'number' ? ctx.damage : undefined;
};

/* ===== 五个规范化转发(由game.js官方回调调用) ===== */

/* 玩家伤害玩家: a=攻击者 b=受害者 c=伤害 d=伤害物品
 * 同时喂两个通道: 攻击者武器的 hitPlayer + 受害者武器的 damagedByPlayer
 * buff: 攻击者行→a, victim行→b (每个事件只应用一次) */
const onPlayerDamagePlayer = (a, b, c, d) => {
  const hasSecond = b !== null && b !== undefined;
  const isSelf = hasSecond && a === b;
  const ctx = { event: 'hitPlayer', a, hasSecond, b, c, d, isSelf, damage: c, cancel: false };
  let result = runHandlers(handlersFor(d, 'hitPlayer'), ctx);
  if (result === 'preventDamage') return 'preventDamage';
  /* buff: 双方各吃各的 */
  try { applyBuffRows(d, 'attacker', a, b); } catch(e) {}
  try { applyBuffRows(d, 'victim', a, b); } catch(e) {}
  /* 玩家被玩家伤害通道(受害者视角,按受害者手持物品匹配;继承第一通道的damage,可继续加工) */
  const victimHeld = hasSecond ? heldNameOf(b) : '';
  if (victimHeld) {
    const ctx2 = Object.assign({}, ctx, { event: 'damagedByPlayer', cancel: false });
    const r2 = runHandlers(handlersFor(victimHeld, 'damagedByPlayer'), ctx2);
    if (r2 === 'preventDamage') return 'preventDamage';
    if (typeof r2 === 'number') result = r2;
  }
  return result;
};

/* 玩家伤害怪物: a=攻击者 b=怪物id c=伤害 d=伤害物品
 * buff: attacker行→玩家, victim行→怪物(部分效果对怪可能无效,静默跳过) */
const onPlayerDamageMob = (a, b, c, d) => {
  const ctx = { event: 'hitMob', a, hasSecond: b !== null && b !== undefined, b, c, d, isSelf: false, damage: c, cancel: false };
  try { applyBuffRows(d, 'attacker', a, b); } catch(e) {}
  try { applyBuffRows(d, 'victim', a, b); } catch(e) {}
  return runHandlers(handlersFor(d, 'hitMob'), ctx);
};

/* 怪物伤害玩家: a=怪物id b=被伤害玩家 c=伤害 d=怪物所用物品
 * 通道按 被伤害玩家的手持物品 匹配; buff: attacker行→怪物, victim行→玩家 */
const onMobDamagePlayer = (a, b, c, d) => {
  const victimHeld = heldNameOf(b);
  const ctx = { event: 'mobHitYou', a, hasSecond: b !== null && b !== undefined, b, c, d, isSelf: false, damage: c, cancel: false };
  try { applyBuffRows(d, 'attacker', a, b); } catch(e) {}
  try { applyBuffRows(d, 'victim', a, b); } catch(e) {}
  return runHandlers(handlersFor(victimHeld, 'mobHitYou'), ctx);
};

/* 玩家单击: a=点击者 b=目标实体id(可空→hasSecond=false) c=0 d=手持物品
 * buff: clicker行→点击者 */
const onPlayerClick = (a, b, c, d) => {
  const hasSecond = b !== null && b !== undefined;
  const ctx = { event: 'click', a, hasSecond, b: hasSecond ? b : null, c: c || 0, d, isSelf: hasSecond && a === b, damage: 0, cancel: false };
  try { applyBuffRows(d, 'clicker', a, b); } catch(e) {}
  runHandlers(handlersFor(d, 'click'), ctx);   // 单击不涉及伤害,ctx仅作信息
  return undefined;
};

/* ===== 玩家武器注册区(写在下面的代码每次开服/重贴世界代码时自动重新注册) =====
 * 在这里写你的武器,例如:
 * add('GPMG', { hitMob: (ctx) => { ctx.damage = ctx.damage * 2; } });   // GPMG打怪双倍伤害
 * add('*', { hitPlayer: (ctx) => { ctx.damage = ctx.damage + 5; } });   // 任何物品打玩家+5
 * 调试: add('Knight Sword', (ctx) => { api.sendMessage(ctx.a, JSON.stringify(ctx)); });  // 看ctx长啥样
 */

/* ==================== 玩家武器注册区(上方示例,下方写真代码) ==================== */


/* ==================== 玩家武器注册区结束 ==================== */

module.exports = {
  add, remove, has, list,
  onPlayerDamagePlayer, onPlayerDamageMob, onMobDamagePlayer, onPlayerClick,
};
