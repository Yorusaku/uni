# 🟦 Phase 4 - 业务深度扩展（用户/服务/订单系统）- 交互与技术设计提案

>**项目**：溜溜爪（liuliuzhua）- 宠物服务 O2O 小程序  
>**阶段**：Phase 4 - 业务深度扩展  
>**版本**：V1.0  
>**日期**：2026-03-03  
>**执笔人**：高级前端架构师  

---

## 一、业务需求拆解

### 1.1 用户系统（User System）

| 功能 | 说明 |
|-----|------|
| **注册** | 手机号 + 验证码注册 |
| **登录** | 手机号密码登录 / 微信一键登录 |
| **找回密码** | 手机验证码修改密码 |
| **个人信息** | 查看/编辑资料（昵称、头像、联系方式） |
| **用户中心** | 订单历史、收藏、优惠券入口 |

### 1.2 服务系统（Service System）

| 功能 | 说明 |
|-----|------|
| **服务列表** | 搜索/分类/排序 |
| **服务详情** | 图文介绍、价格、评价、预约入口 |
| **在线客服** | 即时联繫客服 |
| **评价系统** | 发布评价、查看评价 |
| **收藏功能** | 收藏服务、 cancelled 标记 |

### 1.3 订单系统（Order System）

| 功能 | 说明 |
|-----|------|
| **下单** | 选择服务 + 时间 + 数量 + 付款 |
| **支付** | 微信支付集成 |
| **订单列表** | 等待确认/处理中/已完成/已取消 |
| **订单详情** | 订单状态实时更新、物流追踪 |
| **售后** | 申请退款、投诉 |

### 1.4 购物车 & 优惠系统

| 功能 | 说明 |
|-----|------|
| **购物车** | 添加/删除商品、数量调整 |
| **优惠券** | 优惠券领取、使用、失效提醒 |
| **满减活动** | 满减门槛、自动叠加 |

---

## 二、文件结构设计

### 2.1 目录结构

```
utils/
├── http/
│   ├── request-queue/          ← 已完成 ✅
│   ├── locks/                  ← 已完成 ✅
│   ├── interceptors/           ← 已完成 ✅
│   └── api/                    ← 已完成 ✅
│       ├── index.ts
│       ├── auth.ts
│       ├── services.ts
│       └── order.ts
├── store/                      ← 🆕 新增：Pinia Stores
│   ├── index.ts
│   ├── user.ts                 ← 用户状态（登录/个人信息）
│   ├── cart.ts                 ← 购物车状态
│   ├── favorite.ts             ← 收藏状态
│   └── order.ts                ← 订单状态
├── composables/                ← 已完成 ✅
│   ├── useRequest.ts
│   ├── useStorage.ts
│   ├── useDebounce.ts
│   └── useThrottle.ts
└── utils/                      ← 已完成 ✅
    ├── index.ts
    ├── clone.ts
    ├── format.ts
    └── validation.ts

stores/                         ← 🆕 新增：全局状态管理
├── user.ts
├── cart.ts
├── favorite.ts
└── order.ts

composables/                    ← 🆕 新增：组合式函数
├── useUser.ts                  ← 用户相关
├── useCart.ts                  ← 购物车相关
├── useFavorite.ts              ← 收藏相关
├── useOrder.ts                 ← 订单相关
└── useAuth.ts                  ← 认证相关
```

---

## 三、核心功能实现

### 3.1 用户系统（User System）

#### 3.1.1 `utils/store/user.ts`（Pinia Store）

```typescript
import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import { useStorage } from '@/utils/composables/useStorage'

/**
 * 🟢 用户信息 Interface（零 any）
 */
export interface UserInfo {
  id: number
  nickname: string
  avatar: string
  phone: string
  role: 'user' | 'admin'
  createdAt: string
}

/**
 * 🟢 用户 Store
 */
export const useUserStore = defineStore('user', () => {
  // ✅ 使用浅拷贝避免深层 Proxy（性能优化）
  const userInfo = shallowRef<UserInfo | null>(null)
  
  // ✅ 本地存储（持久化）
  const token = useStorage<string | null>('token', null)
  const isLogin = computed(() => !!token.value && !!userInfo.value)

  /**
   * 🟢 登录
   */
  async function login(payload: { phone: string; code: string }) {
    // 实现登录逻辑
  }

  /**
   * 🟢 注册
   */
  async function register(payload: { phone: string; code: string; password: string }) {
    // 实现注册逻辑
  }

  /**
   * 🟢 获取用户信息
   */
  async function fetchUserInfo() {
    // 实现获取用户信息逻辑
  }

  /**
   * 🟢 更新用户信息
   */
  async function updateUserInfo(payload: Partial<UserInfo>) {
    // 实现更新用户信息逻辑
  }

  /**
   * 🟢 登出
   */
  function logout() {
    token.value = null
    userInfo.value = null
    uni.removeStorageSync('token')
  }

  return {
    userInfo,
    token,
    isLogin,
    login,
    register,
    fetchUserInfo,
    updateUserInfo,
    logout,
  }
})
```

#### 3.1.2 `composables/useUser.ts`

```typescript
import { useUserStore } from '@/stores/user'

/**
 * 🟢 用户组合式函数
 */
export function useUser() {
  const store = useUserStore()

  /**
   * 🟢 是否登录
   */
  const isLoggedIn = computed(() => store.isLogin)

  /**
   * 🟢 用户信息
   */
  const user = computed(() => store.userInfo)

  /**
   * 🟢 登录
   */
  async function handleLogin(payload: { phone: string; code: string }) {
    await store.login(payload)
  }

  /**
   * 🟢 注册
   */
  async function handleRegister(payload: { phone: string; code: string; password: string }) {
    await store.register(payload)
  }

  /**
   * 🟢 登出
   */
  async function handleLogout() {
    await store.logout()
  }

  return {
    isLoggedIn,
    user,
    handleLogin,
    handleRegister,
    handleLogout,
  }
}
```

---

### 3.2 购物车系统（Cart System）

#### 3.2.1 `utils/store/cart.ts`

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { deepClone } from '@/utils/utils'

/**
 * 🟢 购物车项 Interface
 */
export interface CartItem {
  id: number
  serviceId: number
  serviceName: string
  servicePrice: number
  serviceImage: string
  quantity: number
  createdAt: string
}

/**
 * 🟢 购物车 Store
 */
export const useCartStore = defineStore('cart', () => {
  // ✅ 使用 shallowRef（性能优化）
  const items = shallowRef<CartItem[]>([])

  /**
   * 🟢 购物车总数
   */
  const totalCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))

  /**
   * 🟢 购物车总价
   */
  const totalPrice = computed(() => items.value.reduce((sum, item) => sum + item.servicePrice * item.quantity, 0))

  /**
   * 🟢 添加购物车（防重复）
   */
  function addToCart(item: Omit<CartItem, 'id' | 'createdAt'>) {
    const existed = items.value.find(i => i.serviceId === item.serviceId)
    if (existed) {
      existed.quantity += item.quantity
    } else {
      items.value.push({
        ...item,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      })
    }
  }

  /**
   * 🟢 更新购物车数量
   */
  function updateQuantity(serviceId: number, quantity: number) {
    const item = items.value.find(i => i.serviceId === serviceId)
    if (item) {
      item.quantity = Math.max(1, quantity)
    }
  }

  /**
   * 🟢 删除购物车项
   */
  function removeFromCart(serviceId: number) {
    items.value = items.value.filter(i => i.serviceId !== serviceId)
  }

  /**
   * 🟢 清空购物车
   */
  function clearCart() {
    items.value = []
  }

  /**
   * 🟢 结算（获取购物车项列表）
   */
  function getCheckoutItems(): CartItem[] {
    return deepClone(items.value)
  }

  return {
    items,
    totalCount,
    totalPrice,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCheckoutItems,
  }
})
```

---

### 3.3 收藏系统（Favorite System）

#### 3.3.1 `utils/store/favorite.ts`

```typescript
import { defineStore } from 'pinia'
import { shallowRef } from 'vue'

/**
 * 🟢 收藏项 Interface
 */
export interface FavoriteItem {
  id: number
  serviceId: number
  serviceName: string
  servicePrice: number
  serviceImage: string
  createdAt: string
}

/**
 * 🟢 收藏 Store
 */
export const useFavoriteStore = defineStore('favorite', () => {
  const items = shallowRef<FavoriteItem[]>([])

  /**
   * 🟢 是否已收藏
   */
  function isFavorited(serviceId: number): boolean {
    return items.value.some(item => item.serviceId === serviceId)
  }

  /**
   * 🟢 添加收藏
   */
  function addToFavorite(item: Omit<FavoriteItem, 'id' | 'createdAt'>) {
    if (isFavorited(item.serviceId)) return

    items.value.push({
      ...item,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    })
  }

  /**
   * 🟢 取消收藏
   */
  function removeFromFavorite(serviceId: number) {
    items.value = items.value.filter(item => item.serviceId !== serviceId)
  }

  /**
   * 🟢 切换收藏状态
   */
  function toggleFavorite(item: Omit<FavoriteItem, 'id' | 'createdAt'>) {
    if (isFavorited(item.serviceId)) {
      removeFromFavorite(item.serviceId)
    } else {
      addToFavorite(item)
    }
  }

  return {
    items,
    isFavorited,
    addToFavorite,
    removeFromFavorite,
    toggleFavorite,
  }
})
```

---

### 3.4 订单系统（Order System）

#### 3.4.1 `utils/store/order.ts`

```typescript
import { defineStore } from 'pinia'
import { shallowRef, ref } from 'vue'
import { OrderStatus } from '../utils/http/api/order'

/**
 * 🟢 订单 Store
 */
export const useOrderStore = defineStore('order', () => {
  const orders = shallowRef<Order[]>([])

  /**
   * 🟢 获取订单列表
   */
  async function fetchOrders(page = 1, pageSize = 10) {
    // 实现获取订单列表逻辑
  }

  /**
   * 🟢 获取订单详情
   */
  async function fetchOrderDetail(id: number) {
    // 实现获取订单详情逻辑
  }

  /**
   * 🟢 取消订单
   */
  async function cancelOrder(id: number) {
    // 实现取消订单逻辑
  }

  /**
   * 🟢 确认收货
   */
  async function confirmReceipt(id: number) {
    // 实现确认收货逻辑
  }

  /**
   * 🟢 申请售后
   */
  async function applyAfterSale(id: number, reason: string) {
    // 实现申请售后逻辑
  }

  return {
    orders,
    fetchOrders,
    fetchOrderDetail,
    cancelOrder,
    confirmReceipt,
    applyAfterSale,
  }
})
```

---

## 四、UI 组件集成（Wot Design Uni）

### 4.1 用户中心页面

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import { WotToast } from 'wot-design-uni'

const store = useUserStore()

// ✅ 显示用户信息
const handleLogout = async () => {
  try {
    await store.logout()
    WotToast.success('已登出')
  } catch (error) {
    WotToast.fail('登出失败')
  }
}
</script>

<template>
  <!-- ✅ Wot Design Uni 组件 -->
  <wot-cell-group title="用户信息">
    <wot-cell title="昵称" :value="store.user?.nickname" />
    <wot-cell title="手机号" :value="store.user?.phone" />
  </wot-cell-group>

  <!-- ✅ 按钮组件 -->
  <wot-button type="danger" @click="handleLogout" v-if="store.isLoggedIn">
    退出登录
  </wot-button>
</template>
```

### 4.2 购物车页面

```vue
<script setup lang="ts">
import { useCartStore } from '@/stores/cart'

const store = useCartStore()

// ✅ 更新数量（使用防抖）
const handleUpdateQuantity = useDebounceFn((serviceId: number, quantity: number) => {
  store.updateQuantity(serviceId, quantity)
}, 300)

// ✅ 删除购物车项
const handleRemove = (serviceId: number) => {
  store.removeFromCart(serviceId)
}
</script>

<template>
  <!-- ✅ 列表组件 -->
  <wot-list v-model="loading" @load="loadMore">
    <wot-cell
      v-for="item in store.items"
      :key="item.serviceId"
      :title="item.serviceName"
      :value="formatPrice(item.servicePrice)"
    >
      <!-- ✅ 数量控制器 -->
      <wot-number-box
        :value="item.quantity"
        @change="handleUpdateQuantity(item.serviceId, $event)"
      />
    </wot-cell>
  </wot-list>
</template>
```

---

## 五、组合式函数封装

### 5.1 `composables/useAuth.ts`

```typescript
import { useUserStore } from '@/stores/user'
import { useStorage } from '@/utils/composables/useStorage'

/**
 * 🟢 认证组合式函数
 */
export function useAuth() {
  const store = useUserStore()
  const token = useStorage('token', null)

  /**
   * 🟢 是否已登录
   */
  const isAuthenticated = computed(() => !!token.value)

  /**
   * 🟢 登录
   */
  async function login(phone: string, code: string) {
    await store.login({ phone, code })
    return true
  }

  /**
   * 🟢 登出
   */
  async function logout() {
    await store.logout()
    return true
  }

  return {
    isAuthenticated,
    login,
    logout,
  }
}
```

### 5.2 `composables/useCartOperations.ts`

```typescript
import { useCartStore } from '@/stores/cart'
import { useDebounceFn } from '@vueuse/core'

/**
 * 🟢 购物车操作组合式函数
 */
export function useCartOperations() {
  const store = useCartStore()

  // ✅ 防抖的更新数量函数
  const updateQuantity = useDebounceFn((serviceId: number, quantity: number) => {
    store.updateQuantity(serviceId, quantity)
  }, 300)

  // ✅ 添加购物车（带成功提示）
  const addToCart = async (item: any) => {
    store.addToCart(item)
    uni.showToast({ title: '已加入购物车', icon: 'success' })
  }

  // ✅ 删除购物车项（带二次确认）
  const removeFromCart = async (serviceId: number) => {
    uni.showModal({
      title: '提示',
      content: '确定要从购物车中移除该商品吗？',
      success: (res) => {
        if (res.confirm) {
          store.removeFromCart(serviceId)
        }
      },
    })
  }

  return {
    cart: store,
    updateQuantity,
    addToCart,
    removeFromCart,
  }
}
```

---

## 六、防御性交互设计

### 6.1 用户系统

| 场景 | 防御措施 |
|-----|---------|
| **注册时验证码错误** | Toast 提示 "验证码错误" + 输入框高亮 |
| **登录失败** | Toast 提示 "手机号或密码错误" + 重试按钮 |
| **个人信息为空** | 显示Placeholder + 编辑入口 |

### 6.2 购物车系统

| 场景 | 防御措施 |
|-----|---------|
| **购物车为空** | 显示Empty状态 + 推荐服务 |
| **数量超过库存** | Toast 提示 "库存不足" + 自动改为最大值 |
| **恶意修改数量** | 服务端校验 + 前端防抖 |

### 6.3 订单系统

| 场景 | 防御措施 |
|-----|---------|
| **支付取消** | 订单状态保持"待支付" + 二次支付入口 |
| **订单超时** | 自动取消订单 + 提示 "订单已取消" |
| **售后申请** | 必填原因 + 上传凭证入口 |

---

## 七、技术实现亮点

| 亮点 | 说明 |
|-----|------|
| ✅ **shallowRef 性能优化** | 用户/购物车/收藏等大对象使用浅拷贝 |
| ✅ **持久化存储** | Token 使用 `useStorage` 持久化 |
| ✅ **防抖节流** | 购物车数量更新使用 `useDebounceFn` |
| ✅ **组合式函数** | `useAuth`、`useCartOperations` 高内聚 |
| ✅ **Wot Design Uni** | 精致 UI 组件提升商业感 |

---

## 📋 总结

| 项目 | 产出 |
|-----|------|
| **Pinia Stores** | 4 个（user/cart/favorite/order） |
| **组合式函数** | 5 个（useUser/useCart/useFavorite/useOrder/useAuth） |
| **UI 组件集成** | Wot Design Uni 案例 |
| **防御性交互** | 9 个场景 |

---

**请审批：是否同意该业务深度扩展方案？**

- ✅ **同意**：我将开始编写 Red 阶段测试（测试先行）
- ❌ **异议**：请指出需要调整的地方

**🛑 当前阶段：🔵 蓝灯阶段（Design & Alignment）**  
**🛑 等待您的明确授权指令**
