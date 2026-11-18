# 代码审查：不合法 API / 违禁方块 / 虚假方块 全清单

审查时间：2026-11-14｜方式：**只读静态审查**（未修改任何业务代码；仅新增本报告）｜技能：`bloxd-lookup`（本地官方数据快照）+ `编程专家.Skill`
审查范围：工作区全库（根目录 13 个生产模块 + `_smoke_*.js` 测试 + `其它代码/` 工具与文档 + `ai/` 旧项目归档 + `output/` 43 个蓝图）

> 与已有 `非法API与物品核查报告.md` 的关系：那份只查 root 13 模块，结论「API 0 非法」；本报告把范围扩到**全库**，并补齐「违禁方块」「蓝图方块 ID」「旧归档非法 API/回调」三块，结论更完整。两份报告的公共部分一致。

---

## 0. 结论速览

| 类别 | 全库规模 | 确定问题 | 其中生产 13 模块 |
|---|---|---|---|
| 不合法 API（`api.*` 函数） | 活跃调用 1341 处 / 85 个不同名 | **11 个非法引擎 API / 26 处**（全在 `ai/` 旧归档）+ 注释中 2 个 | **0** |
| 不合法回调注册 | 官方 84 个回调；生产注册 27 个 | **7 个非官方回调名**（全在 `ai/` 旧归档，死代码） | **0** |
| 违禁方块（禁止产出 / 引擎内部） | 2 张禁止清单 63+53 条；官方内部占位 7 个 ID | **禁止清单里共 51 条假名条目（去重 28 个名字）**；文档 1 处把内部占位方块当普通方块；1 个工具会批量生成错误 ID | 2 处禁止清单，51 条假名条目（去重 28 名） |
| 虚假方块（官方名单查无此名） | 去重核查名字 440+ | **确定 36 个名字**（黑名单 28 + 测试夹具 7 + 文档 1）+ 疑似 5（`Outfit:`）+ 归档候选 365 | 确定 28（黑名单）+ 疑似 5 |
| 蓝图产物方块 ID | 43 个 `.bloxdschem` / 48 个不同 ID / 5,439,488 格 | **0 未定义 ID、0 内部占位 ID** | — |

**一句话**：当前线上主代码（13 个模块 + 43 个蓝图）在 API / 方块 / 方块 ID 三个层面**全部干净**；所有确定问题集中在 ① 两张「禁止掉落」黑名单里的假名字 ② 冒烟测试与文档的假物品名 ③ `ai/` 旧归档与 1 个蓝图转换工具的历史遗留。

---

## 1. 判定口径（先定判据，再下结论）

### 1.1 官方数据基线（`bloxd-lookup` 本地快照，已确认是 `Bloxdy/code-api@c812d95` 最新）

| 数据源 | 数量 | 用途 |
|---|---|---|
| `official/API_REFERENCE.md` | **248** 个函数 | 判定 `api.xxx()` 是否合法 |
| `official/CALLBACKS.md` | **84** 个回调 | 判定顶层回调注册是否合法（注意 `tick` / `playerCommand` 无 `on` 前缀） |
| `official/CLIENT_OPTIONS.md` / `MOB_SETTINGS.md` / `ENTITY_SETTINGS.md` | 128 / 68 / 18 个键 | 判定设置类 API 参数 |
| `official/ITEM_NAMES.txt` | 1,439 | 合法物品名 |
| `official/BLOCK_NAMES.txt` | 1,446 个 ROOT 方块名 | 合法方块名（官方要求「按 ROOT 名原样使用」） |
| `data/block_ids.json` → `idToName` | 0–4217 共 **4,211** 条 | 合法方块 ID ↔ 名字 |
| 合并去重 | **4,935** 个合法名 | 判定方块/物品名是否为虚假名 |

### 1.2 三类问题的定义（避免把猜测当结论）

- **不合法 API**：`api.<name>(...)` 中 `name` 不在官方 248 函数表；或顶层注册的回调名不在官方 84 回调表；或传给设置类 API 的键不在官方设置表。
- **违禁方块**：bloxd 官方**没有**发布「禁放方块」清单，故本报告采用两个**可客观证伪**的口径，不臆造 Bedrock/TNT 之类：
  1. **项目自己声明的禁止清单**——`loot.js:278-298`（禁止从箱子摸出）与 `mobs.js:70-82`（禁止小怪掉落）；
  2. **客户端 ID 表中明确为引擎内部/占位的方块**——`Unloaded`、`*_placeholder`、`UNUSED BLOCK TYPE`、`Placeholder *`，它们不是可用建筑方块。
- **虚假方块/物品名**：代码中当作方块名或物品名使用，但在 4,935 个官方名字（含 ROOT 名、合法变体）中查不到的字符串。

### 1.3 范围与排除

- **In**：全库 `.js` / `.py` / `.md` 数据表 / `.bloxdschem`；区分「活跃代码」与「注释/字符串」（先剥离 JS 注释再扫描）。
- **不计入非法 API**：`_smoke_*.js` 里自建 mock 对象的属性/方法（`api._mesh`、`api._join` 等 18 个），它们不是引擎 API。
- **待确认、不判死刑**：世界设置里可能存在的**自定义物品名**（如 `Outfit: *`）、`ai/` 旧项目的自造物品名——静态数据无法证明其不存在，统一标「疑似/候选」。

### 1.4 项目自带名单已过时（会影响历史结论）

| 文件 | 行数 | 备注 |
|---|---|---|
| `新建文件夹/api代码.txt` | 1006 | 旧版方块名 |
| `ai/bloxd_rpg_system/bloxd代码/API文档/BLOCK_NAMES.txt` | 1116 | 旧版 |
| `其它代码/BLOCK_NAMES.txt` | 1179 | 旧版（历史报告用的就是它） |
| **skill 官方快照** | **1446** | 本轮采用 |

历史报告的「5,413 / 4,961 个合法名」是按旧版列表合并的；本轮统一以 **4,935 个（最新三源去重）** 为准。

---

## 2. 不合法 API —— 完整清单

### 2.1 ✅ 生产 13 模块：0 非法（实测证据）

- `api.*` **453 处调用 / 56 个不同函数**，56 个全部命中官方 248 函数表。
- `index.js:159-367` 顶层 **27 个回调注册**，全部命中官方 84 回调表；另 10 个顶层赋值（`Money`/`CheckMoney`/`Mojin`/`Data`/`PlayerData`/`Checkin`/`Quest`/`PullLever`/`CustomWeapon`/`Fittings`）是项目自己的全局门面，不是回调，不违规。
- 设置键：`setClientOption` 10 个、`setMobSetting` 8 个、`setOtherEntitySetting`/`setTargetedPlayerSettingForEveryone` 7 个，全部在 128/68/18 官方键表中；枚举 `gunStats`、`Box`、`timedClick`/`rhythmClick`、`Tier 1..5`、`X-Ray Vision`/`Slowness` 均合法。
- **56 个合法函数全名单**：`addCustomKillfeedMessage, addQTE, applyEffect, attemptCreateMeshEntity, attemptSpawnMob, broadcastMessage, clearDirectionArrow, clearInventory, configureShopCategory, createItemDrop, createShopItem, createShopItemForPlayer, deleteMeshEntity, deleteQTE, getBlock, getBlockTypesPlayerStandingOn, getEntityName, getHealth, getHeldItem, getItemSlot, getLobbyDbValue, getPlayerDbId, getPlayerDbValue, getPlayerId, getPlayerIdFromDbId, getPlayerIds, getPosition, getSelectedInventorySlotI, giveItem, hasItem, isInsideRect, openShop, progressBarUpdate, removeItemName, resetShopItemForPlayer, sendFlyingMiddleMessage, sendHitmarker, sendMessage, setCameraDirection, setClientOption, setDefaultMobSetting, setDirectionArrow, setEveryoneSettingForPlayer, setHealth, setItemSlot, setItemStat, setLobbyDbValue, setMaxPlayers, setMobSetting, setOtherEntitySetting, setPlayerDbValue, setPosition, setStandardChestItemSlot, setTargetedPlayerSettingForEveryone, shakePlayerCamera, updateShopItemForPlayer`

### 2.2 🔴 全库活跃代码中的 11 个真·非法引擎 API（26 处，全部位于 `ai/` 旧归档）

| # | 非法 API | 出现 | 位置（文件:行） | 官方替代（已确认存在） |
|---|---|---|---|---|
| 1 | `api.getInventory` | 5 | `ai/bloxd_rpg_system/1/world_code.js:57`；`ai/bloxd_rpg_system/bloxd代码/测试版本D_物品重量与摸金池/世界代码.js:53,58`；`…/外部函数模块.js:130,199` | `getItemSlot` / `getInventoryItemAmount` / `getItemAmount` / `getHeldItem` |
| 2 | `api.getItemDescription` | 3 | `…/世界代码.js:58`；`…/外部函数模块.js:207,237` | 官方无此函数；读 `getItemSlot().attributes.customDisplayName` |
| 3 | `api.getItemName` | 2 | `…/世界代码.js:53`；`…/外部函数模块.js:138` | `getItemSlot().name` / `getHeldItem` |
| 4 | `api.getMaxHealth` | 2 | `ai/bloxd_rpg_system/bloxd代码/bloxd smp/盔甲合成与附魔系统.js:591,734` | 官方无直接对应；改读 `setClientOption(...,'maxHealth',…)` 时由项目自行记账 |
| 5 | `api.getPlayerPosition` | 1 | `…/盔甲合成与附魔系统.js:794` | `getPosition` |
| 6 | `api.insertItem` | 2 | `…/世界代码.js:61`；`…/外部函数模块.js:290` | `giveItem` / `setItemSlot` |
| 7 | `api.setMaxHealth` | 1 | `…/盔甲合成与附魔系统.js:593` | `setClientOption(pId,'maxHealth',v)` |
| 8 | `api.setPlayerHealth` | 1 | `…/盔甲合成与附魔系统.js:739` | `setHealth`（或 `applyHealthChange`） |
| 9 | `api.showFloatingText` | 2 | `ai/bloxd_rpg_system/修仙系统_修复版.js:287`；`ai/bloxd_rpg_system/1/world_code.js:153` | `sendFlyingMiddleMessage` / `sendMessage` |
| 10 | `api.spawnItem` | 6 | `ai/bloxd_rpg_system/md2_minified.js:259`；`修仙系统_修复版.js:218`；`修仙系统_大佬修复版_备份.js:218,332`；`修仙系统_纯代码.js:218,332` | `createItemDrop` / `giveItem` |
| 11 | `api.spawnParticle` | 1 | `…/盔甲合成与附魔系统.js:606` | `playParticleEffect` |

> 上述 11 个均为 `ai/` 中**已下线的旧项目**，不进当前世界的 13 模块，风险为「若有人复制这段旧代码到世界代码里会直接报错/静默失效」，不是当前线上故障。

### 2.3 🟡 注释中的 2 个非法 API（不执行，仅记录）

| 名字 | 位置 | 说明 |
|---|---|---|
| `api.getNearbyMobIds` | `其它代码/sandbag-codeblock.js:46` | 整段被 `//` 注释；官方替代 `getMobIds` + 坐标过滤 |
| `api.killEntity` | `其它代码/sandbag-codeblock.js:47` | 同上；官方替代 `deleteEntity` / `applyHealthChange` |

### 2.4 🟡 非官方回调注册 7 个（`ai/` 旧归档，注册了引擎不认识的名字 → 永不触发的死代码）

| 回调名 | 位置 | 官方正确名（若需要该功能） |
|---|---|---|
| `onInvUp` | `ai/bloxd_rpg_system/md2_minified.js:409` | `onInventoryUpdated` |
| `onCmd` | `ai/bloxd_rpg_system/md2_minified.js:418` | `playerCommand` |
| `onChat` | `ai/bloxd_rpg_system/md2_minified.js:493` | `onPlayerChat` |
| `onPlayerEquip` | `…/盔甲合成与附魔系统.js:669` | 官方无换装回调，可用 `onInventoryUpdated` / `onPlayerSelectInventorySlot` |
| `onPlayerDestroy` | `…/盔甲合成与附魔系统.js:758` | `onWorldAttemptChangeBlock` / `onPlayerChangeBlock` |
| `onPlayerPlace` | `…/盔甲合成与附魔系统.js:767` | 同上 |
| `onPlayerMove` | `…/盔甲合成与附魔系统.js:776` | 官方无逐帧移动回调，需用 `tick` + `getPosition` |

### 2.5 明确排除的「伪阳性」

- 18 个 mock 自建成员：17 个属性 `_P, _blocks, _chests, _dbReads, _drops, _gunStats, _lobby, _mapReads, _mesh, _mobDefaults, _mobSettings, _mobs, _qte, _qteSeq, _shopItems, _shopResets, _standing` + 1 个方法 `api._join`（23 处，定义见 `_smoke_admin.js:119`）——都是测试自建对象，不是引擎 API。
- 生产模块里的 `onTick` / `onPlayerCommand` / `onJoin` 等只是模块内函数名，真正注册用的是 `tick` / `playerCommand` / `onPlayerJoin`，未踩「无 on 前缀」的坑。
- `api["xxx"]` 动态调用：全库 **0 处**（唯一 `api[a]` 是 `其它代码/diagnostic.js:25-27` 的存在性检测循环，不构成绕过）。

---

## 3. 违禁方块 —— 完整清单

### 3.1 项目自身声明的两张「禁止清单」

**A. `loot.js:278-298` `FORBIDDEN_DROP_NAMES`（63 条）**

- 合法名 **35 条**：`AK-47, M16, MP40, AWP, GPMG, Iron Sword, Diamond Sword, Knight Sword, Stone Sword, Gold Sword, Moonstone Dagger, Diamond Bow, Iron Bow, Iron Helmet, Iron Chestplate, Iron Leggings, Iron Boots, Diamond Helmet, Diamond Chestplate, Diamond Leggings, Diamond Boots, Gold Helmet, Gold Chestplate, Gold Leggings, Gold Boots, Iron Pickaxe, Diamond Pickaxe, Gold Pickaxe, Stone Pickaxe, Iron Axe, Diamond Axe, Gold Axe, Stone Axe, Snowball, Egg`
- 虚假名 **28 条**（见 §4.1）：`AK47, SCAR-H, M4A4, UMP45, SPAS-12, Netherite Sword, Dagger, Bow, Crossbow, Trident, Netherite Helmet, Netherite Chestplate, Netherite Leggings, Netherite Boots, Shield, Netherite Pickaxe, Iron N Hoe, Gold N Hoe, Diamond N Hoe, Netherite N Hoe, Stone N Hoe, Netherite Axe, Iron Shovel, Diamond Shovel, Gold Shovel, Netherite Shovel, Stone Shovel, Ender Pearl`

**B. `mobs.js:70-82` `FORBIDDEN_NAMES`（53 条）**＝ A 去掉 10 个枪名

- 合法名 **30 条**：`Iron Sword, Diamond Sword, Knight Sword, Stone Sword, Gold Sword, Moonstone Dagger, Diamond Bow, Iron Bow, Iron Helmet, Iron Chestplate, Iron Leggings, Iron Boots, Diamond Helmet, Diamond Chestplate, Diamond Leggings, Diamond Boots, Gold Helmet, Gold Chestplate, Gold Leggings, Gold Boots, Iron Pickaxe, Diamond Pickaxe, Gold Pickaxe, Stone Pickaxe, Iron Axe, Diamond Axe, Gold Axe, Stone Axe, Snowball, Egg`
- 虚假名 **23 条**：`Netherite Sword, Dagger, Bow, Crossbow, Trident, Shield, Netherite Helmet, Netherite Chestplate, Netherite Leggings, Netherite Boots, Netherite Pickaxe, Iron N Hoe, Gold N Hoe, Diamond N Hoe, Netherite N Hoe, Stone N Hoe, Netherite Axe, Iron Shovel, Diamond Shovel, Gold Shovel, Netherite Shovel, Stone Shovel, Ender Pearl`

**风险**：共 51 条假名条目（跨两文件，去重 28 个名字）永远不会命中（等于没写）；真实的顶级装备 `Amethite / Serpentite / Rubellite / Magmasteel / Sanguine / Spectral / Voltplate …` 系列（官方均存在）**反而没进黑名单**，这两层「兜底」是假保险。`mobs.js` 还比 `loot.js` 少拦 10 个枪名。

### 3.2 官方引擎内部/占位方块 7 个 ID（不可当普通方块使用）

| ID | 名字 | 性质 |
|---|---|---|
| 1 | `Unloaded` | 未加载区块标记 |
| 27 | `free_placeholder2` | 空位占位 |
| 30 | `free_placeholder` | 空位占位 |
| 104 | `Pumpkin_placeholder` | 占位 |
| 123 | `UNUSED BLOCK TYPE` | 未使用 |
| 489 | `Placeholder Packed Ice` | 占位 |
| 490 | `Placeholder Blue Ice` | 占位 |

另有 **2,157** 个带 `|` 的内部状态变体（如 `Furnace|meta|rot2`、`Dirt|GrassRoots`、`Maple Log|TreeBase|Maple`、`Tall Grass|Top`）。它们有合法 ID，但官方 `BLOCK_NAMES.txt` 明确要求世界代码使用 **ROOT 名 + 规定后缀**，直接照抄这些客户端内部状态名属于误用，不算「真实方块名」。

### 3.3 项目中确证的违禁/内部方块误用

| # | 位置 | 问题 | 影响 |
|---|---|---|---|
| 1 | `其它代码/mc-to-bloxd-block-table.md:123` | `dead_bush → Pumpkin_placeholder`（ID 104 内部占位方块） | 按此表迁移会导入占位方块；建议改 `Grass` / `Tall Grass` / `Air` |
| 2 | `其它代码/mca_to_bloxd.py:169-223, 478` | 把 `BLOCK_NAMES.txt` 的**行号**当方块 ID：`BLOXD_NAME_TO_ID = {n: i for i,n in enumerate(...)}`，并在 `main` 调用 | 与官方 `idToName` 逐行比对 **1179/1179 全部错配**（如脚本把 `Dirt` 记成 0，官方 0=`Air`、2=`Dirt`）。用该工具生成的蓝图会**批量产出错误/虚假方块**，属于工具链严重缺陷 |
| 3 | `其它代码/mca_to_bloxd.py:423-428` | `mc_name_to_bloxd_id()` 直接返回上面的错误 ID | 同上；该脚本的 102 个 MC→Bloxd **目标名字本身全部合法**，问题只在 ID 映射环节 |

### 3.4 ✅ 蓝图产物核验：43 个文件全部干净

`output/*.bloxdschem` 共 43 个，5,439,488 格，48 个不同方块 ID，**未定义 ID = 0、内部占位 ID = 0**。全部 48 个 ID 与官方名（见附录 B）一一对应，说明当前产物由 `build_*.py`（ID 映射经核验 0 错配）生成，**未受 3.3② 的错误工具影响**。

生产代码中没有任何 `api.setBlock*` 放置违禁方块（只有 `getBlock` 读方块与 `Air` 清空格）。

---

## 4. 虚假方块 / 虚假物品名 —— 完整清单

### 4.1 🔴 生产代码：确定 28 条（两张黑名单）+ 疑似 5 条

| 类别 | 虚假名 | 官方真实情况 / 建议替换 |
|---|---|---|
| 枪械 | `AK47` | 官方 `AK-47`（已在清单另一条） |
| 枪械 | `SCAR-H` `M4A4` `UMP45` `SPAS-12` | **无官方对应**；别臆造，建议删（官方相近：`SKAR` / `M16` / `MP40` / `Double Barrel`） |
| 下界合金 | `Netherite Sword / Helmet / Chestplate / Leggings / Boots / Pickaxe / Axe` | bloxd **没有下界合金**；顶层是 `Moonstone`，其上还有 `Amethite` `Serpentite` `Rubellite` `Magmasteel` `Sanguine` 等（官方拼写是 `Serpentite`，不是 `Seprentite`） |
| 裸武器名 | `Dagger` `Bow` `Crossbow` | 官方必须带材质：`Wood Dagger`/`Iron Dagger`、`Wood Bow`/`Iron Bow`、`Wood Crossbow`/`Amethite Crossbow` 等 |
| 无对应物 | `Trident` `Shield` `Ender Pearl` | 官方无三叉戟/盾牌/末影珍珠（只有 `Shield Potion`、`* Spear` 系列），建议删 |
| 锄头 | `Iron N Hoe` `Gold N Hoe` `Diamond N Hoe` `Netherite N Hoe` `Stone N Hoe` | 官方无「N」：`Iron Hoe` `Gold Hoe` `Diamond Hoe` `Stone Hoe` |
| 铲子 | `Iron Shovel` `Diamond Shovel` `Gold Shovel` `Netherite Shovel` `Stone Shovel` | 官方叫 **Spade**：`Iron Spade` `Diamond Spade` `Gold Spade` `Stone Spade` |

- 分布：`loot.js:280-296`（28 条）、`mobs.js:71-81`（其中 23 条，是前者的子集）。
- **疑似 5 条**（`config.js:618-622`）：`Outfit: Tactical Vest` / `Outfit: Urban Plate` / `Outfit: Light Harness` / `Outfit: Heavy Plate` / `Outfit: Streamlined`。官方 4,935 名中查不到；若世界设置中确实建了同名**自定义物品**则合法，静态无法证实。另 `game.js:1811` 只比对 `it.name`、不读 `attributes.customDisplayName`，若套装以「底层物品 + 自定义显示名」发放，加成永远不会触发。

### 4.2 🟡 冒烟测试夹具：确定 7 个（活跃 `api.setItemSlot` 参数）

| 虚假名 | 位置 | 建议 |
|---|---|---|
| `Buff Blade` | `_smoke_tmp.js:627`、`其它代码/test-smoke.js:627` | 换真实武器或删（测试自造名） |
| `TestBlade` | `_smoke_tmp.js:571`、`其它代码/test-smoke.js:571` | 同上 |
| `Emerald` | `_smoke_esc.js:207,212` | 官方 `Block of Emerald` / `Emerald Ore`，无裸 `Emerald` |
| `Iron Ingot` | `_smoke_esc.js:209` | 官方 `Iron Bar` |
| `Redstone` | `_smoke_esc.js:210` | 官方无红石 |
| `Golden Apple` | `_smoke_extra.js:230,237` | 官方只有 `Apple`；该断言依赖 `customDisplayName:'金苹果'` |
| `Netherite Chestplate` | `_smoke_tmp.js:228`、`其它代码/test-smoke.js:228` | 官方 `Amethite Chestplate` 等 |

后果：这些用例测的是「游戏里拿不到的物品」，通过/失败都不能代表真机行为。

### 4.3 🟡 文档/工具：确定 3 处

| 位置 | 名字 | 判定 |
|---|---|---|
| `其它代码/mc-to-bloxd-block-table.md:124` | `Short Grass` | **虚假**（官方是 `Tall Grass` / `Grass`，无 `Short Grass`） |
| `其它代码/mc-to-bloxd-block-table.md:125` | `Short Grass` | 同上 |
| `其它代码/mc-to-bloxd-block-table.md:123` | `Pumpkin_placeholder` | **违禁/内部占位**（见 §3.3①） |

### 4.4 🟢 历史已清理：70 个「幽灵名」

`config修正报告.md:38-39` 记录的 70 个 Minecraft 风格虚构名（`Paper / Redstone / TNT / Iron Ingot / Netherite Ingot / Cooked Beef / Glowstone / Kelp …`）在**当前官方名单里仍全部不存在**；实测 `config.js` 残留 **0 处**，仅 `config.js.bak` 保留旧样本。这一项已闭环，无需再处理。

### 4.5 🟢 `ai/` 旧归档：365 个未命中候选（不确定，完整列表见附录 A）

宽扫全库 ASCII 名字形字面量得到的未命中项，含大量 UI 文案、HTTP 头、状态标签与自造 RPG 物品名（如 `Note Block`、`Jukebox`、`C4`、`Claymore`、`Potato`、`Asgard Stone`、`Unbreaking`…）。**静态数据无法区分「世界自定义物品」与「编造名」**，故只作为候选清单，不计入确定问题数。

### 4.6 ✅ 已核实「不是虚假方块」的常见误报（避免误改）

| 名字 | 出现位置 | 实际身份 |
|---|---|---|
| `Slowness` / `X-Ray Vision` / `Night Vision` / `Poisoned` | `operators.js:138,157`、旧归档 | 官方 **PotionEffect** 名（`CALLBACKS.md:1380-1388`、`ICONS.md`），不是物品名 |
| `Draugr Zombie` | `其它代码/sandbag-codeblock.js:44`（注释内） | 官方 **MobType**（`node_modules/@bloxd/index.d.ts:3642`） |
| `AK-47|RequiresAmmo` 等 10 个 | `…/盔甲合成与附魔系统.js:263-273` | 官方真实物品名（客户端表共 18 个 `|RequiresAmmo`），不是自造变体 |
| `'air' 'empty' 'none' ''` | `maps.js:75` | 空气判定哨兵集合，不是方块名 |
| `east / west / crest / cement / gold / silver …` | `config.js:134-146,641-646` | 项目内部配置键，不是方块名 |
| `CHEST_STYLES` 14 个键、`EXTRACT.wool` 16 个值 | `config.js:353-366,582-588` | 实测全部命中官方名（含大小写差异） |
| 蓝图 48 个方块 ID | `output/*.bloxdschem` | 全部命中官方 `idToName` |

---

## 5. 修正建议（**未执行**，按优先级；审查与修复分离）

| 优先级 | 位置 | 建议 |
|---|---|---|
| P0 | `其它代码/mca_to_bloxd.py:169-223` | 丢弃「行号当 ID」，改为直接加载 `block_ids.json` 的 `idToName` 反向表；否则该工具产出的蓝图全是错方块 |
| P1 | `loot.js:278-298`、`mobs.js:70-82` | 按 §4.1 逐条替换/删除 28 个假名；并补入真实高阶材质装备（`Amethite`/`Serpentite`/`Rubellite`/`Magmasteel` × `Sword/Pickaxe/Axe/Spade/Hoe/Helmet/Chestplate/Leggings/Boots`）；`mobs.js` 补齐 10 个枪名 |
| P1 | `config.js:618-622` + `game.js:1811` | 真机确认 `Outfit:` 是否为自定义物品；若用 `customDisplayName` 发放，改为同时匹配显示名 |
| P2 | `_smoke_*.js` 7 处、转换表 3 处 | 换官方真名或删断言；`dead_bush` 映射到 `Grass`/`Tall Grass`/`Air` |
| P2 | `ai/` 旧归档 11 个非法 API + 7 个非法回调 | 归档目录不进世界代码则无需修；若打算复用，按 §2.2 / §2.4 的表替换 |
| P3 | `其它代码/sandbag-codeblock.js:46-47` | 注释示例里的 2 个非法 API 顺手改成 `getMobIds` / `deleteEntity` |

---

## 6. 验证证据（本轮实测输出摘要）

```
官方基线      : API=248 回调=84 ITEM=1439 BLOCK_ROOT=1446 idToName=4211 合法名(去重)=4935
API 扫描      : 全库活跃调用=1341 处 / 85 个不同名；生产 13 模块=453 处 / 56 个函数
非法 API      : 生产模块=0；全库=12（11 真非法 + 1 mock 方法）；注释内=2；mock 成员=18（17 属性 + 1 方法）
回调          : index.js 顶层 37 赋值 = 27 官方回调 + 10 项目门面，非法=0
非法回调      : 7（全部 ai/ 旧归档顶层注册）
名字核验      : 黑名单 loot.js 63 条→28 假；mobs.js 53 条→23 假；config.js Outfit 5 疑似
测试夹具      : 活跃 setItemSlot 假名=7（Buff Blade/Emerald/Golden Apple/Iron Ingot/Netherite Chestplate/Redstone/TestBlade）
蓝图 ID       : 43 文件 / 48 个不同 ID / 5,439,488 格 → 未定义=0 内部占位=0
ID 映射工具   : 旧 BLOCK_NAMES.txt 行号 vs 官方 idToName → mismatch 1179/1179
              build_dam/lobby/taihedian*.py 的 ID_NAME → 0 错配（“Jack o'Lantern” 为正则截断的假阳性）
配置复核      : CHEST_STYLES 14 键 / EXTRACT.wool 16 值 / MC_TO_BLOXD 102 个目标名 → 未命中 0
历史幽灵名    : 70 个在当前 config.js 残留 0
```

复现方式（只读）：

```bash
python "<skill>/scripts/query.py" api giveItem          # 单函数签名
python "<skill>/scripts/query.py" cb tick              # 回调（tick 无 on 前缀）
python "<skill>/scripts/query.py" block "Iron Spade"   # 方块名 ↔ 编号
python "<skill>/scripts/query.py" doc ITEM_NAMES Spade # 官方名单检索
python "<skill>/scripts/query.py" bp info <蓝图文件>    # 蓝图的 ID/方块统计
python "<skill>/scripts/update_data.py" --check        # 数据是否最新
```

全量扫描脚本与原始输出保存在本次会话的 artifact 目录：`audit_scan.py` / `audit_active.py` / `audit_bp.py` / `audit_ids.py` / `audit_mc.py` 及对应 `*_result.txt`。

---

## 7. 已知限制（强制披露）

1. **真机未验证**：无服务器实例；`Outfit:` 自定义物品、`customDisplayName` 与 `it.name` 的返回关系、别名兼容、槽位 52/53 都未实测。
2. **官方名单 ≠ 客户端全集**：`ItemName` 类型在运行时代接受名单外字符串；世界设置里的自定义物品静态判不了，故 `ai/` 的 365 个候选只标疑似。
3. **静态扫描边界**：模板字符串拼接、运行时动态生成的名字未做数据流追踪；`api[变量]` 全库 0 处（仅 `diagnostic.js` 的存在性检测循环），不会掩盖非法名。
4. **参数只查名字与设置键**：未做全量参数类型/顺序检查（历史报告已做过可选参数粗检，69 处少传均为可选）。
5. **范围声明**：`ai/` 与 `其它代码/` 为归档/工具，其问题**不影响当前世界运行**；`output/` 蓝图已实测全部合法。
6. 本轮**只新增本报告，未改动任何业务代码/配置/蓝图**；历史 `.bak` 与既有报告均未触碰。

---

## 附录 A：`ai/` 旧归档 365 个未命中候选名（**不确定，含噪声**）

来源：全库 ASCII 名字形字面量宽扫，去重后未在 4,935 个官方名中命中的部分。里面混有 UI 文案、HTTP 头、状态标签、玩家名、SVG 路径与自造 RPG 物品名，**不是 365 个已确认的虚假方块**，仅作后续人工核对的候选池：

Absolute Zero, Access-Control-Allow-Headers, Access-Control-Allow-Methods, Access-Control-Allow-Origin, ACOG Scope, Active Camouflage, Adrenaline, Advanced AI Core, Advanced Ammo, Advanced Medkit, Advanced Sniper, AI Assistant, Alpha Core, Aluminum Sheet, AmmoH, Ancient Sniper, Anti-Air System, Anti-Tank Rifle, Antibiotics, Antidote, Antimatter Container, Apocalypse Weapon, ARMOR, Armor Piercing, Arrow Damage, Arrow Speed, Artillery System, Asgard Stone, Assault Rifle, Astral Fragment, Attack Speed, Axe, Bad Request, Ballistic Shield, Bandage, Bane of Arthropods, Basilisk Eye, Battery, Battle Rifle, Battle Suit, Bearing, Binoculars, Blood Bag, Body Armor, Body Armor MK2, Bolt, Boots, BOOTS, BOSS, BOW, Box, C4, Cable, Cache-Control, Capacitor, Carbine, Cave Golem, Celestial Armor, Celestial Orb, Chestplate, ChilyDive179432, Chimera Heart, Chip, ChuanshuoChi, Circuit Board, Claymore, Coil, Combat Drone, Combat Helmet, Combat Knife, Connection, Connector, Content-Length, Content-Type, Cosmic Dust, Cosmic Fragment, Critical Damage, Crystal Heart, Cybernetic Implant, D.3, Damage, Damage Boost, Damage Reduction, Dark Matter Core, David2558, Death Trench 2D API, Defibrillator, Dimension Core, Dimensional Key, Diode, Divine Essence, Divine Weapon, Double Jump, Dragon Scale, Draugr Knight, Draugr Skeleton, Drone, EADDRINUSE, ECONNREFUSED, Efficiency, Eldritch Artifact, Electronic Parts, EMP Device, EMP Generator, Encryption Key, Energy Core, Energy Sword, ENOTFOUND, Epinephrine, Eternal Flame, Ethereal Crystal, Ethereal Shield, Existence Eraser, Exoskeleton, Experimental Weapon, Explosive Rounds, Extended Mag, FAIL, Farming Aura, Farming Yield, Feather Falling, Filter, Fire Aspect, Flame, Flamethrower, Flashbang, Fortune, Frost Golem, Frost Zombie, Fuse, Fusion Reactor, Galaxy Core, Gas Mask, Gasket, Gateway Timeout, Gauntlets, Gear, Genesis Engine, GET, Glass Shard, God Slayer, Gold, Gold Apple, Gravity Manipulator, Griffin Claw, Grip, GunPJ, Hard Drive, Haste, Health, Health Boost, Health Regen, Health Regeneration, Heat Resistance, Heavy Machine Gun, Helmet, Helmet MK2, Hoe, Horizontal Knockback, Hydra Blood, Immortality Elixir, Incendiary Rounds, Infinity, Infinity Stone, Intel Document, Jammer, Jamming System, Jukebox, Jump Boost, K/D:, Katana, KD, Knockback, Knockback Resist, Kraken Tentacle, Lapis Lazuli, Laser Sight, Laser Weapon, LED, Legendary Key, Legendary Weapon, Leggings, Lens, Leviathan Scale, Light Machine Gun, LMG, LMG Ammo, Looting, M64 30 L90 64 L64 64 L38 64 Z, M64 40 L85 64 L75 64 L64 48 L53 64 L43 64 Z, M80 64 L55 45 L60 64 L55 83 Z, Machete, Machine Pistol, Magnet, Map, Matter Converter, Medium Machine Gun, Metal Scrap, Mining Aura, Mining Speed, Mining Yield, Mirror, Missile System, Momentum, Moon Crystal, Morphine, Mortar, Mozilla/5.0 (diag), Multiverse Key, Mythic Key, Mythic Rifle, N/A, Nanobot Swarm, Nebula Dust, Neural Interface, Night Vision, Night Vision Pro, Nobody, NobodyExist, Note Block, Nut, O-Ring, Olympus Key, Omega Device, Omnipotence Orb, OPTIONS, Owner, Painkiller Injection, Painkillers, PASS, Payload Too Large, Personal Defense Weapon, Phoenix Feather, Pickaxe, Pink, Pistol, Pistol Ammo, Plasma, Plasma Battery, Plasma Weapon, Plastic Scrap, Plug, Portal Device, POST, Potato, Power, Power Armor, Power Cell, Power Fist, Powered Exoskeleton, Prism, Protection, Prototype Rifle, Pump, Punch, Quantum Computer, Quick Charge, Radar System, Radio, Railgun, Reality Anchor, Reality Fragment, Reality Shard, Reality Weaver, Rebirth Artifact, Rebreather, Recoilless Rifle, Red Dot Sight, Regeneration Field, Relay, Request read timeout, Request Timeout, Request timeout, Resistor, Response write timeout, Rifle, Rifle Ammo, RightInfoText, Rocket Launcher, Rubber, Satellite Phone, Satellite Uplink, Screw, Seal, Sharpness, ShenhuaChi, Shield Generator, Shotgun, Shotgun Ammo, Shovel, SIGINT, SIGTERM, Silk Touch, Singularity Device, SMG, SMG Ammo, Smite, Sniper Ammo, Sniper Rifle, Socket, Sonar System, Soul Gem, Space Gem, Spawn Orb, Speed, Spring, Star Metal, Stardust, Stealth Suit, Steel Plate, Stimulant, Stomp Damage, Stream timeout, Submachine Gun, Sun Essence, Suppressor, Surgical Kit, Switch, Tactical Flashlight, Tactical Knife, Tactical Mask, Tactical Robot, Tactical Vest, Tactical Vest MK2, Targeting System, TCP 443, Teleporter, Test Chestplate, Test Helmet, Thermal Optics, Thermal Scope, Thorns, Tier, Tier 1, Tier 2, Tier 3, Tier 4, Tier 5, Time Crystal, Time Dilation Field, Time Shard, Titan Essence, TOOL, Transformer, Transistor, Ultimate Artifact, Ultimate Key, Unbreaking, Unicorn Horn, Universe Creator, USB Drive, User-Agent, Valhalla Ticket, Valve, Vertical Knockback, VIP, Void Essence, Void Stone, WEAPON, Wildcat, Wood, Woodcutting Aura, Woodcutting Yield, World Ender, ZhizunChi

> 其中 `Night Vision`、`Tier 1..5`、`Haste`、`Thorns`、`Sharpness` 等属于官方效果名/枚举/图标名（`README.md:61`、`ICONS.md`），被宽扫当成「名字」是算法口径造成，已在 §4.6 说明，请勿按虚假方块处理。

## 附录 B：43 个蓝图中出现的全部 48 个方块 ID（**全部合法**）

`0=Air, 4=Grass Block, 5=Sand, 7=Gravel, 12=Cedar Log, 20=Cedar Wood Planks, 28=Stone, 31=Smooth Stone, 35=Smooth Andesite, 47=Block of Iron, 48=Block of Gold, 49=Block of Lapis Lazuli, 51=White Wool, 52=Orange Wool, 55=Yellow Wool, 56=Lime Wool, 60=Cyan Wool, 65=Red Wool, 66=Black Wool, 82=Red Baked Clay, 84=Gray Concrete, 85=Light Gray Concrete, 97=White Concrete, 106=Glass, 120=Red Glass, 124=Dim Lamp On, 126=Water, 129=Stone Bricks, 131=Dark Red Stone, 133=Chiseled Block of Quartz, 136=Cracked Stone Bricks, 137=Smooth Sandstone, 145=Golden Decoration, 172=Block of Diamond, 204=Chest, 476=Engraved Red Sandstone, 477=Marked Red Sandstone, 727=Smooth Stone Slab, 763=Smooth Andesite Slab, 980=Jack o'Lantern, 1020=Cedar Ladder, 1053=Red Carpet, 1125=Yellow Concrete Slab, 1131=White Concrete Slab, 1222=Cherry Log, 1225=Cherry Wood Planks, 1226=Cherry Leaves, 1510=Code Block`

## 附录 C：历史 70 个「幽灵名」（`config修正报告.md:38-39`，当前已清理，残留 0）

`Paper, Written Book, Map, Paper Bundle, Brochure, Redstone, Redstone Repeater, Redstone Comparator, Piston, Sticky Piston, Observer, Dispenser, Dropper, Hopper, Detector Rail, Activator Rail, Powered Rail, Pressure Plate, Heavy Weight Pressure Plate, Lever, Tripwire Hook, Target, Daylight Sensor, Light Weighted Pressure Plate, Iron Trapdoor, Redstone Lamp, Nether Quartz, Glistering Melon Slice, Golden Carrot, Splash Potion, Lingering Potion, Sugar, Spider Eye, Fermented Spider Eye, Ghast Tear, Blaze Powder, Magma Cream, Nether Wart, Rabbit Foot, Nether Star, Iron Ingot, TNT, Gunpowder, Ender Pearl, Ender Eye, Blaze Rod, Wither Skull, Dragon Head, Shulker Shell, Iron N Hoe, Bow, Crossbow, Shield, Trident, Cooked Beef, Cooked Chicken, Cooked Rabbit, Cooked Salmon, Cooked Cod, Dried Kelp, Nether Gold Ore, Netherite Ingot, Ancient Debris, Redstone Ore, Glowstone, Prismarine Crystal, Sea Lantern, Conduit, Heart of the Sea, Kelp`

> 这 70 个在**当前官方名单里仍全部查不到**；`config.js` 已无残留，仅 `config.js.bak` 保留。注意其中 `Bow / Crossbow / Shield / Trident / Ender Pearl / Redstone / Iron N Hoe / Iron Ingot` 又以「黑名单/测试夹具」形式残留在别的文件里，即 §4.1、§4.2 的确定问题项。
