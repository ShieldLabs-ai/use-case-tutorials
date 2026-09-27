import puppeteer from 'puppeteer';

// The app to test. On the final branch, use your development domain:
//   BASE_URL=https://tutorial.your-domain.com node test-bot.js
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const browser = await puppeteer.launch();
try {
  const page = await browser.newPage();

  // Open an article directly, the way a scraper collecting full texts would.
  await page.goto(`${BASE_URL}/article.html?id=1`);

  // Wait for the server's answer (on the final branch this can take a few seconds).
  await page.waitForSelector('#result:not(.hidden)', { timeout: 30_000 });
  const answer = await page.evaluate(() => {
    const status = document.getElementById('result').textContent.trim();
    const unlocked = !document.getElementById('article').classList.contains('hidden');
    return `${status} (article ${unlocked ? 'shown' : 'not shown'})`;
  });
  console.log('Server response:', answer);
} finally {
  await browser.close();
}
