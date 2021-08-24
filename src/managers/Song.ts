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

    constructor(raw: RawSong, queue: Queue, requestedBy?: User) {

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

        this.seekTime = 0;

        this.data = null;
    }

    /**
     * Converts duration (HH:MM:SS) to millisecons
     * @returns {number}
     */
    get millisecons(): number {
        return Utils.timeToMs(this.duration);
    }

    /**
     * @param first
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

    toString(): string {
        return `${this.name} | ${this.author}`;
    }
}
