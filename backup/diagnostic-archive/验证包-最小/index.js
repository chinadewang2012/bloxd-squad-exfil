/* 最小验证入口: 只测 require 与回调, 不含任何业务逻辑 */
console.log('[验证] init 开始');
const cfg = require("./config.js");
console.log('[验证] require 成功, MSG = ' + cfg.MSG);

tick = () => {};
onPlayerJoin = (pId) => {
  try { api.sendMessage(pId, '验证通过: ' + cfg.MSG); } catch (e) {}
};
