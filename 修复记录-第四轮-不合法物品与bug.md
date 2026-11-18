# 修复记录（第四轮）：主世界代码「不合法物品 + bug」

时间：2026-11-14｜范围：**根目录 13 个生产模块**（`config/customweapons/db/fittings/game/guns/index/loot/maps/menu/mobs/operators/team`）
未动：`ai/`（旧项目归档）、`其它代码/`（工具/文档）、`output/`（蓝图）、测试夹具（仅同步 1 处断言，见 §1-17）
备份：`loot.js.bak-20261114-fix`、`mobs.js.bak-20261114-fix`、`game.js.bak-20261114-fix`、`config.js.bak-20261114-fix`（config 未改，预防性保留）

---

## 一、变更清单（7 个文件 / 17 处；全部为最小局部 diff）

| # | 文件:行 | 类型 | 问题 | 改动 |
|---|---|---|---|---|
| 1 | `loot.js:278-308` | 不合法物品 | `FORBIDDEN_DROP_NAMES` 63 条中 28 条官方查无此物（`Netherite *`、裸 `Bow/Dagger/Crossbow/Trident/Shield`、`* N Hoe`、`* Shovel`、`AK47/SCAR-H/M4A4/UMP45/SPAS-12`、`Ender Pearl`） | 换成官方真名（`Amethite/Serpentite/Rubellite/Magmasteel` × 9 部位共 36 条，`SKAR`、`Double Barrel`、`Wood Bow`、`Wood Crossbow`、`Iron Dagger/Wood Dagger/Iron Spear`、`* Hoe`、`* Spade`），删除无对应物；**63 → 86 条，未命中 0** |
| 2 | `loot.js:590` | 复制 bug | `saveLootToWarehouse` 扫 0-45 格，而撤离清包只清 11-45 → 武器/技能/子弹格物品「背包 + 仓库」双份 | 入库范围收窄为 **11-45**，与 `clearBagKeepInsured` 完全一致 |
| 3 | `loot.js:412,437` | 非法返回值 | `onPlayerAttemptOpenChest` 返回 `true`（官方只接受 `void \| "preventOpen"`） | 改为 `return;` |
| 4 | `mobs.js:7` | 引用错误 | 新增 `const { GUNS } = require('./guns.js')`（`GUNS` 表在 `guns.js`，`config.js` 不导出） | 见 #6 |
| 5 | `mobs.js:72-90` | 不合法物品 | `FORBIDDEN_NAMES` 53 条中 23 条假名 | 换成官方真名 + 顶级材质共 **79 条，未命中 0**；**保留「不含枪械」设计**（小怪允许掉缴获枪） |
| 6 | `mobs.js:112` | P0 崩溃 | `config.GUNS[...]` 恒为 `undefined` 访问 → 每次击杀小怪抛 `TypeError`，被 game 的 catch 吞掉，**小怪掉落系统整体失效** | 改为 `GUNS[d.itemName]` |
| 7 | `game.js:599` | 单位 bug | `createItemDrop` 的 `timeTillDespawn` 官方单位是**毫秒**，原传 `6000` = 6 秒（注释却写 5 分钟） | 改为 `300000`（5 分钟，官方默认值） |
| 8 | `game.js:642-644` | 经济复制 | 撤离成功只入库、不清背包 → 可反复撤离刷物资 | 入库后调用 `clearBagKeepInsured(pId)`（保留保险格/装备/0-10 武器技能格） |
| 9 | `game.js:1298` | 返回值语义 | `onPlayerDropItem` 对 1-4 格返回 `'allowButNoDroppedItemCreated'`（允许丢弃但不掉落 = **物品被销毁**），与注释「禁止丢弃」相反 | 改为 `'preventDrop'` |
| 10 | `game.js:1817-1819` | 功能失效 | outfit 加成只比对 `it.name`，套装若以「底层物品 + `customDisplayName`」发放（项目通用做法）则永不触发 | 同时匹配 `it.name` 与 `attributes.customDisplayName` |
| 11 | `game.js:1125` | 内存泄漏 | `db._statsCache/_insPendingCache/_insuredSlotsCache` 只增不减，离线玩家永久驻留 | 调用新增的 `db.clearPlayerCaches(pId)` |
| 12 | `db.js:93-98,233` | 内存泄漏 | 同上（缺清理函数） | 新增 `clearPlayerCaches` 并导出 |
| 13 | `menu.js:428` | 按钮覆盖 | 动态「当前目标」与 `initAdminMenu` 的「📊 查看玩家数据」同用 key `'info'` → 查看按钮被覆盖成 `canBuy:false`，功能死 | 动态项改用独立 key `'targetinfo'` |
| 14 | `menu.js:547` | 分类写错 | 签到按钮建在 `CAT.MAP`，刷新却 upsert 到 `CAT.LOADOUT` → 选图页签到状态永不刷新、战备页多一个无响应按钮 | 改为 `CAT.MAP` |
| 15 | `menu.js:928`（原） | ReferenceError | `lastAdminPickKeys.delete(pId)` 引用从未声明的变量 → 每次玩家离开 `forgetPlayer` 抛错，后续 `adminMuteBtns/adminTargets` 清理不执行 | 删除该行（全库无其它引用） |
| 16 | `fittings.js:122-137` | 参数类型 | 「快速弹夹」`setGunStat.reloadTime: '80%'` 被 `Object.assign` 原样写进官方 `gunStats`（应为 number） | `computeStats` 支持百分比字符串：按**当前枪基础值**乘算（MP40 2400ms、AWP 6400ms），其余字段照常覆盖 |
| 17 | `_smoke_admin.js:176-182` | 测试同步 | 原断言 `per-player key 'info'` 对应旧实现 | 改为断言 `targetinfo`，并新增「全局 info 查看按钮未被覆盖」回归断言 |

> 说明：`config.js` 本轮**未改**（Outfit 5 条属「世界自定义物品待确认」，见 §三），但已备份。

---

## 二、验证证据（原始输出摘要）

**① 静态**
```
node --check loot.js / mobs.js / game.js / menu.js / fittings.js / db.js  -> 全部通过
read_lints(6 files)                                                       -> totalCount=0
黑名单全量扫描: loot.js FORBIDDEN_DROP_NAMES 共 86 条，未命中 0 条
              mobs.js FORBIDDEN_NAMES      共 79 条，未命中 0 条
```

**② 冒烟回归（修复前 → 修复后）**
```
_smoke_admin.js  PASS=8  FAIL=0   (修复前 7/0；#17 新增 1 条断言)
_smoke_esc.js    PASS=28 FAIL=0   (修复前 28/0)
_smoke_extra.js  PASS=30 FAIL=0   (修复前 30/0)
```

**③ 黑名单/配件行为探针（vm 注入导出，真实执行）**
```
PASS loot.isForbiddenDrop("Amethite Sword")        PASS loot.isForbiddenDrop("Magmasteel Chestplate")
PASS loot.isForbiddenDrop("Wood Bow")              PASS loot.isForbiddenDrop("Iron Sword")
PASS loot.isForbiddenDrop("Bow") 假名不再命中       PASS loot.isForbiddenDrop("Apple") 不误伤
PASS 快速弹夹 reloadTime=2400 (MP40 3000*80%)      PASS 快速弹夹 clipSize=20
PASS AWP 快速弹夹按自身基础乘算 = 6400             PASS 无配件保持基础 3000/30
```

**④ 撤离入库/清包范围一致性探针（mock api）**
```
PASS 入库件数=3(仅 11-45 非保险格)      PASS 仓库含 Gold Bar/Moonstone/Bread
PASS 仓库不含武器/技能/子弹格           PASS 仓库不含保险格 Diamond
PASS 清包件数=3                         PASS 武器格/技能格/子弹格保留
PASS 保险格保留                         PASS 普通背包格已清空
```

**⑤ 关键改动静态断言**
```
PASS db 导出 clearPlayerCaches        PASS game.js onLeave 调用 clearPlayerCaches
PASS 撤离成功分支清非保险格            PASS createItemDrop 用 300000ms
PASS 丢弃格 1-4 返回 preventDrop      PASS outfit 兼容 customDisplayName
PASS menu 无 lastAdminPickKeys 残留   PASS 签到刷新改 CAT.MAP
PASS 动态目标 key 改 targetinfo       PASS mobs 使用 guns.GUNS 而非 config.GUNS
```

---

## 三、未修项与原因（需你决策 / 无数据 / 不在主世界代码）

| 项 | 位置 | 为什么没改 |
|---|---|---|
| `Outfit: *` 5 条 | `config.js:618-622` | 可能是世界设置里的自定义物品，静态无法证伪；擅自改成普通护甲会改变平衡。已让 `game.js:1817` 兼容 `customDisplayName`，等你确认真实发放方式后只需改 config 一行 |
| 白名单 `Admin`/`Owner` 可被抢名提权 | `config.js:511`、`game.js:163` | 权限变更，需真实 `DbId` 或授权删名；会让现役管理员掉权限，必须你确认 |
| 3 处价格冲突 | `Block of Diamond / Block of Gold / Arrow` | 业务数值，无目标价 |
| `jianyu` 全 `[0,0,0]` 坐标 | `config.js` | 无真实坐标数据，不能臆造 |
| 8 把枪 `minKickback > maxKickback` | `guns.js:28/87/115/143/186/200/228/318` | 官方文档未定义两字段语义（仅类型声明），对调会改变手感，需真机确认后再改 |
| 测试夹具 7 个假名 | `_smoke_*.js` | 不在主世界代码；`_smoke_tmp.js` 是已知过时旧测试（4 PASS/18 FAIL） |
| `ai/` 11 个非法 API + 7 个非法回调 | `ai/**` | 旧项目归档，不影响当前世界；已在本轮报告列清单 |
| 工具链 1179 个 ID 错配 | `其它代码/mca_to_bloxd.py` | 工具脚本，当前 `output/` 43 个蓝图已实测 0 错误；修复另立任务 |

---

## 四、回滚方式

```powershell
Copy-Item loot.js.bak-20261114-fix loot.js -Force
Copy-Item mobs.js.bak-20261114-fix mobs.js -Force
Copy-Item game.js.bak-20261114-fix game.js -Force
# menu.js / fittings.js / db.js 未单独备份（改动为局部小 diff，可按上表逐条反向编辑）
```

> 注：`menu.js`、`fittings.js`、`db.js` 备份时未列入首批（只备份了 4 个主文件），如需完整回滚可按 §一 表格逐条还原；建议后续统一 `git init` 解决无 VCS 问题。

---

## 五、已知限制（强制披露）

1. **真机未验证**：全部为本地静态检查 + Node mock 冒烟 + vm/mock 探针；bloxd 服务器对 `preventDrop`、`timeTillDespawn`、% 换弹的实际表现仍需世界内实测。
2. **黑名单覆盖非穷举**：只覆盖当前已知武器/装备/工具与顶级 4 材质；新材质/新枪出现时需按同样口径补。
3. **撤离语义**：修复后「撤离成功 = 普通背包物品进仓库、0-10 与保险格留身」；若你的设计是「撤离后背包全清」或「仓库永久存储」，需要再调一处。
4. 冒烟测试是项目自建 mock，不等于官方引擎行为；`_smoke_tmp.js` 旧测试仍失败（与本轮无关）。

---

## 六、收尾报告

| 字段 | 内容 |
|---|---|
| 任务 | 修复主世界 13 个模块中的不合法物品与确定 bug |
| 完成情况 | 17 处全部落地：不合法物品 2 张清单（86/79 条，0 未命中）+ 11 个功能/崩溃/经济/内存 bug + 1 处测试断言同步 |
| 关键决策 | ①有官方对应名则替换、无对应则删，不臆造；②保留「小怪允许掉缴获枪」设计；③入库与清包范围统一为 11-45，杜绝双份；④权限/数值/坐标类不擅改，列待决策 |
| 验证证据 | 语法 6/6、lint 0、冒烟 8+28+30 PASS/0 FAIL、黑名单扫描 0 未命中、vm 探针 11 PASS、撤离探针 8 PASS、静态断言 13 PASS |
| 待办 | 真机验证 preventDrop/掉落保留/换弹百分比/outfit 槽；白名单按指示跳过；`git init` |

**量化串**：`(已验证主线 7 / 总主线 7) × 100% = 100%`

---

## 七、增补（同日第二轮：白名单不动，其余全修）

> 按你的指示：白名单问题跳过；Outfit、价格、jianyu、后坐力、测试夹具、工具链一并处理。

| # | 文件:行 | 问题 | 改动 |
|---|---|---|---|
| 18 | `config.js:39` | `jianyu` 坐标仍 `[0,0,0]` | 加 `disabled: true` |
| 19 | `maps.js:18-22` | 停用图仍出现在选图页 | `getMapList` 过滤 `disabled` |
| 20 | `game.js:478-486` | 停用图可被部署 → 传送到 0,0,0 卡死 | 部署前校验 `map.disabled` 并提示 |
| 21 | `game.js:509` | 停用图可被记录 | `onMapSelectRequest` 拒绝 |
| 22 | `menu.js:717` | 点击停用图未拦截 | 拒绝 `disabled` |
| 23 | `config.js:617-623` | 5 个 `Outfit: *` 世界里不存在，加成永不触发 | 改为官方真实护甲 `Military / Geo / Fur / Magmasteel / Spectral Chestplate`，负重/速度属性不变 |
| 24 | `config.js:261/264/299` | 展示价与实际成交价冲突（8 万/24 万/80 vs 200/80/2） | 目录价对齐实际成交价：Block of Diamond **200**、Block of Gold **80**、Arrow **2**（成交价本来就被箱体表覆盖，**只修展示，不动经济**） |
| 25 | `guns.js:28/87/115/143/186/200/228/318` | 8 把枪 `minKickback > maxKickback` | 全部对调为 `min ≤ max`：GPMG / MP40 / AK-47 / Mini Izu / 霰弹枪 / Block-19 / M16 / FMR |
| 26 | `_smoke_esc.js:207-212` | 夹具用 `Emerald / Iron Ingot / Redstone` | 改 `Block of Emerald / Iron Bar / Coal` |
| 27 | `_smoke_extra.js:230,237` | `Golden Apple` 不存在 | 底层改 `Apple`，保留 `customDisplayName:'金苹果'` |
| 28 | `_smoke_tmp.js` / `其它代码/test-smoke.js` | `Netherite Chestplate` 假名 + 死测试误导 | 改 `Amethite Chestplate`；顶部标注「已废弃，跑必失败，现行基线是另外 3 个」 |
| 29 | `其它代码/mca_to_bloxd.py:169-197` + `block_ids.json` | 1179/1179 方块 ID 错配 | 改为加载官方 `block_ids.json`（已复制到工具目录）；找不到直接 `SystemExit`，**绝不回退行号映射** |
| 30 | `其它代码/mc-to-bloxd-block-table.md:123-125` | `Short Grass`×2（虚假）+ `Pumpkin_placeholder`（内部占位） | 改 `Tall Grass`×2；`dead_bush` 改 `Air`（跳过） |

**验证（本轮实测）**

```
语法 9/9 + python -m py_compile OK；lint 0
冒烟: _smoke_admin 8/0、_smoke_esc 28/0、_smoke_extra 30/0
probe_config 11 PASS:
  Outfit 5 名全部官方合法(Military/Geo/Fur/Magmasteel/Spectral Chestplate)
  目录价 200/80/2 对齐；jianyu 已从 getMapList 移除；部署/选图均拒绝 disabled
  全部枪械 minKickback <= maxKickback(0 反置)
mca 转换器: Air=0, Dirt=2, 4211 个方块映射(修复前 Dirt=0, 1179 条全错)
全库复扫: loot 86 条 0 未命中；mobs 79 条 0 未命中
  4A 剩余仅: 测试玩家名(Admin/Alice...)、config 内部键(bronze/east...)、
             官方效果名(Slowness/X-Ray Vision/Poisoned)、地图空气哨兵(empty/none)、ai/ 归档
```

**保留未修（有明确理由）**

- 白名单 `Admin/Owner`：按你的指示跳过。
- `_smoke_tmp.js`：基于已停用的 farm/mine 地图与旧 `Speed Potion` 技能物品，跑必失败；本轮只做假名合法化 + 废弃标注，**建议直接删除**（未擅自删文件）。
- `ai/` 旧归档：11 个非法 API + 7 个非法回调，不进当前世界，未动。
- 真机验证：`preventDrop`、300000ms 掉落保留、% 换弹、outfit 槽 52/53 可放性仍需世界内实测。

---

## 八、变卖物重做（同日第三轮：全方块 + 三角洲行动原名）

**目标**：把变卖面板/摸金产出从「Flashlight / Compass / Bone 等杂项 + 英文旧名」换成「bloxd 方块 + 三角洲收集品原名」，尽量全是方块。

**目录**：`config.js:241` `SELL_CATALOG` **56 条，96.4% 是方块/官方锭**，7 类：

| 分类 | 数量 | 代表映射（三角洲原名 → bloxd 方块） |
|---|---|---|
| 贵重物品 | 27 | 海洋之泪→`Block of Moonstone`、非洲之心→`Block of Diamond`、曼德尔砖→`Beacon`、翡翠王座→`Block of Emerald`、黄金瞪羚→`Block of Gold`、克劳狄乌斯半身像→`Block of Quartz`、鱼月徽权杖首→`Block of Lapis Lazuli`、深渊之核→`Block of Coal`、万金泪冠→`Golden Decoration`、装甲车电池→`Block of Iron`、绝密服务器→`Blue Concrete`、复苏呼吸机→`White Concrete`、飞行记录仪→`Black Concrete`、微型反应炉→`Dim Lamp On`、高速磁盘阵列→`Crystal Block`、云存储阵列→`Ice Bricks`、曼德尔超算单元→`Code Block`、便携军用雷达→`Forge Hopper`、强化碳纤维板→`Obsidian`、金条→`Gold Bar`、主战坦克模型→`Copper Bar`、陨石切片标本→`Magenta Concrete`、天然红珊瑚雕件→`Lime Concrete`、钻石项链→`Pink Concrete`、铂金戒指→`Light Gray Concrete`、金表→`Gray Carpet`、古董钟→`White Wool` |
| 电子产品 | 5 | 笔记本电脑、显卡、相机、电子脚镣、刀片服务器 |
| 情报文件 | 2 | 加密数据芯片、印象派名画 |
| 医疗物资 | 4 | ECMO、自动体外除颤器、手术包、医疗包 |
| 工业材料 | 3 | 等离子切割机、螺丝、硬币 |
| 生活用品 | 13 | 扫拖一体机器人、咖啡、巧克力、香烟、酒、罐头、牙膏、钢笔、肥皂、打火机、灯泡、钥匙、邮票 |
| 军用物资 | 2 | 防弹衣、战术背包 |

**箱子同步**：14 个 `CHEST_STYLES` 全部重写变卖物行，与目录 **同 item / 同价 / 同 display**；保留骑士剑/钻石剑/钻石弓/护甲、药水、食物、TNT、房卡等玩法物品。高级箱大红概率压到 **0.001–0.008**，BOSS/绝密箱 0.003–0.01，避免 6 级泛滥。

**重量**：`CONST.weight` 新增 50+ 方块重量（方块 2–15kg、生活小件 0.5–1kg），不再全部吃默认 `perItemWeight: 1`。

**验证**
```
探针 11 PASS：56 条 / item+display 唯一 / 全部官方合法 / 方块化 96.4% / 7 类 /
             14 个箱子 / 概率 0-1 / 同名同价同 display / 方块重量全覆盖
冒烟：admin 8/0、esc 28/0、extra 30/0
node --check config.js 通过；lint 0
```

**说明**
- 普通战利品（面包/矿石/旧枪）仍按地图表/箱子价可卖，但不在新目录内，变卖面板会回退显示英文名（不影响成交）。
- 备份：`config.js.bak-20261114-sell`（目录前）、`config.js.bak-20261114-chest`（箱子前）。
- 真机待验：方块变卖物能否正常拾取/堆叠、`customDisplayName` 是否正确显示三角洲原名、`Tier 6` 附魔标记是否正常。
