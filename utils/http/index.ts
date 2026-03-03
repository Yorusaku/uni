import {RequestConfig} from "./types"
import { requestInterceptor,transformResponse } from "./interceptors"
const request=(config:RequestConfig)=>{
	const processedConfig= requestInterceptor(config)
	//const url=`http://localhost:3000${processedConfig.url}`
	const url=`https://www.liuliuzhua.cn${processedConfig.url}`
	return new Promise((resolve,reject)=>{
		uni.request({
			url,
			method:processedConfig.method || "GET",
			data:processedConfig.data,
			header:processedConfig.header,
			success(res) {
				try{
					resolve(transformResponse(res))
				}catch(error){
					reject(error)
				}
			},
			fail(err) {
				reject("请求失败")
			}
		})
	})
}

export const get=(url:string,data?:any)=>request({url,method:"GET",data})

export const post=(url:string,data?:any)=>request({url,method:"POST",data})

