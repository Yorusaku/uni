import { defineConfig } from 'unocss';
import presetWeapp from 'unocss-preset-weapp';

export default defineConfig({
  /**
   * ✅ 小程序预设：支持微信小程序、支付宝小程序等
   */
  presets: [
    presetWeapp({
      framework: 'uni-app',
      // ✅ 启用 preflight（基础样式重置）
      preflight: true,
      // ✅ 支持 wxs
      enableWxs: true,
    }),
  ],

  /**
   * ✅ 自定义快捷方式（Shorthand）
   */
  shortcuts: [
    // 按钮样式
    ['btn', 'px-4 py-2 rounded text-sm'],
    ['btn-primary', 'bg-blue-500 text-white hover:bg-blue-600'],
    ['btn-secondary', 'bg-gray-500 text-white hover:bg-gray-600'],
    ['btn-success', 'bg-green-500 text-white hover:bg-green-600'],
    ['btn-danger', 'bg-red-500 text-white hover:bg-red-600'],

    // 卡片样式
    ['card', 'bg-white p-4 rounded shadow-sm'],
    ['card-header', 'text-lg font-bold mb-2'],
    ['card-body', 'text-gray-600'],

    // 布局
    ['flex-center', 'flex justify-center items-center'],
    ['flex-between', 'flex justify-between items-center'],
    ['flex-col', 'flex flex-col'],
    ['flex-row', 'flex flex-row'],
  ],

  /**
   * ✅ 自定义规则（Rules）
   */
  rules: [
    // ✅ border-radius 百分比支持
    [/^rounded-(\d+)$/, ([_, size]) => ({ 'border-radius': `${size}px` })],
  ],

  /**
   * ✅ 主题配置（Theme）
   */
  theme: {
    colors: {
      primary: '#4A90E2',
      secondary: '#6B7280',
      success: '#10B981',
      danger: '#EF4444',
      warning: '#F59E0B',
    },
  },

  /**
   * ✅ 内容扫描配置
   */
  content: {
    pipeline: 'wildcard',
    include: [
      '**/*.vue',
      '**/*.ts',
      '**/*.js',
    ],
    exclude: [
      'node_modules',
      '.git',
      'dist',
    ],
  },

  /**
   * ✅ 构建配置
   */
  generate: {
    outfile: 'unocss.css',
  },
});
