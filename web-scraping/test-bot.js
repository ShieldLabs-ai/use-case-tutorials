import puppeteer from 'puppeteer';

// The app to test. On the final branch, use your development domain:
//   BASE_URL=https://tutorial.your-domain.com node test-bot.js
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const browser = await puppeteer.launch();
try {
  const page = await browser.newPage();
  await page.goto(BASE_URL);

  // Run the default search, the way a price scraper walks through routes and dates.
  await page.waitForSelector('#from option');
  await page.click('#searchBtn');

  // Wait for the server's answer (on the final branch this can take a few seconds).
  await page.waitForSelector('#result:not(.hidden)', { timeout: 30_000 });
  const answer = await page.evaluate(() => {
    const status = document.getElementById('result').textContent.trim();
    const rows = document.querySelectorAll('#flights tr').length;
    return `${status} (${rows} flights in the table)`;
  });
  console.log('Server response:', answer);
} finally {
  await browser.close();
}
