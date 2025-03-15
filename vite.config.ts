import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { gameServer } from './src/server/vite-plugin-game-server'
import { resolve } from 'path'

// Define app-specific configurations
const appConfigs = {
  'purr': {
    input: resolve(__dirname, 'index.html'),
    outDir: 'dist/purr',
    appName: 'purr'
  },
  'chained-horse': {
    input: resolve(__dirname, 'index.html'),
    outDir: 'dist/paddock',
    appName: 'chained-horse'
  },
  'default': {
    input: resolve(__dirname, 'index.html'),
    outDir: 'dist/geneva',
    appName: 'default'
  }
};

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Get the app name from environment variable
  const appName = process.env.VITE_APP || 'purr';
  
  // Get the configuration for the current app
  const appConfig = appConfigs[appName] || appConfigs.default;
  
  if (!appConfig) {
    throw new Error(`Invalid app name: ${appName}`);
  }
  
  console.log(`Building app: ${appName}`);
  console.log(`Entry point: ${appConfig.input}`);
  console.log(`Output directory: ${appConfig.outDir}`);
  
  return {
    base: command === 'serve' ? '/' : './',
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
    build: {
      outDir: appConfig.outDir,
      sourcemap: true,
      // Optimize dependencies
      rollupOptions: {
        input: appConfig.input,
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
      'import.meta.env.VITE_APP': JSON.stringify(appConfig.appName)
    }
  };
})
