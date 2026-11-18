# bloxd 非法 API / 物品核查报告（二次核查 · v2.6.5）

核查时间：2026-11-14（第二次）
核查对象：`C:\Users\WZR\Desktop\新建文件夹 (2)` 根目录 13 个模块（**当前代码版本 v2.6.4-20261114，含 v2.6.5 的 `__req` 兼容层**）
核查方式：只读静态核查，未修改任何文件

> 本文件已按**当前代码**重写。上一版报告针对的是旧版代码（config 45KB），其中列出的问题在现行代码里**已经修复**，旧行号不再适用。

---

## 一、数据源核验（GitHub 直连）

| 项 | 结果 |
|---|---|
| 仓库 | `Bloxdy/code-api` |
| 最新提交 | `c812d95cbd4301744e52f049622d693813ef79f5`（2026-10-23T13:46:40Z，作者 whoisEllie） |
| 是否存在更新 | 否，本地快照即最新 |
| 15 个官方文档校验 | 本地文件逐个计算 git blob SHA，与 GitHub 同路径 SHA **完全一致**（API_REFERENCE / CALLBACKS / ITEM_NAMES / BLOCK_NAMES / CLIENT_OPTIONS / MOB_SETTINGS / ENTITY_SETTINGS / ICONS / QTE_DOCS / MESH_ENTITY_DOCS / SOUNDS_AND_MUSIC / PARTICLES / README / SKINS_AND_POSES / SNIPPETS） |
| 词表规模 | API 248 函数 / 回调 84 / 物品 1,439 / 根方块 1,179（+block_ids 4,211，合计 4,494 方块名）/ 客户端选项 128 / 生物设置 68 / 实体设置 18 / mobTypes 45 / customItemStats 32 |
| 合法名集合 | 物品 ∪ 方块 = **4,961** 个去重名 |

结论：本次判定所依据的官方数据与仓库**逐字节一致**，不是"记忆里的文档"。

---

## 二、结论：0 非法

| 检查项 | 规模 | 非法 |
|---|---|---|
| `api.xxx()` 调用 | **449 处**调用点 / 56 个不同函数 | **0** |
| `index.js` 官方回调绑定 | 27 个 | **0** |
| 设置键（客户端 / 生物 / 实体） | 48 次设置调用（其中 40 次用字面量键） | **0** |
| 物品 / 方块名（去重后统一比对） | **159 个**（发放参数、`item:` 目录、战利品表、套装/保险/负重表、两张黑名单） | **0**（唯一"未命中"是 `maps.js` 里 `','` 这种扫描噪声，非物品） |
| 其中 黑名单 `FORBIDDEN_DROP_NAMES` | 86 条 | **0** |
| 其中 黑名单 `FORBIDDEN_NAMES` | 79 条 | **0** |
| 其中 `GEAR.outfits` / `INSURANCE.packages` / 负重表 | 5 / 4 / 23 键 | **0** |
| 商店图标 `image:` | 47 处 | **0** |
| 生物类型（mobTypes / guardMob / 参数） | 18 处 | **0**（全部在官方 45 种内） |
| 效果名 / QTE 类型 / `setItemStat` 的 stat 名 | 逐项 | **0** |

**API 调用量前 10**：`sendFlyingMiddleMessage` 69、`getItemSlot` 42、`createShopItem` 42、`sendMessage` 36、`getEntityName` 24、`setClientOption` 22、`setPlayerDbValue` 20、`setItemSlot` 20、`getPlayerDbValue` 18、`getPlayerIds` 17。

**回调**：`tick`（无 on 前缀）、`playerCommand`（无 on 前缀）、`doPeriodicSave`、`onClose` 等 27 个全部命中 `CALLBACKS.md`；另 10 个顶层赋值（`Money / CheckMoney / Mojin / Data / PlayerData / Checkin / Quest / PullLever / CustomWeapon / Fittings`）是项目自定义的全局门面，不是引擎回调。

---

## 三、与上一版报告的差异（旧问题已在新代码中修复）

| 上一版问题 | 当前状态（已复核） |
|---|---|
| 黑名单 28 个名字查无此物（`Netherite *`、`* Shovel`、`* N Hoe`、`AK47`、`Trident`、`Shield`、`Ender Pearl`…） | 已改为官方真名：`loot.js:344` 共 **86 条**、`mobs.js:82` 共 **79 条**，全部命中（含 `AK-47`、`SKAR`、`Double Barrel`、`Iron Spade`、`Amethite / Serpentite / Rubellite / Magmasteel` 全套） |
| `config.js:652-659` 五个 `Outfit: *` 键查无此物，套装加成永不触发 | 已换成真实物品：`Military Chestplate / Geo Chestplate / Fur Chestplate / Magmasteel Chestplate / Spectral Chestplate`（5 个全部命中官方物品表） |
| 冒烟测试用 `Iron Ingot / Golden Apple / Netherite Chestplate` | 已换成 `Iron Bar` / `Apple`（`_smoke_esc.js:209`、`_smoke_extra.js:230` 等） |

> 说明：这些修改不是本次做的；本次只做复核，确认改动落到了正确名字上。

---

## 四、仍需注意（不属于"非法"，但会影响上线的风险）

1. **`更新包-2.6-20261114` 已落后于当前工作区，不要整包覆盖。**
   - 13 个模块里 **11 个**与根目录不一致（根目录多出 v2.6.5 的 `__req` 兼容层：`require` 依次尝试 无前缀 → `./` → `/`，解决"文件夹式世界代码把 `./x.js` 解析成 `/x.js` 导致 init 直接失败"的问题）。
   - 包内 `index.js` 只有 **1.8KB**，是"诊断-自动定位"入口，而不是 18.9KB 的主入口——与包内 `00-贴码说明.md` 第 50 行"包里 index.js 是完整 18KB"**自相矛盾**。整包贴码会把入口换成诊断版，世界代码等于不运行。
   - 建议：需要再发包时，从当前根目录重新导出 13 个文件，并核对哈希。
   - 另：`config.js` 的 `VERSION` 仍是 `v2.6.4-20261114`，而 `index.js` / `game.js` 注释已写 v2.6.5——版本号未同步，只影响日志显示。
2. **背包槽位 52 / 53**（`config.js` 的 `outfitSlots`）官方文档未给出背包槽位布局，是否真实可存物只能真机确认。
3. **`getItemSlot().name` 与 `attributes.customDisplayName` 的关系**：当前 `game.js` 仍按 `it.name` 匹配套装表；如果线上套装物品是用"底层胸甲 + 自定义显示名"发放，名字匹配要看真机返回的 `name` 到底是不是底层名。静态代码无法判定。
4. **参数只核对了名字与个数**，未校验运行时类型（如 `applyEffect` 的 duration 单位、坐标数值范围）。
5. **官方名单 ≠ 运行时全集**：`ItemName` 在官方类型里就是 `string`，世界内自定义物品无法从静态数据证伪。
6. 扫描范围：root 13 个模块；`ai/`、`其它代码/`、`_smoke_*.js`（mock 测试）、`node_modules` 未纳入结论。

---

## 五、可复现命令

```bash
python <skill>/scripts/update_data.py --check        # 远端是否有新提交（本次：无）
python <skill>/scripts/query.py stats                # 本地数据版本与统计
python <skill>/scripts/query.py api giveItem         # 单函数签名/参数/示例
python <skill>/scripts/query.py cb tick              # 回调（注意无 on 前缀）
python <skill>/scripts/query.py doc ITEM_NAMES Spade # 物品名检索
python <skill>/scripts/query.py block "Iron Spade"   # 方块名/编号互查
```

GitHub 侧核验：`list_commits(owner=Bloxdy, repo=code-api)` 取最新 SHA；`get_file_contents(..., path="/", sha=<sha>)` 取 15 个文件的 blob SHA，与本地逐字节比对。
