/*
 *   Copyright (c) 2024 妙码学院 @Heyi
 *   All rights reserved.
 *   妙码学院官方出品，作者 @Heyi，供学员学习使用，可用作练习，可用作美化简历，不可开源。
 */

import { Transport } from '@miaoma/monitor-sdk-core'

export interface PerformanceMetric {
  name: string
  value: number // 毫秒
  path: string
  timestamp: number
  meta?: {
    networkType?: string
    deviceModel?: string
    platform?: string
    memoryUsage?: number
  }
}

/**
 * uni-app 性能监控
 * - 首屏渲染时间（首屏内容渲染完成）
 * - 页面加载时间（onLoad ~ onReady）
 * - 接口响应时间（请求耗时）
 * - 页面切换时间（路由切换耗时）
 */
export class Metrics {
  private pageLoadStartTime: Record<string, number> = {}
  private routeStartTime: Record<string, number> = {}

  constructor(private transport: Transport) {}

  init() {
    // 1. 监听页面生命周期，计算首屏渲染时间
    this.patchPageLifecycle()

    // 2. 监听路由跳转
    this.patchPageRoute()

    // 3. 接口响应时间监控（通过 client.ts 调用）
  }

  /**
   * 监听页面生命周期
   * - onLoad: 页面开始加载
   * - onReady: 页面初次渲染完成
   */
  private patchPageLifecycle() {
    const originalOnLoad = Page.prototype.onLoad
    const originalOnReady = Page.prototype.onReady

    // 拦截 onLoad
    Page.prototype.onLoad = function (options) {
      const currentPage = this as any
      const pagePath = currentPage.$page?.fullPath || '/unknown'

      // 记录页面加载开始时间
      if (!currentPage.__performanceMetrics) {
        currentPage.__performanceMetrics = {}
      }
      currentPage.__performanceMetrics.loadStartTime = Date.now()

      if (originalOnLoad) {
        return originalOnLoad.call(this, options)
      }
    }

    // 拦截 onReady
    Page.prototype.onReady = function () {
      const currentPage = this as any
      const pagePath = currentPage.$page?.fullPath || '/unknown'

      const loadStartTime = currentPage.__performanceMetrics?.loadStartTime
      if (loadStartTime) {
        // 首屏渲染时间 = onReady - onLoad
        const firstScreenTime = Date.now() - loadStartTime

        currentPage.__performanceMetrics?.report?.('first-screen', firstScreenTime)
        
        // 上报性能数据
        this.transport?.send?.({
          event_type: 'performance',
          type: 'webVital',
          name: 'first-screen',
          value: firstScreenTime,
          path: pagePath,
          timestamp: Date.now(),
          meta: {
            networkType: uni.getSystemInfoSync().networkType,
            deviceModel: uni.getSystemInfoSync().model,
            platform: uni.getSystemInfoSync().platform,
            ...this.getSystemInfo?.(),
          },
        })
      }

      if (originalOnReady) {
        return originalOnReady.call(this)
      }
    }.bind({ transport: this.transport, getSystemInfo: this.getSystemInfo })
  }

  /**
   * 监听路由跳转
   */
  private patchPageRoute() {
    const originalSwitchTab = uni.switchTab
    const originalReLaunch = uni.reLaunch
    const originalRedirectTo = uni.redirectTo
    const originalNavigateTo = uni.navigateTo

    // 统一的路由跳转监控
    const监控路由跳转 = (originalFn: Function) => {
      return (options: any) => {
        const startTime = Date.now()
        const targetPath = options.url

        // 记录路由跳转开始时间
        this.routeStartTime[targetPath] = startTime

        // 监听页面 onLoad，计算路由跳转耗时
        const originalOnLoad = Page.prototype.onLoad
        Page.prototype.onLoad = function (pageOptions) {
          const currentPage = this as any
          const pagePath = currentPage.$page?.fullPath || '/unknown'

          if (pagePath === targetPath && startTime) {
            const routeTime = Date.now() - startTime

            this.__performanceMetrics = {
              ...this.__performanceMetrics,
              routeTime,
            }

            // 上报路由跳转时间
            this.transport?.send?.({
              event_type: 'performance',
              type: 'webVital',
              name: 'route-switch',
              value: routeTime,
              path: pagePath,
              timestamp: Date.now(),
              meta: {
                networkType: uni.getSystemInfoSync().networkType,
                deviceModel: uni.getSystemInfoSync().model,
                platform: uni.getSystemInfoSync().platform,
                ...this.getSystemInfo?.(),
              },
            })
          }

          // 恢复原始 onLoad
          Page.prototype.onLoad = originalOnLoad

          if (originalOnLoad) {
            return originalOnLoad.call(this, pageOptions)
          }
        }.bind({ transport: this.transport, getSystemInfo: this.getSystemInfo })

        return originalFn(options)
      }
    }

    uni.switchTab = 监控路由跳转(originalSwitchTab)
    uni.reLaunch = 监控路由跳转(originalReLaunch)
    uni.redirectTo = 监控路由跳转(originalRedirectTo)
    uni.navigateTo = 监控路由跳转(originalNavigateTo)
  }

  /**
   * 记录接口响应时间（供 client.ts 调用）
   */
  public reportApiResponse(url: string, startTime: number, statusCode?: number) {
    const duration = Date.now() - startTime
    
    // 只上报超过 1秒 的慢接口
    if (duration > 1000 || (statusCode && statusCode >= 500)) {
      this.transport.send({
        event_type: 'performance',
        type: 'webVital',
        name: 'api-response',
        value: duration,
        path: this.getCurrentPagePath(),
        timestamp: Date.now(),
        meta: {
          url,
          statusCode,
          networkType: uni.getSystemInfoSync().networkType,
          deviceModel: uni.getSystemInfoSync().model,
          platform: uni.getSystemInfoSync().platform,
          ...this.getSystemInfo(),
        },
      })
    }
  }

  /**
   * 获取当前页面路径
   */
  private getCurrentPagePath(): string {
    const pages = uni.getCurrentPages()
    if (pages.length > 0) {
      return pages[pages.length - 1].$page.fullPath
    }
    return '/'
  }

  /**
   * 获取系统信息
   */
  private getSystemInfo() {
    try {
      const systemInfo = uni.getSystemInfoSync()
      return {
        networkType: systemInfo.networkType,
        deviceModel: systemInfo.model,
        platform: systemInfo.platform,
      }
    } catch {
      return {}
    }
  }
}
