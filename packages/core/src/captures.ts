import { getTransport } from './baseClient'

/*
 *   Copyright (c) 2024 妙码学院 @Heyi
 *   All rights reserved.
 *   妙码学院官方出品，作者 @Heyi，供学员学习使用，可用作练习，可用作美化简历，不可开源。
 */
export function captureException(exception: Error) {
    getTransport()?.send({ event_type: 'custom', type: 'customError', exception })
}

export function captureMessage(message: string) {
    getTransport()?.send({ event_type: 'custom', type: 'customMessage', message })
}

/**
 * 自定义事件
 * @param event
 * @param data
 */
interface EventData<T> {
    eventType: string
    data: T
}
export function captureEvent<T>(eventData: EventData<T>) {
    getTransport()?.send({ event_type: 'custom', type: 'customEvent', eventData })
}
