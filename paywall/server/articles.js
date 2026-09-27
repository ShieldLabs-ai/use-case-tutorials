import { readFileSync } from 'node:fs';
import { db } from './db.js';
import { verifyIdentification } from './shieldlabs.js';

const ARTICLES = JSON.parse(readFileSync(new URL('./data/articles.json', import.meta.url), 'utf8'));
const FREE_ARTICLES_PER_DAY = 2;
const DAY = 24 * 60 * 60 * 1000;

// The article list, without the article bodies.
export function listArticles() {
  return ARTICLES.map(({ id, title, summary, author, date }) => ({ id, title, summary, author, date }));
}

// Opens an article while the reader has free articles left. The meter counts
// distinct articles over the last 24 hours per Device ID, which stays the same in
// an incognito window, after cookies are cleared and on a new IP address.
export async function readArticle({ articleId, requestId }) {
  const article = ARTICLES.find((item) => item.id === Number(articleId));
  if (!article) return { success: false, message: 'Article not found.' };

  // Read the identification behind this article view. Unverified, automated and
  // Dangerous views are refused.
  const check = await verifyIdentification(requestId);
  if (!check.ok) {
    return { success: false, message: `Article locked: ${check.message}` };
  }
  const { device_id: deviceId, request_id: checkedRequestId } = check.identification;

  const readToday = articlesReadSince(deviceId, Date.now() - DAY);
  const alreadyRead = readToday.includes(article.id);

  if (!alreadyRead && readToday.length >= FREE_ARTICLES_PER_DAY) {
    return {
      success: false,
      message: `You have read your ${FREE_ARTICLES_PER_DAY} free articles for today. Subscribe to keep reading.`,
    };
  }

  if (!alreadyRead) {
    db.prepare('INSERT INTO article_views (device_id, article_id, request_id, created_at) VALUES (?, ?, ?, ?)').run(
      deviceId,
      article.id,
      checkedRequestId,
      Date.now(),
    );
  }
  const used = alreadyRead ? readToday.length : readToday.length + 1;
  return {
    success: true,
    article,
    message: `Free articles read today: ${used} of ${FREE_ARTICLES_PER_DAY}.`,
  };
}

function articlesReadSince(deviceId, since) {
  return db
    .prepare('SELECT DISTINCT article_id FROM article_views WHERE device_id = ? AND created_at >= ?')
    .all(deviceId, since)
    .map((row) => row.article_id);
}
