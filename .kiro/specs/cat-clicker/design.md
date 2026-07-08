# Design Document: Cat Clicker

## Overview

Cat Clicker is a single-page web application (SPA) rendered entirely in the browser with no backend. The user interacts with a cute, minimalist cat character by clicking or tapping it, triggering randomized visual reactions and speech bubbles. The app tracks a persistent session-level pet counter and maintains an idle state when the user pauses.

**Tech stack:**
- HTML5 (semantic markup)
- Tailwind CSS (utility-first styling via CDN)
- Vanilla JavaScript (ES6+, no framework, no build step)

**Key design goals:**
- Zero dependencies beyond a Tailwind CDN link
- Pure client-side execution — no network requests after initial load
- Accessible by keyboard and screen reader
- Responsive from 320px to 1920px viewport width

---

## Architecture

The app is a single `index.html` file with an embedded `<script>` block and optional `<style>` block for keyframe animations not expressible in Tailwind utilities alone.

```
index.html
├── <head>
│   ├── Tailwind CSS CDN
│   └── <style> (custom keyframe animations)
├── <body>
│   ├── #app-container   — outer flex container, full-viewport
│   │   ├── #cat-wrapper — centers the cat SVG, handles focus ring
│   │   │   └── #cat    — interactive SVG element (keyboard/click target)
│   │   ├── #speech-bubble — absolutely positioned above #cat-wrapper
│   │   └── #pet-counter   — displays "Times petted: N"
└── <script>
    ├── State module
    ├── Reaction Pool
    ├── Animation engine
    ├── Speech Bubble controller
    ├── Idle State controller
    └── Event handlers
```

The JavaScript is organized as a set of plain module-like objects/functions inside a single IIFE (Immediately Invoked Function Expression) to avoid polluting the global scope, without requiring a build tool.

### Data flow

```
User click / tap / keypress
        │
        ▼
  registerPet()
        │
        ├──► incrementCounter()  →  updateCounterDisplay()
        │                            ├── celebrate() if multiple of 10
        │
        ├──► resetIdleTimer()
        │
        └──► selectReaction()   →  runReaction(reaction)
                                    ├── animateCat(reaction.animation)
                                    ├── showSpeechBubble(reaction.phrase)  [if type = speech]
                                    └── runVisualEffect(reaction.effect)   [if type = effect]
```

---

## Components and Interfaces

### 1. Cat SVG Component (`#cat`)

- Rendered as an inline `<svg>` element containing simple geometric shapes: two filled circles (eyes), an arc (smile), two triangles (ears), and an outer circle/oval (head).
- `tabindex="0"` and `aria-label="Cat — click or press Space/Enter to pet"` for accessibility.
- CSS classes control animation states: `cat--bouncing`, `cat--spinning`, `cat--squishing`, `cat--default`.
- Dimensions scale via `viewBox` and a responsive CSS width (min 120px, scales with viewport).

### 2. Speech Bubble Component (`#speech-bubble`)

- A `<div>` positioned absolutely above the cat wrapper.
- Controlled entirely via JavaScript: hidden by default (`hidden` Tailwind class), shown by removing the class and setting `textContent`.
- Contains a single removal timer (`setTimeout`) reference; a new bubble cancels the previous timer.

**Interface:**

```js
speechBubble.show(phrase)   // cancels existing timer, shows phrase, starts 1500ms timer
speechBubble.hide()         // immediately hides, clears timer
```

### 3. Pet Counter Component (`#pet-counter`)

- A `<p>` element with the text "Times petted: {count}".
- Updated synchronously within `registerPet()`.
- Applies a brief celebratory CSS animation class when count is a non-zero multiple of 10.

**Interface:**

```js
counter.increment()         // increments internal count, updates DOM text
counter.getCurrent()        // returns current count (number)
counter.celebrate()         // triggers CSS animation on the counter element
```

### 4. Reaction Pool

An array of reaction objects:

```js
{
  id: String,               // unique identifier e.g. "bounce"
  type: "animation" | "speech" | "effect" | "combo",
  animation: String | null, // CSS class name to apply to #cat
  phrase: String | null,    // text for speech bubble (≤6 words)
  effect: String | null,    // visual effect function name
  durationMs: Number,       // total reaction duration before cleanup
}
```

Minimum pool composition:
- ≥ 3 animation reactions (bounce, spin, squish)
- ≥ 3 speech bubble reactions
- ≥ 2 visual-effect-only reactions (floating hearts, star burst)

### 5. Animation Engine

Applies and removes CSS animation classes on `#cat`. Uses a `setTimeout` to remove the class after `durationMs`, then calls cleanup to restore the cat to its default appearance.

**Interface:**

```js
animationEngine.play(animationClass, durationMs, onComplete)
animationEngine.stop()   // aborts any in-progress animation, restores default
```

### 6. Visual Effects Engine

Creates temporary DOM elements (e.g., floating hearts, star burst particles) that are appended to `#app-container`, animated via CSS keyframes, then removed from the DOM when the animation ends (`animationend` event).

### 7. Idle State Controller

Manages two timers:
- **Idle entry timer** (5s): starts/resets on every `registerPet()`.
- **Idle behavior interval** (5–10s random): fires while in idle state to display yawn animation or "…" speech bubble.

**Interface:**

```js
idleController.reset()           // cancels timers, exits idle state
idleController.enterIdle()       // called after 5s; starts behavior loop
idleController.stopBehavior()    // cancels ongoing idle behavior immediately
```

### 8. Event Handlers

- `#cat` click → `registerPet()`
- `#cat` keydown (Space / Enter) → `registerPet()`
- `#cat` focus → show focus ring (CSS `:focus-visible` + Tailwind `focus:ring`)
- Touch events (`touchstart`) on `#cat` → `registerPet()` (prevents double-fire with `preventDefault()`)

---

## Data Models

### AppState

The central mutable state object, accessed only through the exported functions above — never mutated directly by event handlers.

```js
const state = {
  petCount: 0,                    // number, session total
  lastReactionId: null,           // string | null, prevents immediate repeat
  isIdle: false,                  // boolean
  idleEntryTimer: null,           // Timer reference
  idleBehaviorTimer: null,        // Timer reference
  activeSpeechBubbleTimer: null,  // Timer reference
  activeAnimation: null,          // string | null, current CSS class on cat
};
```

### Reaction Object

```js
/**
 * @typedef {Object} Reaction
 * @property {string}        id         - Unique reaction key
 * @property {string}        type       - "animation" | "speech" | "effect" | "combo"
 * @property {string|null}   animation  - CSS class for cat animation
 * @property {string|null}   phrase     - Speech bubble text (max 6 words)
 * @property {string|null}   effect     - Visual effect identifier
 * @property {number}        durationMs - Lifetime of the reaction in ms
 */
```

### Reaction Pool (minimum 8 entries)

| id | type | animation | phrase | effect | durationMs |
|---|---|---|---|---|---|
| bounce | animation | cat--bouncing | null | null | 500 |
| spin | animation | cat--spinning | null | null | 600 |
| squish | animation | cat--squishing | null | null | 400 |
| purr | speech | null | "Purrrr…" | null | 1500 |
| happy | speech | null | "I love you!" | null | 1500 |
| boop | speech | null | "boop!" | null | 1500 |
| hearts | effect | null | null | floatingHearts | 800 |
| stars | effect | null | null | starBurst | 600 |
| bounce-purr | combo | cat--bouncing | "Purrfect!" | null | 1500 |
| spin-hearts | combo | cat--spinning | null | floatingHearts | 800 |

### Phrase Pool (minimum 10 entries)

```js
const phrases = [
  "Purrrr…",
  "I love you!",
  "Boop!",
  "More pets please!",
  "Meow~",
  "You are warm.",
  "Headbutt!",
  "So fluffy!",
  "Mrrrow!",
  "Nyaa~",
  "Feed me hooman.",
  "Knead knead knead.",
];
```

### Speech Bubble Lifecycle

```
show(phrase)
  ├── clear existing timer (if any)
  ├── set textContent = phrase
  ├── remove 'hidden' class
  └── setTimeout(hide, 1500)

hide()
  ├── clear timer
  └── add 'hidden' class
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Pet counter increments by exactly 1 per pet

*For any* sequence of N valid pet interactions, the Pet Counter value after those interactions SHALL equal exactly N plus its value before the sequence began.

**Validates: Requirements 2.1, 2.4**

---

### Property 2: Reaction never repeats immediately

*For any* sequence of two or more consecutive reaction selections, the reaction selected SHALL always differ from the reaction selected in the immediately preceding selection.

**Validates: Requirements 3.2**

---

### Property 3: Reaction selection is approximately uniform over the eligible pool

*For any* large sample of reaction selections (N ≥ 200), each reaction in the pool that is eligible (i.e., not the most recent reaction) SHALL be selected with approximately equal probability — no reaction is systematically excluded or over-represented.

**Validates: Requirements 2.2, 3.2**

---

### Property 4: Each pet in a rapid sequence triggers exactly one independent reaction

*For any* sequence of N pets registered within 300ms of each other, the total number of reactions triggered SHALL equal exactly N, with no pets silently dropped or merged.

**Validates: Requirements 2.5**

---

### Property 5: Clicks outside the cat's bounding box never register a pet

*For any* click or tap event whose coordinates lie entirely outside the cat element's bounding rectangle, the Pet Counter SHALL remain unchanged and no reaction SHALL be triggered.

**Validates: Requirements 2.6**

---

### Property 6: Speech bubble phrase is always a member of the phrase pool

*For any* speech bubble reaction that is triggered, the text displayed in the speech bubble SHALL be an element of the predefined phrase pool — no phrase outside that set is ever shown.

**Validates: Requirements 4.1**

---

### Property 7: New speech bubble always replaces an existing one with a fresh timer

*For any* pair of consecutive speech bubble triggers where the second arrives while the first bubble is still visible, the first removal timer SHALL be cancelled, the first bubble removed, the second phrase displayed immediately, and a new 1500ms removal timer started.

**Validates: Requirements 4.4**

---

### Property 8: Counter display always matches the format "Times petted: N"

*For any* non-negative integer N representing the current pet count, the counter element's text content SHALL equal exactly the string `"Times petted: N"`.

**Validates: Requirements 5.3**

---

### Property 9: Celebratory effect triggers on every non-zero multiple of 10

*For any* positive integer k, when the Pet Counter reaches the value k × 10, a celebratory animation SHALL be applied to the counter element.

**Validates: Requirements 5.5**

---

### Property 10: Idle countdown resets on every pet regardless of timing

*For any* pet interaction arriving at any time offset T (where 0 ≤ T < 5000ms) after the last pet, the idle state SHALL NOT be entered before 5000ms have elapsed since the new pet was registered.

**Validates: Requirements 6.2**

---

### Property 11: Idle behavior repeats at intervals within [5s, 10s] while idle

*For any* number of consecutive idle behavior cycles N (while no pet is registered), each inter-behavior interval SHALL be a value in the range [5000ms, 10000ms], and N idle behaviors SHALL be triggered after N such intervals.

**Validates: Requirements 6.3, 6.4**

---

### Property 12: A pet while idle cancels idle state and triggers a reaction

*For any* pet registered while the app is in Idle State (regardless of where in the idle behavior cycle it arrives), the app SHALL exit Idle State immediately, cancel any in-progress idle behavior, and trigger exactly one normal reaction.

**Validates: Requirements 6.5**

---

### Property 13: No horizontal overflow at any supported viewport width

*For any* viewport width W in the range [320px, 1920px], the document body's scroll width SHALL be less than or equal to W, with no clipped content or horizontal scrollbar.

**Validates: Requirements 7.1**

---

### Property 14: Cat minimum rendered dimension is at least 120px at any supported viewport width

*For any* viewport width W in the range [320px, 1920px], the cat element's bounding rectangle's shorter dimension (min of width and height) SHALL be at least 120px.

**Validates: Requirements 7.2**

---

### Property 15: Animation cleanup always restores default appearance within 600ms

*For any* animation reaction in the Reaction Pool, after the reaction's declared `durationMs` elapses, all animation CSS classes SHALL be removed from the cat element, restoring it to its default appearance, within 600ms of the reaction completing.

**Validates: Requirements 3.6**

---

## Error Handling

Since this is a pure client-side app with no network I/O, error scenarios are limited to runtime edge cases:

| Scenario | Handling |
|---|---|
| `registerPet()` called while a reaction animation is still running | Allow it — each pet is independent; the animation engine queues or overrides cleanly |
| Speech bubble timer reference lost (e.g., timer fires after element removed) | Guard with `if (el)` null check before DOM manipulation |
| Reaction pool has only 1 item (degenerate case) | If pool size ≤ 1, skip the "different from last" check to avoid infinite loop |
| Touch events firing both `touchstart` and `click` | Call `event.preventDefault()` on `touchstart` to suppress the synthetic click |
| `tabindex` or `aria-label` missing after DOM mutation | Never remove accessibility attributes; treat them as invariant |
| Viewport below 320px | No special handling — Tailwind's `min-w` constraint already limits content width |

---

## Testing Strategy

### Unit Tests

Target the pure logic functions that have no DOM dependency:

- **`selectReaction(pool, lastId)`** — verify it never returns `lastId`, returns a valid pool member, and handles edge cases (pool size 1, all IDs same).
- **`selectPhrase(phrases)`** — verify it always returns a member of the input array.
- **`shouldCelebrate(count)`** — verify it returns `true` only for non-zero multiples of 10.
- **`incrementCounter(state)`** — verify the count increases by exactly 1 each call.
- **`isWhitespacePet(event)`** — verify Space/Enter keys register a pet; other keys do not.

### Property-Based Tests

Property-based testing (PBT) is applicable here because the core logic functions — reaction selection, counter increments, speech bubble lifecycle — are pure or near-pure with clear input/output behavior and universal properties that should hold across large random input spaces.

**Library:** [fast-check](https://github.com/dubzzz/fast-check) (JavaScript, runs in Node via a simple test runner like Vitest or Jest)

Each property test runs a minimum of **100 iterations**.

Tag format per test: `// Feature: cat-clicker, Property {N}: {property_text}`

**Property tests to implement:**

| Property | Test Description |
|---|---|
| Property 1  | Generate random N (1–1000), call `incrementCounter` N times, assert final count = N |
| Property 2  | Generate sequences of 2–50 reaction selections, assert no two adjacent entries share the same `id` |
| Property 3  | Run 200 reaction selections, assert each eligible reaction appears with frequency ≈ 1/(pool-1) ± 20% |
| Property 4  | Generate N rapid pets (≤300ms apart), assert reactions array length = N |
| Property 5  | Generate random (x, y) coordinates outside cat bounding box, assert pet count unchanged |
| Property 6  | Generate speech bubble triggers, assert each displayed phrase is in the phrase pool array |
| Property 7  | Simulate two rapid speech bubble triggers (2nd while 1st visible), assert first timer cleared, second phrase shown with fresh timer |
| Property 8  | Generate random non-negative integer N, assert counter DOM text = `"Times petted: N"` |
| Property 9  | For any positive integer k, after k×10 pets, assert celebratory CSS class applied to counter element |
| Property 10 | Generate random time offset T ∈ [0, 4999]ms before 5s mark, register pet, assert idle not entered before 5s from new pet |
| Property 11 | Run N idle behavior cycles, assert each interval is in [5000, 10000]ms and N behaviors are triggered |
| Property 12 | Enter idle state, register a pet at random point, assert isIdle = false and reaction count incremented |
| Property 13 | Generate random viewport width W ∈ [320, 1920], assert `document.body.scrollWidth ≤ W` |
| Property 14 | Generate random viewport width W ∈ [320, 1920], assert `min(cat.width, cat.height) ≥ 120` |
| Property 15 | For any animation reaction, after `durationMs` elapses, assert no animation CSS classes remain on cat element |

### Integration / Smoke Tests

- **Page load**: Verify counter initializes to "Times petted: 0".
- **Accessibility**: Verify `#cat` has `tabindex="0"` and non-empty `aria-label`.
- **Responsive**: Spot-check cat minimum dimension ≥ 120px at 320px viewport width.
- **Idle entry**: Wait 5.1s without interaction, verify `isIdle === true`.

### Manual / Visual Tests

- Verify animations play and cat returns to default within 600ms after each reaction.
- Verify speech bubble appears above cat and disappears after ~1500ms.
- Verify celebratory effect triggers on every 10th pet.
- Verify focus ring appears on keyboard Tab focus.
- Verify color contrast meets WCAG 2.1 AA (3:1 minimum) using a browser dev-tools contrast checker.
