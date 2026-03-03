# 🔵 阶段 0：蓝灯阶段（Phase 0）
## 《底层网络与并发锁重构 - 交互与技术设计提案》

>**项目**：溜溜爪（liuliuzhua）- 宠物服务 O2O 小程序  
>**重构阶段**：Phase 1 - 商业级底层网络与并发锁重构  
>**执笔人**：高级前端架构师  
>**版本**：V1.0  
>**日期**：2026-03-03

---

## 一、现状诊断（基于当前项目 `utils/http/`）

### 当前实现分析

| 文件 | 代码行数 | 核心功能 | 问题 |
|------|---------|---------|------|
| `index.ts` | 20+ | 封装 `uni.request` | ❌ 无拦截器机制、无并发控制、无抽象 |
| `interceptors.ts` | 15+ | 简单 Token 注入 + 响应转换 | ❌ 无 Token 刷新、无错误统一处理、无防御性编程 |
| `types.ts` | 5 | 基础 `RequestConfig` 接口 | ❌ 无泛型支持、无响应类型定义 |

### 当前痛点（实锤）

```typescript
// ❌ 问题 1：响应拦截器无返回值，导致调用方收到 undefined
transformResponse=(res:any)=>{
	if(res.statusCode !==200) {
		uni.showToast({...})
		return // ← 这里返回 undefined！
	}
	// ...
	return res.data.data
}

// ❌ 问题 2：无 Token 过期处理，401 直接崩溃
// ❌ 问题 3：并发请求时 Token 过期会触发多次 refresh（雪崩）
// ❌ 问题 4：`any` 大萝莉，IDE 无类型提示
```

| 维度 | 当前状态 | 风险等级 | 商业项目缺口 |
|------|---------|---------|-------------|
| **依赖** | `uni.request` 原生封装 | ⚠️ 高 | 缺乏拦截器、并发控制、Token 刷新机制 |
| **类型安全** | `any` 大萝莉 | 🔴 极高 | 无泛型推导，业务代码易出错 |
| **并发场景** | Token 过期时多请求雪崩 | 🔴 极高 | 无并发锁，重复刷新 Token |
| **错误处理** | 简单 `uni.showToast` | 🔴 高 | 缺乏防御性兜底、无统一错误码映射 |
| **生态** | 无统一抽象层 | ⚠️ 中 | 无法复用拦截器逻辑 |

---

## 二、技术选型决策（已定）

| 选型项 | 决策 | 理由 |
|-------|------|------|
| **HTTP 库** | ✅ `luch-request` | ✅ UniApp 生态最稳、支持全端拦截器、TypeScript 原生支持 |
| **深拷贝/防抖** | ✅ `lodash-es` | ✅ 必须用生产级库，拒绝手写 |
| **Hooks** | ✅ `@vueuse/core` | ✅ 头部生态，减少维护成本 |
| **是否造轮子** | ❌ 全部拒绝 | ⛔ 无感刷新、并发锁等核心逻辑需自研，但基础库必须用成熟方案 |

---

## 三、目录重构方案（`utils/http/`）

### 3.1 目录结构（V1）

```
utils/http/
├── index.ts              # 入口文件：实例化并导出 client
├── client.ts             # HTTP Client 实例配置（baseURL、timeout 等）
├── types.ts              # 系统级类型定义（全局统一）
├── interceptors.ts       # 拦截器集合（请求/响应/错误处理）
├── locks/                # 并发锁模块（NEW）
│   ├── token-refresh-lock.ts  # Token 刷新并发锁（核心模块）
│   └── index.ts             # 锁模块统一导出
├── status.ts             # HTTP 状态码与业务错误码映射
├── utils/                # 私有工具函数（防抖、深拷贝等）
│   ├── debounce.ts
│   ├── deep_clone.ts
│   └── index.ts
└── request-queue/        # 请求队列模块（NEW）
    ├── queue-manager.ts  # 请求队列管理器
    └── index.ts
```

### 3.2 各文件职责拆解

| 文件 | 职责 | 是否业务耦合 |
|-----|------|-----------|
| `types.ts` | 定义 `RequestConfig<T>`, `ResponseData<T>`, `ErrorCode` 等 | ❌ 无 |
| `client.ts` | 实例化 `luch-request`，设置 `baseURL`, `timeout` | ❌ 无 |
| `interceptors.ts` | 配置请求/响应拦截器、错误处理 | ❌ 无 |
| `locks/token-refresh-lock.ts` | 实现 Token 刷新并发锁（核心算法） | ❌ 无 |
| `request-queue/queue-manager.ts` | 管理挂起请求队列（发布订阅模式） | ❌ 无 |
| `status.ts` | HTTP 状态码与统一错误码映射 | ❌ 无 |
| `index.ts` | 导出 `client` + 拦截器注册 + 一行集成 | ❌ 无 |

> **关键设计原则**：`locks/` 和 `request-queue/` 是**纯算法模块**，不依赖业务，可单元测试。

---

## 四、核心亮点：无感刷新与并发锁算法设计（Request Queue + Publish-Subscribe）

### 4.1 问题场景描述

当 Token 过期时，瞬间有 5 个并发请求（`req1~req5`）到达，且都因 `401 Unauthorized` 失败。**传统方案**：每个请求都触发 `refreshToken()`，导致 5 次刷新接口调用，服务器压力巨大。

**商业级方案**：只刷新一次 Token，其余请求挂起，刷新完成后统一重发。

---

### 4.2 算法设计：Request Queue + Publish-Subscribe

#### 核心数据结构

```typescript
// request-queue/queue-manager.ts
interface QueuedRequest {
  resolve: (config: RequestConfig) => void; // 挂起请求的 resolve
  reject: (error: Error) => void;           // 挂起请求的 reject
  config: RequestConfig;                     // 挂起的请求配置
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private isRefreshing = false;
  
  // 订阅/发布机制
  private subscribers: ((newConfig: RequestConfig) => void)[] = [];
  
  // 挂起请求
  enqueue(config: RequestConfig): Promise<RequestConfig> {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, config });
    });
  }
  
  // 发布新配置
  notify(newConfig: RequestConfig) {
    this.subscribers.forEach(sub => sub(newConfig));
    this.subscribers = []; // 清空订阅者
  }
  
  // 添加订阅者（用于重发）
  subscribe(callback: (config: RequestConfig) => void) {
    this.subscribers.push(callback);
  }
}
```

---

#### 拦截器流程图（伪代码）

```
[请求拦截器]
    ↓
检查 Token 是否过期？
    ├─ 否 → 发送请求
    └─ 是 → 触发刷新锁（进入并发控制）

[并发锁模块]
    ├─ 若未在刷新 → 标记 isRefreshing=true，刷新 Token，发布新 config，重发当前请求
    └─ 若已在刷新 → 挂起当前请求入队（enqueue）

[响应拦截器 - 401 错误]
    ↓
触发刷新锁（若未触发）
    ↓
挂起所有后续请求 → 入队
    ↓
刷新 Token 成功 → notify(newConfig) → 所有挂起请求重发
    ↓
刷新失败 → 各自 reject + Toast 提示
```

---

### 4.3 关键算法伪代码（`locks/token-refresh-lock.ts`）

```typescript
// 核心类：Token 刷新并发锁
class TokenRefreshLock {
  private isRefreshing = false;
  private requestQueue = new RequestQueue();
  
  async acquire(config: RequestConfig): Promise<RequestConfig> {
    if (!this.isRefreshing) {
      // ✅ 首个触发刷新的请求
      this.isRefreshing = true;
      
      try {
        const newToken = await this.refreshToken();
        const newConfig = this.updateToken(config, newToken);
        
        // 发布新配置，重发所有挂起请求
        this.requestQueue.notify(newConfig);
        this.isRefreshing = false;
        
        return newConfig;
      } catch (error) {
        this.isRefreshing = false;
        this.requestQueue.notifyError(error); // 全体 reject
        throw error;
      }
    } else {
      // ⏸️ 后续请求挂起
      return this.requestQueue.enqueue(config);
    }
  }
}
```

---

### 4.4 拦截器集成逻辑（`interceptors.ts`）

```typescript
import { TokenRefreshLock } from './locks/token-refresh-lock';

const refreshLock = new TokenRefreshLock();

// 响应拦截器（核心）
request拦截器.use(
  async (config) => {
    // Token 过期时，进入并发锁
    if (isTokenExpired(config.header?.authorization)) {
      config = await refreshLock.acquire(config);
    }
    return config;
  },
  (error) => {
    if (error.statusCode === 401) {
      return refreshLock.acquire(error.config);
    }
    return Promise.reject(error);
  }
);
```

---

## 五、TypeScript 泛型推导设计（`types.ts`）

### 5.1 核心类型定义

```typescript
// types.ts
export interface ResponseData<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface RequestConfig<T = any> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  header?: Record<string, string>;
  responseType?: 'text' | 'arraybuffer';
  // ✅ 泛型推导核心：支持返回类型标注
  __responseType?: T; // 内部标记，不暴露给用户
}

export interface HttpResponse<T = any> {
  statusCode: number;
  header: Record<string, string>;
  data: ResponseData<T>;
}
```

---

### 5.2 业务 API 封装泛型推导（完美体验）

```typescript
// api/user.ts
import { client } from '@/utils/http';

// ✅ 泛型推导：T → ResponseData<User>
export function getUserInfo() {
  return client.get<User>('/user/info'); // 自动推导为 HttpResponse<User>
}

// 业务使用
const { data } = await getUserInfo(); 
// data 类型为 ResponseData<User>
// data.data 类型为 User（完美推导！）
```

---

### 5.3 封装一层 `request` 函数（增强泛型）

```typescript
// utils/http/client.ts
export function request<T = any>(config: RequestConfig): Promise<HttpResponse<T>> {
  return client.request(config);
}

// 用法
const res = await request<User>('/user/info', { method: 'GET' });
// res.data.data: User
```

---

## 六、防御性编程与交互反馈（V4 规约强制）

### 6.1 响应拦截器统一错误处理

```typescript
// interceptors.ts
responseInterceptors.use(
  (response) => {
    // ✅ 前置校验：statusCode 必须存在
    const statusCode = response.statusCode ?? 0;
    
    // ✅ 防御性：兜底数据
    const data = response.data ?? { code: -1, message: '未知错误', data: null };
    
    // ✅ 业务码校验
    if (statusCode !== 200) {
      showToast(getErrorMessage(statusCode)); // 统一 Toast
      return Promise.reject(response);
    }
    
    if (data.code !== 200) {
      showToast(data.message);
      return Promise.reject(response);
    }
    
    return response;
  },
  (error) => {
    // ✅ 网络错误兜底（可选链）
    const msg = error?.errMsg || '网络错误，请重试';
    showToast(msg);
    return Promise.reject(error);
  }
);
```

---

### 6.2 交互防抖（`lodash-es`）

```typescript
// utils/http/utils/debounce.ts
import { debounce } from 'lodash-es';

// 防止重复点击提交
export const debouncedToast = debounce((msg: string) => {
  showToast(msg);
}, 300);
```

---

## 七、迁移计划（Phase 0 后续阶段）

| 阶段 | 任务 | 交付物 | 破坏性变更 |
|-----|------|-------|-----------|
| **🟠 阶段 1** | `luch-request` 安装 + 目录搭建 + 核心类型定义（兼容当前接口） | `types.ts`, `client.ts` | ❌ 无 |
| **🟡 阶段 2** | 实现请求队列 + 并发锁算法（兼容当前逻辑） | `queue-manager.ts`, `token-refresh-lock.ts` | ❌ 无 |
| **🟢 阶段 3** | 拦截器集成 + 错误处理 + Toast 统一（兼容当前 API） | `interceptors.ts` | ❌ 无 |
| **♻️ 阶段 4** | 重构 `api/xxx.ts` 业务模块 + 单元测试 | 业务 API 泛型优化 | ⚠️ 需 更新业务调用 |

---

## 八、风险评估与熔断机制

| 风险点 | 应对方案 |
|-------|---------|
| `luch-request` 不支持 UniApp 某端 | 用 `uni.request` 做降级兜底 |
| Token 刷新请求本身失败 | 重试 2 次，失败后强制登出 |
| 并发锁导致内存泄漏 | 队列超时机制（5s 自动 reject） |

---

## ✅ 蓝灯阶段（Phase 0）总结

| 项 | 状态 |
|---|------|
| 目录结构 | ✅ 已设计 |
| 并发锁算法 | ✅ 已设计（Request Queue + Publish-Subscribe） |
| 泛型推导 | ✅ 已设计（`ResponseData<T>`） |
| 防御性编程 | ✅ 已设计（可选链、兜底、Toast） |
| ❌ **业务代码** | ⛔ **未写任何代码** |
| ❌ **测试代码** | ⛔ **未写任何测试** |

---

## 🛑 蓝灯阶段挂起

**请审批本提案**。若批准，请回复 `🟢 批准进入阶段 1`。  
**未获批准前，绝对不进入下一阶段**（严格遵守 V4 规约）。

---

**提案输出完毕**，等待您的审批指令。