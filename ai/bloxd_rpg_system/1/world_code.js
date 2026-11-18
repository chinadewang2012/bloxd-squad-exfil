// ========================================
// Bloxd 游戏世界代码 - AWP 狙击枪系统
// ========================================

// ------------------------------
// 世界代码 (World Code) - 必须运行的基础程序
// ------------------------------

// 游戏初始化时执行
onGameInitialized = function() {
    api.broadcastMessage("[AWP系统] 狙击枪模组已加载");
};

// 玩家加入时执行
onPlayerJoin = function(playerId) {
    api.sendMessage(playerId, "§a欢迎来到 AWP 狙击枪测试服务器");
    
    // 给新玩家发放测试武器
    giveAWPToPlayer(playerId);
};

// 核心函数：设置 AWP 属性
function setupAWPStats() {
    // 设置 AWP 狙击枪的枪支属性
    api.setItemStat("AWP", "gunStats", {
        gunType: "semi_automatic",      // 半自动模式
        clipSize: 100,                  // 弹匣容量 100发
        autoFireWithMouse: true,        // 支持鼠标自动射击
        fireRate: 1000,                 // 射速 1000ms/发
        damage: 1000,                   // 伤害 1000
        reloadTime: 10,                 // 换弹时间 10秒
        inaccuracyStanding: 0,          // 站立精准度 0
        inaccuracyFromShot: 0,          // 射击后偏差 0
        inaccuracyMovement: 0,          // 移动偏差 0
        inaccuracyFromJump: 0,          // 跳跃偏差 0
        yVelocityInaccuracy: 0,         // Y轴速度偏差 0
        minKickback: 0,                 // 最小后坐力 0
        maxKickback: 0                  // 最大后坐力 0
    });
    
    // 设置自定义显示名称
    api.setItemStat("AWP", "customDisplayName", "§6§l死神之狙 §r§7AWP");
    
    // 设置自定义描述
    api.setItemStat("AWP", "customLore", [
        "§7传说级狙击步枪",
        "§c一击必杀，无坚不摧",
        "§6伤害: 1000",
        "§6弹匣: 100发",
        "§6精准度: 完美"
    ]);
}

// 给玩家发放 AWP
function giveAWPToPlayer(playerId) {
    // 尝试在玩家背包中找到空位
    var inventory = api.getInventory(playerId);
    var emptySlot = -1;
    
    for (var i = 0; i < 36; i++) {
        var slotItem = api.getItemSlot(playerId, i);
        if (!slotItem || slotItem.name === "Air") {
            emptySlot = i;
            break;
        }
    }
    
    if (emptySlot !== -1) {
        api.setItemSlot(playerId, emptySlot, "AWP", 1, {}, true);
        api.sendMessage(playerId, "§a已获得 §6§lAWP狙击枪");
    } else {
        // 如果背包满了，掉落物品
        var pos = api.getPosition(playerId);
        api.createItemDrop(pos[0], pos[1], pos[2], "AWP", 1, false, {}, 60000, playerId);
        api.sendMessage(playerId, "§e背包已满，AWP已掉落");
    }
}

// ------------------------------
// 变量 (Variables)
// ------------------------------

var AWP_CONFIG = {
    ENABLED: true,
    MAX_AMMO: 100,
    DAMAGE_MULTIPLIER: 1.0,
    SHOW_DEBUG: false
};

var playerAWPStats = {};  // 存储玩家使用AWP的统计数据

// ------------------------------
// 外扩代码 (Extension Code) - 需要激活才能运行
// ------------------------------

// 外扩代码激活状态
var EXTENSION_ACTIVE = false;

// 激活外扩代码
function activateExtension() {
    if (EXTENSION_ACTIVE) return;
    
    EXTENSION_ACTIVE = true;
    api.broadcastMessage("§6[AWP系统] 高级功能已激活");
    
    // 初始化AWP属性
    setupAWPStats();
}

// 禁用外扩代码
function deactivateExtension() {
    if (!EXTENSION_ACTIVE) return;
    
    EXTENSION_ACTIVE = false;
    api.broadcastMessage("§c[AWP系统] 高级功能已禁用");
}

// 玩家攻击回调（外扩功能）
onPlayerDamagingOtherPlayer = function(attackingPlayer, damagedPlayer, damageDealt, withItem) {
    if (!EXTENSION_ACTIVE) return damageDealt;
    
    if (withItem === "AWP") {
        // AWP 特殊伤害计算
        var bonusDamage = Math.floor(damageDealt * AWP_CONFIG.DAMAGE_MULTIPLIER);
        
        // 记录击杀统计
        if (!playerAWPStats[attackingPlayer]) {
            playerAWPStats[attackingPlayer] = { kills: 0, shots: 0 };
        }
        playerAWPStats[attackingPlayer].shots++;
        
        api.sendMessage(attackingPlayer, "§cAWP造成 " + bonusDamage + " 伤害!");
        
        return bonusDamage;
    }
    
    return damageDealt;
};

// 玩家击杀实体回调（外扩功能）
onPlayerKilledMob = function(playerId, mobId, damageDealt, withItem) {
    if (!EXTENSION_ACTIVE) return;
    
    if (withItem === "AWP" && playerAWPStats[playerId]) {
        playerAWPStats[playerId].kills++;
        
        // 发送击杀提示
        api.sendMessage(playerId, "§6[AWP击杀] §f累计击杀: " + playerAWPStats[playerId].kills);
        
        // 显示击杀特效
        var pos = api.getPosition(mobId);
        if (pos) {
            api.showFloatingText("§c§l一击必杀!", pos, { color: "red", size: 2 });
        }
    }
};

// 命令处理器
onPlayerCommand = function(playerId, command) {
    var cmd = command.toLowerCase();
    
    if (cmd === "/awp") {
        // 激活/禁用AWP系统
        if (EXTENSION_ACTIVE) {
            deactivateExtension();
        } else {
            activateExtension();
        }
        return "preventCommand";
    }
    
    if (cmd === "/giveawp") {
        // 给自己发放AWP
        giveAWPToPlayer(playerId);
        return "preventCommand";
    }
    
    if (cmd === "/awpstats") {
        // 查看AWP统计
        var stats = playerAWPStats[playerId] || { kills: 0, shots: 0 };
        var accuracy = stats.shots > 0 ? Math.round(stats.kills / stats.shots * 100) : 0;
        
        api.sendMessage(playerId, "§6=== AWP 统计 ===");
        api.sendMessage(playerId, "§f击杀数: §a" + stats.kills);
        api.sendMessage(playerId, "§f射击数: §b" + stats.shots);
        api.sendMessage(playerId, "§f命中率: §c" + accuracy + "%");
        return "preventCommand";
    }
    
    return null;
};

// 初始化时自动激活外扩代码
// activateExtension();
