/**
 * 🟣 技术栈大换血 - Refactor阶段（Refactor）
 * 说明：存储封装（useStorage），类型洁癖 + 接口定义
 */

import { useStorage as useVueUseStorage } from '@vueuse/core'

/**
 * 🟢 响应式存储选项（零 any）
 */
export interface StorageOptions<T> {
  /**
   * 存储同步方式（localStorage / sessionStorage）
   */
  mode?: 'local' | 'session'

  /**
   * 是否监听 storage 事件
   */
  shallow?: boolean

  /**
   * 事件过滤器
   */
  eventFilter?: () => boolean
}

/**
 * 🟢 响应式存储（类型安全）
 * 
 * @template T - 存储值类型
 * @param key - 本地存储键
 * @param initialValue - 初始值
 * @param options - 存储选项
 * @returns 响应式存储引用
 */
export function useStorage<T>(key: string, initialValue: T, options: StorageOptions<T> = {}): T {
  // ✅ 使用 @vueuse/core 的 useStorage（已自动类型推导）
  const storage = useVueUseStorage<T>(key, initialValue, {
    mode: options.mode === 'session' ? 'sessionStorage' : 'localStorage',
    shallow: options.shallow,
  })

  // ✅ 返回普通值（Vue 3 响应式自动处理）
  return storage.value
}

/**
 * 🟢 响应式存储（对象类型，返回 Ref）
 * 
 * @template T - 存储值类型
 * @param key - 本地存储键
 * @param initialValue - 初始值
 * @returns 响应式存储引用（Ref）
 */
export function useStorageRef<T>(key: string, initialValue: T) {
  return useVueUseStorage<T>(key, initialValue)
}
