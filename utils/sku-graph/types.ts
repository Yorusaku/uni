/**
 * SKU 图算法类型定义
 * @module utils/sku-graph/types
 */

/**
 * 单个规格项节点
 */
export interface SpecNode {
  /** 维度索引 (0: 宠物类型，1: 体重，...) */
  dimensionIndex: number
  /** 规格值 ('猫', '10kg 以下', ...) */
  value: string
  /** 唯一标识 `dim${dimensionIndex}:${value}` */
  id: string
}

/**
 * 维度定义
 */
export interface Dimension {
  /** 维度名称 */
  name: string
  /** 维度索引 */
  index: number
  /** 该维度的所有规格值 */
  values: string[]
}

/**
 * 后端返回的 SKU 数据传输对象
 */
export interface SkuDTO {
  /** SKU ID */
  id: string | number
  /** 规格值数组，按维度顺序排列 */
  specs: string[]
  /** 库存数量 */
  stock: number
  /** 价格（单位：分） */
  price: number
}

/**
 * 有效 SKU 路径（图的一条路径）
 */
export interface SkuPath {
  /** SKU 唯一标识 */
  skuId: string
  /** 按维度顺序排列的节点 */
  nodes: SpecNode[]
  /** 库存数量 */
  stock: number
  /** 价格（单位：分） */
  price: number
}

/**
 * 连通路径字典（核心数据结构）
 * Key: 规格节点的 ID
 * Value: 经过该节点的所有 SKU 路径 ID 集合
 */
export type PathMap = Map<string, Set<string>>

/**
 * 图结构总览
 */
export interface SkuGraph {
  /** 路径字典 */
  pathMap: PathMap
  /** 路径存储 */
  paths: Map<string, SkuPath>
  /** 维度总数 */
  dimensionCount: number
  /** 所有维度定义 */
  dimensions: Dimension[]
}

/**
 * 状态推导结果
 */
export interface DerivedState {
  /** 每个维度可用的规格 Map<维度索引, Set<规格值>> */
  enabledSpecs: Map<number, Set<string>>
  /** 是否存在有效 SKU 路径 */
  hasValidPath: boolean
  /** 匹配的 SKU ID 列表 */
  matchedSkuIds: string[]
  /** 匹配的唯一 SKU（如果存在） */
  matchedSku: SkuPath | null
}

/**
 * 用户选择状态
 */
export interface SelectionState {
  /** 已选规格 Map<维度索引, 规格值> */
  selected: Map<number, string>
  /** 已选规格节点列表 */
  selectedNodes: SpecNode[]
}
