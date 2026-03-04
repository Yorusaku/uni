import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/tracing/errorsIntegration.ts', 'src/tracing/metricsIntegration.ts'],
  outDir: 'build',
  format: ['cjs', 'esm'],
  dts: true,
  shims: true,
  clean: true,
  noExternal: ['@miaoma/monitor-sdk-core', '@miaoma/monitor-sdk-browser-utils'],
})
