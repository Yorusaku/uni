/*
 *   Copyright (c) 2024 妙码学院 @Heyi
 *   All rights reserved.
 *   妙码学院官方出品，作者 @Heyi，供学员学习使用，可用作练习，可用作美化简历，不可开源。
 */

/**
 * Sentry 风格的简化版 SDK
 * 适配 uni-app
 */

import { Transport } from './transport'

// ============================================================================
// 监控实例
// ============================================================================

export class Monitoring {
  private transport: Transport | null = null

  constructor(private options: MonitoringOptions) {}

  init(transport: Transport) {
    this.transport = transport
  }

  /**
   * 上报消息
   */
  reportMessage(message: string, level: 'debug' | 'info' | 'warning' | 'error' = 'info') {
    this.transport?.send({
      type: 'message',
      message,
      level,
      timestamp: Date.now(),
    })
  }

  /**
   * 上报错误
   */
  reportError(error: Error, context?: Record<string, unknown>) {
    this.transport?.send({
      type: 'error',
      name: error.name,
      message: error.message,
      stack: error.stack,
      context: context || {},
      timestamp: Date.now(),
    })
  }

  /**
   * 上报自定义事件
   */
  reportEvent(event: unknown) {
    this.transport?.send({
      type: 'event',
      event,
      timestamp: Date.now(),
    })
  }
}

// ============================================================================
// 配置类型
// ============================================================================

export interface MonitoringOptions {
  dsn: string
  enabled?: boolean
  environment?: string
  release?: string
}

export let getTransport: () => Transport | null = () => null

// ============================================================================
// 主入口模块
// ============================================================================

import { Errors } from './tracing/errorsIntegration'
import { Metrics } from './tracing/metricsIntegration'
import { UniappTransport } from './transport'
import { getUniappInfo } from './transport'

/**
 * 初始化监控 SDK
 *
 * @param options - 配置项
 * @param options.dsn - 上报地址（Sentry 风格的 DSN）
 * @param options.enabled - 是否启用（默认 true）
 * @param options.environment - 环境（默认 'production'）
 *
 * @example
 * ```typescript
 * // main.js
 * import { init } from '@miaoma/monitor-sdk-uniapp'
 *
 * const monitoring = init({
 *   dsn: 'https://xxx@xxx.ingest.sentry.io/xxx',
 *   environment: process.env.NODE_ENV,
 * })
 *
 * console.log('[Monitor] 监控 SDK 初始化完成 ✅')
 * ```
 */
export function init(options: {
  dsn: string
  enabled?: boolean
  environment?: string
}) {
  const { dsn, enabled = true, environment = 'production' } = options

  if (!enabled) {
    console.log('[Monitor] 监控 SDK 已禁用')
    return {
      monitoring: null,
      errors: null,
      metrics: null,
    }
  }

  // 创建监控实例
  const monitoring = new Monitoring({
    dsn,
    environment,
  })

  // 创建传输层
  const transport = new UniappTransport(dsn)
  monitoring.init(transport)
  getTransport = () => transport

  // 初始化错误监控
  const errors = new Errors(transport)
  errors.init()

  // 初始化性能监控
  const metrics = new Metrics(transport)
  metrics.init()

  console.log('[Monitor] 监控 SDK 初始化完成 ✅')
  console.log(`[Monitor] 上报地址: ${dsn}`)
  console.log(`[Monitor] 环境: ${environment}`)
  console.log(`[Monitor] 监控平台: ${getPlatformInfo()}`)

  return {
    monitoring,
    errors,
    metrics,
  }
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 获取平台信息
 */
export function getPlatformInfo() {
  try {
    const systemInfo = uni.getSystemInfoSync()
    return `${systemInfo.platform} (${systemInfo.model}) v${systemInfo.version}`
  } catch {
    return 'Unknown Platform'
  }
}

/**
 * 上报消息（全局方法）
 */
export function captureMessage(message: string, level: 'debug' | 'info' | 'warning' | 'error' = 'info') {
  const transport = getTransport()
  if (transport) {
    transport.send({
      type: 'message',
      message,
      level,
      timestamp: Date.now(),
    })
  }
}

/**
 * 上报错误（全局方法）
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
  const transport = getTransport()
  if (transport) {
    transport.send({
      type: 'error',
      name: error.name,
      message: error.message,
      stack: error.stack,
      context: context || {},
      timestamp: Date.now(),
    })
  }
}

/**
 * 上报自定义事件（全局方法）
 */
export function captureEvent(event: unknown, context?: Record<string, unknown>) {
  const transport = getTransport()
  if (transport) {
    transport.send({
      type: 'event',
      event,
      context,
      timestamp: Date.now(),
    })
  }
}

/**
 *捕获捕获异常（全局方法）
 */
export function captureException(exception: unknown) {
  const transport = getTransport()
  if (transport) {
    if (exception instanceof Error) {
      transport.send({
        type: 'error',
        name: exception.name,
        message: exception.message,
        stack: exception.stack,
        timestamp: Date.now(),
      })
    } else {
      transport.send({
        type: 'error',
        name: 'UnknownError',
        message: String(exception),
        stack: new Error(String(exception)).stack,
        timestamp: Date.now(),
      })
    }
  }
}
