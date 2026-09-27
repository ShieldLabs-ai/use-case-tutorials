import puppeteer from 'puppeteer';

// The app to test. On the final branch, use your development domain:
//   BASE_URL=https://tutorial.your-domain.com node test-bot.js
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const browser = await puppeteer.launch();
try {
  const page = await browser.newPage();
  await page.goto(BASE_URL);

  // Try one card number from a list, the way a card testing script does.
  await page.type('#recipientEmail', 'bot@example.com');
  await page.type('#cardNumber', '4111 1111 1111 1111');
  await page.type('#expiry', '12/30');
  await page.type('#cvc', '123');
  await page.click('#buyBtn');

  // Wait for the server's answer (on the final branch this can take a few seconds).
  await page.waitForSelector('#result:not(.hidden)', { timeout: 30_000 });
  const answer = await page.evaluate(() => document.getElementById('result').textContent.trim());
  console.log('Server response:', answer);
} finally {
  await browser.close();
}
