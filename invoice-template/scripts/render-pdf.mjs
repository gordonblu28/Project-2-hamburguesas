// Renders print-ready PDF previews of invoice.html with headless Chromium.
// Usage (from the repo root): node invoice-template/scripts/render-pdf.mjs
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

// Resolve playwright from the project, or fall back to a global install.
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const page_url = pathToFileURL(path.join(root, 'invoice.html')).href;
const outDir = path.join(root, 'pdf');
fs.mkdirSync(outDir, { recursive: true });

const jobs = [
  { query: '?hints', file: 'IMT-Invoice-Template.pdf' },
  { query: '?sample', file: 'IMT-Invoice-Sample.pdf' },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const { query, file } of jobs) {
  await page.goto(page_url + query, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: path.join(outDir, file), format: 'Letter', preferCSSPageSize: true, printBackground: true });
  if (process.env.SCREENSHOT_DIR) {
    await page.emulateMedia({ media: 'print' });
    await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, file.replace('.pdf', '.png')), fullPage: true });
    await page.emulateMedia({ media: null });
  }
  console.log('wrote', path.join(outDir, file));
}
await browser.close();
