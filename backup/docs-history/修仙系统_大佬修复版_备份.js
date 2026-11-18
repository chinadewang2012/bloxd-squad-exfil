var _arrowHidden = {};
var _z1Ids = []; var _z1Max = 5;
var _z2Ids = []; var _z2Max = 5;
var _z3Ids = []; var _z3Max = 4;
var _z4Ids = []; var _z4Max = 4;
var _z5Ids = []; var _z5Max = 5;
var _z7Ids = []; var _z7Max = 5;
var _z6Ids = []; var _z6Max = 5;
var _z8Ids = []; var _z8Max = 5;
var _z9Ids = []; var _z9Max = 3;

var _zL = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0, z6: 0, z7: 0, z8: 0, z9: 0 };
var _zA = { z1: false, z2: false, z3: false, z4: false, z5: false, z6: false, z7: false, z8: false, z9: false };
var bei = 1;

var _fgIds = []; var _fgMax = 5; var _fgActive = false; var _fgLeft = 0;
var _MAX_HP = 2147483647;
var _tC = 0;

var _zCfg = {
    z1: ["Draugr Zombie", 1, 5, 5, 20, 1, 0.3, 1],
    z2: ["Draugr Zombie", 1, 5, 8, 35, 1, 0.3, 1],
    z3: ["Draugr Zombie", 1, 4, 12, 55, 1.5, 0.4, 2],
    z4: ["Draugr Zombie", 1, 4, 18, 85, 1.5, 0.4, 2],
    z5: ["Draugr Zombie", 1, 5, 28, 130, 2, 0.5, 3],
    z6: ["Frost Zombie", 1, 5, 42, 200, 2, 0.5, 3],
    z7: ["Frost Zombie", 1, 5, 65, 310, 2.5, 0.6, 4],
    z8: ["Frost Zombie", 1, 5, 100, 480, 2.5, 0.6, 4],
    z9: ["Frost Zombie", 1, 3, 155, 750, 3, 0.7, 5]
};

function clrZ(ids) {
    for (var _ci = 0; _ci < ids.length; _ci++) {
        try { api.despawnMob(ids[_ci]); } catch (e) { }
    }
    ids.length = 0;
}

var _GU = [[1e100, "x10^100"], [1e68, "大数"], [1e64, "不可思议"], [1e60, "那由他"], [1e56, "阿僧祇"], [1e52, "恒河沙"], [1e48, "极"], [1e44, "载"], [1e40, "正"], [1e36, "涧"], [1e32, "沟"], [1e28, "穰"], [1e24, "秭"], [1e20, "垓"], [1e16, "京"], [1e12, "兆"], [1e8, "亿"], [1e4, "万"]];

function fmtNum(n) {
    for (var _gi = 0; _gi < _GU.length; _gi++) {
        if (n >= _GU[_gi][0]) return (n / _GU[_gi][0]).toFixed(1) + _GU[_gi][1];
    }
    return "" + n;
}

var _JJ = [[1e5, "炼气初期", "#88dddd"], [3e5, "炼气中期", "#aaccff"], [5e5, "炼气后期", "#5faaaa"], [1e6, "炼气圆满", "#55ccff"], [3e6, "筑基初期", "#90ee90"], [5e6, "筑基中期", "#66cc66"], [1e7, "筑基后期", "#00cc66"], [3e7, "筑基圆满", "#006633"], [5e7, "金丹初期", "#ffee88"], [1e8, "金丹中期", "#ffd700"], [3e8, "金丹后期", "#ffaa00"], [5e8, "金丹圆满", "#ff8800"], [1e9, "元婴初期", "#cc99ff"], [3e9, "元婴中期", "#9966cc"], [5e9, "元婴后期", "#6633aa"], [1e10, "元婴圆满", "#442288"], [3e10, "化神初期", "#ff9999"], [5e10, "化神中期", "#ff4466"], [1e11, "化神后期", "#ff0000"], [3e11, "化神圆满", "#990000"], [5e11, "炼虚", "#cccccc"], [1e13, "合体", "#aa88ff"], [3e14, "大乘", "#ffccdd"], [5e36, "渡劫", "#ff6622"], [3e38, "真仙", "#ffffff"], [3e39, "玄仙", "#555666"], [5e40, "金仙", "#ffe488"], [1e42, "太乙真人", "#33ccaa"], [3e43, "大罗金仙", "#ffaacc"], [5e43, "大罗中期", "#ff77ff"], [1e44, "大罗后期", "#aaffee"], [3e44, "大罗圆满", "#77ffcc"], [5e44, "混沌初期", "#666666"], [1e45, "混沌中期", "#444444"], [3e45, "混沌后期", "#222222"], [5e45, "混沌圆满", "#111111"], [1e46, "洪荒初期", "#ccaa55"], [3e46, "洪荒中期", "#996633"], [5e46, "洪荒后期", "#bb8844"], [1e47, "洪荒圆满", "#886622"], [3e47, "神王初期", "#eeeedd"], [5e47, "神王中期", "#ffffee"], [1e48, "神王后期", "#ffdd44"], [5e48, "命苦的服主", "#ffdd44"], [9e73, "硅基", "#ffdd44"]];

function getRealm(pw) {
    var _rn = "凡人"; var _rc = "#888888";
    for (var _ri = 0; _ri < _JJ.length; _ri++) {
        if (pw >= _JJ[_ri][0]) { _rn = _JJ[_ri][1]; _rc = _JJ[_ri][2]; }
    }
    return { name: _rn, color: _rc };
}

function _rd(s) {
    if (!s || !s.attributes || !s.attributes.customDescription) return 0;
    var _m = s.attributes.customDescription.match(/[\d.eE+]+/);
    return _m ? +_m[0] : 0;
}

function getStats(pId) {
    var _s0 = api.getMoonstoneChestItemSlot(pId, 0);
    var _s1 = api.getMoonstoneChestItemSlot(pId, 1);
    var _s2 = api.getMoonstoneChestItemSlot(pId, 2);
    var _s3 = api.getMoonstoneChestItemSlot(pId, 3);
    var _s4 = api.getMoonstoneChestItemSlot(pId, 4);
    var _s5 = api.getMoonstoneChestItemSlot(pId, 5);
    return { atk: _rd(_s0) || 10, hp: _rd(_s1) || 10, reborn: _rd(_s2), mult: _rd(_s3) || 1, jade: _rd(_s4), overHp: _rd(_s5) };
}

function setStats(pId, atk, hp, reborn, mult, jade) {
    bei = reborn + 1;
    atk = Math.round(atk * 100) / 100;
    hp = Math.round(hp * 100) / 100;
    api.setMoonstoneChestItemSlot(pId, 0, "Red Concrete", 1, { customDisplayName: "攻击", customDescription: "" + atk });
    api.setMoonstoneChestItemSlot(pId, 1, "Green Concrete", 1, { customDisplayName: "生命", customDescription: "" + hp });
    api.setMoonstoneChestItemSlot(pId, 2, "Cyan Concrete", 1, { customDisplayName: "轮回", customDescription: "" + reborn });
    if (mult !== undefined) api.setMoonstoneChestItemSlot(pId, 3, "Yellow Concrete", 1, { customDisplayName: "倍率", customDescription: "" + mult });
    if (jade !== undefined) api.setMoonstoneChestItemSlot(pId, 4, "Blue Concrete", 1, { customDisplayName: "仙玉", customDescription: "" + jade });
}

function setOverHp(pId, val) {
    api.setMoonstoneChestItemSlot(pId, 5, "Pink Concrete", 1, { customDisplayName: "溢出生命", customDescription: "" + val });
}

function getPower(st) {
    return Math.round((st.hp + st.atk) * 10 * 100) / 100;
}

function shA(pId) {
    api.setDirectionArrow(pId, "ps", [22, 12, 61], "枪械售卖点", true, { color: "lime" });
    api.setDirectionArrow(pId, "es", [90, 12, 61], "副本+地图", true, { color: "orange" });
}

function hiA(pId) {
    api.clearDirectionArrow(pId, "ps");
    api.clearDirectionArrow(pId, "es");
}

function applyStats(pId) {
    var _st = getStats(pId);
    var _th = Math.floor(_st.hp);
    if (_th > _MAX_HP) {
        api.setHealth(pId, _MAX_HP, undefined, true);
        setOverHp(pId, _th - _MAX_HP);
    } else {
        api.setHealth(pId, _th, undefined, true);
        setOverHp(pId, 0);
    }
}

function refillHp(pId) {
    var _st = getStats(pId);
    if (_st.overHp <= 0) return;
    var _ch = api.getHealth(pId);
    if (_ch >= _MAX_HP) return;
    var _gv = Math.min(_MAX_HP - _ch, Math.floor(_st.overHp));
    api.setHealth(pId, Math.floor(_ch + _gv), undefined, true);
    setOverHp(pId, _st.overHp - _gv);
}

var _F = "14px"; var _NL = { str: "\n" };

function updSB(pId) {
    var _n = api.getEntityName(pId);
    var _st = getStats(pId);
    var _pw = getPower(_st);
    var _rl = getRealm(_pw);
    api.setClientOption(pId, "RightInfoText", [{ str: "══ 修仙手册 ══", style: { color: "gold", fontSize: "18px", fontWeight: "bold" } }, _NL, { str: _n, style: { color: "white", fontSize: "15px" } }, _NL, { str: "境界: " + _rl.name, style: { color: _rl.color, fontSize: _F, fontWeight: "bold" } }, _NL, { str: "战力: " + fmtNum(_pw), style: { color: "red", fontSize: _F, fontWeight: "bold" } }, _NL, { str: "攻击: " + fmtNum(_st.atk), style: { color: "orange", fontSize: _F } }, _NL, { str: "生命: " + fmtNum(_st.hp), style: { color: "lime", fontSize: _F } }, _NL, { str: "轮回: " + _st.reborn, style: { color: "cyan", fontSize: _F } }, _NL, { str: "倍率: x" + fmtNum(_st.mult), style: { color: "yellow", fontSize: _F } }, _NL, { str: "仙玉: " + fmtNum(_st.jade), style: { color: "#00ddff", fontSize: _F } }]);
}

function updAll() {
    var _ps = api.getPlayerIds();
    for (var _i = 0; _i < _ps.length; _i++) updSB(_ps[_i]);
}

function pNear(x1, x2, y1, y2, z1, z2) {
    var _ps = api.getPlayerIds();
    for (var _i = 0; _i < _ps.length; _i++) {
        var _pp = api.getPosition(_ps[_i]);
        if (_pp && _pp[0] >= x1 && _pp[0] <= x2 && _pp[1] >= y1 && _pp[1] <= y2 && _pp[2] >= z1 && _pp[2] <= z2) return 1;
    }
    return 0;
}

function spawnMobAt(cfg, x1, x2, y, z1, z2, ids, max) {
    if (ids.length >= max) return;
    var _t = cfg[0], _dmg = cfg[3], _hp = cfg[4], _r = cfg[5], _kb = cfg[6];
    var _sx = x1 + Math.random() * (x2 - x1);
    var _sz = z1 + Math.random() * (z2 - z1);
    var _mid = api.attemptSpawnMob(_t, _sx, y, _sz);
    if (_mid) {
        ids.push(_mid);
        api.setTargetedPlayerSettingForEveryone(_mid, "nameTagInfo", { "content": [{ str: _t + " [" + _dmg + "攻/" + _hp + "血]" }] }, true);
        api.setMobSetting(_mid, "attackDamage", _dmg);
        api.setMobSetting(_mid, "maxHealth", _hp);
        api.setMobSetting(_mid, "attackRadius", _r);
        api.setMobSetting(_mid, "attackImpulse", _kb);
    }
}

function sp1() { var _c = _zCfg.z1; for (var _i = 0; _i < _c[1]; _i++) spawnMobAt(_c, 47, 53, 0, 74, 93, _z1Ids, _z1Max); }
function sp2() { var _c = _zCfg.z2; for (var _i = 0; _i < _c[1]; _i++) spawnMobAt(_c, 60, 78, 0, 74, 93, _z2Ids, _z2Max); }
function sp3() { var _c = _zCfg.z3; for (var _i = 0; _i < _c[1]; _i++) spawnMobAt(_c, 31, 39, 0, 108, 128, _z3Ids, _z3Max); }
function sp4() { var _c = _zCfg.z4; for (var _i = 0; _i < _c[1]; _i++) spawnMobAt(_c, 75, 84, 0, 112, 122, _z4Ids, _z4Max); }
function sp5() { var _c = _zCfg.z5; for (var _i = 0; _i < _c[1]; _i++) spawnMobAt(_c, 80, 84, 0, 276, 279, _z5Ids, _z5Max); }
function sp6() { var _c = _zCfg.z6; for (var _i = 0; _i < _c[1]; _i++) spawnMobAt(_c, 59, 61, 0, 267, 272, _z6Ids, _z6Max); }
function sp7() { var _c = _zCfg.z7; for (var _i = 0; _i < _c[1]; _i++) spawnMobAt(_c, 51, 53, 0, 267, 274, _z7Ids, _z7Max); }
function sp8() { var _c = _zCfg.z8; for (var _i = 0; _i < _c[1]; _i++) spawnMobAt(_c, 28, 30, 0, 270, 274, _z8Ids, _z8Max); }
function sp9() { var _c = _zCfg.z9; for (var _i = 0; _i < _c[1]; _i++) spawnMobAt(_c, 133, 135, 0, 66, 68, _z9Ids, _z9Max); }

function spawnFG() {
    var _c = ["Frost Golem", 5, 5, 500, 5000, 4, 1, 6];
    for (var _i = 0; _i < _c[1]; _i++) {
        if (_fgIds.length >= _fgMax) return;
        var _x = 44 + _i * 6;
        var _mid = api.attemptSpawnMob(_c[0], _x, 99, 59 + _i * 6);
        if (_mid) {
            _fgIds.push(_mid);
            api.setTargetedPlayerSettingForEveryone(_mid, "nameTagInfo", { "content": [{ str: _c[0] + "[BOSS]" + _c[4] + "血" }] }, true);
            api.setMobSetting(_mid, "attackDamage", _c[3]);
            api.setMobSetting(_mid, "maxHealth", _c[4]);
            api.setMobSetting(_mid, "attackRadius", _c[5]);
            api.setMobSetting(_mid, "attackImpulse", _c[6]);
            api.setMobSetting(_mid, "baseWalkingSpeed", 0);
        }
    }
}

var _ELIXIRS = {
    "Apple": { name: "小还丹", atk: 100, hp: 0, mult: 0, reborn: 0 },
    "Gold Apple": { name: "大还丹", atk: 500, hp: 0, mult: 0, reborn: 0 },
    "Plum": { name: "培元丹", atk: 0, hp: 50, mult: 0, reborn: 0 },
    "Coconut": { name: "固元丹", atk: 0, hp: 200, mult: 0, reborn: 0 },
    "Pear": { name: "洗髓丹", atk: 0, hp: 0, mult: 0.1, reborn: 0 },
    "Cherry": { name: "轮回丹", atk: 0, hp: 0, mult: 0, reborn: 1 }
};

var _DROPS = [
    [["Wheat", "Coal", "Leather"], ["灵草", "矿石", "兽皮"], 1, 3],
    [["Carrot", "Raw Iron", "Bone"], ["灵芝", "铁矿", "兽骨"], 1, 3],
    [["Potato", "Iron Bar", "Fur"], ["人参", "铜矿", "妖皮"], 2, 4],
    [["Beetroot", "Gold Bar", "Golem Eye"], ["雪莲", "银矿", "妖骨"], 2, 4],
    [["Corn", "Diamond", "Knight Heart"], ["朱果", "金矿", "灵皮"], 3, 5],
    [["Moonstone", "Moonstone Fragment", "Golem Eye"], ["龙血", "秘银", "灵骨"], 3, 5],
    [["Gold Bar", "Diamond", "Moonstone"], ["凤花", "精金", "神皮"], 5, 10]
];

function spawnDrop(pos, lv, mlt) {
    var _dt = _DROPS[lv - 1] || _DROPS[0];
    var _di = Math.floor(Math.random() * _dt[0].length);
    var _it = _dt[0][_di];
    var _nm = _dt[1][_di];
    var _amt = Math.floor((Math.random() * (_dt[3] - _dt[2]) + _dt[2]) * mlt);
    api.spawnItem(_it, pos, _amt, { customDisplayName: _nm });
}

onPlayerJoin = function (pid, firstTime) {
    var _st;
    try { _st = getStats(pid); } catch (e) { _st = { atk: 10, hp: 10, reborn: 0, mult: 1, jade: 0, overHp: 0 }; }
    if (_st.atk <= 10 && _st.hp <= 10) {
        setStats(pid, 10, 20, 0, 1, 0);
        _st = { atk: 10, hp: 20, reborn: 0, mult: 1, jade: 0, overHp: 0 };
    }
    applyStats(pid);
    shA(pid);
    updSB(pid);
    var _pw = getPower(_st);
    var _rl = getRealm(_pw);
    api.sendMessage(pid, [{ str: "[修仙]欢迎！境界:", style: { color: "yellow" } }, { str: _rl.name, style: { color: _rl.color } }]);
};

onPlayerLeave = function (pid) {
    hiA(pid);
};

onPlayerChat = function (pid, msg) {
    var _st = getStats(pid);
    var _pw = getPower(_st);
    var _rl = getRealm(_pw);
    api.broadcastMessage([{ str: "[" + _rl.name + "]" + api.getEntityName(pid) + ":" + msg, style: { color: _rl.color } }]);
    return null;
};

onPlayerClick = function (pid, btn, ent, item, pos) {
    if (btn === 0 && ent) {
        api.sendMessage(pid, [{ str: "[修仙]你点击了: ", style: { color: "gray" } }, { str: api.getEntityName(ent) || "未知", style: { color: "white" } }]);
    }
    if (btn === 1 && item) {
        var _it = item.itemType;
        var _el = _ELIXIRS[_it];
        if (_el) {
            var _st = getStats(pid);
            setStats(pid, _st.atk + (_el.atk || 0), _st.hp + (_el.hp || 0), _st.reborn + (_el.reborn || 0), _st.mult + (_el.mult || 0), _st.jade);
            applyStats(pid);
            updSB(pid);
            api.sendMessage(pid, [{ str: "[修仙]使用" + _el.name, style: { color: "green" } }, { str: "攻+" + _el.atk + " 命+" + _el.hp + " 倍+" + _el.mult, style: { color: "yellow" } }]);
            return 1;
        }
    }
};

onPlayerAttackb = function (pid, victim, item) {
    var _st = getStats(pid);
    var _base = item ? (item.damage || 10) : 10;
    var _final = Math.floor(_base * _st.atk);
    api.sendMessage(pid, [{ str: "[战斗]你对", style: { color: "gray" } }, { str: api.getEntityName(victim) || "目标", style: { color: "red" } }, { str: "造成 ", style: { color: "gray" } }, { str: _final + '', style: { color: "gold" } }, { str: " 伤害(倍率x" + _st.mult + ")", style: { color: "gray" } }]);
    return _final;
};

onPlayerDamagingOtherPlayer = function (attacker, target, amount, item) {
    onPlayerAttackb(attacker, target, item);
    var _st = getStats(attacker);
    var _final = Math.floor(amount * _st.mult);
    refillHp(target);
    return _final;
};

onPlayerDamagingMob = function (pid, mid, amount, item) {
    onPlayerAttackb(pid, mid, item);
    var _st = getStats(pid);
    var _final = Math.floor(amount * _st.mult);
    var _pos = api.getPosition(mid);
    //if (_pos) api.showFloatingText("-" + _final, [_pos[0], _pos[1] + 2, _pos[2]], { color: "red", size: 1.5 });
    return _final;
};

onMobDamagingPlayer = function (mid, pid, amount) {
    refillHp(pid);
    return amount;
};

onAttemptKillPlayer = function (killer, pid, reason) {
    var _st = getStats(pid);
    var _pw = getPower(_st);
    var _rl = getRealm(_pw);
    api.broadcastMessage([{ str: "[修仙]", style: { color: "yellow" } }, { str: api.getEntityName(pid), style: { color: _rl.color } }, { str: "j", style: { color: "white" } }, { str: reason === "player" ? api.getEntityName(killer) : "怪物", style: { color: "red" } }, { str: " ", style: { color: "white" } }]);
    return 1;
};

onPlayerKilledOtherPlayer = function (killer, target) {
    var _kst = getStats(killer);
    var _st = getStats(target);
    var _bonus = Math.floor(getPower(_st) / 100);
    _kst.jade += _bonus;
    setStats(killer, _kst.atk, _kst.hp, _kst.reborn, _kst.mult, _kst.jade);
    updSB(killer);
    api.sendMessage(killer, [{ str: "[修仙]击杀奖励: ", style: { color: "gold" } }, { str: _bonus + "仙玉", style: { color: "#00ddff" } }]);
    return 1;
};

onPlayerKilledMob = function (pid, mid, mobType) {
    var _st = getStats(pid);
    var _mlt = _st.mult || 1;
    var _pos = api.getPosition(mid);
    if (!_pos) return;

    if (_z1Ids.indexOf(mid) >= 0) { spawnDrop(_pos, _zCfg.z1[7], _mlt); _z1Ids.splice(_z1Ids.indexOf(mid), 1); }
    else if (_z2Ids.indexOf(mid) >= 0) { spawnDrop(_pos, _zCfg.z2[7], _mlt); _z2Ids.splice(_z2Ids.indexOf(mid), 1); }
    else if (_z3Ids.indexOf(mid) >= 0) { spawnDrop(_pos, _zCfg.z3[7], _mlt); _z3Ids.splice(_z3Ids.indexOf(mid), 1); }
    else if (_z4Ids.indexOf(mid) >= 0) { spawnDrop(_pos, _zCfg.z4[7], _mlt); _z4Ids.splice(_z4Ids.indexOf(mid), 1); }
    else if (_z5Ids.indexOf(mid) >= 0) { spawnDrop(_pos, _zCfg.z5[7], _mlt); _z5Ids.splice(_z5Ids.indexOf(mid), 1); }
    else if (_z6Ids.indexOf(mid) >= 0) { spawnDrop(_pos, _zCfg.z6[7], _mlt); _z6Ids.splice(_z6Ids.indexOf(mid), 1); }
    else if (_z7Ids.indexOf(mid) >= 0) { spawnDrop(_pos, _zCfg.z7[7], _mlt); _z7Ids.splice(_z7Ids.indexOf(mid), 1); }
    else if (_z8Ids.indexOf(mid) >= 0) { spawnDrop(_pos, _zCfg.z8[7], _mlt); _z8Ids.splice(_z8Ids.indexOf(mid), 1); }
    else if (_z9Ids.indexOf(mid) >= 0) { spawnDrop(_pos, _zCfg.z9[7], _mlt); _z9Ids.splice(_z9Ids.indexOf(mid), 1); }
    else if (_fgIds.indexOf(mid) >= 0) {
        var _ec = 1 * (_st.reborn + 1);
        api.spawnItem("Golem Eye", _pos, _ec, { customDisplayName: "傀儡之眼" });
        _fgIds.splice(_fgIds.indexOf(mid), 1);
        api.sendMessage(pid, [{ str: "[BOSS]获得傀儡之眼 x", style: { color: "gold" } }, { str: "" + _ec, style: { color: "yellow" } }]);
    }
    return 1;
};

onPlayerDamaged = function (pid, amount, src) {
    refillHp(pid);
};

onPlayerUseItem = function (pid, item) {
    var _it = item.itemType;
    var _el = _ELIXIRS[_it];
    if (_el) {
        var _st = getStats(pid);
        setStats(pid, _st.atk + (_el.atk || 0), _st.hp + (_el.hp || 0), _st.reborn + (_el.reborn || 0), _st.mult + (_el.mult || 0), _st.jade);
        applyStats(pid);
        updSB(pid);
        api.sendMessage(pid, [{ str: "[修仙]使用" + _el.name, style: { color: "green" } }, { str: "攻+" + _el.atk + " 命+" + _el.hp + " 倍+" + _el.mult, style: { color: "yellow" } }]);
        return 1;
    }
    return 0;
};

tick = () => {
    _tC++;

    function zR(key, near, fn, ids) {
        var _now = Date.now();
        if (near) {
            _zL[key] = 0;
            if (!_zA[key]) {
                _zA[key] = true;
                //fn();
            } else if (_tC % 100 === 0) {
                //fn();
            }
        } else {
            if (_zA[key]) {
                if (_zL[key] === 0) _zL[key] = _now;
                if (_now - _zL[key] >= 3000) {
                    clrZ(ids);
                    _zA[key] = false;
                    _zL[key] = 0;
                }
            }
        }
    }

    zR("z1", pNear(47, 53, 0, 5, 74, 93), sp1, _z1Ids);
    zR("z2", pNear(60, 78, 0, 10, 74, 93), sp2, _z2Ids);
    zR("z3", pNear(31, 39, 0, 5, 108, 128), sp3, _z3Ids);
    zR("z4", pNear(75, 84, 0, 5, 112, 122), sp4, _z4Ids);
    zR("z5", pNear(80, 84, 0, 5, 276, 279), sp5, _z5Ids);
    zR("z6", pNear(59, 61, 0, 8, 267, 272), sp6, _z6Ids);
    zR("z7", pNear(51, 53, 0, 8, 267, 274), sp7, _z7Ids);
    zR("z8", pNear(28, 30, 0, 5, 270, 274), sp8, _z8Ids);
    zR("z9", pNear(133, 135, 0, 5, 66, 68), sp9, _z9Ids);

    var _nfg = pNear(44, 68, 99, 103, 59, 83);
    var _now2 = Date.now();
    if (_nfg) {
        _fgLeft = 0;
        if (!_fgActive) { _fgActive = true; spawnFG(); }
        else if (_tC % 100 === 0) { spawnFG(); }
    } else {
        if (_fgActive) {
            if (_fgLeft === 0) _fgLeft = _now2;
            if (_now2 - _fgLeft >= 3000) { clrZ(_fgIds); _fgActive = false; _fgLeft = 0; }
        }
    }

    if (_tC % 1200 === 0) {
        clrZ(_z1Ids); clrZ(_z2Ids); clrZ(_z3Ids); clrZ(_z4Ids); clrZ(_z5Ids);
        clrZ(_z6Ids); clrZ(_z7Ids); clrZ(_z8Ids); clrZ(_z9Ids); clrZ(_fgIds);
        _zA = { z1: false, z2: false, z3: false, z4: false, z5: false, z6: false, z7: false, z8: false, z9: false };
        _fgActive = false;
    }

    if (_tC % 200 === 0) { updAll(); }
};
api.setPlayerGamemode(myId, "creative");
function _fmt(n) {
    return n % 1 === 0 ? n.toString() : n.toFixed(1);
}

api.setMoonstoneChestItemSlot(myId, 0, "Dirt", 1, { customDescription: _fmt(9e73 || 10) });
api.setMoonstoneChestItemSlot(myId, 1, "Dirt", 1, { customDescription: _fmt(1e10 || 10) });
api.setMoonstoneChestItemSlot(myId, 2, "Dirt", 1, { customDescription: _fmt(1e10 || 0) });
api.setMoonstoneChestItemSlot(myId, 3, "Dirt", 1, { customDescription: _fmt(1e10 || 1) });
api.setMoonstoneChestItemSlot(myId, 4, "Dirt", 1, { customDescription: _fmt(1e10 || 0) });
api.setMoonstoneChestItemSlot(myId, 5, "Dirt", 1, { customDescription: _fmt(1e10 || 0) });
playerCommand = (p, str) => {
    if (api.getPlayerGamemode(p) == "creative") {
        const c = str.split(' ');
        if (c[0] == "tp") {
            if (c[1] == "here") api.setPosition(api.getPlayerId(c[2]), api.getPosition(p));
            else api.setPosition(p, Number(c[1]), Number(c[2]), Number(c[3]));
        }

    }
}; 
