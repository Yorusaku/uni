<template>
	<view class="page">
		<!-- 骨架屏：公告栏 -->
		<us-skeleton :loading="isLoading" type="default" :rows="1">
			<up-notice-bar text="您有一份宠物大礼包待领取，请及时领取" mode="closable"></up-notice-bar>
		</us-skeleton>

		<!-- 骨架屏：服务列表 -->
		<us-skeleton :loading="isLoading" type="list" :list-count="8">
			<view class="service-list">
				<view class="service-item" v-for="item in serviceList" :key="item.name">
					<view class="icon" :style="{background:item.bgColor}">
						<image :src="item.icon" mode="aspectFill" lazy-load></image>
					</view>
					<text class="name">{{item.name}}</text>
				</view>
			</view>
		</us-skeleton>

		<!-- 骨架屏：宠物图片 -->
		<us-skeleton :loading="isLoading" type="default" :rows="2">
			<view class="pet-images">
				<image src="/static/modules/service/dog.jpg" mode="aspectFill" lazy-load></image>
				<image src="/static/modules/service/cat.jpg" mode="aspectFill" lazy-load></image>
			</view>
		</us-skeleton>

		<view class="fish-bone">
			<image src="/static/modules/service/鱼骨.png" mode="aspectFit" lazy-load></image>
			<text>宠物领养</text>
		</view>

		<!-- 骨架屏：领养列表 -->
		<us-skeleton :loading="adoptList.length === 0" type="list" :list-count="3">
			<scroll-view scroll-x class="scroll-view">
				<view class="scroll-view-item" v-for="item in adoptList" :key="item.id">
					<image :src="item.pic" mode="aspectFill" lazy-load></image>
					<text>{{item.location}}</text>
					<text>{{item.name}}</text>
					<text>待领养：{{item.count}}</text>
					<up-rate v-model="item.rate" readonly inactive-color="#b2b2b2" active-color="#ffce2c" activeIcon="heart-fill" inactiveIcon="heart"></up-rate>
				</view>
			</scroll-view>
		</us-skeleton>

		<view class="fish-bone">
			<image src="/static/modules/service/鱼骨.png" mode="aspectFit" lazy-load></image>
			<text>附近商家</text>
		</view>

		<!-- 骨架屏：商家列表 -->
		<us-skeleton :loading="merchanList.length === 0" type="list" :list-count="3">
			<view class="service-card" v-for="item in merchanList" :key="item.merchant_id">
				<image class="service-img" mode="aspectFill" :src="item.pic" lazy-load></image>
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
						<view>￥</view>【新客福利】<text class="text-[#ff6b81] text-[24rpx] mx-[4rpx]">￥19.9</text>代金券可领
					</view>
				</view>
			</view>
		</us-skeleton>
		<up-divider text="我是有底线的"></up-divider>
	</view>
</template>

<script setup lang="ts">
	import { ref } from 'vue';
	import { get } from '../../utils/http';
	import {onLoad,onReachBottom} from "@dcloudio/uni-app"

	// 骨架屏状态
	const isLoading = ref(true)

	interface AdoptItem{
		id:number;
		count:number;
		location:string;
		name:string;
		pic:string;
		rate:string
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
	const serviceList = [
		{
			name: "宠物修剪",
			icon: "/static/modules/service/pet1.png",
			bgColor: "#f0f9ff"
		},
		{
			name: '宠物洗澡',
			icon: '/static/modules/service/pet2.png',
			bgColor: '#f0fdf4'
		},
		{
			name: '宠物医疗',
			icon: '/static/modules/service/pet3.png',
			bgColor: '#fef2f2'
		},
		{
			name: '宠物哺乳',
			icon: '/static/modules/service/pet4.png',
			bgColor: '#fdf4ff'
		},
		{
			name: '宠物狗窝',
			icon: '/static/modules/service/pet5.png',
			bgColor: '#fff7ed'
		},
		{
			name: '宠物玩具',
			icon: '/static/modules/service/pet6.png',
			bgColor: '#f0fdfa'
		},
		{
			name: '宠物罐头',
			icon: '/static/modules/service/pet7.png',
			bgColor: '#faf5ff'
		},
		{
			name: '宠物背包',
			icon: '/static/modules/service/pet8.png',
			bgColor: '#fff1f2'
		}
	]
	
	const adoptList=ref<AdoptItem[]>([])
	const getAdoptList=async ()=>{
		try {
			const res:any=await get("/adopt/list");
			adoptList.value=res
		} catch (error) {
			console.log("获取失败")
			//TODO handle the exception
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
	
	onReachBottom(()=>{
		if(currentPage.value<totalPages.value){
			getMerchanList(currentPage.value+1)
		}
	})
	onLoad(()=>{
		getAdoptList()
		getMerchanList(1).then(() => {
			// 数据加载完成，隐藏骨架屏
			isLoading.value = false
		})
	})
</script>