import AxeBuilder from "@axe-core/playwright";
import { chromium, type Browser } from "playwright";
import { assertSafeUrl } from "../lib/ssrfGuard.js";
import { ValidationError } from "../lib/errors.js";
import { runKeyboardChecks } from "./keyboard.js";

const SCAN_TIMEOUT_MS = 30_000;
export const MAX_HTML_BYTES = 500 * 1024;
const axeTags = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];
let browserPromise: Promise<Browser> | undefined;

export async function closeBrowser(): Promise<void> {
  if (browserPromise) {
    try {
      const browser = await browserPromise;
      await browser.close();
    } catch {
      // Ignore error during shutdown
    } finally {
      browserPromise = undefined;
    }
  }
}

export type RawScanResult = { html: string; axe: Awaited<ReturnType<AxeBuilder["analyze"]>>; keyboardIssues: import("@accesslens/shared").Issue[] };
export type IssueContext = { outerHTML: string; parentHTML: string; computedStyles: { color: string; backgroundColor: string; fontSize: string } };

async function getBrowser(): Promise<Browser> {
  browserPromise ??= chromium.launch({ headless: true });
  const browser = await browserPromise;
  if (!browser.isConnected()) browserPromise = chromium.launch({ headless: true });
  return browserPromise;
}

async function runPage(scanId: string, load: (page: import("playwright").Page) => Promise<void>): Promise<RawScanResult> {
  const browser = await getBrowser();
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(SCAN_TIMEOUT_MS);
    await load(page);
    const axe = await new AxeBuilder({ page }).withTags(axeTags).analyze();
    const keyboardIssues = await runKeyboardChecks(page, scanId);
    return { html: await page.content(), axe, keyboardIssues };
  } finally {
    await context.close();
  }
}

export async function scanHtml(html: string, scanId: string): Promise<RawScanResult> {
  if (Buffer.byteLength(html, "utf8") > MAX_HTML_BYTES) throw new Error("Pasted HTML must be 500KB or smaller");
  return runPage(scanId, async (page) => page.setContent(html, { waitUntil: "load", timeout: SCAN_TIMEOUT_MS }));
}

export async function scanUrl(url: string, scanId: string): Promise<RawScanResult> {
  await assertSafeUrl(url);
  return runPage(scanId, async (page) => {
    let blockedNavigation: ValidationError | undefined;
    await page.context().route("**/*", async (route) => {
      try {
        await assertSafeUrl(route.request().url());
        await route.continue();
      } catch (error) {
        if (route.request().isNavigationRequest()) {
          blockedNavigation = error instanceof ValidationError ? error : new ValidationError("Blocked unsafe redirect");
        }
        await route.abort("blockedbyclient");
      }
    });
    try {
      await page.goto(url, { waitUntil: "load", timeout: SCAN_TIMEOUT_MS });
    } catch (error) {
      if (blockedNavigation) throw blockedNavigation;
      throw error;
    }
  });
}

export async function gatherIssueContext(html: string, selector: string): Promise<IssueContext> {
  const browser = await getBrowser();
  const context = await browser.newContext();
  try {
    await context.route("**/*", (route) => route.abort());
    const page = await context.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: SCAN_TIMEOUT_MS });
    return await page.evaluate((target) => {
      const element = document.querySelector(target) as HTMLElement | null;
      if (!element) throw new Error(`Issue selector no longer exists: ${target}`);
      const styles = getComputedStyle(element);
      return { outerHTML: element.outerHTML, parentHTML: (element.parentElement?.outerHTML ?? "").slice(0, 1500), computedStyles: { color: styles.color, backgroundColor: styles.backgroundColor, fontSize: styles.fontSize } };
    }, selector);
  } finally {
    await context.close();
  }
}
