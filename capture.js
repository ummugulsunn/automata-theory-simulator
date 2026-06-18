const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: "new",
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  const page = await browser.newPage();
  
  // Set a professional viewport size (like a standard laptop screen)
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  
  const filePath = `file://${path.resolve(__dirname, 'index.html')}`;
  console.log(`Navigating to ${filePath}...`);
  await page.goto(filePath, { waitUntil: 'networkidle0' });

  // Add a nice subtle drop shadow and rounded corners for a "mac window" look? No, just the clean app UI is fine.
  
  const screenshotsDir = path.resolve(__dirname, 'docs', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // 1. Take main interface screenshot
  console.log("Taking main interface screenshot...");
  await page.screenshot({ path: path.join(screenshotsDir, 'main_interface.png') });

  // 2. Load a preset to take a "step trace" screenshot
  console.log("Loading a preset for step trace screenshot...");
  await page.evaluate(() => {
    // Attempt to load DFA preset and simulate some steps
    const presetSelect = document.getElementById('preset-select');
    if(presetSelect) {
      presetSelect.value = 'dfa-even-zeros';
      const event = new Event('change');
      presetSelect.dispatchEvent(event);
    }
  });
  
  // Wait for network/animations
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Add an input string and start trace
  await page.evaluate(() => {
    const stringInput = document.getElementById('string-input');
    const startBtn = document.getElementById('btn-start');
    if (stringInput && startBtn) {
      stringInput.value = '1010';
      startBtn.click();
    }
  });

  await new Promise(resolve => setTimeout(resolve, 500));

  console.log("Taking step trace screenshot...");
  // Maybe wait a second for UI to update
  await page.screenshot({ path: path.join(screenshotsDir, 'step_trace.png') });

  await browser.close();
  console.log("Screenshots updated successfully.");
})();
