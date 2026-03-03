/**
 * 🟣 重构阶段：API Services 模块
 * 说明：服务列表/详情接口，类型洁癖
 */

import { getHttpClient } from '../client';
import { ResponseData } from '../types';

/**
 * 🟢 服务信息（类型洁癖）
 */
export interface Service {
  /**
   * 服务 ID
   */
  id: number;

  /**
   * 服务名称
   */
  name: string;

  /**
   * 服务描述
   */
  description: string;

  /**
   * 服务价格（分）
   */
  price: number;

  /**
   * 服务图片 URL
   */
  image: string;

  /**
   * 创建时间
   */
  createdAt: string;
}

/**
 * 🟢 服务列表响应（类型洁癖）
 */
export interface ServicesResponse extends ResponseData<{
  /**
   * 服务列表
   */
  list: Service[];

  /**
   * 总数
   */
  total: number;
}> {}

/**
 * 🟢 获取服务列表（卫语句优化）
 * 
 * @param page - 页码（可选，默认 1）
 * @param pageSize - 每页数量（可选，默认 10）
 * @returns 服务列表
 */
export async function getServices(
  page: number = 1,
  pageSize: number = 10
): Promise<ServicesResponse> {
  // ✅ 卫语句：参数校验
  if (page < 1) page = 1;
  if (pageSize < 1) pageSize = 10;
  if (pageSize > 100) pageSize = 100; // ✅ 防御性：最大值限制

  const httpClient = getHttpClient();

  const response = await httpClient.get<ServicesResponse>('/api/services', {
    params: { page, pageSize },
  });

  return response;
}

/**
 * 🟢 获取服务详情（卫语句优化）
 * 
 * @param id - 服务 ID
 * @returns 服务详情
 */
export async function getServiceDetail(id: number): Promise<Service> {
  // ✅ 卫语句：参数校验
  if (id < 1) {
    throw new Error('[Services] 服务 ID 无效');
  }

  const httpClient = getHttpClient();

  const response = await httpClient.get<Service>(`/api/services/${id}`);

  return response;
}
