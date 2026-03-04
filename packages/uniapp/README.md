# 📊 uni-app 性能监控 SDK 集成指南

## 📦 **包名**
```
@miaoma/monitor-sdk-uniapp
```

---

## 🏗️ **项目结构**

```
packages/
├── uniapp/                           # uni-app 监控 SDK
│   ├── src/
│   │   ├── index.ts                  # 主入口（导出所有功能）
│   │   ├── transport/
│   │   │   └── index.ts            # 传输层（uni.request 上报）
│   │   ├── tracing/
│   │   │   ├── errorsIntegration.ts  # 错误监控
│   │   │   └── metricsIntegration.ts # 性能监控
│   │   └── metrics/                  # 性能指标（可选扩展）
│   ├── package.json
│   ├── tsconfig.json
│   └── tsup.config.ts
```

---

## 🚀 **集成到项目**

### **步骤 1：添加监控初始化代码**

在 `main.js` 中导入并初始化监控 SDK：

```typescript
// main.js
import { createApp } from '@/main' // 你已有的 createApp 函数
import { init } from '@miaoma/monitor-sdk-uniapp'

// ✅ 1. 初始化监控 SDK（在应用启动时）
const monitoring = init({
  dsn: 'https://your-monitor-server.com/api/monitor',
  enableErrors: true,  // 启用错误监控
  enableMetrics: true, // 启用性能监控
})

// ✅ 2. 创建应用实例
const { app, pinia } = createApp()

// ✅ 3. 挂载应用
app.mount('#app')

// 可选：在关键节点手动上报消息
monitoring.reportMessage('Application started')
```

---

### **步骤 2：在 HTTP 客户端中集成性能监控**

修改 `utils/http/client.ts`，在请求完成后上报性能数据：

```typescript
// utils/http/client.ts
import { get, post as alovaPost } from 'alova'
import type { Method } from 'alova'
import { UniappAdapter } from '@alova/adapter-uniapp'
import { Metrics } from '@miaoma/monitor-sdk-uniapp'

// ✅ 创建 alova 实例
const alovaInstance = createAlova({
  baseURL: 'https://www.liuliuzhua.cn',
  timeout: 10000,
  adapter: UniappAdapter,
  stateManager: createVuexStateManager(),
  events: {
    beforeSend: (method: Method) => {
      method.requestConfig.startTime = Date.now() // 记录开始时间
    },
  },
})

// ✅ 导出带性能监控的 get 方法
export function get<T>(url: string, params?: Record<string, any>) {
  const startTime = Date.now()
  
  return alovaInstance.get<T>(url, { params }).send()
    .then((response) => {
      // ✅ 上报接口性能数据
      reportApiResponse(url, startTime, response.status)
      return response.data
    })
    .catch((error) => {
      reportApiResponse(url, startTime, error.status)
      throw error
    })
}

// ✅ 导出带性能监控的 post 方法
export function post<T>(url: string, data?: any) {
  const startTime = Date.now()
  
  return alovaInstance.post<T>(url, data).send()
    .then((response) => {
      // ✅ 上报接口性能数据
      reportApiResponse(url, startTime, response.status)
      return response.data
    })
    .catch((error) => {
      reportApiResponse(url, startTime, error.status)
      throw error
    })
}

// ✅ 上报接口性能（供 client.ts 调用）
function reportApiResponse(url: string, startTime: number, statusCode?: number) {
  const duration = Date.now() - startTime
  const metrics = new Metrics(getTransport())
  metrics.reportApiResponse(url, startTime, statusCode)
}
```

---

### **步骤 3：在手动上报性能数据的页面**

```vue
<!-- pages/some-page.vue -->
<script setup>
import { onReady } from '@dcloudio/uni-app'
import { Metrics, getTransport } from '@miaoma/monitor-sdk-uniapp'

// ✅ 手动上报自定义性能指标
const metrics = new Metrics(getTransport())

onReady(() => {
  // 上报页面特定性能指标
  metrics.reportApiResponse('/api/some-endpoint', 123, 200)
})
</script>
```

---

## 🎯 **监控数据说明**

### **错误监控**

自动捕获以下错误：
1. **JavaScript 运行时错误**（全局错误处理器）
2. **Promise 未捕获错误**（unhandledrejection）
3. **网络错误**（5xx 服务器错误）
4. **API 调用失败**（request fail）

### **性能监控**

自动上报以下指标：
1. **首屏渲染时间**（onLoad ~ onReady）
2. **路由跳转时间**（navigateTo ~ onLoad）
3. **接口响应时间**（超过 1秒 或 5xx 错误）

---

## 🔧 **配置说明**

```typescript
init({
  dsn: 'https://your-monitor-server.com/api/monitor', // 必填：后端接收地址
  enableErrors: true,  // 可选：是否启用错误监控（默认 true）
  enableMetrics: true, // 可选：是否启用性能监控（默认 true）
})
```

---

## 📤 **上报数据格式**

### **错误数据**
```json
{
  "event_type": "error",
  "type": "javascript|network|api|component",
  "message": "Error message",
  "stack": "Error stack trace",
  "path": "/pages/index/index",
  "timestamp": 1234567890,
  "uniappInfo": {
    "appId": "__UNI__0A8B765",
    "appVersion": "1.0.0",
    "platform": "ios|android|h5",
    "deviceModel": "iPhone 13",
    "system": "iOS 15.0",
    "version": "8.0.30",
    ...
  },
  "meta": {
    "url": "https://api.example.com",
    "method": "GET",
    "statusCode": 500,
    "networkType": "wifi|4g|5g",
    "memoryUsage": 0
  }
}
```

### **性能数据**
```json
{
  "event_type": "performance",
  "type": "webVital",
  "name": "first-screen|route-switch|api-response",
  "value": 1234,
  "path": "/pages/index/index",
  "timestamp": 1234567890,
  "uniappInfo": { ... },
  "meta": {
    "networkType": "wifi",
    "deviceModel": "iPhone 13",
    "platform": "ios",
    "url": "https://api.example.com"
  }
}
```

---

## 🎨 **后端接收示例（Node.js）**

```javascript
// server.js
const express = require('express')
const app = express()

app.use(express.json())

app.post('/api/monitor', (req, res) => {
  const { events, batchSize } = req.body
  
  console.log(`[Monitor] 收到 ${batchSize} 条监控数据`)
  
  events.forEach(event => {
    if (event.event_type === 'error') {
      console.error('[Error]', event)
    } else if (event.event_type === 'performance') {
      console.log('[Performance]', event)
    }
  })
  
  res.json({ status: 'ok' })
})

app.listen(3000, () => {
  console.log('Monitor server running on port 3000')
})
```

---

## ✅ **集成 checklist**

- [ ] 1. 在 `main.js` 中调用 `init()` 初始化 SDK
- [ ] 2. 在 `utils/http/client.ts` 中集成性能监控
- [ ] 3. 配置后端接收地址（`dsn`）
- [ ] 4. 测试错误上报（手动抛出错误）
- [ ] 5. 测试性能上报（查看控制台日志）

---

## 🐛 **调试技巧**

### **开启调试模式**
```typescript
init({
  dsn: 'https://your-monitor-server.com/api/monitor',
  enableErrors: true,
  enableMetrics: true,
})

// 控制台会输出初始化信息
// [Monitor] 监控 SDK 初始化完成 ✅
// [Monitor] 上报地址: https://...
```

### **测试错误上报**
在任意页面添加：
```typescript
onMounted() {
  // 手动触发错误测试
  setTimeout(() => {
    throw new Error('测试错误上报')
  }, 1000)
}
```

### **测试性能上报**
```typescript
onReady() {
  // 手动上报接口性能
  const metrics = new Metrics(getTransport())
  metrics.reportApiResponse('/test-api', Date.now() - 1500, 200)
}
```

---

## 📚 **相关文档**

- [Web Vitals 标准](https://web.dev/articles/lcp)
- [uni-app 官方文档](https://uniapp.dcloud.io/)
- [性能监控最佳实践](https://developers.google.com/web/tools/chrome-devtools/performance)

---

## 🎉 **完成！**

集成完成后，你的小程序将具备：
- 🔴 **错误监控**：自动捕获 JS 错误、网络错误、API 错误
- 📊 **性能监控**：首屏渲染、路由跳转、接口响应时间监控
- 📤 **统一上报**：批量上报，减少网络请求
- 🌐 **跨平台支持**：iOS、Android、H5 全平台兼容

---

**有问题随时找我！🚀**
