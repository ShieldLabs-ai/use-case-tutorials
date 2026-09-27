const searchForm = document.getElementById('searchForm');
const result = document.getElementById('result');

let profile = await getJson('/api/profile');
let results = [];
renderProfile();
await runSearch('');

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await runSearch(searchForm.elements.query.value);
});

document.getElementById('resetDb').addEventListener('click', async (event) => {
  event.preventDefault();
  await postJson('/api/reset-db');
  location.reload();
});

// --- Actions ---

async function runSearch(query) {
  searchForm.elements.query.value = query;
  ({ results } = await getJson(`/api/search?q=${encodeURIComponent(query)}`));
  document.getElementById('resultsLabel').textContent = query
    ? `${results.length} results for "${query}"`
    : 'All products';
  await refreshProfile();
}

async function toggleSaved(product) {
  const data = await postJson('/api/saved', { productId: product.id });
  showResult(data.success ? 'success' : 'error', data.message);
  await refreshProfile();
}

async function refreshProfile() {
  profile = await getJson('/api/profile');
  renderProfile();
}

// --- Rendering ---

function renderProfile() {
  const savedIds = new Set(profile.saved.map((product) => product.id));
  document.getElementById('results').replaceChildren(...results.map((product) => renderProduct(product, savedIds.has(product.id))));

  const recent = profile.recentSearches.map((query) => {
    const chip = el('button', 'rounded-full bg-slate-100 px-3 py-1 hover:bg-slate-200', query);
    chip.type = 'button';
    chip.addEventListener('click', () => runSearch(query));
    const item = el('li');
    item.append(chip);
    return item;
  });
  document.getElementById('recentSearches').replaceChildren(...(recent.length ? recent : [el('li', 'text-slate-500', 'No searches yet.')]));

  const saved = profile.saved.map((product) => el('li', '', `${product.name}, $${product.price}`));
  document.getElementById('saved').replaceChildren(...(saved.length ? saved : [el('li', 'text-slate-500', 'Nothing saved yet.')]));
}

function renderProduct(product, isSaved) {
  const card = el('li', 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm');
  const tile = el('div', `flex h-24 items-center justify-center rounded-lg text-3xl font-semibold ${tileColor(product.category)}`, product.name[0]);
  const save = el('button', 'save-btn mt-3 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100', isSaved ? 'Saved' : 'Save');
  save.type = 'button';
  save.addEventListener('click', () => toggleSaved(product));
  card.append(
    tile,
    el('p', 'mt-3 font-medium', product.name),
    el('p', 'text-sm text-slate-500', `${product.category}, $${product.price}`),
    save,
  );
  return card;
}

function tileColor(category) {
  const colors = {
    Lighting: 'bg-amber-100 text-amber-800',
    Textiles: 'bg-rose-100 text-rose-800',
    Kitchen: 'bg-sky-100 text-sky-800',
    Garden: 'bg-emerald-100 text-emerald-800',
    Furniture: 'bg-orange-100 text-orange-800',
    Decor: 'bg-violet-100 text-violet-800',
  };
  return colors[category] ?? 'bg-slate-100 text-slate-700';
}

// --- Helpers ---

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

async function getJson(url) {
  const response = await fetch(url);
  return response.json();
}

async function postJson(url, body = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}

function showResult(type, message) {
  const styles = {
    success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    error: 'bg-red-50 text-red-800 ring-red-200',
  };
  result.className = `mt-4 rounded-md p-3 text-sm ring-1 ${styles[type]}`;
  result.textContent = message;
}
