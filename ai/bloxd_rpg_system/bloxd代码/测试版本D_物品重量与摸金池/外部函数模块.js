/*外部函数模块 vD.0 - 物品重量与摸金池版*/
/*引用物品重量与摸金池模块，实现八大系统*/

/*==================== 第一部分：全局变量 ====================*/

var go = false;
var chushengdian = [0, 64, 0];
var jinru = {};
var jinyan = {};
var owner = "";
var tubaolv = 1;
var daojishi = 300;

var pd = {};
var pl = [];
var fz = {};

var pt = {};
var tm = {};
var tl = {};

var dd = {};
var ds = {};
var dd_killer = {};

var mj_cd = {};
var mj_active = {};

var chengjiu = {
  "初来乍到": "Moonstone",
  "矿工": "Diamond",
  "战士": "Iron Sword",
  "富商": "Gold",
  "探险家": "Emerald"
};

var zanghua = ["fuck", "shit", "damn", "草", "妈", "傻", "sb", "nc"];

var guanli = [];
var co = [];
var builder = [];
var coder = [];
var ts = [];

var kuaifa = [
  "集合！",
  "发现敌人！",
  "需要支援！",
  "撤离点集合！",
  "小心！",
  "救我！",
  "掩护我！",
  "敌人方向！"
];

/*==================== 第二部分：引用摸金池配置 ====================*/

/*摸金方块列表 - 对应七个摸金池*/
var keyimojin = ["White Wool", "Orange Wool", "Magenta Wool", "Light Blue Wool", "Yellow Wool", "Lime Wool", "Pink Wool"];

/*摸金池映射*/
var mojinchi = {
  "White Wool": PutongChi,
  "Orange Wool": JingliangChi,
  "Magenta Wool": XiyouChi,
  "Light Blue Wool": ShishiChi,
  "Yellow Wool": ChuanshuoChi,
  "Lime Wool": ShenhuaChi,
  "Pink Wool": ZhizunChi
};

/*摸金池名称*/
var mojinchi_mingcheng = {
  "White Wool": "普通摸金池",
  "Orange Wool": "精良摸金池",
  "Magenta Wool": "稀有摸金池",
  "Light Blue Wool": "史诗摸金池",
  "Yellow Wool": "传说摸金池",
  "Lime Wool": "神话摸金池",
  "Pink Wool": "至尊摸金池"
};

/*==================== 第三部分：核心功能函数 ====================*/

/*发送消息*/
function ext_sendMessage(player, message, style) {
  if (!style) style = {};
  api.sendMessage(player, message, style);
}

/*广播消息*/
function ext_broadcastMessage(message, style) {
  if (!style) style = {};
  api.broadcastMessage(message, style);
}

/*获取玩家KD*/
function ext_getKD(player) {
  if (!pd[player]) return 1;
  var k = pd[player].k || 1;
  var d = pd[player].d || 1;
  return Math.max(0.5, k / d);
}

/*进入游戏*/
function ext_enterGame(player, time) {
  if (!pd[player]) {
    pd[player] = {k: 1, d: 1, ms: 0, czjd: 0, czzt: false};
  }
  jinru[player] = true;
  ext_sendMessage(player, "游戏开始！倒计时：" + time + "秒", {color: "green"});
}

/*撤离系统*/
function ext_cheli(player, jindu) {
  if (!pd[player]) return;
  pd[player].czjd = jindu;
  if (jindu >= 100) {
    pd[player].czzt = true;
    ext_sendMessage(player, "撤离成功！", {color: "gold"});
    api.setPosition(player, chushengdian[0], chushengdian[1], chushengdian[2]);
  }
}

/*==================== 第四部分：重量计算系统 ====================*/

/*计算玩家背包总重量 - 通过物品命名检测*/
function ext_calcWeight(player) {
  var totalWeight = 0;
  var inv = api.getInventory(player);
  if (!inv) return 0;
  
  for (var i = 0; i < inv.length; i++) {
    var item = inv[i];
    if (!item) continue;
    
    /*获取物品命名*/
    var itemName = api.getItemName(player, item.name, i);
    if (!itemName) itemName = item.name;
    
    /*查找重量配置*/
    var weight = 0;
    if (wupinzhongliang[itemName]) {
      weight = wupinzhongliang[itemName];
    } else if (wupinzhongliang[item.name]) {
      weight = wupinzhongliang[item.name];
    } else {
      weight = 0.5;
    }
    
    totalWeight += weight * (item.count || 1);
  }
  
  fz[player] = totalWeight;
  return totalWeight;
}

/*获取玩家重量*/
function ext_getWeight(player) {
  if (fz[player] === undefined) {
    return ext_calcWeight(player);
  }
  return fz[player];
}

/*检查是否超重*/
function ext_checkOverweight(player, maxWeight) {
  var weight = ext_getWeight(player);
  if (!maxWeight) maxWeight = 50;
  return weight > maxWeight;
}

/*==================== 价值计算系统 ====================*/

/*检测物品介绍并提取价值 - 数字为价值，非数字为0*/
function ext_getItemValueFromDesc(desc) {
  if (!desc || typeof desc !== "string") return 0;
  var num = parseFloat(desc);
  return isNaN(num) ? 0 : num;
}

/*从摸金池获取物品价值*/
function ext_getItemValueFromPool(itemName) {
  var allPools = [PutongChi, JingliangChi, XiyouChi, ShishiChi, ChuanshuoChi, ShenhuaChi, ZhizunChi];
  for (var p = 0; p < allPools.length; p++) {
    var pool = allPools[p];
    for (var i = 0; i < pool.length; i++) {
      if (pool[i].name === itemName) {
        return pool[i].v || 0;
      }
    }
  }
  return 0;
}

/*计算玩家所有物品总价值*/
function ext_calcTotalValue(player) {
  var totalValue = 0;
  var inv = api.getInventory(player);
  if (!inv) return 0;
  
  for (var i = 0; i < inv.length; i++) {
    var item = inv[i];
    if (!item) continue;
    
    /*优先从物品介绍获取价值*/
    var desc = api.getItemDescription(player, item.name, i);
    var value = ext_getItemValueFromDesc(desc);
    
    /*如果介绍中没有价值，从摸金池获取*/
    if (value === 0) {
      value = ext_getItemValueFromPool(item.name);
    }
    
    totalValue += value * (item.count || 1);
  }
  
  return totalValue;
}

/*获取玩家总价值（带缓存）*/
var wupinjiazhi = {};
function ext_getTotalValue(player) {
  if (wupinjiazhi[player] === undefined) {
    wupinjiazhi[player] = ext_calcTotalValue(player);
  }
  return wupinjiazhi[player];
}

/*更新玩家物品价值缓存*/
function ext_updateValueCache(player) {
  wupinjiazhi[player] = ext_calcTotalValue(player);
}

/*获取单个物品价值*/
function ext_getSingleItemValue(player, itemName, slot) {
  var desc = api.getItemDescription(player, itemName, slot);
  var value = ext_getItemValueFromDesc(desc);
  
  if (value === 0) {
    value = ext_getItemValueFromPool(itemName);
  }
  
  return value;
}

/*==================== 第五部分：摸金系统 ====================*/

/*检查是否可以摸金*/
function ext_canMojin(player, block) {
  if (keyimojin.indexOf(block) < 0) return false;
  if (mj_cd[player] && Date.now() < mj_cd[player]) {
    ext_sendMessage(player, "摸金冷却中，请稍后再试", {color: "red"});
    return false;
  }
  return true;
}

/*执行摸金*/
function ext_doMojin(player, block, x, y, z) {
  if (!ext_canMojin(player, block)) return {success: false, reason: "无法摸金"};
  
  var pool = mojinchi[block];
  if (!pool) return {success: false, reason: "摸金池未找到"};
  
  var poolName = mojinchi_mingcheng[block];
  var kd = ext_getKD(player);
  var items = [];
  
  /*根据KD和爆率计算掉落 - 爆率=基本爆率/KD*/
  for (var i = 0; i < pool.length; i++) {
    var item = pool[i];
    var baseBaolv = item.bl || (item.d * 0.1);
    var baolv = baseBaolv / kd;
    if (baolv > 1 || Math.random() < baolv) {
      var count = Math.floor(Math.random() * (item.max - item.min + 1)) + item.min;
      var value = item.v || 0;
      var displayName = item.dn || item.n || item.name;
      items.push({name: item.name, displayName: displayName, count: count, value: value});
    }
  }
  
  /*限制最大掉落数量*/
  if (items.length > 9) {
    items = items.slice(0, 9);
  }
  
  /*放入箱子*/
  for (var j = 0; j < items.length; j++) {
    api.insertItem(x, y, z, items[j].name, items[j].count);
  }
  
  /*设置冷却*/
  mj_cd[player] = Date.now() + 5000;
  
  /*发送消息*/
  var itemNames = [];
  for (var k = 0; k < items.length; k++) {
    itemNames.push(items[k].displayName + "x" + items[k].count);
  }
  ext_sendMessage(player, "【" + poolName + "】摸金成功！获得: " + itemNames.join(", "), {color: "gold"});
  
  return {success: true, items: items, pool: poolName};
}

/*获取摸金池信息*/
function ext_getMojinInfo(block) {
  var pool = mojinchi[block];
  if (!pool) return null;
  return {
    name: mojinchi_mingcheng[block],
    count: pool.length,
    items: pool
  };
}

/*==================== 第六部分：队伍系统 ====================*/

/*创建队伍*/
function ext_createTeam(teamId, teamName, leader) {
  if (!tm[teamId]) {
    tm[teamId] = {
      name: teamName,
      leader: leader,
      members: [leader]
    };
    pt[leader] = teamId;
    ext_sendMessage(leader, "队伍 " + teamName + " 创建成功！", {color: "green"});
    return true;
  }
  return false;
}

/*加入队伍*/
function ext_joinTeam(player, teamId) {
  if (tm[teamId]) {
    tm[teamId].members.push(player);
    pt[player] = teamId;
    ext_sendMessage(player, "加入队伍 " + tm[teamId].name, {color: "green"});
    return true;
  }
  return false;
}

/*离开队伍*/
function ext_leaveTeam(player) {
  var teamId = pt[player];
  if (teamId && tm[teamId]) {
    var members = tm[teamId].members;
    var idx = members.indexOf(player);
    if (idx >= 0) members.splice(idx, 1);
    delete pt[player];
    ext_sendMessage(player, "已离开队伍", {color: "yellow"});
    return true;
  }
  return false;
}

/*队伍聊天*/
function ext_teamChat(player, message) {
  var teamId = pt[player];
  if (teamId && tm[teamId]) {
    var members = tm[teamId].members;
    for (var i = 0; i < members.length; i++) {
      ext_sendMessage(members[i], "[队伍] " + player + ": " + message, {color: "aqua"});
    }
    return true;
  }
  return false;
}

/*==================== 第七部分：倒地与救援系统 ====================*/

/*玩家倒地*/
function ext_playerDown(player, killer) {
  dd[player] = true;
  ds[player] = Date.now();
  dd_killer[player] = killer;
  ext_sendMessage(player, "你已被击倒！等待救援...", {color: "red"});
  ext_broadcastMessage(player + " 被击倒！", {color: "dark_red"});
}

/*救援玩家*/
function ext_rescuePlayer(rescuer, target) {
  if (dd[target]) {
    delete dd[target];
    delete ds[target];
    delete dd_killer[target];
    ext_sendMessage(target, "你被 " + rescuer + " 救起！", {color: "green"});
    ext_sendMessage(rescuer, "成功救起 " + target, {color: "green"});
    api.setHealth(target, 10);
    return true;
  }
  return false;
}

/*检查倒地状态*/
function ext_checkDownStatus(player) {
  if (dd[player]) {
    var elapsed = Date.now() - ds[player];
    if (elapsed > 60000) {
      delete dd[player];
      delete ds[player];
      delete dd_killer[player];
      api.killLifeform(player);
      return false;
    }
    return true;
  }
  return false;
}

/*==================== 第八部分：成就系统 ====================*/

/*检查成就*/
function ext_checkChengjiu(player, type) {
  if (!pd[player]) return;
  if (type === "kill" && pd[player].k >= 10 && !pd[player].cj_10kill) {
    pd[player].cj_10kill = true;
    api.giveItem(player, chengjiu["战士"], 1);
    ext_sendMessage(player, "解锁成就：战士！", {color: "gold"});
  }
  if (type === "mine" && !pd[player].cj_miner) {
    pd[player].cj_miner = true;
    api.giveItem(player, chengjiu["矿工"], 1);
    ext_sendMessage(player, "解锁成就：矿工！", {color: "gold"});
  }
}

/*给予成就奖励*/
function ext_giveChengjiu(player, cjName) {
  if (chengjiu[cjName]) {
    api.giveItem(player, chengjiu[cjName], 1);
    ext_sendMessage(player, "获得成就奖励：" + cjName, {color: "gold"});
  }
}

/*==================== 第九部分：聊天系统 ====================*/

/*处理聊天消息*/
function ext_handleChat(player, message) {
  /*检查脏话*/
  for (var i = 0; i < zanghua.length; i++) {
    if (message.indexOf(zanghua[i]) >= 0) {
      ext_sendMessage(player, "消息包含不当内容，已过滤", {color: "red"});
      return false;
    }
  }
  
  /*快捷发言*/
  if (message.indexOf("/") === 0) {
    var cmd = message.substring(1);
    var idx = parseInt(cmd);
    if (!isNaN(idx) && idx >= 1 && idx <= kuaifa.length) {
      ext_broadcastMessage("[" + player + "] " + kuaifa[idx - 1], {color: "yellow"});
      return true;
    }
  }
  
  return true;
}

/*发送快捷消息*/
function ext_quickChat(player, index) {
  if (index >= 0 && index < kuaifa.length) {
    ext_broadcastMessage("[" + player + "] " + kuaifa[index], {color: "yellow"});
  }
}

/*==================== 第十部分：初始化与工具函数 ====================*/

/*初始化玩家数据*/
function ext_initPlayer(player) {
  if (!pd[player]) {
    pd[player] = {
      k: 0,
      d: 0,
      ms: 0,
      czjd: 0,
      czzt: false
    };
  }
  jinru[player] = false;
  fz[player] = 0;
}

/*重置玩家状态*/
function ext_resetPlayer(player) {
  jinru[player] = false;
  pd[player] = {k: 0, d: 0, ms: 0, czjd: 0, czzt: false};
  fz[player] = 0;
  ext_leaveTeam(player);
}

/*获取所有玩家列表*/
function ext_getAllPlayers() {
  return pl;
}

/*检查玩家是否在游戏中*/
function ext_isInGame(player) {
  return jinru[player] === true;
}

/*设置游戏状态*/
function ext_setGameState(state) {
  go = state;
}

/*获取游戏状态*/
function ext_getGameState() {
  return go;
}

/*初始化模块*/
function ext_init() {
  pl = [];
  pd = {};
  fz = {};
  wupinjiazhi = {};
  tm = {};
  pt = {};
  dd = {};
  ds = {};
  mj_cd = {};
  go = false;
  ext_broadcastMessage("游戏系统已初始化！", {color: "green"});
}

/*导出模块信息*/
var ext_info = {
  version: "D.3",
  name: "物品重量与摸金池版",
  features: ["撤离系统", "摸金系统(7池350+物品)", "重量系统", "队伍系统", "救援系统", "成就系统", "聊天系统", "价值系统", "爆率计算系统"],
  mojinPools: 7,
  totalItems: 350,
  newFeatures: ["物品价值计算(三角洲风格)", "爆率=基本爆率/KD", "物品介绍价值检测", "三角洲风格显示名(dn)"]
};
