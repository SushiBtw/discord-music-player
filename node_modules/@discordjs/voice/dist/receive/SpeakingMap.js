"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeakingMap = void 0;
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
/**
 * Tracks the speaking states of users in a voice channel.
 */
class SpeakingMap extends tiny_typed_emitter_1.TypedEmitter {
    constructor() {
        super();
        this.users = new Map();
        this.speakingTimeouts = new Map();
    }
    onPacket(userId) {
        const timeout = this.speakingTimeouts.get(userId);
        if (timeout) {
            clearTimeout(timeout);
        }
        else {
            this.users.set(userId, Date.now());
            this.emit('start', userId);
        }
        this.startTimeout(userId);
    }
    startTimeout(userId) {
        this.speakingTimeouts.set(userId, setTimeout(() => {
            this.emit('end', userId);
            this.speakingTimeouts.delete(userId);
            this.users.delete(userId);
        }, SpeakingMap.DELAY));
    }
}
exports.SpeakingMap = SpeakingMap;
/**
 * The delay after a packet is received from a user until they're marked as not speaking anymore.
 */
SpeakingMap.DELAY = 100;
//# sourceMappingURL=SpeakingMap.js.map