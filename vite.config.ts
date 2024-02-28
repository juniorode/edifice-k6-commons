// vite.config.ts
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'edifice-k6-commons',
      fileName: 'index',
    },
    rollupOptions: {
        external: [
            "k6",
            "k6/http"
        ]
    }
  },
})