/**
 * 🟢 Vitest Mock setup（测试环境统一 Mock）
 * 说明：Mock uni-app 等 UniApp 特有的 API，确保测试环境可用
 */

import { vi } from 'vitest';

// ✅ Mock uni-app（仅在测试环境中）
if (typeof globalThis.uni === 'undefined') {
  globalThis.uni = {
    request: vi.fn(),
    getStorageSync: vi.fn(),
    setStorageSync: vi.fn(),
    removeStorageSync: vi.fn(),
    showToast: vi.fn(),
    showNavigationBarLoading: vi.fn(),
    hideNavigationBarLoading: vi.fn(),
    navigateTo: vi.fn(),
    navigateBack: vi.fn(),
    redirectTo: vi.fn(),
    reLaunch: vi.fn(),
    switchTab: vi.fn(),
  } as any;
}
