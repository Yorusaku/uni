<script setup lang="ts">
import { initFrontend } from '@/utils/monitor'

// 初始化监控 SDK（纯前端版本）
const { monitoring, errors, metrics } = initFrontend({
  enabled: true,
  maxHistorySize: 100,
})

console.log('[Monitor] 监控 SDK 初始化完成 ✅')
console.log('[Monitor] 模式: 纯前端（无需后端）')
</script>

<script lang="ts">
export default {
	onLaunch: function() {
		console.log('App Launch')
	},
	onShow: function() {
		console.log('App Show')
	},
	onHide: function() {
		console.log('App Hide')
	},
}
</script>
