/**
 * 🟣 技术栈大换血 - Refactor阶段（Refactor）
 * 说明：uni-mini-router 路由配置，类型洁癖 + 纯函数
 */

import { createRouter, createWebHashHistory, RouteRecordRaw } from 'uni-mini-router'
import { setupRouterGuards } from './guards'

/**
 * 🟢 页面路由元信息（零 any）
 */
export interface PageMeta {
  /**
   * 页面标题
   */
  title: string

  /**
   * 是否需要登录
   */
  requiresAuth?: boolean

  /**
   * 是否需要管理员权限
   */
  requiresAdmin?: boolean
}

/**
 * 🟢 路由配置项（零 any）
 */
export interface PageRoute extends RouteRecordRaw {
  /**
   * 路由名称
   */
  name: string

  /**
   * 页面元信息
   */
  meta: PageMeta
}

/**
 * 🟢 路由配置列表（纯函数）
 * 
 * @returns 路由配置数组
 */
function createRouteConfig(): PageRoute[] {
  return [
    {
      path: '/',
      redirect: '/pages/index/index',
    },
    {
      path: '/pages/login/index',
      name: 'Login',
      meta: { title: '登录', requiresAuth: false },
    },
    {
      path: '/pages/register/index',
      name: 'Register',
      meta: { title: '注册', requiresAuth: false },
    },
    {
      path: '/pages/index/index',
      name: 'Index',
      meta: { title: '溜溜爪', requiresAuth: true },
    },
    {
      path: '/pages/services/list',
      name: 'ServicesList',
      meta: { title: '服务列表', requiresAuth: true },
    },
    {
      path: '/pages/services/detail',
      name: 'ServicesDetail',
      meta: { title: '服务详情', requiresAuth: true },
    },
    {
      path: '/pages/order/create',
      name: 'OrderCreate',
      meta: { title: '下单', requiresAuth: true },
    },
    {
      path: '/pages/order/list',
      name: 'OrderList',
      meta: { title: '订单列表', requiresAuth: true },
    },
  ]
}

/**
 * 🟢 创建路由器实例（纯函数）
 * 
 * @returns 路由器实例
 */
function createRouterInstance() {
  return createRouter({
    history: createWebHashHistory(),
    routes: createRouteConfig(),
  })
}

/**
 * 🟢 初始化路由（纯函数 + 卫语句优化）
 * 
 * @returns 路由器实例
 */
function initRouter() {
  const router = createRouterInstance()

  // ✅ 卫语句：重复调用 setupRouterGuards 不会重复注册守卫
  setupRouterGuards(router)

  return router
}

/**
 * 🟢 导出路由器实例
 */
export default initRouter()
