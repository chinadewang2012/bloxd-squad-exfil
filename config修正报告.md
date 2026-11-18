# config.js 全量修正报告

时间：2026-11-13｜技能：`bloxd-lookup`（官方名单核验）+ `编程专家.Skill`（复杂档 / 安全闸门 / 七步闭环）
对象：`config.js`（修正前 57,463 字节 → 修正后 45,442 字节）
**备份**：`config.js.bak`（57,463 字节，保留未删，可整文件回滚）

---

## 一、判定口径与范围（先定判据再动手）

"不合理"限定为**可客观证伪、不依赖猜测**的 7 类：① JS 对象重复键静默覆盖 ② 坐标 `min>max` ③ 引用已停用/不存在的地图键 ④ 数据条数与注释不符 ⑤ 违反 config 自身第 226 行声明的不变量「载体只能用 bloxd 官方物品名」⑥ 同一键在多个重量表冲突 ⑦ 版本/注释漂移。

**In**：以上全部。**Out（只加 TODO 注释，不擅改）**：白名单通用名、签到奖励数值、`jianyu` 占位坐标、价格数值——这些需要真实 DbId / 服主业务决策 / 真机实测，改了就是臆造。
**官方数据依据**：`ITEM_NAMES.txt`(1439) + `BLOCK_NAMES.txt`(1179) + 客户端 `block_ids.json`(4211) 三源合并，共 5413 个有效名。

---

## 二、修正清单

### A. 结构性错误（客观证伪）

| 项 | 修正前 | 修正后 |
|---|---|---|
| `CHEST_STYLES` 重复键 | 源文件 16 个键，`Air`/`Stone Bricks` 各定义 2 次（JS 静默覆盖，旧版「普通箱/武器箱」从未生效） | 删除 37 行重复的旧定义，14 个键、0 重复；保留 `Block of Gold`/`Block of Diamond` 两个独有样式，生效集合不变 |
| `gt.zones.search` | `min=[1485,61,512] max=[1443,49,482]` 三轴全倒置 → 区域判定永远 false | `min=[1443,49,482] max=[1485,61,512]` |
| `gt.zones.extract` | `min z=499 > max z=498` | `min z=498 max z=499` |
| `SELL_TIER_CAP` | `{gt:3, farm:3, mine:4, city:5, dam:6, jianyu:6}` 含 3 个已停用地图死键 | `{gt:3, jianyu:6, dam:6}`，0 死键 |
| `dam.cld` | 7 个点 vs 8 个 `exfils`，缺「东侧隧道」；注释称"依次对应上面7个"且顺序也不符 | 补 `'8': [1395,6,1064]`（由 `exfils.east.zone` 中心派生，非编造），注释改为 8 个 |
| `CONST.weight` | `'Block of Moonstone'` 同时出现在 `midItems:5` 与 `heavyItems:10`，代码按 light→mid→heavy 查询，heavy 永不生效 | 删 mid 的 5，保留 heavy 的 10（符合"块状物 8–15kg"注释） |
| `SELL_CATALOG` 重复键 | `'Coal'` 出现两次 → `SELL_INFO` Map 互相覆盖 | 删除重复条目，0 重复 |
| 注释漂移 | 文件头写「v2.3 重建版」但 `VERSION=v2.4`；箱体注释称"12 种箱子/全部换真实方块名/禁止武器"与实码矛盾 | 全部改为与实码一致的说明 |

### B. 无效载体清理（AI 追加的 Minecraft 幻想名）

- **诊断**：全配置 185 个载体名中 81 个不在官方三源名单内；排除 `EXTRACT.wool` 小写映射键、`Outfit: *` 自定义显示名后，**70 个是 AI 于 2026-11-13「扩充至 ~120 件」时编造的 MC 物品名**（`Paper`/`Redstone`/`TNT`/`Iron Ingot`/`Cooked Beef`/`Netherite Ingot`…）。这些名字在 bloxd 里不存在，永远无法产出、无法变卖。
- **处理**：`SELL_CATALOG` 删除 70 条幽灵条目（126 → 55，全部为有效名）；`SMALL_MOB.drops` 删除 5 条无效掉落；`CONST.weight` 删除 47 个无效重量键。
- **箱体主题保留**：47 处 `style.items` 载体 1:1 换成**经官方名单验证存在**的替代名（中文 `display`/概率/价格/稀有度全部不变），例如 `Golden Carrot→Gold Carrot`、`Bow→Wood Bow` 类思路、`TNT→Block Destroyer TNT`、`Nether Quartz→Chiseled Block of Quartz`。替换目标全部先验证 ∈ 5413 官方名集合。
- **被删除的 70 个名字**（便于日后按真名重新挂载）：
  `Paper, Written Book, Map, Paper Bundle, Brochure, Redstone, Redstone Repeater, Redstone Comparator, Piston, Sticky Piston, Observer, Dispenser, Dropper, Hopper, Detector Rail, Activator Rail, Powered Rail, Pressure Plate, Heavy Weight Pressure Plate, Lever, Tripwire Hook, Target, Daylight Sensor, Light Weighted Pressure Plate, Iron Trapdoor, Redstone Lamp, Nether Quartz, Glistering Melon Slice, Golden Carrot, Splash Potion, Lingering Potion, Sugar, Spider Eye, Fermented Spider Eye, Ghast Tear, Blaze Powder, Magma Cream, Nether Wart, Rabbit Foot, Nether Star, Iron Ingot, TNT, Gunpowder, Ender Pearl, Ender Eye, Blaze Rod, Wither Skull, Dragon Head, Shulker Shell, Iron N Hoe, Bow, Crossbow, Shield, Trident, Cooked Beef, Cooked Chicken, Cooked Rabbit, Cooked Salmon, Cooked Cod, Dried Kelp, Nether Gold Ore, Netherite Ingot, Ancient Debris, Redstone Ore, Glowstone, Prismarine Crystal, Sea Lantern, Conduit, Heart of the Sea, Kelp`

### C. 配对契约（写入 key == 读取 key）

`loot.js:255-257` 会把箱体 `items.value` 覆盖进 `SELL_VALUE_MAP`。首次替换后检测到 13 处「同名不同价」冲突，其中 **9 处由替换引入**（如变卖目录里 `Book=52000` 被箱体 `1800` 覆盖）。删除 14 条冲突箱体条目后仅剩 **3 处原有冲突**（`Block of Diamond`、`Block of Gold`、`Arrow`），属业务数值，未擅改。14 个箱子样式均仍有 2–10 个物品，无空箱。

### D. 仅加 TODO（不改数值/权限）

`CHECKIN.rewards` 第 4 档 180000 与第 3 档 12000 相差 15 倍、`CONST.whitelist` 的 `'Admin'/'Owner'` 通用名可被抢注提权、`jianyu` 的 `zones/spawn/cld` 全为 `[0,0,0]` 占位——均加醒目 TODO 注释，数据原样保留。

---

## 三、验证证据（原始输出）

```
静态：FINAL checked=38 syntax_failures=0 ｜ read_lints totalCount=0 ｜ config require OK(20 exports)
结构：CHEST_STYLES keys=14 duplicates=[] ｜ inverted_zones=0 ｜ SELL_TIER_CAP dead keys=0
      dam exfils=8 cld=8 ｜ SELL_CATALOG=55 duplicate_items=[]
载体：checked_carrier_names=118 INVALID=0
价格：VALUE_CONFLICT 13 → 3(全部为原有) ｜ 无 EMPTY_STYLE
真实调用探针(L0)：Mojin('dam') filled=27 distinct=27 filled_invalid=0
      calculateSellValue(Book+Moonstone)=6552000 (=52000+6500000)
      getMarkerLevel(嵌套附魔)=3
摸金池：tier分布 1:14/2:7/3:14/4:7/5:6/6:7 ｜ pool gt=48 jianyu=68 dam=66
冒烟：_smoke_admin 7 PASS/0 FAIL ｜ _smoke_esc 28/0 SMOKE_ALL_PASS ｜ _smoke_extra 30/0
```

清理：一次性迁移脚本 `_config_fix.js` / `_config_fix2.js` 已删除；`config.js.bak` 按纪律保留。

---

## 四、已知限制 / 剩余风险（强制披露）

1. **内容量变化**：变卖目录 126→55 条，箱体条目减少。被删的 70 条在游戏里本就永远无法产出，但**中文名/价格体系缩水**是事实；`config.js.bak` 可整文件回滚，也可按上面清单用真名重新挂载。
2. **载体语义贴合度**：部分替代载体是"同类真实物品"而非同名物（如「液压执行器」现载体为 `Crystal`），中文 display 未改，可能出现名实不符。建议按官方名重新对齐中文名。
3. **3 处原有价格冲突未修**：`Block of Diamond`(80000/200)、`Block of Gold`(240000/80)、`Arrow`(80/2)，最终价由箱体表覆盖；修它需服主确认目标价。
4. **Out 项未改**：白名单通用名（提权风险仍在）、签到第 4 档跳变、`jianyu` 全 0 坐标（该图实际不可用）。
5. **真机未验证**：本地静态 + mock 冒烟无法确认 bloxd 服务器对 `customDisplayName`/附魔/新载体的实际行为；官方名单也可能未覆盖全部客户端物品，建议真机抽查 `api.giveItem(pId,'Book',1)` 等。
6. **`_smoke_tmp.js` / `其它代码/test-smoke.js`** 仍为旧图 `farm/mine` 版本（4 PASS / 18 FAIL / 第 175 行崩溃），与本次改动无关，未修。
7. **无 VCS**：项目仍无 `.git`，回滚只靠 `config.js.bak`。

---

## 五、收尾报告

| 字段 | 内容 |
|---|---|
| 任务 | 修正 `config.js` 中所有可客观证伪的不合理位置（AI 改坏的部分） |
| 完成情况 | 4 条主线全部完成：①结构/坐标/死键 ②无效载体清理 ③价格契约 ④注释与一致性；Out 项仅标注 TODO |
| 关键决策 | 删除而非臆造替换幽灵条目；47 处箱体载体换成**官方名单验证过**的真名；先 `.bak` 备份保证可逆；业务数值/权限一律不动 |
| 验证证据 | 见第三节（语法/lint/结构自检/真实调用探针/3 个新版冒烟全通过） |
| 待办 | 真机抽查新载体 → 确认 3 处价格冲突 → 补 `jianyu` 坐标 → 白名单改 `getPlayerDbId` → 确认签到数值 → 授权重写旧测试 → `git init` |

**量化串**：`(已验证主线 4 / 总主线 4) × 100% = 100%`
**[治理] 支线**：`.bak` 备份、临时脚本清理、门禁细则加载（不计入量化串）

**回滚**：`Copy-Item config.js.bak config.js -Force`
