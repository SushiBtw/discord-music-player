"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.abortAfter = void 0;
/**
 * Creates an abort controller that aborts after the given time.
 * @param delay - The time in milliseconds to wait before aborting
 */
function abortAfter(delay) {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), delay);
    ac.signal.addEventListener('abort', () => clearTimeout(timeout));
    return [ac, ac.signal];
}
exports.abortAfter = abortAfter;
//# sourceMappingURL=abortAfter.js.map