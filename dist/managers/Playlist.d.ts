import { User } from 'discord.js';
import { Player, Queue, RawPlaylist, Song } from '..';
export declare class Playlist {
    player: Player;
    queue: Queue;
    name: string;
    author: string;
    url: string;
    songs: Song[];
    /**
     * Playlist constructor
     * @param {RawPlaylist} raw
     * @param {Queue} queue
     * @param {User} [requestedBy]
     */
    constructor(raw: RawPlaylist, queue: Queue, requestedBy?: User);
    /**
     * Playlist name and author in string representation
     * @returns {string}
     */
    toString(): string;
}
