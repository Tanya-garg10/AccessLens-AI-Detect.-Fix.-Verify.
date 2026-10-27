# AccessLens AI — 3-Minute Live Product Demo Script

**Theme:** Detect. Fix. Verify.  
**Audience:** Accessibility engineers, engineering leaders, product designers.  
**Objective:** Demonstrate an end-to-end autonomous accessibility remediation loop from an initial broken score (~45) to verified compliance (90+) with deterministic authority.

---

## ⏱ Timeline Breakdown (Total: 3 Minutes)

### [0:00 – 0:35] Scene 1: The Inaccessible Reality
- **Visual:** Open `http://localhost:3000` (AccessLens landing page) and show the fake coffee shop page (`demo/broken-site.html`).
- **Narrator (Speaking):**
  > "Over 96% of the world's top one million web pages fail basic WCAG accessibility checks. Modern websites look visually polished on the surface, but underneath they are littered with missing alt tags, broken form labels, poor contrast, and keyboard focus traps.
  > 
  > This is **Aura Brew**, a realistic artisanal coffee shop page. It looks great to sighted mouse users, but it contains 15 severe accessibility barriers. Let's see what happens when we audit it with AccessLens AI."
- **Action:** Click the **"Try the broken demo page"** button on the home screen.

---

### [0:35 – 1:10] Scene 2: Automated Detection & Live Streaming
- **Visual:** The progress stepper lights up via Server-Sent Events (SSE):
  `Queued` ➔ `Rendering (Chromium)` ➔ `Detecting (axe-core & keyboard)` ➔ `Normalizing`.
  The Dashboard renders: **Score: ~45 / 100**, highlighting 15 violations across Critical, Serious, Moderate, and Minor severities.
- **Narrator (Speaking):**
  > "Notice our live SSE pipeline. AccessLens doesn't just run static linters; it spawns a headless Chromium instance, simulates real user Tab navigation to test focus order and traps, and executes axe-core 4.10 rules.
  > 
  > The result is a baseline score of **45 out of 100**. We see positive tabindexes, buttons coded as clickable divs without roles, missing image descriptions, and severe contrast failures."
- **Action:** Click on the `custom-clickable-non-semantic` row in the issue table. The side Sheet slides out.
- **Narrator (Speaking):**
  > "Clicking any issue opens our deep inspection panel. Watch this: clicking **'Why does this matter?'** generates a screen reader perspective explaining why a keyboard user is completely unable to activate this control."

---

### [1:10 – 1:55] Scene 3: Contextual AI Code Diff & Remediation
- **Visual:** Click **"Generate AI fixes"**. Fixes appear with confidence meters. Click **"Verify & Diff"** to enter `/scan/[id]/fix`.
- **Narrator (Speaking):**
  > "Now, we invoke our specialized LLM remediation agent. Unlike generic code generators that hallucinate or strip design styles, AccessLens enforces strict boundaries:
  > 
  > 1. It only proposes minimal, semantic HTML patches.
  > 2. Contrast colors are calculated mathematically, not guessed.
  > 3. Subjective elements like alt text are flagged with **'Needs manual review'**.
  > 
  > Here in the Monaco DiffEditor, we can cycle through every proposed change side-by-side. On the left is the broken snippet; on the right is the accessible standard."
- **Action:** Toggle through a couple of diffs (e.g., `#cust-name` label addition, hamburger `aria-label`). Show the **"Sandboxed Visual Preview"** tab comparing before/after without scripts.

---

### [1:55 – 2:35] Scene 4: Deterministic Verification (The Core Differentiator)
- **Visual:** Click **"Apply All"**, then click the **"Verify Patches"** button.
- **Narrator (Speaking):**
  > "Here is our most important architectural principle: **The AI NEVER decides that an issue is fixed.**
  > 
  > When I click 'Verify Patches', AccessLens injects the patches into an isolated Playwright sandbox and re-runs the entire axe-core audit suite and keyboard focus tests from scratch. If a violation persists, it fails. Only deterministically cleared rules are marked fixed."
- **Action:** The score animates from **45 ➔ 92 (+47 points)**!
- **Narrator (Speaking):**
  > "Our score jumps from 45 to 92. The verification summary categorizes 13 rules as definitively cleared, leaving only 2 items flagged for human review."

---

### [2:35 – 3:00] Scene 5: Human Review & Closing Vision
- **Visual:** Highlight the **"Needs Manual Review"** badge list and trigger an export of the audit report in HTML/Markdown.
- **Narrator (Speaking):**
  > "We openly acknowledge that automated tools only catch approximately 30 to 40 percent of WCAG criteria. That's why AccessLens pairs automated patches with clear human-in-the-loop audit trails and multi-format exports.
  > 
  > AccessLens transforms accessibility from a manual compliance tax into a continuous, verified guarantee. **Detect. Fix. Verify.** Because an accessible web is a better web for everyone."
