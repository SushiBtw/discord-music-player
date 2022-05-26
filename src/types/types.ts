import {AudioPlayerError, AudioResource } from "@discordjs/voice";
import {User} from "discord.js";
import { Song, Queue, Playlist } from "..";

/**
 * Player options
 * @typedef {object} PlayerOptions
 * @param {boolean} [leaveOnEnd=true] If it should leave on end
 * @param {boolean} [leaveOnStop=true] If it should leave on stop
 * @param {boolean} [leaveOnEmpty=true] If it should leave on empty voice channel
 * @param {boolean} [deafenOnJoin=false] If it should defean on join
 * @param {number} [timeout=0] Voice channel leave timeout
 * @param {number} [volume=100] Player volume
 * @param {string} [quality=high] Player quality
 * @param {string} [localAddress] Custom ipv4/ipv6 address
 * @param {string} [ytdlCookie] Custom YouTube cookie to avoid erros and bypass some features
 */
export interface PlayerOptions {
    leaveOnEnd?: boolean,
    leaveOnStop?: boolean,
    leaveOnEmpty?: boolean,
    deafenOnJoin?: boolean,
    timeout?: number,
    volume?: number,
    quality?: 'low'|'high',
    localAddress?: string,
    ytdlCookie?: string,
}

/**
 * Play options
 * @typedef {object} PlayOptions
 * @param {string} [uploadDate] Search sort by Upload date
 * @param {string} [duration] Search sort by Duration
 * @param {string} [sortBy=relevance] Search sort by Sort by
 * @param {boolean} [timecode=false] If url with timecode (?t=) provided, will play from that moment
 * @param {number} [index] If the index was provided, it will add the song after the provided index in the Queue
 * @param {User} [requestedBy] The User who requested the Song
 * @param {string} [localAddress] Custom ipv4/ipv6 address
 */
export interface PlayOptions {
    uploadDate?: 'hour'|'today'|'week'|'month'|'year',
    duration?: 'short'|'long',
    sortBy?: 'relevance'|'date'|'view count'|'rating',
    timecode?: boolean,
    index?: number;
    requestedBy?: User,
    localAddress?: string
};

/**
 * Playlist options
 * @typedef {object} PlaylistOptions
 * @param {number} [maxSongs=-1] Max songs
 * @param {User} [requestedBy] The User who requested the Song
 * @param {boolean} [shuffle=false] If it should shuffle the Songs
 * @param {string} [localAddress] Custom ipv4/ipv6 address
 */
export interface PlaylistOptions {
    maxSongs?: number,
    requestedBy?: User,
    shuffle?: boolean,
    localAddress?: string
};

/**
 * @typedef {object} ProgressBarOptions
 * @property {boolean} [time=true] If it should add time near the ProgressBar
 * @property {number} [size=20] Bar size
 * @property {string} [block==] Bar block
 * @property {string} [arrow=>] Bar ending
 */
export interface ProgressBarOptions {
    time?: boolean;
    size?: number;
    block?: string;
    arrow?: string;
}

/**
 * Default player options object
 * @typedef {PlayerOptions}
 * @param {boolean} [leaveOnEnd=true] If it should leave on end
 * @param {boolean} [leaveOnStop=true] If it should leave on stop
 * @param {boolean} [leaveOnEmpty=true] If it should leave on empty voice channel
 * @param {boolean} [deafenOnJoin=false] If it should defean on join
 * @param {number} [timeout=0] Voice channel leave timeout
 * @param {number} [volume=100] Player volume
 * @param {string} [quality=high] Player quality
 */
export const DefaultPlayerOptions: PlayerOptions = {
    leaveOnEnd: true,
    leaveOnStop: true,
    leaveOnEmpty: true,
    deafenOnJoin: false,
    timeout: 0,
    volume: 100,
    quality: 'high',
};

/**
 * Default play options object
 * @typedef {PlayOptions}
 * @param {string} [sortBy=relevance] Search sort by Sort by
 * @param {boolean} [timecode=false] If url with timecode (?t=) provided, will play from that moment
 */
export const DefaultPlayOptions: PlayOptions = {
    sortBy: 'relevance',
    timecode: false
};

/**
 * Default playlist options object
 * @typedef {PlaylistOptions}
 * @param {number} [maxSongs=-1] Max songs
 * @param {boolean} [shuffle=false] If it should shuffle the Songs
 */
export const DefaultPlaylistOptions: PlaylistOptions = {
    maxSongs: -1,
    shuffle: false,
};

/**
 * Default progress bar options object
 * @typedef {ProgressBarOptions}
 * @param {boolean} [time=true] If it should add time near the ProgressBar
 * @param {number} [size=20] Bar size
 * @param {string} [block==] Bar block
 * @param {string} [arrow=>] Bar ending
 */
export const DefaultProgressBarOptions: ProgressBarOptions = {
    time: true,
    size: 20,
    block: '=',
    arrow: '>'
}

/**
 * Raw Song object
 * @typedef {object} RawSong
 * @property {string} name
 * @property {string} author
 * @property {string} url
 * @property {string} thumbnail
 * @property {string} duration
 * @property {boolean} isLive
 */
export interface RawSong {
    name: string,
    author: string,
    url: string,
    thumbnail: string,
    duration: string,
    isLive: boolean
    seekTime?: number;
}

/**
 * Raw Playlist object
 * @typedef {object} PlayerOptions
 * @property {string} name
 * @property {string} author
 * @property {string} url
 * @property {Song[]} songs
 * @property {string} type
 */
export interface RawPlaylist {
    name: string,
    author: string,
    url: string,
    songs: Song[],
    type: 'playlist'|'album'
}

/**
 * The queue repeat mode.
 * Following modes exists:
 * - `OFF` = 0
 * - `SONG`  = 1
 * - `QUEUE` = 2
 * @typedef {number} RepeatMode
 */
export enum RepeatMode {
    DISABLED,
    SONG,
    QUEUE ,
}

/**
 * Emitted when channel was empty
 * @event Player#channelEmpty
 * @param {Queue} queue Queue
 */

/**
 * Emitted when a song was added to the queue
 * @event Player#songAdd
 * @param {Queue} queue Queue
 * @param {Song} song Song
 */

/**
 * Emitted when a playlist was added to the queue
 * @event Player#playlistAdd
 * @param {Queue} queue Queue
 * @param {Playlist} playlist Playlist
 */

/**
 * Emitted when there was no more music to play
 * @event Player#queueEnd
 * @param {Queue} queue Queue
 */

/**
 * Emitted when a song changed
 * @event Player#songChanged
 * @param {Queue} queue Queue
 * @param {Song} newSong Song
 * @param {Song} oldSong Song
 */

/**
 * Emitted when a first song in the queue started playing
 * @event Player#songFirst
 * @param {Queue} queue Queue
 * @param {Song} song Song
 */

/**
 * Emitted when someone disconnected the bot from the channel
 * @event Player#clientDisconnect
 * @param {Queue} queue Queue
 */

/**
 * Emitted when deafenOnJoin is true and the bot was undeafened
 * @event Player#clientUndeafen
 * @param {Queue} queue Queue
 */

/**
 * Emitted when there was an error with the Player
 * @event Player#error
 * @param {string} error Error string
 * @param {Queue} queue Queue
 */

export interface PlayerEvents<T = unknown> {
    channelEmpty: [queue: Queue<T>];
    songAdd: [queue: Queue<T>, song: Song];
    playlistAdd: [queue: Queue<T>, playlist: Playlist];
    queueEnd: [queue: Queue<T>];
    queueDestroyed: [queue: Queue<T>];
    songChanged: [queue: Queue<T>, newSong: Song, oldSong: Song];
    songFirst: [queue: Queue<T>, song: Song];
    clientDisconnect: [queue: Queue<T>];
    clientUndeafen: [queue: Queue<T>];
    error: [error: string, queue: Queue<T>];
}

/**
 * Emitted when StreamConnection started
 * @event StreamConnection#start
 * @param {AudioResource<Song>} AudioResource AudioResource
 */

/**
 * Emitted when StreamConnection ended
 * @event StreamConnection#end
 * @param {AudioResource<Song>} AudioResource AudioResource
 */

/**
 * Emitted when there was an error with the StreamConnection
 * @event StreamConnection#error
 * @param {AudioPlayerError} error AudioPlayerError
 */

export interface StreamConnectionEvents {
    start: [AudioResource<Song>];
    end: [AudioResource<Song>];
    error: [AudioPlayerError];
}
