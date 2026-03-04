/*
 *   Copyright (c) 2024 妙码学院 @Heyi
 *   All rights reserved.
 *   妙码学院官方出品，作者 @Heyi，供学员学习使用，可用作练习，可用作美化简历，不可开源。
 */

import { Transport } from './transport'

/**
 * Integration interface
 * 集成接口
 * 基于插件化设计
 */
export interface IIntegration {
    init(transport: Transport): void
}

export class Integration implements IIntegration {
    constructor(private callback: () => void) {}

    transport: Transport | null = null

    init(transport: Transport) {
        this.transport = transport
    }
}

/**
 * Monitoring options
 * 监控相关配置
 */
export interface MonitoringOptions {
    dsn: string
    integrations?: Integration[]
}
