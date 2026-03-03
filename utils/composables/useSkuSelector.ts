/**
 * SKU 选择器组合式函数
 * @module composables/useSkuSelector
 * @description 底层 sku-graph 引擎与 Vue 视图层之间的胶水层
 */

import { shallowRef, computed, readonly, type Ref, type ComputedRef } from 'vue'
import { useThrottleFn } from '@vueuse/core'
import {
  buildSkuGraph,
  computeEnabledSpecs,
  createSelectionState,
  updateSelection,
  type SkuDTO,
  type SkuGraph,
  type SpecNode,
  type SkuPath,
  type Dimension,
} from '../sku-graph'

/**
 * 已选规格状态（响应式）
 */
export interface SelectedSpecs {
  [dimensionIndex: number]: string
}

/**
 * 可用规格字典（响应式）
 * Key: 维度索引
 * Value: 该维度可用的规格值数组
 */
export type EnabledSpecsMap = Record<number, string[]>

/**
 * useSkuSelector 配置选项
 */
export interface UseSkuSelectorOptions {
  /** 节流间隔（毫秒），默认 100ms */
  throttleMs?: number
  /** 点击不可用规格时的回调（用于触发震动提示） */
  onDisabledClick?: (dimensionIndex: number, value: string) => void
}

/**
 * useSkuSelector 返回值
 */
export interface UseSkuSelectorReturn {
  /** 已选规格（响应式对象） */
  selectedSpecs: Readonly<Ref<SelectedSpecs>>
  /** 可用规格字典（响应式计算属性） */
  enabledSpecs: ComputedRef<EnabledSpecsMap>
  /** 匹配的 SKU（响应式计算属性） */
  matchedSku: ComputedRef<SkuPath | null>
  /** 是否正在计算（响应式） */
  isComputing: Readonly<Ref<boolean>>
  /** 所有维度定义（响应式计算属性） */
  dimensions: ComputedRef<Dimension[]>
  /** 是否存在有效路径 */
  hasValidPath: ComputedRef<boolean>
  /** 处理规格选择（节流 + 防御） */
  handleSelect: (dimensionIndex: number, value: string | null) => void
  /** 重置选择状态 */
  reset: () => void
  /** 初始化图结构 */
  initGraph: (skuList: SkuDTO[]) => void
}

/**
 * SKU 选择器组合式函数
 * @param skuList SKU 数据列表
 * @param options 配置选项
 * @returns 响应式状态和方法
 */
export function useSkuSelector(
  skuList?: SkuDTO[],
  options: UseSkuSelectorOptions = {}
): UseSkuSelectorReturn {
  const { throttleMs = 100, onDisabledClick } = options

  const graph: Ref<SkuGraph> = shallowRef(buildSkuGraph(skuList ?? []))
  const selectedSpecs: Ref<SelectedSpecs> = shallowRef({})
  const isComputing: Ref<boolean> = shallowRef(false)

  const derivedState = computed(() => {
    const graphValue = graph.value
    if (graphValue.paths.size === 0) {
      return {
        enabledSpecs: new Map(),
        hasValidPath: false,
        matchedSkuIds: [],
        matchedSku: null,
      }
    }

    const selectedNodes = buildSelectedNodes(selectedSpecs.value)
    return computeEnabledSpecs(graphValue, selectedNodes)
  })

  const enabledSpecs: ComputedRef<EnabledSpecsMap> = computed(() => {
    const result: EnabledSpecsMap = {}
    const enabled = derivedState.value.enabledSpecs

    for (const [dimIdx, specSet] of enabled) {
      result[dimIdx] = Array.from(specSet)
    }

    return result
  })

  const matchedSku: ComputedRef<SkuPath | null> = computed(() => {
    return derivedState.value.matchedSku
  })

  const dimensions: ComputedRef<Dimension[]> = computed(() => {
    return graph.value.dimensions
  })

  const hasValidPath: ComputedRef<boolean> = computed(() => {
    return derivedState.value.hasValidPath
  })

  function buildSelectedNodes(selected: SelectedSpecs): SpecNode[] {
    const nodes: SpecNode[] = []

    for (const [dimIdx, value] of Object.entries(selected)) {
      nodes.push({
        dimensionIndex: parseInt(dimIdx, 10),
        value,
        id: `dim${dimIdx}:${value}`,
      })
    }

    return nodes.sort((a, b) => a.dimensionIndex - b.dimensionIndex)
  }

  function isSpecEnabled(dimensionIndex: number, value: string): boolean {
    const enabled = derivedState.value.enabledSpecs.get(dimensionIndex)
    return enabled?.has(value) ?? false
  }

  function selectSpec(dimensionIndex: number, value: string | null): void {
    isComputing.value = true

    try {
      if (value === null) {
        const newSelected = { ...selectedSpecs.value }
        delete newSelected[dimensionIndex]
        selectedSpecs.value = newSelected
        return
      }

      if (!isSpecEnabled(dimensionIndex, value)) {
        onDisabledClick?.(dimensionIndex, value)
        return
      }

      selectedSpecs.value = {
        ...selectedSpecs.value,
        [dimensionIndex]: value,
      }
    } finally {
      isComputing.value = false
    }
  }

  const handleSelect = useThrottleFn(selectSpec, throttleMs)

  function reset(): void {
    selectedSpecs.value = {}
  }

  function initGraph(newSkuList: SkuDTO[]): void {
    graph.value = buildSkuGraph(newSkuList)
    selectedSpecs.value = {}
  }

  return {
    selectedSpecs: readonly(selectedSpecs),
    enabledSpecs,
    matchedSku,
    isComputing: readonly(isComputing),
    dimensions,
    hasValidPath,
    handleSelect,
    reset,
    initGraph,
  }
}
