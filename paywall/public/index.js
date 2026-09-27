const result = document.getElementById('result');

const articles = await (await fetch('/api/articles')).json();
document.getElementById('articles').replaceChildren(...articles.map(renderSummary));

document.getElementById('resetDb').addEventListener('click', async (event) => {
  event.preventDefault();
  const response = await fetch('/api/reset-db', { method: 'POST' });
  const data = await response.json();
  result.className = 'mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800 ring-1 ring-emerald-200';
  result.textContent = data.message;
});

function renderSummary(article) {
  const link = el('a', 'block rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-400');
  link.href = `/article.html?id=${article.id}`;
  link.append(
    el('h2', 'font-semibold', article.title),
    el('p', 'mt-1 text-sm text-slate-600', article.summary),
    el('p', 'mt-2 text-xs text-slate-500', `${article.author}, ${article.date}`),
  );
  const item = el('li');
  item.append(link);
  return item;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
