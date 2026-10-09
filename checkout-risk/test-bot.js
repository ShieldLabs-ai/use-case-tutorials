import puppeteer from 'puppeteer';
// Optional, controlled demo test only. Never enter a real email or payment data.
const browser = await puppeteer.launch();
try {
  const page = await browser.newPage();
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:3000');
  await page.click('#checkoutForm button');
  await page.waitForFunction(() => document.querySelector('#result').textContent !== '', { timeout: 40_000 });
  console.log('Demo response:', await page.$eval('#result', element => element.textContent));
} finally { await browser.close(); }
