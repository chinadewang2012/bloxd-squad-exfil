// ============================================
// guns.js - 枪械参数系统 (CommonJS)
// ============================================
// 用途: 集中管理自定义枪械的 gunStats 参数(共11把)。
// game.js 在 onPlayerJoin 时对每个进服玩家调用 applyAll(pId),
// 把表里所有枪械的参数用 api.setItemStat 应用到该玩家身上 ——
// 任何玩家手里拿到表中的枪,都自动带这些参数。
//
// 【怎么加新枪/改参数】直接编辑 GUNS 表,改完重贴本文件,下次玩家进服自动生效。
// 【gunStats 常用字段速查】
//   fireRate 射速(ms) / damage 单发伤害 / reloadTime 换弹ms / clipSize 弹匣
//   shotPelletCount 每发弹丸数(1=普通,10+=散弹) / burstCount 连发数 / burstDelay 爆发延迟
//   autoFireWithMouse 按住左键全自动 / fireRateWithHeldTouch 触屏射速
//   gunType: "submachine"|"assault"|"sniper"|"shotgun"|"pistol"|"rifle"|"semi_automatic"
//   scopeType: "sniper" 启用狙 / aimZoomFactor 开镜倍率
//   inaccuracy*(腰射) / altInaccuracy*(开镜) 0=绝对精准
//   minKickback/maxKickback 后座 / kickbackRate/kickbackDecreaseRate 后座恢复
//   muzzleFlashScale 枪口火光大小 / muzzleFlashOffsetFromGun 火光偏移
// ============================================

const GUNS = {
  GPMG: {
    shotPelletCount: 4,
    fireRate: 900,
    damage: 10,
    reloadTime: 20000,
    clipSize: 100,
    minKickback: 0.015 * 2,
    maxKickback: 0.099 * 2,
    kickbackRate: 0,
    fireRateWithHeldTouch: 9000,
    gunType: 'submachine',
    autoFireWithMouse: true,          // 按住鼠标左键全自动扫射
    keepScopeOnShot: true,
    altInaccuracyStanding: 0,
    altInaccuracyFromShot: 0,
    altInaccuracyMovement: 0,
    altYVelocityInaccuracy: 0,
    altInaccuracyFromJump: 0,
    inaccuracyStanding: 0,
    inaccuracyFromShot: 0,
    inaccuracyMovement: 0,
    yVelocityInaccuracy: 0,
    inaccuracyFromJump: 0,
    muzzleFlashScale: 1,
    muzzleFlashOffsetFromGun: [0, 0.8, 0],
    burstCount: 1,
  },

  DMR: {
    gunType: 'rifle',
    scopeType: 'sniper',              // 启用狙击镜
    aimZoomFactor: 13,                // 13倍开镜放大
    burstCount: 1,                    // 点一下只开一枪
    burstDelay: 4000,
    fireRate: 400000,                 // 每开完一枪必须手动等拉栓
    damage: 30,
    clipSize: 12,
    reloadTime: 8000,
    autoFireWithMouse: false,         // 半自动,必须一枪一枪手动点击
    fireRateWithHeldTouch: 4000,
    keepScopeOnShot: true,            // 开枪后保持狙击镜视野
    altInaccuracyStanding: 0,         // 开镜绝对精准
    altInaccuracyFromShot: 0,
    altInaccuracyMovement: 0,
    altYVelocityInaccuracy: 0,
    altInaccuracyFromJump: 0,
    inaccuracyStanding: 250,          // 腰射很散,逼玩家开镜
    inaccuracyFromShot: 105,
    inaccuracyMovement: 450,
    yVelocityInaccuracy: 150,
    inaccuracyFromJump: 60,
    minKickback: 0.07,
    maxKickback: 0.09,
    kickbackRate: 0.08,
    kickbackDecreaseRate: 0.0001,
    muzzleFlashScale: 1.5,
    muzzleFlashOffsetFromGun: [0, 0.8, 0],
  },

  MP40: {
    shotPelletCount: 4,
    fireRate: 500,
    damage: 15,
    reloadTime: 3000,
    clipSize: 30,
    minKickback: 0.05,
    maxKickback: 0.09,
    kickbackRate: 0,
    fireRateWithHeldTouch: 9000,
    gunType: 'submachine',
    autoFireWithMouse: true,
    keepScopeOnShot: true,
    altInaccuracyStanding: 0,
    altInaccuracyFromShot: 0,
    altInaccuracyMovement: 0,
    altYVelocityInaccuracy: 0,
    altInaccuracyFromJump: 0,
    inaccuracyStanding: 0,
    inaccuracyFromShot: 0,
    inaccuracyMovement: 0,
    yVelocityInaccuracy: 0,
    inaccuracyFromJump: 0,
    muzzleFlashScale: 1,
    muzzleFlashOffsetFromGun: [0, 0.8, 0],
    burstCount: 1,
  },

  'AK-47': {
    shotPelletCount: 4,
    fireRate: 600,
    damage: 70,
    reloadTime: 7000,
    clipSize: 20,
    minKickback: 0,
    maxKickback: 0.15,
    kickbackRate: 0,
    fireRateWithHeldTouch: 1000,
    gunType: 'semi_automatic',
    autoFireWithMouse: true,
    keepScopeOnShot: true,
    altInaccuracyStanding: 0,
    altInaccuracyFromShot: 0,
    altInaccuracyMovement: 0,
    altYVelocityInaccuracy: 0,
    altInaccuracyFromJump: 0,
    inaccuracyStanding: 0,
    inaccuracyFromShot: 0,
    inaccuracyMovement: 0,
    yVelocityInaccuracy: 0,
    inaccuracyFromJump: 0,
    muzzleFlashScale: 1,
    muzzleFlashOffsetFromGun: [0, 0.8, 0],
    burstCount: 1,
  },

  'Mini Izu': {
    shotPelletCount: 4,
    fireRate: 1000,
    damage: 3,
    reloadTime: 10000,
    clipSize: 70,
    minKickback: 0,
    maxKickback: 0.030,
    kickbackRate: 0,
    fireRateWithHeldTouch: 9000,
    gunType: 'submachine',
    autoFireWithMouse: true,
    keepScopeOnShot: true,
    altInaccuracyStanding: 0,
    altInaccuracyFromShot: 0,
    altInaccuracyMovement: 0,
    altYVelocityInaccuracy: 0,
    altInaccuracyFromJump: 0,
    inaccuracyStanding: 0,
    inaccuracyFromShot: 0,
    inaccuracyMovement: 0,
    yVelocityInaccuracy: 0,
    inaccuracyFromJump: 0,
    muzzleFlashScale: 1,
    muzzleFlashOffsetFromGun: [0, 0.8, 0],
    burstCount: 1,
  },

  'Double Barrel': {
    gunType: 'shotgun',
    burstDelay: 0,
    fireRate: 2000,                   // 打完一枪要等拉栓
    damage: 6,                        // 10弹丸合计高伤
    shotPelletCount: 10,              // 散弹
    clipSize: 5,
    reloadTime: 4000,
    autoFireWithMouse: true,
    fireRateWithHeldTouch: 40,
    keepScopeOnShot: false,
    altInaccuracyStanding: 50,
    altInaccuracyFromShot: 20 * 2,
    altInaccuracyMovement: 30,
    altYVelocityInaccuracy: 25 * 2,
    altInaccuracyFromJump: 20 * 2,
    inaccuracyStanding: 50,
    inaccuracyFromShot: 20 * 2,
    inaccuracyMovement: 45 * 2,
    yVelocityInaccuracy: 25 * 2,
    inaccuracyFromJump: 60 * 2,
    minKickback: 0.15,
    maxKickback: 0.98,                // 霰弹枪强后坐(连发上限)
    kickbackRate: 0.08,
    kickbackDecreaseRate: 0.1,
    muzzleFlashScale: 0.5,
    muzzleFlashOffsetFromGun: [0, 0.8, 0],
  },

  'Block-19': {
    shotPelletCount: 4,
    fireRate: 100,
    damage: 20,
    reloadTime: 4000,
    clipSize: 25,
    minKickback: 0,
    maxKickback: 0.05,
    kickbackRate: 0,
    fireRateWithHeldTouch: 500,
    gunType: 'pistol',
    autoFireWithMouse: true,
    keepScopeOnShot: true,
    altInaccuracyStanding: 0,
    altInaccuracyFromShot: 0,
    altInaccuracyMovement: 0,
    altYVelocityInaccuracy: 0,
    altInaccuracyFromJump: 0,
    inaccuracyStanding: 0,
    inaccuracyFromShot: 0,
    inaccuracyMovement: 0,
    yVelocityInaccuracy: 0,
    inaccuracyFromJump: 0,
    muzzleFlashScale: 1,
    muzzleFlashOffsetFromGun: [0, 0.8, 0],
    burstCount: 1,
  },

  M16: {
    shotPelletCount: 4,
    fireRate: 600,
    damage: 35,
    reloadTime: 7000,
    clipSize: 40,
    minKickback: 0,
    maxKickback: 0.29,
    kickbackRate: 0,
    fireRateWithHeldTouch: 1000,
    gunType: 'semi_automatic',
    autoFireWithMouse: true,
    keepScopeOnShot: true,
    altInaccuracyStanding: 0,
    altInaccuracyFromShot: 0,
    altInaccuracyMovement: 0,
    altYVelocityInaccuracy: 0,
    altInaccuracyFromJump: 0,
    inaccuracyStanding: 0,
    inaccuracyFromShot: 0,
    inaccuracyMovement: 0,
    yVelocityInaccuracy: 0,
    inaccuracyFromJump: 0,
    muzzleFlashScale: 1,
    muzzleFlashOffsetFromGun: [0, 0.8, 0],
    burstCount: 1,
  },

  Deagle: {
    gunType: 'rifle',
    burstCount: 1,                    // 点一下只开一枪
    burstDelay: 0,
    fireRate: 40,                     // 打完一枪必须手动等才能点下一枪
    damage: 70,
    shotPelletCount: 1,
    clipSize: 5,
    reloadTime: 4000 * 3,
    autoFireWithMouse: false,         // 半自动,按住鼠标没用
    fireRateWithHeldTouch: 40,
    keepScopeOnShot: true,
    altInaccuracyStanding: 30,
    altInaccuracyFromShot: 10,
    altInaccuracyMovement: 10,
    altYVelocityInaccuracy: 10,
    altInaccuracyFromJump: 10,
    inaccuracyStanding: 35 * 4,       // 腰射很散
    inaccuracyFromShot: 10 * 4,
    inaccuracyMovement: 45 * 4,
    yVelocityInaccuracy: 15 * 4,
    inaccuracyFromJump: 60 * 4,
    minKickback: 8.8,                 // 强烈后坐震动
    maxKickback: 15,
    kickbackRate: 0.08,
    kickbackDecreaseRate: 0.0001,
    muzzleFlashScale: 1.5,
    muzzleFlashOffsetFromGun: [0, 0.8, 0],
  },

  AWP: {
    gunType: 'rifle',
    scopeType: 'sniper',              // 启用狙击镜
    aimZoomFactor: 2.5,               // 开镜放大
    burstCount: 1,
    burstDelay: 4000,
    fireRate: 5,                      // 拉栓狙: 一枪一枪来
    damage: 200,                      // 单发200爆发伤害
    shotPelletCount: 1,
    clipSize: 3,
    reloadTime: 8000,
    autoFireWithMouse: false,         // 半自动
    fireRateWithHeldTouch: 40,
    keepScopeOnShot: true,
    altInaccuracyStanding: 0,         // 开镜绝对精准
    altInaccuracyFromShot: 0,
    altInaccuracyMovement: 0,
    altYVelocityInaccuracy: 0,
    altInaccuracyFromJump: 0,
    inaccuracyStanding: 250,          // 腰射很散,盲狙不准
    inaccuracyFromShot: 105,
    inaccuracyMovement: 450,
    yVelocityInaccuracy: 150,
    inaccuracyFromJump: 60,
    minKickback: 780,                 // 狙击枪强烈后坐
    maxKickback: 910,
    kickbackRate: 0.08,
    kickbackDecreaseRate: 0.0001,
    muzzleFlashScale: 1.5,
    muzzleFlashOffsetFromGun: [0, 0.8, 0],
  },

  FMR: {
    shotPelletCount: 4,
    fireRate: 500,
    damage: 12,
    reloadTime: 3000,
    clipSize: 30,
    minKickback: 0.05,
    maxKickback: 0.13,
    kickbackRate: 0,
    fireRateWithHeldTouch: 9000,
    gunType: 'submachine',
    autoFireWithMouse: true,
    keepScopeOnShot: true,
    altInaccuracyStanding: 0,
    altInaccuracyFromShot: 0,
    altInaccuracyMovement: 0,
    altYVelocityInaccuracy: 0,
    altInaccuracyFromJump: 0,
    inaccuracyStanding: 0,
    inaccuracyFromShot: 0,
    inaccuracyMovement: 0,
    yVelocityInaccuracy: 0,
    inaccuracyFromJump: 0,
    muzzleFlashScale: 1,
    muzzleFlashOffsetFromGun: [0, 0.8, 0],
    burstCount: 1,
  },
};

/* 把单把枪的参数应用到玩家(存在并成功才计数) */
const applyGun = (pId, gunName) => {
  const stats = GUNS[gunName];
  if (!stats) return false;
  try {
    // 传拷贝而非共享引用: 防止枪械运行时把 shotsLeft/配件改动写回 GUNS 表, 避免串到其它枪
    api.setItemStat(pId, gunName, 'gunStats', Object.assign({}, stats));
    return true;
  } catch(e) { return false; }
};

/* 玩家进服时把表里所有枪全部应用 —— 每个玩家都能带这些枪 */
const applyAll = (pId) => {
  let applied = 0;
  for (const gunName of Object.keys(GUNS)) {
    if (applyGun(pId, gunName)) applied++;
  }
  return applied;
};

module.exports = { GUNS, applyGun, applyAll };
