<template>
	<view class="h-screen bg-gradient-to-br from-[#ffce2c] to-[#ffb347]">
		<!--顶部背景-->
		<view class="h-[500rpx] flex items-center justify-center">
			<view class="text-center">
				<image class="w-[120rpx] h-[120rpx] mb-[20rpx]" src="/static/logo.png" mode="aspectFill"></image>
				<text class="block text-[48rpx] font-bold text-[#fff] mb-[10rpx]">溜溜爪宠物服务</text>
				<text class="text-[28rpx] text-[rgba(255,255,255,0.8)]">让爱宠生活更美好</text>
			</view>
		</view>

		<!--登录表单-->
		<view class="bg-white rounded-[40rpx_40rpx_0_0] px-[40rpx] py-[60rpx] mt-[-40rpx] h-[calc(100vh-580rpx)]">
			<!--微信小程序登录-->
			<view v-if="platform==='mp-weixin'" class="login-content">
				<view class="quick-login">
					<text class="block text-[36rpx] font-bold text-[#333] mb-[20rpx] text-center">手机号快捷登录</text>
					<text class="block text-[28rpx] text-[#999] mb-[60rpx] text-center">使用微信授权快捷登录</text>
					<button class="bg-[#07c160] text-[#fff] border-none rounded-[16rpx] h-[88rpx] text-[32rpx] flex items-center justify-center mt-[60rpx] w-full" @click="fn">
						<up-icon name="weixin-fill" color="#fff" size="32" style="margin-right: 10rpx;"></up-icon>
						微信获取手机号一键登录
					</button>
				</view>
			</view>

			<!--h5 app-->
			<view v-else class="login-content">
				<view class="phone-login">
					<text class="block text-[36rpx] font-bold text-[#333] mb-[20rpx] text-center">手机号登录</text>
					<text class="block text-[28rpx] text-[#999] mb-[60rpx] text-center">请输入手机号和验证码</text>
					<view class="mb-[60rpx]">
						<view class="bg-[#f8f8f8] rounded-[16rpx] px-[20rpx] py-[30rpx] mb-[30rpx] flex items-center">
							<up-input placeholder="请输入手机号" prefixIcon="phone" border="none" prefixIconStyle="font-size: 22px;color: #909399" v-model="phone"></up-input>
						</view>
						<view class="bg-[#f8f8f8] rounded-[16rpx] px-[20rpx] py-[30rpx] mb-[30rpx] flex items-center">
							<up-input placeholder="请输入验证码" type="number" maxlength="6" border="none" prefixIcon="lock" prefixIconStyle="font-size: 22px;color: #909399" v-model="code"></up-input>
							<view class="px-[20rpx] py-[10rpx] bg-[#ffce2c] text-[#fff] rounded-[8rpx] text-[24rpx]" @click="getCode">
								{{isCounting?countDown+"s后重新获取":"获取验证码"}}
							</view>
						</view>
						<up-button type="primary" :custom-style="{backgroundColor:'#ffce2c',borderColor:'#ffce2c',height:'88rpx',fontSize:'32rpx'}" @click="handleLogin">登录</up-button>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>
<script setup lang="ts">
import { onMounted } from 'vue';
import { ref } from 'vue';
import {post} from "../../utils/http"
const platform=ref<string>("")
onMounted(()=>{
	// #ifdef MP-WEIXIN
		platform.value="mp-weixin"
	// #endif
	
	// #ifdef WEB
		platform.value="web"
	// #endif
	
	// #ifdef APP-PLUS
		platform.value="app"
	// #endif
})
//
//没有企业身份用这段代码模拟，一样可以登录不影响后面流程！！！！！！！
const fn=()=>{
	uni.setStorageSync("token","xulaoshi666")
	uni.setStorageSync("user",{user_id:1,phone:18888888888})
	uni.showToast({
		title:"登陆成功",
		icon:"success",
		duration:1500
	})
	setTimeout(()=>{
		uni.navigateBack();
	},500)
}
//微信小程序一键登录
const getPhoneNumber=async (e)=>{
	if(e.detail.errMsg==="getPhoneNumber:ok"){
		try {
			const phoneCode=e.detail.code //动态令牌 用来获取手机号 xulaoshi666 {user_id:1,phone:18888888888}
			const res= await uni.login();
			const loginCode=res.code //身份凭证，用来获取openid
			const data:any=await post("/auth/wxLogin",{
				loginCode,
				phoneCode,
				appid:"你的企业appid",//换成你的企业appid,
				secret:"你的企业小程序密钥" ,//换成你的企业小程序密钥，密钥属于隐私数据，泄露会影响账号，所以不展示
											//如果你没有真实企业的id和密钥，可以来找徐老师，实名登记申请，徐老师会把密钥等借给你体验
			});
			uni.setStorageSync("token",data.token)
			uni.setStorageSync("user",data.user)
			uni.showToast({
				title:"登陆成功",
				icon:"success",
				duration:1500
			})
			setTimeout(()=>{
				uni.navigateBack();
			},500)
			
			
		} catch (error) {
			//TODO handle the exception
		}		
	}else{
		uni.showToast({
			title:"获取失败",
			icon:"error"
		})
	}
}
//手机号验证码登录

const phone=ref<string>("")
const code=ref<string>("")
//倒计时相关
const countDown=ref<number>(60);
const isCounting=ref<boolean>(false)

const sendCode=async ()=>{
	try {
		const data:any=await post("/auth/sendSmsCode",{phone:phone.value});
		console.log("验证码已发送",data)
	} catch (error) {
		console.log("验证码发送失败")
	}
}

const getCode=()=>{
	if(isCounting.value) return;
	//判断手机号格式
	const phoneReg=/^1[3-9]\d{9}$/;
	if(!phoneReg.test(phone.value)){
		uni.showToast({
			title:"请输入正确的手机号",
			icon:"none"
		})
		return
	}
	isCounting.value=true;
	countDown.value=60;
	const timer=setInterval(()=>{
		countDown.value--
		if(countDown.value<=0){
			clearInterval(timer);
			isCounting.value=false;		
		}
	},1000)
	//发送验证码
	sendCode()
}
const handleLogin=async ()=>{
	const phoneReg=/^1[3-9]\d{9}$/;
	if(phoneReg.test(phone.value)&&code.value){
		try {
			const data:any=await post("/auth/verifySmsCode",{phone:phone.value,code:code.value});
			console.log("登录结果",data)
			uni.setStorageSync("token",data.token)
			uni.setStorageSync("user",data.user)
			uni.showToast({
				title:"登陆成功",
				icon:"success",
				duration:1500
			})
			setTimeout(()=>{
				uni.navigateBack();
			},500)
		} catch (error) {
			console.log("登录失败")
		}
	}else{
		uni.showToast({
			title:"请输入正确的信息",
			icon:"none"
		})

	}
}
</script>