interface AMapResponse{
	status:string;
	info:string;
	regeocode:{		
		formatted_address:string;
		addressComponent:{
			province:string;
			city:string;
			district:string;
			township:string
		}

	}
}
export const reverseCode=(longitude:number,latitude:number):Promise<string>=>{
		return new Promise((resolve,reject)=>{
			if(typeof longitude !=="number" || typeof latitude !=="number"){
				reject("经纬度必须为数字")
				return
			}
			uni.request({
				url:"https://restapi.amap.com/v3/geocode/regeo",
				data:{
					key:"5bae6b196907f97857fdc699d03e23a9",
					location:`${longitude},${latitude}`,					
				},
				success(res) {
					console.log("高德api接口返回",res)
					const data:AMapResponse=res.data as AMapResponse
					if(data.status!=="1"){
						reject("高德api错误")
						return
					}
					const address:string=data.regeocode.addressComponent.city.length? data.regeocode.addressComponent.city:data.regeocode.addressComponent.province
					resolve(address)
				},
				fail(err) {
					reject(`请求失败:${err.errMsg}`)
				}
			})
			
		})
}