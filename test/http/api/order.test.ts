/**
 * 🎯 红灯阶段（Red）：API Order 模块测试
 * 说明：红灯阶段，测试调用未实现的函数，运行时报错（FAIL）
 */

import { describe, it } from 'vitest';

// 🟡 红灯阶段：导入空壳 API 函数
import * as orderAPI from '@/utils/http/api/order';

// 🔴 测试用例：调用未实现的函数，运行时报错

describe('🔴 红灯阶段：API Order 模块（空壳函数）', () => {
  it('🔴 [TEST-6] createOrder 调用未实现的函数', async () => {
    // 🔴 红灯阶段：调用未实现的函数，应该报错
    await orderAPI.createOrder({ serviceId: 1, userId: 1 });
  });

  it('🔴 [TEST-7] getOrders 调用未实现的函数', async () => {
    // 🔴 红灯阶段：调用未实现的函数，应该报错
    await orderAPI.getOrders();
  });

  it('🔴 [TEST-8] getOrderDetail 调用未实现的函数', async () => {
    // 🔴 红灯阶段：调用未实现的函数，应该报错
    await orderAPI.getOrderDetail(1);
  });
});
