import { User } from 'discord.js';
import {Player, Queue, RawSong } from '..';

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
    }

    /**
     * Converts duration (HH:MM:SS) to millisecons
     * @returns {number}
     */
    get millisecons(): number {
        return this.duration.split(':')
            .reduceRight(
                (prev, curr, i, arr) => prev + parseInt(curr) * 60**(arr.length-1-i), 0
            ) * 1000;
    }

    _setFirst(first: boolean = true) {
        this.isFirst = first;
    }

    toString(): string {
        return `${this.name} | ${this.author}`;
    }
}
