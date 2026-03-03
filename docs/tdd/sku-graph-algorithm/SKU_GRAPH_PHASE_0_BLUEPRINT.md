# 🔵 阶段 0：蓝灯阶段 - 复杂商品 SKU 算法技术设计提案

---

## 📋 文档基础信息

| 项目 | 规范详情 |
| :--- | :--- |
| 需求名称 | 复杂服务 SKU 无向图解析算法 |
| 文档版本 | V1.0 |
| 提案日期 | 2026 年 03 月 04 日 |
| 适用范围 | 宠物服务 O2O 项目 - 服务详情页 SKU 规格选择模块 |
| 核心目标 | 解决多维规格组合的高性能匹配与状态推导问题 |

---

## 一、需求核心目标与边界

### 1.1 核心目标

构建一套基于**图论算法**的 SKU 规格匹配引擎，实现：
- ✅ **毫秒级状态推导**：用户点击任意规格后，瞬间推导全盘其他规格的可用/禁用状态
- ✅ **多维组合支持**：支持 2-6 个维度的任意规格组合（宠物类型、体重、毛发、技师等）
- ✅ **稀疏组合优化**：针对后端返回的"有效 SKU 列表"（非全量笛卡尔积）进行高效匹配
- ✅ **零延迟交互**：杜绝传统嵌套循环导致的 UI 卡顿，提供丝滑的用户体验

### 1.2 需求边界

**包含的功能范围：**
- SKU 数据的图结构预处理与内存存储
- 用户选择状态的实时追踪与路径交集计算
- 规格按钮的 Disabled/Enabled 状态动态推导
- 已选规格的合法性校验与自动清理

**不包含的功能范围：**
- SKU 库存管理（库存数量、扣减逻辑）
- 价格计算逻辑（基础价、加价规则）
- 后端 API 接口设计与数据 fetch
- UI 组件的视觉样式设计（颜色、动效）

---

## 二、核心业务流梳理

### 2.1 用户操作路径

```
用户进入服务详情页
    ↓
页面加载，请求 SKU 数据
    ↓
前端构建图结构（内存预处理）
    ↓
渲染规格选择器（所有按钮初始可用）
    ↓
用户点击【宠物类型：猫】
    ↓
系统瞬间推导其他维度状态
    ├─ 体重：10kg 以下 (可用) | 10-20kg (禁用) | 20kg 以上 (禁用)
    ├─ 毛发：短毛 (可用) | 长毛 (禁用)
    └─ 技师：高级 (可用) | 初级 (禁用)
    ↓
用户继续点击【体重：10kg 以下】
    ↓
系统再次推导剩余维度状态
    ↓
用户点击【毛发：短毛】
    ↓
系统推导最后维度：技师：高级 (可用)
    ↓
用户点击【技师：高级】→ 完整 SKU 匹配成功
    ↓
显示对应价格、库存，允许加入购物车
```

### 2.2 数据流转逻辑

```
后端返回 (有效 SKU 列表)
    ↓
[
  { specs: ['猫', '10kg 以下', '短毛', '高级'], stock: 10, price: 199 },
  { specs: ['猫', '10kg 以下', '短毛', '初级'], stock: 5, price: 159 },
  { specs: ['狗', '20kg 以上', '长毛', '高级'], stock: 3, price: 299 },
  // ... 更多有效组合
]
    ↓
前端图结构预处理
    ↓
生成「连通路径字典」与「维度邻接矩阵」
    ↓
存储于响应式状态 (shallowRef)
    ↓
用户交互触发状态变更
    ↓
图路径交集计算 (O(1) 或 O(log n))
    ↓
输出每个规格项的 enabled/disabled 状态
    ↓
UI 层响应式更新按钮样式
```

---

## 三、商业级交互与异常场景补全

### 3.1 正常场景交互规范

| 交互行为 | 反馈机制 | 技术实现 |
| :--- | :--- | :--- |
| 点击可用规格 | 立即高亮选中，更新其他维度状态 | `handleSelect(spec)` + 图路径计算 |
| 点击已选规格 | 取消选中，重新推导全盘状态 | `handleDeselect(spec)` + 路径重算 |
| 点击禁用规格 | 无响应，可添加 shake 动效提示 | `@click.prevent` + 视觉反馈 |
| 完成有效选择 | 显示价格、库存、加入购物车按钮 | 匹配到唯一 SKU 后触发 |
| 选择过程中 | 显示"已选 X 项，共 N 个维度"进度提示 | 状态计数推导 |

### 3.2 异常场景补全

| 异常场景 | 处理策略 | 用户反馈 |
| :--- | :--- | :--- |
| 后端返回空 SKU 列表 | 显示"该服务暂无可用规格"，隐藏选择器 | Toast 提示 + 空状态 UI |
| 用户选择导致无匹配 SKU | 自动回退上一步选择，显示"该组合无货" | Toast + 自动取消选中 |
| 网络请求失败 | 重试机制 (最多 3 次)，失败后显示错误提示 | Loading + 重试按钮 |
| 规格数据格式异常 | 降级为传统循环匹配模式，记录错误日志 | 静默降级 + Sentry 上报 |
| 超大规格数据 (1000+ SKU) | Web Worker 异步计算，避免阻塞主线程 | Loading 骨架屏 |

### 3.3 防御性交互设计

```typescript
// 伪代码示例：点击处理的防御性编程
const handleSpecClick = async (dimensionIndex: number, specValue: string) => {
  // 1. 防抖拦截 (300ms)
  if (isComputing.value) return
  
  // 2. 禁用状态拦截
  if (!isSpecEnabled(dimensionIndex, specValue)) {
    triggerShakeAnimation(dimensionIndex, specValue)
    return
  }
  
  // 3. 状态更新与图计算
  isComputing.value = true
  try {
    updateSelectedSpecs(dimensionIndex, specValue)
    const newState = computeGraphIntersection(selectedSpecs.value)
    
    // 4. 合法性校验
    if (!newState.hasValidPath) {
      showToast('该组合暂无库存')
      revertLastSelection() // 自动回退
      return
    }
    
    // 5. 更新 UI 状态
    updateDimensionStates(newState)
  } catch (error) {
    // 6. 异常兜底
    logError(error)
    fallbackToBruteForce(selectedSpecs.value)
  } finally {
    isComputing.value = false
  }
}
```

---

## 四、技术实现架构方案

### 4.1 算法选型降维打击：无向图 vs 邻接矩阵 vs 前缀树

#### 方案对比分析

| 算法方案 | 核心思想 | 时间复杂度 | 空间复杂度 | 适用场景 | 本项目选择 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **无向图 (Undirected Graph)** | 将每个规格视为节点，有效 SKU 视为路径 | 路径查询 O(E+V) | O(N×D) | 稀疏组合、动态推导 | ✅ **主选方案** |
| 邻接矩阵 (Adjacency Matrix) | D×D 矩阵存储维度间连通性 | 查询 O(1) | O(D²×S²) | 维度少、规格密集 | 辅助优化 |
| 前缀树 (Trie Tree) | 按维度顺序构建决策树 | 查询 O(D) | O(N×D) | 维度顺序固定 | 备选方案 |
| 暴力嵌套循环 | 传统 for 循环遍历匹配 | 查询 O(N×D) | O(1) | 小规模数据 | ❌ 淘汰 |

**符号说明：**
- N = SKU 数量 (有效组合数)
- D = 维度数量 (如 4 个维度)
- S = 单个维度的规格数量 (如 5 个宠物类型)
- E = 图的边数，V = 节点数

#### 核心选型理由：为什么是无向图？

```
传统暴力匹配的问题：
用户每次点击 → 遍历所有 SKU (N) × 检查每个维度 (D) → O(N×D)
假设 N=1000, D=4 → 4000 次比较/次点击 → 明显卡顿

无向图方案的优势：
预处理阶段：构建图结构 O(N×D) → 仅执行 1 次
查询阶段：路径交集计算 O(D) 或 O(1) → 每次点击仅需数次哈希查找
假设 N=1000, D=4 → 预处理 4000 次，后续每次点击 <10 次操作 → 丝滑流畅

关键洞察：
SKU 匹配本质是「多维约束满足问题」(CSP)
无向图将「组合匹配」转化为「路径连通性判断」
利用图的连通性，实现指数级加速
```

### 4.2 图的初始化预处理：构建连通路径字典

#### 4.2.1 数据结构定义

```typescript
// 类型定义 (保存至 utils/sku-graph/types.ts)

/**
 * 单个规格项
 */
interface SpecNode {
  dimensionIndex: number  // 维度索引 (0: 宠物类型，1: 体重，...)
  value: string           // 规格值 ('猫', '10kg 以下', ...)
  id: string              // 唯一标识 `dim${dimensionIndex}:${value}`
}

/**
 * 有效 SKU 路径 (图的一条路径)
 */
interface SkuPath {
  skuId: string
  nodes: SpecNode[]       // 按维度顺序排列的节点
  stock: number
  price: number
}

/**
 * 连通路径字典 (核心数据结构)
 * Key: 规格节点的 ID
 * Value: 经过该节点的所有 SKU 路径 ID 集合
 */
type PathMap = Map<string, Set<string>>

/**
 * 图结构总览
 */
interface SkuGraph {
  pathMap: PathMap        // 路径字典
  paths: Map<string, SkuPath>  // 路径存储
  dimensionCount: number  // 维度总数
}
```

#### 4.2.2 图构建算法伪代码

```typescript
// 伪代码：图结构预处理 (保存至 utils/sku-graph/graph-builder.ts)

function buildSkuGraph(
  skuList: SkuDTO[],
  dimensions: Dimension[]
): SkuGraph {
  const pathMap = new Map<string, Set<string>>()
  const paths = new Map<string, SkuPath>()
  
  // 步骤 1: 遍历每个 SKU，构建路径
  for (const sku of skuList) {
    const skuId = `sku_${sku.id}`
    const nodes: SpecNode[] = []
    
    // 步骤 2: 为 SKU 的每个规格创建节点
    for (let i = 0; i < sku.specs.length; i++) {
      const node: SpecNode = {
        dimensionIndex: i,
        value: sku.specs[i],
        id: `dim${i}:${sku.specs[i]}`
      }
      nodes.push(node)
      
      // 步骤 3: 更新路径字典
      // 核心思想：每个规格节点记录"哪些 SKU 路径经过我"
      if (!pathMap.has(node.id)) {
        pathMap.set(node.id, new Set())
      }
      pathMap.get(node.id)!.add(skuId)
    }
    
    // 步骤 4: 存储完整路径
    paths.set(skuId, {
      skuId,
      nodes,
      stock: sku.stock,
      price: sku.price
    })
  }
  
  return {
    pathMap,
    paths,
    dimensionCount: dimensions.length
  }
}
```

#### 4.2.3 示例：后端数据 → 图结构转换

**后端返回的 SKU 列表：**
```json
[
  { "id": "1", "specs": ["猫", "10kg 以下", "短毛"], "stock": 10, "price": 199 },
  { "id": "2", "specs": ["猫", "10kg 以下", "长毛"], "stock": 5, "price": 219 },
  { "id": "3", "specs": ["狗", "20kg 以上", "长毛"], "stock": 3, "price": 299 }
]
```

**构建的路径字典 (PathMap) 示意：**
```
PathMap = {
  "dim0:猫"     → Set { "sku_1", "sku_2" }
  "dim0:狗"     → Set { "sku_3" }
  "dim1:10kg 以下" → Set { "sku_1", "sku_2" }
  "dim1:20kg 以上" → Set { "sku_3" }
  "dim2:短毛"   → Set { "sku_1" }
  "dim2:长毛"   → Set { "sku_2", "sku_3" }
}
```

**可视化图结构：**
```
        [猫] ─────┬───── [10kg 以下] ──┬── [短毛] (SKU 1)
                  │                   └── [长毛] (SKU 2)
                  │
        [狗] ─────┴───── [20kg 以上] ──── [长毛] (SKU 3)
```

### 4.3 状态秒级推导逻辑：路径交集算法

#### 4.3.1 核心算法思想

```
问题定义：
用户已选择部分规格 → 判断其他规格是否可用

算法核心：
规格 A 可用 ⇔ 存在至少一个 SKU 路径，同时满足：
  1. 经过用户已选的所有规格节点
  2. 经过规格 A 的节点

数学表达：
enabled(SpecA) = (Path(selected₁) ∩ Path(selected₂) ∩ ... ∩ Path(SpecA)) ≠ ∅

其中 Path(node) 表示经过该节点的所有 SKU 路径集合
```

#### 4.3.2 O(1) 复杂度推导算法

```typescript
// 伪代码：状态推导引擎 (保存至 utils/sku-graph/state-engine.ts)

interface DerivedState {
  enabledSpecs: Map<number, Set<string>>  // 每个维度可用的规格
  hasValidPath: boolean                   // 是否存在有效 SKU
  matchedSkuIds: string[]                 // 匹配的 SKU ID 列表
}

function computeEnabledSpecs(
  graph: SkuGraph,
  selectedSpecs: SpecNode[]
): DerivedState {
  // 步骤 1: 获取已选规格的路径集合
  let intersection: Set<string> | null = null
  
  for (const selected of selectedSpecs) {
    const paths = graph.pathMap.get(selected.id)
    
    if (!paths || paths.size === 0) {
      // 已选规格无任何路径 → 直接返回空状态
      return { enabledSpecs: new Map(), hasValidPath: false, matchedSkuIds: [] }
    }
    
    // 步骤 2: 路径交集计算 (核心优化点)
    if (intersection === null) {
      intersection = new Set(paths)  // 第一个集合
    } else {
      // 集合交集运算 (浏览器原生优化，接近 O(1))
      intersection = new Set(
        [...intersection].filter(id => paths.has(id))
      )
    }
    
    // 提前终止：交集为空 → 无匹配 SKU
    if (intersection.size === 0) {
      return { enabledSpecs: new Map(), hasValidPath: false, matchedSkuIds: [] }
    }
  }
  
  // 步骤 3: 基于交集推导所有未选维度的可用规格
  const enabledSpecs = new Map<number, Set<string>>()
  
  for (let dimIdx = 0; dimIdx < graph.dimensionCount; dimIdx++) {
    // 跳过已选维度
    if (selectedSpecs.some(s => s.dimensionIndex === dimIdx)) {
      continue
    }
    
    const enabledSet = new Set<string>()
    
    // 遍历当前维度的所有规格，检查是否与交集有重叠
    for (const [nodeId, paths] of graph.pathMap.entries()) {
      const node = parseNodeId(nodeId)  // 解析出 dimensionIndex 和 value
      
      if (node.dimensionIndex === dimIdx) {
        // 检查：该规格的路径集合 与 当前交集 是否有重叠
        const hasOverlap = [...paths].some(id => intersection!.has(id))
        
        if (hasOverlap) {
          enabledSet.add(node.value)
        }
      }
    }
    
    enabledSpecs.set(dimIdx, enabledSet)
  }
  
  return {
    enabledSpecs,
    hasValidPath: intersection!.size > 0,
    matchedSkuIds: [...intersection!]
  }
}
```

#### 4.3.3 算法复杂度分析

| 操作 | 传统暴力法 | 图路径交集法 | 加速比 |
| :--- | :--- | :--- | :--- |
| 单次点击推导 | O(N×D) | O(D + S×D) ≈ O(D×S) | **N/S 倍** |
| 实际场景 (N=1000, S=5, D=4) | 4000 次比较 | ~20 次集合运算 | **200 倍** |
| 最坏情况 (全量笛卡尔积) | O(N×D) | O(D) | **N 倍** |

**关键优化点：**
1. **集合运算由浏览器引擎优化**：`Set` 的交集运算底层为哈希表操作，接近 O(1)
2. **提前终止**：一旦交集为空，立即返回，避免无效计算
3. **增量更新**：用户每次仅变更一个规格，可复用上次交集结果进一步优化

#### 4.3.4 实战演示：用户点击推导过程

**初始状态：**
```
用户已选：无
推导结果：所有规格均可用
```

**用户点击【宠物类型：猫】后：**
```typescript
selectedSpecs = [{ dimensionIndex: 0, value: '猫', id: 'dim0:猫' }]

// 步骤 1: 获取路径集合
paths('dim0:猫') = { 'sku_1', 'sku_2' }
intersection = { 'sku_1', 'sku_2' }

// 步骤 2: 推导其他维度
维度 1 (体重):
  - '10kg 以下': paths = { 'sku_1', 'sku_2' } ∩ intersection ≠ ∅ → ✅ 可用
  - '20kg 以上': paths = { 'sku_3' } ∩ intersection = ∅ → ❌ 禁用

维度 2 (毛发):
  - '短毛': paths = { 'sku_1' } ∩ intersection ≠ ∅ → ✅ 可用
  - '长毛': paths = { 'sku_2', 'sku_3' } ∩ intersection ≠ ∅ → ✅ 可用

输出状态:
  体重：[10kg 以下 ✅, 20kg 以上 ❌]
  毛发：[短毛 ✅, 长毛 ✅]
```

**用户继续点击【体重：10kg 以下】后：**
```typescript
selectedSpecs = [
  { dimensionIndex: 0, value: '猫', id: 'dim0:猫' },
  { dimensionIndex: 1, value: '10kg 以下', id: 'dim1:10kg 以下' }
]

// 步骤 1: 路径交集
paths('dim0:猫') = { 'sku_1', 'sku_2' }
paths('dim1:10kg 以下') = { 'sku_1', 'sku_2' }
intersection = { 'sku_1', 'sku_2' } ∩ { 'sku_1', 'sku_2' } = { 'sku_1', 'sku_2' }

// 步骤 2: 推导剩余维度
维度 2 (毛发):
  - '短毛': paths = { 'sku_1' } ∩ { 'sku_1', 'sku_2' } ≠ ∅ → ✅ 可用
  - '长毛': paths = { 'sku_2', 'sku_3' } ∩ { 'sku_1', 'sku_2' } ≠ ∅ → ✅ 可用

输出状态:
  毛发：[短毛 ✅, 长毛 ✅]
```

**用户继续点击【毛发：短毛】后：**
```typescript
selectedSpecs = [
  { dimensionIndex: 0, value: '猫', id: 'dim0:猫' },
  { dimensionIndex: 1, value: '10kg 以下', id: 'dim1:10kg 以下' },
  { dimensionIndex: 2, value: '短毛', id: 'dim2:短毛' }
]

// 步骤 1: 路径交集
paths('dim2:短毛') = { 'sku_1' }
intersection = { 'sku_1', 'sku_2' } ∩ { 'sku_1' } = { 'sku_1' }

// 步骤 2: 推导剩余维度
无剩余维度 → 匹配完成

输出状态:
  匹配到唯一 SKU: sku_1 (猫 + 10kg 以下 + 短毛)
  价格：199 元，库存：10
```

---

## 五、文件结构与模块拆分

### 5.1 目录结构规划

```
utils/sku-graph/
├── types.ts                    # 类型定义
├── graph-builder.ts            # 图构建器 (纯函数)
├── state-engine.ts             # 状态推导引擎 (纯函数)
├── index.ts                    # 统一导出
└── __tests__/
    ├── graph-builder.test.ts   # 图构建测试
    └── state-engine.test.ts    # 状态推导测试

composables/
└── use-sku-selector.ts         # SKU 选择器组合式函数 (视图层胶水逻辑)

components/
└── service-sku-selector/
    └── ServiceSkuSelector.vue  # SKU 选择器 UI 组件
```

### 5.2 模块职责划分

| 模块 | 职责 | 依赖 | 测试策略 |
| :--- | :--- | :--- | :--- |
| `graph-builder.ts` | 将后端 SKU 数据转换为图结构 | 无 (纯函数) | 单元测试：输入 SKU 列表 → 验证图结构正确性 |
| `state-engine.ts` | 基于图和已选规格推导可用状态 | 依赖 graph-builder 的输出 | 单元测试：模拟点击场景 → 验证推导结果 |
| `use-sku-selector.ts` | 整合图引擎与 UI 状态管理 | 依赖上述两个模块 | 集成测试：模拟用户交互 → 验证 UI 状态变化 |
| `ServiceSkuSelector.vue` | 渲染规格选择器 UI | 依赖 composables | 组件测试：mount + 交互 → 验证 DOM 更新 |

### 5.3 关键技术实现细节

#### 5.3.1 使用 `shallowRef` 优化大对象响应式

```typescript
// 图结构数据量大，但无需深层响应式
const skuGraph = shallowRef<SkuGraph | null>(null)

// 仅当图结构整体替换时触发更新
skuGraph.value = buildSkuGraph(skuList, dimensions)

// 推导状态使用普通 ref 即可
const derivedState = ref<DerivedState | null>(null)
```

#### 5.3.2 使用 `lodash-es` 优化集合运算

```typescript
import { intersection as lodashIntersection } from 'lodash-es'

// 替代原生 Set 交集运算 (更简洁，性能相当)
const intersection = lodashIntersection([...set1], [...set2])
```

#### 5.3.3 使用 `@vueuse/core` 处理防抖与加载状态

```typescript
import { useThrottleFn, useToggle } from '@vueuse/core'

// 防抖处理 (300ms)
const debouncedComputeState = useThrottleFn(computeState, 300)

// loading 状态切换
const [isComputing, toggleComputing] = useToggle(false)
```

---

## 六、后续测试覆盖范围规划

### 6.1 单元测试覆盖场景

| 测试模块 | 测试场景 | 测试类型 | 优先级 |
| :--- | :--- | :--- | :--- |
| `graph-builder.test.ts` | 空 SKU 列表 → 空图 | 边界值 | P0 |
| `graph-builder.test.ts` | 单 SKU → 单路径图 | 正常流 | P0 |
| `graph-builder.test.ts` | 多 SKU 共享规格 → 路径正确合并 | 正常流 | P0 |
| `graph-builder.test.ts` | 规格值含特殊字符 → ID 转义正确 | 异常流 | P1 |
| `state-engine.test.ts` | 无已选规格 → 全部可用 | 正常流 | P0 |
| `state-engine.test.ts` | 已选 1 个规格 → 正确推导其他维度 | 正常流 | P0 |
| `state-engine.test.ts` | 已选导致无匹配 → 返回空状态 | 异常流 | P0 |
| `state-engine.test.ts` | 完成全维度选择 → 匹配唯一 SKU | 正常流 | P0 |
| `state-engine.test.ts` | 取消已选规格 → 状态正确回退 | 正常流 | P1 |
| `state-engine.test.ts` | 超大 SKU 数据 (10000 条) → 性能达标 | 边界值 | P1 |

### 6.2 集成测试覆盖场景

| 测试场景 | 测试步骤 | 预期结果 |
| :--- | :--- | :--- |
| 完整用户选择流程 | 依次点击各维度规格 → 完成匹配 | 最终匹配到正确 SKU，价格库存正确显示 |
| 中途取消选择 | 选择 2 个规格 → 取消 1 个 → 状态重新推导 | 取消后可用规格正确更新 |
| 无效组合自动回退 | 选择导致无匹配的规格 → 自动回退 | Toast 提示 + 自动取消选中 |
| 网络异常降级 | Mock 空数据 → 显示错误提示 | 空状态 UI + 重试按钮 |

---

## 七、技术风险与应对策略

| 风险点 | 风险等级 | 应对策略 |
| :--- | :--- | :--- |
| 超大规格数据 (10000+ SKU) | 中 | Web Worker 异步计算 + 虚拟滚动 |
| 维度数量过多 (6+ 维度) | 低 | 限制最大维度数 + 分步选择 UI |
| 规格值重复 (不同维度同名) | 低 | 节点 ID 包含维度索引前缀 `dim${idx}:` |
| 后端数据格式变更 | 中 | Zod 运行时校验 + 降级策略 |
| 内存泄漏 (频繁创建 Set) | 低 | 对象池复用 + 定期 GC 提示 |

---

## 八、验收标准

### 8.1 功能验收

- ✅ 图结构正确构建，路径字典完整准确
- ✅ 状态推导算法正确，所有场景推导结果准确
- ✅ 用户交互流畅，点击后状态更新无明显延迟 (<50ms)
- ✅ 异常场景处理完善，无崩溃、无卡死

### 8.2 性能验收

| 指标 | 目标值 | 测试条件 |
| :--- | :--- | :--- |
| 图构建耗时 | <100ms | SKU 数量 1000 条 |
| 单次点击推导耗时 | <30ms | 已选 1-3 个规格 |
| 内存占用 | <10MB | SKU 数量 1000 条 |
| 长列表渲染帧率 | >55fps | 规格项 50+ 个 |

### 8.3 代码质量验收

- ✅ 单元测试覆盖率 >90% (分支覆盖 + 语句覆盖)
- ✅ TypeScript 严格模式零报错
- ✅ ESLint/Prettier 零警告
- ✅ 无 `any` 类型，类型定义完整

---

## 九、后续阶段规划

| 阶段 | 核心任务 | 输出物 | 预计耗时 |
| :--- | :--- | :--- | :--- |
| 🔴 红灯阶段 | 编写图构建器、状态引擎的单元测试 | 测试文件 + 红灯验证报告 | 2-3 小时 |
| 🟢 绿灯阶段 | 实现图算法核心逻辑 + 组合式函数 | 可运行代码 + 绿灯测试报告 | 3-4 小时 |
| 🟣 重构阶段 | 代码重构优化 + 性能调优 | 重构报告 + 回归测试报告 | 2-3 小时 |

---

## 十、推荐文档归档路径

```
docs/tdd/sku-graph-algorithm/
├── SKU_GRAPH_PHASE_0_BLUEPRINT.md    ← 本文档
├── SKU_GRAPH_PHASE_1_RED.md          ← 下一阶段输出
├── SKU_GRAPH_PHASE_2_GREEN.md        ← 后续阶段输出
└── SKU_GRAPH_PHASE_3_REFACTOR.md     ← 最终阶段输出
```

---

## 📌 总结

本提案基于**无向图路径交集算法**，为复杂 SKU 规格匹配问题提供了一套完整的解决方案：

### 核心创新点

1. **图论思想降维打击**：将组合匹配问题转化为路径连通性判断，实现指数级加速
2. **O(1) 复杂度推导**：利用集合交集运算，单次点击仅需数次哈希查找
3. **稀疏组合优化**：针对非全量笛卡尔积场景，避免无效计算
4. **纯函数架构**：核心算法与 UI 完全解耦，易于测试与维护

### 商业价值

- **用户体验提升**：消除选择卡顿，提供丝滑流畅的交互体验
- **转化率提升**：快速匹配 SKU，减少用户流失
- **可复用性强**：算法可推广至电商、票务、预约等多维选择场景

---

**提案输出完毕**，等待您的审批指令。

> 以上是该需求的交互与技术设计提案，请问是否同意？（同意后我将进入🔴红灯阶段，编写对应自动化测试用例）
