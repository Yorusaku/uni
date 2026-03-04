/**
 * 🟣 技术栈大换血 - Refactor阶段（Refactor）
 * 说明：应用初始化，类型洁癖 + 卫语句优化
 */

import App from './App.vue'
import uviewPlus from '@/uni_modules/uview-plus'
import router from '@/utils/router'

// ✅ 导入 alova HTTP 客户端（用于 Token 刷新依赖注入）
import { setRefreshTokenApi } from '@/utils/http/client'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'

/**
 * 🟢 类型定义：应用实例（零 any）
 */
export interface AppInstance {
  /**
   * Vue 应用实例
   */
  app: ReturnType<typeof createSSRApp>

  /**
   * Pinia 实例
   */
  pinia: ReturnType<typeof createPinia>
}

/**
 * 🟢 创建应用实例（纯函数）
 *
 * @returns 应用实例（app + pinia）
 */
function createAppInstance(): AppInstance {
  const app = createSSRApp(App)
  const pinia = createPinia()

  // ✅ 应用级插件注册（卫语句：跳过已注册的插件）
  if (!app._context.options.includes(uviewPlus)) {
    app.use(uviewPlus)
  }

  if (!app._context.options.includes(router)) {
    app.use(router)
  }

  if (!app._context.options.includes(pinia)) {
    app.use(pinia)
  }

  return {
    app,
    pinia,
  }
}

/**
 * 🟢 导出应用创建函数
 */
export function createApp(): AppInstance {
  const { app, pinia } = createAppInstance()

  // ✅ 依赖注入：设置 Token 刷新 API（闭环闭合）
  setRefreshTokenApi(async (): Promise<string> => {
    try {
      // 🔑 获取当前 Token（用于拼接请求）
      const token = uni.getStorageSync('token') ?? ''
      
      // 🔁 调用后端刷新 Token 接口
      const res = await new Promise<unknown>((resolve, reject) => {
        uni.request({
          url: 'https://www.liuliuzhua.cn/api/auth/refresh-token',
          method: 'POST',
          header: {
            Authorization: token,
          },
          success(res) {
            resolve(res)
          },
          fail(err) {
            reject(err)
          },
        })
      })

      // ✅ 解析响应（类型洁癖）
      const response = res as {
        data: {
          token: string
        }
      }

      return response.data.token
    } catch (error) {
      console.error('[RefreshToken] 刷新失败：', error)
      throw error
    }
  })

  return { app, pinia }
}
// #endif
