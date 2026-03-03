<template>
	<view class="address-page">
		<!--地址列表-->
		<view class="address-list" v-if="addressList.length">
			<view class="address-item" v-for="item in addressList" :key="item.id" @click="selectAddress(item)">
				<view class="address-info">
					<view class="contact-info">
						<text class="name">{{item.name}}</text>
						<text class="phone">{{item.phone}}</text>
						<text class="default-tag" v-if="item.is_default">默认</text>
					</view>
					<view class="address-detail">
						{{item.province}}{{item.city}}{{item.district}}{{item.detail}}
					</view>
				</view>
				<view class="address-actions">
					<view class="action-btn" @click.stop="editAddress(item)">
						<up-icon name="edit-pen" size="20" color="#666" ></up-icon>
					</view>
					<view class="action-btn" @click.stop="deleteAddress(item.id)">
						<up-icon name="trash" size="20" color="#666"></up-icon>
					</view>
				</view>
			</view>

		</view>
		<!--空状态-->
		<view class="empty-state" v-else>
			<up-icon name="map" size="60" color="#ccc"></up-icon>
			<text class="empty-text">您还未添加收货地址哦~</text>
		</view>
		<view class="add-btn" @click="showAddressPopup">
			<up-icon name="plus" size="20" color="#fff"></up-icon>
			<text>新增收货地址</text>
		</view>
		<!--地址编辑弹窗-->
		<up-popup :show="showPopup" closeable class="wrap" @close="closePopup">
			<view class="address-form">
				<view class="form-title">{{isEdit?"编辑地址":"新增地址"}}</view>
				<view class="form-item">
					<text class="label">收货人</text>
					<input v-model="addressForm.name" placeholder="请输入收货人姓名" class="input"/>
				</view>
				<view class="form-item">
					<text class="label">手机号</text>
					<input v-model="addressForm.phone" placeholder="请输入手机号" type="number" maxlength="11" class="input"/>
				</view>
				<view class="form-item" @click="showRegionPicker">
					<text class="label">所在地区</text>
					<view class="region-display">
						<text v-if="addressForm.region.length">{{addressForm.region.join(" ")}}</text>
						<text v-else>请选择所在地区</text>
						<up-icon name="arrow-right" size="16" color="#999" class="right"></up-icon>
					</view>
				</view>
				<view class="form-item">
					<text class="label">详细地址</text>
					<textarea v-model="addressForm.detail" placeholder="请输入详细地址" class="textarea"/>
				</view>
				<view class="form-item">
					<text class="def">设为默认地址</text>
					<switch :checked="addressForm.is_default" color="#ffce2c" @change="onDefaultChange"></switch>
				</view>
				<view class="form-actions">
					<view class="cancel-btn" @click="closePopup">取消</view>
					<view class="save-btn" @click="saveAddress">保存</view>
				</view>
			</view>
		</up-popup>
		<!--省市区联动-->
		 <up-picker :show="show" ref="uPickerRef" :columns="columns" @confirm="confirm" @change="changeHandler" @cancel="cancel"></up-picker>
	</view>
</template>
	
<script lang="ts" setup>
import { ref,reactive } from "vue"
import {get,post} from "../../utils/http"
import {onLoad} from "@dcloudio/uni-app"
interface AddressItem{
	city:string;
	detail:string;
	district:string;
	id:number;
	is_default:1|0;
	name:string;
	phone:string;
	province:string;
	user_id:number
}
interface AddressForm{
	name:string;
	phone:string;
	region:string[];
	detail:string;
	is_default:1|0
}
onLoad((options)=>{
	getAddressList()
	flag.value=options.flag
})
const addressList=ref<AddressItem[]>([])
const getAddressList=async()=>{
	try {
		const result:any=await get("/cart/address");
		addressList.value=result
	} catch (error) {
		console.log(error)
	}
}
const deleteAddress=(id:number)=>{
	uni.showModal({
		title:"提示",
		content:"确认要删除这个地址吗？",
		success:async(res)=> {
			if(res.confirm){
				try {
					await post("/cart/deleteAddress",{id});
					uni.showToast({
						title:"删除成功",
						icon:"success"
					})
					getAddressList()
				} catch (error) {
					console.log(error)
				}
			}
		}
	})
}
//省市区级联选择
const show = ref(false);
const columns = reactive([
  ['山东省','北京市', '广东省', '江苏省'],
  ['青岛市', '济南市', '威海市', '烟台市'],
  ["市南区","市北区","崂山区","李沧区"]
]);
const columnData = reactive([
  ['青岛市', '济南市', '威海市', '烟台市'],
  ["北京市"],  
  ['广州市', '深圳市', '珠海市'],   
  ['南京市', '苏州市', '无锡市'],
]);
//区域的数据
const districtData=reactive([
	 //山东省	
	 ["市南区","市北区","崂山区","李沧区"],  // 青岛市
	 ["历下区","市中区","槐荫区","天桥区"],  // 济南市
	 ["环翠区","文登区","荣成市","乳山市"],  // 威海市
	 ["芝罘区","福山区","牟平区","莱山区"],  // 烟台市
	 //北京市
	 ["东城区","西城区","朝阳区","海淀区","丰台区"],
	  // 广东省城市对应的区
	 ["越秀区","海珠区","荔湾区","天河区"],  // 广州市
	 ["福田区","罗湖区","南山区","盐田区"],  // 深圳市
	 ["香洲区","斗门区","金湾区"],           // 珠海市
	  // 江苏省城市对应的区
	 ["玄武区","秦淮区","建邺区","鼓楼区"],  // 南京市
	 ["姑苏区","虎丘区","吴中区","相城区"],  // 苏州市
	 ["梁溪区","锡山区","惠山区","滨湖区"]   // 无锡市
])

const uPickerRef = ref(null)
const changeHandler = (e) => {
  const {
    columnIndex, //操作的那一列的序号 第一列是0
    value,	//每一列所选的数据，结果是个数组
    values,//所有列数据
    index, //当前所操作列所选中数据的角标
  } = e;
  if (columnIndex === 0) { 	
    uPickerRef.value.setColumnValues(1, columnData[index]);//要修改列的序号，要更新的数据数组
	//更新区域数据  如何查找城市在对应区域数组中的角标/索引
	 const cityIndex= getCityIndex(index,0);
	 uPickerRef.value.setColumnValues(2,districtData[cityIndex])
  }else if(columnIndex===1){
	  const provinceIndex=columns[0].indexOf(value[0])
	  const cityIndex=getCityIndex(provinceIndex,index)
	  uPickerRef.value.setColumnValues(2,districtData[cityIndex])
  }
};
//用来获取城市在对应的区域数组中的角标
// 所选省份，前面的省份城市总和即我所选的省份的第一个城市的角标
// 得到省份城市总和 + 所选城市当前的角标 即为当前区域对应的角标  
const getCityIndex=(provinceIndex:number,cityIndex:number)=>{
	const cityCountPerProvince=columnData.map(item=>item.length) //[4,1,3,3] 获取每个省份对应的城市数量
	let total=0 //用来存前面一共多少城市
	for(let i=0;i<provinceIndex;i++){
		 total+=cityCountPerProvince[i]
	}
	return total+cityIndex
}
const confirm = (e) => {
  console.log('confirm', e.value);
  show.value = false;
  addressForm.region=e.value
};
const cancel=()=>{
	show.value=false
	addressForm.region=[]
}
//地址编辑弹窗
const showPopup=ref<boolean>(false)
const isEdit=ref<boolean>(false)
const showAddressPopup=()=>{
	
	isEdit.value=false
	showPopup.value=true
}
const closePopup=()=>{
	showPopup.value=false
	resetForm()
}
const addressForm=reactive<AddressForm>({
	name:"",
	phone:"",
	region:[],
	detail:"",
	is_default:0
})
const currentId=ref<number | null>(null)
const onDefaultChange=(e)=>{
	addressForm.is_default=e.detail.value?1:0
}
const editAddress=(item:AddressItem)=>{
	isEdit.value=true
	currentId.value=item.id
	addressForm.name=item.name
	addressForm.phone=item.phone
	addressForm.region=[item.province,item.city,item.district]
	addressForm.detail=item.detail
	addressForm.is_default=item.is_default
	showPopup.value=true
}
//重置表单
const resetForm=()=>{
	addressForm.name=""
	addressForm.phone=""
	addressForm.region=[]
	addressForm.detail=""
	addressForm.is_default=0
}
//打开地址选择弹窗
const showRegionPicker=()=>{
	show.value=true;
}
const saveAddress=async ()=>{
	if(!addressForm.name.trim() || !addressForm.phone.trim() || !addressForm.region.length || !addressForm.detail.trim() ){
		uni.showToast({
			title:"地址信息不能为空",
			icon:"none"
		})
		return 
	}
	const newAddress:AddressItem={
		id:isEdit.value?currentId.value:null,
		name:addressForm.name,
		phone:addressForm.phone,
		province:addressForm.region[0],
		city:addressForm.region[1],
		district:addressForm.region[2],
		detail:addressForm.detail,
		is_default:addressForm.is_default
	}
	try {
		await post("/cart/addOrUpdate",newAddress);
		uni.showToast({
			title:isEdit.value?"编辑成功":"新增成功"
		})
	} catch (error) {
		console.log(error)
	}
	closePopup()
	getAddressList()
	
}

const flag=ref<string>("")

const selectAddress=(item:AddressItem)=>{
	if(flag.value){
		uni.$emit("addressSelected",item) //触发由 uni.$on监听的全局自定义事件
		uni.navigateBack()
	}
}


</script>

<style lang="scss" scoped>
	.address-page{
		min-height: 100vh;
		background-color: #f5f5f5;
		padding-bottom: 120rpx;
		.address-list{
			.address-item{
				background-color: #fff;
				margin-bottom: 20rpx;
				padding: 30rpx;
				display: flex;
				align-items: center;
				.address-info{
					flex: 1;
					.contact-info{
						margin-bottom: 10rpx;
						.name{
							font-size: 32rpx;
							font-weight: bold;
							color: #333;
							margin-right: 20rpx;
						}
						.phone{
							font-size: 28rpx;
							color: #666;
							margin-right: 20rpx;
						}
						.default-tag{
							background-color: #ffce2c;
							color: #fff;
							font-size: 24rpx;
							padding: 4rpx 12rpx;
							border-radius: 6rpx;
						}
					}
					.address-detail{
						font-size: 28rpx;
						color: #666;
						line-height: 1.4;
					}
				}
				
				.address-actions{
					display: flex;
					.action-btn{
						width: 60rpx;
						height: 60rpx;
						display: flex;
						align-items: center;
						justify-content: center;
						background-color: #f5f5f5;
						border-radius: 50%;
						margin-right: 16rpx;
					}
				}
			}
		}
		.empty-state{
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 100rpx 0;
			.empty-text{
				margin-top: 20rpx;
				font-size: 28rpx;
				color: #999;
			}
		}
		.add-btn{
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			height: 120rpx;
			background-color: #ffce2c;
			color: #fff;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 32rpx;
			font-weight: bold;
			text{margin-left: 16rpx;}
		}

	}
	.address-form{

		.form-title{
			font-size: 36rpx;
			font-weight: bold;
			color: #333;
			text-align: center;
			margin-bottom: 40rpx;
			margin-top: 20rpx;
		}
		.form-item{
			display: flex;
			align-items: center;
			padding: 30rpx 0;
			border-bottom: 1rpx solid #eee;
			.label{
				width: 160rpx;
				font-size: 28rpx;
				color: #333;
				margin-left: 20rpx;
			}
			.input{
				flex: 1;
				font-size: 28rpx;
				color: #333;
			}
			.def{margin: 0 20rpx;}
			.textarea{
				flex: 1;
				height: 120rpx;
				font-size: 28rpx;
				color: #333;
			}
			.region-display{
				flex: 1;
				display: flex;
				align-items: center;
				justify-content: space-between;
				font-size: 28rpx;
				color: #333;
				text{
					color: #666
				}
				.right{
					margin-right: 20rpx;
				}
			}
		}
		.form-actions{
			display: flex;
			margin-top:40rpx;
			.cancel-btn,.save-btn{
				flex: 1;
				height: 80rpx;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 32rpx;
				font-weight: bold;
				border-radius: 40rpx;
				margin-right: 16rpx;
			}
			.cancel-btn{
				background-color: #f5f5f5;
				color: #666;
			}
			.save-btn{
				background-color: #ffce2c;
				color: #fff;
			}
		}
	}
</style>