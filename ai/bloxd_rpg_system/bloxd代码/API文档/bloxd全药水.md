下面我直接**把原文拆分**：
- 纯英文、适合写进代码 / 变量 / 枚举的部分：保留 **英文**
- 说明、介绍、文案部分：全部换成 **中文**
并整理成清晰的 Markdown，方便你直接拿去写代码文档。

# Potions（Bloxd.io 药水系统）
## 基础信息
- 最大堆叠：`1`
- 类型：`Potions`, `Potions2`

药水是 Bloxd.io 中的消耗品，使用后会给玩家提供**临时效果**。
两个普通药水可合成 **喷溅型药水（splash potion）**，投掷使用，落地后对小范围内玩家生效。

---

# 一、酿造系统（Brewing）
## 1.1 药水台（Potion Table）
- 合成：任意木板 ×4 + 玻璃 ×2
- 无碰撞体积（no hitbox）
- 常用于代码示例演示合成逻辑

## 1.2 材料（Ingredients）
以下为代码中常用的**英文 ID**，左侧是材料名，括号内是效果：
- `Melon Slice` → 隐身
- `Watermelon Slice` → 跳跃提升
- `Cactus` → 中毒
- `Pumpkins` → 虚弱
- `Pear` → 伤害抵抗
- `Apple` → 瞬间治疗
- `Poppy` → 缓慢
- `Plum` → 伤害
- `Cracked Coconut` → 速度
- `Moonstone` → 升级为 II 级
- `Full Bowl Of Cranberries` → 急迫
- `Cherry` → 生命恢复
- `Corn` → 护盾
- `Chili Pepper` → 抗火
- `Aura XP Orb` → 灵气经验
- `Rotten Brain` → 脑腐

## 1.3 喷溅药水（Splash Potions）
- 效果范围：落地小半径
- 持续时间**短于普通药水**
- 投掷后不返还瓶子
- 用途：团队治疗、范围伤害、快速给自己上buff

## 1.4 药水升级（Upgrading potions）
- 用 `Moonstone` 升级：
  - `Strength`
  - `Defense`
  - `Speed`
- 用 `Iron Bar` 升级：其余可升级药水
- **无法升级的药水**：
  - `Milk Potions`
  - `Chaos Potions`
  - `Brain Rot Potion`
  - `Double Jump Potion`
  - `Knockback Potion`
  - `X-ray Vision Potion`

## 1.5 效果箭（Arrows with effects）
- 合成台：药水台
- 配方：任意普通药水 ×1 + 箭 ×3 → 效果箭 ×3
- 箭无法升级为 II 级

---

# 二、获取方式（Obtaining）
所有药水均通过**药水台酿造**获得，以下是**代码级配方**（中文说明）：

## 力量药水 Strength Potion
- 基础：`Water Bottle + Plum`
- II 级：`Strength Potion + Moonstone`
- 喷溅：`2 × Strength Potion`
- 喷溅 II：`Splash Strength + Iron Bar`

## 防御药水 Defense Potion
- 基础：`Water Bottle + Pear`
- II 级：`Defense Potion + Moonstone`
- 喷溅：`2 × Defense Potion`
- 喷溅 II：`Splash Defense + Iron Bar`

## 速度药水 Speed Potion
- 基础：`Cracked Coconut + Water Bottle`
- II 级：`Speed Potion + Moonstone`
- 喷溅：`2 × Speed Potion`
- 喷溅 II：`Splash Speed + Iron Bar`

## 跳跃药水 Jump Potion
- 基础：`Watermelon Slice + Water Bottle`
- II 级：`Jump Potion + Iron Bar`
- 喷溅：`2 × Jump Potion`
- 喷溅 II：`Splash Jump + Iron Bar`

## 隐身药水 Invisibility Potion
- 基础：`Melon Slice + Water Bottle`
- 喷溅：`2 × Invisibility Potion`
- 时长：普通 12s / 喷溅 8s

## 急迫药水 Haste Potion
- 基础：`Full Bowl of Cranberries + Water Bottle`
- II 级：`Haste Potion + Iron Bar`
- 喷溅：`2 × Haste Potion`
- 喷溅 II：`Splash Haste + Iron Bar`

## 生命恢复 Regeneration Potion
- 基础：`Cherry + Melon Slice + Water Bottle`
- II 级：`Regeneration Potion + Iron Bar`
- 喷溅：`2 × Regeneration Potion`
- 喷溅 II：`Splash Regeneration + Iron Bar`

## 瞬间治疗 Instant Healing
- 基础：`Water Bottle + Apple + Watermelon Slice`
- II 级：`Instant Healing + Iron Bar`
- 喷溅：`2 × Instant Healing`
- 喷溅 II：`Splash Instant Healing + Iron Bar`

## 瞬间伤害 Instant Damage
- 基础：`Water Bottle + Cactus + Pumpkin Pie`
- II 级：`Instant Damage + Iron Bar`
- 喷溅：`2 × Instant Damage`
- 喷溅 II：`Splash Instant Damage + Iron Bar`

## 虚弱药水 Weakness Potion
- 基础：`Pumpkin + Water Bottle`
- II 级：`Weakness Potion + Iron Bar`
- 喷溅：`2 × Weakness Potion`
- 喷溅 II：`Splash Weakness + Iron Bar`

## 中毒药水 Poison Potion
- 基础：`Cactus + Water Bottle`
- II 级：`Poison Potion + Iron Bar`
- 喷溅：`2 × Poison Potion`
- 喷溅 II：`Splash Poison + Iron Bar`

## 缓慢药水 Slowness Potion
- 基础：`Bread + Poppy + Water Bottle`
- II 级：`Slowness Potion + Iron Bar`
- 喷溅：`2 × Slowness Potion`
- 喷溅 II：`Splash Slowness + Iron Bar`

## 护盾药水 Shield Potion
- 基础：`Corn + Water Bottle`
- II 级：`Shield Potion + Iron Bar`
- 喷溅：`2 × Shield Potion`
- 喷溅 II：`Splash Shield + Iron Bar`

## 击退药水 Knockback Potion
- 基础：`Mango + Water Bottle`
- 喷溅：`2 × Knockback Potion`
- 喷溅 II：`Splash Knockback + Iron Bar`

## 抗火药水 Heat Resistance
- 基础：`Chili Pepper + Water Bottle`
- 喷溅：`2 × Heat Resistance Potion`

## 灵气经验 Aura XP Potion
- 配方：`Water Bottle + 3 × Aura XP Orb`

## 二段跳 Double Jump Potion
- 基础：`Banana + Water Bottle`
- 喷溅：`2 × Double Jump Potion`

---

# 三、牛奶（Milk）
- 获取：空瓶子对牛使用
- 喷溅牛奶：`2 × Milk Potion` + `2 × Iron Bar`
- 效果：清除所有负面/正面效果

---

# 四、效果对照表（代码常量推荐）
| 药水英文ID             | 效果中文名       | 时长规则               | 效果说明 |
|------------------------|------------------|------------------------|----------|
| Strength               | 力量             | 普通8s / II12s / 喷溅8s | I+35%伤害；II+50%伤害 |
| Defense                | 防御             | 15s / 喷溅8s           | I减伤40%；II减伤50% |
| Speed                  | 速度             | 8s                     | I+50%移速；II+120% |
| Jump                   | 跳跃提升         | 12s / 喷溅8s           | I+2格；II+6格 |
| Invisibility           | 隐身             | 12s / 喷溅8s           | 隐身，受击/攻击会解除 |
| Haste                  | 急迫             | 50s / 喷溅8s           | I2倍挖掘；II3倍 |
| Regeneration           | 生命恢复         | 12s / 喷溅8s           | I每秒+5血；II+8血 |
| InstantHealing         | 瞬间治疗         | 瞬间                   | I+30血；II+50血 |
| Milk                   | 牛奶             | 瞬间                   | 清除所有效果 |
| Weakness               | 虚弱             | 12s / 喷溅8s           | I多受20%伤；II多30% |
| InstantDamage          | 瞬间伤害         | 瞬间                   | I造成30伤；II60伤 |
| Poison                 | 中毒             | 12s / 喷溅8s           | I每秒-5血；II-7血 |
| Slowness               | 缓慢             | 12s / 喷溅8s           | I减速30%；II40% |
| Shield                 | 护盾             | 瞬间                   | I30盾；II40盾 |
| Knockback              | 击退             | 瞬间                   | I击飞13格；II30格 |
| HeatResistance         | 抗火             | 12s / 喷溅8s           | 免疫岩浆伤害 |

---

# 五、其他特殊效果（代码可用 ID）
- `Chaos Potion`：随机 2 正 1 负效果
- `Bunny Hop`：连续跳跃触发，分 3 阶段
- `Home Turf`：彩弹模式己方色块加速
- `Enemy Turf`：彩弹模式敌方色块减速
- `Frozen`：冰冻，无法移动
- `Air Walking`：空中行走
- `Thief`：无法开铁箱
- `Rafter's Sea Sickness Immunity`：海盗模式免疫晕船
- `Rafter's Sea Sickness II`：海盗模式类似中毒 II
- `Thorns`：荆棘反伤（代码调用）

---

如果你需要，我可以**直接帮你生成一份可复制的 C++/JS 枚举代码**，把所有 potion 名字、效果、时长都写成常量。