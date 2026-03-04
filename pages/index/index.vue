<template>
	<view class="bg-f7f7f7">
		<view :style="headerStyle" class="bg-primary">
			<view class="w-full h-[var(--status-bar-height)]"></view>
			<view :style="navStyle" class="flex items-center px-[30rpx] fixed left-0 right-0">
				<view class="flex items-center mr-[10rpx]" @click="startLocation">
					<uni-icons type="location" size="28" color="#fff"></uni-icons>
					<text class="text-[#fff] text-[28rpx] w-[120rpx] whitespace-nowrap overflow-hidden text-ellipsis">{{cityName}}</text>
				</view>
				<view class="w-[360rpx]">
					<uni-search-bar radius="100" placeholder="搜索宠物服务" clearButton="none" cancelButton="none"
						style="width: 100%;">
					</uni-search-bar>
				</view>
			</view>
		</view>

		<view class="px-[20rpx]">
			<!-- 轮播图 -->
			<us-skeleton :loading="isLoading" type="default" :rows="1">
				<swiper class="w-full h-[350rpx] mt-[20rpx]" indicator-dots autoplay circular indicator-color="rgb(255,255,255,0.6)"
					indicator-active-color="#fff">
					<swiper-item v-for="item in bannerList" :key="item.title">
						<view class="w-full h-full">
							<!-- 使用懒加载 -->
							<image class="w-full h-full rounded-[16rpx]" :src="item.url" mode="aspectFill" lazy-load></image>
						</view>
					</swiper-item>
				</swiper>
			</us-skeleton>

			<!-- 分类列表 -->
			<us-skeleton :loading="isLoading" type="list" :list-count="4">
				<view class="bg-white mt-[20rpx] mb-[24rpx] rounded-[16rpx] p-[30rpx]">
					<up-scroll-list indicatorColor="#fff0f0" indicatorActiveColor="#ffce2c">
						<view class="text-center" v-for="item in partList" :key="item.title" @click="goMerchant(item.title)">
							<image class="w-[90rpx] h-[90rpx] box-border mx-[20rpx]" :src="item.url" mode="aspectFill" lazy-load></image>
							<text class="text-[24rpx] text-[#333] whitespace-nowrap overflow-hidden text-ellipsis">{{item.title}}</text>
						</view>
					</up-scroll-list>
				</view>
			</us-skeleton>

			<!-- 首页广告图 -->
			<us-skeleton :loading="isLoading" type="default" :rows="3">
				<view class="bg-white mt-[20rpx] mb-[24rpx] rounded-[16rpx] p-[30rpx]">
					<up-box height="180px" gap="12px" >
						<template #left>
							<image class="w-full h-full rounded-[16rpx]" src="/static/modules/home/pic1.png" mode="aspectFill" lazy-load></image>
						</template>
						<template #rightTop>
							<image class="w-full h-full rounded-[16rpx]" src="/static/modules/home/pic2.png" mode="aspectFill" lazy-load></image>
						</template>
						<template #rightBottom>
							<image class="w-full h-full rounded-[16rpx]" src="/static/modules/home/pic3.png" mode="aspectFill" lazy-load></image>
						</template>
					</up-box>
				</view>
			</us-skeleton>
			
			<view class="bg-white rounded-[16rpx] p-[30rpx] mb-[24rpx]">
				<view class="flex items-center mb-[24rpx]">
					<text class="text-[32rpx] font-bold text-[#000] mr-[16rpx]">省钱速报</text>
					<text class="text-[24rpx] text-grey flex-1">折扣促销每日更新</text>
					<view class="bg-[#ff6b81] rounded-[22rpx] text-[24rpx] text-[#fff] px-[20rpx] py-[4rpx]">GO</view>
				</view>
				<us-skeleton :loading="promoList.length === 0" type="list" :list-count="3">
					<view class="flex justify-between">
						<view class="w-[330rpx] bg-[#f9f9f9] rounded-[16rpx] p-[20rpx] relative" v-for="item in promoList" :key="item.title">
							<image class="w-full h-[160rpx] rounded-[8rpx] mb-[16px]" :src="item.img" mode="aspectFill" lazy-load></image>
							<text class="text-[28rpx] text-[#333] leading-[40rpx] block">{{item.title}}</text>
							<text class="text-[24rpx] text-[#999] leading-[34rpx] block">{{item.desc}}</text>
							<view class="absolute right-[20rpx] bottom-[20rpx] bg-[#ff6b81] rounded-[16rpx] text-[20rpx] text-[#fff] px-[16rpx] py-[2rpx]">GO</view>
						</view>
					</view>
				</us-skeleton>
			</view>

			<!-- 商家列表 -->
			<us-skeleton :loading="merchanList.length === 0" type="list" :list-count="5">
				<view class="bg-white rounded-[16rpx] my-[10rpx] p-[20rpx]" v-for="item in merchanList" :key="item.merchant_id">
					<image class="w-[160rpx] h-[160rpx] bg-[#ddd] rounded-[8rpx] mr-[20rpx] mt-[8rpx]" mode="aspectFill" :src="item.pic" lazy-load></image>
					<view class="flex-1">
						<text class="text-[32rpx] font-bold text-[#000] leading-[44rpx] block mb-[8rpx]">{{item.merchant_name}}</text>
						<view class="flex items-center mb-[8rpx]">
							<up-rate v-model="item.rating" readonly inactive-color="#b2b2b2" active-color="#ffce2c"></up-rate>
							<text class="text-[28rpx] text-primary ml-[10rpx]">{{item.rating}}</text>
						</view>
						<text class="text-[24rpx] text-[#999] leading-[34rpx] block mb-[20rpx]">{{item.address}}</text>
						<view class="flex items-center my-[12rpx]">
							<view class="text-[18rpx] px-[14rpx] py-[4rpx] rounded-[20rpx] mr-[16rpx] border"
								v-for="(tag, index) in item.service.split(',')" :key="tag"
								:class="getTagClass(index)">
								{{tag}}
							</view>
						</view>
						<view class="flex items-center mt-[16rpx] text-[24rpx] text-[#666]">
							<view class="bg-primary text-[#fff] text-[20rpx] px-[8rpx] py-[2rpx] rounded-[4rpx] mr-[8rpx]">惠</view>
							【新客福利】<text class="text-[#ff6b81] text-[24rpx] mx-[4rpx]">￥19.9</text>代金券可领
						</view>
					</view>
				</view>
			</us-skeleton>
			<up-divider text="我是有底线的"></up-divider>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { onLoad,onReachBottom } from "@dcloudio/uni-app"
	import { ref, computed } from "vue"
	import { reverseCode } from "../../utils/getcode"
	import { get } from "../../utils/http"
	
	// 骨架屏状态
	const isLoading = ref(true)
	
	const menuButtonInfo = ref<any>(null)
	onLoad(() => {
		// #ifdef MP-WEIXIN
		menuButtonInfo.value = uni.getMenuButtonBoundingClientRect();
		// #endif
		// #ifdef WEB || APP-PLUS
		menuButtonInfo.value = {
			top: 0,
			height: 44
		}
		// #endif
		startLocation()
		getBannerList()
		getPartList()
		getMerchanList(1).then(() => {
			// 数据加载完成，隐藏骨架屏
			isLoading.value = false
		})
	})
	interface BannerItem {
		url : string;
		title : string;
	}
	interface MerchantItem{
		merchant_id:number;
		address:string;
		business_hours:string;
		merchant_name:string;
		phone:string;
		pic:string;
		rating:string;
		service:string
	}

	const headerStyle = computed(() => {
		let style = {
			height: "200px"
		}
		// #ifdef MP-WEIXIN
		if (menuButtonInfo.value) {
			style = {
				height: `${menuButtonInfo.value.top + menuButtonInfo.value.height + 20}px`
			}
		}
		// #endif

		// #ifdef WEB || APP-PLUS
		style = {
			height: "90px"
		}
		// #endif
		return style
	})
	const navStyle = computed(() => {
		let style = {
			top: "0",
			height: "44px"
		}
		// #ifdef MP-WEIXIN
		if (menuButtonInfo.value) {
			style = {
				top: `${menuButtonInfo.value.top}px`,
				height: `${menuButtonInfo.value.height}px`
			}
		}
		// #endif
		// #ifdef WEB || APP-PLUS
		style = {
			top: "20px",
			height: "50px"
		}
		// #endif
		return style
	})

	//地理信息定位
	const cityName = ref<string>("");
	const startLocation = () => {
		console.log("开始定位")
		uni.getLocation({
			type: "wgs84",
			geocode: true,
			success(res) {
				console.log("获取地理位置成功")
				console.log("经度是", res.longitude)
				console.log("纬度是", res.latitude)
				reverseCode(res.longitude, res.latitude).then(res => {
					cityName.value = res
				}).catch(() => {
					cityName.value = "无法定位"
				})
			},
			fail() {
				cityName.value = "无法获取位置";
				console.log("获取地理位置失败")
				uni.showModal({
					title: "提示",
					content: "需要获取您的位置信息，是否去设置开启定位权限",
					success(res) {
						if (res.confirm) {
							// #ifdef MP-WEIXIN
							uni.openSetting({
								success(settings) {
									console.log("设置页面", settings)
								}
							})
							// #endif		
							// #ifdef APP-PLUS
							uni.showModal({
								title: "提示",
								content: "请去系统设置中开启定位权限并重新定位",
								showCancel: false
							})
							// #endif
							// #ifdef WEB
							setTimeout(() => {
								uni.showModal({
									title: "提示",
									content: "请在浏览器设置中允许定位权限，并重新定位",
									showCancel: false
								})
							}, 300)

							// #endif
						}
					}
				})
			}
		})
	}

	//banner获取
	const bannerList = ref<BannerItem[]>([])
	const getBannerList = async () => {
		try {
			const data : any = await get("/home/banner");
			bannerList.value = data.banner
			// 初始化促销卡片数据
			if (data.banner && data.banner.length >= 2) {
				promoList.value = [
					{ title: '到店服务', desc: '限时降价', img: '/static/modules/home/pic4.jpg' },
					{ title: '领券中心', desc: '618立减', img: '/static/modules/home/pic5.jpg' }
				]
			}
		} catch (err) {
			console.error(err)
		}
	}

	//功能列表板块
	const partList = ref<BannerItem[]>([])
	const getPartList = async () => {
		try {
			const data : any = await get("/home/part")
			partList.value = data.part
		} catch (err) {
			console.error(err)
		}
	}
	
	//促销卡片列表
	const promoList = ref<Array<{title: string, desc: string, img: string}>>([])
	
	//标签颜色样式
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
	
	//商家列表
	const merchanList=ref<MerchantItem[]>([])
	const currentPage=ref<number>(1)
	const totalPages=ref<number>(0)
	const getMerchanList=async (page:number)=>{
		try {
			const data:any=await get("/home/merchants",{page});
			if(page===1){
				merchanList.value=data.list
			}else{
				merchanList.value=[...merchanList.value,...data.list]
			}
			totalPages.value=data.pagination.totalPages
			currentPage.value=data.pagination.current
		} catch (error) {
			console.error("获取失败")
		}	
	}
	const goMerchant=(title:string)=>{
		uni.navigateTo({
			url:"/packageB/merchant/merchant?keyword="+title
		})
	}
	onReachBottom(()=>{
		if(currentPage.value<totalPages.value){
			getMerchanList(currentPage.value+1)
		}
	})
</script>


