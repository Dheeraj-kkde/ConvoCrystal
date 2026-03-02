# ConvoCrystal — Design System Gap Analysis

**Date:** March 2, 2026  
**Scope:** Full codebase audit against `convocrystal-design-system.html` specification  
**Files reviewed:** `fonts.css`, `theme.css`, `globals.css`, auth pages, `ChatPanel.tsx`, `DashboardPage.tsx`, `DocumentsPage.tsx`, `EditorPanel.tsx`, `Logo.tsx`, `MainLayout.tsx`, `MobileTabBar.tsx`, `NewUserTour.tsx`, `OnboardingOverlay.tsx`, `OverviewDashboard.tsx`

---

## Executive Summary

The codebase has strong architectural bones — Radix UI primitives, a centralized `ThemeContext`, responsive layouts, and a well-structured component hierarchy. However, there are **three critical compliance failures** that are pervasive across the entire codebase, plus several secondary issues. No component is fully spec-compliant as shipped.

| Severity    | Count | Categories                                                                                              |
| ----------- | ----- | ------------------------------------------------------------------------------------------------------- |
| 🔴 Critical | 5     | Typography, Color Palette (~70 instances), Button Variants, UploadFlow dark-only, ToastSystem dark-only |
| 🟡 Medium   | 4     | Token Naming, Rogue Violet (~25 instances), Dark Mode Attribute, Shadow Tokens                          |
| 🟢 Minor    | 4     | ConfidenceBadge (3 implementations), ProcessingStage, Border Radius, Toggle color                       |

---

## 🔴 Critical Issues

### 1. Typography — Wrong Fonts Loaded and Used

**Spec requires:**

- Display: `Syne` (headings, UI labels)
- Body: `Lora` (reading text)
- Mono: `DM Mono` (code, badges, timestamps)

**What the codebase has:**

- `fonts.css` loads: `DM Sans`, `JetBrains Mono`, `Fraunces`
- `theme.css` body: `font-family: DM Sans`
- None of the three specified fonts (`Syne`, `Lora`, `DM Mono`) are imported or used anywhere

**Impact:** Every piece of text in the application renders in the wrong typeface. The spec's major-third type scale (1.250×) and the distinct display/body/mono personality are entirely lost. This is the highest-priority fix.

**Affected files:** `fonts.css`, `theme.css`, `globals.css`, and by extension every component.

**Fix:** Replace `fonts.css` imports with Google Fonts or self-hosted equivalents for `Syne`, `Lora`, and `DM Mono`. Update `theme.css` to apply:

```css
--font-display: "Syne", sans-serif;
--font-body: "Lora", serif;
--font-mono: "DM Mono", monospace;
```

---

### 2. Color Palette — Wrong Primary Color Used Throughout

**Spec requires:**

- Crystal-500 (brand primary): `#5C6CF5`
- Crystal range: `#3A4AE8` → `#8F9BFF`
- Ice-500 (accent): `#00C9D6`

**What the codebase has:**

- Every component hardcodes `#6366F1` (Tailwind Indigo-500) as the primary color
- `theme.css` sets `--primary: #6366F1` — not spec's `#5C6CF5`
- `ThemeContext` exports `colors.indigo` as `#6366F1` — misnamed and wrong value
- Ice color used is `#06B6D4` (Tailwind Cyan-500), not spec's `#00C9D6`

**Pervasiveness — hardcoded `#6366F1` found in:**

- `ChatPanel.tsx`: 6 instances (user bubble bg, streaming cursor, send button, hover states)
- `EditorPanel.tsx`: 5 instances (AI refine button, toolbar active state, streaming border)
- `DocumentsPage.tsx`: 5 instances (icons, filter states, context menu hover)
- `OnboardingOverlay.tsx`: 6 instances (spotlight ring, progress dots, Next button)
- `MobileTabBar.tsx`: 1 instance (active tab color)
- `Logo.tsx`: Uses `#6366F1` / `#818CF8` / `#4F46E5` — all Indigo; spec crystal palette is `#5C6CF5` / `#8F9BFF` / `#3A4AE8`
- `NewUserTour.tsx`: 4 instances
- `DashboardPage.tsx`: 1 instance in `boxShadow`

**Fix:**

1. Replace `--primary` in `theme.css` with `#5C6CF5` and define the full Crystal scale using spec token names.
2. Rename `colors.indigo` in `ThemeContext` to `colors.crystal` and correct the value.
3. Replace all 30+ hardcoded instances of `#6366F1` with `colors.crystal` or `var(--crystal-500)`.
4. Update `Logo.tsx` gradient stops to use Crystal values.
5. Fix Ice color: `#06B6D4` → `#00C9D6`.

---

### 3. Button Variants — Missing and Misnamed

**Spec requires 5 variants:** `primary`, `secondary`, `ghost`, `ice`, `danger`

**What the codebase has:** `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`

**Gaps:**

- `ice` variant — **entirely absent.** The spec's Ice palette (`#00C9D6`) should be a first-class button style used for secondary calls-to-action. Currently no button in the UI uses this treatment.
- `danger` vs `destructive` — naming mismatch. The spec names this variant `danger`; the codebase uses `destructive` (shadcn/ui's default name). While functionally equivalent, this breaks token consistency.
- `primary` vs `default` — same mismatch. Spec calls the main CTA `primary`; codebase inherits shadcn's `default`.

**Affected usage:** Delete buttons in `DocumentsPage`, Stop-streaming button in `ChatPanel` (uses raw inline styles instead of a variant), Accept/Reject buttons in `EditorPanel`.

**Fix:** Add `ice` and `danger` variant definitions to the Button component. Alias `default` → `primary`. Update all usage sites.

---

## 🟡 Medium Issues

### 4. Token Naming Convention — Void Scale Not Implemented

**Spec defines:** `--void-0` through `--void-1000` for the neutral/background scale (e.g., `--void-0: #FFFFFF`, `--void-950: #0D0E16`, `--void-1000: #090A12`).

**What the codebase has:** Custom `--cc-*` tokens (`--cc-bg`, `--cc-panel`, `--cc-border`, etc.) with no relationship to the spec's void scale naming. The `ThemeContext` exports `colors.bgBase`, `colors.bgPanel`, `colors.border` — semantically reasonable but not spec-named.

**Impact:** Medium. The naming inconsistency means designers and developers are speaking different languages. Design handoff, documentation, and future token-based theming will diverge.

**Fix:** Add void scale tokens to `theme.css` as the canonical source, then map `--cc-*` values onto them (or replace them entirely).

---

### 5. Purple / Violet Color — Not in Spec Palette

**Spec palette:** Crystal (indigo-adjacent), Ice (cyan-adjacent), Void (neutrals), plus semantic colors (success `#10B981`, warning `#F59E0B`, danger `#F43F5E`).

**What the codebase uses:** `#8B5CF6` (Tailwind Violet-500) appears in `DocumentsPage.tsx` (exported badge), `NewUserTour.tsx` (editor slide, export colors), `OverviewDashboard.tsx` (precision metric), and `OnboardingOverlay.tsx`.

This is a rogue color with no spec basis. It was likely introduced for visual variety but creates a fourth accent hue outside the design system.

**Fix:** Map these usages to Ice (`#00C9D6`) or Crystal as appropriate, or formally add a `violet` swatch to the spec palette if product intent supports it.

---

### 6. Dark Mode Implementation — Wrong Attribute

**Spec specifies:** `[data-theme="dark"]` on the root element for dark mode styles.

**What the codebase has:** The `ThemeContext` toggles `document.documentElement.classList` (`.dark` class), following Tailwind's dark mode convention. The spec's `data-theme` attribute is never set.

**Impact:** Any CSS written using the spec's `[data-theme="dark"]` selector will never activate. This creates a future maintenance trap as styles are added.

**Fix:** In `ThemeContext`, add `document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')` alongside the class toggle. Or adopt one convention and ensure the spec is updated to match.

---

### 7. Shadow Tokens — Not Used

**Spec defines:** `--shadow-crystal` and `--shadow-ice` as named elevation tokens.

**What the codebase has:** Inline boxShadow strings everywhere, e.g.:

- `ChatPanel`: `"0 0 8px rgba(99,102,241,0.15)"` (wrong color, no token)
- `DashboardPage`: `"0 4px 16px rgba(99,102,241,0.35)"` (wrong color, no token)
- `DocumentsPage` empty state button: `"0 4px 16px rgba(99,102,241,0.25)"`

None of these reference `--shadow-crystal` or `--shadow-ice`.

**Fix:** Define `--shadow-crystal` and `--shadow-ice` in `theme.css` with the spec values. Replace all inline shadow strings with `var(--shadow-crystal)` or `var(--shadow-ice)` as appropriate.

---

## 🟢 Minor Issues

### 8. `ConfidenceBadge` — Implemented Inline, Not as Component

The spec defines `ConfidenceBadge` as a named, reusable component. The codebase has a local `ConfidencePanel` function inside `ChatPanel.tsx` and inline confidence rendering in `OverviewDashboard.tsx`. These are functionally correct but not extracted as a shared component.

**Fix:** Extract to `src/app/components/ConfidenceBadge.tsx` matching the spec's component API.

---

### 9. `ProcessingStage` — Implemented Inline

The spec defines a `ProcessingStage` component for showing multi-step AI progress. In `ChatPanel.tsx`, this is rendered as local JSX (the `stageSteps` array with `CheckCircle2`/`Loader2`/`ArrowRight` elements) rather than a reusable component.

**Fix:** Extract to `src/app/components/ProcessingStage.tsx`.

---

### 10. Border Radius — Not Using Spec Tokens

**Spec defines:** `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-full`.

**What the codebase has:** Tailwind utility classes (`rounded-xl`, `rounded-full`, `rounded-lg`) and inline `borderRadius` strings (`"12px 12px 4px 12px"` for chat bubbles). The spec tokens are never referenced.

**Fix:** Define radius tokens in CSS. For non-standard values like the asymmetric chat bubble radius, document these as intentional exceptions.

---

---

## Additional Findings — Final Batch

### ThemeContext.tsx — The Root of the Color Problem

This file is the canonical source of the issue. The `ThemeColors` interface exports `indigo`, `teal`, and `violet` as named tokens — none of which match spec naming. Critically, `violet: "#8B5CF6"` is formally part of the theme system, which explains its pervasive use throughout the codebase. This is not an accidental one-off — it's a designed-in deviation. The spec has no violet token.

Additionally, `ThemeContext` never calls `document.documentElement.setAttribute('data-theme', ...)`, confirming that the spec's `[data-theme="dark"]` selector will never fire in the current implementation.

### ToastSystem.tsx — Dark Mode Hardcoded

`ToastSystem` is entirely hardcoded to dark mode values regardless of the current theme: `background: "#1A1D2E"`, text colors `#E8EAF6` and `#9BA3C8`, border `#2A2D42`. It ignores `useTheme()` entirely. In light mode, toasts will render with dark backgrounds — a visual defect. The `info` variant correctly uses `#6366F1` (wrong Crystal value) and `#6366F1` for the border.

### UploadFlow.tsx — Fully Hardcoded, No Theme Integration

`UploadFlow` is the most isolated component in the codebase — it never calls `useTheme()` and hardcodes every color as a literal. All values use the dark palette exclusively:

- Background: `#0B0C10`, `#1A1D2E`
- Borders: `#2A2D42`
- Text: `#E8EAF6`, `#9BA3C8`, `#5C6490`
- Primary: `#6366F1` (wrong)
- Ice accent on format chips: `#06B6D4` (wrong — should be `#00C9D6`)

This modal will be broken in light mode. It also uses `#6366F1` 8 times for the upload button, progress ring, file icon, and hover states.

### VersionControl.tsx — Partially Theme-Aware, Color Values Wrong

`VersionControl` correctly calls `useTheme()` and derives local variables from `isDark`. However, it then hardcodes `#6366F1` 9 times for the Restore button, active filter states, HEAD badge, timeline dot, and progress indicators — rather than using `colors.indigo`. It also uses `#8B5CF6` for user avatar backgrounds (the rogue violet token again). The diff view semantic colors (red/green for additions/deletions) are acceptable and intentional.

### SettingsPage.tsx — Toggle Component Uses Wrong Color

The reusable `Toggle` component inside `SettingsPage` hardcodes `backgroundColor: enabled ? "#6366F1" : colors.border` — the wrong Crystal value. This toggle is used 8 times across the settings panels. The active-section indicator in the settings sidebar also hardcodes `bg-[#6366F1]` twice (desktop left-border and mobile underline).

The avatar gradient `from-[#6366F1] to-[#8B5CF6]` uses wrong Crystal + rogue violet. The Save button hardcodes `backgroundColor: saved ? "#10B981" : "#6366F1"` (semantic green is fine; Crystal value is wrong).

### Sidebar.tsx — Upload Button and Active States Hardcoded

The "Upload Transcript" button uses `bg-[#6366F1] hover:bg-[#818CF8]` (Tailwind utilities) rather than tokens. The active nav item left-border indicator hardcodes `bg-[#6366F1]`. The collapsed user avatar hardcodes `bg-[#6366F1]`. The expanded user avatar also hardcodes `bg-[#6366F1]`. Total: 6 hardcoded Crystal-wrong instances in this file.

The `ConfidenceBadge` in `Sidebar.tsx` is a third independent inline implementation (joining the ones in `ChatPanel` and `OverviewDashboard`), confirming this component needs to be extracted.

### ProgressTracker.tsx — Violet Token Used from ThemeContext

`ProgressTracker` correctly reads `colors.indigo` from `ThemeContext` for the progress bar and ring — so once `ThemeContext` is corrected, this file will automatically inherit the right value. However, `stepColors.refine` is hardcoded as `"#8B5CF6"` (violet, not in spec), and `stepColors.upload` is `"#6366F1"` (wrong Crystal).

### WelcomePage.tsx — Gradient Uses Wrong Colors

The hero logo gradient `from-[#6366F1] to-[#8B5CF6]` uses wrong Crystal + rogue violet. CTA button gradient `#6366F1` → `#818CF8` uses wrong Crystal range. The "Convo**Crystal**" brand name text hardcodes `color: "#6366F1"`. Confidence scoring preview uses `#8B5CF6` for Precision (violet, not in spec). Total: 7 wrong-color instances.

### TopBar.tsx — Brand Name and Logo Use Wrong Color

`"Convo<span style={{ color: '#6366F1' }}>Crystal</span>"` — the brand name's accent color is hardcoded with the wrong Crystal value. The workspace switcher icon uses `#8B5CF6/20` and `text-[#8B5CF6]` (rogue violet). Notification dot hardcodes `bg-[#6366F1]`. All hover states use `hover:bg-[#6366F1]/10` (Tailwind utilities, wrong value). Total: 6 wrong instances.

### UserContext.tsx and Logo.tsx — No Compliance Issues

`UserContext` has no color dependencies and is fully compliant. `Logo.tsx` uses `#818CF8`, `#6366F1`, `#4F46E5`, `#C7D2FE` — all Tailwind Indigo, none matching the Crystal spec palette (`#5C6CF5`, `#8F9BFF`, `#3A4AE8`). This is the brand mark and is particularly high-visibility.

---

## Complete Instance Count

After reviewing all 20 files, the hardcoded `#6366F1` (wrong Crystal) appears **approximately 70 times** across the codebase. `#8B5CF6` (rogue violet) appears approximately **25 times**. `#06B6D4` (wrong Ice) appears approximately **12 times**.

---

## Summary Table

| #   | Issue                                                                 | Severity    | Files Affected                                | Effort                              |
| --- | --------------------------------------------------------------------- | ----------- | --------------------------------------------- | ----------------------------------- |
| 1   | Wrong fonts (DM Sans/JetBrains/Fraunces instead of Syne/Lora/DM Mono) | 🔴 Critical | All                                           | Low — font swap                     |
| 2   | Wrong primary color (#6366F1 instead of #5C6CF5) — ~70 instances      | 🔴 Critical | All 20 files                                  | Medium — token fix + global replace |
| 3   | Missing `ice` button variant; `danger`/`primary` naming mismatches    | 🔴 Critical | Button.tsx + usage sites                      | Low                                 |
| 4   | `UploadFlow` ignores `useTheme()` — dark-only, broken in light mode   | 🔴 Critical | UploadFlow.tsx                                | Medium — full refactor              |
| 5   | `ToastSystem` ignores `useTheme()` — dark-only, broken in light mode  | 🔴 Critical | ToastSystem.tsx                               | Low — add useTheme()                |
| 6   | Void scale token naming not implemented                               | 🟡 Medium   | theme.css, ThemeContext                       | Low                                 |
| 7   | Rogue `#8B5CF6` violet (~25 instances) — not in spec palette          | 🟡 Medium   | 10+ files                                     | Low — global replace                |
| 8   | Dark mode uses `.dark` class instead of `[data-theme="dark"]`         | 🟡 Medium   | ThemeContext                                  | Low                                 |
| 9   | Shadow tokens unused — inline strings throughout                      | 🟡 Medium   | ChatPanel, DashboardPage, WelcomePage, others | Low                                 |
| 10  | `ConfidenceBadge` has 3 independent inline implementations            | 🟢 Minor    | ChatPanel, OverviewDashboard, Sidebar         | Low — extract component             |
| 11  | `ProcessingStage` not extracted as shared component                   | 🟢 Minor    | ChatPanel, UploadFlow                         | Low                                 |
| 12  | Border radius uses Tailwind classes, not spec tokens                  | 🟢 Minor    | All                                           | Low                                 |
| 13  | `Toggle` component in SettingsPage hardcodes wrong color              | 🟢 Minor    | SettingsPage                                  | Trivial                             |

---

## Recommended Remediation Order

**Phase 1 — Token Foundation (do first, unblocks everything else)**

1. Fix `fonts.css`: swap to Syne + Lora + DM Mono
2. Fix `ThemeContext.tsx`: rename `indigo` → `crystal`, set value to `#5C6CF5`; rename `teal` → `ice`, set to `#00C9D6`; remove `violet` or map to a spec-blessed alias; add `data-theme` attribute toggle
3. Fix `theme.css`: update `--primary` to `#5C6CF5`, add void scale tokens, add shadow tokens, add radius tokens
4. Global find/replace: `#6366F1` → `var(--crystal-500)` / `colors.crystal`; `#06B6D4` → `colors.ice`

**Phase 2 — Theme Integration** 5. Refactor `UploadFlow.tsx` to use `useTheme()` — currently 100% dark-only 6. Refactor `ToastSystem.tsx` to use `useTheme()` — currently 100% dark-only 7. Audit and remove `#8B5CF6` violet from all files; replace with Ice or Crystal as context demands

**Phase 3 — Component Variants** 8. Add `ice` and `danger` Button variants; alias `default` → `primary` 9. Extract shared `ConfidenceBadge` component (3 current implementations) 10. Extract shared `ProcessingStage` component (2 current implementations)

**Phase 4 — Cleanup** 11. Fix `Logo.tsx` gradient stops to Crystal palette 12. Replace inline `borderRadius` strings with token references 13. Fix `Toggle` in `SettingsPage` to use `colors.crystal`

---

## What's Working Well

- Radix UI primitives used correctly for all interactive elements ✓
- `ThemeContext` + `useTheme()` hook adopted consistently across 17 of 20 components ✓
- Responsive layout strategy (mobile/tablet/desktop breakpoints) is solid and well-executed ✓
- Component structure is clean and modular — easy to refactor ✓
- Semantic color usage (success `#10B981`, warning `#F59E0B`, danger `#F43F5E`) is consistent and matches spec intent ✓
- `data-onboarding` attribute pattern for spotlight targets is well-implemented ✓
- Animation and transition patterns (Framer Motion usage) align with spec's motion guidance ✓
- `UserContext` and `ProgressTracker` architecture are clean with no compliance issues ✓
- `VersionControl` diff view is semantically correct for addition/deletion colors ✓
