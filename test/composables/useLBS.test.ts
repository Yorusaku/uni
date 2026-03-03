/**
 * LBS 模块绿灯阶段测试用例（简化版）
 * @description: 主要测试业务逻辑而非异步 API
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Vue
vi.mock('vue', () => ({
  ref: (initialValue: any) => ({
    value: initialValue
  }),
  computed: (getter: () => any) => ({
    value: getter()
  }),
  onUnmounted: (fn: () => void) => {}
}))

// Mock uni API
vi.mock('uni', () => ({
  getLocation: vi.fn(),
  openSetting: vi.fn(),
  showModal: vi.fn(),
  showToast: vi.fn(),
  createSelectorQuery: () => ({
    select: () => ({
      boundingClientRect: () => ({
        exec: () => {}
      })
    })
  })
}))

// ==================== 测试套件 ==================== //

describe('LBS - useLBS (绿灯阶段)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==================== 测试 1：convertToMarkers 转换商家数据 ==================== //
  
  it('convertToMarkers 转换商家数据', async () => {
    const { convertToMarkers } = await import('../../utils/composables/useLBS')
    
    const merchants = [
      {
        merchant_id: 1,
        merchant_name: '宠物美容中心',
        address: '北京市朝阳区建国路88号',
        rating: '4.8',
        pic: 'https://example.com/image1.jpg',
        latitude: 39.9042,
        longitude: 116.4074,
        distance: 1.5
      }
    ]
    
    const userLocation = {
      latitude: 39.9042,
      longitude: 116.4074,
      accuracy: 10,
      timestamp: Date.now()
    }
    
    const markers = convertToMarkers(merchants, userLocation)
    
    expect(markers).toHaveLength(1)
    expect(markers[0].id).toBe(1)
    expect(markers[0].name).toBe('宠物美容中心')
    expect(markers[0].callout).toBeDefined()
    expect(markers[0].callout?.content).toBe('宠物美容中心\n4.8分')
  })
  
  // ==================== 测试 2：calculateDistance 计算距离 ==================== //
  
  it('calculateDistance 计算两点距离', async () => {
    const { calculateDistance } = await import('../../utils/composables/useLBS')
    
    // 北京天安门到故宫
    const dist = calculateDistance(39.9042, 116.4074, 39.9087, 116.4084)
    
    // 大约 500 米
    expect(dist).toBeGreaterThan(0)
    expect(dist).toBeLessThan(2) // 2公里内
  })
  
  // ==================== 测试 3：初始状态 ==================== //
  
  it('初始状态正确', async () => {
    const { useLBS } = await import('../../utils/composables/useLBS')
    
    const lbs = useLBS()
    
    expect(lbs.status.value).toBe('idle')
    expect(lbs.location.value).toBeNull()
    expect(lbs.merchants.value).toEqual([])
    expect(lbs.markers.value).toEqual([])
    expect(lbs.selectedMarker.value).toBeNull()
    expect(lbs.isCardVisible.value).toBe(false)
    expect(lbs.isAuthorized.value).toBe(false)
    expect(lbs.hasLocation.value).toBe(false)
  })
  
  // ==================== 测试 4：locationText 计算属性 ==================== //
  
  it('locationText 计算属性', async () => {
    const { useLBS } = await import('../../utils/composables/useLBS')
    
    const lbs = useLBS()
    
    // 未定位时
    expect(lbs.locationText).toBe('定位中...')
    
    // 定位后
    lbs.location.value = {
      latitude: 39.9042,
      longitude: 116.4074,
      accuracy: 10,
      timestamp: Date.now()
    }
    
    expect(lbs.locationText).toBe('39.904200, 116.407400')
  })
  
  // ==================== 测试 5：sortedMerchants 排序 ==================== //
  
  it('sortedMerchants 距离排序', async () => {
    const { useLBS } = await import('../../utils/composables/useLBS')
    
    const lbs = useLBS()
    
    lbs.location.value = {
      latitude: 39.9042,
      longitude: 116.4074,
      accuracy: 10,
      timestamp: Date.now()
    }
    
    lbs.merchants.value = [
      {
        merchant_id: 2,
        merchant_name: '商家B',
        address: '地址B',
        rating: '4.8',
        pic: 'https://example.com/b.jpg',
        latitude: 39.9050,
        longitude: 116.4080
      },
      {
        merchant_id: 1,
        merchant_name: '商家A',
        address: '地址A',
        rating: '4.5',
        pic: 'https://example.com/a.jpg',
        latitude: 39.9043,
        longitude: 116.4075
      }
    ]
    
    const sorted = lbs.sortedMerchants
    
    expect(sorted).toHaveLength(2)
    // 离用户近的应该在前面
    expect(sorted[0].merchant_id).toBe(1)
    expect(sorted[1].merchant_id).toBe(2)
  })
  
  // ==================== 测试 6：sortedMerchants 后端距离优先 ==================== //
  
  it('sortedMerchants 后端距离优先', async () => {
    const { useLBS } = await import('../../utils/composables/useLBS')
    
    const lbs = useLBS()
    
    lbs.location.value = {
      latitude: 39.9042,
      longitude: 116.4074,
      accuracy: 10,
      timestamp: Date.now()
    }
    
    lbs.merchants.value = [
      {
        merchant_id: 1,
        merchant_name: '商家A',
        address: '地址A',
        rating: '4.5',
        pic: 'https://example.com/a.jpg',
        latitude: 39.9043,
        longitude: 116.4075,
        distance: 2.5
      },
      {
        merchant_id: 2,
        merchant_name: '商家B',
        address: '地址B',
        rating: '4.8',
        pic: 'https://example.com/b.jpg',
        latitude: 39.9050,
        longitude: 116.4080,
        distance: 0.5
      }
    ]
    
    const sorted = lbs.sortedMerchants
    
    // 应该按照后端计算的距离排序
    expect(sorted[0].merchant_id).toBe(2)
    expect(sorted[1].merchant_id).toBe(1)
  })
  
  // ==================== 测试 7：handleMarkerTap 点击标记点 ==================== //
  
  it('handleMarkerTap 点击标记点', async () => {
    const { useLBS } = await import('../../utils/composables/useLBS')
    
    const lbs = useLBS()
    
    lbs.location.value = {
      latitude: 39.9042,
      longitude: 116.4074,
      accuracy: 10,
      timestamp: Date.now()
    }
    
    lbs.merchants.value = [
      {
        merchant_id: 1,
        merchant_name: '宠物美容中心',
        address: '地址',
        rating: '4.5',
        pic: 'https://example.com/a.jpg',
        latitude: 39.9043,
        longitude: 116.4075
      }
    ]
    
    // 触发 markers 计算
    const _ = lbs.markers.value
    
    lbs.handleMarkerTap({ markerId: 1 })
    
    expect(lbs.selectedMarker).not.toBeNull()
    expect(lbs.selectedMarker?.id).toBe(1)
    expect(lbs.isCardVisible.value).toBe(true)
  })
  
  // ==================== 测试 8：closeCard 关闭卡片 ==================== //
  
  it('closeCard 关闭卡片', async () => {
    const { useLBS } = await import('../../utils/composables/useLBS')
    
    const lbs = useLBS()
    
    lbs.handleMarkerTap({ markerId: 1 })
    lbs.closeCard()
    
    expect(lbs.isCardVisible.value).toBe(false)
    expect(lbs.selectedMarker.value).toBeNull()
  })
  
  // ==================== 测试 9：hasLocation 计算属性 ==================== //
  
  it('hasLocation 初始为 false', async () => {
    const { useLBS } = await import('../../utils/composables/useLBS')
    
    const lbs = useLBS()
    
    expect(lbs.hasLocation.value).toBe(false)
    
    lbs.location.value = {
      latitude: 39.9042,
      longitude: 116.4074,
      accuracy: 10,
      timestamp: Date.now()
    }
    
    expect(lbs.hasLocation.value).toBe(true)
  })
  
  // ==================== 测试 10：isAuthorized 计算属性 ==================== //
  
  it('isAuthorized 默认为 false', async () => {
    const { useLBS } = await import('../../utils/composables/useLBS')
    
    const lbs = useLBS()
    
    expect(lbs.isAuthorized.value).toBe(false)
    
    lbs.status.value = 'success'
    expect(lbs.isAuthorized.value).toBe(true)
    
    lbs.status.value = 'denied'
    expect(lbs.isAuthorized.value).toBe(true)
  })
  
  // ==================== 测试 11：markers 计算属性 ==================== //
  
  it('markers 计算属性', async () => {
    const { useLBS } = await import('../../utils/composables/useLBS')
    
    const lbs = useLBS()
    
    // 未定位时应该返回空数组
    expect(lbs.markers.value).toEqual([])
    
    lbs.location.value = {
      latitude: 39.9042,
      longitude: 116.4074,
      accuracy: 10,
      timestamp: Date.now()
    }
    
    lbs.merchants.value = [
      {
        merchant_id: 1,
        merchant_name: '宠物美容中心',
        address: '地址',
        rating: '4.5',
        pic: 'https://example.com/a.jpg',
        latitude: 39.9043,
        longitude: 116.4075
      }
    ]
    
    const markers = lbs.markers.value
    expect(markers).toHaveLength(1)
    expect(markers[0].id).toBe(1)
    expect(markers[0].name).toBe('宠物美容中心')
    expect(markers[0].rating).toBe(4.5)
  })
})
