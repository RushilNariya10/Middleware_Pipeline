const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Slow 3G network conditions (DevTools standard)
const SLOW_3G = {
  offline: false,
  downloadThroughput: ((500 * 1024) / 8) * 0.8, // 500 kbps
  uploadThroughput: ((500 * 1024) / 8) * 0.8,
  latency: 400 // ms RTT
};

async function measureCondition(url, throttle = false, label = 'unthrottled', runs = 3) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];

  for (let i = 1; i <= runs; i++) {
    const page = await browser.newPage();
    await page.setCacheEnabled(false);

    if (throttle) {
      const client = await page.target().createCDPSession();
      await client.send('Network.enable');
      await client.send('Network.emulateNetworkConditions', SLOW_3G);
    }

    let jsTransferred = 0;
    let jsCount = 0;
    const jsFiles = [];

    page.on('response', async (response) => {
      const req = response.request();
      const resUrl = response.url();
      const resourceType = req.resourceType();

      if (resourceType === 'script' || resUrl.endsWith('.js')) {
        jsCount++;
        try {
          const buffer = await response.buffer();
          const size = buffer.length;
          jsTransferred += size;
          jsFiles.push({ url: path.basename(resUrl), sizeBytes: size });
        } catch (e) {
          // Response body might be empty or redirected
        }
      }
    });

    const startTime = Date.now();
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    const loadDuration = Date.now() - startTime;

    // Get timing from Navigation Timing API
    const timing = JSON.parse(
      await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        return JSON.stringify({
          domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
          loadEvent: nav.loadEventEnd - nav.startTime
        });
      })
    );

    // Take screenshot on run 1
    if (i === 1) {
      const screenshotPath = path.join(__dirname, 'docs', 'screenshots', `before-${label}.png`);
      await page.screenshot({ path: screenshotPath });
      console.log(`Saved screenshot to ${screenshotPath}`);
    }

    results.push({
      run: i,
      jsRequests: jsCount,
      totalJsTransferredBytes: jsTransferred,
      totalJsTransferredKB: (jsTransferred / 1024).toFixed(2),
      domContentLoadedMs: Math.round(timing.domContentLoaded),
      loadEventMs: Math.round(timing.loadEvent || loadDuration),
      jsFiles
    });

    await page.close();
  }

  await browser.close();

  // Compute averages
  const avgJsKB = (results.reduce((acc, r) => acc + parseFloat(r.totalJsTransferredKB), 0) / runs).toFixed(2);
  const avgDCL = Math.round(results.reduce((acc, r) => acc + r.domContentLoadedMs, 0) / runs);
  const avgLoad = Math.round(results.reduce((acc, r) => acc + r.loadEventMs, 0) / runs);
  const jsRequests = results[0].jsRequests;

  return {
    condition: label,
    throttled: throttle,
    runs: results,
    averages: {
      jsRequests,
      totalJsTransferredKB: parseFloat(avgJsKB),
      domContentLoadedMs: avgDCL,
      loadEventMs: avgLoad
    }
  };
}

(async () => {
  const url = 'http://localhost:4173/';
  console.log(`Measuring cold cache loads on ${url}...`);

  console.log('--- Measuring Unthrottled (3 runs) ---');
  const unthrottled = await measureCondition(url, false, 'unthrottled', 3);
  console.log('Unthrottled:', unthrottled.averages);

  console.log('--- Measuring Slow 3G (3 runs) ---');
  const slow3G = await measureCondition(url, true, 'slow3g', 3);
  console.log('Slow 3G:', slow3G.averages);

  const baselineData = {
    timestamp: new Date().toISOString(),
    url,
    build: {
      html: { file: 'dist/index.html', raw: '0.48 kB', gzip: '0.31 kB' },
      css: [{ file: 'dist/assets/index-BqZpNbOR.css', raw: '11.77 kB', gzip: '2.91 kB' }],
      js: [{ file: 'dist/assets/index-CUP8iI_s.js', raw: '253.73 kB', gzip: '79.93 kB' }],
      totalJsFiles: 1
    },
    measurements: {
      unthrottled,
      slow3G
    }
  };

  const outputPath = path.join(__dirname, 'docs', 'metrics', 'baseline.json');
  fs.writeFileSync(outputPath, JSON.stringify(baselineData, null, 2));
  console.log(`Baseline metrics recorded in ${outputPath}`);
})();

