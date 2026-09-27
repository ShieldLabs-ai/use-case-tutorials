import puppeteer from 'puppeteer';

// The app to test. On the final branch, use your development domain:
//   BASE_URL=https://tutorial.your-domain.com node test-bot.js
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const browser = await puppeteer.launch();
try {
  const page = await browser.newPage();
  await page.goto(BASE_URL);

  // Fill in the survey with a fresh email, the way a reward farming script does.
  await page.click('input[name="cooking"][value="weekly"]');
  await page.select('#nextAppliance', 'blender');
  await page.click('input[name="groceries"][value="50-150"]');
  await page.type('#email', `bot-${Date.now()}@example.com`);
  await page.click('#submitBtn');

  // Wait for the server's answer (on the final branch this can take a few seconds).
  await page.waitForSelector('#result:not(.hidden)', { timeout: 30_000 });
  const answer = await page.evaluate(() => document.getElementById('result').textContent.trim());
  console.log('Server response:', answer);
} finally {
  await browser.close();
}
