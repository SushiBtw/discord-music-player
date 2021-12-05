"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioPlayerError = void 0;
/**
 * An error emitted by an AudioPlayer. Contains an attached resource to aid with
 * debugging and identifying where the error came from.
 */
class AudioPlayerError extends Error {
    constructor(error, resource) {
        super(error.message);
        this.resource = resource;
        this.name = error.name;
        this.stack = error.stack;
    }
}
exports.AudioPlayerError = AudioPlayerError;
//# sourceMappingURL=AudioPlayerError.js.map