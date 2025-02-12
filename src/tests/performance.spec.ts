import { describe, it, expect } from 'vitest';
import { chromium, Browser, Page } from 'playwright';

declare global {
  interface Window {
    frameCount?: number;
    performance: Performance & {
      memory?: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      };
    };
  }
}

describe('Performance Tests', () => {
  let browser: Browser;
  let page: Page;

  it('should maintain performance during horse movement', async () => {
    // Start browser
    browser = await chromium.launch({
      args: ['--no-sandbox'],
      headless: false
    });

    page = await browser.newPage({
      viewport: { width: 900, height: 600 }
    });

    try {
      // Launch app and wait for it to be ready
      await page.goto('http://localhost:3131');

      // Wait for app to load
      await page.waitForSelector('[data-testid="bridleway-path"]', { timeout: 10000 });

      // Start measuring frames
      await page.evaluate(() => {
        window.frameCount = 0;
        let lastTime = performance.now();
        const countFrame = (time: number) => {
          if (time - lastTime >= 1000) {
            window.frameCount = (window.frameCount || 0) + 1;
            lastTime = time;
          }
          requestAnimationFrame(countFrame);
        };
        requestAnimationFrame(countFrame);
      });

      // Get initial memory
      const initialMemory = await page.evaluate(() => 
        window.performance?.memory?.usedJSHeapSize || 0
      );

      // Function to simulate horse movement
      const moveHorse = async () => {
        const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
        for (const key of keys) {
          await page.keyboard.down(key);
          await page.waitForTimeout(500);
          await page.keyboard.up(key);
          await page.waitForTimeout(100);
        }
      };

      // Perform movement test
      console.log('Starting movement test...');
      const startTime = Date.now();
      
      for (let i = 0; i < 3; i++) {
        await moveHorse();
      }

      // Get final metrics
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      const { frames, finalMemory } = await page.evaluate(() => ({
        frames: window.frameCount || 0,
        finalMemory: window.performance?.memory?.usedJSHeapSize || 0
      }));

      const fps = frames / duration;
      const memoryDiff = (finalMemory - initialMemory) / 1024 / 1024;

      // Output results
      console.log('\nPerformance Results:');
      console.log('-------------------');
      console.log(`Average FPS: ${fps.toFixed(2)}`);
      console.log(`Memory Usage Increase: ${memoryDiff.toFixed(2)}MB`);
      console.log(`Total Frames: ${frames}`);
      console.log(`Test Duration: ${duration.toFixed(2)}s`);

      // Assertions
      expect(fps).toBeGreaterThan(30, 'FPS should be above 30');
      expect(memoryDiff).toBeLessThan(50, 'Memory increase should be less than 50MB');

    } finally {
      await page.close();
      await browser.close();
    }
  }, 30000);
});