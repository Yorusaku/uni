<template>
	<view class="min-h-screen bg-f5f5f5 pb-[120rpx]">
		<swiper class="w-full h-[750rpx]" circular indicator-dots autoplay :interval="3000" :duration="1000">
			<swiper-item v-for="item in productImages" :key="item.id">
				<image class="w-full h-full" :src="item.img_url" mode="aspectFill"></image>
			</swiper-item>
		</swiper>
		
		<!--商品信息-->
		<view class="bg-white p-[30rpx] mb-[20rpx]">
			<view class="flex items-center mb-[20rpx]">
				<text class="text-[#ff6b81] text-[40rpx] font-bold mr-[20rpx]">￥{{ productInfo.price }}</text>
				<text class="text-[#999] text-[28rpx] decoration-line-through">￥{{ productInfo.o_price }}</text>
			</view>
			<view class="text-[32rpx] font-bold text-[#333] mb-[16rpx]">{{ productInfo.name }}</view>
			<view class="text-[28rpx] text-[#666] leading-16">{{ productInfo.desc }}</view>
		</view>
		
		<!--规格选择-->
		<view class="flex items-center bg-white p-[30rpx] mb-[20rpx] justify-between" @click="showSpecPopup">
			<text class="text-[28rpx] text-[#333]">规格</text>
			<view class="flex items-center text-[28rpx] text-[#666]">
				<text class="mr-[10rpx]">{{ selectedSpec || '请选择规格' }}</text>
				<up-icon name="arrow-right" size="20" color="#999"></up-icon>
			</view>
		</view>
		
		<!--商品详情-->
		<view class="bg-white p-[30rpx]">
			<view class="text-[32rpx] font-bold text-[#333] mb-[30rpx]">商品详情</view>
			<view class="p-[20rpx]">
				<image v-for="item in productImages" :key="item.id" mode="widthFix" 
					class="w-full mb-[20rpx] rounded-[12rpx]" :src="item.img_url"></image>
			</view>
		</view>
		
		<!--底部操作区域-->
		<view class="fixed bottom-0 left-0 right-0 h-[60rpx] bg-white flex items-center px-[30rpx] shadow-[0_-2rpx_10rpx_rgba(0,0,0,0.05)]">
			<view class="flex mr-[30rpx]">
				<view class="flex flex-col items-center mr-[30rpx]" @click="goHome">
					<up-icon name="home" size="40" color="#666"></up-icon>
					<text class="text-[24rpx] text-[#666] mt-[4rpx]">首页</text>
				</view>
				<view class="flex flex-col items-center mr-[30rpx]" @click="goCart">
					<up-icon name="shopping-cart" size="40" color="#666"></up-icon>
					<text class="text-[24rpx] text-[#666] mt-[4rpx]">购物车</text>
				</view>
			</view>
			<view class="flex flex-1">
				<view class="flex-1 h-[80rpx] rounded-[40rpx] flex items-center justify-center text-[32rpx] font-bold bg-[#fff8e6] text-[#ffce2c] mr-[20rpx]" 
					@click="addCart">加入购物车</view>
				<view class="flex-1 h-[80rpx] rounded-[40rpx] flex items-center justify-center text-[32rpx] font-bold bg-[#ffce2c] text-[#fff]" 
					@click="buyNow">立即购买</view>
			</view>
		</view>
		
		<ProductSpecPopup :show="show" :product="productInfo" @close="handleClose" :showOk="true"></ProductSpecPopup>
	</view>
</template>

<script setup lang="ts">
import { get, post } from '../../utils/http';
import { useSpecStore } from '../../store/spec';
import ProductSpecPopup from '../../components/products-spec-popup/product-spec-popup.vue';
import { onLoad } from "@dcloudio/uni-app"
import { ref, computed, watch } from 'vue';
interface ProductDetail {
	id: number;
	name: string;
	price: string;
	stock: number;
	category_id: number;
	main_pic: string;
	desc: string;
	o_price: string;
}
interface ProductImage {
	id: number;
	product_id: number;
	img_url: string;
}
const specStore = useSpecStore();
onLoad((options) => {
	productInfo.value = JSON.parse(options.product);
	getImages();
	specStore.setSpec('');
	specStore.setCount(1);
});
//商品数据
const productInfo = ref<ProductDetail>({} as ProductDetail);
const productImages = ref<ProductImage[]>([]);
const getImages = async () => {
	try {
		const res: any = await get('/sel/detail', { id: productInfo.value.id });
		productImages.value = res;
	} catch (error) {
		console.error('失败');
	}
};
//规格弹窗
const show = ref<boolean>(false);
const showSpecPopup = () => {
	show.value = true;
};
const handleClose = () => {
	show.value = false;
};
//从pinia中取出规格数据
const selectedSpec = computed(() => {
	return specStore.specText;
});
const selCount = computed(() => {
	return specStore.count;
});
const selTotal = computed(() => {
	return specStore.total;
});
const addCart = async () => {
	if (selectedSpec.value) {
		try {
			const res = await post('/cart/addCart', {
				product_id: productInfo.value.id,
				name: productInfo.value.name,
				price: productInfo.value.price,
				count: selCount.value,
				spec: selectedSpec.value,
				main_pic: productInfo.value.main_pic
			});
			uni.showToast({
				title: '加购成功',
				icon: 'success'
			});
			specStore.setSpec('');
			specStore.setCount(1);
			handleClose();
		} catch (error) {
			//TODO handle the exception
			console.error(error);
		}
	} else {
		showSpecPopup();
	}
};

const buyNow = () => {
	if (selectedSpec.value) {
		let selPro = [
			{
				count: selCount.value,
				main_pic: productInfo.value.main_pic,
				name: productInfo.value.name,
				price: selTotal.value,
				product_id: productInfo.value.id,
				spec: selectedSpec.value
			}
		];
		uni.navigateTo({
			url: '/packageB/order/order?selPro=' + JSON.stringify(selPro)
		});
	} else {
		showSpecPopup();
	}
};

const goHome = () => {
	uni.switchTab({
		url: '/pages/index/index'
	});
};
const goCart = () => {
	const token = uni.getStorageSync('token');
	if (!token) {
		uni.navigateTo({
			url: '/pages/login/login'
		});
		return;
	}
	uni.navigateTo({
		url: '/pages/cart/cart'
	});
};
</script>

