/* ===== 导出诊断入口(临时替换 index.js, 查完换回正式版) =====
 * 官网规则: require 参数必须是 ./ 开头的静态字面量, 全部顶层直写。
 * 只做一件事: 把 13 个模块各自的导出数量、game.onTick 类型打到聊天框。 */
console.log('[诊断] 开始');

const m_config = require("./config.js");
const m_db = require("./db.js");
const m_guns = require("./guns.js");
const m_mobs = require("./mobs.js");
const m_customweapons = require("./customweapons.js");
const m_maps = require("./maps.js");
const m_loot = require("./loot.js");
const m_team = require("./team.js");
const m_operators = require("./operators.js");
const m_fittings = require("./fittings.js");
const m_menu = require("./menu.js");
const m_game = require("./game.js");

const mods = [
  ['config', m_config], ['db', m_db], ['guns', m_guns], ['mobs', m_mobs],
  ['customweapons', m_customweapons], ['maps', m_maps], ['loot', m_loot],
  ['team', m_team], ['operators', m_operators], ['fittings', m_fittings],
  ['menu', m_menu], ['game', m_game],
];
let report = '[诊断] ';
for (const pair of mods) {
  const name = pair[0], m = pair[1];
  let n = 0;
  try { n = Object.keys(m || {}).length; } catch (e) { n = -1; }
  report += name + '=' + n + ' ';
}
console.log(report);
console.log('[诊断] game.onTick 类型 = ' + typeof m_game.onTick
  + ' | VERSION = ' + ((m_config && m_config.VERSION) || 'config导出为空'));

tick = () => {};
onPlayerJoin = (pId) => {
  try { api.sendMessage(pId, report); } catch (e) {}
  try { api.sendMessage(pId, '[诊断] game.onTick=' + typeof m_game.onTick
    + ' VERSION=' + ((m_config && m_config.VERSION) || '空')); } catch (e) {}
};
