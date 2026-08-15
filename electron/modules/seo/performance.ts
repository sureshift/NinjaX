import { chromium } from "playwright";

export interface CoreWebVitalsResult {
  url: string;
  lcpMs: number | null;
  cls: number | null;
  inpMs: number | null;
  issues: string[];
}

/**
 * Measures approximate Core Web Vitals using the browser's own Performance
 * and Layout Instability APIs. This runs a single cold load in headless
 * Chromium - it's a good relative signal, not a lab-grade Lighthouse report.
 * For production-grade CWV data, swap this for the real Lighthouse/CrUX API.
 */
export async function measureCoreWebVitals(url: string): Promise<CoreWebVitalsResult> {
  const browser = await chromium.launch();
  const issues: string[] = [];

  try {
    const page = await browser.newPage();

    await page.addInitScript(() => {
      (window as unknown as { __vitals: Record<string, number> }).__vitals = {};

      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
        if (last) {
          (window as unknown as { __vitals: Record<string, number> }).__vitals.lcp =
            last.renderTime || last.loadTime || last.startTime;
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });

      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as (PerformanceEntry & {
          value: number;
          hadRecentInput: boolean;
        })[]) {
          if (!entry.hadRecentInput) clsValue += entry.value;
        }
        (window as unknown as { __vitals: Record<string, number> }).__vitals.cls = clsValue;
      }).observe({ type: "layout-shift", buffered: true });
    });

    await page.goto(url, { waitUntil: "load", timeout: 30000 });
    await page.waitForTimeout(2000); // let LCP/CLS observers settle

    const vitals = await page.evaluate(
      () => (window as unknown as { __vitals: Record<string, number> }).__vitals
    );

    const lcpMs = vitals.lcp ?? null;
    const cls = vitals.cls ?? null;

    if (lcpMs !== null && lcpMs > 2500) issues.push("LCP above 2.5s (poor)");
    if (cls !== null && cls > 0.1) issues.push("CLS above 0.1 (poor)");

    return {
      url,
      lcpMs,
      cls,
      inpMs: null, // INP requires real user interaction - not measurable on a cold headless load
      issues,
    };
  } finally {
    await browser.close();
  }
}
