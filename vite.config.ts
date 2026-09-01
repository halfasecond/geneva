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
  'kittyInternational': {
    input: resolve(__dirname, 'index.html'),
    outDir: 'dist/kittyInternational',
    appName: 'kittyInternational'
  },
  'kittyFamily': {
    input: resolve(__dirname, 'index.html'),
    outDir: 'dist/kittyFamily',
    appName: 'kittyFamily'
  },
  'barcode': {
    input: resolve(__dirname, 'index.html'),
    outDir: 'dist/barcode',
    appName: 'barcode'
  },
  'aquarium': {
    input: resolve(__dirname, 'index.html'),
    outDir: 'dist/aquarium',
    appName: 'aquarium'
  },
  'flowbots': {
    input: resolve(__dirname, 'index.html'),
    outDir: 'dist/flowbots',
    appName: 'flowbots'
  },
  'elite': {
    input: resolve(__dirname, 'index.html'),
    outDir: 'dist/elite',
    appName: 'elite'
  },
  'kittyNews': {
    input: resolve(__dirname, 'index.html'),
    outDir: 'dist/kittyNews',
    appName: 'kittyNews'
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
    base: '/',
    plugins: [
      react(),
      // Only include game server in development
      command === 'serve' && appName !== 'kittyNews' && appName !== 'kittyInternational' && appName !== 'kittyFamily' ? gameServer() : null,
      {
        name: 'html-transform',
        transformIndexHtml(html) {
            return html.replace('__APP_TITLE__', 
              process.env.VITE_APP === 'chained-horse'
                ? 'Unchained Paddock - a home for your ChainedHorse NFTs'
                : process.env.VITE_APP === 'purr'
                  ? '$PURR - a new ERC20 by kitty.international'
                  : process.env.VITE_APP === 'kittyInternational'
                    ? 'Kitty.International - Rare Cryptokitties &amp; Siring Emporium'
                    : process.env.VITE_APP === 'kittyFamily'
                      ? 'kitty.family — CryptoKitties ancestry &amp; community'
                      : process.env.VITE_APP === 'barcode'
                      ? 'Barcode - Mandelbrot Decoded in Natural Maths'
                        : process.env.VITE_APP === 'aquarium'
                            ? 'tank.life - digital fish evolved'
                            : process.env.VITE_APP === 'flowbots'
                                ? 'Galactic Flowbots from the futures...'
                                : process.env.VITE_APP === 'elite'
                                  ? 'ELITE — web3 three.js space combat & trade'
                                  : process.env.VITE_APP === 'kittyNews'
                                    ? 'kitty.news'
                                  : 'Geneva Agentic A.I.'
            );
        }
    }
    ].filter(Boolean),
    server: {
      host: true,
      port: appName === 'kittyNews' ? 8001 : appName === 'kittyInternational' ? 2017 : appName === 'kittyFamily' ? 3101 : 3131,
    },
    publicDir: appName === 'kittyNews'
      ? 'public/kittyNews'
      : appName === 'kittyInternational'
        ? 'public/kittyInternational'
        : appName === 'kittyFamily'
          ? 'public/kittyFamily'
          : 'public',
    resolve: {
      alias: {
        src: "/src",
        contracts: "/src/contracts",
        components: "/src/components",
        pages: "/src/pages",
        style: "/src/style",
        utils: "/src/utils",
        kittyNews: "/src/kittyNews",
        kittyInternational: "/src/kittyInternational",
        kittyFamily: "/src/kittyFamily",
        kittyUi: "/src/kittyUi",
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
      include: ['socket.io-client', '@google/model-viewer']
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
