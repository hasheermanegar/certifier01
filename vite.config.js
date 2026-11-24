import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://certifypro-backend-4msc.onrender.com',
        changeOrigin: true,
      },
    },
  },
})
