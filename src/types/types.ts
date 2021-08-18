import {AudioPlayerError, AudioResource } from "@discordjs/voice";
import {User} from "discord.js";
import { Song, Queue } from "..";

export interface PlayerOptions {
    leaveOnEnd?: boolean,
    leaveOnStop?: boolean,
    leaveOnEmpty?: boolean,
    deafenOnJoin?: boolean,
    timeout?: number,
    volume?: number,
    quality?: 'low'|'high',
    localAddress?: string
}

export interface PlayOptions {
    uploadDate?: 'hour'|'today'|'week'|'month'|'year',
    duration?: 'short'|'long',
    sortBy?: 'relevance'|'date'|'view count'|'rating',
    requestedBy?: User,
    index?: number,
    localAddress?: string
};

export interface PlaylistOptions {
    search: string,
    maxSongs?: number,
    requestedBy?: User,
    shuffle?: boolean,
    localAddress?: string
};

export const DefaultPlayerOptions: PlayerOptions = {
    leaveOnEnd: true,
    leaveOnStop: true,
    leaveOnEmpty: true,
    deafenOnJoin: false,
    timeout: 0,
    volume: 100,
    quality: 'high',
};

export const DefaultPlayOptions: PlayOptions = {
    sortBy: 'relevance',
};

export interface RawSong {
    name: string,
    author: string,
    url: string,
    thumbnail: string,
    duration: string,
    isLive: boolean
}

export enum RepeatMode {
    DISABLED,
    SONG,
    QUEUE ,
}

export interface PlayerEvents {
    channelEmpty: [queue: Queue];
    songAdd: [queue: Queue, song: Song];
    //playlistAdd: [queue: Queue, playlist: Playlist];
    queueEnd: [queue: Queue];
    songChanged: [queue: Queue, newSong: Song, oldSong: Song];
    songFirst: [queue: Queue, song: Song];
    error: [error: String, queue: Queue];
    clientDisconnect: [queue: Queue];
    clientUndeafen: [queue: Queue]
}

export interface StreamConnectionEvents {
    start: [AudioResource<Song>];
    end: [AudioResource<Song>];
    error: [AudioPlayerError];
}
