import { User } from 'discord.js';
import { Player, Queue, RawSong, Utils } from '..';

export class Song {
    public player: Player;
    public queue: Queue;
    public name: string;
    public author: string;
    public url: string;
    public thumbnail: string;
    public requestedBy?: User;
    public duration: string;
    public isLive: boolean;
    public isFirst: boolean;
    public seekTime: number;
    public data?: any = null;

    /**
     * Song constructor
     * @param {RawSong} raw
     * @param {Queue} queue
     * @param {User} [requestedBy]
     */
    constructor(raw: RawSong, queue: Queue, requestedBy?: User) {

        /**
         * Player instance
         * @name Song#player
         * @type {Player}
         * @readonly
         */

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

        this.seekTime = raw.seekTime ?? 0;

        this.data = null;
    }

    /**
     * Converts duration (HH:MM:SS) to milliseconds
     * @type {number}
     */
    get milliseconds(): number {
        return Utils.timeToMs(this.duration);
    }

    /**
     * @param {?boolean} first
     * @private
     */
    _setFirst(first: boolean = true) {
        this.isFirst = first;
    }

    /**
     * Set's custom song data
     * @param {any} data
     * @returns {void}
     */
    setData(data: any): void {
        this.data = data;
    }

    /**
     * Song name and author in string representation
     * @returns {string}
     */
    toString(): string {
        return `${this.name} | ${this.author}`;
    }
}
