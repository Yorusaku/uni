<template>
	<view class="cart-container">
		<view class="cart-list" v-if="cartList.length>0">
			<view class="cart-item" v-for="item in cartList" :key="item.cart_id">
				<view class="checkbox">
					<up-checkbox usedAlone v-model:checked="item.selected"></up-checkbox>
				</view>
				<image class="product-img" :src="item.main_pic" mode="aspectFill"></image>
				<view class="product-info">
					<view class="product-name">{{item.name}}</view>
					<view class="product-spec">{{item.spec}}</view>
					<view class="price-quantity">
						<view class="price">￥{{item.price}}</view>
						<view class="quantity-control">
							<text class="quantity-label">数量：</text>
							<view class="quantity-text">{{item.count}}</view>
						</view>
					</view>
				</view>
				<view class="delete-btn" @click="deleteItem(item.cart_id)">
					<up-icon name="trash" size="20" color="#999"></up-icon>
				</view>
			</view>
		</view>
		<!--空购物车-->
		<view class="empty-cart" v-else>
			<view class="empty-text">购物车空空如也~</view>
			<view class="go-shopping">去逛逛!</view>
		</view>
		<!--底部结算栏-->
		<view class="settlement-bar">
			<view class="select-all">
				<up-checkbox usedAlone  v-model:checked="allChecked" @change="toggleAllChecked"></up-checkbox>
			</view>
			<view class="total-info">
				<view class="total-price">
					合计：<text class="price">￥{{totalPrice}}</text>
				</view>
				<view class="total-desc">不含运费</view>
			</view>

			<view class="settle-btn" :class="{active:selectedCount>0}" @click="goOrder">结算({{selectedCount}})</view>
		</view>
	</view>
</template>
<script lang="ts" setup>
	import { ref, computed, watch} from 'vue'
	import { get,post } from '../../utils/http'
	import { onLoad } from "@dcloudio/uni-app"
	onLoad(() => {
		getCart()
	})
	interface cartItem {
		cart_id : number;
		count : number;
		main_pic : string;
		name : string;
		price : string;
		product_id : number;
		spec : string;
		user_id : number
		selected : boolean
	}
	//购物车数据
	const cartList = ref<cartItem[]>([])
	const getCart = async () => {
		try {
			const data : any = await get("/cart/list")
			console.log("购物车数据", data)
			cartList.value = data.map(item => ({
				...item,
				selected: false
			}))
		} catch (error) {
			//TODO handle the exception
			console.error("获取失败")
		}
	}
	//计算总价
	const totalPrice = computed<string>(() => {
		let total : number = 0;
		for (const item of cartList.value) {
			if (item.selected) {
				total += Number(item.price)
			}
		}
		return total.toFixed(2)
	})
	//计算选中商品数量
	const selectedCount = computed<number>(() => {
		return cartList.value.filter(item => item.selected).length
	})
	//全选功能
	const allChecked=ref<boolean>(false);
	watch(cartList,()=>{
		//cartList数组，里面嵌套对象 默认浅层监听
		//如果购物车数据为空的话，不做判断直接为false
		if(cartList.value.length===0){
			allChecked.value=false;
			return
		}
		allChecked.value=cartList.value.length===selectedCount.value
	},{
		deep:true
	})
	const toggleAllChecked=()=>{
		cartList.value.forEach(item=>{
			item.selected=!allChecked.value
		})
	}
	//删除购物车数据
	const deleteItem=(cart_id:number)=>{
		uni.showModal({
			title:"提示",
			content:"确定要删除此商品吗?",
			success:async (res) =>{
				if(res.confirm){
					try {
						await post("/cart/deleteCart",{cart_id})
						uni.showToast({
							title:"删除成功",
							icon:"success"
						})
						getCart();
					} catch (error) {
						console.error("删除商品失败")
					}
				}
			}
		})
	}
	
	const selPro=computed<cartItem[]>(()=>{
		return cartList.value.filter(item=>item.selected)
	})
	
	const goOrder=()=>{
		if(selectedCount.value){
			uni.navigateTo({
				url:"/packageB/order/order?selPro="+JSON.stringify(selPro.value)
			})
		}	
	}
	
</script>
<style lang="scss" scoped>
	.cart-container {
		background-color: #f8f8f8;
		padding-bottom: 100rpx;
		min-height: 100vh;

		.cart-list {
			padding: 20rpx;

			.cart-item {
				background-color: #fff;
				display: flex;
				align-items: center;
				padding: 20rpx;
				margin-bottom: 20rpx;
				border-radius: 12rpx;

				.checkbox {
					margin-right: 20rpx;
				}

				.product-img {
					width: 160rpx;
					height: 160rpx;
					border-radius: 8rpx;
					margin-right: 20rpx;
				}

				.product-info {
					flex: 1;

					.product-name {
						font-size: 28rpx;
						color: #333;
						margin-bottom: 10rpx;
					}

					.product-spec {
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

						.quantity-control {
							display: flex;
							align-items: center;

							.quantity-label {
								font-size: 26rpx;
								color: #999;
								margin-right: 10rpx;
							}

							.quantity-text {
								font-size: 28rpx;
								color: #333;
								background-color: #f5f5f5;
								padding: 4rpx 20rpx;
								border-radius: 6rpx;

							}
						}

					}
				}

				.delete-btn {
					padding: 20rpx;
				}
			}
		}

		.empty-cart {
			display: flex;
			flex-direction: column;
			align-items: center;
			padding-top: 200rpx;

			.empty-text {
				font-size: 28rpx;
				color: #999;
				margin-bottom: 40rpx;
			}

			.go-shopping {
				width: 240rpx;
				height: 80rpx;
				background-color: #ffce2c;
				color: #fff;
				border-radius: 40rpx;
				font-size: 28rpx;
				text-align: center;
				line-height: 80rpx;

			}
		}

		.settlement-bar {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			height: 100rpx;
			background-color: #fff;
			display: flex;
			align-items: center;
			padding: 0 20rpx;
			box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);

			.select-all {
				margin-right: 20rpx;
			}

			.total-info {
				flex: 1;

				.total-price {
					font-size: 28rpx;
					color: #333;

					.price {
						color: #ff4d4f;
						font-size: 36rpx;
						font-weight: bold;
					}
				}

				.total-desc {
					font-size: 24rpx;
					color: #999;
				}
			}

			.settle-btn {
				width: 200rpx;
				height: 80rpx;
				background-color: #ddd;
				color: #fff;
				border-radius: 40rpx;
				text-align: center;
				line-height: 80rpx;
				font-size: 28rpx;

				&.active {

					background-color: #ffce2c !important;
				}
			}
		}
	}
</style>