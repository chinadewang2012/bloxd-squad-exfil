var pd={},pl=[],fz={},tm={},pt={},dd={},ds={},mj_cd={},csd=[0,64,0],wv={},jr={},dk={};
var keyimojin=["White Wool","Orange Wool","Magenta Wool","Light Blue Wool","Yellow Wool","Lime Wool","Pink Wool"];
var itemWeights={"Stone":0.8,"Coal Ore":1.5,"Iron Ore":1.5,"Gold Ore":2,"Diamond Ore":1.5,"Emerald Ore":1.5,"Moonstone Ore":1.5,"Block of Coal":4.5,"Block of Iron":4.5,"Block of Gold":5.4,"Block of Diamond":1.8,"Block of Emerald":1.8,"Block of Moonstone":2.7,"Bow":1,"Arrow":0.1,"Moonstone":0.3,"Moonstone Explosive":1,"Gold Trophy":5,"Chest":1,"Iron Chest":1,"Beacon":3,"Loot Chest":2,"Lucky Block":1,"Ultra Lucky Block":1,"Obsidian":2,"Spectral Log":0.5,"Spectral Wood Planks":0.3,"Spectral Leaves":0.1,"Draugr Banner":0.5,"Gold Antlers":1,"Bone Antlers":1};

// 通用物品池 - 所有摸金池共享的物品列表
var commonItems=[
    {name:"Stone",n:"石头",d:1,min:1,max:16,v:10},
    {name:"Coal Ore",n:"煤矿石",d:1,min:1,max:8,v:20},
    {name:"Iron Ore",n:"铁矿石",d:2,min:1,max:8,v:40},
    {name:"Gold Ore",n:"金矿石",d:3,min:1,max:4,v:80},
    {name:"Diamond Ore",n:"钻石矿石",d:4,min:1,max:4,v:150},
    {name:"Emerald Ore",n:"绿宝石矿石",d:4,min:1,max:4,v:180},
    {name:"Moonstone Ore",n:"月长石矿石",d:4,min:1,max:4,v:200},
    {name:"Block of Coal",n:"煤炭块",d:2,min:1,max:2,v:60},
    {name:"Block of Iron",n:"铁块",d:3,min:1,max:2,v:120},
    {name:"Block of Gold",n:"金块",d:4,min:1,max:2,v:240},
    {name:"Block of Diamond",n:"钻石块",d:5,min:1,max:1,v:450},
    {name:"Block of Emerald",n:"绿宝石块",d:5,min:1,max:1,v:540},
    {name:"Block of Moonstone",n:"月长石块",d:5,min:1,max:1,v:600},
    {name:"Bow",n:"战术弓",d:3,min:1,max:1,v:80},
    {name:"Arrow",n:"战术箭矢",d:2,min:10,max:30,v:2},
    {name:"Moonstone",n:"月长石",d:2,min:1,max:8,v:30},
    {name:"Moonstone Explosive",n:"月长石炸药",d:3,min:1,max:4,v:50},
    {name:"Gold Trophy",n:"黄金奖杯",d:5,min:1,max:1,v:1000},
    {name:"Chest",n:"箱子",d:2,min:1,max:2,v:25},
    {name:"Iron Chest",n:"铁箱子",d:3,min:1,max:2,v:50},
    {name:"Beacon",n:"信标",d:5,min:1,max:1,v:800},
    {name:"Loot Chest",n:"战利品箱",d:4,min:1,max:1,v:100},
    {name:"Lucky Block",n:"幸运方块",d:4,min:1,max:1,v:150},
    {name:"Ultra Lucky Block",n:"超级幸运方块",d:5,min:1,max:1,v:250},
    {name:"Obsidian",n:"黑曜石",d:3,min:1,max:8,v:40},
    {name:"Spectral Log",n:"幽灵原木",d:3,min:1,max:4,v:60},
    {name:"Spectral Wood Planks",n:"幽灵木板",d:2,min:1,max:8,v:30},
    {name:"Spectral Leaves",n:"幽灵树叶",d:1,min:1,max:8,v:15},
    {name:"Draugr Banner",n:"亡灵旗帜",d:4,min:1,max:1,v:200},
    {name:"Gold Antlers",n:"黄金鹿角",d:4,min:1,max:1,v:300},
    {name:"Bone Antlers",n:"骨制鹿角",d:3,min:1,max:1,v:150}
];

// 摸金池爆率配置 - 与通用物品池编号一一对应
var PutongChi=[0.8,0.6,0.4,0.2,0.1,0.1,0.1,0.3,0.2,0.1,0.05,0.05,0.05,0.2,0.5,0.4,0.3,0.05,0.4,0.2,0.05,0.1,0.08,0.05,0.3,0.2,0.3,0.4,0.1,0.15,0.2];
var JingliangChi=[0.6,0.5,0.6,0.4,0.2,0.2,0.2,0.5,0.6,0.4,0.1,0.1,0.1,0.4,0.6,0.6,0.5,0.1,0.5,0.4,0.1,0.2,0.15,0.1,0.4,0.3,0.4,0.3,0.2,0.2,0.3];
var XiyouChi=[0.4,0.4,0.6,0.6,0.4,0.4,0.4,0.6,0.6,0.6,0.2,0.2,0.2,0.5,0.7,0.7,0.6,0.15,0.6,0.5,0.15,0.3,0.2,0.15,0.5,0.4,0.5,0.2,0.3,0.25,0.4];
var ShishiChi=[0.3,0.3,0.5,0.7,0.6,0.6,0.6,0.7,0.7,0.7,0.3,0.3,0.3,0.6,0.8,0.8,0.7,0.2,0.7,0.6,0.2,0.4,0.25,0.2,0.6,0.5,0.6,0.15,0.4,0.3,0.5];
var ChuanshuoChi=[0.2,0.2,0.4,0.8,0.7,0.7,0.7,0.8,0.8,0.8,0.4,0.4,0.4,0.7,0.9,0.9,0.8,0.25,0.8,0.7,0.25,0.5,0.3,0.25,0.7,0.6,0.7,0.1,0.5,0.35,0.6];
var ShenhuaChi=[0.1,0.1,0.3,0.9,0.8,0.8,0.8,0.9,0.9,0.9,0.5,0.5,0.5,0.8,0.95,0.95,0.9,0.3,0.9,0.8,0.3,0.6,0.35,0.3,0.8,0.7,0.8,0.08,0.6,0.4,0.7];
var ZhizunChi=[0.05,0.05,0.2,1.0,0.9,0.9,0.9,1.0,1.0,1.0,0.6,0.6,0.6,0.9,1.0,1.0,1.0,0.35,1.0,0.9,0.35,0.7,0.4,0.35,0.9,0.8,0.9,0.05,0.7,0.45,0.8];

var mojinchi={"White Wool":PutongChi,"Orange Wool":JingliangChi,"Magenta Wool":XiyouChi,"Light Blue Wool":ShishiChi,"Yellow Wool":ChuanshuoChi,"Lime Wool":ShenhuaChi,"Pink Wool":ZhizunChi};
var mojinchi_mingcheng={"White Wool":"普通摸金池","Orange Wool":"精良摸金池","Magenta Wool":"稀有摸金池","Light Blue Wool":"史诗摸金池","Yellow Wool":"传说摸金池","Lime Wool":"神话摸金池","Pink Wool":"至尊摸金池"};

function getKD(p){if(!pd[p])return 1;var kills=pd[p].k||1,deaths=pd[p].d||1;return Math.max(0.5,kills/deaths);}
function calcWeight(p){var weight=0,inventory=api.getInventory(p);if(!inventory)return 0;for(var i=0;i<inventory.length;i++){var item=inventory[i];if(!item)continue;var itemName=api.getItemName(p,item.name,i)||item.name;var itemWeight=itemWeights[itemName]||itemWeights[item.name]||0.5;weight+=itemWeight*(item.count||1);}fz[p]=weight;return weight;}
function getWeight(p){return fz[p]!==undefined?fz[p]:calcWeight(p);}
function checkOverweight(p,max){return getWeight(p)>(max||50);}
function getItemValueFromDesc(d){if(!d||typeof d!=="string")return 0;var num=parseFloat(d);return isNaN(num)?0:num;}
function getItemValueFromPool(itemName){for(var i=0;i<commonItems.length;i++){if(commonItems[i].name===itemName)return commonItems[i].v||0;}return 0;}
function calcTotalValue(p){var totalValue=0,inventory=api.getInventory(p);if(!inventory)return 0;for(var i=0;i<inventory.length;i++){var item=inventory[i];if(!item)continue;var desc=api.getItemDescription(p,item.name,i);var value=getItemValueFromDesc(desc);if(value===0)value=getItemValueFromPool(item.name);totalValue+=value*(item.count||1);}return totalValue;}
function getTotalValue(p){return wv[p]!==undefined?wv[p]:(wv[p]=calcTotalValue(p));}
function canMojin(p,b){if(keyimojin.indexOf(b)<0)return false;if(mj_cd[p]&&Date.now()<mj_cd[p]){api.sendMessage(p,"摸金冷却中",{color:"red"});return false;}return true;}
function doMojin(p,b,x,y,z){if(!canMojin(p,b))return{success:false,reason:"无法摸金"};var ratePool=mojinchi[b];if(!ratePool)return{success:false,reason:"摸金池未找到"};var poolName=mojinchi_mingcheng[b],kd=getKD(p),items=[];for(var i=0;i<ratePool.length;i++){var baseRate=ratePool[i];if(baseRate/kd>1||Math.random()<baseRate/kd){var item=commonItems[i];if(item){var count=Math.floor(Math.random()*(item.max-item.min+1))+item.min;var value=item.v||0,displayName=item.dn||item.n||item.name;items.push({name:item.name,displayName:displayName,count:count,value:value});}}}if(items.length>9)items=items.slice(0,9);for(var j=0;j<items.length;j++)api.insertItem(x,y,z,items[j].name,items[j].count);mj_cd[p]=Date.now()+5000;var itemNames=[];for(var k=0;k<items.length;k++)itemNames.push(items[k].displayName+"x"+items[k].count);api.sendMessage(p,"【"+poolName+"】摸金成功！获得: "+itemNames.join(", "),{color:"gold"});return{success:true,items:items,pool:poolName};}
function createTeam(ti,tn,l){if(!tm[ti]){tm[ti]={name:tn,leader:l,members:[l]};pt[l]=ti;api.sendMessage(l,"队伍 "+tn+" 创建成功",{color:"green"});return true;}return false;}
function joinTeam(p,ti){if(tm[ti]){tm[ti].members.push(p);pt[p]=ti;api.sendMessage(p,"加入队伍 "+tm[ti].name,{color:"green"});return true;}return false;}
function leaveTeam(p){var ti=pt[p];if(ti&&tm[ti]){var members=tm[ti].members,index=members.indexOf(p);if(index>=0)members.splice(index,1);delete pt[p];api.sendMessage(p,"已离开队伍",{color:"yellow"});return true;}return false;}
function teamChat(p,msg){var ti=pt[p];if(ti&&tm[ti]){var members=tm[ti].members;for(var i=0;i<members.length;i++)api.sendMessage(members[i],"[队伍] "+p+": "+msg,{color:"aqua"});return true;}return false;}
function playerDown(p,k){dd[p]=true;ds[p]=Date.now();dk[p]=k;api.sendMessage(p,"你已被击倒！等待救援...",{color:"red"});api.broadcastMessage(p+" 被击倒！",{color:"dark_red"});}
function rescuePlayer(r,t){if(dd[t]){delete dd[t];delete ds[t];delete dk[t];api.sendMessage(t,"你被 "+r+" 救起！",{color:"green"});api.sendMessage(r,"成功救起 "+t,{color:"green"});api.setHealth(t,10);return true;}return false;}
function checkDownStatus(p){if(dd[p]){if(Date.now()-ds[p]>60000){delete dd[p];delete ds[p];delete dk[p];api.killLifeform(p);return false;}return true;}return false;}
function initPlayer(p){if(!pd[p]){pd[p]={k:0,d:0,ms:0,czjd:0,czzt:false};}}
function enterGame(p,time){if(!pd[p]){pd[p]={k:1,d:1,ms:0,czjd:0,czzt:false};}jr[p]=true;api.sendMessage(p,"游戏开始！倒计时："+time+"秒",{color:"green"});}
function cheli(p,progress){if(!pd[p])return;pd[p].czjd=progress;if(progress>=100){pd[p].czzt=true;api.sendMessage(p,"撤离成功！",{color:"gold"});api.setPosition(p,csd[0],csd[1],csd[2]);}}
function handleChat(p,msg){var badWords=["fuck","shit","damn","草","妈","傻","sb","nc"];for(var i=0;i<badWords.length;i++){if(msg.indexOf(badWords[i])>=0){api.sendMessage(p,"消息包含不当内容，已过滤",{color:"red"});return false;}}return true;}

onPlayerJoin = (playerId, fromGameReset) => {initPlayer(playerId);api.sendMessage(playerId,"欢迎加入游戏！输入/join开始游戏",{color:"green"});api.sendMessage(playerId,"本版本特色：7个摸金池+物品重量系统",{color:"gold"});if(pl.indexOf(playerId)<0)pl.push(playerId);api.giveItem(playerId,"Moonstone",1);};
onPlayerLeave = (playerId, serverIsShuttingDown) => {leaveTeam(playerId);var index=pl.indexOf(playerId);if(index>=0)pl.splice(index,1);};
onPlayerAttemptOpenChest = (playerId, x, y, z, isMoonstoneChest, isIronChest) => {var blockAbove=api.getBlock(x,y+1,z);if(!blockAbove)return;if(keyimojin.indexOf(blockAbove)>=0){var result=doMojin(playerId,blockAbove,x,y,z);if(!result.success)api.sendMessage(playerId,"摸金失败："+result.reason,{color:"red"});return "preventOpen";}};
onPlayerChat = (playerId, chatMessage, channelName) => {if(chatMessage==="/join"){enterGame(playerId,300);return false;}if(chatMessage==="/weight"){api.sendMessage(playerId,"当前背包重量："+getWeight(playerId).toFixed(2)+" / 50",{color:"aqua"});return false;}if(chatMessage==="/mojin"){api.sendMessage(playerId,"=== 摸金池列表 ===",{color:"gold"});api.sendMessage(playerId,"白色羊毛=普通摸金池",{color:"white"});api.sendMessage(playerId,"橙色羊毛=精良摸金池",{color:"orange"});api.sendMessage(playerId,"品红色羊毛=稀有摸金池",{color:"magenta"});api.sendMessage(playerId,"淡蓝色羊毛=史诗摸金池",{color:"light_blue"});api.sendMessage(playerId,"黄色羊毛=传说摸金池",{color:"yellow"});api.sendMessage(playerId,"黄绿色羊毛=神话摸金池",{color:"lime"});api.sendMessage(playerId,"粉红色羊毛=至尊摸金池",{color:"pink"});return false;}if(chatMessage.indexOf("/team ")===0){var teamCommand=chatMessage.substring(6);if(teamCommand.indexOf("create ")===0){var teamName=teamCommand.substring(7);createTeam(playerId+"_team",teamName,playerId);}else if(teamCommand.indexOf("leave")===0){leaveTeam(playerId);}return false;}if(chatMessage.indexOf("/rescue ")===0){var target=chatMessage.substring(8);rescuePlayer(playerId,target);return false;}if(chatMessage.indexOf("/t ")===0){teamChat(playerId,chatMessage.substring(3));return false;}if(!handleChat(playerId,chatMessage))return false;return true;};
onPlayerClick = (playerId, wasAltClick, x, y, z, block, targetEId) => {if(!wasAltClick)calcWeight(playerId);};
onPlayerDamagingOtherPlayer = (attackingPlayer, damagedPlayer, damageDealt, withItem, bodyPartHit, damagerDbId) => {if(checkOverweight(damagedPlayer,50))return damageDealt*1.2;};
tick = (ms) => {};
doPeriodicSave = () => {};