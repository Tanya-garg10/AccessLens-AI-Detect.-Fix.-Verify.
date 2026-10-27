import type { Page } from "playwright";
import type { Issue } from "@accesslens/shared";

type ElementSnapshot = { selector: string; html: string };
type FocusStyles = { outline: string; boxShadow: string; border: string };

function customIssue(scanId: string, ruleId: string, impact: Issue["impact"], wcag: string[], element: ElementSnapshot, message: string): Issue {
  return { id: "", scanId, ruleId, impact, wcag, selector: element.selector, html: element.html, message, source: "custom", status: "open" };
}

async function snapshots(page: Page, mode: "clickable" | "interactive" | "positive-tabindex"): Promise<ElementSnapshot[]> {
  return page.evaluate((requestedMode) => {
    const selectorFor = (element: Element): string => {
      const escape = (value: string) => CSS.escape(value);
      if ((element as HTMLElement).id) return `#${escape((element as HTMLElement).id)}`;
      const testId = element.getAttribute("data-testid");
      if (testId) return `[data-testid="${escape(testId)}"]`;
      const parts: string[] = [];
      let current: Element | null = element;
      while (current && current !== document.body) {
        const parent: Element | null = current.parentElement;
        if (!parent) break;
        const index = Array.prototype.indexOf.call(parent.children, current) + 1;
        parts.unshift(`${current.tagName.toLowerCase()}:nth-child(${index})`);
        current = parent;
      }
      return `body > ${parts.join(" > ")}`;
    };
    const asSnapshot = (element: Element) => ({ selector: selectorFor(element), html: (element as HTMLElement).outerHTML });
    const elements = [...document.querySelectorAll<HTMLElement>("*")];
    if (requestedMode === "clickable") {
      const nonSemanticTags = new Set(["div", "span", "li", "p", "section", "article", "header", "footer", "main", "td", "label"]);
      return elements.filter((element) => nonSemanticTags.has(element.tagName.toLowerCase()) && (element.hasAttribute("onclick") || getComputedStyle(element).cursor === "pointer") && !element.hasAttribute("role") && !element.hasAttribute("tabindex")).map(asSnapshot);
    }
    if (requestedMode === "positive-tabindex") return elements.filter((element) => Number(element.getAttribute("tabindex")) > 0).map(asSnapshot);
    return elements.filter((element) => {
      const tabIndex = element.getAttribute("tabindex");
      const isNativeInteractive = element.matches("a[href], button, input:not([type=hidden]), select, textarea, [role=button]");
      const hasReachableTabindex = tabIndex !== null && Number(tabIndex) >= 0;
      return (isNativeInteractive || hasReachableTabindex) && !element.hasAttribute("disabled");
    }).map(asSnapshot);
  }, mode);
}

async function activeSnapshot(page: Page): Promise<(ElementSnapshot & { interactive: boolean }) | undefined> {
  return page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    if (!element || element === document.body) return undefined;
    const escape = (value: string) => CSS.escape(value);
    const selectorFor = (node: Element): string => {
      if ((node as HTMLElement).id) return `#${escape((node as HTMLElement).id)}`;
      const testId = node.getAttribute("data-testid");
      if (testId) return `[data-testid="${escape(testId)}"]`;
      const parts: string[] = [];
      let current: Element | null = node;
      while (current && current !== document.body) {
        const parent: Element | null = current.parentElement;
        if (!parent) break;
        parts.unshift(`${current.tagName.toLowerCase()}:nth-child(${Array.prototype.indexOf.call(parent.children, current) + 1})`);
        current = parent;
      }
      return `body > ${parts.join(" > ")}`;
    };
    return { selector: selectorFor(element), html: element.outerHTML, interactive: element.matches("a[href], button, input, select, textarea, [role=button], [tabindex]") };
  });
}

async function styles(page: Page, selector: string): Promise<FocusStyles> {
  return page.evaluate((target) => {
    const element = document.querySelector(target);
    if (!element) return { outline: "", boxShadow: "", border: "" };
    const computed = getComputedStyle(element);
    return { outline: computed.outline, boxShadow: computed.boxShadow, border: computed.border };
  }, selector);
}

export async function runKeyboardChecks(page: Page, scanId: string): Promise<Issue[]> {
  const issues: Issue[] = [];
  for (const element of await snapshots(page, "clickable")) {
    issues.push(customIssue(scanId, "custom-clickable-non-semantic", "serious", ["2.1.1", "4.1.2"], element, "Clickable non-semantic element is missing role and tabindex."));
  }
  for (const element of await snapshots(page, "positive-tabindex")) {
    issues.push(customIssue(scanId, "custom-positive-tabindex", "moderate", ["2.4.3"], element, "Positive tabindex changes the expected keyboard focus order."));
  }

  const interactive = await snapshots(page, "interactive");
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const focused = new Map<string, ElementSnapshot>();
  const focusHistory: (ElementSnapshot & { interactive: boolean })[] = [];
  for (let index = 0; index < 100; index += 1) {
    await page.keyboard.press("Tab");
    const active = await activeSnapshot(page);
    if (active) {
      if (active.interactive) focused.set(active.selector, active);
      focusHistory.push(active);
    }
  }

  for (const element of interactive) {
    if (!focused.has(element.selector)) {
      issues.push(customIssue(scanId, "custom-keyboard-unreachable", "serious", ["2.1.1"], element, "Interactive element was never reached using the Tab key."));
    }
  }

  for (const element of interactive) {
    const before = await styles(page, element.selector);
    try {
      await page.locator(element.selector).focus({ timeout: 1_000 });
    } catch {
      continue;
    }
    const after = await styles(page, element.selector);
    if (before.outline === after.outline && before.boxShadow === after.boxShadow && before.border === after.border) {
      issues.push(customIssue(scanId, "custom-focus-not-visible", "moderate", ["2.4.7"], element, "Focus does not produce a visible outline, box-shadow, or border change."));
    }
  }

  if (interactive.length > 1) {
    for (let start = 0; start <= focusHistory.length - 10; start += 1) {
      const window = focusHistory.slice(start, start + 10).filter((entry) => entry.interactive);
      const distinct = new Set(window.map((entry) => entry.selector));
      const first = window[0];
      if (window.length === 10 && first && distinct.size > 0 && distinct.size <= 3 && interactive.length > distinct.size) {
        issues.push(customIssue(scanId, "custom-focus-trap", "serious", ["2.1.2"], first, "Focus cycles within a small set of elements while other interactive elements exist."));
        break;
      }
    }
  }
  return issues;
}
