/*
 *   Copyright (c) 2024 妙码学院 @Heyi
 *   All rights reserved.
 *   妙码学院官方出品，作者 @Heyi，供学员学习使用，可用作练习，可用作美化简历，不可开源。
 */

import { Transport } from '@miaoma/monitor-sdk-core'

/**
 * 获取 uni-app 系统信息
 */
export function getUniappInfo() {
  try {
    const systemInfo = uni.getSystemInfoSync()
    return {
      appId: '__UNI__0A8B765', // 可从 manifest.json 读取
      appVersion: '1.0.0', // 可从 package.json 读取
      platform: systemInfo.platform,
      deviceModel: systemInfo.model,
      system: systemInfo.system,
      version: systemInfo.version,
      screenWidth: systemInfo.screenWidth,
      screenHeight: systemInfo.screenHeight,
      pixelRatio: systemInfo.pixelRatio,
      windowWidth: systemInfo.windowWidth,
      windowHeight: systemInfo.windowHeight,
      statusBarHeight: systemInfo.statusBarHeight,
      language: systemInfo.language,
      systemInfo: systemInfo,
    }
  } catch {
    return {
      appId: '__UNI__0A8B765',
      appVersion: '1.0.0',
      platform: 'unknown',
    }
  }
}

/**
 * uni-app 传输层实现
 * 使用 uni.request 上报监控数据
 */
export class UniappTransport implements Transport {
  private dsn: string
  private queue: Record<string, unknown>[] = [] // 批量上报队列
  private isSending = false
  private readonly MAX_QUEUE_SIZE = 10 // 队列最大长度
  private readonly SEND_INTERVAL = 5000 // 批量上报间隔（毫秒）

  constructor(dsn: string) {
    this.dsn = dsn
    
    // 启动批量上报定时器
    setInterval(() => {
      this.flushQueue()
    }, this.SEND_INTERVAL)
  }

  /**
   * 发送监控数据
   * 支持批量上报和即时上报
   */
  send(data: Record<string, unknown>) {
    // 添加 uni-app 信息到数据中
    const payload = {
      ...data,
      uniappInfo: getUniappInfo(),
      timestamp: Date.now(),
    }

    // 加入队列
    this.queue.push(payload)

    // 如果队列已满，立即发送
    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      this.flushQueue()
    }
  }

  /**
   * 清空队列并发送
   */
  private flushQueue() {
    if (this.queue.length === 0 || this.isSending) {
      return
    }

    this.isSending = true

    // 复制队列并清空
    const dataToSend = [...this.queue]
    this.queue = []

    // 使用 uni.request 发送
    uni.request({
      url: this.dsn,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'X-SDK-Version': '1.0.0',
      },
      data: {
        events: dataToSend,
        batchSize: dataToSend.length,
      },
      success: () => {
        console.log('[Monitor] 数据发送成功:', dataToSend.length)
      },
      fail: (err) => {
        console.error('[Monitor] 数据发送失败:', err)
        
        // 发送失败，数据重新加入队列（保留部分数据）
        if (this.queue.length + dataToSend.length < this.MAX_QUEUE_SIZE * 2) {
          this.queue.unshift(...dataToSend)
        }
      },
      complete: () => {
        this.isSending = false
      },
    })
  }

  /**
   * 立即发送（用于紧急情况）
   */
  public flushNow() {
    this.flushQueue()
  }
}
