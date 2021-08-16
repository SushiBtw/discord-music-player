import { User } from 'discord.js';

export class Song {
    public player: Object;
    public name: string;
    public author: string;
    public url: string;
    public thumbnail: string;
    public requestedBy: User;
    public duration: string;
    public isLive: boolean;
    private seekTime: number;
}
