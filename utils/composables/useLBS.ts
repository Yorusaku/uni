import { ref, computed, onUnmounted } from 'vue'

// ==================== 类型定义 ==================== //

/**
 * 用户位置信息
 */
export interface LocationInfo {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

/**
 * 地图 Marker 点位数据
 */
export interface MapMarker {
  id?: number
  latitude: number
  longitude: number
  name: string
  address: string
  rating?: number
  distance?: number
  callout?: {
    content: string
    fontSize: number
    borderRadius: number
    backgroundColor: string
    padding: number
  }
}

/**
 * 商家位置数据（后端返回）
 */
export interface MerchantLocation {
  merchant_id: number
  merchant_name: string
  address: string
  rating: string
  pic: string
  latitude: number
  longitude: number
  distance?: number
}

/**
 * 定位状态枚举
 */
export type LocationStatus = 'idle' | 'loading' | 'success' | 'failed' | 'denied'

// ==================== 响应式状态 ==================== //

// 用户当前位置
export const location = ref<LocationInfo | null>(null)

// 当前定位状态
export const status = ref<LocationStatus>('idle')

// 周边商家列表
export const merchants = ref<MerchantLocation[]>([])

// Map 组件使用的 Markers（计算属性）
export const markers = computed<MapMarker[]>(() => {
  if (!location.value) return []
  return convertToMarkers(merchants.value, location.value)
})

// 授权状态
export const isAuthorized = computed<boolean>(() => {
  return status.value === 'success' || status.value === 'denied'
})

// 是否已获取过定位
export const hasLocation = computed<boolean>(() => !!location.value)

// 当前选中的 Marker
export const selectedMarker = ref<MapMarker | null>(null)

// 底部卡片显示状态
export const isCardVisible = ref<boolean>(false)

// ==================== 工具函数 ==================== //

/**
 * 将商家数据转换为 Map Marker 格式
 * @param merchantList - 商家列表
 * @param userLocation - 用户位置
 * @returns Map Marker 数组
 */
export function convertToMarkers(
  merchantList: MerchantLocation[],
  userLocation: LocationInfo
): MapMarker[] {
  return merchantList.map((item) => {
    // 如果后端已经计算了距离，直接使用；否则返回 undefined（前端可后期计算）
    const distance = item.distance !== undefined ? item.distance.toFixed(1) : undefined
    
    return {
      id: item.merchant_id,
      latitude: item.latitude,
      longitude: item.longitude,
      name: item.merchant_name,
      address: item.address,
      rating: item.rating ? Number(item.rating) : undefined,
      distance,
      callout: {
        content: `${item.merchant_name}\n${item.rating || '0'}分`,
        fontSize: 24,
        borderRadius: 8,
        backgroundColor: '#fff',
        padding: 8
      }
    }
  })
}

/**
 * 计算两点之间的距离（Haversine 公式）
 * @param lat1 - 第一点纬度
 * @param lon1 - 第一点经度
 * @param lat2 - 第二点纬度
 * @param lon2 - 第二点经度
 * @returns 距离（公里）
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // 地球半径（公里）
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// ==================== 核心方法（绿色实现 - 绿灯阶段） ==================== //

/**
 * 获取当前位置（绿色实现）
 * @returns 是否成功获取位置
 */
export const getCurrentLocation = async (): Promise<boolean> => {
  status.value = 'loading'
  
  try {
    // ==================== Step 1: 尝试获取位置 ==================== //
    const res: UniApp.GetLocationSuccessOption = await new Promise(
      (resolve, reject) => {
        uni.getLocation({
          type: 'wgs84',
          geocode: true,
          success(res) {
            resolve(res)
          },
          fail(err) {
            reject(err)
          }
        })
      }
    )
    
    // ==================== Step 2: 验证位置数据 ==================== //
    if (!res.latitude || !res.longitude) {
      throw new Error('获取定位数据为空')
    }
    
    // ==================== Step 3: 更新本地状态 ==================== //
    location.value = {
      latitude: res.latitude,
      longitude: res.longitude,
      accuracy: res.accuracy || 0,
      timestamp: Date.now()
    }
    
    status.value = 'success'
    return true
    
  } catch (error: any) {
    // ==================== Step 4: 错误分类处理 ==================== //
    console.error('[LBS] 获取定位失败:', error)
    
    if (error.errCode === 2 || error.errCode === 3) {
      // errCode 2: 用户拒绝授权
      // errCode 3: 权限不足
      status.value = 'denied'
      return false
    } else if (error.errCode === 4 || error.errCode === 5) {
      // errCode 4: 网络问题
      // errCode 5: 位置服务未开启
      status.value = 'failed'
      uni.showToast({
        title: error.errCode === 5 ? '位置服务未开启' : '网络异常',
        icon: 'none',
        duration: 2000
      })
      return false
    } else {
      // 其他未知错误
      status.value = 'failed'
      uni.showToast({
        title: '定位失败，请重试',
        icon: 'none',
        duration: 2000
      })
      return false
    }
  }
}

/**
 * 获取周边商家（绿色实现）
 * @param radius - 搜索半径（米），默认 5000
 * @returns 是否成功获取商家列表
 */
export const getNearbyMerchants = async (
  radius: number = 5000
): Promise<boolean> => {
  if (!location.value) {
    uni.showToast({
      title: '请先获取定位',
      icon: 'none',
      duration: 2000
    })
    return false
  }
  
  try {
    // TODO: 调用后端 API 获取周边商家
    // 示例: const data = await get('/api/merchants/nearby', {
    //   latitude: location.value.latitude,
    //   longitude: location.value.longitude,
    //   radius: radius
    // })
    
    // 暂时返回空数据（等待后端接口就绪）
    // merchants.value = data.list || []
    
    status.value = 'success'
    return true
  } catch (error) {
    console.error('[LBS] 获取商家列表失败:', error)
    status.value = 'failed'
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none',
      duration: 2000
    })
    return false
  }
}

/**
 * 打开系统设置页面（权限被拒时）
 */
export const openSystemSettings = (): void => {
  uni.showModal({
    title: '需要定位权限',
    content: '您已拒绝定位权限，部分功能无法使用。是否前往设置开启？',
    confirmText: '前往设置',
    success(res) {
      if (res.confirm) {
        // 小程序：打开设置页
        // #ifdef MP-WEIXIN
        uni.openSetting({
          success(settingRes) {
            if (settingRes.authSetting['scope.userLocation']) {
              // 用户重新授权成功，重新获取位置
              getCurrentLocation()
            }
          },
          fail() {
            uni.showToast({
              title: '设置失败',
              icon: 'none'
            })
          }
        })
        // #endif
        
        // APP-PLUS：打开应用设置
        // #ifdef APP-PLUS
        plus.runtime.openSettings()
        // #endif
        
        // H5：不支持（微信内置浏览器无法跳转）
        // #ifdef H5
        uni.showToast({
          title: '请在浏览器设置中开启定位权限',
          icon: 'none'
        })
        // #endif
      }
    }
  })
}

/**
 * 处理 Marker 点击
 * @param e - Marker 点击事件
 */
export const handleMarkerTap = (e: { markerId?: number }): void => {
  if (!e.markerId) return
  
  const marker = markers.value.find((m) => m.id === e.markerId)
  if (marker) {
    selectedMarker.value = marker
    isCardVisible.value = true
  }
}

/**
 * 关闭底部卡片
 */
export const closeCard = (): void => {
  isCardVisible.value = false
  selectedMarker.value = null
}

/**
 * 跳转商家详情
 */
export const goToDetail = (): void => {
  if (selectedMarker.value) {
    closeCard()
    // 跳转到商家详情页
    // TODO: 根据实际路由调整
    uni.navigateTo({
      url: `/packageB/merchant-detail/merchant-detail?merchantId=${selectedMarker.value.id}`
    })
  }
}

// ==================== 计算属性 ==================== //

/**
 * 用户位置文本表示
 */
export const locationText = computed<string>(() => {
  if (!location.value) return '定位中...'
  return `${location.value.latitude.toFixed(6)}, ${location.value.longitude.toFixed(6)}`
})

/**
 * 距离排序后的商家列表
 */
export const sortedMerchants = computed<MerchantLocation[]>(() => {
  if (!location.value) return merchants.value
  return [...merchants.value].sort((a, b) => {
    // 如果后端已经计算了距离，使用后端的
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance
    }
    // 否则使用 Haversine 公式计算
    const distA = calculateDistance(
      location.value.latitude,
      location.value.longitude,
      a.latitude,
      a.longitude
    )
    const distB = calculateDistance(
      location.value.latitude,
      location.value.longitude,
      b.latitude,
      b.longitude
    )
    return distA - distB
  })
})

// ==================== 生命周期 ==================== //

onUnmounted(() => {
  // 清理资源
})

// ==================== 导出组合式函数 ==================== //

/**
 * LBS 组合式函数（绿色实现）
 * @returns LBS 相关状态和方法
 */
export const useLBS = () => {
  return {
    // 状态
    location,
    status,
    merchants,
    markers,
    isAuthorized,
    hasLocation,
    selectedMarker,
    isCardVisible,
    
    // 计算属性
    locationText,
    sortedMerchants,
    
    // 方法
    getCurrentLocation,
    getNearbyMerchants,
    openSystemSettings,
    handleMarkerTap,
    closeCard,
    goToDetail
  }
}
