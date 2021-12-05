"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioReceiveStream = exports.createDefaultAudioReceiveStreamOptions = exports.EndBehaviorType = void 0;
const stream_1 = require("stream");
const AudioPlayer_1 = require("../audio/AudioPlayer");
/**
 * The different behaviors an audio receive stream can have for deciding when to end.
 */
var EndBehaviorType;
(function (EndBehaviorType) {
    /**
     * The stream will only end when manually destroyed.
     */
    EndBehaviorType[EndBehaviorType["Manual"] = 0] = "Manual";
    /**
     * The stream will end after a given time period of silence/no audio packets.
     */
    EndBehaviorType[EndBehaviorType["AfterSilence"] = 1] = "AfterSilence";
    /**
     * The stream will end after a given time period of no audio packets.
     */
    EndBehaviorType[EndBehaviorType["AfterInactivity"] = 2] = "AfterInactivity";
})(EndBehaviorType = exports.EndBehaviorType || (exports.EndBehaviorType = {}));
function createDefaultAudioReceiveStreamOptions() {
    return {
        end: {
            behavior: EndBehaviorType.Manual,
        },
    };
}
exports.createDefaultAudioReceiveStreamOptions = createDefaultAudioReceiveStreamOptions;
/**
 * A readable stream of Opus packets received from a specific entity
 * in a Discord voice connection.
 */
class AudioReceiveStream extends stream_1.Readable {
    constructor({ end, ...options }) {
        super({
            ...options,
            objectMode: true,
        });
        this.end = end;
    }
    push(buffer) {
        if (buffer) {
            if (this.end.behavior === EndBehaviorType.AfterInactivity ||
                (this.end.behavior === EndBehaviorType.AfterSilence &&
                    (buffer.compare(AudioPlayer_1.SILENCE_FRAME) !== 0 || typeof this.endTimeout === 'undefined'))) {
                this.renewEndTimeout(this.end);
            }
        }
        return super.push(buffer);
    }
    renewEndTimeout(end) {
        if (this.endTimeout) {
            clearTimeout(this.endTimeout);
        }
        this.endTimeout = setTimeout(() => this.push(null), end.duration);
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    _read() { }
}
exports.AudioReceiveStream = AudioReceiveStream;
//# sourceMappingURL=AudioReceiveStream.js.map