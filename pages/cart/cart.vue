<template>
	<view class="bg-[#f8f8f8] pb-[100rpx] min-h-screen">
		<!--购物车列表-->
		<view class="px-[20rpx]" v-if="cartList.length > 0">
			<view class="bg-white mb-[20rpx] rounded-[12rpx]" v-for="item in cartList" :key="item.cart_id">
				<view class="flex items-center p-[20rpx]">
					<view class="mr-[20rpx]">
						<up-checkbox usedAlone v-model:checked="item.selected"></up-checkbox>
					</view>
					<image class="w-[160rpx] h-[160rpx] rounded-[8rpx] mr-[20rpx]" :src="item.main_pic" mode="aspectFill"></image>
					<view class="flex-1">
						<view class="text-[28rpx] text-[#333] mb-[10rpx]">{{item.name}}</view>
						<view class="text-[24rpx] text-[#999] mb-[20rpx]">{{item.spec}}</view>
						<view class="flex justify-between items-center">
							<view class="text-[#ff4d4f] text-[32rpx] font-bold">￥{{item.price}}</view>
							<view class="flex items-center">
								<text class="text-[26rpx] text-[#999] mr-[10rpx]">数量：</text>
								<view class="text-[28rpx] text-[#333] bg-[#f5f5f5] px-[20rpx] py-[4rpx] rounded-[6rpx]">{{item.count}}</view>
							</view>
						</view>
					</view>
					<view class="p-[20rpx]" @click="deleteItem(item.cart_id)">
						<up-icon name="trash" size="20" color="#999"></up-icon>
					</view>
				</view>
			</view>
		</view>
		
		<!--空购物车-->
		<view class="flex flex-col items-center pt-[200rpx]" v-else>
			<view class="text-[28rpx] text-[#999] mb-[40rpx]">购物车空空如也~</view>
			<view class="w-[240rpx] h-[80rpx] bg-[#ffce2c] text-[#fff] rounded-[40rpx] text-[28rpx] flex items-center justify-center" @click="goShopping">去逛逛!</view>
		</view>
		
		<!--底部结算栏-->
		<view class="fixed bottom-0 left-0 right-0 h-[100rpx] bg-white flex items-center px-[20rpx] shadow-[0_-2rpx_10rpx_rgba(0,0,0,0.05)]">
			<view class="mr-[20rpx]">
				<up-checkbox usedAlone v-model:checked="allChecked" @change="toggleAllChecked"></up-checkbox>
			</view>
			<view class="flex-1">
				<view class="text-[28rpx] text-[#333]">合计：<text class="text-[#ff4d4f] text-[36rpx] font-bold">￥{{totalPrice}}</text></view>
				<view class="text-[24rpx] text-[#999]">不含运费</view>
			</view>

			<view class="w-[200rpx] h-[80rpx] bg-[#ddd] text-[#fff] rounded-[40rpx] text-[28rpx] flex items-center justify-center" 
				:class="{active: selectedCount > 0}" 
				@click="goOrder">结算({{selectedCount}})</view>
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

	const goShopping=()=>{
		uni.switchTab({
			url:"/pages/index/index"
		})
	}
	
</script>
