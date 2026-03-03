<template>
	<view class="login-container">
		<!--顶部背景-->
		<view class="login-header">
			<view class="header-content">
				<image class="logo" src="/static/logo.png" mode="aspectFill"></image>
				<text class="app-name">溜溜爪宠物服务</text>
				<text class="app-slogan">让爱宠生活更美好</text>
			</view>
		</view>
		
		<!--登录表单-->
		<view class="login-form">
			<!--微信小程序登录-->
			<view class="login-content" v-if="platform==='mp-weixin'">
				<view class="quick-login">
					<text class="login-title">手机号快捷登录</text>
					<text class="login-desc">使用微信授权快捷登录</text>
				<!-- 	<button class="wechat-login-btn"  open-type="getPhoneNumber" @getphonenumber="getPhoneNumber">
						<up-icon name="weixin-fill" color="#fff" size="32" style="margin-right: 10rpx;"></up-icon>
						微信获取手机号一键登录
					</button> -->
					<!--没有企业身份用这段代码登录，不影响后续流程-->
					<button class="wechat-login-btn"  @click="fn">
						<up-icon name="weixin-fill" color="#fff" size="32" style="margin-right: 10rpx;"></up-icon>
						微信获取手机号一键登录
					</button>
				</view>
			</view>
			
			<!--h5 app-->
			<view v-else class="login-content">
				<view class="phone-login">
					<text class="login-title">手机号登录</text>
					<text class="login-desc">请输入手机号和验证码</text>
					<view class="input-group">
						<view class="input-item">
							<up-input
								    placeholder="请输入手机号"
								    prefixIcon="phone"
									border="none"
								    prefixIconStyle="font-size: 22px;color: #909399"
									v-model="phone"
								></up-input>
						</view>
						<view class="input-item">
							<up-input
								    placeholder="请输入验证码"
									type="number"
									maxlength="6"
									border="none"
								    prefixIcon="lock"
								    prefixIconStyle="font-size: 22px;color: #909399"
									v-model="code"
								></up-input>
							<view class="code-btn" @click="getCode">
								{{isCounting?countDown+"s后重新获取":"获取验证码"}}
							</view>
						</view>
						<up-button 
							type="primary" 
							:custom-style="{
							backgroundColor:'#ffce2c',
							borderColor:'#ffce2c',
							height:'88rpx',
							fontSize:'32rpx'
						}"
						@click="handleLogin"
						>登录</up-button>
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

<style lang="scss" scoped>
.login-container{
	height: 100vh;
	background: linear-gradient(135deg,#ffce2c 0%,#ffb347 100%);
	.login-header{
		height: 500rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		.header-content{
			text-align: center;
			.logo{
				width:120rpx;
				height: 120rpx;
				margin-bottom: 20rpx;
			}
			.app-name{
				display: block;
				font-size: 48rpx;
				font-weight: bold;
				color: #fff;
				margin-bottom: 10rpx;
			}
			.app-slogan{
				font-size: 28rpx;
				color: rgba(255, 255, 255, 0.8);
			}
		}
		
	}
	.login-form{
		background-color: #fff;
		border-radius: 40rpx 40rpx 0 0;
		padding: 60rpx 40rpx;
		margin-top: -40rpx;
		height: calc(100vh - 580rpx);
		.login-content{
			.login-title{
				font-size: 36rpx;
				font-weight: bold;
				color: #333;
				text-align: center;
				display: block;
				margin-bottom: 20rpx;
			}
			.login-desc{
				font-size: 28rpx;
				color: #999;
				text-align: center;
				display: block;
				margin-bottom: 60rpx;
			}
			.wechat-login-btn{
				background-color: #07c160;
				color: #fff;
				border: none;
				border-radius: 16rpx;
				height: 88rpx;
				font-size: 32rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				margin-top: 60rpx;
				width: 100%;
			}
			.input-group{
				margin-bottom: 60rpx;
				.input-item{
					background-color: #f8f8f8;
					border-radius: 16rpx;
					padding: 30rpx 20rpx;
					margin-bottom: 30rpx;
					display: flex;
					align-items: center;
					.code-btn{
						padding:10rpx 20rpx ;
						background-color: #ffce2c;
						color: #fff;
						border-radius: 8rpx;
						font-size: 24rpx;
						
					}
				}
			}
		}
	}
	
}
</style>