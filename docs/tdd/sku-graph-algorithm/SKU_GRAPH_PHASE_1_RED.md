# 🔴 阶段 1：红灯阶段 - 测试先行，定义验收标准

---

## 📋 文档基础信息

| 项目 | 规范详情 |
| :--- | :--- |
| 需求名称 | 复杂服务 SKU 无向图解析算法 |
| 文档版本 | V1.0 |
| 提案日期 | 2026 年 03 月 04 日 |
| 阶段状态 | ✅ 红灯验证通过 |
| 测试结果 | 42 个测试失败，红灯状态有效 |

---

## 一、测试文件清单

### 1.1 已创建的文件

| 文件路径 | 文件类型 | 说明 |
| :--- | :--- | :--- |
| `utils/sku-graph/types.ts` | 类型定义 | 完整的类型定义文件 |
| `utils/sku-graph/graph-builder.ts` | 空壳文件 | 仅函数签名，内部 `throw Error` |
| `utils/sku-graph/state-engine.ts` | 空壳文件 | 仅函数签名，内部 `throw Error` |
| `utils/sku-graph/index.ts` | 导出文件 | 统一导出入口 |
| `utils/sku-graph/__tests__/graph-builder.test.ts` | 测试文件 | 图构建器测试用例 |
| `utils/sku-graph/__tests__/state-engine.test.ts` | 测试文件 | 状态推导引擎测试用例 |

---

## 二、测试用例覆盖范围

### 2.1 图构建器测试 (graph-builder.test.ts)

| 测试分组 | 测试场景 | 测试类型 |
| :--- | :--- | :--- |
| **parseNodeId** | 标准格式节点 ID 解析 | 正常流 |
| **parseNodeId** | 包含特殊字符的规格值解析 | 正常流 |
| **parseNodeId** | 格式错误的节点 ID 抛错 | 异常流 |
| **generateNodeId** | 生成标准格式节点 ID | 正常流 |
| **generateNodeId** | 包含空格的规格值处理 | 正常流 |
| **extractDimensions** | 提取 3 维度 SKU 的所有维度 | 正常流 |
| **extractDimensions** | 空 SKU 列表返回空数组 | 边界值 |
| **validateSkuList** | 有效 SKU 列表验证 | 正常流 |
| **validateSkuList** | 缺少必填字段验证失败 | 异常流 |
| **validateSkuList** | 空数组验证通过 | 边界值 |
| **buildSkuGraph** | 空 SKU 列表返回空图 | 边界值 |
| **buildSkuGraph** | 单 SKU 构建单路径图 | 正常流 |
| **buildSkuGraph** | 多 SKU 共享规格路径合并 | 正常流 |
| **buildSkuGraph** | 包含特殊字符的规格值处理 | 正常流 |
| **buildSkuGraph** | 4 维度 SKU 正确构建 | 正常流 |
| **buildSkuGraph** | 路径对象包含完整信息 | 正常流 |
| **边界值测试** | 超大 SKU 列表（100 条） | 边界值 |
| **边界值测试** | 规格值为空字符串 | 边界值 |

### 2.2 状态推导引擎测试 (state-engine.test.ts)

| 测试分组 | 测试场景 | 测试类型 |
| :--- | :--- | :--- |
| **createSelectionState** | 创建空的初始状态 | 正常流 |
| **updateSelection** | 添加选择更新状态 | 正常流 |
| **updateSelection** | 取消选择（传入 null） | 正常流 |
| **updateSelection** | 替换同一维度的选择 | 正常流 |
| **computePathIntersection** | 空选择返回所有路径 | 正常流 |
| **computePathIntersection** | 单选择返回经过节点的路径 | 正常流 |
| **computePathIntersection** | 多选择返回交集路径 | 正常流 |
| **computePathIntersection** | 无效组合返回空集合 | 异常流 |
| **computeEnabledSpecs** | 无已选规格全部可用 | 正常流 |
| **computeEnabledSpecs** | 选中"猫"推导其他维度 | 正常流 |
| **computeEnabledSpecs** | 选中"狗"推导其他维度 | 正常流 |
| **computeEnabledSpecs** | 选中两个维度推导剩余 | 正常流 |
| **computeEnabledSpecs** | 选中所有维度匹配唯一 SKU | 正常流 |
| **computeEnabledSpecs** | 无效组合返回 hasValidPath: false | 异常流 |
| **computeEnabledSpecs** | 不存在的规格值返回无效 | 异常流 |
| **isSpecEnabled** | 规格在 enabledSpecs 中返回 true | 正常流 |
| **isSpecEnabled** | 规格不在 enabledSpecs 中返回 false | 正常流 |
| **isSpecEnabled** | 维度不存在返回 false | 异常流 |
| **getMatchedSku** | 存在唯一匹配返回 SKU 对象 | 正常流 |
| **getMatchedSku** | 无匹配返回 null | 异常流 |
| **getMatchedSku** | 多匹配返回第一个 SKU | 正常流 |
| **完整用户流程** | 依次选择规格正确推导每步 | 正常流 |
| **完整用户流程** | 取消选择正确回退状态 | 正常流 |
| **边界值测试** | 超大 SKU 数据（100 条） | 边界值 |
| **边界值测试** | 空图结构返回无效状态 | 边界值 |

---

## 三、红灯验证结果

### 3.1 测试执行命令

```bash
npx vitest run --reporter=verbose
```

### 3.2 测试结果统计

```
 Test Files  2 failed | 2 passed (4)
      Tests  42 failed | 18 passed (60)
   Start at  01:20:19
   Duration  981ms
```

### 3.3 红灯状态验证

✅ **红灯状态有效！**

所有核心业务逻辑测试用例均因空壳函数抛出 `Error: 🔴 红灯阶段：此函数尚未实现` 而失败，证明：

1. **测试用例可独立运行**：无需业务实现代码即可执行
2. **测试用例精准校验**：每个测试都针对特定的业务逻辑断言
3. **红灯状态真实有效**：失败原因是缺少实现，而非测试本身的问题

### 3.4 典型失败日志示例

```
FAIL  utils/sku-graph/__tests__/graph-builder.test.ts > graph-builder: 图构建核心逻辑 > 当调用 buildSkuGraph 时，应该正确构建图结构 > 当传入单个 SKU 时，应该构建单路径图
Error: 🔴 红灯阶段：此函数尚未实现
 ❯ buildSkuGraph utils/sku-graph/graph-builder.ts:42:9
     40|  */
     41| export function buildSkuGraph(skuList: SkuDTO[]): SkuGraph {
     42|   throw new Error('🔴 红灯阶段：此函数尚未实现')
       |         ^
     43| }
```

```
FAIL  utils/sku-graph/__tests__/state-engine.test.ts > state-engine: 状态推导核心逻辑 > 当调用 computeEnabledSpecs 时，应该正确推导可用规格 > 当选中"猫"时，应该正确推导其他维度的可用规格
Error: 🔴 红灯阶段：此函数尚未实现
 ❯ buildSkuGraph utils/sku-graph/graph-builder.ts:42:9
```

---

## 四、测试用例设计亮点

### 4.1 完全对齐蓝灯提案

所有测试用例均严格对齐蓝灯阶段的设计提案：

| 蓝灯提案核心点 | 对应测试用例 |
| :--- | :--- |
| 图结构正确构建 | `buildSkuGraph` 系列测试 |
| 路径字典完整准确 | 多 SKU 共享规格测试 |
| 状态推导算法正确 | `computeEnabledSpecs` 系列测试 |
| 无效组合返回空状态 | 冲突回退测试 |
| 完成全维度匹配唯一 SKU | 完全匹配测试 |

### 4.2 测试描述规范

所有测试用例均采用「**当[触发条件]时，应该[预期结果]**」的标准格式：

```typescript
test('当传入单个 SKU 时，应该构建单路径图', () => { ... })
test('当选中"猫"时，应该正确推导其他维度的可用规格', () => { ... })
test('当选中导致无匹配的组合时，应该返回 hasValidPath: false', () => { ... })
```

### 4.3 三类核心用例覆盖

| 用例类型 | 覆盖场景 | 示例 |
| :--- | :--- | :--- |
| **正常流** | 核心业务流程的正向场景 | 选中规格 → 推导可用状态 |
| **异常流** | 接口失败、校验不通过、空值输入 | 无效组合 → 返回空状态 |
| **边界值** | 输入超长、极限操作、边界数据 | 100 条 SKU → 性能达标 |

### 4.4 Mock 数据贴合业务真实

所有 Mock 数据均基于蓝灯提案中的业务场景：

```typescript
const skuList: SkuDTO[] = [
  { id: '1', specs: ['猫', '10kg 以下', '短毛'], stock: 10, price: 19900 },
  { id: '2', specs: ['猫', '10kg 以下', '长毛'], stock: 5, price: 21900 },
  { id: '3', specs: ['狗', '20kg 以上', '长毛'], stock: 3, price: 29900 },
]
```

---

## 五、下一步行动

### 5.1 绿灯阶段任务

当您批准进入绿灯阶段后，我将：

1. 实现 `graph-builder.ts` 中的所有函数
2. 实现 `state-engine.ts` 中的所有函数
3. 确保所有 42 个失败的测试用例全部通过（绿灯）

### 5.2 验收标准

绿灯阶段完成后，必须满足：

- ✅ 所有测试用例 100% 执行通过
- ✅ 无任何 `throw Error` 的空壳代码
- ✅ 代码可直接运行，无语法错误
- ✅ 完全符合蓝灯提案的设计约定

---

## 六、文件归档路径

```
docs/tdd/sku-graph-algorithm/
├── SKU_GRAPH_PHASE_0_BLUEPRINT.md    ← 蓝灯阶段提案
├── SKU_GRAPH_PHASE_1_RED.md          ← 本文档
├── SKU_GRAPH_PHASE_2_GREEN.md        ← 下一阶段输出
└── SKU_GRAPH_PHASE_3_REFACTOR.md     ← 最终阶段输出
```

---

**红灯阶段输出完毕**，测试用例已验证红灯状态有效。

> 测试代码已生成，已验证无业务实现代码时执行失败（红灯状态有效），测试用例完全对齐设计提案。请确认是否进入🟢绿灯阶段编写业务实现代码？
