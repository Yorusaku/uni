/**
 * 🟣 技术栈大换血 - Refactor阶段（Refactor）
 * 说明：路由守卫，类型洁癖 + 卫语句优化
 */

import { Router, NavigationGuardNext, RouteLocationNormalized } from 'uni-mini-router'
import { PageMeta } from './index'

/**
 * 🟢 守卫导航信息（零 any）
 */
interface GuardInfo {
  /**
   * 路由目标
   */
  to: RouteLocationNormalized

  /**
   * 当前路由
   */
  from: RouteLocationNormalized

  /**
   * 导航守卫
   */
  next: NavigationGuardNext
}

/**
 * 🟢 检查是否为公开页面（纯函数）
 * 
 * @param path - 路由路径
 * @returns 是否为公开页面
 */
function isPublicPage(path: string): boolean {
  const publicPages = ['/pages/login/index', '/pages/register/index']
  return publicPages.includes(path)
}

/**
 * 🟢 是否需要登录（纯函数 + 卫语句）
 * 
 * @param meta - 路由元信息
 * @returns 是否需要登录
 */
function requiresAuth(meta?: PageMeta): boolean {
  // ✅ 卫语句：提前返回
  if (!meta) return true
  return meta.requiresAuth ?? true
}

/**
 * 🟢 检查用户权限（纯函数）
 * 
 * @param meta - 路由元信息
 * @returns 是否有权限
 */
function hasAdminPermission(meta?: PageMeta): boolean {
  if (!meta?.requiresAdmin) return true

  const user = uni.getStorageSync<{ role?: string }>('user')
  return user?.role === 'admin'
}

/**
 * 🟢 设置页面标题（纯函数）
 * 
 * @param title - 页面标题
 */
function setTabPageTitle(title: string): void {
  uni.setNavigationBarTitle({ title })
}

/**
 * 🟢 路由守卫配置（卫语句优化）
 * 
 * @param router - 路由器实例
 */
export function setupRouterGuards(router: Router): void {
  /**
   * 🟢 前置守卫：登录拦截 + 权限校验（合并为一个守卫）
   */
  router.beforeEach((to, from, next) => {
    const { path, meta } = to

    // ✅ 卫语句 1：公开页面 → 直接放行
    if (isPublicPage(path)) {
      next()
      return
    }

    // ✅ 卫语句 2：未登录且需要登录 → 跳转登录页
    const token = uni.getStorageSync('token')
    if (!token && requiresAuth(meta)) {
      next({
        path: '/pages/login/index',
        query: { redirect: to.fullPath },
      })
      return
    }

    // ✅ 卫语句 3：需要管理员权限但无权限 → 跳转首页
    if (!hasAdminPermission(meta)) {
      next({ path: '/' })
      return
    }

    next()
  })

  /**
   * 🟢 后置守卫：页面标题设置（卫语句优化）
   */
  router.afterEach((to) => {
    // ✅ 卫语句：提前返回
    const title = to.meta.title
    if (!title) return

    setTabPageTitle(title)
  })
}
