# Implementation Plan: Cat Clicker

## Overview

Implement Cat Clicker as a single `index.html` file using HTML5, Tailwind CSS (CDN), and vanilla JavaScript (ES6+, IIFE pattern). The implementation proceeds from the static shell outward — layout and SVG cat first, then state and logic, then interactions and animations, then idle behavior, finishing with accessibility polish and a property-based test suite via Vitest + fast-check.

---

## Tasks

- [x] 1. Scaffold the HTML shell and static layout
  - [x] 1.1 Create `index.html` with Tailwind CDN, `<style>` block for custom keyframes, and the `#app-container / #cat-wrapper / #cat / #speech-bubble / #pet-counter` DOM structure
    - Use semantic markup; `#app-container` is a full-viewport flex container (centered)
    - Add placeholder SVG shapes for `#cat` (will be refined in 2.1)
    - Add `#speech-bubble` div with `hidden` class and `#pet-counter` paragraph
    - _Requirements: 1.1, 1.2, 5.1, 5.4_
  - [x] 1.2 Apply Tailwind utility classes for responsive layout
    - Single-column layout below 640px; centered block with `max-w-5xl` (≤ 1280px) at 640px+
    - Ensure no horizontal overflow from 320px to 1920px
    - _Requirements: 7.1, 7.4_

- [x] 2. Implement the Cat SVG and visual defaults
  - [x] 2.1 Build the inline Cat SVG using geometric primitives
    - Two filled circles (eyes), arc (smile), two triangles (ears), outer oval/circle (head)
    - Set `viewBox` and responsive CSS width (`min-w-[120px]`, scales with viewport)
    - _Requirements: 1.2, 1.3, 7.2_
  - [x] 2.2 Define all CSS keyframe animations in the `<style>` block
    - Keyframes: `cat--bouncing`, `cat--spinning`, `cat--squishing` (cat animations)
    - Keyframes: `floatUp` (floating hearts), `burst` (star burst particles)
    - Keyframes: `idleYawn`, `counterCelebrate`
    - _Requirements: 3.3, 3.5, 5.5, 6.3_

- [ ] 3. Implement core state module and pure logic functions (inside IIFE)
  - [x] 3.1 Define the `AppState` object and wire accessor functions
    - `state` object with: `petCount`, `lastReactionId`, `isIdle`, `idleEntryTimer`, `idleBehaviorTimer`, `activeSpeechBubbleTimer`, `activeAnimation`
    - _Requirements: 2.3, 2.4_
  - [-] 3.2 Implement `incrementCounter(state)` — increments `petCount` by 1 and returns new value
    - Pure function (no DOM side effects); called by `registerPet()`
    - _Requirements: 2.4_
  - [ ]* 3.3 Write property test for `incrementCounter` (Property 1)
    - **Property 1: Pet counter increments by exactly 1 per pet**
    - Generate random N (1–1000), call `incrementCounter` N times, assert final count = N
    - **Validates: Requirements 2.1, 2.4**
  - [-] 3.4 Implement `selectReaction(pool, lastId)` — returns a random pool entry that differs from `lastId`
    - Guard: if pool size ≤ 1, skip the "different from last" check
    - _Requirements: 2.2, 3.1, 3.2_
  - [ ]* 3.5 Write property test for `selectReaction` — no-immediate-repeat (Property 2)
    - **Property 2: Reaction never repeats immediately**
    - Generate sequences of 2–50 selections, assert no two adjacent entries share the same `id`
    - **Validates: Requirements 3.2**
  - [ ]* 3.6 Write property test for `selectReaction` — uniform distribution (Property 3)
    - **Property 3: Reaction selection is approximately uniform over the eligible pool**
    - Run 200 selections, assert each eligible reaction appears with frequency ≈ 1/(pool−1) ± 20%
    - **Validates: Requirements 2.2, 3.2**
  - [-] 3.7 Implement `selectPhrase(phrases)` — returns a random member of the phrase array
    - _Requirements: 4.1_
  - [ ]* 3.8 Write property test for `selectPhrase` (Property 6)
    - **Property 6: Speech bubble phrase is always a member of the phrase pool**
    - Generate phrase-pool arrays, assert every result is a member of that array
    - **Validates: Requirements 4.1**
  - [-] 3.9 Implement `shouldCelebrate(count)` — returns `true` only for non-zero multiples of 10
    - _Requirements: 5.5_
  - [ ]* 3.10 Write property test for `shouldCelebrate` (Property 9)
    - **Property 9: Celebratory effect triggers on every non-zero multiple of 10**
    - For any positive integer k, assert `shouldCelebrate(k * 10) === true`; assert `shouldCelebrate(n) === false` for all non-multiples
    - **Validates: Requirements 5.5**
  - [-] 3.11 Implement `isWhitespacePet(event)` — returns `true` for Space/Enter, `false` otherwise
    - _Requirements: 8.2_

- [~] 4. Checkpoint — Ensure all unit / property tests for pure logic pass
  - Run `npx vitest --run` and confirm tests from tasks 3.3, 3.5, 3.6, 3.8, 3.10 are green.
  - Ask the user if any questions arise before continuing.

- [ ] 5. Implement the Reaction Pool and Phrase Pool data
  - [~] 5.1 Define the `reactionPool` array (minimum 10 entries) matching the Reaction Object schema
    - Include: bounce, spin, squish (animation); purr, happy, boop (speech); hearts, stars (effect); bounce-purr, spin-hearts (combo)
    - _Requirements: 3.1, 3.3, 3.4, 3.5_
  - [~] 5.2 Define the `phrases` array (minimum 12 entries from the design's phrase pool)
    - _Requirements: 4.1, 4.2_

- [ ] 6. Implement the Pet Counter component
  - [~] 6.1 Implement `counter.increment()`, `counter.getCurrent()`, and `counter.celebrate()` against `#pet-counter`
    - `increment()` updates `petCount` and sets `textContent = "Times petted: {count}"`
    - `celebrate()` adds `counterCelebrate` CSS class, removes after 1000ms
    - _Requirements: 2.4, 5.1, 5.2, 5.3, 5.4, 5.5_
  - [ ]* 6.2 Write property test for counter display format (Property 8)
    - **Property 8: Counter display always matches the format "Times petted: N"**
    - Generate random non-negative integer N, assert `#pet-counter` textContent === `"Times petted: N"`
    - **Validates: Requirements 5.3**

- [ ] 7. Implement the Speech Bubble component
  - [~] 7.1 Implement `speechBubble.show(phrase)` and `speechBubble.hide()` against `#speech-bubble`
    - `show`: cancel existing `activeSpeechBubbleTimer`, set `textContent`, remove `hidden`, start 1500ms `setTimeout(hide)`
    - `hide`: clear timer, add `hidden`
    - _Requirements: 4.1, 4.3, 4.4_
  - [ ]* 7.2 Write property test for speech bubble replacement (Property 7)
    - **Property 7: New speech bubble always replaces an existing one with a fresh timer**
    - Simulate two rapid triggers; assert first timer cleared, second phrase shown with fresh 1500ms timer
    - **Validates: Requirements 4.4**

- [ ] 8. Implement the Animation Engine
  - [~] 8.1 Implement `animationEngine.play(animationClass, durationMs, onComplete)` and `animationEngine.stop()`
    - `play`: apply class to `#cat`, set `setTimeout` for cleanup, call `onComplete` after `durationMs`
    - `stop`: clear pending timer, remove all animation classes, restore `cat--default`
    - _Requirements: 3.3, 3.6_
  - [ ]* 8.2 Write property test for animation cleanup (Property 15)
    - **Property 15: Animation cleanup always restores default appearance within 600ms**
    - For any animation reaction, after `durationMs`, assert no animation CSS classes remain on `#cat`
    - **Validates: Requirements 3.6**

- [ ] 9. Implement the Visual Effects Engine
  - [~] 9.1 Implement `floatingHearts()` and `starBurst()` visual effect functions
    - Create temporary DOM elements, append to `#app-container`, animate via CSS keyframes, remove on `animationend`
    - _Requirements: 3.5_

- [ ] 10. Implement the core `registerPet()` orchestrator
  - [~] 10.1 Wire `registerPet()` to call `counter.increment()`, `selectReaction()`, `animationEngine.play()` / `speechBubble.show()` / visual effects, and `idleController.reset()`
    - Each call to `registerPet()` is fully independent — no queuing or merging
    - _Requirements: 2.1, 2.2, 2.4, 2.5_
  - [ ]* 10.2 Write property test for rapid-succession independence (Property 4)
    - **Property 4: Each pet in a rapid sequence triggers exactly one independent reaction**
    - Generate N rapid pets (≤300ms apart), assert reactions array length = N
    - **Validates: Requirements 2.5**

- [ ] 11. Implement event handlers and accessibility attributes
  - [~] 11.1 Attach `click`, `keydown` (Space/Enter), and `touchstart` event listeners to `#cat`
    - `touchstart`: call `event.preventDefault()` to suppress synthetic click double-fire
    - `keydown`: use `isWhitespacePet(event)` gate before calling `registerPet()`
    - _Requirements: 2.1, 2.5, 2.6, 7.3, 8.2_
  - [~] 11.2 Set `tabindex="0"` and `aria-label` on `#cat`; add Tailwind `focus-visible:ring` classes for focus indicator
    - `aria-label`: "Cat — click or press Space/Enter to pet"
    - _Requirements: 8.1, 8.3, 8.5_
  - [ ]* 11.3 Write property test for clicks-outside-cat (Property 5)
    - **Property 5: Clicks outside the cat's bounding box never register a pet**
    - Generate random (x, y) outside cat bounding rect; assert `petCount` unchanged
    - **Validates: Requirements 2.6**

- [~] 12. Checkpoint — Smoke test core pet interaction end-to-end
  - Write an integration test that loads `index.html`, performs one click on `#cat`, and asserts `#pet-counter` text changes from "Times petted: 0" to "Times petted: 1"
  - Verify `#cat` has `tabindex="0"` and non-empty `aria-label`
  - Ask the user if any questions arise before continuing.

- [ ] 13. Implement the Idle State Controller
  - [~] 13.1 Implement `idleController.reset()`, `idleController.enterIdle()`, and `idleController.stopBehavior()`
    - `reset()`: cancel `idleEntryTimer` + `idleBehaviorTimer`, set `state.isIdle = false`
    - `enterIdle()`: set `state.isIdle = true`, schedule first idle behavior with random 5–10s interval
    - Idle behavior: show "…" speech bubble or play `idleYawn` animation on `#cat`
    - Recurring: after each idle behavior completes, schedule next with fresh random 5–10s interval
    - `stopBehavior()`: cancel `idleBehaviorTimer` immediately
    - `registerPet()` must call `idleController.reset()` then schedule next `idleController.enterIdle()` via `setTimeout(5000)`
    - _Requirements: 1.4, 6.1, 6.2, 6.3, 6.4, 6.5_
  - [ ]* 13.2 Write property test for idle reset on every pet (Property 10)
    - **Property 10: Idle countdown resets on every pet regardless of timing**
    - Generate random T ∈ [0, 4999]ms; register pet at T; assert idle not entered before 5000ms from new pet
    - **Validates: Requirements 6.2**
  - [ ]* 13.3 Write property test for idle behavior interval range (Property 11)
    - **Property 11: Idle behavior repeats at intervals within [5s, 10s] while idle**
    - Run N idle behavior cycles; assert each interval ∈ [5000, 10000]ms and N behaviors triggered
    - **Validates: Requirements 6.3, 6.4**
  - [ ]* 13.4 Write property test for pet-cancels-idle (Property 12)
    - **Property 12: A pet while idle cancels idle state and triggers a reaction**
    - Enter idle state; register pet at random point; assert `state.isIdle === false` and reaction count incremented
    - **Validates: Requirements 6.5**

- [ ] 14. Implement responsive layout verification and WCAG contrast
  - [~] 14.1 Verify Tailwind classes produce no horizontal overflow at 320px–1920px
    - Add a `meta viewport` tag if missing; confirm `#app-container` uses `overflow-x-hidden` or equivalent
    - _Requirements: 7.1_
  - [~] 14.2 Verify cat minimum rendered dimension ≥ 120px at all supported viewport widths
    - Set responsive width on `#cat-wrapper` (e.g., `w-[min(40vw,400px)]` with `min-w-[120px]`)
    - _Requirements: 7.2_
  - [ ]* 14.3 Write property test for no horizontal overflow (Property 13)
    - **Property 13: No horizontal overflow at any supported viewport width**
    - Generate random W ∈ [320, 1920]; set `window.innerWidth = W`; assert `document.body.scrollWidth ≤ W`
    - **Validates: Requirements 7.1**
  - [ ]* 14.4 Write property test for cat minimum dimension (Property 14)
    - **Property 14: Cat minimum rendered dimension is at least 120px at any supported viewport width**
    - Generate random W ∈ [320, 1920]; assert `min(cat.getBoundingClientRect().width, cat.getBoundingClientRect().height) ≥ 120`
    - **Validates: Requirements 7.2**

- [ ] 15. Set up Vitest + fast-check test harness
  - [ ] 15.1 Create `package.json` with `vitest` and `fast-check` as dev dependencies; add `"test": "vitest --run"` script
    - Export pure functions (`incrementCounter`, `selectReaction`, `selectPhrase`, `shouldCelebrate`, `isWhitespacePet`) from a `catClicker.js` module for testability
    - _Requirements: (testing infrastructure, supports all property requirements)_
  - [ ]* 15.2 Write integration / smoke tests
    - Page load: counter initializes to "Times petted: 0"
    - Accessibility: `#cat` has `tabindex="0"` and non-empty `aria-label`
    - Idle entry: fake timers advance 5100ms, assert `state.isIdle === true`
    - _Requirements: 2.3, 5.4, 6.1, 8.1, 8.3_

- [~] 16. Final checkpoint — All tests green, visual review
  - Run `npx vitest --run` and confirm all property tests and integration tests pass.
  - Visually verify animations, speech bubbles, idle behavior, and focus ring in a browser at 320px and 1440px viewport widths.
  - Ask the user if any questions arise before wrapping up.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build.
- Each task references specific requirement numbers for full traceability.
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) with Vitest as the runner.
- Pure functions (`incrementCounter`, `selectReaction`, `selectPhrase`, `shouldCelebrate`, `isWhitespacePet`) must be exported from a separate module to be unit/property-testable without a browser environment.
- All DOM-dependent tests (Properties 5, 7, 8, 13, 14) use jsdom (built into Vitest's `environment: 'jsdom'` mode).
- Checkpoints at tasks 4, 12, and 16 gate further progress on test health.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2", "3.1"] },
    { "id": 2, "tasks": ["3.2", "3.4", "3.7", "3.9", "3.11", "15.1"] },
    { "id": 3, "tasks": ["3.3", "3.5", "3.6", "3.8", "3.10", "5.1", "5.2"] },
    { "id": 4, "tasks": ["6.1", "7.1", "8.1", "9.1"] },
    { "id": 5, "tasks": ["6.2", "7.2", "8.2", "10.1"] },
    { "id": 6, "tasks": ["10.2", "11.1"] },
    { "id": 7, "tasks": ["11.2", "11.3"] },
    { "id": 8, "tasks": ["13.1", "14.1", "14.2", "15.2"] },
    { "id": 9, "tasks": ["13.2", "13.3", "13.4", "14.3", "14.4"] }
  ]
}
```
