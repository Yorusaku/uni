/**
 * 🟣 技术栈大换血 - Refactor阶段（Refactor）
 * 说明：请求封装（useRequest），类型洁癖 + 卫语句优化
 */

import { ref } from 'vue'
import { getHttpClient } from '../http/client'

/**
 * 🟢 请求状态（零 any）
 */
export interface RequestState<T> {
  /**
   * 数据
   */
  data: T | null

  /**
   * 加载中
   */
  loading: boolean

  /**
   * 错误
   */
  error: Error | null

  /**
   * 重新请求
   */
  refetch: () => Promise<void>
}

/**
 * 🟢 请求选项（零 any）
 */
export interface RequestOptions {
  /**
   * 是否自动执行
   */
  immediate?: boolean

  /**
   * 缓存时间（毫秒）
   */
  ttl?: number

  /**
   * 是否强制刷新
   */
  forceRefresh?: boolean
}

/**
 * 🟢 执行请求（纯函数）
 * 
 * @param url - 请求 URL
 * @param options - 请求选项
 * @returns 响应数据
 */
async function executeRequest<T>(url: string, options: RequestOptions): Promise<T> {
  const { ttl, forceRefresh } = options

  return await getHttpClient().get<T>(url, {
    params: {
      ttl,
      forceRefresh,
    },
  })
}

/**
 * 🟢 封装请求（组合式函数）
 * 
 * @param url - 请求 URL
 * @param options - 请求选项
 */
export function useRequest<T = unknown>(
  url: string,
  options: RequestOptions = {}
): RequestState<T> {
  const { immediate = true } = options

  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  const execute = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const response = await executeRequest<T>(url, options)
      data.value = response
    } catch (err) {
      // ✅ 卫语句：错误处理
      const errorMessage = err instanceof Error ? err.message : '请求失败'
      error.value = new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  // ✅ 自动执行
  if (immediate) {
    execute()
  }

  return {
    data,
    loading,
    error,
    refetch: execute,
  }
}
