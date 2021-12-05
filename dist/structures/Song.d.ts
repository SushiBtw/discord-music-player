import { User } from 'discord.js';
import { Player, Queue, RawSong } from '..';
export declare class Song {
    player: Player;
    name: string;
    author: string;
    url: string;
    thumbnail: string;
    requestedBy?: User;
    duration: string;
    isLive: boolean;
    private seekTime;
    constructor(raw: RawSong, queue: Queue, requestedBy?: User);
}
