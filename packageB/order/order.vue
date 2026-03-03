<template>
	<view class="order-create">
		<!--收货地址-->
		<view class="address-section" @click="chooseAddress">
			<view class="address-content" v-if="address?.name">
				<view class="user-info">
					<text class="name">{{address.name}}</text>
					<text class="phone">{{address.phone}}</text>
				</view>
				<view class="address-detail">{{address.province}}{{address.city}}{{address.district}}{{address.detail}}
				</view>
			</view>
			<view class="no-address" v-else>
				<text>请选择收货地址</text>
			</view>
			<up-icon name="arrow-right" size="24" color="#999"></up-icon>
		</view>

		<!--商品列表-->
		<view class="goods-section">
			<view class="section-title">商品信息</view>
			<view class="goods-list">
				<view class="goods-item" v-for="item in selPro" :key="item.product_id">
					<image class="goods-img" :src="item.main_pic" mode="aspectFill"></image>
					<view class="goods-info">
						<view class="goods-name">{{item.name}}</view>
						<view class="goods-spec">{{item.spec}}</view>
						<view class="price-quantity">
							<text class="price">￥{{item.price}}</text>
							<text class="quantity">×{{item.count}}</text>
						</view>
					</view>
				</view>

			</view>
		</view>

		<!--配送方式-->
		<view class="delivery-section">
			<view class="section-title">配送方式</view>
			<view class="delivery-options">
				<view class="delivery-item">
					<text>快递配送</text>
					<text class="delivery-free">免运费</text>
				</view>
			</view>
		</view>

		<!--订单备注-->
		<view class="remark-section">
			<view class="section-title">订单备注</view>
			<input class="remark-input" placeholder="请输入备注信息(选填)" />
		</view>

		<!--金额明细-->
		<view class="amount-section">
			<view class="amount-item">
				<text>商品金额</text>
				<text>￥{{totalPrice}}</text>
			</view>
			<view class="amount-item">
				<text>运费</text>
				<text>￥0.00</text>
			</view>
			<view class="amount-item total">
				<text>实付金额</text>
				<text class="price">￥{{totalPrice}}</text>
			</view>
		</view>
		<!--底部结算-->
		<view class="settlement-bar">
			<view class="total-info">
				<text>合计：</text>
				<text class="price">￥{{totalPrice}}</text>
			</view>
			<view class="submit-btn" @click="submitOrder">立即支付</view>
		</view>
	</view>
</template>

<script lang="ts" setup>
	import { computed, ref } from "vue"
	import { get,post } from "../../utils/http"
	import { onLoad } from "@dcloudio/uni-app"
	interface AddressItem {
		city : string;
		detail : string;
		district : string;
		id : number;
		is_default : 1 | 0;
		name : string;
		phone : string;
		province : string;
		user_id : number
	}
	interface cartItem {
		cart_id ?: number;
		count : number;
		main_pic : string;
		name : string;
		price : string;
		product_id : number;
		spec : string;
		user_id? : number
		selected ?: boolean
	}
	onLoad((options) => {
		getAddress()
		selPro.value = JSON.parse(options.selPro)
		uni.$on("addressSelected", (selectedAddress) => {
			console.log("选中的地址是", selectedAddress)
			address.value = selectedAddress //更新页面中显示的地址信息
		})
	})
	//地址管理
	const address = ref<AddressItem>({} as AddressItem)
	const getAddress = async () => {
		try {
			const result : any = await get("/cart/address");
			address.value = result.filter(item => item.is_default)[0]
		} catch (error) {
			console.log(error)
		}
	}
	const chooseAddress = () => {
		uni.navigateTo({
			url: "/packageB/address/address?flag=1"
		})
	}
	//商品信息
	const selPro = ref<cartItem[]>([])
	//计算总价
	const totalPrice = computed<number>(() => {
		let total = 0;
		selPro.value.forEach(item => {
			total += Number(item.price)
		})
		return total
	})
	
	//h5端支付直接就跳转到后端给我们的地址 location.href
	const submitOrder= async ()=>{
		//#ifdef MP-WEIXIN
		try {
			const res:any=await post("/payment/createOrder",{
				openId:"ow4MK7uyLhGxphyZJTFdyy5zD-ow",
				productId:"1001",
				productName:"测试商品",
				productPrice:0.01,
				productNum:1
			})
			console.log("订单结果",res);
			uni.requestPayment({
				provider:"wxpay",
				orderInfo:"测试订单",
				nonceStr:res.data.nonceStr,
				timeStamp:res.data.timeStamp,
				package:res.data.package,
				signType:res.data.signType,
				paySign:res.data.paySign,
				success(payRes) {
					console.log("支付成功",payRes)
					//调用接口，发送自己的地址备注信息等
					
				},
				fail(payError) {
					uni.showToast({
						title:"支付失败",
						icon:"none"
					})
					console.log("支付失败",payError)
				}
			})
		} catch (error) {
			console.log(error)
		}
		//#endif
		console.log("支付操作")
	}
</script>

<style lang="scss" scoped>
	.order-create {
		min-height: 100vh;
		background-color: #f5f5f5;
		padding-bottom: 120rpx;

		.address-section {
			background-color: #fff;
			display: flex;
			align-items: center;
			padding: 30rpx;
			margin-bottom: 20rpx;

			.address-content {
				flex: 1;

				.user-info {
					margin-bottom: 10rpx;

					.name {
						font-size: 32rpx;
						color: #333;
						margin-right: 20rpx;
					}

					.phone {
						font-size: 28rpx;
						color: #666;
					}
				}

				.address-detail {
					font-size: 28rpx;
					color: #666;
				}

			}

			.no-address {
				flex: 1;
				font-size: 28rpx;
				color: #999;
			}
		}

		.goods-section {
			background-color: #fff;
			padding: 30rpx;
			margin-bottom: 20rpx;

			.section-title {
				font-size: 30rpx;
				color: #333;
				margin-bottom: 20rpx;
			}

			.goods-list {
				.goods-item {
					display: flex;
					margin-bottom: 30rpx;

					.goods-img {
						width: 160rpx;
						height: 160rpx;
						border-radius: 12rpx;
						margin-right: 20rpx;
					}

					.goods-info {
						flex: 1;

						.goods-name {
							font-size: 28rpx;
							color: #333;
							margin-bottom: 10rpx;
						}

						.goods-spec {
							font-size: 24rpx;
							color: #999;
							margin-bottom: 20rpx;
						}

						.price-quantity {
							display: flex;
							justify-content: space-between;
							align-items: center;

							.price {
								color: #ff4d4f;
								font-size: 32rpx;
								font-weight: bold;
							}

							.quantity {
								font-size: 26rpx;
								color: #999;
							}
						}
					}
				}
			}
		}

		.delivery-section {
			background-color: #fff;
			padding: 30rpx;
			margin-bottom: 20rpx;

			.section-title {
				font-size: 30rpx;
				color: #333;
				margin-bottom: 20rpx;

			}

			.delivery-options {
				.delivery-item {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 20rpx 0;
					font-size: 28rpx;
					color: #333;

					.delivery-free {
						color: #999;
					}
				}
			}
		}

		.remark-section {
			background-color: #fff;
			padding: 30rpx;
			margin-bottom: 20rpx;

			.section-title {
				font-size: 30rpx;
				color: #333;
				margin-bottom: 20rpx;

			}

			.remark-input {
				height: 80rpx;
				font-size: 28rpx;
				color: #333;
			}
		}

		.amount-section {
			background-color: #fff;
			padding: 30rpx;
			margin-bottom: 20rpx;

			.amount-item {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 20rpx;
				font-size: 28rpx;
				color: #666;

				&.total {
					border-top: 2rpx solid #f5f5f5;
					margin-top: 20rpx;
					padding-top: 20rpx;
					color: #333;
					font-size: 30rpx;

					.price {
						color: #ff4d4f;
						font-size: 36rpx;
						font-weight: bold;
					}
				}
			}
		}

		.settlement-bar {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			height: 100rpx;
			padding: 20rpx;
			background-color: #fff;
			display: flex;
			align-items: center;
			box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);

			.total-info {
				flex: 1;
				font-size: 28rpx;
				color: #333;

				.price {
					color: #ff4d4f;
					font-size: 36rpx;
					font-weight: bold;
				}
			}

			.submit-btn {
				width: 240rpx;
				height: 80rpx;
				background-color: #ffce2c;
				color: #fff;
				border-radius: 40rpx;
				text-align: center;
				line-height: 80rpx;
				font-size: 28rpx;
			}
		}
	}
</style>