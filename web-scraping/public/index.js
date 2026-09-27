const form = document.getElementById('searchForm');
const button = document.getElementById('searchBtn');
const result = document.getElementById('result');

await setUpForm();

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const search = {
    from: form.elements.from.value,
    to: form.elements.to.value,
    date: form.elements.date.value,
  };

  setBusy(true);
  try {
    const data = await postJson('/api/flights', search);
    showResult(data.success ? 'success' : 'error', data.message);
    renderFlights(data.flights ?? []);
  } catch (error) {
    console.error(error);
    showResult('error', 'Something went wrong. Try again.');
  } finally {
    setBusy(false);
  }
});

document.getElementById('resetDb').addEventListener('click', async (event) => {
  event.preventDefault();
  const data = await postJson('/api/reset-db');
  showResult('success', data.message);
  renderFlights([]);
});

// --- Helpers ---

// Fills the airport lists and picks tomorrow as the default date.
async function setUpForm() {
  const airports = await (await fetch('/api/airports')).json();
  for (const [select, preselected] of [[form.elements.from, 'JFK'], [form.elements.to, 'LAX']]) {
    select.replaceChildren(
      ...airports.map((airport) => {
        const option = document.createElement('option');
        option.value = airport.code;
        option.textContent = `${airport.city} (${airport.code})`;
        option.selected = airport.code === preselected;
        return option;
      }),
    );
  }
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  form.elements.date.value = tomorrow.toISOString().slice(0, 10);
}

function renderFlights(flights) {
  const rows = flights.map((flight) => {
    const row = document.createElement('tr');
    const cells = [flight.airline, flight.flightNumber, flight.departs, flight.arrives, flight.duration, `$${flight.price}`];
    cells.forEach((text, index) => {
      const cell = document.createElement('td');
      cell.className = index === cells.length - 1 ? 'px-4 py-2 text-right font-medium' : 'px-4 py-2';
      cell.textContent = text;
      row.append(cell);
    });
    return row;
  });
  document.getElementById('flights').replaceChildren(...rows);
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

function setBusy(busy) {
  button.disabled = busy;
  button.textContent = busy ? 'Searching...' : 'Search';
}
