import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { chromium, type Browser, type Page } from "playwright";
import { runKeyboardChecks } from "./keyboard.js";

let browser: Browser;
let page: Page;
const hasChromium = existsSync(chromium.executablePath());
const hasHeadlessShell = existsSync(join(dirname(dirname(dirname(chromium.executablePath()))), `chromium_headless_shell-${chromium.executablePath().match(/chromium-(\d+)/)?.[1] ?? ""}`, "chrome-headless-shell-win64", "chrome-headless-shell.exe"));

async function check(html: string) {
  await page.setContent(html);
  return runKeyboardChecks(page, "test-scan");
}

describe.skipIf(!hasChromium || !hasHeadlessShell)("runKeyboardChecks", () => {
  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });
  it("detects non-semantic click targets and positive tabindex", async () => {
    const issues = await check('<div id="clickable" onclick="void 0">Open</div><button id="priority" tabindex="2">Save</button>');
    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: "custom-clickable-non-semantic", selector: "#clickable", source: "custom" }),
      expect.objectContaining({ ruleId: "custom-positive-tabindex", selector: "#priority" }),
    ]));
  });

  it("detects interactive controls that cannot be reached by Tab", async () => {
    const issues = await check('<button id="visible">Visible</button><button id="hidden" style="display:none">Hidden</button>');
    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: "custom-keyboard-unreachable", selector: "#hidden" }),
    ]));
  });

  it("detects an absent focus indicator", async () => {
    const issues = await check('<button id="no-focus" style="outline:none; box-shadow:none; border:0">Continue</button>');
    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: "custom-focus-not-visible", selector: "#no-focus" }),
    ]));
  });

  it("detects a keyboard focus trap", async () => {
    const issues = await check(`
      <button id="trap-a">First</button><button id="trap-b">Second</button><button id="outside">Outside</button>
      <script>
        document.addEventListener('keydown', (event) => {
          if (event.key !== 'Tab') return;
          if (document.activeElement.id === 'trap-a' || document.activeElement.id === 'trap-b') {
            event.preventDefault();
            document.getElementById(document.activeElement.id === 'trap-a' ? 'trap-b' : 'trap-a').focus();
          }
        });
      </script>
    `);
    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: "custom-focus-trap" }),
    ]));
  });
});
