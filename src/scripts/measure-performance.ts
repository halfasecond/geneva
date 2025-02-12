import { chromium } from 'playwright';

async function measurePerformance() {
  const browser = await chromium.launch({
    args: ['--no-sandbox'],
    headless: false
  });

  const page = await browser.newPage({
    viewport: { width: 900, height: 600 }
  });

  try {
    // Start performance monitoring
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');

    // Launch app and wait for it to be ready
    await page.goto('http://localhost:3131');
    await page.waitForSelector('[data-testid="bridleway-path"]');

    // Collect initial metrics
    const initialMetrics = await client.send('Performance.getMetrics');
    
    // Function to simulate horse movement
    const moveHorse = async () => {
      const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
      for (const key of keys) {
        await page.keyboard.down(key);
        await page.waitForTimeout(500);
        await page.keyboard.up(key);
      }
    };

    // Start measuring frames
    let frames = 0;
    const startTime = Date.now();
    
    // Setup frame counting
    await page.evaluate(() => {
      window.performance.mark('startAnimation');
      let lastTime = performance.now();
      const countFrame = (time: number) => {
        if (time - lastTime >= 1000) {
          // @ts-ignore
          window.frameCount = (window.frameCount || 0) + 1;
          lastTime = time;
        }
        requestAnimationFrame(countFrame);
      };
      requestAnimationFrame(countFrame);
    });

    // Perform movement test
    console.log('Starting movement test...');
    for (let i = 0; i < 3; i++) {
      await moveHorse();
      await page.waitForTimeout(100); // Brief pause between movements
    }

    // Get frame count
    frames = await page.evaluate(() => {
      window.performance.mark('endAnimation');
      window.performance.measure('animationDuration', 'startAnimation', 'endAnimation');
      // @ts-ignore
      return window.frameCount || 0;
    });

    // Get final metrics
    const finalMetrics = await client.send('Performance.getMetrics');

    // Calculate results
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    const fps = frames / duration;

    const memoryMetrics = finalMetrics.metrics.find(m => m.name === 'JSHeapUsedSize');
    const initialMemoryMetrics = initialMetrics.metrics.find(m => m.name === 'JSHeapUsedSize');
    const memoryDiff = ((memoryMetrics?.value || 0) - (initialMemoryMetrics?.value || 0)) / 1024 / 1024;

    // Output results
    console.log('\nPerformance Results:');
    console.log('-------------------');
    console.log(`Average FPS: ${fps.toFixed(2)}`);
    console.log(`Memory Usage Increase: ${memoryDiff.toFixed(2)}MB`);
    console.log(`Total Frames: ${frames}`);
    console.log(`Test Duration: ${duration.toFixed(2)}s`);

    // Get performance entries
    const entries = await page.evaluate(() => JSON.stringify(performance.getEntriesByType('measure')));
    console.log('\nPerformance Measures:', JSON.parse(entries));

  } catch (error) {
    console.error('Error during performance measurement:', error);
  } finally {
    await page.close();
    await browser.close();
  }
}

// Run the performance measurement
measurePerformance().catch(console.error);