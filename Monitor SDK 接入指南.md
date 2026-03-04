# 📊 **纯前端监控 SDK 接入指南（无需后端）**

## ✅ **已完成的监控功能**

| 功能 | 状态 | 说明 |
|------|------|------|
| 🔴 错误监控 | ✅ | 自动捕获 JS 错误、Promise 错误 |
| 📊 性能监控 | ✅ | 首屏渲染、接口响应时间 |
| 💾 本地存储 | ✅ | 数据存储在 localStorage |
| 📈 前端可视化 | ✅ | `<monitor-panel />` 组件 |

---

## 🚀 **使用方法**

### **1. 初始化（App.vue）**

```typescript
<script setup lang="ts">
import { initFrontend } from '@/utils/monitor'

// 初始化监控 SDK（纯前端版本）
const { monitoring, errors, metrics } = initFrontend({
  enabled: true,
  maxHistorySize: 100,
})

console.log('[Monitor] 监控 SDK 初始化完成 ✅')
</script>
```

### **2. 开发环境显示监控面板**

在 `pages/index/index.vue` 中：

```vue
<!-- 性能监控面板（仅开发环境显示） -->
<monitor-panel v-if="__DEV__" />
```

---

## 📱 **监控面板功能**

### **标签页**

| 标签 | 说明 |
|------|------|
| 🔴 错误 | 显示捕获的错误记录 |
| ⚡ 性能 | 显示性能指标数据 |

### **错误列表**

- 显示错误类型、消息、堆栈
- 点击可展开堆栈信息
- 自动记录时间戳

### **性能数据**

- 🎯 首屏渲染时间（onLoad ~ onReady）
- 🔄 路由跳转时间（navigateTo ~ onLoad）
- 🌐 接口响应时间
- 📝 历史记录列表

### **操作按钮**

- 🗑️ 清空历史记录
- ❌ 关闭面板

---

## 📊 **数据存储**

### **localStorage** 键名
```
monitoring_history
```

### **数据格式**
```json
[
  {
    "event_type": "error",
    "type": "javascript",
    "message": "Error message",
    "stack": "Error stack trace",
    "timestamp": 1234567890
  },
  {
    "event_type": "performance",
    "type": "webVital",
    "name": "first-screen",
    "value": 1234,
    "timestamp": 1234567890
  }
]
```

---

## 🔧 **调试方法**

### **方法 1：查看控制台**
```
[Monitor] 监控 SDK 初始化完成 ✅
[Monitor] 模式: 纯前端（无需后端）
[Monitor] 历史记录上限: 100 条
```

### **方法 2：查看 localStorage**
```javascript
// 浏览器控制台
localStorage.getItem('monitoring_history')
```

### **方法 3：使用监控面板**
- 打开 App → 点击首页右下角的 📊 图标
- 查看错误/性能数据
- 点击清空历史（可选）

---

## 🎨 **性能指标说明**

| 指标 | 说明 | 阈值 |
|------|------|------|
| **first-screen** | 首屏渲染时间 | < 2000ms ✅ |
| **route-switch** | 路由跳转时间 | < 800ms ✅ |
| **api-response** | 接口响应时间 | < 1000ms ✅ |

---

## 📦 **文件清单**

| 文件 | 说明 |
|------|------|
| `utils/monitor.ts` | 监控 SDK 入口 |
| `components/monitor-panel/` | 监控面板组件 |
| `App.vue` | SDK 初始化 |
| `pages/index/index.vue` | 监控面板显示（开发环境） |

---

## 🎯 **开发生产环境切换**

```typescript
// 开发环境显示监控面板
<monitor-panel v-if="__DEV__" />

// 生产环境隐藏
// 移除或改为 v-if="false"
```

---

## 🛡️ **隐私保护**

- ✅ 所有数据存储在客户端
- ✅ 不上传到服务器
- ✅ 不收集用户隐私
- ✅ 用户可手动清空历史

---

## 🎉 **功能示例**

### **错误上报**
```javascript
// 自动捕获
throw new Error('测试错误')

// 手动上报
import { captureError } from '@miaoma/monitor-sdk-uniapp'
captureError(new Error('自定义错误'))
```

### **性能上报**
```javascript
// 自动捕获（无需手动）
// 首屏、路由、接口都会自动监控

// 手动上报
import { captureMessage } from '@miaoma/monitor-sdk-uniapp'
captureMessage('用户点击了按钮')
```

---

## ✅ **测试清单**

- [ ] 1. 打开 App，查看控制台是否输出 `[Monitor] 初始化完成`
- [ ] 2. 在微信开发者工具中，检查 localStorage
- [ ] 3. 在首页查看监控面板是否显示
- [ ] 4. 手动抛出错误，查看监控面板是否记录
- [ ] 5. 刷新页面，查看历史记录是否保留

---

**纯前端监控 SDK 接入完成！🎉**

不需要后端服务器，所有数据本地存储，前端可视化展示！
