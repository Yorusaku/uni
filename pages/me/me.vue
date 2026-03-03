<template>
	<view class="min-h-screen bg-f5f5f5 pb-[30rpx]">
		<!--用户信息模块-->
		<view class="flex bg-white items-center px-[30rpx] py-[40rpx] mb-[20rpx]">
			<view class="w-[120rpx] h-[120rpx] rounded-full mr-[30rpx] shadow-lg overflow-hidden">
				<image class="w-full h-full rounded-full border-[4rpx] border-white" :src="avatar"></image>
			</view>
			<view class="flex-1">
				<text class="text-[36rpx] font-bold text-[#333] block mb-[12rpx]">{{userInfo?nickName:"用户暂未登录"}}</text>
				<text class="bg-[#f8f8f8] px-[22rpx] py-[8rpx] rounded-[24rpx] text-[24rpx] text-[#666]" 
					@click="handleLogin" 
					v-if="!userInfo">点击去登录</text>
			</view>
		</view>
		
		<!--我的订单-->
		<view class="bg-white mb-[20rpx]">
			<view class="flex justify-between items-center px-[30rpx] py-[30rpx] border-b border-f5f5f5">
				<text class="text-[32rpx] font-bold text-[#333]">我的订单</text>
				<text class="text-[24rpx] text-[#999]">查看全部 ></text>
			</view>
			<view class="flex py-[30rpx]">
				<view class="flex-1 flex flex-col items-center">
					<image class="w-[60rpx] h-[60rpx]" src="/static/modules/mine/待付款.png"></image>
					<text class="text-[24rpx] text-[#666] mt-[10rpx]">待付款</text>
				</view>
				<view class="flex-1 flex flex-col items-center">
					<image class="w-[60rpx] h-[60rpx]" src="/static/modules/mine/待服务.png"></image>
					<text class="text-[24rpx] text-[#666] mt-[10rpx]">待服务</text>
				</view>
				<view class="flex-1 flex flex-col items-center">
					<image class="w-[60rpx] h-[60rpx]" src="/static/modules/mine/待评价.png"></image>
					<text class="text-[24rpx] text-[#666] mt-[10rpx]">待评价</text>
				</view>
				<view class="flex-1 flex flex-col items-center">
					<image class="w-[60rpx] h-[60rpx]" src="/static/modules/mine/退款.png"></image>
					<text class="text-[24rpx] text-[#666] mt-[10rpx]">退款/售后</text>
				</view>
			</view>
		</view>
		
		<!--我的服务-->
		<view class="bg-white mb-[20rpx]">
			<view class="flex justify-between items-center px-[30rpx] py-[30rpx] border-b border-f5f5f5">
				<text class="text-[32rpx] font-bold text-[#333]">我的服务</text>
			</view>
			<view class="flex py-[30rpx]">
				<view class="flex-1 flex flex-col items-center">
					<image class="w-[60rpx] h-[60rpx]" src="/static/modules/mine/预约.png"></image>
					<text class="text-[24rpx] text-[#666] mt-[10rpx]">我的预约</text>
				</view>
				<view class="flex-1 flex flex-col items-center">
					<image class="w-[60rpx] h-[60rpx]" src="/static/modules/mine/视频问诊.png"></image>
					<text class="text-[24rpx] text-[#666] mt-[10rpx]">我的问诊</text>
				</view>
				<view class="flex-1 flex flex-col items-center">
					<image class="w-[60rpx] h-[60rpx]" src="/static/modules/mine/拼团.png"></image>
					<text class="text-[24rpx] text-[#666] mt-[10rpx]">我的拼团</text>
				</view>
				<view class="flex-1 flex flex-col items-center">
					<image class="w-[60rpx] h-[60rpx]" src="/static/modules/mine/收藏.png"></image>
					<text class="text-[24rpx] text-[#666] mt-[10rpx]">我的收藏</text>
				</view>
			</view>
		</view>

		<uni-list>
			<uni-list-item title="设置" showArrow></uni-list-item>
			<uni-list-item title="帮助中心" showArrow></uni-list-item>
			<uni-list-item title="关于我们" showArrow></uni-list-item>
			<view @click="goAddress">
				<uni-list-item title="地址管理" showArrow></uni-list-item>
			</view>

			<uni-list-item title="联系我们" showArrow></uni-list-item>
			<view @click="handleLogout">
				<uni-list-item title="退出" showArrow></uni-list-item>
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
