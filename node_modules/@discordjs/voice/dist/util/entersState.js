"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.entersState = void 0;
const abortAfter_1 = require("./abortAfter");
const events_1 = require("events");
/**
 * Allows a target a specified amount of time to enter a given state, otherwise rejects with an error.
 *
 * @param target - The object that we want to observe the state change for
 * @param status - The status that the target should be in
 * @param timeoutOrSignal - The maximum time we are allowing for this to occur, or a signal that will abort the operation
 */
async function entersState(target, status, timeoutOrSignal) {
    if (target.state.status !== status) {
        const [ac, signal] = typeof timeoutOrSignal === 'number' ? abortAfter_1.abortAfter(timeoutOrSignal) : [undefined, timeoutOrSignal];
        try {
            await events_1.once(target, status, { signal });
        }
        finally {
            ac === null || ac === void 0 ? void 0 : ac.abort();
        }
    }
    return target;
}
exports.entersState = entersState;
//# sourceMappingURL=entersState.js.map