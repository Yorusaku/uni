/**
 * 🟣 重构阶段：API Order 模块
 * 说明：订单创建/查询接口，类型洁癖
 */

import { getHttpClient } from '../client';
import { ResponseData } from '../types';

/**
 * 🟢 订单状态枚举（类型洁癖）
 */
export enum OrderStatus {
  /**
   * 待支付
   */
  PENDING = 'pending',

  /**
   * 已支付
   */
  CONFIRMED = 'confirmed',

  /**
   * 处理中
   */
  PROCESSING = 'processing',

  /**
   * 已完成
   */
  COMPLETED = 'completed',

  /**
   * 已取消
   */
  CANCELLED = 'cancelled',
}

/**
 * 🟢 订单信息（类型洁癖）
 */
export interface Order {
  /**
   * 订单 ID
   */
  id: number;

  /**
   * 订单号
   */
  orderId: string;

  /**
   * 服务 ID
   */
  serviceId: number;

  /**
   * 服务名称
   */
  serviceName: string;

  /**
   * 服务价格（分）
   */
  servicePrice: number;

  /**
   * 订单状态
   */
  status: OrderStatus;

  /**
   * 创建时间
   */
  createdAt: string;

  /**
   * 更新时间
   */
  updatedAt: string;
}

/**
 * 🟢 创建订单请求参数（类型洁癖）
 */
export interface CreateOrderRequest {
  /**
   * 服务 ID
   */
  serviceId: number;

  /**
   * 用户 ID
   */
  userId: number;

  /**
   * 数量
   */
  quantity: number;

  /**
   * 总金额（分）
   */
  totalAmount: number;
}

/**
 * 🟢 创建订单响应（类型洁癖）
 */
export interface CreateOrderResponse extends ResponseData<{
  /**
   * 订单号
   */
  orderId: string;

  /**
   * 总金额（分）
   */
  totalAmount: number;

  /**
   * 订单状态
   */
  status: OrderStatus;
}> {}

/**
 * 🟢 订单列表响应（类型洁癖）
 */
export interface OrdersResponse extends ResponseData<{
  /**
   * 订单列表
   */
  list: Order[];

  /**
   * 总数
   */
  total: number;

  /**
   * 当前页码
   */
  page: number;

  /**
   * 每页数量
   */
  pageSize: number;
}> {}

/**
 * 🟢 创建订单（卫语句优化）
 * 
 * @param payload - 订单参数
 * @returns 创建的订单信息
 */
export async function createOrder(payload: CreateOrderRequest): Promise<CreateOrderResponse> {
  // ✅ 卫语句：参数校验
  if (payload.serviceId < 1) {
    throw new Error('[Order] 服务 ID 无效');
  }

  if (payload.quantity < 1) {
    throw new Error('[Order] 数量无效');
  }

  if (payload.totalAmount < 0) {
    throw new Error('[Order] 总金额无效');
  }

  const httpClient = getHttpClient();

  const response = await httpClient.post<CreateOrderResponse>('/api/orders', payload);

  return response;
}

/**
 * 🟢 获取订单列表（卫语句优化）
 * 
 * @param page - 页码（可选，默认 1）
 * @param pageSize - 每页数量（可选，默认 10）
 * @returns 订单列表
 */
export async function getOrders(
  page: number = 1,
  pageSize: number = 10
): Promise<OrdersResponse> {
  // ✅ 卫语句：参数校验
  if (page < 1) page = 1;
  if (pageSize < 1) pageSize = 10;
  if (pageSize > 100) pageSize = 100;

  const httpClient = getHttpClient();

  const response = await httpClient.get<OrdersResponse>('/api/orders', {
    params: { page, pageSize },
  });

  return response;
}

/**
 * 🟢 获取订单详情（卫语句优化）
 * 
 * @param id - 订单 ID
 * @returns 订单详情
 */
export async function getOrderDetail(id: number): Promise<Order> {
  // ✅ 卫语句：参数校验
  if (id < 1) {
    throw new Error('[Order] 订单 ID 无效');
  }

  const httpClient = getHttpClient();

  const response = await httpClient.get<Order>(`/api/orders/${id}`);

  return response;
}
