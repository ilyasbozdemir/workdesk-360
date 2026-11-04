const { _electron: electron } = require('@playwright/test');
const path = require('path');
const os = require('os');
const fs = require('fs');

async function main() {
  const appDir = path.resolve(__dirname, '../apps/temin360-desktop');
  const mainScript = path.join(appDir, 'out/main/index.js');
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'temin360-debug-'));
  const testFile = path.join(appDir, '.e2e-desktop/Temin360-E2E-Test/e2e-test-kurumu.temin');

  console.log('Main script:', mainScript);
  console.log('Test file exists?', fs.existsSync(testFile), testFile);

  const launchArgs = [
    mainScript,
    '--multi-instance',
    `--user-data-dir=${userDataDir}`,
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--no-sandbox',
    testFile
  ];

  console.log('Launching electron...');
  const app = await electron.launch({
    args: launchArgs,
    cwd: appDir,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      ELECTRON_ENABLE_LOGGING: '1'
    }
  });

  console.log('Launched! Process PID:', app.process().pid);

  app.process().stdout.on('data', (d) => console.log('[STDOUT]', d.toString()));
  app.process().stderr.on('data', (d) => console.log('[STDERR]', d.toString()));

  console.log('Waiting for first window...');
  const page = await app.firstWindow();
  console.log('First window loaded! URL:', page.url());

  page.on('console', (msg) => console.log('[PAGE CONSOLE]', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.log('[PAGE ERROR]', err.message));

  console.log('Waiting for load state domcontentloaded...');
  await page.waitForLoadState('domcontentloaded');
  console.log('DOM content loaded! Current content:');
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('BODY TEXT PREVIEW:\n', bodyText.slice(0, 500));

  await app.close();
  console.log('Done!');
}

main().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
