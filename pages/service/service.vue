<template>
	<view class="page">
		<up-notice-bar text="您有一份宠物大礼包待领取，请及时领取" mode="closable"></up-notice-bar>
		<view class="service-list">
			<view class="service-item" v-for="item in serviceList" :key="item.name">
				<view class="icon" :style="{background:item.bgColor}">
					<image :src="item.icon" mode="aspectFill"></image>
				</view>
				<text class="name">{{item.name}}</text>
			</view>
		</view>
		<view class="pet-images">
			<image src="/static/modules/service/dog.jpg" mode="aspectFill"></image>
			<image src="/static/modules/service/cat.jpg" mode="aspectFill"></image>
		</view>
		<view class="fish-bone">
			<image src="/static/modules/service/鱼骨头.png" mode="aspectFit"></image>
			<text>宠物领养</text>
		</view>
		<scroll-view scroll-x class="scroll-view">
			<view class="scroll-view-item" v-for="item in adoptList" :key="item.id">
				<image :src="item.pic" mode="aspectFill"></image>
				<text>{{item.location}}</text>
				<text>{{item.name}}</text>
				<text>待领养：{{item.count}}只</text>
				<up-rate v-model="item.rate" readonly inactive-color="#b2b2b2" active-color="#ffce2c" activeIcon="heart-fill" inactiveIcon="heart"></up-rate>
			</view>	
		</scroll-view>
		<view class="fish-bone">
			<image src="/static/modules/service/鱼骨头.png" mode="aspectFit"></image>
			<text>附近商家</text>
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
</template>

<script setup lang="ts">
	import { ref } from 'vue';
	import { get } from '../../utils/http';
	import {onLoad,onReachBottom} from "@dcloudio/uni-app"
	
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
		getMerchanList(1)
	})
</script>

<style lang="scss" scoped>
.page{
	min-height: 100vh;
	background-color: #f5f5f5;
	padding: 0 30rpx;
	.service-list{
		display: flex;
		flex-wrap: wrap;
		background-color: #fff;
		border-radius:20rpx;
		padding: 30rpx;
		margin: 20rpx 0;
		.service-item{
			width: 25%;
			display: flex;
			flex-direction: column;
			align-items: center;
			margin-bottom: 40rpx;
			.icon{
				width: 100rpx;
				height: 100rpx;
				border-radius: 20rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				margin-bottom: 16rpx;
				image{
					width: 50rpx;
					height: 50rpx;
				}
			}
			.name{
				font-size: 24rpx;
				color: #333;
			}
		}
	}
	.pet-images{
		display: flex;
		justify-content: space-between;
		margin-top: 20rpx;
		image{
			width: 360rpx;
			height: 140rpx;
			border: 4rpx solid #fff;
			&:first-child{
				margin-right: 20rpx;
			}
		}
	}
	.fish-bone{
		display: flex;
		align-items: center;
		margin-top: 20rpx;
		image{
			width: 40rpx;
			height: 40rpx;
			transform: rotate(90deg);
			margin-right: 10rpx;
		}
		text{
			font-size: 36rpx;
			font-weight: bold;
			color: #333;
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
	.scroll-view{
		white-space: nowrap;
		.scroll-view-item{
			display: inline-block;
			width: 240rpx;
			height: 300rpx;
			background-color: #fff;
			border-radius: 20rpx;
			margin-right: 20rpx;
			position: relative;
			padding: 20rpx;
			margin-top: 80rpx;
			image{
				width: 120rpx;
				height: 120rpx;
				border-radius: 50%;
				position: absolute;
				left:50%;
				top:-50rpx;
				transform: translateX(-50%);
				border: 4rpx solid #fff;
				box-shadow: 0 0 10rpx rgba(0, 0, 0, 0.1);
			}
			text{
				display: block;
				text-align: center;
				&:nth-child(2){
					font-size: 24rpx;
					color: #999;
					margin-top: 80rpx;
				}
				&:nth-child(3){
					font-size: 32rpx;
					color: #333;
					margin-top: 12rpx;
					font-weight: bold;
				}
				&:nth-child(4){
					font-size: 26rpx;
					color: #ff6b6b;
					margin: 20rpx 0;
					
				}
			}
			.up-rate{
				display: flex;
				justify-content: center;
			}
		}
	}
}
</style>