<template>
	<view class="skeleton" :class="{ 'skeleton-loading': loading }" :style="rootStyle">
		<!-- 通用骨架屏加载动画 -->
		<view v-if="loading && type === 'default'" class="skeleton-wrapper">
			<view v-for="(item, index) in rows" :key="index" class="skeleton-row"
				:style="getSkeletonStyle(item)">
				<view class="skeleton-shimmer"></view>
			</view>
		</view>

		<!-- 列表骨架屏 -->
		<view v-if="loading && type === 'list'" class="skeleton-list">
			<view v-for="(item, index) in listcount" :key="index" class="skeleton-list-item">
				<view class="skeleton-avatar skeleton-shimmer"></view>
				<view class="skeleton-content">
					<view class="skeleton-title skeleton-shimmer"></view>
					<view class="skeleton-desc skeleton-shimmer"></view>
				</view>
			</view>
		</view>

		<!-- 商品卡片骨架屏 -->
		<view v-if="loading && type === 'product'" class="skeleton-product">
			<view class="skeleton-product-img skeleton-shimmer"></view>
			<view class="skeleton-product-info">
				<view class="skeleton-product-title skeleton-shimmer"></view>
				<view class="skeleton-product-price skeleton-shimmer"></view>
			</view>
		</view>

		<!-- 占位内容 -->
		<template v-else>
			<slot></slot>
		</template>
	</view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
	/**
	 * 骨架屏类型
	 * - default: 通用骨架屏
	 * - list: 列表骨架屏
	 * - product: 商品卡片骨架屏
	 */
	type?: 'default' | 'list' | 'product'
	/**
	 * 是否加载中
	 */
	loading?: boolean
	/**
	 * 行数（type='default' 时生效）
	 */
	rows?: number
	/**
	 * 骨架屏高度
	 */
	height?: string | number
	/**
	 * 骨架屏宽度
	 */
	width?: string | number
	/**
	 * 背景色
	 */
	bgColor?: string
	/**
	 * 加载动画颜色
	 */
	shimmerColor?: string
}

const props = withDefaults(defineProps<Props>(), {
	type: 'default',
	loading: true,
	rows: 3,
	height: 'auto',
	width: '100%',
	bgColor: '#f0f0f0',
	shimmerColor: '#e0e0e0',
})

const rootStyle = computed(() => ({
	height: props.height,
	width: props.width,
	backgroundColor: props.bgColor,
}))
</script>

<script lang="ts">
export default {
	name: 'USkeleton',
}
</script>

<style scoped lang="scss">
.skeleton {
	position: relative;
	overflow: hidden;
	box-sizing: border-box;

	/* 加载动画 */
	.skeleton-shimmer {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			90deg,
			transparent,
			v-bind(shimmerColor),
			transparent
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	/* 通用骨架屏 */
	.skeleton-wrapper {
		padding: 20rpx;

		.skeleton-row {
			position: relative;
			margin-bottom: 20rpx;
			overflow: hidden;
			border-radius: 8rpx;

			&:last-child {
				margin-bottom: 0;
			}
		}
	}

	/* 列表骨架屏 */
	.skeleton-list {
		.skeleton-list-item {
			display: flex;
			align-items: center;
			padding: 20rpx;

			.skeleton-avatar {
				width: 100rpx;
				height: 100rpx;
				border-radius: 50%;
				margin-right: 20rpx;
				min-width: 100rpx;
			}

			.skeleton-content {
				flex: 1;

				.skeleton-title {
					height: 32rpx;
					width: 60%;
					margin-bottom: 16rpx;
				}

				.skeleton-desc {
					height: 24rpx;
					width: 40%;
				}
			}
		}

		.skeleton-list-item:last-child {
			margin-bottom: 0;
		}
	}

	/* 商品卡片骨架屏 */
	.skeleton-product {
		display: flex;
		padding: 20rpx;

		.skeleton-product-img {
			width: 200rpx;
			height: 200rpx;
			margin-right: 20rpx;
			border-radius: 12rpx;
		}

		.skeleton-product-info {
			flex: 1;

			.skeleton-product-title {
				height: 36rpx;
				width: 80%;
				margin-bottom: 16rpx;
			}

			.skeleton-product-price {
				height: 40rpx;
				width: 40%;
			}
		}
	}
}

/* 动画 */
@keyframes shimmer {
	0% {
		background-position: 100% 0;
	}

	100% {
		background-position: -100% 0;
	}
}
</style>
