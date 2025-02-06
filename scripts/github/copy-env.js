import { copyFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '../..');

// Create dist directory if it doesn't exist
const distDir = resolve(__dirname, 'dist');
try {
  mkdirSync(distDir, { recursive: true });
} catch (error) {
  if (error.code !== 'EEXIST') {
    console.error('❌ Error creating dist directory:', error.message);
    process.exit(1);
  }
}

// Copy .env to dist directory
const sourceEnv = resolve(rootDir, '.env');
const targetEnv = resolve(distDir, '.env');

try {
  copyFileSync(sourceEnv, targetEnv);
  console.log('✨ Copied .env to dist directory');
} catch (error) {
  console.error('❌ Error copying .env:', error.message);
  process.exit(1);
}