<template>
	<view class="page">
		<!--用户信息模块-->
		<view class="user-info">
			<view class="avatar-placeholder">
				<image :src="avatar"></image>
			</view>
			<view class="user-detail">
				<text class="username">{{userInfo?nickName:"用户暂未登录"}}</text>
				<text class="user-level" @click="handleLogin" v-if="!userInfo">点击去登录</text>
			</view>
		</view>
		<!--我的订单-->
		<view class="order-section">
			<view class="section-header">
				<text>我的订单</text>
				<text class="more">查看全部 > </text>
			</view>
			<view class="order-types">
				<view class="order-item">
					<image src="/static/modules/mine/待付款.png"></image>
					<text>待付款</text>
				</view>
				<view class="order-item">
					<image src="/static/modules/mine/待服务.png"></image>
					<text>待服务</text>
				</view>
				<view class="order-item">
					<image src="/static/modules/mine/待评价.png"></image>
					<text>待评价</text>
				</view>
				<view class="order-item">
					<image src="/static/modules/mine/退款.png"></image>
					<text>退款/售后</text>
				</view>
			</view>
		</view>
		<!--我的服务-->
		<view class="business-section">
			<view class="section-header">
				<text>我的服务</text>
			</view>
			<view class="business-grid">
				<view class="business-item">
					<image src="/static/modules/mine/预约.png"></image>
					<text>我的预约</text>
				</view>
				<view class="business-item">
					<image src="/static/modules/mine/视频问诊.png"></image>
					<text>我的问诊</text>
				</view>
				<view class="business-item">
					<image src="/static/modules/mine/拼团.png"></image>
					<text>我的拼团</text>
				</view>
				<view class="business-item">
					<image src="/static/modules/mine/收藏.png"></image>
					<text>我的收藏</text>
				</view>
			</view>
		</view>
		
		<uni-list>
			<uni-list-item  title="设置"  showArrow></uni-list-item>
			<uni-list-item  title="帮助中心" showArrow></uni-list-item>
			<uni-list-item  title="关于我们" showArrow></uni-list-item>
			<view @click="goAddress">
				<uni-list-item  title="地址管理" showArrow></uni-list-item>
			</view>
			
			<uni-list-item  title="联系我们" showArrow ></uni-list-item>
			<view @click="handleLogout">
				<uni-list-item  title="退出" showArrow ></uni-list-item>
			</view>
			
		</uni-list>
	</view>
</template>

<script setup lang="ts">
import {onShow} from "@dcloudio/uni-app"
import {computed, ref} from "vue"
interface UserInfo{
	user_id:number;
	username:string | null;
	avatar:string | null;
	openid:string;
	phone:string;
}
let userInfo=ref<UserInfo|null>(null);
onShow(()=>{
	userInfo.value=uni.getStorageSync("user")
	console.log("用户数据",userInfo.value)
})
const nickName=computed(()=>{
	return userInfo.value&&userInfo.value.username?userInfo.value.username:"铲屎官一枚"+userInfo.value.user_id
})
const avatar=computed(()=>{
	return userInfo.value&&userInfo.value.avatar?userInfo.value.avatar:"/static/modules/home/dog1.png"
})
const handleLogin=()=>{
	uni.navigateTo({
		url:"/pages/login/login"
	})
}
const handleLogout=()=>{
	uni.showModal({
		title:"确认退出",
		content:"确定要退出登陆吗?",
		success(res) {
			if(res.confirm){
				uni.clearStorageSync()
				userInfo.value=null;
				uni.showToast({
					title:"退出成功",
					icon:"success"
				})
			}
		}
	})
}

const goAddress=()=>{
	//判断用户是否登录，如果未登录，应跳转到登录页
	const token=uni.getStorageSync("token");
	if(!token){
		uni.navigateTo({
			url:"/pages/login/login"
		})
		return
	}
	uni.navigateTo({
		url:"/packageB/address/address"
	})
	
}

</script>
<style lang="scss" scoped>
	.section-header{
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 30rpx;
		border-bottom: 1px solid #f5f5f5;
		text{
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
		}
		.more{
			font-size: 24rpx;
			color: #999;
			
		}
	}
	.page{
		min-height: 100vh;
		background-color: #f5f5f5;
		padding-bottom: 30rpx;
		.user-info{
			display: flex;
			background-color: #fff;
			align-items: center;
			padding: 40rpx 30rpx;
			margin-bottom: 20rpx;
			.avatar-placeholder{
				width: 120rpx;
				height: 120rpx;
				border-radius: 50%;
				margin-right: 30rpx;
				box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
				image{
					width: 100%;
					height: 100%;
					border-radius: 50%;
					border: 4rpx solid #fff;
				}
			}
			.user-detail{
				.username{
					font-size: 36rpx;
					font-weight: bold;
					color: #333;
					display: block;
					margin-bottom: 12rpx;
				}
				.user-level{
					background-color: #f8f8f8;
					padding: 8rpx 22rpx;
					border-radius: 24rpx;
					font-size: 24rpx;
					color: #666;
				}
			}
		}
		.order-section{
			background-color: #fff;
			margin-bottom: 20rpx;

			.order-types{
				display: flex;
				padding: 30rpx 0;
				.order-item{
					flex: 1;
					display: flex;
					flex-direction: column;
					align-items: center;
					image{
						width:60rpx;
						height: 60rpx;
					}
					text{
						font-size: 24rpx;
						color: #666;
						margin-top: 10rpx;
					}
					
				}
			}
		}
		.business-section{
			background-color: #fff;
			margin-bottom: 20rpx;
			.business-grid{
				display: flex;
				padding: 30rpx 0;
				.business-item{
					flex: 1;
					display: flex;
					flex-direction: column;
					align-items: center;
					image{
						width:60rpx;
						height: 60rpx;
					}
					text{
						font-size: 24rpx;
						color: #666;
						margin-top: 10rpx;
					}
				}
			}
		}
		
	}
	       
</style>
