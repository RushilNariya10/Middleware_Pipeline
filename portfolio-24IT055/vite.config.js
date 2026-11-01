import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/tasks': {
        target: 'http://localhost:3000',
        bypass: (req) => {
          // Serve index.html for browser page navigation so React Router handles the route
          if (req.headers.accept && req.headers.accept.includes('html')) {
            return '/index.html'
          }
        }
      }
    }
  }
})
