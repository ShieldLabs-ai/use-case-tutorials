import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const applications = [
  "account-sharing",
  "account-takeover",
  "ban-evasion",
  "bonus-abuse",
  "card-testing",
  "chargeback-dispute",
  "checkout-risk",
  "coupon-abuse",
  "credential-stuffing",
  "loan-risk",
  "new-account-fraud",
  "paywall",
  "personalization",
  "promo-abuse",
  "referral-fraud",
  "regional-pricing",
  "sms-pumping",
  "survey-fraud",
  "sybil-attack",
  "web-scraping"
];

async function exists(path) {
  try { return await stat(path); } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

export async function checkTutorial(name, repository = root) {
  assert.ok(applications.includes(name), 'Unknown tutorial folder');
  const folder = join(repository, name);
  for (const file of ['README.md', 'LICENSE', '.env.example', 'package.json', 'package-lock.json', 'public/index.html', 'public/index.js', 'server/server.js', 'server/db.js', 'test/app.test.js']) {
    assert.ok((await exists(join(folder, file)))?.isFile(), name + ': missing ' + file);
  }
  const manifest = JSON.parse(await readFile(join(folder, 'package.json'), 'utf8'));
  const lock = JSON.parse(await readFile(join(folder, 'package-lock.json'), 'utf8'));
  assert.equal(manifest.private, true, name + ': teaching app must not be an npm release');
  assert.equal(manifest.engines.node, '>=22');
  assert.deepEqual(lock.packages[''].dependencies, manifest.dependencies);
  assert.deepEqual(lock.packages[''].devDependencies, manifest.devDependencies);
  assert.ok(manifest.scripts.test.includes('node --test'), name + ': native tests missing');
  const final = Boolean(manifest.dependencies['@shieldlabs-ai/node']);
  if (final) {
    for (const sdk of ['@shieldlabs-ai/js', '@shieldlabs-ai/node']) {
      assert.equal(manifest.dependencies[sdk], '1.0.1', name + ': SDK must be pinned');
    }
    assert.ok((await exists(join(folder, 'public/shieldlabs.js')))?.isFile());
    assert.ok((await exists(join(folder, 'server/shieldlabs.js')))?.isFile());
    assert.ok((await exists(join(folder, 'test/browser.test.js')))?.isFile());
    const browser = await readFile(join(folder, 'public/shieldlabs.js'), 'utf8');
    assert.ok(!browser.includes('SHIELDLABS_API_KEY'), name + ': private API key must stay server-side');
  } else {
    assert.ok(!manifest.dependencies['@shieldlabs-ai/js'], name + ': starter must work without an SDK');
  }
  for (const dependency of Object.values(manifest.dependencies)) {
    assert.ok(!/^(?:file:|link:|\.\.?\/|\/)/.test(dependency), name + ': dependency points outside this folder');
  }
  const env = await readFile(join(folder, '.env.example'), 'utf8');
  const values = Object.fromEntries(env.split('\n').filter(line => /^[A-Z_]+=/.test(line)).map(line => {
    const separator = line.indexOf('=');
    return [line.slice(0, separator), line.slice(separator + 1)];
  }));
  if (final) {
    assert.equal(values.SHIELDLABS_PUBLIC_KEY, 'your-public-key');
    assert.equal(values.SHIELDLABS_API_KEY, 'sec_your_private_api_key');
  }
  for (const sourceFolder of ['public', 'server', 'test']) {
    for (const file of await readdir(join(folder, sourceFolder))) {
      if (!/\.m?js$/.test(file)) continue;
      const source = join(folder, sourceFolder, file);
      const result = spawnSync(process.execPath, ['--check', source], { encoding: 'utf8', timeout: 10_000 });
      assert.equal(result.status, 0, name + ': syntax error in ' + file + '\n' + (result.stderr ?? ''));
    }
  }
  return { application: name, flavor: final ? 'final' : 'starter' };
}

export async function checkInventory(repository = root) {
  const folders = [];
  for (const entry of await readdir(repository, { withFileTypes: true })) {
    if (entry.isDirectory() && (await exists(join(repository, entry.name, 'package.json')))?.isFile()) folders.push(entry.name);
  }
  assert.deepEqual(folders.sort(), [...applications].sort(), 'The tutorial matrix must cover every app');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await checkInventory();
  for (const name of process.argv[2] ? [process.argv[2]] : applications) {
    console.log(JSON.stringify(await checkTutorial(name)));
  }
}
