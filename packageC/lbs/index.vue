<template>
  <view class="h-screen bg-[#f5f5f5] flex flex-col">
    <!-- 标题栏 -->
    <view class="bg-[#fff] px-[30rpx] py-[20rpx] flex items-center justify-between">
      <text class="text-[36rpx] font-bold text-[#333]">附近商家</text>
      
      <!-- 切换列表/地图视图 -->
      <view class="flex items-center">
        <view
          class="px-[24rpx] py-[12rpx] rounded-[20rpx] mr-[16rpx] text-[28rpx] flex items-center"
          :class="{ 'bg-[#ffce2c] text-[#fff]': viewMode === 'list' }"
          @click="viewMode = 'list'"
        >
          <up-icon name="list" size="24" :color="viewMode === 'list' ? '#fff' : '#666'"></up-icon>
          <text class="ml-[8rpx]">列表</text>
        </view>
        <view
          class="px-[24rpx] py-[12rpx] rounded-[20rpx] text-[28rpx] flex items-center"
          :class="{ 'bg-[#ffce2c] text-[#fff]': viewMode === 'map' }"
          @click="viewMode = 'map'"
        >
          <up-icon name="map" size="24" :color="viewMode === 'map' ? '#fff' : '#666'"></up-icon>
          <text class="ml-[8rpx]">地图</text>
        </view>
      </view>
    </view>
    
    <!-- 搜索栏 -->
    <view class="bg-[#fff] px-[30rpx] py-[20rpx]">
      <up-search
        placeholder="搜索商家或地址"
        v-model="searchKeyword"
        @search="handleSearch"
        :clearabled="false"
      ></up-search>
    </view>
    
    <!-- Tab 切换 -->
    <view class="bg-[#fff]">
      <up-tabs
        :list="categoryList"
        v-model:current="currentIndex"
        @click="handleTabClick"
        text-color="#666"
        active-color="#333"
        line-color="#ffce2c"
      ></up-tabs>
    </view>
    
    <!-- 内容区域 -->
    <scroll-view class="flex-1" scroll-y v-if="viewMode === 'list'">
      <!-- 列表视图 -->
      <view v-if="isLoading" class="flex flex-col items-center justify-center py-[200rpx]">
        <up-loading mode="circle" color="#ffce2c"></up-loading>
        <text class="mt-[20rpx] text-[28rpx] text-[#999]">加载中...</text>
      </view>
      
      <view v-else>
        <!-- 定位状态提示 -->
        <view
          v-if="lbsStatus === 'denied'"
          class="bg-[#fff] p-[20rpx] flex flex-col items-center"
        >
          <up-icon name="location" size="60" color="#ccc"></up-icon>
          <text class="mt-[16rpx] text-[28rpx] text-[#999]">定位已关闭</text>
          <view
            class="mt-[20rpx] px-[40rpx] py-[12rpx] bg-[#ffce2c] text-[#fff] rounded-[20rpx] text-[28rpx]"
            @click="openSettings"
          >
            去设置开启
          </view>
        </view>
        
        <view
          v-if="lbsStatus === 'failed'"
          class="bg-[#fff] p-[20rpx] flex flex-col items-center"
        >
          <up-icon name="close-circle" size="60" color="#ff6b81"></up-icon>
          <text class="mt-[16rpx] text-[28rpx] text-[#999]">定位失败</text>
          <view
            class="mt-[20rpx] px-[40rpx] py-[12rpx] bg-[#ffce2c] text-[#fff] rounded-[20rpx] text-[28rpx]"
            @click="reloadLocation"
          >
            点击重试
          </view>
        </view>
        
        <!-- 分类筛选 -->
        <view v-if="categoryList[currentIndex].name !== '推荐'" class="bg-[#fff] px-[30rpx] py-[20rpx]">
          <text class="text-[28rpx] text-[#999]">分类：{{categoryList[currentIndex].name}}</text>
        </view>
        
        <!-- 商家列表 -->
        <view v-if="merchants.length === 0" class="flex flex-col items-center py-[200rpx]">
          <up-icon name="shop" size="80" color="#ccc"></up-icon>
          <text class="mt-[20rpx] text-[28rpx] text-[#999]">暂无商家数据</text>
          <view
            v-if="lbsStatus === 'success'"
            class="mt-[30rpx] px-[40rpx] py-[12rpx] bg-[#ffce2c] text-[#fff] rounded-[20rpx] text-[28rpx]"
            @click="reloadLocation"
          >
            刷新试试
          </view>
        </view>
        
        <view v-else>
          <view
            class="bg-[#fff] rounded-[16rpx] mx-[30rpx] my-[10rpx] p-[20rpx] flex"
            v-for="item in merchants"
            :key="item.merchant_id"
            @click="goToDetail(item)"
          >
            <image
              class="w-[160rpx] h-[160rpx] bg-[#ddd] rounded-[8rpx] mr-[20rpx]"
              mode="aspectFill"
              :src="item.pic"
            ></image>
            <view class="flex-1 overflow-hidden">
              <text class="text-[32rpx] font-bold text-[#000] block mb-[8rpx]">{{item.merchant_name}}</text>
              <view class="flex items-center mb-[8rpx]">
                <up-rate
                  v-model="item.rating"
                  readonly
                  inactive-color="#b2b2b2"
                  active-color="#ffce2c"
                ></up-rate>
                <text class="text-[28rpx] text-[#666] ml-[8rpx]">{{item.rating}}</text>
              </view>
              <text class="text-[24rpx] text-[#999] block mb-[12rpx]">{{item.address}}</text>
              
              <!-- 标签 -->
              <view class="flex items-center mb-[16rpx]">
                <view
                  class="text-[18rpx] px-[14rpx] py-[4rpx] rounded-[20rpx] mr-[16rpx]"
                  v-for="(tag, index) in item.service.split(',')"
                  :key="index"
                  :style="getTagStyle(index)"
                >
                  {{tag}}
                </view>
              </view>
              
              <!-- 距离和优惠 -->
              <view class="flex items-center text-[24rpx] text-[#666]">
                <text
                  v-if="item.distance"
                  class="mr-[24rpx]"
                >距离：{{item.distance}}km</text>
                <view class="flex items-center ml-auto">
                  <view class="bg-[#ffce2c] text-[#fff] text-[18rpx] px-[8rpx] py-[2rpx] rounded-[4rpx] mr-[8rpx]">惠</view>
                  【新客福利】<text class="text-[#ff6b81] text-[24rpx] mx-[4rpx]">￥19.9</text>代金券
                </view>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 加载更多 -->
        <view
          v-if="hasMore"
          class="flex flex-col items-center py-[30rpx]"
        >
          <up-loading size="24" color="#999"></up-loading>
          <text class="mt-[10rpx] text-[24rpx] text-[#999]">加载中...</text>
        </view>
        
        <up-divider v-else text="我是有底线的"></up-divider>
      </view>
    </scroll-view>
    
    <!-- 地图视图 -->
    <lbs-map
      v-else
      ref="lbsMapRef"
      :scale="15"
      @markerTap="handleMarkerTap"
      @detailClick="handleDetailClick"
    ></lbs-map>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useLBS, MerchantLocation } from '@/utils/composables/useLBS'
import { get } from '@/utils/http'

// ==================== 组件引用 ==================== //

import LbsMap from '@/components/lbs/lbs-map.vue'

// ==================== 响应式状态 ==================== //

const lbsMapRef = ref<InstanceType<typeof LbsMap> | null>(null)
const viewMode = ref<'list' | 'map'>('list')
const searchKeyword = ref<string>('')
const currentIndex = ref<number>(0)

// 使用 LBS 组合式函数
const {
  location,
  status: lbsStatus,
  merchants,
  sortedMerchants,
  getCurrentLocation,
  openSystemSettings,
  isLoading
} = useLBS()

// 分类列表
const categoryList = reactive([
  { name: '推荐' },
  { name: '寄养' },
  { name: '摄影' },
  { name: '美容' },
  { name: '洗澡' },
  { name: '接送' },
  { name: '疫苗' },
  { name: '训练' }
])

// 分页状态
const currentPage = ref<number>(1)
const pageSize = ref<number>(20)
const hasMore = ref<boolean>(true)

// 标签样式
const getTagStyle = (index: number) => {
  const colors = [
    { color: '#ff6b81', bg: 'rgba(255, 107, 129, 0.1)' },
    { color: '#ffce2c', bg: 'rgba(255, 206, 44, 0.1)' },
    { color: '#19be6b', bg: 'rgba(25, 190, 107, 0.1)' },
    { color: '#ff9900', bg: 'rgba(255, 153, 0, 0.1)' }
  ]
  const color = colors[index % colors.length]
  return {
    color: color.color,
    backgroundColor: color.bg
  }
}

// 计算属性
const filteredMerchants = computed(() => {
  if (searchKeyword.value) {
    return merchants.value.filter(
      (item) =>
        item.merchant_name.includes(searchKeyword.value) ||
        item.address.includes(searchKeyword.value)
    )
  }
  return sortedMerchants.value
})

// ==================== 生命周期 ==================== //

onMounted(() => {
  // 获取当前位置
  getCurrentLocation().then((success) => {
    if (success) {
      // 获取附近商家
      getNearbyMerchants()
    }
  })
})

onUnmounted(() => {
  // 清理
})

// ==================== 事件处理 ==================== //

/**
 * 获取附近商家
 */
const getNearbyMerchants = async () => {
  if (!location.value) return
  
  try {
    const data: any = await get('/home/merchants', {
      page: currentPage.value,
      pageSize: pageSize.value,
      latitude: location.value.latitude,
      longitude: location.value.longitude
    })
    
    if (data.list) {
      merchants.value = data.list
      hasMore.value = data.pagination.current < data.pagination.totalPages
    }
  } catch (error) {
    console.error('获取商家列表失败:', error)
  }
}

/**
 * 刷新位置
 */
const reloadLocation = () => {
  getCurrentLocation().then((success) => {
    if (success) {
      getNearbyMerchants()
    }
  })
}

/**
 * 打开设置
 */
const openSettings = () => {
  openSystemSettings()
}

/**
 * Tab 点击
 */
const handleTabClick = (item: { name: string }, index: number) => {
  currentIndex.value = index
  currentPage.value = 1
  getNearbyMerchants()
}

/**
 * 搜索
 */
const handleSearch = () => {
  currentPage.value = 1
  getNearbyMerchants()
}

/**
 * 跳转详情
 */
const goToDetail = (item: MerchantLocation) => {
  uni.navigateTo({
    url: `/packageB/merchant-detail/merchant-detail?info=${JSON.stringify(item)}`
  })
}

/**
 * Marker 点击（地图视图）
 */
const handleMarkerTap = (marker: any) => {
  console.log('Marker 点击:', marker)
}

/**
 * 详情点击（地图视图）
 */
const handleDetailClick = (marker: any) => {
  // TODO: 根据 marker.id 找到对应的商家并跳转
  const item = merchants.value.find((m) => m.merchant_id === marker.id)
  if (item) {
    goToDetail(item)
  }
}

/**
 * 暴露给父组件的方法
 */
defineExpose({
  reload: getNearbyMerchants
})
</script>

<style scoped>
/* 所有样式使用 UnoCSS 原子类，此文件保留空 style 标签以符合 Vue SFC 规范 */
</style>
