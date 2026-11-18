# 搜打撤项目 — 交给下个 AI 的交接文档

> 生成时间：2026-10-05
> 说明：本文档由上一轮 AI 生成，用于把当前进度与待办完整移交给下一次对话。
> **重要：所有"未完成任务"均已获用户明确指示——全部不修改。下个 AI 请勿擅自改动代码，任何改动前必须先向用户确认。**

---

## 一、项目概况

- **项目类型**：基于 Bloxd.io 世界代码的"搜打撤"（仿三角洲行动）游戏。
- **模块化方式**：CommonJS 多文件模块化，每个 `.js` 一个文件，通过 `require()` 互相引用。
- **工作目录**：`c:\Users\WZR\Desktop\新建文件夹 (2)`
- **当前代码版本**：`config.js` 中 `VERSION = 'v2.1-20261001b'`

### 核心模块职责

| 文件 | 行数 | 职责 |
|------|------|------|
| `index.js` | ~238 | 唯一官方回调注册点 + 转发；全局函数入口（Money/Data/PlayerData/Checkin/Quest/CustomWeapon）；错误上报；版本自检 |
| `game.js` | 1031 | 个人行动（raid）状态机、战斗、负重、指令编排 |
| `menu.js` | 772 | 三级菜单（CAT / BACK_TARGET / onBoughtShopItem） |
| `loot.js` | 595 | 附魔 / 违禁品 / 保险 / 箱子 QTE / 变卖 |
| `maps.js` | — | 玩家独立选图 / 区域检测 / 传送 / 刷怪 / 撤离点光点 |
| `operators.js` | — | 干员技能与被动（手持技能物品单击释放） |
| `team.js` | — | 3 人组队与友伤控制 |
| `db.js` | — | 玩家数据持久化 |
| `config.js` | — | 全部配置常量（MAPS/CONST/THEME/STATUS/GEAR/RANKS/CHECKIN） |
| `customweapons.js` | — | 自定义武器注册接口 |
| `guns.js` | — | 枪械参数表 |
| `test-smoke.js` | — | 回归测试（mock 完整 api，`node test-smoke.js` 运行） |

### 关键状态源（重要）

- **玩家地图**由 `game.js` 的 `G.players(pId).mapKey` 持有，是**单一状态源**。
- 经 `globalThis.__getPlayerMapKey` 暴露给 `menu.js` / `loot.js` 读取。
- `db`（`mapKey` 键）仅作持久化兜底，重进服务器自动恢复。**其他模块不得自行缓存玩家地图状态。**

### 核心 raid 函数（全局暴露）

- `globalThis.onDeployRequest(pId)` — 进图申请
- `globalThis.onMapSelectRequest(pId, mapKey)` — 选图
- `game.enterRaid(pId)` — 进入行动
- `game.exitRaid(pId, mode='extract'|'dead'|'timeout')` — 结束行动（撤离/阵亡/超时）

### 用户近期关键纠偏（必须遵守的设计约束）

1. **各打各的**：必须按玩家独立 raid 状态，**禁止共享同一局**。不同玩家可同时在不同地图行动。
2. **进图提醒只自己看**：不做全服广播，提醒只发给当事玩家。
3. **死亡的复活提示改成"撤离失败"**：结算文案用"撤离失败"。

---

## 二、本次任务（"检查一下代码bug"）已完成内容 ✅

### 1. 修复 `index.js` 回调参数错位

- **官方签名**：`onPlayerMoveItemOutOfInventory(playerId, itemName, itemAmount, fromIdx, movementType)`
- **问题**：原项目误写为 `(pId, fromIdx, itemAmount)`，导致锁定格（格号）读到错误值，拦截失效。
- **修复**：改为正确转发 `game.onPlayerMoveItemOutOfInventory(pId, fromIdx, itemAmount)`。
- 位置：`index.js` 约 179–183 行。

### 2. 修复 `game.js` 未禁"移入"武器格

- **问题**：`onPlayerMoveInvenItem` 原本只拦 `fromIdx`，未拦目标格 `toStartIdx/toEndIdx`，物品可被挤进武器格，有丢刀风险。
- **修复**：
  - 从武器格移出：`if (fromIdx>=1 && fromIdx<=4) return "preventChange";`
  - 目标落入武器格：`if ((toStartIdx>=1&&toStartIdx<=4)||(toEndIdx>=1&&toEndIdx<=4)) return "preventChange";`

### 3. 验证结果

- `node test-smoke.js` → **全通过，0 失败**。
- 另写 9 条断言验证锁定格拦截，**全部通过**。
- 核对 44 个 API 名全部存在、10 个客户端选项键合法、22 个回调签名（除已修者）均吻合。

---

## 三、未完成任务（**用户已明确：全部不修改**）⏸️

> 以下问题均已定位并给出建议方案，但用户决定本轮不动代码。
> **下个 AI 请勿自行修改；如要处理，必须先向用户逐项确认。**

### A. 认证附魔读回风险（优先级最高）

- **位置**：`loot.js` 的 `giveMarkedItem`。
- **现状**：用自定义键 `{sanjiaozhou:N}` 写入 `api.setItemSlot` 第 5 参（附魔属性）。
- **风险**：官方 `getItemSlot` 返回结构为 `{name, amount, attributes}`，自定义键**可能读不回**。当前靠 `issuedNames` 台账兜底。
- **两种候选方案**（二选一，勿直接动手）：
  1. 改用官方 `api.createEnchantmentAttributesForItem(itemName, enchantmentLevel)` 写"真实附魔"；
  2. 或以台账 `issuedNames` 作为**唯一判据**，彻底不依赖读回。
- **前置动作**：**需用户先在游戏内用 `/gear` 实测，确认附魔到底读得回读不回**，再决定方案。

### B. `operators.js` reveal 技能退化分支永不执行

- **位置**：`operators.js` 约 133–142 行。
- **现状**：`api.applyEffect(pId, 'X-Ray Vision', dur)` 传入无效效果名时**不会抛错（静默忽略）**，导致 `catch` 里的 `canSeeNametagsThroughWalls = true` 兜底分支永远不执行，**技能可能无效**。
- **建议**：无条件同时设置 `canSeeNametagsThroughWalls` 作为兜底。

### C. `test-smoke.js` 缺回归用例

- 缺"移出背包（`onPlayerMoveItemOutOfInventory`）锁定格拦截"的回归测试用例，可补充。

### D. 刻意保留项（已告知用户，刻意未改，非 bug）

- `loot.js` `onOpenChest` 的 `if(!mapKey) return;` —— 服主开箱后门（有意保留）。
- `index.js` `onPlayerClick` 只用前 2 个参数；`tick` 未接 `ms` 参数 —— 均无实际影响。

---

## 四、开发与验证须知

1. **官方文档核对**：使用 `bloxd-lookup` 技能。
   - 查 API 签名：`python "$S/scripts/query.py" api <名>`
   - 查回调签名：`python "$S/scripts/query.py" cb <名>`
   - 开模拟器：`python "$S/scripts/query.py" sim`
   - （`$S` 指该技能根目录）
2. **回归测试**：改动后务必运行 `node test-smoke.js`，须全通过。
3. **回调注册**：所有官方回调**只在 `index.js` 注册**，经 `safe()` 包装后转发到 `game.js`。新增回调也要遵循此约定。
4. **玩家地图状态**：只认 `game.js` 的 `mapKey`，其他模块经 `globalThis.__getPlayerMapKey` 读取，禁止自缓存。

---

## 五、用户偏好与约束（务必遵守）

- 交流语言：**中文**。
- 行动风格：**先给方案再动代码**；分步分析并验证。
- 删文件：**必须先确认**。
- **BYD 加密机制不可公开**。
- 输出：**简洁省 token**。

---

## 六、下个 AI 的建议起手动作

1. 阅读本文档，确认"未完成任务"当前**不需要修改**（用户已指示）。
2. 若用户提出新需求，先明确需求范围，再给方案。
3. 若用户要推进 A/B/C：先向用户逐项复述并等待选择；**A 必须先等用户 `/gear` 实测结果**。
4. 任何代码改动后运行 `node test-smoke.js` 验证。
