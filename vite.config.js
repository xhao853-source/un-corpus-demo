import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: './',  // 相对路径，最稳定，无需自定义域名
  build: {
    outDir: 'dist'
  }
})