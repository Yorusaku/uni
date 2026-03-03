/**
 * SKU 图算法辅助函数
 * @module utils/sku-graph/helpers
 */

/**
 * 节点 ID 前缀格式
 */
export const NODE_ID_PREFIX = 'dim'

/**
 * 节点 ID 分隔符
 */
export const NODE_ID_SEPARATOR = ':'

/**
 * 节点 ID 正则表达式
 */
const NODE_ID_REGEX = /^dim(\d+):(.*)$/

/**
 * 解析节点 ID 为维度索引和规格值
 * @param nodeId 节点 ID
 * @returns 解析结果，格式错误返回 null
 */
export function parseNodeIdSafe(nodeId: string): { dimensionIndex: number; value: string } | null {
  const match = nodeId.match(NODE_ID_REGEX)
  
  if (!match) {
    return null
  }
  
  const dimensionIndex = parseInt(match[1], 10)
  const value = match[2]
  
  return { dimensionIndex, value }
}

/**
 * 计算两个集合的交集
 * @param setA 集合 A
 * @param setB 集合 B
 * @returns 交集集合
 */
export function setIntersection<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const result = new Set<T>()
  
  for (const item of setA) {
    if (setB.has(item)) {
      result.add(item)
    }
  }
  
  return result
}

/**
 * 检查两个集合是否有交集
 * @param setA 集合 A
 * @param setB 集合 B
 * @returns 是否有交集
 */
export function hasIntersection<T>(setA: Set<T>, setB: Set<T>): boolean {
  for (const item of setA) {
    if (setB.has(item)) {
      return true
    }
  }
  
  return false
}

/**
 * 创建空的选择状态
 * @returns 空的选择状态 Map
 */
export function createEmptySelectionMap(): Map<number, string> {
  return new Map()
}

/**
 * 检查是否为有效的节点 ID 格式
 * @param nodeId 节点 ID
 * @returns 是否有效
 */
export function isValidNodeId(nodeId: string): boolean {
  return NODE_ID_REGEX.test(nodeId)
}

/**
 * 批量生成节点 ID
 * @param specs 规格值数组
 * @returns 节点 ID 数组
 */
export function generateNodeIds(specs: string[]): string[] {
  return specs.map((spec, index) => `${NODE_ID_PREFIX}${index}${NODE_ID_SEPARATOR}${spec}`)
}
