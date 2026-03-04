import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 接口缓存状态管理
 * 支持自动缓存接口响应数据，提升用户体验
 */
interface CacheEntry<T> {
	data: T
	timestamp: number
	expiry: number // 缓存过期时间（毫秒）
}

export interface ApiResponseCache {
	[key: string]: CacheEntry<any>
}

// 缓存过期时间（默认 5 分钟）
const DEFAULT_CACHE_EXPIRY = 5 * 60 * 1000

export const useCacheStore = defineStore('cache', () => {
	// 缓存数据
	const cache = ref<ApiResponseCache>({})

	/**
	 * 获取缓存数据
	 * @param key 缓存键（通常是 API 路径）
	 * @param expiry 缓存过期时间（可选）
	 * @returns 缓存数据，如果不存在或已过期则返回 null
	 */
	function getCache<T>(key: string, expiry?: number): T | null {
		const entry = cache.value[key]
		if (!entry) {
			return null
		}

		const expireTime = expiry ?? entry.expiry ?? DEFAULT_CACHE_EXPIRY
		const now = Date.now()

		if (now - entry.timestamp > expireTime) {
			// 缓存已过期
			removeCache(key)
			return null
		}

		return entry.data
	}

	/**
	 * 设置缓存数据
	 * @param key 缓存键
	 * @param data 缓存数据
	 * @param expiry 缓存过期时间（可选）
	 */
	function setCache<T>(key: string, data: T, expiry?: number): void {
		cache.value[key] = {
			data,
			timestamp: Date.now(),
			expiry: expiry ?? DEFAULT_CACHE_EXPIRY,
		}
	}

	/**
	 * 移除缓存数据
	 * @param key 缓存键
	 */
	function removeCache(key: string): void {
		delete cache.value[key]
	}

	/**
	 * 清空所有缓存
	 */
	function clearCache(): void {
		cache.value = {}
	}

	/**
	 * 检查缓存是否存在
	 * @param key 缓存键
	 * @returns 是否存在未过期的缓存
	 */
	function hasCache(key: string): boolean {
		return !!getCache(key)
	}

	/**
	 * 获取缓存数量
	 */
	const cacheCount = computed(() => Object.keys(cache.value).length)

	/**
	 * 获取缓存统计信息
	 */
	function getCacheStats() {
		return {
			total: cacheCount.value,
			size: JSON.stringify(cache.value).length,
		}
	}

	return {
		// 状态
		cache,
		cacheCount,

		// 方法
		getCache,
		setCache,
		removeCache,
		clearCache,
		hasCache,
		getCacheStats,
	}
})

/**
 * 使用缓存的辅助函数（简化调用）
 */
export function useCachedApi() {
	const cacheStore = useCacheStore()

	return {
		/**
		 * 带缓存的 GET 请求
		 * @param key 缓存键
		 * @param apiFn API 函数
		 * @param expiry 缓存过期时间（可选）
		 */
		getWithCache: async <T>(key: string, apiFn: () => Promise<T>, expiry?: number): Promise<T> => {
			// 检查缓存
			const cachedData = cacheStore.getCache<T>(key, expiry)
			if (cachedData !== null) {
				console.log(`[Cache] 命中缓存: ${key}`)
				return cachedData
			}

			// 从 API 获取数据
			console.log(`[Cache] 请求 API: ${key}`)
			const data = await apiFn()

			// 设置缓存
			cacheStore.setCache(key, data, expiry)

			return data
		},

		/**
		 * 删除缓存
		 */
		invalidateCache: (key: string) => {
			cacheStore.removeCache(key)
			console.log(`[Cache] 已删除缓存: ${key}`)
		},

		/**
		 * 清空所有缓存
		 */
		invalidateAllCache: () => {
			cacheStore.clearCache()
			console.log('[Cache] 已清空所有缓存')
		},
	}
}
