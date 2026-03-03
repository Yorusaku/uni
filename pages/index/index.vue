<template>
	<view class="container">
		<view class="header" :style="headerStyle">
			<view class="status-bar"></view>
			<view class="nav-content" :style="navStyle">
				<view class="location" @click="startLocation">
					<uni-icons type="location" size="28" color="#fff"></uni-icons>
					<text class="city">{{cityName}}</text>
				</view>
				<view class="search-box">
					<uni-search-bar radius="100" placeholder="搜索宠物服务" clearButton="none" cancelButton="none"
						style="width: 100%;">
					</uni-search-bar>
				</view>
			</view>
		</view>

		<view class="content">
			<swiper class="banner-swiper" indicator-dots autoplay circular indicator-color="rgb(255,255,255,0.6)"
				indicator-active-color="#fff">
				<swiper-item v-for="item in bannerList" :key="item.title">
					<view class="swiper-item-content">
						<image :src="item.url" mode="aspectFill"></image>
					</view>
				</swiper-item>
			</swiper>

			<view class="part">
				<up-scroll-list indicatorColor="#fff0f0" indicatorActiveColor="#ffce2c">
					<view class="scroll-item" v-for="item in partList" :key="item.title" @click="goMerchant(item.title)">
						<image class="scroll-image" :src="item.url" mode="aspectFill"></image>
						<text class="item-title">{{item.title}}</text>
					</view>
				</up-scroll-list>
			</view>

			<view class="part">
				<view class="p-4 bg-white">
					<up-box height="180px" gap="12px" >
						<template #left>
							<image class="box-image" src="/static/modules/home/pic1.png" mode="aspectFill"></image>
						</template>
						<template #rightTop>
							<image class="box-image" src="/static/modules/home/pic2.png" mode="aspectFill"></image>
						</template>
						<template #rightBottom>
							<image class="box-image" src="/static/modules/home/pic3.png" mode="aspectFill"></image>
						</template>
					</up-box>
				</view>
			</view>
			<view class="exchange-section">
				<view class="section-title-area">
					<text class="section-title">省钱速报</text>
					<text class="section-subtitle">折扣促销每日更新</text>
					<view class="go-btn">GO</view>
				</view>
				<view class="promo-cards">
					<view class="promo-card">
						<image class="img-placeholder" src="/static/modules/home/pic4.jpg" mode="aspectFill"></image>
						<text class="promo-title">到店服务</text>
						<text class="promo-desc">限时降价</text>
						<view class="samll-go">GO</view>
					</view>
					<view class="promo-card">
						<image class="img-placeholder" src="/static/modules/home/pic5.jpg" mode="aspectFill"></image>
						<text class="promo-title">领券中心</text>
						<text class="promo-desc">618立减</text>
						<view class="samll-go">GO</view>
					</view>
				</view>
			</view>
			
			<view class="service-card" v-for="item in merchanList" :key="item.merchant_id">
				<image class="service-img" mode="aspectFill" :src="item.pic"></image>
				<view class="service-info">
					<text class="service-name">{{item.merchant_name}}</text>
					<view class="rate-area">
						<up-rate v-model="item.rating" readonly  inactive-color="#b2b2b2" active-color="#ffce2c"></up-rate>
						<text class="rate-text">{{item.rating}}</text>
					</view>
					<text class="service-detail">{{item.address}}</text>
					<view class="tag-area">
						<view class="tag-item" v-for="tag in item.service.split(',')" :key="tag">{{tag}}</view>
					</view>
					<view class="price-area">
						<view>惠</view>【新客福利】<text>￥19.9</text>代金券可领
					</view>
				</view>
			</view>
			<up-divider text="我是有底线的"></up-divider>

		</view>
	</view>
</template>

<script setup lang="ts">
	import { onLoad,onReachBottom } from "@dcloudio/uni-app"
	import { ref, computed } from "vue"
	import { reverseCode } from "../../utils/getcode"
	import { get } from "../../utils/http"
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
		getMerchanList(1)
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

<style lang="scss" scoped>
	.container {
		background-color: #f7f7f7;
		.header {
			background-color: $uni-color-primary;

			.status-bar {
				width: 100%;
				height: var(--status-bar-height);
			}

			.nav-content {
				display: flex;
				align-items: center;
				padding: 0 30rpx;
				position: fixed;
				left: 0;
				right: 0;

				.location {
					display: flex;
					align-items: center;
					margin-right: 10rpx;

					.city {
						color: #fff;
						font-size: 28rpx;
						width: 120rpx;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
					}
				}

				.search-box {
					width: 360rpx;
				}
			}
		}
		.content {
			padding: 0 20rpx;
			.banner-swiper {
				width: 100%;
				height: 350rpx;
				margin-top: 20rpx;

				.swiper-item-content {
					width: 100%;
					height: 100%;

					image {
						width: 100%;
						height: 100%;
						border-radius: 16rpx;

					}
				}
			}

			.part {
				background-color: #fff;
				margin-top: 20rpx;
				margin-bottom: 24rpx;
				border-radius: 16rpx;
				padding: 30rpx;

				.scroll-item {
					text-align: center;

					.scroll-image {
						width: 90rpx;
						height: 90rpx;
						box-sizing: border-box;
						margin: 0 20rpx;
					}

					.item-title {
						font-size: 24rpx;
						color: $uni-text-color;
						white-space: nowrap;
						overflow: hidden;
						text-overflow: ellipsis;
					}
				}
				.box-image{
					width: 100%;
					height: 100%;
					border-radius: 16rpx;
				}

			}
			.exchange-section{
				background-color: #fff;
				border-radius: 16rpx;
				padding: 30rpx;
				margin-bottom: 24rpx;
				.section-title-area{
					display: flex;
					align-items: center;
					margin-bottom: 24rpx;
					.section-title{
						font-size: 32rpx;
						font-weight: bold;
						color: #000;
						margin-right: 16rpx;
					}
					.section-subtitle{
						font-size: 24rpx;
						color:$uni-text-color-grey ;
						flex:1
					}
					.go-btn{
						background-color: #ff6b81;
						border-radius: 22rpx;
						font-size: 24rpx;
						color: #fff;
						padding: 4rpx 20rpx;
					}
				}
				.promo-cards{
					display: flex;
					justify-content: space-between;
					.promo-card{
						width: 330rpx;
						background-color: #f9f9f9;
						border-radius:16rpx;
						padding: 20rpx;
						position: relative;
						.img-placeholder{
							width: 100%;
							height: 160rpx;
							border-radius: 8rpx;
							margin-bottom: 16px;
						}
						.promo-title{
							font-size: 28rpx;
							color: $uni-text-color;
							line-height: 40rpx;
							display: block;
						}
						.promo-desc{
							font-size: 24rpx;
							color: #999;
							line-height: 34rpx;
							display: block;
						}
						.samll-go{
							position: absolute;
							right: 20rpx;
							bottom:20rpx;
							background-color: #ff6b81;
							border-radius: 16rpx;
							font-size: 20rpx;
							color: #fff;
							padding: 2rpx 16rpx;
						}
					}
				}
				
			}
			.service-card{
				display: flex;
				background-color: #fff;
				border-radius: 16rpx;
				margin: 10rpx 0 10rpx 0;
				padding: 20rpx;
				.service-img{
					width: 160rpx;
					height: 160rpx;
					background-color: #ddd;
					border-radius: 8rpx;
					margin-right: 20rpx;
					margin-top: 8rpx;
				}
				.service-info{
					flex: 1;
					.service-name{
						font-size: 32rpx;
						font-weight: bold;
						color: #000;
						line-height:44rpx;
						display: block;
						margin-bottom: 8rpx;
					}
					.rate-area{
						display: flex;
						align-items: center;
						margin-bottom: 8rpx;
						.rate-text{
							color: $uni-color-primary;
							font-size: 28rpx;
							margin-left: 10rpx;
						}
						
					}
					.service-detail{
						font-size: 24rpx;
						color: #999;
						line-height: 34rpx;
						display: block;
						margin-bottom: 20rpx;
					}
					.tag-area{
						display:flex;
						align-items: center;
						margin: 12rpx 0;
						.tag-item{
							font-size: 18rpx;
							padding: 4rpx 14rpx;
							border-radius: 20rpx;
							margin-right: 16rpx;
							border:1px solid;
							&:nth-child(1){
								color: #ff6b81;
								border-color: #ff6b81;
								background-color: rgba(255, 107, 129, 0.1);
							}
							&:nth-child(2){
								color: #ffce2c;
								border-color: #ffce2c;
								background-color: rgba(255, 206, 44, 0.1);
							}
							&:nth-child(3){
								color: #19be6b;
								border-color: #19be6b;
								background-color: rgba(25, 190, 107, 0.1);
							}
							&:nth-child(4){
								color: #ff9900;
								border-color: #ff9900;
								background-color: rgba(255, 153, 0, 0.1);
							}
							&:last-child{
								margin-right: 0;
							}
						}
					}
					.price-area{
						display: flex;
						align-items: center;
						margin-top: 16rpx;
						font-size: 24rpx;
						color:#666;
						view{
							background-color: $uni-color-primary;
							color: #fff;
							font-size: 20rpx;
							padding: 2rpx 8rpx;
							border-radius: 4rpx;
							margin-right: 8rpx;
						}
						text{
							color: #ff6b81;
							font-size: 24rpx;
							margin: 0 4rpx;
						}
					}
					
				}
			}
			
		}
	}
</style>