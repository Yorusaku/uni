/*
 *   Copyright (c) 2024 妙码学院 @Heyi
 *   All rights reserved.
 *   妙码学院官方出品，作者 @Heyi，供学员学习使用，可用作练习，可用作美化简历，不可开源。
 */

/**
 * 导出核心模块
 */
export { Integration, Monitoring, getTransport } from '@miaoma/monitor-sdk-core'

/**
 * 导出 uni-app 专属模块
 */
export { UniappTransport, getUniappInfo } from './transport'

/**
 * 导出错误监控
 */
export { Errors } from './tracing/errorsIntegration'

/**
 * 导出性能监控
 */
export { Metrics } from './tracing/metricsIntegration'

/**
 * 导出纯前端监控（无需后端）
 */
export { initFrontend as initFrontend } from './frontend'

/**
 * 初始化监控 SDK（后端版本）
 *
 * @param options - 配置项
 * @param options.dsn - 上报地址（后端监控平台的接收地址）
 * @param options.enableErrors - 是否启用错误监控（默认 true）
 * @param options.enableMetrics - 是否启用性能监控（默认 true）
 *
 * @returns Monitoring 实例
 *
 * @example
 * ```typescript
 * // main.js
 * import { init } from '@miaoma/monitor-sdk-uniapp'
 *
 * const monitoring = init({
 *   dsn: 'https://your-monitor-server.com/api/monitor',
 *   enableErrors: true,
 *   enableMetrics: true,
 * })
 *
 * console.log('[Monitor] 监控 SDK 初始化完成')
 * ```
 */
export function init(options: {
  dsn: string
  enableErrors?: boolean
  enableMetrics?: boolean
}) {
  const { dsn, enableErrors = true, enableMetrics = true } = options

  // 创建监控实例
  const monitoring = new Monitoring({
    dsn,
    integrations: [],
  })

  // 创建传输层
  const transport = new UniappTransport(dsn)
  monitoring.init(transport)

  // 初始化错误监控
  if (enableErrors) {
    new Errors(transport).init()
  }

  // 初始化性能监控
  if (enableMetrics) {
    new Metrics(transport).init()
  }

  console.log('[Monitor] 监控 SDK 初始化完成 ✅')
  console.log(`[Monitor] 上报地址: ${dsn}`)
  console.log(`[Monitor] 错误监控: ${enableErrors ? '✅ 开启' : '❌ 关闭'}`)
  console.log(`[Monitor] 性能监控: ${enableMetrics ? '✅ 开启' : '❌ 关闭'}`)

  return monitoring
}

/**
 * 初始化监控 SDK（纯前端版本，无需后端）
 *
 * @param options - 配置项
 * @param options.enabled - 是否启用（默认 true）
 * @param options.maxHistorySize - 最大历史记录数（默认 100）
 *
 * @example
 * ```typescript
 * // main.js
 * import { initFrontend } from '@miaoma/monitor-sdk-uniapp'
 *
 * const { monitoring, errors, metrics } = initFrontend({
 *   enabled: true,
 *   maxHistorySize: 100,
 * })
 *
 * console.log('[Monitor] 监控 SDK 初始化完成 ✅')
 * ```
 */
export function initFrontend(options: {
  enabled?: boolean
  maxHistorySize?: number
}) {
  const monitor = initFrontend(options as any)
  return {
    monitoring: monitor?.monitoring,
    errors: monitor?.errors,
    metrics: monitor?.metrics,
    getHistory: monitor?.getHistory,
    clearHistory: monitor?.clearHistory,
  }
}

/**
 * 上报自定义消息
 */
export function captureMessage(message: string) {
  const transport = getTransport()
  if (transport) {
    transport.send({
      event_type: 'message',
      message,
      timestamp: Date.now(),
    })
  }
}

/**
 * 上报自定义事件
 */
export function captureEvent(event: Record<string, unknown>) {
  const transport = getTransport()
  if (transport) {
    transport.send({
      event_type: 'event',
      ...event,
      timestamp: Date.now(),
    })
  }
}
