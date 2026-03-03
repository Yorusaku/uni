/**
 * 🟣 技术栈大换血 - Refactor阶段（Refactor）
 * 说明：应用初始化，类型洁癖 + 卫语句优化
 */

import App from './App.vue'
import uviewPlus from '@/uni_modules/uview-plus'
import router from '@/utils/router'

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
import WotDesignUni from 'wot-design-uni'
import 'wot-design-uni/dist/style.css'

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

  if (!app._context.options.includes(WotDesignUni)) {
    app.use(WotDesignUni)
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
  return createAppInstance()
}
// #endif
