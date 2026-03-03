<template>
	<view class="merchant-detail">
		<!--商家基础信息-->
		<view class="merchant-info">
			<image class="merchant-bg" src="/static/modules/service/cat.jpg" mode="aspectFill"></image>
			<view class="merchant-card">
				<view class="merchant-header">
					<image class="merchant-avatar" :src="merchant_info.pic" mode="aspectFill"></image>
					<view class="merchant-basic">
						<text class="merchant-name">{{merchant_info.merchant_name}}</text>
						<view class="rating-info">
							<up-rate readonly allow-half active-color="#ffce2c" inactive-color="#b2b2b2" v-model="merchant_info.rating"></up-rate>
							<text class="rating-text">{{merchant_info.rating}}</text>
							<text class="review-count" v-if="merchant_info.rating>4.5">�?精选商�?�?/text>
						</view>
						<view class="distance-info">
							<text class="distance-text">
								{{merchant_info.address}}
							</text>
						</view>
					</view>
				</view>
				<view class="merchant-tags">
					<view class="tag-item" v-for="(item,index) in merchant_info.tag?.split(',')" :key="index">{{item}}</view>
					
				</view>
			</view>
		</view>
		<!--商家服务-->
		<view class="service-section">
			<view class="section-title">
				<text class="title-text">服务项目</text>
			</view>
			<view class="service-list">
				<view class="service-item" v-for="item in serviceList" :key="item.id">
					<image class="service-icon" src="/static/modules/service/pet1.png" mode="aspectFill"></image>
					<view class="service-info">
						<text class="service-name">{{item.service_name}}</text>
						<view class="service-price">
							<text class="price-symbol">�?/text>
							<text class="price-value">{{item.service_price}}</text>
							<text class="price-unit">/{{item.service_unit}}</text>
						</view>
					</view>
					<view class="service-action">
						<up-button type="primary" size="mini" style="background-color: #ffce2c;border-color: #ffce2c;" @click="bookNow(item)">立即预约</up-button>
					</view>
				</view>
			</view>
		</view>
		<!--商家信息-->
		<view class="info-section">
			<view class="section-title">
				<text class="title-text">商家信息</text>
			</view>
			<view class="info-list">
				<view class="info-item">
					<up-icon name="map" size="32rpx" color="#666"></up-icon>
					<text class="info-label">地址�?/text>
					<text class="info-value">{{merchant_info.address}}</text>
				</view>
				<view class="info-item">
					<up-icon name="clock" size="32rpx" color="#666"></up-icon>
					<text class="info-label">营业时间�?/text>
					<text class="info-value">{{merchant_info.business_hours}}</text>
				</view>
				<view class="info-item">
					<up-icon name="phone" size="32rpx" color="#666"></up-icon>
					<text class="info-label">联系电话�?/text>
					<text class="info-value" style="color: #ffce2c;">{{merchant_info.phone}}</text>
				</view>
			</view>
		</view>
		<view class="bottom-bar">
			<view class="primary-actions">
				<up-button type="primary" style="background-color: #ffce2c;border-color: #ffce2c;width: 160rpx;float:right" @click="call">拨打电话</up-button>
				<up-button type="info" style="background-color: #fff;border-color: #ffce2c;color: #ffce2c;width: 160rpx;float:right;margin-right: 20rpx;" @click="viewLocation">查看位置</up-button>
			
			</view>
		</view>
	</view>
</template>

<script lang="ts" setup>
	import {onLoad} from "@dcloudio/uni-app"
	import { ref } from "vue";
	import { get } from "../../utils/http";
	interface MerchantItem{
		merchant_id:number;
		address:string;
		business_hours:string;
		merchant_name:string;
		phone:string;
		pic:string;
		rating:string;
		service:string;
		tag:string
	}
	interface ServiceItem{
		id:number;
		merchant_id:number;
		service_name:string;
		service_price:string;
		service_unit:string;
	}
	onLoad((options)=>{
		console.log("opt",JSON.parse(options.info))
		merchant_info.value=JSON.parse(options.info)
		getService();
	})
	const merchant_info=ref<MerchantItem>({} as MerchantItem)
	//服务价格列表
	const serviceList=ref<ServiceItem[]>([])
	const getService=async()=>{
		const data:any=await get("/home/service",{merchant_id:merchant_info.value.merchant_id})
		serviceList.value=data
	}
	const call=()=>{
		uni.makePhoneCall({
			phoneNumber:merchant_info.value.phone
		});
	}
	const viewLocation=()=>{
		uni.openLocation({
			latitude:39.9042,//维度
			longitude:116.4074,//经度
			name:merchant_info.value.merchant_name,
			address:merchant_info.value.address,
			success(res) {
				console.log("打开地图成功",res)
			},
			fail(err) {
				console.log("打开地图失败",err)
			}
		})
	}
	
	const bookNow=(item:ServiceItem)=>{
		let selPro=[{
			count:1,
			main_pic:"http://localhost:3000/img/part/宠物寄养.png",
			name:item.service_name,
			price:item.service_price,
			product_id:item.merchant_id,
			spec:""
		}]
		uni.navigateTo({
			url:"/packageB/order/order?selPro="+JSON.stringify(selPro)
		})
	}
</script>