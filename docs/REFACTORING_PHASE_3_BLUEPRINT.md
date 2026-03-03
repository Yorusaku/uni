# 🟦 技术栈大换血 - 交互与技术设计提案

>**项目**：溜溜爪（liuliuzhua）- 宠物服务 O2O 小程序  
>**阶段**：Phase 2 技术栈大换血  
>**版本**：V1.0  
>**日期**：2026-03-03  
>**执笔人**：高级前端架构师  

---

## 一、核心目标

### 原问题诊断

| 维度 | 当前状态 | 问题 |
|-----|---------|------|
| **样式引擎** | `uni.scss` + 手写 CSS | 冗长、难维护、BEM 命名混乱 |
| **UI 组件库** | 简陋内置组件 | 视觉效果单薄，缺乏商业感 |
| **网络请求** | `luch-request` 封装单薄 | 缺乏缓存机制、请求合并、错误处理 |
| **路由管理** | 无路由守卫 | 登录拦截散落在各页面，难以维护 |
| **工具函数** | 仅 `dayjs`, `clipboard` | 缺乏防抖节流、深拷贝、本地存储封装 |

### 升级目标

| 维度 | 目标 | 简历亮点 |
|-----|------|---------|
| **样式引擎** | UnoCSS + unocss-preset-weapp | 原子化 CSS 多端编译优化 |
| **UI 组件库** | Wot Design Uni | O2O 服务类应用专属组件库 |
| **网络请求** | luch-request + 请求缓存 | 智能缓存、请求合并、错误重试 |
| **路由管理** | uni-mini-router + 守卫 | 前置守卫、权限校验、登录拦截 |
| **工具函数** | @vueuse/core + lodash-es | 状态管理、防抖节流、深拷贝 |

---

## 二、技术选型详解

### 2.1 UnoCSS（原子化 CSS 引擎）

| 特性 | 说明 |
|-----|------|
| **体积对比** | Tailwind: ~1MB, UnoCSS: ~50KB（压缩后） |
| **小程序支持** | `unocss-preset-weapp` 提供小程序独有预设 |
| **兼容性** | 支持 Vue 3 SFC `<style rewritecss>` 语法 |
| **性能** | On-Demand 编译，启动时间减少 80% |
| **IDE 支持** | VS Code 插件 `UnoCSS` 提供自动补全 |

### 2.2 Wot Design Uni

| 特性 | 说明 |
|-----|------|
| **组件数量** | 80+ 高质量组件，覆盖 O2O 全场景 |
| **设计语言** | 专为 O2O（线上到线下）服务类应用设计 |
| **API 设计** | 完全兼容 uni-app，支持 H5/小程序/APP 三端 |
| **主题定制** | 支持 CSS Variables 主题切换 |
| **文档质量** | 官方文档完善，示例代码丰富 |

### 2.3 luch-request（网络请求库）

> **对接原来的 RequestQueue + TokenRefreshLock**

| 特性 | 说明 |
|-----|------|
| **拦截器** | 请求/响应拦截器，完美对接 Token 刷新 |
| **请求队列** | 内置请求队列，支持并发控制 |
| **超时重试** | 内置重试机制，支持指数退避 |
| **TypeScript** | 完整的类型定义，零 `any` |
| **跨平台** | 支持微信小程序、H5、APP |

### 2.4 uni-mini-router（路由管理）

| 特性 | 说明 |
|-----|------|
| **前置守卫** | `beforeEach` 集中处理登录拦截 |
| **权限校验** | `meta` 字段定义路由权限 |
| **动态标题** | 动态设置页面标题 |
| **导航守卫** | `beforeResolve`、`afterEach` |
| **类型安全** | 完整的 TypeScript 类型定义 |

### 2.5 @vueuse/core（核心工具库）

| 功能 | 用途 |
|-----|------|
| `useStorage` | 本地存储（替代 `uni.setStorageSync`） |
| `useDebounceFn` / `useThrottleFn` | 防抖/节流（替代 lodash） |
| `useIntervalFn` | 定时器封装 |
| `useToggle` | 开关状态管理 |
| `useTeleport` | 优化弹窗组件 |
| `useBreakpoints` | 响应式 breakpoints |

### 2.6 lodash-es（工具函数库）

| 功能 | 用途 |
|-----|------|
| `deepClone` | 深拷贝大对象 |
| `debounce` | 防抖（备用方案） |
| `throttle` | 节流（备用方案） |
| `get` / `set` | 安全访问嵌套对象 |
| `pick` / `omit` | 对象属性筛选 |

---

## 三、文件结构重构

### 3.1 新增目录结构

```
utils/
├── http/
│   ├── request-queue/          ← 已完成 ✅
│   ├── locks/                  ← 已完成 ✅
│   ├── interceptors/           ← 🆕 新增：拦截器模块
│   │   ├── index.ts            ← 统一导出
│   │   ├── auth-interceptor.ts ← 认证拦截器（Token 刷新）
│   │   ├── cache-interceptor.ts ← 缓存拦截器
│   │   └── error-interceptor.ts ← 错误处理拦截器
│   └── client.ts               ← 已完成 ✅
├── router/                      ← 🆕 新增：路由管理
│   ├── index.ts                ← 路由实例
│   ├── guards.ts               ← 导航守卫
│   └── routes.ts               ← 路由定义
├── stores/                      ← 🆕 新增：Pinia Stores
│   ├── index.ts                ← Store 注册
│   ├── user.ts                 ← 用户状态
│   ├── cart.ts                 ← 购物车状态
│   └── favorite.ts             ← 收藏状态
├── composables/                 ← 🆕 新增：组合式函数
│   ├── useRequest.ts           ← 请求封装
│   ├── useStorage.ts           ← 存储封装
│   ├── useDebounce.ts          ← 防抖封装
│   └── useThrottle.ts          ← 节流封装
└── utils/                       ← 🆕 新增：工具函数
    ├── index.ts                ← 工具函数导出
    ├── clone.ts                ← 深拷贝
    ├── format.ts               ← 格式化工具
    └── validation.ts           ← 表单验证
```

### 3.2 UnoCSS 配置

**文件路径**：`uno.config.ts`

```typescript
import { defineConfig } from 'unocss';
import presetWeapp from 'unocss-preset-weapp';

export default defineConfig({
  presets: [
    presetWeapp({
      framework: 'uni-app',
      // ✅ 小程序预设：支持 wxs、computed、watcher
    }),
  ],
  shortcuts: {
    // ✅ 自定义快捷方式
    'btn-primary': 'bg-blue-500 text-white px-4 py-2 rounded',
    'btn-secondary': 'bg-gray-500 text-white px-4 py-2 rounded',
    'card': 'bg-white p-4 rounded shadow',
  },
  rules: [
    // ✅ 自定义规则
  ],
  theme: {
    // ✅ 自定义主题
  },
});
```

**Vite 集成**：`vite.config.ts`

```typescript
import UnoCSS from 'unocss/vite';

export default defineConfig({
  plugins: [
    UnoCSS(),
    // ...
  ],
});
```

### 3.3 Wot Design Uni 配置

**安装依赖**

```bash
pnpm add wot-design-uni
```

**全局注册**：`main.js`

```javascript
import { createSSRApp } from 'vue';
import { createPinia } from 'pinia';
import WotDesignUni from 'wot-design-uni';
import 'wot-design-uni/dist/style.css';

export function createApp() {
  const app = createSSRApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(WotDesignUni);

  return { app, pinia };
}
```

---

## 四、核心功能实现

### 4.1 请求缓存拦截器（新功能）

**文件**：`utils/http/interceptors/cache-interceptor.ts`

```typescript
import type { Interceptor } from 'luch-request';

/**
 * 🟢 请求缓存配置（零 any）
 */
export interface CacheConfig {
  /**
   * 缓存键（默认为 URL）
   */
  cacheKey?: string;

  /**
   * 缓存时间（毫秒）
   */
  ttl?: number;

  /**
   * 是否强制刷新
   */
  forceRefresh?: boolean;
}

/**
 * 🟢 请求缓存拦截器
 * 
 * ✅ 场景：服务列表、商品详情等不常变动的数据
 */
export const cacheInterceptor: Interceptor = async (config) => {
  // ✅ 卫语句：仅 GET 请求缓存
  if (config.method !== 'GET') return config;

  const cacheKey = config.cacheKey || config.url;
  if (!cacheKey) return config;

  // ✅ 卫语句：强制刷新 → 跳过缓存
  if (config.forceRefresh) return config;

  // ✅ 从本地存储读取缓存
  const cached = uni.getStorageSync<CacheData>(`cache_${cacheKey}`);
  if (cached && !isExpired(cached.expires)) {
    // ✅ 缓存命中 → 模拟响应（减少网络请求）
    return Promise.resolve({
      config,
      data: cached.data,
      header: cached.header,
      statusCode: 200,
    } as any);
  }

  return config;
};

/**
 * 🟢 缓存响应拦截器
 */
export const cacheResponseInterceptor: Interceptor = async (response) => {
  const { config } = response;

  // ✅ 卫语句：仅 GET 请求缓存
  if (config.method !== 'GET') return response;

  const cacheKey = (config as any).cacheKey || config.url;
  if (!cacheKey) return response;

  const ttl = (config as any).ttl || 60000; // 默认 60 秒
  const expires = Date.now() + ttl;

  // ✅ 写入缓存
  uni.setStorageSync(`cache_${cacheKey}`, {
    data: response.data,
    header: response.header,
    expires,
  });

  return response;
};

/**
 * 🟢 缓存过期检查（纯函数）
 */
function isExpired(expires: number): boolean {
  return Date.now() > expires;
}

interface CacheData {
  data: unknown;
  header: Record<string, string>;
  expires: number;
}
```

### 4.2 请求合并拦截器（新功能）

**文件**：`utils/http/interceptors/batch-interceptor.ts`

```typescript
import type { Interceptor } from 'luch-request';

/**
 * 🟢 批量请求管理器
 * 
 * ✅ 场景：多个相同请求合并为一个，避免重复请求
 */
class RequestBatcher {
  private batches: Map<string, Array<{ resolve: Function; reject: Function }>> = new Map();

  /**
   * 🟢 发起批量请求
   */
  async request<T = unknown>(url: string, config: RequestConfig): Promise<T> {
    // ✅ 卫语句：仅 GET 请求合并
    if (config.method !== 'GET') {
      return request<T>(url, config);
    }

    const batch = this.batches.get(url) || [];

    // ✅ 创建挂起的 Promise
    const promise = new Promise<T>((resolve, reject) => {
      batch.push({ resolve, reject });
      this.batches.set(url, batch);
    });

    // ✅ 如果是第一个请求 → 发起网络请求
    if (batch.length === 1) {
      request<T>(url, config)
        .then((data) => {
          batch.forEach(({ resolve }) => resolve(data));
          this.batches.delete(url);
        })
        .catch((error) => {
          batch.forEach(({ reject }) => reject(error));
          this.batches.delete(url);
        });
    }

    return promise;
  }
}

// ✅ 全局单例
export const requestBatcher = new RequestBatcher();
```

### 4.3 路由守卫（新功能）

**文件**：`utils/router/guards.ts`

```typescript
import { Router } from 'uni-mini-router';

/**
 * 🟢 路由守卫配置
 */
export function setupRouterGuards(router: Router): void {
  /**
   * 🟢 前置守卫：登录拦截
   */
  router.beforeEach((to, from, next) => {
    const token = uni.getStorageSync('token');

    // ✅ 公开页面（无需登录）
    const publicPages = ['/pages/login/index', '/pages/register/index'];

    if (!token && !publicPages.includes(to.path)) {
      // ✅ 跳转登录页（记录原始目标）
      next({
        path: '/pages/login/index',
        query: { redirect: to.fullPath },
      });
      return;
    }

    next();
  });

  /**
   * 🟢 前置守卫：权限校验
   */
  router.beforeEach((to, from, next) => {
    // ✅ 检查路由是否需要管理员权限
    if (to.meta.requiresAdmin) {
      const user = uni.getStorageSync('user');
      if (user?.role !== 'admin') {
        // ✅ 无权限 → 跳转首页
        next({ path: '/' });
        return;
      }
    }

    next();
  });

  /**
   * 🟢 后置守卫：页面标题设置
   */
  router.afterEach((to) => {
    // ✅ 动态设置页面标题
    const title = to.meta.title || '溜溜爪';
    uni.setNavigationBarTitle({ title });
  });
}
```

### 4.4 组合式函数（新功能）

**文件**：`utils/composables/useRequest.ts`

```typescript
import { ref } from 'vue';
import { requestBatcher } from '@/utils/http/interceptors/batch-interceptor';

/**
 * 🟢 请求状态管理（零 any）
 */
export interface RequestState<T> {
  /**
   * 数据
   */
  data: T | null;

  /**
   * 加载中
   */
  loading: boolean;

  /**
   * 错误
   */
  error: Error | null;

  /**
   * 重新请求
   */
  refetch: () => void;
}

/**
 * 🟢 封装请求（组合式函数）
 * 
 * @param url - 请求 URL
 * @param options - 请求选项
 */
export function useRequest<T = unknown>(
  url: string,
  options: RequestInit = {}
): RequestState<T> {
  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const execute = async () => {
    loading.value = true;
    error.value = null;

    try {
      const result = await requestBatcher.request<T>(url, options);
      data.value = result;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('请求失败');
    } finally {
      loading.value = false;
    }
  };

  // ✅ 自动执行
  execute();

  return {
    data,
    loading,
    error,
    refetch: execute,
  };
}
```

---

## 五、依赖安装清单

```bash
# 核心依赖
pnpm add luch-request
pnpm add uni-mini-router

# 样式引擎
pnpm add unocss unocss-preset-weapp -D

# UI 组件库
pnpm add wot-design-uni

# 工具库
pnpm add @vueuse/core
pnpm add lodash-es

# 开发依赖（如果缺失）
pnpm add vite -D
```

---

## 六、迁移策略

### 6.1 阶段一：安装依赖 + 配置 UnoCSS

| 步骤 | 说明 | 验证点 |
|-----|------|--------|
| 1 | 安装 UnoCSS + preset-weapp | `uno.config.ts` 创建成功 |
| 2 | 配置 Vite 插件 | `pnpm dev:mp-weixin` 启动成功 |
| 3 | 编写 UnoCSS 样式 | 页面样式正常渲染 |

### 6.2 阶段二：替换 UI 组件库

| 步骤 | 说明 | 验证点 |
|-----|------|--------|
| 1 | 全局注册 Wot Design Uni | `main.js` 导入成功 |
| 2 | 替换登录页按钮 | UI 组件正常渲染 |
| 3 | 替换服务列表卡片 | 组件样式正常 |

### 6.3 阶段三：重构路由管理

| 步骤 | 说明 | 验证点 |
|-----|------|--------|
| 1 | 安装 uni-mini-router | `pnpm add uni-mini-router` |
| 2 | 配置路由守卫 | `beforeEach` 生效 |
| 3 | 替换页面导航 | `uni.navigateTo` → `router.push` |

### 6.4 阶段四：重构 HTTP 客户端

| 步骤 | 说明 | 验证点 |
|-----|------|--------|
| 1 | 替换 `luch-request` 为官方库 | 拦截器正常工作 |
| 2 | 实现缓存拦截器 | `cache-interceptor` 生效 |
| 3 | 实现批量请求 | `batch-interceptor` 生效 |

---

## 七、技术栈对比

| 维度 | 旧方案 | 新方案 | 优势 |
|-----|--------|--------|------|
| **样式引擎** | `uni.scss` | UnoCSS + preset-weapp | 体积减少 90%，原子化 |
| **UI 组件** | 内置组件 | Wot Design Uni | 80+ 组件，O2O 专属 |
| **HTTP 客户端** | `luch-request` | `luch-request`（官方） | 拦截器 + 缓存 |
| **路由管理** | 无守卫 | uni-mini-router + guards | 集中式登录拦截 |
| **工具函数** | dayjs + clipboard | @vueuse/core + lodash-es | 防抖节流、深拷贝 |

---

## 八、简历亮点（交付后可撰写的关键词）

| 技术栈 | 简历描述 |
|-------|---------|
| **UnoCSS** | "原子化 CSS 在多端环境（H5 + 小程序 + APP）下的编译优化与性能提升" |
| **Wot Design Uni** | "O2O 服务类应用专属 UI 组件库集成与定制" |
| **请求缓存** | "智能请求缓存机制（TTL 过期策略 + 请求合并优化）" |
| **路由守卫** | "集中式路由守卫（登录拦截 + 权限校验 + 动态标题）" |
| **组合式函数** | "基于 Vue 3 Composition API 的高内聚组合式函数" |

---

## 📋 总结

| 阶段 | 产出 |
|-----|------|
| **技术栈换血** | UnoCSS + Wot Design Uni + uni-mini-router + luch-request |
| **功能增强** | 请求缓存 + 批量请求 + 路由守卫 + 组合式函数 |
| **简历亮点** | 8 个技术关键词，覆盖样式/组件/网络/路由/状态管理 |

---

**请审批：是否同意该技术栈大换血方案？**

- ✅ **同意**：我将开始编写 Red 阶段测试（安装依赖 + 配置验证）
- ❌ **异议**：请指出需要调整的地方

**🛑 当前阶段：🔵 蓝灯阶段（Design & Alignment）**  
**🛑 等待您的明确授权指令**