# Master Agent & Skill Execution Rules
**Target Project**: Tayyaba Enterprises (Copier Solutions & Reprographics Atelier — Est. 2003)
**Location**: DHA Phase VII, Karachi, Pakistan
**Scope**: Mandatory for all AI agents, subagents, and automated workflows operating in this repository.

---

## 🚨 MANDATORY PRE-EXECUTION DIRECTIVE

Before undertaking ANY coding, refactoring, design enhancement, security audit, or architectural modification, the AI assistant MUST:
1. **Audit & Consult All 20 Project Skills** located in `.agents/skills/` (and mirrored in global/project directories).
2. **Audit & Consult All 10 Specialized Agent Guidance Documents** located in `.agents/` and `.agents/rules/`.
3. **Strictly Apply Collective Intelligence & Principles** from every installed skill and agent BEFORE writing or modifying a single line of code.

---

## 📚 ACTIVE SKILLS REGISTRY & EXECUTION PLAYBOOKS (.agents/skills)

The AI assistant MUST actively incorporate thinking and execution patterns from all 20 installed skills across 3 core pillars:

### 1. Motion & Animation Core
- **`animate`**: High-fidelity spring physics, layout animations, exit/entrance transitions using `motion/react` and `dialkit`. Use to build motion from scratch with explicit property, curve, duration, and exit choices.
- **`animation-vocabulary`**: Standardized motion taxonomy (durations 180–250ms, spring stiffness 350, damping 15–20, easing curves). Resolves vague design terms into exact technical motion patterns.
- **`emil-design-eng`**: Emil Kowalski's design engineering principles (delightful micro-interactions, responsive spring dynamics, interruptible feedback loops, invisible details).
- **`find-animation-opportunities`**: Read-only UI scanner to identify missing interactive motion (hover states, scroll triggers, button feedback, modal morphs) with exact timing values.
- **`improve-animations`**: Codebase-wide motion audit and optimization roadmap to eliminate layout thrashing, enforce 60fps performance, and guarantee `prefers-reduced-motion` compliance.
- **`review-animations`**: Targeted audit of timing, frame rate bottlenecks, GPU property acceleration (`transform`, `opacity`), and reduced-motion fallback handling.
- **`transitions-dev`**: Production CSS transitions and layout morphing patterns (dropdowns, modals, badges, text/icon swaps, accordions, sliding tabs, skeleton shimmer).
- **`transitions-polish`**: Motion token alignment (duration, distance, scale, blur, easing) and timing refinement for open/close asymmetry and stagger offsets.

### 2. Design System & Craft Excellence
- **`apple-design`**: Premium Apple-inspired visual balance, spatial elegance, high-contrast typography, translucent glassmorphism materials (`surface-glass`), depth, and fluid micro-details.
- **`impeccable`**: World-class design system critique, visual hierarchy enforcement, bespoke component architecture, zero generic templates. Enforces 60/25/10/5 color ratios and 5-font typography.
- **`pick-ui-library`**: Strategic evaluation and composition of UI libraries (`motion/react`, `dialkit`, `@phosphor-icons/react`, Tailwind CSS v4).
- **`prototype`**: High-speed interactive prototyping for complex UI components before production code commitment.

### 3. GSAP Animation Engine
- **`gsap-core`**: Core GSAP API (`gsap.to()`, `from()`, `fromTo()`), custom easing, duration, stagger control, defaults, and `gsap.matchMedia()` for responsive motion.
- **`gsap-frameworks`**: Framework lifecycle cleanup on unmount (`ctx.revert()`), framework-agnostic scoping, selector isolation.
- **`gsap-performance`**: GPU acceleration optimization, layout thrashing prevention (`will-change: transform`, `transform` vs `left/top`), property batching.
- **`gsap-plugins`**: Strategic plugin usage (`ScrollToPlugin`, `ScrollSmoother`, `Flip`, `Draggable`, `SplitText`, `CustomEase`).
- **`gsap-react`**: React `useGSAP` hook management, React `ref` attachment, context scoping, and automatic unmount cleanup.
- **`gsap-scrolltrigger`**: Scroll-driven scrub animations, section pinning, trigger thresholds, start/end position math, refresh handling.
- **`gsap-timeline`**: Choreographed multi-stage sequence timelines (`gsap.timeline()`), position parameter control (`<`, `+=0.1`), nesting.
- **`gsap-utils`**: Utility functions (`clamp`, `mapRange`, `interpolate`, `random`, `snap`, `toArray`, `wrap`, `pipe`) for mathematical animation calculations.

---

## 🤖 SPECIALIZED AGENTS GUIDANCE FRAMEWORK (.agents/)

The AI assistant MUST align all code with the 10 dedicated project agent guidelines:

1. **`code-reviewer.md`**: Code health, modularity, zero dead code, strict TypeScript typing (no `any`), parameter limits (<=5), function length (<=50 lines), file size (<=500 lines).
2. **`design-motion-principles.md`**: Natural motion curves, GPU-accelerated rendering (`transform`, `opacity`), accessibility compliance, responsive breakpoints.
3. **`gsap-react.md`**: React GSAP context management, `useGSAP` hook lifecycle, ref validation, and memory leak prevention.
4. **`gsap-scrolltrigger.md`**: Scroll-driven pinning, scrub synchronization, ScrollTrigger refresh handling, and touch device performance.
5. **`lottie-animation.md`**: Vector Lottie animation integration, performance optimization, and container scaling.
6. **`motion-design.md`**: Framer Motion (`motion/react`) spring configurations, layout animations, AnimatePresence exit animations.
7. **`senior-frontend.md`**: High-performance React 19 architecture, clean component separation, custom hook extraction, memoization discipline.
8. **`senior-security.md`**: OWASP Top 10 input sanitization (`.replace(/<[^>]*>/g, '')`), email RFC validation, honeypot bot prevention, rate-limiting, CSP compliance.
9. **`web-animation-design.md`**: Easing curves, duration bounds (180–300ms), reduced-motion media query fallbacks.
10. **`ponytail.md`**: "Lazy Senior Dev" efficiency audit — zero over-engineering, deletion of unused code, maximum developer speed, no unnecessary abstractions (YAGNI).

---

## 🎨 BRAND DESIGN SYSTEM GOVERNANCE

### Color Ratio Protocol (60 / 25 / 10 / 5 Rule)
1. **60% Paper White (`#FAF8F2` / `var(--bg-paper)`)**: Primary canvas background for main sections.
2. **25% Rich Warm Ivory (`#EBE5D8` / `var(--bg-ivory)`)**: Alternating section backgrounds & callout panels.
3. **Elevated Surfaces (`#FDFCF8` / `var(--surface-paper)`)**: Card surfaces, modal containers, navbar glass pill (`var(--surface-glass)`).
4. **5% Deep Textured Emerald (`#064E3B` / `var(--emerald-deep)`)**: Primary brand color, CTA buttons, active nav indicators, statistics badges, laser scan lines.
5. **10% Rich Black (`#121212` / `var(--text-rich-black)`) & Charcoal (`#4A4A4A` / `var(--text-charcoal)`)**: Typography headings & body prose.
6. **Soft Stone (`#D8D3C7` / `var(--border-soft-stone)`)**: Hairline borders, dividers, inputs.

### 5-Font Typography System
1. **Display Headlines**: `Bricolage Grotesque` (`font-display` / `var(--font-display)`)
2. **Editorial Accents**: `Cormorant Garamond` (`font-editorial italic` / `var(--font-editorial)`)
3. **Body Copy**: `Geist` (`font-body` / `var(--font-body)`)
4. **UI Controls**: `Sofia Sans Condensed` (`font-interface uppercase` / `var(--font-interface)`)
5. **Metadata & Stats**: `JetBrains Mono` (`font-mono` / `var(--font-mono)`)

---

## ⚡ PONYTAIL EFFICIENCY & CODE QUALITY RULES

1. **YAGNI (You Aren't Gonna Need It)**: Do not create abstractions, wrapper components, or utility layers unless explicitly requested or required by multiple active usage sites.
2. **Reuse Existing Patterns**: Check existing utils (`src/lib/utils.ts`, `src/lib/gsap.ts`) and CSS classes (`src/index.css`) before writing new helpers.
3. **Deletion Over Addition**: Prefer clean refactoring that reduces net line count while maintaining or enhancing functionality.
4. **Root Cause Fixes**: Fix bugs at the source function/guard level rather than adding localized patches at individual caller sites.
5. **Strict TypeScript Typing**: No implicit or explicit `any` types. Define clear interfaces in `src/types.ts`.

---

## ⚙️ EXECUTION WORKFLOW FOR ALL TASKS

For every prompt, edit, or feature request:
1. **Read & Synthesize**: Consult relevant skills from `.agents/skills/` and agent guidelines from `.agents/`.
2. **Check Code Integrity**: Ensure changes preserve existing working logic and pass TypeScript compilation (`npm run lint`).
3. **Verify Production Build**: Ensure project compiles cleanly via `npm run build`.
4. **Verify Motion & Accessibility**: Ensure animations execute under 300ms, use GPU-accelerated properties (`transform`, `opacity`), and respect `@media (prefers-reduced-motion: reduce)`.
