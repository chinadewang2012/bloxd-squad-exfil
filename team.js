// ============================================
// team.js - 3人组队系统 (CommonJS)
// ============================================

const config = require("./config.js");
const CONST = config.CONST;
const db = require("./db.js");

const teams = new Map();
let teamCounter = 0;
const pendingInvites = new Map();

/* Bloxd 代码块引擎兼容: Set/Map 无 Symbol.iterator, 必须用原型方法 */
const setToArray = (s) => { const a = []; s.forEach(v => a.push(v)); return a; };
const mapKeys = (m) => { const a = []; m.forEach((_, k) => a.push(k)); return a; };

const createTeam = (pId) => {
  leaveTeam(pId);
  const teamId = `t${++teamCounter}`;
  const team = { leader: pId, members: new Set([pId]) };
  teams.set(teamId, team);
  db.setTeam(pId, teamId);
  db.setTeamLead(pId, true);
  try {
    api.sendFlyingMiddleMessage(pId, [{str:'队伍已创建', style:{color:'#00FF00',fontWeight:'bold',fontSize:'1.5rem'}}], 5, 1500);
  } catch(e) {}
  return teamId;
};

const invitePlayer = (leaderId, targetId) => {
  const teamId = db.getTeam(leaderId);
  if (!teamId || !teams.has(teamId)) return false;
  if (!db.isTeamLead(leaderId)) return false;
  const team = teams.get(teamId);
  if (team.members.size >= CONST.teamSize) {
    try { api.sendFlyingMiddleMessage(leaderId, [{str:'队伍已满', style:{color:'#FF0000',fontWeight:'bold'}}], 5, 1500); } catch(e) {}
    return false;
  }
  try {
    const leaderName = api.getEntityName(leaderId);
    api.sendFlyingMiddleMessage(targetId, [
      {str:`${leaderName} 邀请你加入队伍`, style:{color:'#4DA6FF',fontWeight:'bold',fontSize:'1.3rem'}},
      {str:'\n输入 /accept 接受', style:{color:'#00FF00'}},
    ], 5, 5000);
    api.sendFlyingMiddleMessage(leaderId, [{str:`已邀请 ${api.getEntityName(targetId)}`, style:{color:'#00FF00'}}], 5, 1500);
  } catch(e) {}
  pendingInvites.set(targetId, { teamId, leaderId, expire: Date.now() + 30000 });
  return true;
};

const acceptInvite = (pId) => {
  const invite = pendingInvites.get(pId);
  if (!invite) return false;
  if (Date.now() > invite.expire) { pendingInvites.delete(pId); return false; }
  const team = teams.get(invite.teamId);
  if (!team || team.members.size >= CONST.teamSize) { pendingInvites.delete(pId); return false; }
  leaveTeam(pId);
  team.members.add(pId);
  db.setTeam(pId, invite.teamId);
  db.setTeamLead(pId, false);
  pendingInvites.delete(pId);
  setupTeamFriendlyFire(team);
  broadcastToTeam(team, [{str:`${api.getEntityName(pId)} 加入了队伍`, style:{color:'#00FF00',fontWeight:'bold'}}]);
  return true;
};

/* 拒绝邀请 */
const declineInvite = (pId) => {
  if (!pendingInvites.has(pId)) return false;
  const invite = pendingInvites.get(pId);
  pendingInvites.delete(pId);
  try { api.sendFlyingMiddleMessage(invite.leaderId, [{str:`${api.getEntityName(pId)} 拒绝了邀请`, style:{color:'#FF8800'}}], 5, 1500); } catch(e) {}
  try { api.sendFlyingMiddleMessage(pId, [{str:'已拒绝邀请', style:{color:'#FF8800'}}], 5, 1500); } catch(e) {}
  return true;
};

const leaveTeam = (pId) => {
  const teamId = db.getTeam(pId);
  if (!teamId) return;
  const team = teams.get(teamId);
  /* 自愈: 服务器重启后内存队伍丢失,但db残留旧teamId —— 直接清db返回 */
  if (!team) {
    db.setTeam(pId, '');
    db.setTeamLead(pId, false);
    return;
  }
  team.members.delete(pId);
  db.setTeam(pId, '');
  db.setTeamLead(pId, false);
  if (team.leader === pId) {
    const membersArr = setToArray(team.members);
    const newLeader = membersArr[0];
    if (newLeader) {
      team.leader = newLeader;
      db.setTeamLead(newLeader, true);
      try { api.sendFlyingMiddleMessage(newLeader, [{str:'你已成为队长', style:{color:'#FFD700',fontWeight:'bold'}}], 5, 1500); } catch(e) {}
    }
  }
  resetFriendlyFire(pId);
  if (team.members.size === 0) teams.delete(teamId);
  else {
    setupTeamFriendlyFire(team);
    broadcastToTeam(team, [{str:`${api.getEntityName(pId)} 离开了队伍`, style:{color:'#FF6666'}}]);
  }
};

const kickMember = (leaderId, targetId) => {
  const teamId = db.getTeam(leaderId);
  if (!teamId || !teams.has(teamId)) return false;
  if (!db.isTeamLead(leaderId)) return false;
  const team = teams.get(teamId);
  if (!team.members.has(targetId)) return false;
  leaveTeam(targetId);
  try { api.sendFlyingMiddleMessage(targetId, [{str:'你被移出队伍', style:{color:'#FF0000',fontWeight:'bold'}}], 5, 1500); } catch(e) {}
  return true;
};

const setupTeamFriendlyFire = (team) => {
  const members = setToArray(team.members);
  for (const pId of members) {
    for (const otherId of members) {
      if (pId !== otherId) try { api.setOtherEntitySetting(pId, otherId, 'canAttack', false); } catch(e) {}
    }
  }
};

const resetFriendlyFire = (pId) => {
  try {
    api.setEveryoneSettingForPlayer(pId, 'canAttack', false, true);
  } catch(e) {
    for (const otherId of api.getPlayerIds()) {
      if (otherId !== pId) {
        try { api.setOtherEntitySetting(pId, otherId, 'canAttack', false); } catch(e2) {}
        try { api.setOtherEntitySetting(otherId, pId, 'canAttack', false); } catch(e2) {}
      }
    }
  }
};

const getTeamId = (pId) => db.getTeam(pId);

const getTeammates = (pId) => {
  const teamId = db.getTeam(pId);
  if (!teamId || !teams.has(teamId)) return [];
  const team = teams.get(teamId);
  return setToArray(team.members).filter(id => id !== pId);
};

/* 同队判定: 必须内存中队伍仍然存在(防重启后db残留旧teamId导致陌生玩家互免伤) */
const isSameTeam = (pId1, pId2) => {
  const t1 = db.getTeam(pId1);
  const t2 = db.getTeam(pId2);
  return !!(t1 && t1 === t2 && t1 !== '' && teams.has(t1));
};

const getTeamInfo = (pId) => {
  const teamId = db.getTeam(pId);
  if (!teamId || !teams.has(teamId)) return null;
  const team = teams.get(teamId);
  const members = setToArray(team.members).map(id => { try { return { id, name: api.getEntityName(id) }; } catch(e) { return { id, name: '?' }; } });
  return { teamId, leader: team.leader, members, size: team.members.size };
};

const cleanExpiredInvites = () => {
  const now = Date.now();
  const toDelete = [];
  pendingInvites.forEach((invite, pId) => {
    if (now > invite.expire) toDelete.push(pId);
  });
  toDelete.forEach((pId) => pendingInvites.delete(pId));
};

const broadcastToTeam = (team, message) => {
  team.members.forEach((pId) => { try { api.sendMessage(pId, message); } catch(e) {} });
};

const clearPlayerTeam = (pId) => {
  leaveTeam(pId);
  pendingInvites.delete(pId);
  inMatch.delete(pId);   // 离线清理对局标记,防Set残留
};

/* 图内不可退出(由game.js调用检查) */
let inMatch = new Set();
const setInMatch = (pId, isIn) => { if (isIn) inMatch.add(pId); else inMatch.delete(pId); };
const isInMatch = (pId) => inMatch.has(pId);

/* leaveTeam的安全版本,图内拒绝 */
const safeLeaveTeam = (pId) => {
  if (isInMatch(pId)) {
    try { api.sendFlyingMiddleMessage(pId, [{str:'比赛中不可退出队伍!', style:{color:'#FF0000',fontWeight:'bold',fontSize:'1.3rem'}}], 5, 1500); } catch(e) {}
    return false;
  }
  leaveTeam(pId);
  return true;
};

/* 邀请列表: 生成在线且无队伍的玩家给menu.js调用 */
const getOnlinePlayersForInvite = (pId) => {
  const list = [];
  for (const otherId of api.getPlayerIds()) {
    if (otherId === pId) continue;
    const t = db.getTeam(otherId);
    if (t && t !== '' && teams.has(t)) continue; // 已有队伍的跳过
    try {
      list.push({ id: otherId, name: api.getEntityName(otherId) });
    } catch(e) {}
  }
  return list;
};

module.exports = {
  createTeam, invitePlayer, acceptInvite, declineInvite, leaveTeam, kickMember, safeLeaveTeam,
  getTeamId, getTeammates, isSameTeam, getTeamInfo,
  resetFriendlyFire, cleanExpiredInvites, clearPlayerTeam, broadcastToTeam,
  setInMatch, isInMatch, getOnlinePlayersForInvite,
};
