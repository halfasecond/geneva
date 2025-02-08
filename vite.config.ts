import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { gameServer } from './src/server/vite-plugin-game-server'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [
    react(),
    // Only include game server in development
    command === 'serve' ? gameServer() : null
  ].filter(Boolean),
  server: {
    host: true,
    port: 3131,
  },
  resolve: {
    alias: {
      src: "/src",
      contracts: "/src/contracts",
      components: "/src/components",
      pages: "/src/pages",
      style: "/src/style",
      utils: "/src/utils"
    },
  },
  // Set base URL based on deployment mode
  base: process.env.VITE_SERVERLESS === 'true' ? '/paddock/' : '/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Optimize dependencies
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'socket.io-client'],
          style: ['styled-components']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['socket.io-client']
  },
  // Environment variable handling
  envPrefix: 'VITE_',
  // Define any fallback values for required env vars
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    // Make environment variables available at build time
    'process.env.VITE_SERVERLESS': JSON.stringify(process.env.VITE_SERVERLESS)
  }
}))
