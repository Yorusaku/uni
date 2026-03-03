import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';
import UnoCSS from 'unocss/vite';
import autoImport from 'unplugin-auto-import/vite';
import components from 'unplugin-vue-components/vite';

export default defineConfig({
  plugins: [
    uni(),
    // ✅ UnoCSS 插件
    UnoCSS(),
    // ✅ 自动导入
    autoImport({
      imports: [
        'vue',
        'vue-router',
        'pinia',
        {
          '@vueuse/core': [
            'useDebounceFn',
            'useThrottleFn',
            'useStorage',
            'useToggle',
          ],
          'lodash-es': [
            'debounce',
            'throttle',
            'cloneDeep',
            'get',
            'set',
          ],
        },
      ],
    }),
    // ✅ 自动导入组件
    components({
      dts: true,
    }),
  ],
  resolve: {
    alias: {
      '@': require('path').resolve(__dirname),
    },
  },
});
