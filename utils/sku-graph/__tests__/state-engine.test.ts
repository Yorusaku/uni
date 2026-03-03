/**
 * SKU 状态推导引擎测试
 * @module utils/sku-graph/__tests__/state-engine.test
 */

import { describe, test, expect, beforeEach } from 'vitest'
import {
  computePathIntersection,
  computeEnabledSpecs,
  createSelectionState,
  updateSelection,
  isSpecEnabled,
  getMatchedSku,
} from '../state-engine'
import { buildSkuGraph } from '../graph-builder'
import type { SkuGraph, SkuDTO, SpecNode, SelectionState } from '../types'

describe('state-engine: 选择状态管理', () => {
  describe('当调用 createSelectionState 时，应该创建空的初始状态', () => {
    test('当创建初始状态时，应该返回空的选择状态', () => {
      const state = createSelectionState()
      
      expect(state.selected.size).toBe(0)
      expect(state.selectedNodes.length).toBe(0)
    })
  })

  describe('当调用 updateSelection 时，应该正确更新选择状态', () => {
    let state: SelectionState

    beforeEach(() => {
      state = createSelectionState()
    })

    test('当添加选择时，应该正确更新状态', () => {
      const newState = updateSelection(state, 0, '猫')
      
      expect(newState.selected.size).toBe(1)
      expect(newState.selected.get(0)).toBe('猫')
      expect(newState.selectedNodes.length).toBe(1)
      expect(newState.selectedNodes[0].value).toBe('猫')
      expect(newState.selectedNodes[0].dimensionIndex).toBe(0)
    })

    test('当取消选择时（传入 null），应该移除该维度的选择', () => {
      state = updateSelection(state, 0, '猫')
      state = updateSelection(state, 1, '10kg 以下')
      
      const newState = updateSelection(state, 0, null)
      
      expect(newState.selected.size).toBe(1)
      expect(newState.selected.has(0)).toBe(false)
      expect(newState.selected.get(1)).toBe('10kg 以下')
    })

    test('当替换同一维度的选择时，应该更新为新值', () => {
      state = updateSelection(state, 0, '猫')
      const newState = updateSelection(state, 0, '狗')
      
      expect(newState.selected.get(0)).toBe('狗')
      expect(newState.selectedNodes.length).toBe(1)
    })
  })
})

describe('state-engine: 路径交集计算', () => {
  let graph: SkuGraph

  beforeEach(() => {
    const skuList: SkuDTO[] = [
      { id: '1', specs: ['猫', '10kg 以下', '短毛'], stock: 10, price: 19900 },
      { id: '2', specs: ['猫', '10kg 以下', '长毛'], stock: 5, price: 21900 },
      { id: '3', specs: ['狗', '20kg 以上', '长毛'], stock: 3, price: 29900 },
    ]
    graph = buildSkuGraph(skuList)
  })

  describe('当调用 computePathIntersection 时，应该正确计算路径交集', () => {
    test('当传入空选择列表时，应该返回所有路径', () => {
      const intersection = computePathIntersection(graph, [])
      
      expect(intersection.size).toBe(3) // 所有 3 个 SKU
    })

    test('当传入单个选择时，应该返回经过该节点的所有路径', () => {
      const selectedNodes: SpecNode[] = [
        { dimensionIndex: 0, value: '猫', id: 'dim0:猫' },
      ]
      
      const intersection = computePathIntersection(graph, selectedNodes)
      
      expect(intersection.size).toBe(2) // sku_1 和 sku_2
      expect(intersection.has('sku_1')).toBe(true)
      expect(intersection.has('sku_2')).toBe(true)
      expect(intersection.has('sku_3')).toBe(false)
    })

    test('当传入多个选择时，应该返回交集路径', () => {
      const selectedNodes: SpecNode[] = [
        { dimensionIndex: 0, value: '猫', id: 'dim0:猫' },
        { dimensionIndex: 2, value: '长毛', id: 'dim2:长毛' },
      ]
      
      const intersection = computePathIntersection(graph, selectedNodes)
      
      expect(intersection.size).toBe(1) // 仅 sku_2
      expect(intersection.has('sku_2')).toBe(true)
    })

    test('当传入无效组合时，应该返回空集合', () => {
      const selectedNodes: SpecNode[] = [
        { dimensionIndex: 0, value: '猫', id: 'dim0:猫' },
        { dimensionIndex: 1, value: '20kg 以上', id: 'dim1:20kg 以上' },
      ]
      
      const intersection = computePathIntersection(graph, selectedNodes)
      
      expect(intersection.size).toBe(0)
    })
  })
})

describe('state-engine: 状态推导核心逻辑', () => {
  let graph: SkuGraph

  beforeEach(() => {
    const skuList: SkuDTO[] = [
      { id: '1', specs: ['猫', '10kg 以下', '短毛'], stock: 10, price: 19900 },
      { id: '2', specs: ['猫', '10kg 以下', '长毛'], stock: 5, price: 21900 },
      { id: '3', specs: ['狗', '20kg 以上', '长毛'], stock: 3, price: 29900 },
    ]
    graph = buildSkuGraph(skuList)
  })

  describe('当调用 computeEnabledSpecs 时，应该正确推导可用规格', () => {
    test('当无已选规格时，所有规格应该可用', () => {
      const derived = computeEnabledSpecs(graph, [])
      
      expect(derived.hasValidPath).toBe(true)
      expect(derived.enabledSpecs.get(0)!.size).toBe(2) // 猫、狗
      expect(derived.enabledSpecs.get(1)!.size).toBe(2) // 10kg 以下、20kg 以上
      expect(derived.enabledSpecs.get(2)!.size).toBe(2) // 短毛、长毛
    })

    test('当选中"猫"时，应该正确推导其他维度的可用规格', () => {
      const selectedNodes: SpecNode[] = [
        { dimensionIndex: 0, value: '猫', id: 'dim0:猫' },
      ]
      
      const derived = computeEnabledSpecs(graph, selectedNodes)
      
      expect(derived.hasValidPath).toBe(true)
      
      // 维度 1：仅"10kg 以下"可用
      expect(derived.enabledSpecs.get(1)!.has('10kg 以下')).toBe(true)
      expect(derived.enabledSpecs.get(1)!.has('20kg 以上')).toBe(false)
      
      // 维度 2：短毛和长毛都可用
      expect(derived.enabledSpecs.get(2)!.has('短毛')).toBe(true)
      expect(derived.enabledSpecs.get(2)!.has('长毛')).toBe(true)
      
      // 匹配的 SKU 应该是 sku_1 和 sku_2
      expect(derived.matchedSkuIds.length).toBe(2)
    })

    test('当选中"狗"时，应该正确推导其他维度的可用规格', () => {
      const selectedNodes: SpecNode[] = [
        { dimensionIndex: 0, value: '狗', id: 'dim0:狗' },
      ]
      
      const derived = computeEnabledSpecs(graph, selectedNodes)
      
      expect(derived.hasValidPath).toBe(true)
      
      // 维度 1：仅"20kg 以上"可用
      expect(derived.enabledSpecs.get(1)!.has('10kg 以下')).toBe(false)
      expect(derived.enabledSpecs.get(1)!.has('20kg 以上')).toBe(true)
      
      // 维度 2：仅"长毛"可用
      expect(derived.enabledSpecs.get(2)!.has('短毛')).toBe(false)
      expect(derived.enabledSpecs.get(2)!.has('长毛')).toBe(true)
    })

    test('当选中两个维度时，应该正确推导剩余维度的可用规格', () => {
      const selectedNodes: SpecNode[] = [
        { dimensionIndex: 0, value: '猫', id: 'dim0:猫' },
        { dimensionIndex: 1, value: '10kg 以下', id: 'dim1:10kg 以下' },
      ]
      
      const derived = computeEnabledSpecs(graph, selectedNodes)
      
      expect(derived.hasValidPath).toBe(true)
      
      // 维度 2：短毛和长毛都可用
      expect(derived.enabledSpecs.get(2)!.has('短毛')).toBe(true)
      expect(derived.enabledSpecs.get(2)!.has('长毛')).toBe(true)
    })

    test('当选中所有维度时，应该匹配到唯一 SKU', () => {
      const selectedNodes: SpecNode[] = [
        { dimensionIndex: 0, value: '猫', id: 'dim0:猫' },
        { dimensionIndex: 1, value: '10kg 以下', id: 'dim1:10kg 以下' },
        { dimensionIndex: 2, value: '短毛', id: 'dim2:短毛' },
      ]
      
      const derived = computeEnabledSpecs(graph, selectedNodes)
      
      expect(derived.hasValidPath).toBe(true)
      expect(derived.matchedSkuIds.length).toBe(1)
      expect(derived.matchedSkuIds[0]).toBe('sku_1')
      expect(derived.matchedSku).toBeDefined()
      expect(derived.matchedSku!.stock).toBe(10)
      expect(derived.matchedSku!.price).toBe(19900)
    })
  })

  describe('当传入无效组合时，应该返回无效状态', () => {
    test('当选中导致无匹配的组合时，应该返回 hasValidPath: false', () => {
      const selectedNodes: SpecNode[] = [
        { dimensionIndex: 0, value: '猫', id: 'dim0:猫' },
        { dimensionIndex: 1, value: '20kg 以上', id: 'dim1:20kg 以上' },
      ]
      
      const derived = computeEnabledSpecs(graph, selectedNodes)
      
      expect(derived.hasValidPath).toBe(false)
      expect(derived.matchedSkuIds.length).toBe(0)
      expect(derived.matchedSku).toBeNull()
    })

    test('当选中不存在的规格值时，应该返回无效状态', () => {
      const selectedNodes: SpecNode[] = [
        { dimensionIndex: 0, value: '兔子', id: 'dim0:兔子' },
      ]
      
      const derived = computeEnabledSpecs(graph, selectedNodes)
      
      expect(derived.hasValidPath).toBe(false)
    })
  })
})

describe('state-engine: 辅助函数', () => {
  describe('当调用 isSpecEnabled 时，应该正确判断规格是否可用', () => {
    test('当规格在 enabledSpecs 中时，应该返回 true', () => {
      const enabledSpecs = new Map<number, Set<string>>()
      enabledSpecs.set(0, new Set(['猫', '狗']))
      
      const derived = {
        enabledSpecs,
        hasValidPath: true,
        matchedSkuIds: [],
        matchedSku: null,
      }
      
      expect(isSpecEnabled(derived, 0, '猫')).toBe(true)
      expect(isSpecEnabled(derived, 0, '狗')).toBe(true)
    })

    test('当规格不在 enabledSpecs 中时，应该返回 false', () => {
      const enabledSpecs = new Map<number, Set<string>>()
      enabledSpecs.set(0, new Set(['猫']))
      
      const derived = {
        enabledSpecs,
        hasValidPath: true,
        matchedSkuIds: [],
        matchedSku: null,
      }
      
      expect(isSpecEnabled(derived, 0, '狗')).toBe(false)
    })

    test('当维度不存在时，应该返回 false', () => {
      const derived = {
        enabledSpecs: new Map(),
        hasValidPath: true,
        matchedSkuIds: [],
        matchedSku: null,
      }
      
      expect(isSpecEnabled(derived, 0, '猫')).toBe(false)
    })
  })

  describe('当调用 getMatchedSku 时，应该正确获取匹配的 SKU', () => {
    let graph: SkuGraph

    beforeEach(() => {
      const skuList: SkuDTO[] = [
        { id: '1', specs: ['猫', '10kg 以下', '短毛'], stock: 10, price: 19900 },
      ]
      graph = buildSkuGraph(skuList)
    })

    test('当存在唯一匹配时，应该返回 SKU 对象', () => {
      const derived = {
        enabledSpecs: new Map(),
        hasValidPath: true,
        matchedSkuIds: ['sku_1'],
        matchedSku: null,
      }
      
      const sku = getMatchedSku(graph, derived)
      
      expect(sku).toBeDefined()
      expect(sku!.skuId).toBe('sku_1')
    })

    test('当无匹配时，应该返回 null', () => {
      const derived = {
        enabledSpecs: new Map(),
        hasValidPath: false,
        matchedSkuIds: [],
        matchedSku: null,
      }
      
      const sku = getMatchedSku(graph, derived)
      
      expect(sku).toBeNull()
    })

    test('当有多个匹配时，应该返回第一个 SKU', () => {
      const multiSkuList: SkuDTO[] = [
        { id: '1', specs: ['猫', '10kg 以下', '短毛'], stock: 10, price: 19900 },
        { id: '2', specs: ['猫', '10kg 以下', '长毛'], stock: 5, price: 21900 },
      ]
      const multiGraph = buildSkuGraph(multiSkuList)
      
      const derived = {
        enabledSpecs: new Map(),
        hasValidPath: true,
        matchedSkuIds: ['sku_1', 'sku_2'],
        matchedSku: null,
      }
      
      const sku = getMatchedSku(multiGraph, derived)
      
      expect(sku).toBeDefined()
      expect(sku!.skuId).toBe('sku_1')
    })
  })
})

describe('state-engine: 完整用户流程模拟', () => {
  let graph: SkuGraph

  beforeEach(() => {
    const skuList: SkuDTO[] = [
      { id: '1', specs: ['猫', '10kg 以下', '短毛', '高级'], stock: 10, price: 29900 },
      { id: '2', specs: ['猫', '10kg 以下', '短毛', '初级'], stock: 5, price: 19900 },
      { id: '3', specs: ['猫', '10kg 以下', '长毛', '高级'], stock: 8, price: 32900 },
      { id: '4', specs: ['狗', '20kg 以上', '长毛', '高级'], stock: 3, price: 39900 },
    ]
    graph = buildSkuGraph(skuList)
  })

  test('当用户依次选择规格时，应该正确推导每一步的状态', () => {
    // 步骤 1：选择"猫"
    let state = createSelectionState()
    state = updateSelection(state, 0, '猫')
    let derived = computeEnabledSpecs(graph, state.selectedNodes)
    
    expect(derived.hasValidPath).toBe(true)
    expect(derived.enabledSpecs.get(1)!.has('10kg 以下')).toBe(true)
    expect(derived.enabledSpecs.get(1)!.has('20kg 以上')).toBe(false)
    
    // 步骤 2：选择"10kg 以下"
    state = updateSelection(state, 1, '10kg 以下')
    derived = computeEnabledSpecs(graph, state.selectedNodes)
    
    expect(derived.hasValidPath).toBe(true)
    expect(derived.enabledSpecs.get(2)!.has('短毛')).toBe(true)
    expect(derived.enabledSpecs.get(2)!.has('长毛')).toBe(true)
    
    // 步骤 3：选择"短毛"
    state = updateSelection(state, 2, '短毛')
    derived = computeEnabledSpecs(graph, state.selectedNodes)
    
    expect(derived.hasValidPath).toBe(true)
    expect(derived.enabledSpecs.get(3)!.has('高级')).toBe(true)
    expect(derived.enabledSpecs.get(3)!.has('初级')).toBe(true)
    
    // 步骤 4：选择"高级" - 完成匹配
    state = updateSelection(state, 3, '高级')
    derived = computeEnabledSpecs(graph, state.selectedNodes)
    
    expect(derived.hasValidPath).toBe(true)
    expect(derived.matchedSkuIds.length).toBe(1)
    expect(derived.matchedSku!.skuId).toBe('sku_1')
    expect(derived.matchedSku!.stock).toBe(10)
    expect(derived.matchedSku!.price).toBe(29900)
  })

  test('当用户取消选择时，应该正确回退状态', () => {
    // 选择到第 3 步
    let state = createSelectionState()
    state = updateSelection(state, 0, '猫')
    state = updateSelection(state, 1, '10kg 以下')
    state = updateSelection(state, 2, '短毛')
    
    // 取消第 2 步的选择
    state = updateSelection(state, 1, null)
    
    expect(state.selected.size).toBe(2)
    expect(state.selected.has(1)).toBe(false)
    
    const derived = computeEnabledSpecs(graph, state.selectedNodes)
    
    // 维度 1 应该重新变为可用
    expect(derived.enabledSpecs.get(1)!.has('10kg 以下')).toBe(true)
  })
})

describe('state-engine: 边界值测试', () => {
  test('当传入超大 SKU 数据（100 条）时，应该正确推导', () => {
    const skuList: SkuDTO[] = Array.from({ length: 100 }, (_, i) => ({
      id: `sku_${i}`,
      specs: [`宠物${i % 10}`, `体重${i % 5}`, `毛发${i % 3}`],
      stock: i,
      price: i * 100,
    }))
    
    const graph = buildSkuGraph(skuList)
    const selectedNodes: SpecNode[] = [
      { dimensionIndex: 0, value: '宠物1', id: 'dim0:宠物1' },
    ]
    
    const derived = computeEnabledSpecs(graph, selectedNodes)
    
    expect(derived.hasValidPath).toBe(true)
    expect(derived.matchedSkuIds.length).toBeGreaterThan(0)
  })

  test('当传入空图结构时，应该返回无效状态', () => {
    const emptyGraph: SkuGraph = {
      pathMap: new Map(),
      paths: new Map(),
      dimensionCount: 0,
      dimensions: [],
    }
    
    const derived = computeEnabledSpecs(emptyGraph, [])
    
    expect(derived.hasValidPath).toBe(false)
    expect(derived.matchedSkuIds.length).toBe(0)
  })
})
