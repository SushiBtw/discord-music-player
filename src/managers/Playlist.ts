import { User } from 'discord.js';
import { Player, Queue, RawPlaylist, Song } from '..';

export class Playlist {
    public player: Player;
    public queue: Queue;
    public name: string;
    public author: string;
    public url: string;
    public songs: Song[];

    /**
     * Playlist constructor
     * @param {RawPlaylist} raw
     * @param {Queue} queue
     * @param {User} [requestedBy]
     */
    constructor(raw: RawPlaylist, queue: Queue, requestedBy?: User) {

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
    toString(): string {
        return `${this.name} | ${this.author}`;
    }
}
