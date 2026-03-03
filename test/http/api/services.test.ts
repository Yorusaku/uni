/**
 * 🎯 红灯阶段（Red）：API Services 模块测试
 * 说明：红灯阶段，测试调用未实现的函数，运行时报错（FAIL）
 */

import { describe, it } from 'vitest';

// 🟡 红灯阶段：导入空壳 API 函数
import * as servicesAPI from '@/utils/http/api/services';

// 🔴 测试用例：调用未实现的函数，运行时报错

describe('🔴 红灯阶段：API Services 模块（空壳函数）', () => {
  it('🔴 [TEST-4] getServices 调用未实现的函数', async () => {
    // 🔴 红灯阶段：调用未实现的函数，应该报错
    await servicesAPI.getServices();
  });

  it('🔴 [TEST-5] getServiceDetail 调用未实现的函数', async () => {
    // 🔴 红灯阶段：调用未实现的函数，应该报错
    await servicesAPI.getServiceDetail(1);
  });
});
