/**
 * SKU 图构建器测试
 * @module utils/sku-graph/__tests__/graph-builder.test
 */

import { describe, test, expect } from 'vitest'
import {
  buildSkuGraph,
  parseNodeId,
  generateNodeId,
  extractDimensions,
  validateSkuList,
} from '../graph-builder'
import type { SkuDTO } from '../types'

describe('graph-builder: 图构建器核心功能', () => {
  describe('当调用 parseNodeId 时，应该正确解析节点 ID', () => {
    test('当传入标准格式的节点 ID 时，应该正确解析出维度索引和规格值', () => {
      const nodeId = 'dim0:猫'
      const result = parseNodeId(nodeId)
      
      expect(result.dimensionIndex).toBe(0)
      expect(result.value).toBe('猫')
    })

    test('当传入包含特殊字符的规格值时，应该正确解析', () => {
      const nodeId = 'dim1:10kg 以下'
      const result = parseNodeId(nodeId)
      
      expect(result.dimensionIndex).toBe(1)
      expect(result.value).toBe('10kg 以下')
    })

    test('当传入格式错误的节点 ID 时，应该抛出错误', () => {
      const invalidNodeId = 'invalid-format'
      
      expect(() => parseNodeId(invalidNodeId)).toThrow()
    })
  })

  describe('当调用 generateNodeId 时，应该生成正确的节点 ID', () => {
    test('当传入维度索引和规格值时，应该生成标准格式的节点 ID', () => {
      const result = generateNodeId(0, '猫')
      
      expect(result).toBe('dim0:猫')
    })

    test('当传入包含空格的规格值时，应该正确处理', () => {
      const result = generateNodeId(1, '10kg 以下')
      
      expect(result).toBe('dim1:10kg 以下')
    })
  })

  describe('当调用 extractDimensions 时，应该正确提取维度定义', () => {
    test('当传入包含 3 个维度的 SKU 列表时，应该正确提取所有维度', () => {
      const skuList: SkuDTO[] = [
        { id: '1', specs: ['猫', '10kg 以下', '短毛'], stock: 10, price: 19900 },
        { id: '2', specs: ['猫', '10kg 以下', '长毛'], stock: 5, price: 21900 },
        { id: '3', specs: ['狗', '20kg 以上', '长毛'], stock: 3, price: 29900 },
      ]
      
      const dimensions = extractDimensions(skuList)
      
      expect(dimensions).toHaveLength(3)
      expect(dimensions[0].values).toContain('猫')
      expect(dimensions[0].values).toContain('狗')
      expect(dimensions[1].values).toContain('10kg 以下')
      expect(dimensions[1].values).toContain('20kg 以上')
      expect(dimensions[2].values).toContain('短毛')
      expect(dimensions[2].values).toContain('长毛')
    })

    test('当传入空 SKU 列表时，应该返回空数组', () => {
      const dimensions = extractDimensions([])
      
      expect(dimensions).toHaveLength(0)
    })
  })

  describe('当调用 validateSkuList 时，应该正确验证 SKU 数据格式', () => {
    test('当传入有效的 SKU 列表时，应该返回 true', () => {
      const validList = [
        { id: '1', specs: ['猫', '10kg 以下'], stock: 10, price: 19900 },
      ]
      
      expect(validateSkuList(validList)).toBe(true)
    })

    test('当传入缺少必填字段的 SKU 列表时，应该返回 false', () => {
      const invalidList = [
        { id: '1', specs: ['猫'] }, // 缺少 stock 和 price
      ]
      
      expect(validateSkuList(invalidList)).toBe(false)
    })

    test('当传入空数组时，应该返回 true', () => {
      expect(validateSkuList([])).toBe(true)
    })
  })
})

describe('graph-builder: 图构建核心逻辑', () => {
  describe('当调用 buildSkuGraph 时，应该正确构建图结构', () => {
    test('当传入空 SKU 列表时，应该返回空的图结构', () => {
      const graph = buildSkuGraph([])
      
      expect(graph.pathMap.size).toBe(0)
      expect(graph.paths.size).toBe(0)
      expect(graph.dimensionCount).toBe(0)
    })

    test('当传入单个 SKU 时，应该构建单路径图', () => {
      const skuList: SkuDTO[] = [
        { id: '1', specs: ['猫', '10kg 以下', '短毛'], stock: 10, price: 19900 },
      ]
      
      const graph = buildSkuGraph(skuList)
      
      expect(graph.paths.size).toBe(1)
      expect(graph.pathMap.size).toBe(3) // 3 个节点
      expect(graph.dimensionCount).toBe(3)
      
      // 验证路径字典
      expect(graph.pathMap.get('dim0:猫')).toBeDefined()
      expect(graph.pathMap.get('dim1:10kg 以下')).toBeDefined()
      expect(graph.pathMap.get('dim2:短毛')).toBeDefined()
      
      // 验证所有节点都指向同一个 SKU
      expect(graph.pathMap.get('dim0:猫')!.has('sku_1')).toBe(true)
      expect(graph.pathMap.get('dim1:10kg 以下')!.has('sku_1')).toBe(true)
      expect(graph.pathMap.get('dim2:短毛')!.has('sku_1')).toBe(true)
    })

    test('当传入多个共享规格的 SKU 时，路径字典应该正确合并', () => {
      const skuList: SkuDTO[] = [
        { id: '1', specs: ['猫', '10kg 以下', '短毛'], stock: 10, price: 19900 },
        { id: '2', specs: ['猫', '10kg 以下', '长毛'], stock: 5, price: 21900 },
        { id: '3', specs: ['狗', '20kg 以上', '长毛'], stock: 3, price: 29900 },
      ]
      
      const graph = buildSkuGraph(skuList)
      
      expect(graph.paths.size).toBe(3)
      
      // 验证共享节点：'猫' 被 sku_1 和 sku_2 共享
      const catPaths = graph.pathMap.get('dim0:猫')
      expect(catPaths).toBeDefined()
      expect(catPaths!.size).toBe(2)
      expect(catPaths!.has('sku_1')).toBe(true)
      expect(catPaths!.has('sku_2')).toBe(true)
      
      // 验证共享节点：'10kg 以下' 被 sku_1 和 sku_2 共享
      const weightPaths = graph.pathMap.get('dim1:10kg 以下')
      expect(weightPaths).toBeDefined()
      expect(weightPaths!.size).toBe(2)
      
      // 验证共享节点：'长毛' 被 sku_2 和 sku_3 共享
      const longHairPaths = graph.pathMap.get('dim2:长毛')
      expect(longHairPaths).toBeDefined()
      expect(longHairPaths!.size).toBe(2)
      expect(longHairPaths!.has('sku_2')).toBe(true)
      expect(longHairPaths!.has('sku_3')).toBe(true)
      
      // 验证独立节点：'狗' 仅被 sku_3 使用
      const dogPaths = graph.pathMap.get('dim0:狗')
      expect(dogPaths).toBeDefined()
      expect(dogPaths!.size).toBe(1)
      expect(dogPaths!.has('sku_3')).toBe(true)
    })

    test('当传入包含特殊字符的规格值时，应该正确处理', () => {
      const skuList: SkuDTO[] = [
        { id: '1', specs: ['猫(英短)', '10kg以下', '长毛/短毛'], stock: 10, price: 19900 },
      ]
      
      const graph = buildSkuGraph(skuList)
      
      expect(graph.pathMap.has('dim0:猫(英短)')).toBe(true)
      expect(graph.pathMap.has('dim1:10kg以下')).toBe(true)
      expect(graph.pathMap.has('dim2:长毛/短毛')).toBe(true)
    })

    test('当传入 4 维度 SKU 时，应该正确构建图结构', () => {
      const skuList: SkuDTO[] = [
        { id: '1', specs: ['猫', '10kg 以下', '短毛', '高级'], stock: 10, price: 29900 },
        { id: '2', specs: ['猫', '10kg 以下', '短毛', '初级'], stock: 5, price: 19900 },
        { id: '3', specs: ['狗', '20kg 以上', '长毛', '高级'], stock: 3, price: 39900 },
      ]
      
      const graph = buildSkuGraph(skuList)
      
      expect(graph.dimensionCount).toBe(4)
      expect(graph.paths.size).toBe(3)
      
      // 验证第 4 维度的节点
      expect(graph.pathMap.has('dim3:高级')).toBe(true)
      expect(graph.pathMap.has('dim3:初级')).toBe(true)
      
      const advancedPaths = graph.pathMap.get('dim3:高级')!
      expect(advancedPaths.size).toBe(2) // sku_1 和 sku_3
    })
  })

  describe('当调用 buildSkuGraph 时，路径对象应该包含完整信息', () => {
    test('当构建路径时，应该包含正确的库存和价格信息', () => {
      const skuList: SkuDTO[] = [
        { id: 'test-sku', specs: ['猫', '10kg 以下'], stock: 99, price: 19999 },
      ]
      
      const graph = buildSkuGraph(skuList)
      const path = graph.paths.get('sku_test-sku')
      
      expect(path).toBeDefined()
      expect(path!.stock).toBe(99)
      expect(path!.price).toBe(19999)
      expect(path!.nodes).toHaveLength(2)
      expect(path!.nodes[0].value).toBe('猫')
      expect(path!.nodes[1].value).toBe('10kg 以下')
    })
  })
})

describe('graph-builder: 边界值测试', () => {
  test('当传入超大 SKU 列表（100 条）时，应该正确构建', () => {
    const skuList: SkuDTO[] = Array.from({ length: 100 }, (_, i) => ({
      id: `sku_${i}`,
      specs: [`宠物${i % 10}`, `体重${i % 5}`, `毛发${i % 3}`],
      stock: i,
      price: i * 100,
    }))
    
    const graph = buildSkuGraph(skuList)
    
    expect(graph.paths.size).toBe(100)
    expect(graph.dimensionCount).toBe(3)
  })

  test('当传入规格值为空字符串时，应该正确处理', () => {
    const skuList: SkuDTO[] = [
      { id: '1', specs: ['', '10kg 以下'], stock: 10, price: 19900 },
    ]
    
    const graph = buildSkuGraph(skuList)
    
    expect(graph.pathMap.has('dim0:')).toBe(true)
  })
})
