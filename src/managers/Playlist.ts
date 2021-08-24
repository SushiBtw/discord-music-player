import { User } from 'discord.js';
import { Player, Queue, RawPlaylist, Song } from '..';

export class Playlist {
    public player: Player;
    public queue: Queue;
    public name: string;
    public author: string;
    public url: string;
    public songs: Song[];

    constructor(raw: RawPlaylist, queue: Queue, requestedBy?: User) {

        this.player = queue.player;

        this.queue = queue;

        this.name = raw.name;

        this.author = raw.author;

        this.url = raw.url;

        this.songs = raw.songs;
    }

    toString(): string {
        return `${this.name} | ${this.author}`;
    }
}
