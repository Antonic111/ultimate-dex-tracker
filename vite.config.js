import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      ignored: ['**/server/**'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'lucide-icons';
            }
          }
          if (id.includes('/src/data/') || id.includes('\\src\\data\\') || id.endsWith('/src/trainers.json') || id.endsWith('\\src\\trainers.json') || id.endsWith('/src/utils/keyMappings.json') || id.endsWith('\\src\\utils\\keyMappings.json')) {
            return 'data';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
});
