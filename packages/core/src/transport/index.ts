/*
 *   Copyright (c) 2024 妙码学院 @Heyi
 *   All rights reserved.
 *   妙码学院官方出品，作者 @Heyi，供学员学习使用，可用作练习，可用作美化简历，不可开源。
 */

/**
 * Transport interface
 * 定义传输接口，用于发送数据
 * 为了适配不同客户端，例如浏览器、Node.js 等
 */
export interface Transport {
    send(data: Record<string, unknown>): void
}
