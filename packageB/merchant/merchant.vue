<template>
	<view class="bg-[#f5f5f5]">
		<!--搜索栏-->
		<view class="bg-[#fff] p-[30rpx]">
			<up-search 
				placeholder="搜索商家" 
				v-model="searchWord" 
				@click="handleSearch" 
				:clearabled="false"
				class="w-full"
			></up-search>
		</view>

		<!--筛选条件-->
		<view class="bg-[#fff]">
			<view class="flex items-center border-b border-[#f0f0f0]">
				<view 
					class="flex-1 flex items-center justify-center px-[20rpx] py-[30rpx]" 
					v-for="(item, index) in sortList" 
					:key="index"
					@click="changeSort(index)"
				>
					<text class="text-[28rpx] text-[#333] mr-[10rpx]">{{item.text}}</text>
					<up-icon 
						name="arrow-down" 
						size="16" 
						color="#999"
						class="transition-transform duration-300"
						:class="{ 'rotate-180': sortIndex === index && sortDesc }"
					></up-icon>
				</view>
			</view>
		</view>

		<!--Tab 切换-->
		<view class="bg-[#fff]">
			<up-tabs 
				:list="categoryList" 
				v-model:current="currentIndex" 
				@click="handleTabSelect"
				text-color="#666"
				active-color="#333"
				line-color="#ffce2c"
			></up-tabs>
		</view>

		<!--虚拟列表（使用 z-paging）-->
		<!-- 注意：需要先运行 pnpm add z-paging-uquery 安装依赖 -->
		<z-paging 
			ref="pagingRef"
			class="w-full"
			:use-slot-loading="true"
			:auto-refresh="true"
			@cell="handleCellClick"
			@item-click="handleItemClick"
		>
			<!--自定义加载中 tooltip-->
			<template #loading-tooltip>
				<text class="text-[24rpx] text-[#999]">加载中...</text>
			</template>

			<!--自定义空数据-->
			<template #empty>
				<view class="flex flex-col items-center justify-center py-[200rpx]">
					<up-icon name="shop" size="80" color="#ccc"></up-icon>
					<text class="mt-[20rpx] text-[28rpx] text-[#999]">暂无商家数据</text>
				</view>
			</template>

			<!--自定义加载失败-->
			<template #error>
				<view class="flex flex-col items-center justify-center py-[200rpx]">
					<up-icon name="close-circle" size="80" color="#ccc"></up-icon>
					<text class="mt-[20rpx] text-[28rpx] text-[#999]">加载失败，请下拉刷新</text>
					<view 
						class="mt-[30rpx] px-[40rpx] py-[12rpx] bg-[#ffce2c] text-[#fff] rounded-[20rpx] text-[28rpx]"
						@click="refreshList"
					>
						点击重试
					</view>
				</view>
			</template>

			<!--列表项-->
			<template #default="{ item, index }">
				<view 
					class="bg-[#fff] rounded-[16rpx] my-[10rpx] p-[20rpx]" 
					@click="goDetail(item)"
				>
					<image 
						class="w-[160rpx] h-[160rpx] bg-[#ddd] rounded-[8rpx] mr-[20rpx] mt-[8rpx]" 
						mode="aspectFill" 
						:src="item.pic"
					></image>
					<view class="flex-1">
						<text class="text-[32rpx] font-bold text-[#000] leading-[44rpx] block mb-[8rpx]">{{item.merchant_name}}</text>
						<view class="flex items-center mb-[8rpx]">
							<up-rate 
								v-model="item.rating" 
								readonly  
								inactive-color="#b2b2b2" 
								active-color="#ffce2c"
							></up-rate>
							<text class="text-[28rpx] text-primary ml-[10rpx]">{{item.rating}}</text>
						</view>
						<text class="text-[24rpx] text-[#999] leading-[34rpx] block mb-[20rpx]">{{item.address}}</text>
						<view class="flex items-center my-[12rpx]">
							<view 
								class="text-[18rpx] px-[14rpx] py-[4rpx] rounded-[20rpx] mr-[16rpx] border" 
								v-for="(tag, tagIndex) in item.service.split(',')" 
								:key="tag" 
								:class="getTagClass(tagIndex)"
							>
								{{tag}}
							</view>
						</view>
						<view class="flex items-center mt-[16rpx] text-[24rpx] text-[#666]">
							<view class="bg-primary text-[#fff] text-[20rpx] px-[8rpx] py-[2rpx] rounded-[4rpx] mr-[8rpx]">惠</view>
							【新客福利】<text class="text-[#ff6b81] text-[24rpx] mx-[4rpx]">￥19.9</text>代金券可领
						</view>
					</view>
				</view>
			</template>
		</z-paging>

		<!--排序弹窗-->
		<up-picker 
			ref="uPickerRef" 
			:show="show" 
			:columns="sortColumns" 
			@cancel="closeSortPicker" 
			@confirm="confirmSort"
		></up-picker>
	</view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { get } from '../../utils/http'
import { onReachBottom, onLoad, onShow } from '@dcloudio/uni-app'

// 排序选项列表
interface SortItem {
	text: string
	value: string
}

const sortList = ref<SortItem[]>([
	{ text: '距离', value: '' },
	{ text: '好评', value: 'rating' },
	{ text: '价格', value: 'price' }
])

// Tab 分类列表
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

// 商家列表项类型定义
interface MerchantItem {
	merchant_id: number
	address: string
	business_hours: string
	merchant_name: string
	phone: string
	pic: string
	rating: string
	service: string
	sort?: string // 排序字段
}

// 排序查询参数
interface MerchantListParams {
	keyword: string
	merchantName: string
	sortBy: 'rating' | 'rating_asc' | 'price' | 'price_asc' | ''
}

// 状态引用
const pagingRef = ref<InstanceType<typeof z-paging>>(null)
const uPickerRef = ref(null)

// 数据状态
const searchWord = ref<string>('')
const currentIndex = ref<number>(0)
const sortIndex = ref<number>(0)
const sortDesc = ref<boolean>(false)
const show = ref<boolean>(false)

// 查询参数
const params = reactive<MerchantListParams>({
	keyword: '',
	merchantName: '',
	sortBy: ''
})

// 列表数据
const merchantList = ref<MerchantItem[]>([])

// Tab 切换处理
const handleTabSelect = (item: { name: string }, index: number) => {
	searchWord.value = ''
	params.merchantName = ''
	if (index === 0) {
		params.keyword = ''
	} else {
		params.keyword = item.name
	}
	pagingRef.value?.reload()
}

// 搜索处理
const handleSearch = (value: string) => {
	params.merchantName = value
	params.keyword = ''
	currentIndex.value = 0
	pagingRef.value?.reload()
}

// 排序处理
const changeSort = (index: number) => {
	if (sortIndex.value === index) {
		sortDesc.value = !sortDesc.value
	} else {
		sortIndex.value = index
		sortDesc.value = false
	}
	
	// 根据排序索引设置排序字段
	if (index === 0) {
		params.sortBy = ''
	} else if (index === 1) {
		params.sortBy = sortDesc.value ? 'rating_asc' : 'rating'
	} else if (index === 2) {
		params.sortBy = sortDesc.value ? 'price_asc' : 'price'
	}
	
	pagingRef.value?.reload()
}

// 关闭排序弹窗
const closeSortPicker = () => {
	show.value = false
}

// 确认排序
const confirmSort = (e: any) => {
	if (e.value[0] === '默认') {
		params.sortBy = ''
	} else if (e.value[0] === '由高到低') {
		params.sortBy = sortIndex.value === 1 ? 'rating' : 'price'
	} else if (e.value[0] === '由低到高') {
		params.sortBy = sortIndex.value === 1 ? 'rating_asc' : 'price_asc'
	}
	closeSortPicker()
	pagingRef.value?.reload()
}

// 标签颜色样式
const getTagClass = (index: number) => {
	const colors = [
		{ text: '#ff6b81', border: '#ff6b81', bg: 'rgba(255, 107, 129, 0.1)' },
		{ text: '#ffce2c', border: '#ffce2c', bg: 'rgba(255, 206, 44, 0.1)' },
		{ text: '#19be6b', border: '#19be6b', bg: 'rgba(25, 190, 107, 0.1)' },
		{ text: '#ff9900', border: '#ff9900', bg: 'rgba(255, 153, 0, 0.1)' }
	]
	const color = colors[index % colors.length]
	return {
		style: `color: ${color.text}; border-color: ${color.border}; background-color: ${color.bg}`
	}
}

// 重新加载列表
const refreshList = () => {
	pagingRef.value?.reload()
}

// 排序列数据
const sortColumns = reactive([
	['默认', '由高到低', '由低到高']
])

// 列表请求方法（z-paging 要求的方法名：queryList）
const queryList = async (pageNo: number, pageSize: number) => {
	try {
		const data: any = await get('/home/merchants', {
			page: pageNo,
			pageSize: pageSize,
			...params
		})
		
		// z-paging 要求返回的数据必须包含 total 字段
		if (data.list && data.pagination) {
			pagingRef.value?.complete(data.list, data.pagination.total)
			return {
				list: data.list,
				total: data.pagination.total
			}
		}
		
		pagingRef.value?.complete(data.list || [])
		return {
			list: data.list || [],
			total: data.list?.length || 0
		}
	} catch (error) {
		console.error('获取商家列表失败:', error)
		pagingRef.value?.complete(false)
		return {
			list: [],
			total: 0,
			error: true
		}
	}
}

// 跳转到详情页
const goDetail = (item: MerchantItem) => {
	uni.navigateTo({
		url: `/packageB/merchant-detail/merchant-detail?info=${JSON.stringify(item)}`
	})
}

// 单元格点击（用于 z-paging 的 cell 事件）
const handleCellClick = (index: number, item: MerchantItem) => {
	goDetail(item)
}

// 项点击（用于 z-paging 的 item-click 事件）
const handleItemClick = (index: number, item: MerchantItem) => {
	goDetail(item)
}

// 组件生命周期
onLoad((options) => {
	// 从路由参数中获取分类索引
	if (options.keyword) {
		const index: number = categoryList.findIndex(
			(item: { name: string }) => options.keyword.includes(item.name)
		)
		currentIndex.value = index === -1 ? 0 : index
		params.keyword = index === -1 ? '' : categoryList[index].name
	}
})

onShow(() => {
	// 页面显示时刷新
	pagingRef.value?.reload()
})

onUnmounted(() => {
	// 清理
})
</script>
