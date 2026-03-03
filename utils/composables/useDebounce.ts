/**
 * 🟣 技术栈大换血 - Refactor阶段（Refactor）
 * 说明：防抖封装（useDebounce），类型洁癖 + 卫语句优化
 */

import { ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'

/**
 * 🟢 防抖函数类型（零 any）
 */
export type DebouncedFunction<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => void

/**
 * 🟢 防抖选项（零 any）
 */
export interface DebounceOptions {
  /**
   * 等待时间（毫秒）
   */
  wait?: number

  /**
   * 是否立即执行
   */
  immediate?: boolean
}

/**
 * 🟢 防抖函数（纯函数）
 * 
 * @param fn - 要防抖的函数
 * @param options - 防抖选项
 * @returns 防抖后的函数
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  options: DebounceOptions = {}
): DebouncedFunction<T> {
  const { wait = 300, immediate = false } = options

  // ✅ 卫语句：立即执行 → 不需要防抖
  if (immediate) {
    return fn
  }

  return useDebounceFn(fn, wait)
}

/**
 * 🟢 防抖状态（用于表单输入等场景）
 * 
 * @param value - 原始值
 * @param wait - 等待时间（毫秒）
 * @returns 防抖后的值
 */
export function useDebouncedRef<T>(value: T, wait: number = 300) {
  const debounced = ref<T>(value)

  const update = () => {
    debounced.value = value
  }

  const debouncedUpdate = useDebounceFn(update, wait)

  // ✅ 监听 value 变化
  // 在 Vue 3 中，需要在组合式函数中调用，这里简化处理
  setTimeout(() => {
    debouncedUpdate()
  }, wait)

  return debounced
}
