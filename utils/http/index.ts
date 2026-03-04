/**
 * 🟢 HTTP 模块统一导出（alova 版本）
 * 说明：重构阶段，统一导出所有 HTTP 相关 API，类型洁癖
 */

// ✅ 核心客户端 API
export { get, post, setAuthToken, clearAuthToken, getHttpClient, setRefreshTokenApi } from './client';

// ✅ 类型定义
export type { ResponseData, SuccessResponse, ErrorResponse, RequestConfig } from './types';

// ✅ 重新导出 API 模块（等待业务方迁移）
export * as auth from './api/auth';
