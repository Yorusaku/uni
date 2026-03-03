/**
 * 🟣 技术栈大换血 - Refactor阶段（Refactor）
 * 说明：工具函数（clone、format、validation），类型洁癖 + 卫语句优化
 */

import { cloneDeep } from 'lodash-es'
import dayjs from 'dayjs'

/**
 * 🟢 深拷贝（纯函数）
 * 
 * @param value - 要拷贝的值
 * @returns 拷贝后的值
 */
export function deepClone<T>(value: T): T {
  return cloneDeep(value)
}

/**
 * 🟢 价格格式化（纯函数）
 * 
 * @param price - 价格（分）
 * @returns 格式化后的价格（元）
 */
export function formatPrice(price: number): string {
  return (price / 100).toFixed(2)
}

/**
 * 🟢 日期格式化（纯函数）
 * 
 * @param date - 日期字符串或时间戳
 * @param format - 格式（默认：YYYY-MM-DD HH:mm:ss）
 * @returns 格式化后的日期
 */
export function formatDate(date: string | number | Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
  return dayjs(date).format(format)
}

/**
 * 🟢 表单验证（纯函数 + 卫语句优化）
 * 
 * @param value - 表单值
 * @param rule - 验证规则
 * @returns 是否通过验证
 */
export function validateForm(value: unknown, rule: ValidationRule): boolean {
  // ✅ 卫语句：必填验证
  if (rule.required && !value) {
    return false
  }

  // ✅ 卫语句：最小长度验证
  if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
    return false
  }

  // ✅ 卫语句：最大长度验证
  if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
    return false
  }

  // ✅ 卫语句：正则验证
  if (rule.pattern && typeof value === 'string') {
    const regex = new RegExp(rule.pattern)
    if (!regex.test(value)) {
      return false
    }
  }

  return true
}

/**
 * 🟢 验证规则接口（零 any）
 */
export interface ValidationRule {
  /**
   * 是否必填
   */
  required?: boolean

  /**
   * 最小长度
   */
  minLength?: number

  /**
   * 最大长度
   */
  maxLength?: number

  /**
   * 正则表达式
   */
  pattern?: string
}
