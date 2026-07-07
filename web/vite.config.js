import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// В dev (`npm run dev`) фронт на Vite, а API — на бэкенде (нужно запустить `cd server && npm start`).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3001' } },
})
