/**
 * 🎯 红灯阶段（Red）：API Auth 模块测试
 * 说明：红灯阶段，测试调用未实现的函数，运行时报错（FAIL）
 */

import { describe, it, expect } from 'vitest';

// 🟡 红灯阶段：导入空壳 API 函数
import * as authAPI from '@/utils/http/api/auth';

// 🔴 测试用例：调用未实现的函数，运行时报错

describe('🔴 红灯阶段：API Auth 模块（空壳函数）', () => {
  it('🔴 [TEST-1] login 调用未实现的函数', async () => {
    // 🔴 红灯阶段：调用未实现的函数，应该报错
    await authAPI.login({ username: 'test', password: '123' });
  });

  it('🔴 [TEST-2] logout 调用未实现的函数', async () => {
    // 🔴 红灯阶段：调用未实现的函数，应该报错
    await authAPI.logout();
  });

  it('🔴 [TEST-3] getUserInfo 调用未实现的函数', async () => {
    // 🔴 红灯阶段：调用未实现的函数，应该报错
    await authAPI.getUserInfo();
  });
});
