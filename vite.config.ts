import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Development server configuration
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => {
          // Rewrite /api to the actual PHP API path
          // PHP server is running at port 8000 serving public_html
          return path.replace(/^\/api/, '/api.php')
        }
      }
    }
  },
  // Use relative paths for subdirectory deployment
  base: './',
  build: {
    outDir: 'public_html',
    emptyOutDir: false,
    assetsDir: 'assets',
    // Ensure proper path resolution
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})