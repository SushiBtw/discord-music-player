"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepeatMode = exports.DefaultProgressBarOptions = exports.DefaultPlaylistOptions = exports.DefaultPlayOptions = exports.DefaultPlayerOptions = void 0;
;
;
/**
 * Default player options object
 * @typedef {PlayerOptions}
 * @param {boolean} [leaveOnEnd=true] If it should leave on end
 * @param {boolean} [leaveOnStop=true] If it should leave on stop
 * @param {boolean} [leaveOnEmpty=true] If it should leave on empty voice channel
 * @param {boolean} [deafenOnJoin=false] If it should deafen on join
 * @param {number} [timeout=0] Voice channel leave timeout
 * @param {number} [volume=100] Player volume
 * @param {string} [quality=high] Player quality
 */
exports.DefaultPlayerOptions = {
    leaveOnEnd: true,
    leaveOnStop: true,
    leaveOnEmpty: true,
    deafenOnJoin: false,
    timeout: 0,
    volume: 100,
    quality: 'high',
};
/**
 * Default play options object
 * @typedef {PlayOptions}
 * @param {string} [sortBy=relevance] Search sort by Sort by
 * @param {boolean} [timecode=false] If url with timecode (?t=) provided, will play from that moment
 */
exports.DefaultPlayOptions = {
    sortBy: 'relevance',
    timecode: false
};
/**
 * Default playlist options object
 * @typedef {PlaylistOptions}
 * @param {number} [maxSongs=-1] Max songs
 * @param {boolean} [shuffle=false] If it should shuffle the Songs
 */
exports.DefaultPlaylistOptions = {
    maxSongs: -1,
    shuffle: false,
};
/**
 * Default progress bar options object
 * @typedef {ProgressBarOptions}
 * @param {boolean} [time=true] If it should add time near the ProgressBar
 * @param {number} [size=20] Bar size
 * @param {string} [block==] Bar block
 * @param {string} [arrow=>] Bar ending
 */
exports.DefaultProgressBarOptions = {
    time: true,
    size: 20,
    block: '=',
    arrow: '>'
};
/**
 * The queue repeat mode.
 * Following modes exists:
 * - `OFF` = 0
 * - `SONG`  = 1
 * - `QUEUE` = 2
 * @typedef {number} RepeatMode
 */
var RepeatMode;
(function (RepeatMode) {
    RepeatMode[RepeatMode["DISABLED"] = 0] = "DISABLED";
    RepeatMode[RepeatMode["SONG"] = 1] = "SONG";
    RepeatMode[RepeatMode["QUEUE"] = 2] = "QUEUE";
})(RepeatMode = exports.RepeatMode || (exports.RepeatMode = {}));
