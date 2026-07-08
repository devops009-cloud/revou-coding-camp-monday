/**
 * catClicker.js
 * Pure logic functions exported for unit/property testing with Vitest + fast-check.
 * DOM-dependent code lives inside the IIFE in index.html.
 */

/**
 * Returns true only for non-zero multiples of 10.
 * @param {number} count
 * @returns {boolean}
 */
export function shouldCelebrate(count) {
  return count !== 0 && count % 10 === 0;
}

/**
 * Returns true if the keyboard event key is Space or Enter.
 * @param {KeyboardEvent} event
 * @returns {boolean}
 */
export function isWhitespacePet(event) {
  return event.key === ' ' || event.key === 'Enter';
}
