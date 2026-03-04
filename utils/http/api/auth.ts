/**
 * 🟣 重构阶段：API Auth 模块
 * 说明：登录/登出接口，类型洁癖，卫语句优化
 */

import type { HttpClientInstance } from '../client';
import { getHttpClient } from '../client';
import { ResponseData } from '../types';

/**
 * 🟢 登录请求参数（类型洁癖）
 */
export interface LoginRequest {
  /**
   * 用户名
   */
  username: string;

  /**
   * 密码
   */
  password: string;
}

/**
 * 🟢 用户信息（类型洁癖）
 */
export interface UserInfo {
  /**
   * 用户 ID
   */
  id: number;

  /**
   * 昵称
   */
  nickname: string;

  /**
   * 头像 URL
   */
  avatar: string;
}

/**
 * 🟢 登录响应数据（类型洁癖）
 */
export interface LoginResponse extends ResponseData<{
  /**
   * Bearer Token
   */
  token: string;

  /**
   * 用户信息
   */
  userInfo: UserInfo;
}> {}

/**
 * 🟢 登录（卫语句优化）
 * 
 * @param httpClient - HTTP 客户端实例
 * @param payload - 登录参数
 * @returns 登录响应
 */
async function loginInner(
  httpClient: HttpClientInstance,
  payload: LoginRequest
): Promise<LoginResponse> {
  // ✅ 卫语句：防空指针
  if (!payload.username || !payload.password) {
    throw new Error('[Auth] 登录参数无效');
  }

  const response = await httpClient.post<LoginResponse>('/api/auth/login', payload);

  return response;
}

/**
 * 🟢 登录
 * 
 * @param payload - 登录参数（用户名、密码）
 * @returns 登录响应（Token + 用户信息）
 */
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const httpClient = getHttpClient();

  return loginInner(httpClient, payload);
}

/**
 * 🟢 登出（卫语句优化）
 */
export async function logout(): Promise<void> {
  const httpClient = getHttpClient();

  // ✅ 卫语句：防空指针
  if (!httpClient) {
    throw new Error('[Auth] HTTP 客户端未初始化');
  }

  await httpClient.post('/api/auth/logout');
}

/**
 * 🟢 获取用户信息（卫语句优化）
 */
export async function getUserInfo(): Promise<UserInfo> {
  const httpClient = getHttpClient();

  // ✅ 卫语句：防空指针
  if (!httpClient) {
    throw new Error('[Auth] HTTP 客户端未初始化');
  }

  const response = await httpClient.get<LoginResponse>('/api/user/info');

  // ✅ 卫语句：检查用户信息是否存在
  if (!response.data?.userInfo) {
    throw new Error('[Auth] 获取用户信息失败');
  }

  return response.data.userInfo;
}
