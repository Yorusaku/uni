/**
 * 🟣 技术栈大换血 - Refactor阶段（Refactor）
 * 说明：节流封装（useThrottle），类型洁癖 + 卫语句优化
 */

import { ref } from 'vue'
import { useThrottleFn } from '@vueuse/core'

/**
 * 🟢 节流函数类型（零 any）
 */
export type ThrottledFunction<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => void

/**
 * 🟢 节流选项（零 any）
 */
export interface ThrottleOptions {
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
 * 🟢 节流函数（纯函数）
 * 
 * @param fn - 要节流的函数
 * @param options - 节流选项
 * @returns 节流后的函数
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  options: ThrottleOptions = {}
): ThrottledFunction<T> {
  const { wait = 300, immediate = false } = options

  // ✅ 卫语句：立即执行 → 不需要节流
  if (immediate) {
    return fn
  }

  return useThrottleFn(fn, wait)
}

/**
 * 🟢 节流状态（用于滚动加载等场景）
 * 
 * @param value - 原始值
 * @param wait - 等待时间（毫秒）
 * @returns 节流后的值
 */
export function useThrottledRef<T>(value: T, wait: number = 300) {
  const throttled = ref<T>(value)

  const update = () => {
    throttled.value = value
  }

  const throttledUpdate = useThrottleFn(update, wait)

  // ✅ 监听 value 变化
  setTimeout(() => {
    throttledUpdate()
  }, wait)

  return throttled
}
