"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Song = void 0;
const __1 = require("..");
class Song {
    /**
     * Song constructor
     * @param {RawSong} raw
     * @param {Queue} queue
     * @param {User} [requestedBy]
     */
    constructor(raw, queue, requestedBy) {
        /**
         * Player instance
         * @name Song#player
         * @type {Player}
         * @readonly
         */
        var _a;
        this.data = null;
        /**
         * Queue instance
         * @name Song#queue
         * @type {Queue}
         */
        /**
         * Song name
         * @name Song#name
         * @type {string}
         */
        /**
         * Song author
         * @name Song#author
         * @type {string}
         */
        /**
         * Song url
         * @name Song#url
         * @type {string}
         */
        /**
         * Song thumbnail
         * @name Song#thumbnail
         * @type {string}
         */
        /**
         * The User who requested the Song
         * @name Song#requestedBy
         * @type {string}
         */
        /**
         * Song duration
         * @name Song#duration
         * @type {string}
         */
        /**
         * If the song is a livestream
         * @name Song#isLive
         * @type {boolean}
         */
        /**
         * If the song is first in the queue
         * @name Song#isFirst
         * @type {boolean}
         * @readonly
         */
        /**
         * Song seekTime
         * @name Song#seekTime
         * @type {number}
         * @readonly
         */
        /**
         * Song custom data
         * @name Song#data
         * @type {any}
         */
        this.player = queue.player;
        this.queue = queue;
        this.name = raw.name;
        this.author = raw.author;
        this.url = raw.url;
        this.thumbnail = raw.thumbnail;
        this.requestedBy = requestedBy;
        this.duration = raw.duration;
        this.isLive = raw.isLive;
        this.isFirst = false;
        this.seekTime = (_a = raw.seekTime) !== null && _a !== void 0 ? _a : 0;
        this.data = null;
    }
    /**
     * Converts duration (HH:MM:SS) to milliseconds
     * @type {number}
     */
    get milliseconds() {
        return __1.Utils.timeToMs(this.duration);
    }
    /**
     * @param {?boolean} first
     * @private
     */
    _setFirst(first = true) {
        this.isFirst = first;
    }
    /**
     * Set's custom song data
     * @param {any} data
     * @returns {void}
     */
    setData(data) {
        this.data = data;
    }
    /**
     * Song name and author in string representation
     * @returns {string}
     */
    toString() {
        return `${this.name} | ${this.author}`;
    }
}
exports.Song = Song;
