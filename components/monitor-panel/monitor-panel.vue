<template>
	<view class="monitor-panel" v-if="showPanel">
		<!-- 头部 -->
		<view class="panel-header">
			<text class="panel-title">📊 性能监控面板</text>
			<view class="panel-actions">
				<up-icon name="close" size="24" color="#999" @click="closePanel"></up-icon>
			</view>
		</view>

		<!-- 标签页 -->
		<view class="panel-tabs">
			<view
				class="tab-item"
				:class="{ active: activeTab === 'errors' }"
				@click="activeTab = 'errors'"
			>
				<text class="tab-text">🔴 错误</text>
				<text class="tab-count" v-if="errorCount > 0">{{ errorCount }}</text>
			</view>
			<view
				class="tab-item"
				:class="{ active: activeTab === 'performance' }"
				@click="activeTab = 'performance'"
			>
				<text class="tab-text">⚡ 性能</text>
			</view>
		</view>

		<!-- 内容区域 -->
		<scroll-view class="panel-content" scroll-y>
			<!-- 错误列表 -->
			<view v-if="activeTab === 'errors'" class="error-list">
				<view v-if="errors.length === 0" class="empty-state">
					<up-icon name="checkmark-circle" size="60" color="#999"></up-icon>
					<text class="empty-text">暂无错误记录</text>
				</view>

				<view v-for="(error, index) in errors" :key="index" class="error-item">
					<view class="error-header">
						<view class="error-type" :class="error.typeClass">
							{{ error.typeName }}
						</view>
						<text class="error-time">{{ formatTime(error.timestamp) }}</text>
					</view>
					<text class="error-message">{{ error.message }}</text>
					<view v-if="error.stack" class="error-stack" @click="toggleStack(index)">
						<up-icon
							:name="error.showStack ? 'arrow-up' : 'arrow-down'"
							size="16"
							color="#666"
						></up-icon>
						<text class="stack-text">查看堆栈</text>
					</view>
					<view v-if="error.showStack" class="stack-content">
						<text class="stack-text">{{ error.stack }}</text>
					</view>
				</view>
			</view>

			<!-- 性能列表 -->
			<view v-if="activeTab === 'performance'" class="performance-list">
				<view v-if="performanceMetrics.length === 0" class="empty-state">
					<up-icon name="chart-bar" size="60" color="#999"></up-icon>
					<text class="empty-text">暂无性能数据</text>
				</view>

				<!-- 首屏渲染时间 -->
				<view class="metric-item">
					<view class="metric-label">🎯 首屏渲染时间</view>
					<view class="metric-value" :class="getPerformanceClass(getFirstScreenTime())">
						{{ getFirstScreenTime() || '-' }}ms
					</view>
					<text class="metric-desc">onLoad ~ onReady</text>
				</view>

				<!-- 路由跳转时间 -->
				<view class="metric-item">
					<view class="metric-label">🔄 路由跳转时间</view>
					<view
						class="metric-value"
						:class="getPerformanceClass(getRouteSwitchTime())"
					>
						{{ getRouteSwitchTime() || '-' }}ms
					</view>
					<text class="metric-desc">navigateTo ~ onLoad</text>
				</view>

				<!-- 接口响应时间 -->
				<view class="metric-item">
					<view class="metric-label">🌐 接口响应时间</view>
					<view class="metric-value">{{ getApiResponseTime() || '-' }}ms</view>
					<text class="metric-desc">请求耗时统计</text>
				</view>

				<!-- 历史记录 -->
				<view class="history-item" v-for="(metric, index) in performanceMetrics" :key="index">
					<view class="metric-name">{{ metric.name }}</view>
					<view class="metric-value">{{ metric.value }}ms</view>
				</view>
			</view>
		</scroll-view>

		<!-- 底部操作 -->
		<view class="panel-footer">
			<button class="btn-reset" @click="clearHistory">清空历史</button>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface ErrorItem {
	typeName: string
	typeClass: string
	message: string
	stack?: string
	showStack: boolean
	timestamp: number
}

interface PerformanceMetric {
	name: string
	value: number
}

const showPanel = ref(true)
const activeTab = ref<'errors' | 'performance'>('errors')
const errors = ref<ErrorItem[]>([])
const performanceMetrics = ref<PerformanceMetric[]>([])

// 从 localStorage 获取历史数据
const getHistory = (): { errorList: ErrorItem[]; performanceMetrics: PerformanceMetric[] } => {
	try {
		const data = localStorage.getItem('monitoring_history')
		if (data) {
			const history = JSON.parse(data)
			const errorList: ErrorItem[] = []
			const performance: PerformanceMetric[] = []

			history.forEach((item: any) => {
				if (item.event_type === 'error') {
					errorList.push({
						typeName: item.type === 'console_error' ? 'Console' : item.type,
						typeClass: item.type === 'console_error' ? 'type-console' : 'type-error',
						message: item.message,
						stack: item.stack,
						showStack: false,
						timestamp: item.timestamp || Date.now(),
					})
				} else if (item.event_type === 'performance') {
					performance.push({
						name: item.name,
						value: item.value || 0,
					})
				}
			})

			return { errorList, performanceMetrics: performance }
		}
	} catch (error) {
		console.error('[Monitor] 读取历史记录失败:', error)
	}

	return { errorList: [], performanceMetrics: [] }
}

const { errorList, performanceMetrics: perfMetrics } = getHistory()

onMounted(() => {
	errors.value = errorList
	performanceMetrics.value = perfMetrics
})

// 计算属性
const errorCount = computed(() => errors.value.length)

// 方法
const closePanel = () => {
	showPanel.value = false
}

const toggleStack = (index: number) => {
	errors.value[index].showStack = !errors.value[index].showStack
}

const clearHistory = () => {
	localStorage.removeItem('monitoring_history')
	errors.value = []
	performanceMetrics.value = []
	uni.showToast({
		title: '历史记录已清空',
		icon: 'success',
		duration: 1500,
	})
}

const formatTime = (timestamp: number): string => {
	const date = new Date(timestamp)
	const hours = String(date.getHours()).padStart(2, '0')
	const minutes = String(date.getMinutes()).padStart(2, '0')
	const seconds = String(date.getSeconds()).padStart(2, '0')
	return `${hours}:${minutes}:${seconds}`
}

const getPerformanceClass = (value?: number): string => {
	if (!value) return ''
	if (value < 2000) return 'perf-good'
	if (value < 4000) return 'perf-warning'
	return 'perf-bad'
}

const getFirstScreenTime = (): number | null => {
	const firstScreen = performanceMetrics.value.find(m => m.name === 'first-screen')
	return firstScreen?.value || null
}

const getRouteSwitchTime = (): number | null => {
	const routeSwitch = performanceMetrics.value.find(m => m.name === 'route-switch')
	return routeSwitch?.value || null
}

const getApiResponseTime = (): number | null => {
	const apiResponse = performanceMetrics.value.find(m => m.name === 'api-response')
	return apiResponse?.value || null
}
</script>

<style scoped lang="scss">
.monitor-panel {
	position: fixed;
	bottom: 0;
	right: 20rpx;
	width: 600rpx;
	max-height: 70vh;
	background: #fff;
	border-radius: 16rpx;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
	z-index: 9999;
	display: flex;
	flex-direction: column;
	overflow: hidden;

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx;
		border-bottom: 1rpx solid #f0f0f0;

		.panel-title {
			font-size: 32rpx;
			font-weight: bold;
			color: #333;
		}

		.panel-actions {
			display: flex;
			gap: 20rpx;
		}
	}

	.panel-tabs {
		display: flex;
		border-bottom: 1rpx solid #f0f0f0;

		.tab-item {
			flex: 1;
			padding: 20rpx;
			text-align: center;
			cursor: pointer;
			position: relative;

			.tab-text {
				font-size: 28rpx;
				color: #666;
			}

			.tab-count {
				position: absolute;
				top: 10rpx;
				right: 10rpx;
				background: #ff6b81;
				color: #fff;
				font-size: 20rpx;
				padding: 4rpx 10rpx;
				border-radius: 10rpx;
			}

			&.active {
				.tab-text {
					color: #333;
					font-weight: bold;
				}

				&::after {
					content: '';
					position: absolute;
					bottom: 0;
					left: 50%;
					transform: translateX(-50%);
					width: 40rpx;
					height: 6rpx;
					background: #ffce2c;
					border-radius: 3rpx;
				}
			}
		}
	}

	.panel-content {
		flex: 1;
		overflow: hidden;

		.empty-state {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 100rpx 0;

			.empty-text {
				font-size: 28rpx;
				color: #999;
				margin-top: 20rpx;
			}
		}
	}

	.error-list,
	.performance-list {
		padding: 20rpx;

		.error-item {
			background: #fff5f5;
			border-left: 4rpx solid #ff6b81;
			padding: 20rpx;
			margin-bottom: 20rpx;
			border-radius: 8rpx;

			.error-header {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 10rpx;

				.error-type {
					padding: 4rpx 12rpx;
					border-radius: 4rpx;
					font-size: 20rpx;
					color: #fff;

					&.type-console {
						background: #666;
					}

					&.type-error {
						background: #ff6b81;
					}
				}

				.error-time {
					font-size: 24rpx;
					color: #999;
				}
			}

			.error-message {
				font-size: 26rpx;
				color: #333;
				word-break: break-all;
				margin-bottom: 10rpx;
			}

			.error-stack {
				display: flex;
				align-items: center;
				font-size: 24rpx;
				color: #666;
				cursor: pointer;

				.stack-text {
					margin-left: 8rpx;
				}
			}

			.stack-content {
				font-size: 22rpx;
				color: #999;
				margin-top: 10rpx;
				padding: 10rpx;
				background: #f8f8f8;
				border-radius: 8rpx;
				word-break: break-all;
			}
		}

		.metric-item {
			padding: 20rpx;
			margin-bottom: 20rpx;
			background: #f8f9fa;
			border-radius: 12rpx;

			.metric-label {
				font-size: 28rpx;
				color: #666;
				margin-bottom: 8rpx;
			}

			.metric-value {
				font-size: 36rpx;
				font-weight: bold;
				color: #333;

				&.perf-good {
					color: #19be6b;
				}

				&.perf-warning {
					color: #ff9900;
				}

				&.perf-bad {
					color: #ff6b81;
				}
			}

			.metric-desc {
				font-size: 24rpx;
				color: #999;
			_margin-top: 4rpx;
			}
		}

		.history-item {
			display: flex;
			justify-content: space-between;
			padding: 16rpx;
			margin-bottom: 12rpx;
			background: #fff;
			border-radius: 8rpx;
			border: 1rpx solid #f0f0f0;

			.metric-name {
				font-size: 26rpx;
				color: #666;
			}

			.metric-value {
				font-size: 28rpx;
				color: #333;
				font-weight: bold;
			}
		}
	}
}

.panel-footer {
	display: flex;
	justify-content: center;
	padding: 20rpx;
	border-top: 1rpx solid #f0f0f0;

	.btn-reset {
		padding: 16rpx 40rpx;
		background: #ff6b81;
		color: #fff;
		font-size: 28rpx;
		border-radius: 20rpx;
	}
}
</style>
