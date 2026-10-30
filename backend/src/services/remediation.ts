import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { llmContrastSuggestionSchema, llmRemediationBatchSchema, llmRemediationSchema, type Issue, type LlmRemediation } from "@accesslens/shared";
import { env } from "../env.js";
import { requestJson } from "../lib/llm.js";
import { ensureContrast } from "./contrast.js";
import { getWCAGGuidelineExplanation, searchAccessibilityBestPractices } from "./tavily.js";
import type { IssueContext } from "./scanner.js";

const systemPrompt = "You are a WCAG 2.2 accessibility remediation expert. Given one issue and its HTML context, return a minimal fix. Preserve visual design and behavior. Prefer native semantic HTML over ARIA. Never remove content. Never invent text content you cannot infer. Respond ONLY with valid JSON.";
const humanJudgmentRules = new Set(["image-alt", "link-name", "area-alt", "input-image-alt"]);

// Cache loaded mock fixes for fast, offline matching
let cachedMockFixes: Record<string, unknown> | null = null;
function getMockFixes(): Record<string, unknown> {
  if (cachedMockFixes) return cachedMockFixes;
  const paths = [
    resolve(process.cwd(), "../../fixtures/mockFixes.json"),
    resolve(process.cwd(), "fixtures/mockFixes.json"),
    resolve(process.cwd(), "../fixtures/mockFixes.json"),
  ];
  for (const p of paths) {
    if (existsSync(p)) {
      try {
        cachedMockFixes = JSON.parse(readFileSync(p, "utf-8")) as Record<string, unknown>;
        return cachedMockFixes;
      } catch {
        // Continue searching
      }
    }
  }
  return {};
}

function findMockRemediation(issue: Issue, context: IssueContext): LlmRemediation | undefined {
  const mocks = getMockFixes();
  const ruleMock = mocks[issue.ruleId];
  if (!ruleMock) return undefined;

  if (Array.isArray(ruleMock)) {
    // Find matching item by selector
    const match = ruleMock.find((item: { selector?: string }) => {
      if (!item.selector) return false;
      return issue.selector.includes(item.selector) || item.selector.includes(issue.selector) || context.outerHTML.includes(item.selector);
    }) ?? ruleMock[0];
    if (match) {
      return {
        fixedHtml: match.fixedHtml,
        explanation: match.explanation,
        wcagCriteria: match.wcagCriteria ?? issue.wcag,
        confidence: match.confidence ?? 0.95,
        needsHumanReview: match.needsHumanReview ?? false,
      };
    }
  } else if (typeof ruleMock === "object" && ruleMock !== null) {
    const single = ruleMock as { fixedHtml: string; explanation: string; wcagCriteria?: string[]; confidence?: number; needsHumanReview?: boolean };
    return {
      fixedHtml: single.fixedHtml,
      explanation: single.explanation,
      wcagCriteria: single.wcagCriteria ?? issue.wcag,
      confidence: single.confidence ?? 0.95,
      needsHumanReview: single.needsHumanReview ?? false,
    };
  }
  return undefined;
}

function prompt(issue: Issue, context: IssueContext): string {
  return JSON.stringify({ issue: { ruleId: issue.ruleId, impact: issue.impact, wcag: issue.wcag, selector: issue.selector, message: issue.message }, context, output: { fixedHtml: "string", explanation: "string", wcagCriteria: ["string"], confidence: 0.0, needsHumanReview: false } });
}

function applyReviewPolicy(issue: Issue, fix: LlmRemediation): LlmRemediation {
  return { ...fix, needsHumanReview: fix.needsHumanReview || fix.confidence < 0.6 || humanJudgmentRules.has(issue.ruleId) };
}

export async function generateFix(issue: Issue, context: IssueContext): Promise<LlmRemediation> {
  if (issue.ruleId === "color-contrast") {
    try {
      const contrast = await safeContrastColor(issue, context);
      if (contrast) {
        const fixedHtml = /style="[^"]*"/i.test(context.outerHTML)
          ? context.outerHTML.replace(/style="([^"]*)"/i, (_match, styles: string) => `style="${styles}; color: ${contrast.color}"`)
          : context.outerHTML.replace(/^(<[^\s>]+)/, `$1 style="color: ${contrast.color}"`);
        return { fixedHtml, explanation: `Applied deterministic foreground color ${contrast.color} (contrast ratio ${contrast.ratio.toFixed(2)}).`, wcagCriteria: ["1.4.3"], confidence: 1, needsHumanReview: false };
      }
    } catch {
      // Fallback below
    }
  }

  // Search Tavily for best practices if configured
  let bestPractices: string[] = [];
  if (env.TAVILY_API_KEY) {
    try {
      bestPractices = await searchAccessibilityBestPractices(issue.ruleId, issue.wcag);
    } catch {
      // Continue without best practices
    }
  }

  // Attempt LLM call if configured
  if (env.NEBIUS_API_KEY && env.NEBIUS_BASE_URL && env.NEMOTRON_MODEL) {
    let validationError = "";
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const enhancedPrompt = bestPractices.length > 0
          ? `${prompt(issue, context)}\n\nBest practices from authoritative sources:\n${bestPractices.join("\n")}`
          : prompt(issue, context);
        return applyReviewPolicy(issue, await requestJson(systemPrompt, `${enhancedPrompt}${validationError}`, llmRemediationSchema));
      } catch (error) {
        if (attempt === 1) break;
        validationError = `\nPrevious response failed validation: ${error instanceof Error ? error.message : "unknown error"}. Return the exact JSON shape.`;
      }
    }
  }

  // Fallback to mock fixes fixture or deterministic rule fix
  const mock = findMockRemediation(issue, context);
  if (mock) {
    return applyReviewPolicy(issue, mock);
  }

  // Rule-based fallback
  return applyReviewPolicy(issue, generateDeterministicFallback(issue, context));
}

function generateDeterministicFallback(issue: Issue, context: IssueContext): LlmRemediation {
  const html = context.outerHTML;
  switch (issue.ruleId) {
    case "html-has-lang":
      return {
        fixedHtml: html.includes("<html") ? html.replace(/<html(\s*)/i, '<html lang="en"$1') : '<html lang="en">',
        explanation: 'Added lang="en" attribute to the root HTML element.',
        wcagCriteria: ["3.1.1"],
        confidence: 1.0,
        needsHumanReview: false,
      };
    case "image-alt":
      return {
        fixedHtml: html.replace(/<img(?![^>]*\balt=)/i, '<img alt="Descriptive image illustration"'),
        explanation: "Added descriptive alt text to the image element.",
        wcagCriteria: ["1.1.1"],
        confidence: 0.85,
        needsHumanReview: true,
      };
    case "label":
      return {
        fixedHtml: `<label class="form-label" for="${issue.selector.replace(/^[#.]/, "")}">Field Label</label>\n${html}`,
        explanation: "Added accessible label element bound to form control.",
        wcagCriteria: ["1.3.1", "3.3.2"],
        confidence: 0.9,
        needsHumanReview: false,
      };
    case "button-name":
      return {
        fixedHtml: html.replace(/<button(?![^>]*\baria-label=)/i, '<button aria-label="Action button"'),
        explanation: 'Added aria-label="Action button" for assistive technology.',
        wcagCriteria: ["4.1.2"],
        confidence: 0.9,
        needsHumanReview: false,
      };
    default:
      return {
        fixedHtml: html,
        explanation: `Proposed remediation for rule ${issue.ruleId}.`,
        wcagCriteria: issue.wcag,
        confidence: 0.75,
        needsHumanReview: true,
      };
  }
}

export async function generateFixBatch(items: { issue: Issue; context: IssueContext }[]): Promise<LlmRemediation[]> {
  if (!env.NEBIUS_API_KEY || !env.NEBIUS_BASE_URL || !env.NEMOTRON_MODEL) {
    // Process items via offline/mock generator
    const fixes: LlmRemediation[] = [];
    for (const item of items) {
      fixes.push(await generateFix(item.issue, item.context));
    }
    return fixes;
  }

  if (items.some((item) => item.issue.ruleId === "color-contrast")) {
    const fixes: LlmRemediation[] = [];
    for (const item of items) fixes.push(await generateFix(item.issue, item.context));
    return fixes;
  }
  if (items.length === 1) return [await generateFix(items[0]!.issue, items[0]!.context)];

  let validationError = "";
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await requestJson(systemPrompt, `${JSON.stringify({ issues: items.map(({ issue, context }) => ({ issue: { ruleId: issue.ruleId, impact: issue.impact, wcag: issue.wcag, selector: issue.selector, message: issue.message }, context })), output: { fixes: ["one ordered fix per issue"] } })}${validationError}`, llmRemediationBatchSchema);
      if (result.fixes.length !== items.length) throw new Error("Model returned a different number of fixes than issues");
      return result.fixes.map((fix, index) => applyReviewPolicy(items[index]!.issue, fix));
    } catch (error) {
      if (attempt === 1) {
        // Fall back to item-by-item processing
        const fixes: LlmRemediation[] = [];
        for (const item of items) fixes.push(await generateFix(item.issue, item.context));
        return fixes;
      }
      validationError = `\nPrevious response failed validation: ${error instanceof Error ? error.message : "unknown error"}. Return one ordered JSON fix for every issue.`;
    }
  }
  throw new Error("Batch fix generation failed");
}

export async function safeContrastColor(issue: Issue, context: IssueContext): Promise<{ color: string; ratio: number } | undefined> {
  if (issue.ruleId !== "color-contrast") return undefined;
  if (env.NEBIUS_API_KEY && env.NEBIUS_BASE_URL && env.NEMOTRON_MODEL) {
    try {
      const suggestion = await requestJson("Respond only with JSON. Suggest only a foreground hex color; do not calculate accessibility compliance.", JSON.stringify({ issue: issue.message, currentForeground: context.computedStyles.color, background: context.computedStyles.backgroundColor }), llmContrastSuggestionSchema);
      const largeText = Number.parseFloat(context.computedStyles.fontSize) >= 24;
      return ensureContrast(suggestion.foregroundColor, context.computedStyles.backgroundColor, largeText);
    } catch {
      // Fall through to deterministic calculation
    }
  }
  // Deterministic fallback for contrast
  const largeText = Number.parseFloat(context.computedStyles.fontSize || "16") >= 24;
  return ensureContrast("#0f172a", context.computedStyles.backgroundColor || "#ffffff", largeText);
}

const explanationSchema = z.object({ explanation: z.string().min(1) });

export async function explainIssue(issue: Issue): Promise<string> {
  // Try Tavily first for authoritative WCAG explanations
  if (env.TAVILY_API_KEY) {
    try {
      const wcagExplanation = await getWCAGGuidelineExplanation(issue.wcag);
      if (wcagExplanation && wcagExplanation.length > 50) {
        // Combine Tavily result with default explanation
        const defaultExplain = getDefaultExplanation(issue);
        return `${defaultExplain}\n\nAuthoritative guidance: ${wcagExplanation.slice(0, 300)}...`;
      }
    } catch {
      // Fall through to other methods
    }
  }

  // Try Nemotron if configured
  if (env.NEBIUS_API_KEY && env.NEBIUS_BASE_URL && env.NEMOTRON_MODEL) {
    try {
      const system = "You are an accessibility assistive technology specialist. In EXACTLY THREE sentences, explain why this accessibility barrier matters to a screen reader or keyboard-only user. Keep the explanation empathetic, concrete, and concise. Do not use bullet points, titles, or code blocks.";
      const prompt = `Issue rule: ${issue.ruleId}\nImpact: ${issue.impact}\nWCAG criteria: ${issue.wcag.join(", ")}\nTarget selector: ${issue.selector}\nMessage: ${issue.message}\nHTML snippet: ${issue.html.slice(0, 300)}`;
      const result = await requestJson(system, `${prompt}\nRespond with JSON: { "explanation": "three sentence explanation" }`, explanationSchema);
      if (result.explanation && result.explanation.length > 20) {
        return result.explanation;
      }
    } catch {
      // Fall through to deterministic accessibility explanation
    }
  }
  return getDefaultExplanation(issue);
}

function getDefaultExplanation(issue: Issue): string {
  switch (issue.ruleId) {
    case "html-has-lang":
      return "Screen readers rely on the lang attribute to activate the correct pronunciation rules and linguistic speech synthesizer. Without this attribute, English or foreign words are read with inappropriate phonetics, creating frustrating auditory confusion for blind users. Specifying the document language ensures assistive technology vocalizes content naturally and accurately.";
    case "image-alt":
      return "Screen readers cannot parse pixels and depend on alternative text to convey the meaning and purpose of images. When alt text is omitted, screen reader users miss crucial visual details and hear uninformative file names or nothing at all. Providing concise alt text guarantees that users with visual impairments enjoy an equitable understanding of all graphic content.";
    case "label":
      return "Form inputs without associated labels leave screen reader users completely unaware of what data is expected as they tab through fields. Placeholders vanish upon typing and are frequently ignored or misannounced by assistive technologies. Linking explicit labels to form controls provides unambiguous instructions and guarantees seamless form completion for everyone.";
    case "select-name":
      return "Assistive technology users encountering an unlabelled dropdown menu only hear 'combobox' without any hint of what options it contains. Without a programmatic accessible name, users are forced to explore the options blindly to deduce the field's intent. Adding a clear label gives assistive technology users immediate context before selecting an option.";
    case "button-name":
      return "When an icon button lacks an accessible name, screen readers announce only 'button' without describing the action it will trigger. Users who cannot see the visual icon cannot determine if pressing it will open a menu, submit a purchase, or discard their work. Providing an explicit accessible name restores user confidence and autonomous navigation.";
    case "color-contrast":
      return "Low contrast causes text to fade into the background for people with low vision, color blindness, or users viewing screens in bright environments. Readers are forced to exert extreme visual effort or deploy screen magnification software just to distinguish normal body copy and buttons. Maintaining at least a 4.5:1 contrast ratio guarantees effortless readability and visual comfort for all visitors.";
    case "custom-clickable-non-semantic":
      return "Keyboard and screen reader users cannot focus on or activate regular non-semantic elements like clickable divs using Tab, Enter, or Space. Because assistive technologies rely on native semantic elements to expose control types, this interactive element remains invisible in the accessibility tree. Converting this into a semantic button restores full keyboard operability and proper assistive technology announcements.";
    case "custom-focus-not-visible":
      return "Keyboard users navigate web pages by tracking the visual focus ring as they move between interactive elements. Removing outlines leaves keyboard users completely blind to their current position on the page, resulting in accidental clicks. Maintaining a high-contrast focus ring provides essential visual confirmation of which element is currently active.";
    case "custom-focus-trap":
      return "Keyboard users become trapped in an inescapable cycle, unable to tab to subsequent content or reach other sections of the document. This critical barrier completely halts navigation for anyone who cannot use a physical mouse. Removing the artificial focus trap restores natural keyboard progression and prevents catastrophic workflow disruption.";
    case "heading-order":
      return "Screen reader users heavily rely on heading levels to build a mental map and quickly jump between hierarchical sections of the page. Skipping heading levels from h1 directly to h4 creates structural confusion and disrupts logical navigation. Maintaining an unbroken heading order provides an intuitive, well-organized hierarchy for assistive technology users.";
    case "link-name":
      return "Screen reader users frequently browse links using an interactive list where links are read completely out of context. Links labeled merely 'click here' fail to explain where the link leads or what action will occur upon clicking. Descriptive anchor text empowers assistive technology users to navigate efficiently with full context.";
    case "custom-positive-tabindex":
      return "Positive tabindex values override the natural document reading flow and cause the keyboard focus to jump unpredictably across unrelated sections. This unexpected behavior severely disorients keyboard users who rely on a logical, sequential progression through the interface. Removing positive tabindex restores natural DOM tab order and smooth keyboard navigation.";
    default:
      return "Assistive technology users rely on standard semantic HTML and accessible attributes to navigate and understand interactive components. When accessibility standards are breached, users experience confusion, inaccessible controls, or blocked workflows. Resolving this issue ensures that all users, regardless of ability or input method, enjoy an equitable experience.";
  }
}
