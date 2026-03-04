/*
 *   Copyright (c) 2024 妙码学院 @Heyi
 *   All rights reserved.
 *   妙码学院官方出品，作者 @Heyi，供学员学习使用，可用作练习，可用作美化简历，不可开源。
 */

/**
 * 监控 SDK 统一入口（纯前端版本）
 * 无需后端，数据存储在 localStorage，前端可视化展示
 */

import { initFrontend } from '@miaoma/monitor-sdk-uniapp'

// 导出初始化函数
export { initFrontend }

// 默认初始化（应用启动时）
const { monitoring, errors, metrics } = initFrontend({
  enabled: true,
  maxHistorySize: 100,
})

// 手动配置选项
export interface MonitorOptions {
  enabled?: boolean
  maxHistorySize?: number
}

/**
 * 获取监控 SDK 实例
 */
export function getMonitorInstance() {
  return { monitoring, errors, metrics }
}

/**
 * 手动上报消息
 */
export function monitorMessage(message: string) {
  const { getHistory } = initFrontend({ enabled: true })
  // 通过 localStorage 访问
}

/**
 * 手动上报错误
 */
export function monitorError(error: Error) {
  const { getHistory } = initFrontend({ enabled: true })
  // 通过 localStorage 访问
}
