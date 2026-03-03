/**
 * SKU 状态推导引擎
 * @module utils/sku-graph/state-engine
 */

import type { SkuGraph, SpecNode, DerivedState, SelectionState, SkuPath } from './types'
import { generateNodeId } from './graph-builder'
import { parseNodeIdSafe, setIntersection, hasIntersection } from './helpers'

/**
 * 计算已选规格的路径交集
 * @param graph 图结构
 * @param selectedNodes 已选规格节点列表
 * @returns 路径交集（SKU ID 集合）
 */
export function computePathIntersection(
  graph: SkuGraph,
  selectedNodes: SpecNode[]
): Set<string> {
  if (selectedNodes.length === 0) {
    return new Set(graph.paths.keys())
  }
  
  const pathSets = getPathSetsForNodes(graph, selectedNodes)
  
  if (pathSets.length === 0) {
    return new Set()
  }
  
  return computeIntersection(pathSets)
}

/**
 * 获取节点对应的路径集合数组
 * @param graph 图结构
 * @param nodes 节点数组
 * @returns 路径集合数组
 */
function getPathSetsForNodes(graph: SkuGraph, nodes: SpecNode[]): Set<string>[] {
  const pathSets: Set<string>[] = []
  
  for (const node of nodes) {
    const paths = graph.pathMap.get(node.id)
    
    if (!paths || paths.size === 0) {
      return []
    }
    
    pathSets.push(paths)
  }
  
  return pathSets
}

/**
 * 计算多个集合的交集
 * @param sets 集合数组
 * @returns 交集集合
 */
function computeIntersection(sets: Set<string>[]): Set<string> {
  if (sets.length === 0) {
    return new Set()
  }
  
  let result = new Set(sets[0])
  
  for (let i = 1; i < sets.length; i++) {
    result = setIntersection(result, sets[i])
    
    if (result.size === 0) {
      return new Set()
    }
  }
  
  return result
}

/**
 * 推导可用规格状态
 * @param graph 图结构
 * @param selectedNodes 已选规格节点列表
 * @returns 推导结果
 */
export function computeEnabledSpecs(
  graph: SkuGraph,
  selectedNodes: SpecNode[]
): DerivedState {
  if (graph.paths.size === 0) {
    return createEmptyDerivedState()
  }
  
  const intersection = computePathIntersection(graph, selectedNodes)
  
  if (intersection.size === 0) {
    return createEmptyDerivedState()
  }
  
  const enabledSpecs = computeEnabledSpecsForDimensions(graph, selectedNodes, intersection)
  const matchedSkuIds = Array.from(intersection)
  const matchedSku = matchedSkuIds.length === 1 
    ? graph.paths.get(matchedSkuIds[0]) ?? null 
    : null
  
  return {
    enabledSpecs,
    hasValidPath: true,
    matchedSkuIds,
    matchedSku,
  }
}

/**
 * 创建空的推导状态
 * @returns 空的推导状态
 */
function createEmptyDerivedState(): DerivedState {
  return {
    enabledSpecs: new Map(),
    hasValidPath: false,
    matchedSkuIds: [],
    matchedSku: null,
  }
}

/**
 * 计算各维度的可用规格
 * @param graph 图结构
 * @param selectedNodes 已选节点
 * @param intersection 路径交集
 * @returns 各维度的可用规格 Map
 */
function computeEnabledSpecsForDimensions(
  graph: SkuGraph,
  selectedNodes: SpecNode[],
  intersection: Set<string>
): Map<number, Set<string>> {
  const enabledSpecs = new Map<number, Set<string>>()
  const selectedDimensions = new Set(selectedNodes.map(n => n.dimensionIndex))
  
  for (let dimIdx = 0; dimIdx < graph.dimensionCount; dimIdx++) {
    if (selectedDimensions.has(dimIdx)) {
      continue
    }
    
    const enabledSet = computeEnabledSpecsForDimension(graph, dimIdx, intersection)
    enabledSpecs.set(dimIdx, enabledSet)
  }
  
  return enabledSpecs
}

/**
 * 计算单个维度的可用规格
 * @param graph 图结构
 * @param dimIdx 维度索引
 * @param intersection 路径交集
 * @returns 可用规格集合
 */
function computeEnabledSpecsForDimension(
  graph: SkuGraph,
  dimIdx: number,
  intersection: Set<string>
): Set<string> {
  const enabledSet = new Set<string>()
  
  for (const [nodeId, paths] of graph.pathMap.entries()) {
    const parsed = parseNodeIdSafe(nodeId)
    
    if (!parsed || parsed.dimensionIndex !== dimIdx) {
      continue
    }
    
    if (hasIntersection(paths, intersection)) {
      enabledSet.add(parsed.value)
    }
  }
  
  return enabledSet
}

/**
 * 创建初始选择状态
 * @returns 空的选择状态
 */
export function createSelectionState(): SelectionState {
  return {
    selected: new Map(),
    selectedNodes: [],
  }
}

/**
 * 更新选择状态
 * @param state 当前选择状态
 * @param dimensionIndex 维度索引
 * @param value 规格值（null 表示取消选择）
 * @returns 新的选择状态
 */
export function updateSelection(
  state: SelectionState,
  dimensionIndex: number,
  value: string | null
): SelectionState {
  const newSelected = new Map(state.selected)
  
  if (value === null) {
    newSelected.delete(dimensionIndex)
  } else {
    newSelected.set(dimensionIndex, value)
  }
  
  const newSelectedNodes = buildSelectedNodes(newSelected)
  
  return {
    selected: newSelected,
    selectedNodes: newSelectedNodes,
  }
}

/**
 * 从选择 Map 构建节点数组
 * @param selected 选择 Map
 * @returns 节点数组
 */
function buildSelectedNodes(selected: Map<number, string>): SpecNode[] {
  const nodes: SpecNode[] = []
  
  for (const [dimIdx, val] of selected) {
    nodes.push({
      dimensionIndex: dimIdx,
      value: val,
      id: generateNodeId(dimIdx, val),
    })
  }
  
  return nodes.sort((a, b) => a.dimensionIndex - b.dimensionIndex)
}

/**
 * 检查规格是否可用
 * @param derivedState 推导结果
 * @param dimensionIndex 维度索引
 * @param value 规格值
 * @returns 是否可用
 */
export function isSpecEnabled(
  derivedState: DerivedState,
  dimensionIndex: number,
  value: string
): boolean {
  const enabledSet = derivedState.enabledSpecs.get(dimensionIndex)
  return enabledSet?.has(value) ?? false
}

/**
 * 获取匹配的唯一 SKU
 * @param graph 图结构
 * @param derivedState 推导结果
 * @returns 匹配的 SKU 或 null
 */
export function getMatchedSku(
  graph: SkuGraph,
  derivedState: DerivedState
): SkuPath | null {
  if (derivedState.matchedSkuIds.length === 0) {
    return null
  }
  
  const firstSkuId = derivedState.matchedSkuIds[0]
  return graph.paths.get(firstSkuId) ?? null
}
