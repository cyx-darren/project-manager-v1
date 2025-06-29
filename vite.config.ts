import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: false,
    open: false,
    cors: true,
    hmr: {
      port: 5174
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  clearScreen: false
})
