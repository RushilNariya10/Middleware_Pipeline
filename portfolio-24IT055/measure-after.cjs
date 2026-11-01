const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SLOW_3G = {
  offline: false,
  downloadThroughput: ((500 * 1024) / 8) * 0.8, // 500 kbps
  uploadThroughput: ((500 * 1024) / 8) * 0.8,
  latency: 400
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
          // ignore
        }
      }
    });

    const startTime = Date.now();
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    const loadDuration = Date.now() - startTime;

    const timing = JSON.parse(
      await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        return JSON.stringify({
          domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
          loadEvent: nav.loadEventEnd - nav.startTime
        });
      })
    );

    // Save screenshot on run 1
    if (i === 1) {
      const screenshotPath = path.join(__dirname, 'docs', 'screenshots', `after-${label}.png`);
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

async function recordNavigationFlow(baseUrl) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setCacheEnabled(false);

  // Capture fallback UI under slow 3G
  const client = await page.target().createCDPSession();
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', SLOW_3G);

  const routeLoads = [];

  page.on('response', (response) => {
    const resUrl = response.url();
    if (resUrl.endsWith('.js')) {
      routeLoads.push({
        file: path.basename(resUrl),
        status: response.status()
      });
    }
  });

  console.log('Navigating to home page under Slow 3G...');
  const navPromise = page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  // Check if fallback shows
  try {
    await page.waitForSelector('[role="status"]', { timeout: 1500 });
    const fallbackScreenshot = path.join(__dirname, 'docs', 'screenshots', 'after-fallback-slow3g.png');
    await page.screenshot({ path: fallbackScreenshot });
    console.log(`Captured fallback UI screenshot: ${fallbackScreenshot}`);
  } catch (e) {
    console.log('Fallback element passed quickly or not caught in timeout');
  }
  await navPromise;

  // Let home fully mount
  await new Promise((r) => setTimeout(r, 800));

  // Navigate to Analytics
  console.log('Navigating to /analytics...');
  await page.evaluate(() => window.location.href = '/analytics');
  await page.waitForSelector('.analytics-container', { timeout: 15000 });
  const analyticsScreenshot = path.join(__dirname, 'docs', 'screenshots', 'after-analytics-chart.png');
  await page.screenshot({ path: analyticsScreenshot });
  console.log(`Captured analytics screenshot: ${analyticsScreenshot}`);

  await browser.close();
  return routeLoads;
}

(async () => {
  const url = 'http://localhost:4173/';
  console.log(`Measuring post-optimization loads on ${url}...`);

  console.log('--- Measuring Unthrottled (3 runs) ---');
  const unthrottled = await measureCondition(url, false, 'unthrottled', 3);
  console.log('Unthrottled:', unthrottled.averages);

  console.log('--- Measuring Slow 3G (3 runs) ---');
  const slow3G = await measureCondition(url, true, 'slow3g', 3);
  console.log('Slow 3G:', slow3G.averages);

  console.log('--- Recording Slow 3G navigation & fallback screenshots ---');
  const routeLoads = await recordNavigationFlow(url);

  const afterData = {
    timestamp: new Date().toISOString(),
    url,
    build: {
      html: { file: 'dist/index.html', raw: '0.48 kB', gzip: '0.31 kB' },
      css: [{ file: 'dist/assets/index-BqZpNbOR.css', raw: '11.77 kB', gzip: '2.91 kB' }],
      mainJs: { file: 'dist/assets/index-Dwc4Ukyf.js', raw: '239.71 kB', gzip: '76.93 kB' },
      lazyChunks: [
        { name: 'NotFound', file: 'dist/assets/NotFound-D9bXoX2J.js', raw: '0.31 kB', gzip: '0.24 kB' },
        { name: 'ErrorMessage', file: 'dist/assets/ErrorMessage-DhJdkxZ8.js', raw: '0.57 kB', gzip: '0.33 kB' },
        { name: 'Contact', file: 'dist/assets/Contact-B30u6xdd.js', raw: '1.35 kB', gzip: '0.69 kB' },
        { name: 'Login', file: 'dist/assets/Login-NrSzLECZ.js', raw: '1.55 kB', gzip: '0.72 kB' },
        { name: 'Home', file: 'dist/assets/Home-lz7-31af.js', raw: '1.64 kB', gzip: '0.68 kB' },
        { name: 'Register', file: 'dist/assets/Register-B_l9vWF4.js', raw: '2.20 kB', gzip: '0.90 kB' },
        { name: 'Analytics', file: 'dist/assets/Analytics-BYpNAmB7.js', raw: '2.99 kB', gzip: '1.27 kB' },
        { name: 'Projects', file: 'dist/assets/Projects-D8DBQer9.js', raw: '4.91 kB', gzip: '1.85 kB' },
        { name: 'Tasks', file: 'dist/assets/Tasks-B6ifnl2M.js', raw: '6.50 kB', gzip: '2.15 kB' },
        { name: 'TaskChart (Recharts)', file: 'dist/assets/TaskChart-tmZUWyI1.js', raw: '389.80 kB', gzip: '111.06 kB' }
      ],
      totalJsFiles: 11
    },
    measurements: {
      unthrottled,
      slow3G
    },
    navigationFlowChunks: routeLoads
  };

  const outputPath = path.join(__dirname, 'docs', 'metrics', 'after.json');
  fs.writeFileSync(outputPath, JSON.stringify(afterData, null, 2));
  console.log(`Post-optimization metrics recorded in ${outputPath}`);
})();

