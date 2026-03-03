/**
 * SKU 图构建器
 * @module utils/sku-graph/graph-builder
 */

import type { SkuDTO, Dimension, SkuGraph, SpecNode, SkuPath, PathMap } from './types'
import { parseNodeIdSafe, isValidNodeId, NODE_ID_PREFIX, NODE_ID_SEPARATOR } from './helpers'

/**
 * 解析节点 ID
 * @param nodeId 节点 ID (格式: dim${index}:${value})
 * @returns 解析后的节点信息
 * @throws {Error} 当节点 ID 格式无效时抛出错误
 */
export function parseNodeId(nodeId: string): { dimensionIndex: number; value: string } {
  const result = parseNodeIdSafe(nodeId)
  
  if (!result) {
    throw new Error(`Invalid node ID format: ${nodeId}`)
  }
  
  return result
}

/**
 * 生成节点 ID
 * @param dimensionIndex 维度索引
 * @param value 规格值
 * @returns 节点 ID
 */
export function generateNodeId(dimensionIndex: number, value: string): string {
  return `${NODE_ID_PREFIX}${dimensionIndex}${NODE_ID_SEPARATOR}${value}`
}

/**
 * 从 SKU 列表中提取所有维度定义
 * @param skuList SKU 列表
 * @returns 维度定义数组
 */
export function extractDimensions(skuList: SkuDTO[]): Dimension[] {
  if (skuList.length === 0) {
    return []
  }
  
  const dimensionCount = skuList[0].specs.length
  const dimensionValues = initializeDimensionSets(dimensionCount)
  
  collectDimensionValues(skuList, dimensionValues)
  
  return buildDimensionArray(dimensionValues)
}

/**
 * 初始化维度值集合数组
 * @param count 维度数量
 * @returns 维度值集合数组
 */
function initializeDimensionSets(count: number): Set<string>[] {
  return Array.from({ length: count }, () => new Set<string>())
}

/**
 * 从 SKU 列表中收集所有维度的规格值
 * @param skuList SKU 列表
 * @param dimensionValues 维度值集合数组
 */
function collectDimensionValues(skuList: SkuDTO[], dimensionValues: Set<string>[]): void {
  for (const sku of skuList) {
    sku.specs.forEach((spec, index) => {
      dimensionValues[index].add(spec)
    })
  }
}

/**
 * 将维度值集合数组转换为维度定义数组
 * @param dimensionValues 维度值集合数组
 * @returns 维度定义数组
 */
function buildDimensionArray(dimensionValues: Set<string>[]): Dimension[] {
  return dimensionValues.map((values, index) => ({
    name: `维度${index}`,
    index,
    values: Array.from(values),
  }))
}

/**
 * 构建 SKU 图结构
 * @param skuList 后端返回的 SKU 列表
 * @returns 图结构对象
 */
export function buildSkuGraph(skuList: SkuDTO[]): SkuGraph {
  if (skuList.length === 0) {
    return createEmptyGraph()
  }
  
  const dimensions = extractDimensions(skuList)
  const { pathMap, paths } = buildGraphData(skuList)
  
  return {
    pathMap,
    paths,
    dimensionCount: dimensions.length,
    dimensions,
  }
}

/**
 * 创建空的图结构
 * @returns 空的图结构对象
 */
function createEmptyGraph(): SkuGraph {
  return {
    pathMap: new Map(),
    paths: new Map(),
    dimensionCount: 0,
    dimensions: [],
  }
}

/**
 * 构建 SKU 图的核心数据
 * @param skuList SKU 列表
 * @returns 路径字典和路径存储
 */
function buildGraphData(skuList: SkuDTO[]): { pathMap: PathMap; paths: Map<string, SkuPath> } {
  const pathMap: PathMap = new Map()
  const paths = new Map<string, SkuPath>()
  
  for (const sku of skuList) {
    const skuId = generateSkuId(sku.id)
    const nodes = createSpecNodes(sku.specs)
    
    updatePathMap(pathMap, nodes, skuId)
    paths.set(skuId, createSkuPath(skuId, nodes, sku))
  }
  
  return { pathMap, paths }
}

/**
 * 生成 SKU ID
 * @param id SKU 原始 ID
 * @returns SKU ID 字符串
 */
function generateSkuId(id: string | number): string {
  return `sku_${id}`
}

/**
 * 创建规格节点数组
 * @param specs 规格值数组
 * @returns 规格节点数组
 */
function createSpecNodes(specs: string[]): SpecNode[] {
  return specs.map((spec, index) => ({
    dimensionIndex: index,
    value: spec,
    id: generateNodeId(index, spec),
  }))
}

/**
 * 更新路径字典
 * @param pathMap 路径字典
 * @param nodes 规格节点数组
 * @param skuId SKU ID
 */
function updatePathMap(pathMap: PathMap, nodes: SpecNode[], skuId: string): void {
  for (const node of nodes) {
    if (!pathMap.has(node.id)) {
      pathMap.set(node.id, new Set())
    }
    pathMap.get(node.id)!.add(skuId)
  }
}

/**
 * 创建 SKU 路径对象
 * @param skuId SKU ID
 * @param nodes 规格节点数组
 * @param sku SKU 数据
 * @returns SKU 路径对象
 */
function createSkuPath(skuId: string, nodes: SpecNode[], sku: SkuDTO): SkuPath {
  return {
    skuId,
    nodes,
    stock: sku.stock,
    price: sku.price,
  }
}

/**
 * 验证 SKU 数据格式
 * @param skuList SKU 列表
 * @returns 是否有效
 */
export function validateSkuList(skuList: unknown[]): boolean {
  if (!Array.isArray(skuList)) {
    return false
  }
  
  if (skuList.length === 0) {
    return true
  }
  
  return skuList.every(isValidSkuItem)
}

/**
 * 检查单个 SKU 项是否有效
 * @param item SKU 项
 * @returns 是否有效
 */
function isValidSkuItem(item: unknown): boolean {
  if (typeof item !== 'object' || item === null) {
    return false
  }
  
  const sku = item as Record<string, unknown>
  
  const hasRequiredFields = 
    'id' in sku &&
    'specs' in sku &&
    'stock' in sku &&
    'price' in sku
  
  if (!hasRequiredFields) {
    return false
  }
  
  const hasValidTypes = 
    Array.isArray(sku.specs) &&
    typeof sku.stock === 'number' &&
    typeof sku.price === 'number'
  
  return hasValidTypes
}

export { isValidNodeId }
