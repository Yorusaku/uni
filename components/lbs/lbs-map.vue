<template>
  <view class="fixed inset-0 bg-[#f5f5f5]">
    <!-- 地图容器（全屏） -->
    <map
      class="w-full h-full"
      :latitude="latitude"
      :longitude="longitude"
      :scale="scale"
      :markers="markers"
      :show-location="true"
      @markertap="handleMarkerTap"
      @regionchange="handleRegionChange"
      @askforuserlocation="handleAuthorizationRequested"
    >
      <!-- 自定义底部卡片 -->
      <view
        class="absolute bottom-0 left-0 right-0 h-[80vh] bg-[#fff] rounded-t-[32rpx] shadow-2xl transition-transform duration-300 z-10"
        :class="{ 'translate-y-0': isCardVisible, '-translate-y-full': !isCardVisible }"
      >
        <!-- 卡片头部（拖动手柄） -->
        <view class="flex items-center justify-center py-[16rpx] border-b border-[#f0f0f0]">
          <view class="w-[120rpx] h-[8rpx] bg-[#e0e0e0] rounded-[4rpx]"></view>
        </view>
        
        <!-- 卡片内容 -->
        <scroll-view class="h-full" scroll-y>
          <view v-if="selectedMarker" class="p-[30rpx]">
            <text class="text-[36rpx] font-bold text-[#333] mb-[16rpx] block">{{selectedMarker.name}}</text>
            
            <!-- 评分区域 -->
            <view class="flex items-center mb-[12rpx]">
              <up-rate
                v-model="rating"
                readonly
                inactive-color="#b2b2b2"
                active-color="#ffce2c"
              ></up-rate>
              <text class="text-[28rpx] text-[#666] ml-[8rpx]">{{selectedMarker.rating}}</text>
            </view>
            
            <!-- 地址 -->
            <text class="text-[28rpx] text-[#999] mb-[20rpx] block">{{selectedMarker.address}}</text>
            
            <!-- 距离 -->
            <text
              v-if="selectedMarker.distance"
              class="text-[24rpx] text-[#666] mb-[24rpx] block"
            >距离：{{selectedMarker.distance}}km</text>
            
            <!-- 操作按钮 -->
            <view class="flex mt-[40rpx]">
              <view
                class="flex-1 h-[80rpx] bg-[#f5f5f5] text-[#666] text-[32rpx] rounded-[40rpx] flex items-center justify-center mr-[16rpx]"
                @click="closeCard"
              >
                取消
              </view>
              <view
                class="flex-1 h-[80rpx] bg-[#ffce2c] text-[#fff] text-[32rpx] rounded-[40rpx] flex items-center justify-center"
                @click="goToDetail"
              >
                查看详情
              </view>
            </view>
          </view>
          
          <!-- 空状态提示 -->
          <view v-else class="flex flex-col items-center justify-center h-[400rpx]">
            <up-icon name="location" size="60" color="#ccc"></up-icon>
            <text class="text-[28rpx] text-[#999] mt-[20rpx]">点击地图标记点查看详情</text>
          </view>
        </scroll-view>
      </view>
      
      <!-- 定位中提示 -->
      <view
        v-if="isLoading && !location"
        class="absolute top-[50%] left-0 right-0 flex flex-col items-center justify-center z-20"
      >
        <up-loading mode="circle" color="#ffce2c"></up-loading>
        <text class="mt-[20rpx] text-[28rpx] text-[#666]">正在定位...</text>
      </view>
      
      <!-- 定位失败提示 -->
      <view
        v-if="status === 'denied'"
        class="absolute inset-0 bg-[rgba(0,0,0,0.5)] z-30 flex items-center justify-center p-[60rpx]"
      >
        <view class="bg-[#fff] rounded-[32rpx] p-[40rpx] text-center w-full">
          <up-icon name="location" size="80" color="#ffce2c"></up-icon>
          <text class="block text-[36rpx] font-bold text-[#333] mt-[30rpx]">定位已关闭</text>
          <text class="block text-[28rpx] text-[#666] mt-[20rpx] mb-[40rpx]">
            请前往设置开启定位权限，以获取附近商家服务
          </text>
          <view
            class="w-full h-[80rpx] bg-[#ffce2c] text-[#fff] text-[32rpx] rounded-[40rpx] flex items-center justify-center"
            @click="openSystemSettings"
          >
            去设置开启
          </view>
        </view>
      </view>
      
      <view
        v-if="status === 'failed'"
        class="absolute top-[50%] left-0 right-0 flex flex-col items-center justify-center z-20"
      >
        <up-icon name="close-circle" size="80" color="#ff6b81"></up-icon>
        <text class="mt-[20rpx] text-[28rpx] text-[#999]">定位失败，请重试</text>
        <view
          class="mt-[30rpx] px-[40rpx] py-[12rpx] bg-[#ffce2c] text-[#fff] rounded-[20rpx] text-[28rpx]"
          @click="reloadLocation"
        >
          点击重试
        </view>
      </view>
    </map>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLBS } from '@/utils/composables/useLBS'

// ==================== Props ==================== //

defineProps<{
  // 缩放级别
  scale?: number
}>()

// ==================== Emits ==================== //

const emit = defineEmits<{
  (e: 'markerTap', marker: MapMarker): void
  (e: 'detailClick', marker: MapMarker): void
}>()

// ==================== 响应式状态 ==================== //

const { 
  location, 
  status, 
  markers, 
  selectedMarker, 
  isCardVisible,
  locationText,
  sortedMerchants,
  getCurrentLocation,
  openSystemSettings,
  handleMarkerTap,
  closeCard,
  goToDetail
} = useLBS()

const isLoading = ref<boolean>(true)
const rating = ref<number>(0)

// 计算属性
const latitude = computed(() => location.value?.latitude || 39.9042) // 默认北京
const longitude = computed(() => location.value?.longitude || 116.4074) // 默认北京

// ==================== 生命周期 ==================== //

onMounted(() => {
  // 页面加载时获取位置
  getCurrentLocation().then((success) => {
    isLoading.value = false
  })
})

onUnmounted(() => {
  // 清理
})

// ==================== 事件处理 ==================== //

/**
 * 处理区域变化
 */
const handleRegionChange = (e: UniApp.MapRegionChangeEvent) => {
  // 可选：监听地图中心点变化，更新当前视图范围
  if (e.type === 'end') {
    console.log('[lbs-map] 地图区域变化:', e)
  }
}

/**
 * 处理授权请求
 */
const handleAuthorizationRequested = () => {
  console.log('[lbs-map] 用户点击了授权按钮')
  // 可以在这里添加额外的处理逻辑
}

/**
 * 重新加载定位
 */
const reloadLocation = () => {
  isLoading.value = true
  getCurrentLocation().then((success) => {
    isLoading.value = false
  })
}

/**
 * 关闭卡片
 */
const handleCloseCard = () => {
  closeCard()
}

/**
 * 跳转详情
 */
const handleGoToDetail = () => {
  goToDetail()
  emit('detailClick', selectedMarker.value!)
}

// 暴露给父组件的方法
defineExpose({
  reload: getCurrentLocation,
  getStatus: () => status.value,
  getLocation: () => location.value
})
</script>

<style scoped>
/* 所有样式使用 UnoCSS 原子类，此文件保留空 style 标签以符合 Vue SFC 规范 */
</style>
