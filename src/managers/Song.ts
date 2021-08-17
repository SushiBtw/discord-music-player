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
    private seekTime: number;

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

    _setFirst() {
        this.isFirst = true;
    }
}
