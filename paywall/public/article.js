const articleId = new URLSearchParams(location.search).get('id');
const result = document.getElementById('result');

try {
  const response = await fetch(`/api/articles/${encodeURIComponent(articleId)}/read`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const data = await response.json();

  showResult(data.success ? 'success' : 'error', data.message);
  if (data.success) renderArticle(data.article);
} catch (error) {
  console.error(error);
  showResult('error', 'Something went wrong. Reload the page.');
} finally {
  document.getElementById('loading').remove();
}

function renderArticle(article) {
  document.title = article.title;
  document.getElementById('title').textContent = article.title;
  document.getElementById('byline').textContent = `${article.author}, ${article.date}`;
  document.getElementById('body').replaceChildren(
    ...article.body.map((text) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      return paragraph;
    }),
  );
  document.getElementById('article').classList.remove('hidden');
}

function showResult(type, message) {
  const styles = {
    success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    error: 'bg-red-50 text-red-800 ring-red-200',
  };
  result.className = `mt-6 rounded-md p-3 text-sm ring-1 ${styles[type]}`;
  result.textContent = message;
}
