import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { gameServer } from './src/server/vite-plugin-game-server'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    gameServer()
  ],
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
  base: '/',
  optimizeDeps: {
    include: ['socket.io-client']
  }
})
