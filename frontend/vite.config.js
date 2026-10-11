import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Khi dev, mọi request /api/... được chuyển tiếp sang backend (Spring Boot, cổng 8080).
    // Trình duyệt chỉ thấy cùng một origin (localhost:5173) nên không cần CORS.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
