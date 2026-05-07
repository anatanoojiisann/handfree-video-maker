import { chromium } from 'playwright';
import { dims } from './placeholderGenerator';

export async function captureScreenshot(url: string, outPath: string, aspectRatio: string) {
  if (!url) throw new Error('Missing source URL for Playwright screenshot.');
  const { w, h } = dims(aspectRatio);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined);
    await page.screenshot({ path: outPath, fullPage: false });
    return outPath;
  } finally {
    await browser.close();
  }
}
