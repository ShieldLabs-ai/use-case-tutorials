import puppeteer from 'puppeteer';

// The app to test. On the final branch, use your development domain:
//   BASE_URL=https://tutorial.your-domain.com node test-bot.js
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const browser = await puppeteer.launch();
try {
  const page = await browser.newPage();
  await page.goto(BASE_URL);

  // Claim the cheapest region, whatever the real location.
  await page.waitForSelector('#country option');
  await page.select('#country', 'IN');
  await page.click('#activateBtn');

  // Wait for the server's answer (on the final branch this can take a few seconds).
  await page.waitForSelector('#result:not(.hidden)', { timeout: 30_000 });
  const answer = await page.evaluate(() => document.getElementById('result').textContent.trim());
  console.log('Server response:', answer);
} finally {
  await browser.close();
}
