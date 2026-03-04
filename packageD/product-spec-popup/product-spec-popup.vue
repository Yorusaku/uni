<template>
	<up-popup :show="show" closeable @close="handleClose">
		<view class="spec-popup">
			<view class="popup-header">
				<image class="product-img" :src="product.main_pic" mode="aspectFill"></image>
				<view class="product-info">
					<view class="price">￥{{finalPrice}}</view>
					<view class="selected">已选：{{selectedSpec || "请选择规格"}}</view>
				</view>
			</view>
			<view class="spec-content">
				<view class="spec-group" v-for="group in specList" :key="group.attr_id">
					<view class="group-title">{{group.attr_name}}</view>
					<view class="spec-items">
						<view class="spec-item" v-for="(item,index) in group.values" :key="item.value_id"
							:class="{active:selectedSpecs[group.attr_id]===item.value_id}"
							@click="selectSpec(group.attr_id,item.value_id,item.value)">
							{{item.value}}
						</view>
					</view>
				</view>
			</view>
			<view class="popup-footer">
				<view class="quantity">
					<text>数量</text>
					<view class="quantity-control">
						<view class="minus" @click="decrease">-</view>
						<view class="count">{{quantity}}</view>
						<view class="plus" @click="increase">+</view>
					</view>
				</view>
				<view class="confirm-ok" v-if="showOk" @click="handleOk">确定</view>
				<view class="confirm-btn" @click="confirmSpec">加购</view>
			</view>
		</view>
	</up-popup>
</template>

<script lang="ts" setup>
	import { watch, ref, reactive, computed } from "vue";
	import { get,post} from "../../utils/http";
	import {useSpecStore} from "../../store/spec";
	interface ProductItem {
		id : number;
		name : string;
		price : string;
		o_price : string;
		stock : number;
		category_id : number;
		main_pic : string;
		desc : string
	}
	//规格分类值
	interface SpecValue {
		value_id : number,
		value : string;
		multiple : string
	}
	//规格分类名称
	interface SpecArr {
		attr_id : number,
		attr_name : string;
		values : SpecValue[]
	}
	const specStore=useSpecStore()
	const props = defineProps<{ show : boolean, product : ProductItem,showOk:boolean }>()
	const emit = defineEmits(["close"])

	//获取商品规格
	watch(() => props.show, (newVal) => {
		if (newVal) {
			getSpec()
		}
	})
	const specList = ref<SpecArr[]>([])//规格数据
	const getSpec = async () => {
		try {
			const res : any = await get("/cart/getSpec", { id: props.product.id })
			
			specList.value = res || [] //返回结果一定是数组
			if (!res) {
				handleClose() //关闭弹窗
				setTimeout(() => {
					uni.navigateTo({
						url: "/pages/login/login"
					})
				}, 500)
			}
		} catch (error) {
			console.log(error)
		}
	}
	const selectedSpecs = reactive<{ [key : string] : number }>({}) //{"1":5,"2":1} 存储选中的规格值id  
	const selectedTexts = reactive<{ [key : string] : string }>({}) //{"1":"5kg","2":"鸡肉味"}
	const selectedSpec = ref<string>("") //已选规格字符串 如 2kg，鸡肉味
	const selectSpec = (attr_id : number, value_id : number, value : string) => {
		selectedSpecs[attr_id] = value_id;
		selectedTexts[attr_id] = value;
		selectedSpec.value = Object.values(selectedTexts).join("，")
	}

	const handleClose = () => {
		emit("close");
		//重置数据
		Object.keys(selectedSpecs).forEach(key => delete selectedSpecs[key]);
		Object.keys(selectedTexts).forEach(key => delete selectedTexts[key]);
		selectedSpec.value = ""
	}
	//商品数量
	const quantity = ref<number>(1)
	const increase = () => {
		quantity.value++
	}
	const decrease = () => {
		if (quantity.value > 1) {
			quantity.value--
		}
	}
	const finalPrice = computed(() => {
		//find return一个条件，返回符合条件的这个数据
		let price : number = Number(props.product.price)
		if(specList.value.length){ //数组有数据再循环
			specList.value.forEach(group => {
				const selected = group.values.find(item => selectedSpecs[group.attr_id] === item.value_id);
				console.log("选中的数据", selected)
				if (selected?.multiple) {
					price *= Number(selected.multiple)
				}			
			})
		}		
		return price * quantity.value
	})
	//调用加入购物车接口
	const confirmSpec= async ()=>{
		//判断该商品的所有规格是否都有选择
		//every 用于检测数组中的左右元素是否都符合指定条件
		const allSelected=specList.value.every(group=>selectedSpecs[group.attr_id]) //判断商品的所有规格是否都能在已选规格中找到对应的
		if(!allSelected){
			uni.showToast({
				title:"请选择完整规格",
				icon:"error"
			})
			return 
		}
		try {
			const res=await post("/cart/addCart",{
				product_id:props.product.id,
				name:props.product.name,
				price:finalPrice.value,
				count:quantity.value,
				spec:selectedSpec.value,
				main_pic:props.product.main_pic
			})
			uni.showToast({
				title:"加购成功",
				icon:"success"
			})
			specStore.setSpec("")
			specStore.setCount(1)
			handleClose()
		} catch (error) {
			//TODO handle the exception
			console.error(error)
		}
	}
	//点击确定按钮，将数据存在pinia中
	const handleOk=()=>{
		const allSelected=specList.value.every(group=>selectedSpecs[group.attr_id]) //判断商品的所有规格是否都能在已选规格中找到对应的
		if(!allSelected){
			uni.showToast({
				title:"请选择完整规格",
				icon:"error"
			})
			return 
		}
		specStore.setSpec(selectedSpec.value)
		specStore.setCount(quantity.value)
		specStore.setTotal(finalPrice.value)
		handleClose()
	}
</script>

<style lang="scss" scoped>
	.spec-popup {
		padding: 30rpx;

		.popup-header {
			display: flex;
			align-items: center;
			margin-bottom: 30rpx;

			.product-img {
				width: 160rpx;
				height: 160rpx;
				border-radius: 12rpx;
				margin-right: 20rpx;
			}

			.product-info {
				flex: 1;

				.price {
					color: #ff4d4f;
					font-size: 36rpx;
					font-weight: bold;
					margin-bottom: 10rpx;
				}

				.selected {
					color: #666;
					font-size: 28rpx;
				}
			}

		}

		.spec-content {
			max-height: 600rpx;
			overflow-y: auto;

			.spec-group {
				margin-bottom: 30rpx;

				.group-title {
					font-size: 28rpx;
					color: #333;
					margin-bottom: 20rpx;
				}

				.spec-items {
					display: flex;
					flex-wrap: wrap;
					gap: 20rpx;

					.spec-item {
						padding: 10rpx 30rpx;
						border: 2rpx solid #ddd;
						border-radius: 30rpx;
						font-size: 26rpx;
						color: #666;

						&.active {
							color: #ffce2c;
							border-color: $uni-color-primary;
							background-color: rgba(255, 206, 44, 0.1);
						}
					}
				}
			}
		}

		.popup-footer {
			display: flex;
			align-items: center;
			justify-content: space-between;
			margin-top: 30rpx;
			padding-top: 30rpx;
			border-top: 2rpx solid #eee;

			.quantity {
				display: flex;
				align-items: center;

				text {
					margin-right: 20rpx;
					font-size: 28rpx;
					color: #333;
				}

				.quantity-control {
					display: flex;
					align-items: center;

					.minus,
					.plus {
						width: 60rpx;
						height: 60rpx;
						border: 2rpx solid #ddd;
						display: flex;
						align-items: center;
						justify-content: center;
						font-size: 32rpx;
					}

					.count {
						width: 80rpx;
						height: 60rpx;
						text-align: center;
						border-top: 2rpx solid #ddd;
						border-bottom: 2rpx solid #ddd;
						line-height: 60rpx;
					}
				}
			}

			.confirm-btn {
				width: 220rpx;
				height: 80rpx;
				background-color: $uni-color-primary;
				color: #fff;
				border-radius: 40rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 28rpx;
			}
			.confirm-ok{
				width: 140rpx;
				height: 80rpx;
				border: $uni-color-primary 1px solid;
				color: $uni-color-primary;
				border-radius: 80rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 28rpx;
			}
		}
	}
</style>