"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Playlist = void 0;
class Playlist {
    /**
     * Playlist constructor
     * @param {RawPlaylist} raw
     * @param {Queue} queue
     * @param {User} [requestedBy]
     */
    constructor(raw, queue, requestedBy) {
        /**
         * Playlist instance
         * @name Playlist#player
         * @type {Player}
         * @readonly
         */
        /**
         * Playlist instance
         * @name Playlist#queue
         * @type {Queue}
         */
        /**
         * Playlist name
         * @name Playlist#name
         * @type {string}
         */
        /**
         * Playlist author
         * @name Playlist#author
         * @type {string}
         */
        /**
         * Playlist url
         * @name Playlist#url
         * @type {string}
         */
        /**
         * Playlist songs
         * @name Playlist#songs
         * @type {string}
         */
        this.player = queue.player;
        this.queue = queue;
        this.name = raw.name;
        this.author = raw.author;
        this.url = raw.url;
        this.songs = raw.songs;
    }
    /**
     * Playlist name and author in string representation
     * @returns {string}
     */
    toString() {
        return `${this.name} | ${this.author}`;
    }
}
exports.Playlist = Playlist;
