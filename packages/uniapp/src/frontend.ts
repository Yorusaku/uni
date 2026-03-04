/*
 *   Copyright (c) 2024 妙码学院 @Heyi
 *   All rights reserved.
 *   妙码学院官方出品，作者 @Heyi，供学员学习使用，可用作练习，可用作美化简历，不可开源。
 */

/**
 * 纯前端监控 SDK（无需后端）
 * 数据存储在 localStorage，前端可视化展示
 */

import { Transport } from '@miaoma/monitor-sdk-core'
import { Monitoring, getTransport } from '@miaoma/monitor-sdk-core'
import { Errors } from './errorsIntegration'
import { Metrics } from './metricsIntegration'

export interface MonitoringOptions {
  enabled?: boolean
  maxHistorySize?: number  // 最大历史记录数
}

// 前端内存 Transport（不发送数据到服务器）
class FrontendTransport implements Transport {
  constructor(private maxHistorySize: number = 100) {}

  send(data: Record<string, unknown>) {
    // 数据存储在内存中（可选：也保存到 localStorage）
    const history = this.getHistory()
    history.push({
      ...data,
      timestamp: Date.now(),
    })

    // 只保留最近的记录
    if (history.length > this.maxHistorySize) {
      history.splice(0, history.length - this.maxHistorySize)
    }

    this.setHistory(history)

    // 控制台输出（开发调试用）
    this.log(data)
  }

  private getHistory(): Record<string, unknown>[] {
    try {
      const data = localStorage.getItem('monitoring_history')
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  private setHistory(history: Record<string, unknown>[]) {
    try {
      localStorage.setItem('monitoring_history', JSON.stringify(history))
    } catch (error) {
      console.error('[Monitor] 保存历史记录失败:', error)
    }
  }

  private log(data: Record<string, unknown>) {
    if (data.event_type === 'error') {
      console.error('[Monitor] 错误:', data)
    } else if (data.event_type === 'performance') {
      console.log(`[Monitor] 性能: ${data.name} - ${data.value}ms`)
    } else {
      console.log('[Monitor] 数据:', data)
    }
  }
}

/**
 * 错误监控（适配纯前端）
 */
class FrontendErrors extends Errors {
  init() {
    // 原始错误监控
    super.init()

    // 额外：控制台错误监听
    const originalError = console.error
    console.error = (...args) => {
      this.transport?.send({
        event_type: 'error',
        type: 'console_error',
        message: args.join(' '),
        stack: new Error().stack,
        path: this.getCurrentPagePath(),
        timestamp: Date.now(),
      })
      originalError.apply(console, args)
    }
  }
}

/**
 * 性能监控（适配纯前端）
 */
class FrontendMetrics extends Metrics {
  init() {
    // 原始性能监控
    super.init()

    // 额外：性能指标统计
    window.addEventListener('load', () => {
      const timing = performance.timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

      if (navigation) {
        this.transport?.send({
          event_type: 'performance',
          type: 'webVital',
          name: 'domDOMContentLoaded',
          value: navigation.domContentLoadedEventEnd - navigation.startTime,
          path: window.location.pathname,
          timestamp: Date.now(),
        })

        this.transport?.send({
          event_type: 'performance',
          type: 'webVital',
          name: 'loadComplete',
          value: navigation.loadEventEnd - navigation.startTime,
          path: window.location.pathname,
          timestamp: Date.now(),
        })
      }
    })
  }
}

/**
 * 初始化监控 SDK（纯前端版本）
 */
export function init(options: MonitoringOptions = {}) {
  const { enabled = true, maxHistorySize = 100 } = options

  if (!enabled) {
    console.log('[Monitor] 监控 SDK 已禁用')
    return null
  }

  // 创建监控实例
  const monitoring = new Monitoring({
    dsn: 'frontend', // 占位符
    integrations: [],
  })

  // 创建前端 Transport
  const transport = new FrontendTransport(maxHistorySize)
  monitoring.init(transport)

  // 初始化错误监控
  const errors = new FrontendErrors(transport)
  errors.init()

  // 初始化性能监控
  const metrics = new FrontendMetrics(transport)
  metrics.init()

  console.log('[Monitor] 监控 SDK 初始化完成 ✅')
  console.log('[Monitor] 模式: 纯前端（无需后端）')
  console.log(`[Monitor] 历史记录上限: ${maxHistorySize} 条`)

  return {
    monitoring,
    errors,
    metrics,
    // 提供获取历史数据的接口
    getHistory: () => transport['getHistory']() as Record<string, unknown>[],
    clearHistory: () => {
      localStorage.removeItem('monitoring_history')
      console.log('[Monitor] 历史记录已清空')
    },
  }
}

/**
 * 手动上报消息
 */
export function captureMessage(message: string, transport?: FrontendTransport) {
  if (!transport) {
    const t = getTransport() as FrontendTransport
    if (t) transport = t
  }
  
  if (transport) {
    transport.send({
      event_type: 'message',
      message,
      timestamp: Date.now(),
    })
  }
}

/**
 * 手动上报错误
 */
export function captureError(error: Error, transport?: FrontendTransport) {
  if (!transport) {
    const t = getTransport() as FrontendTransport
    if (t) transport = t
  }
  
  if (transport) {
    transport.send({
      event_type: 'error',
      name: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
    })
  }
}
