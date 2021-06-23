import {Client, VoiceChannel, Message, Snowflake, StreamDispatcher, VoiceConnection} from "discord.js";
import { Video, Playlist } from "@sushibtw/youtubei";
import ytsr from "ytsr";
import Util from "../src/Util";

interface PlayerEvents {
    channelEmpty: [message: Message, queue: Queue];
    songAdd: [message: Message, queue: Queue, song: Song];
    playlistAdd: [message: Message, queue: Queue, playlist: Playlist];
    queueEnd: [message: Message, queue: Queue];
    songChanged: [message: Message, newSong: Song, oldSong: Song];
    songFirst: [message: Message, song: Song];
    error: [error: String, message: Message];
    clientDisconnect: [message: Message, queue: Queue];
    clientUndeafen: [message: Message, queue: Queue]
}
type PlayOptions = {
    search: String,
    uploadDate?: 'hour'|'today'|'week'|'month'|'year',
    duration?: 'short'|'long',
    sortBy?: 'relevance'|'date'|'view count'|'rating',
    requestedBy?: String,
    index?: Number,
    localAddress?: String,
}
type PlaylistOptions = {
    search: String,
    maxSongs?: Number,
    requestedBy?: String
    shuffle?: Boolean,
    localAddress?: String,
}
type ProgressOptions = {
    size?: Number,
    arrow?: String,
    block?: String,
}
type PlayerOptions = {
    leaveOnEnd?: Boolean
    leaveOnStop?: Boolean
    leaveOnEmpty?: Boolean
    deafenOnJoin?: Boolean
    timeout?: Number
    volume?: Number
    quality?: 'high'|'low'
}

class Player {
    constructor(client: Client, options:PlayerOptions) {}
    client:Client
    options:PlayerOptions
    queues:Map<String,Queue>
    ytsr:ytsr

    public on<K extends keyof PlayerEvents>(event: K, listener: (...args: PlayerEvents[K]) => void): this;
    isPlaying(message:Message):Boolean
    play(message:Message, options:PlayOptions|String):Promise<Song>
    /**
     * @deprecated Use play method instead.
     */
    addToQueue(message:Message, options:PlayOptions|String):Promise<Song>
    seek(message:Message, seek:Number):Promise<Song>
    playlist(message:Message, options:PlaylistOptions|String):Promise<Playlist>
    pause(message:Message):Song
    resume(message:Message):Song
    stop(message:Message):Song
    setVolume(message:Message, percentage:Number):Song
    getVolume(message:Message):Number
    getQueue(message:Message):Queue
    setQueue(message:Message, songs:Song[]):Queue
    clearQueue(message:Message):Queue
    skip(message:Message):Song
    nowPlaying(message:Message):Song
    setQueueRepeatMode(message:Message, enabled:Boolean):Boolean
    setRepeatMode(message:Message, enabled:Boolean):Boolean
    toggleLoop(message:Message):Boolean
    toggleQueueLoop(message:Message):Boolean
    remove(message:Message, song:Number):Song
    shuffle(message:Message):Array<Song>
    createProgressBar(message:Message, options?:ProgressOptions):String
    updateQueueOptions(message: Message, options?:PlayerOptions):void
    _playSong(guildID:String, firstPlay:Boolean, seek:null|Number):void
}

class Queue {
    constructor(guildID: Snowflake, options: Object, message: Message) {}
    guildID: Snowflake;
    dispatcher: StreamDispatcher;
    connection: VoiceConnection;
    songs: Song[];
    stopped: Boolean;
    skipped: Boolean;
    volume: Number;
    playing: Boolean;
    repeatMode: Boolean;
    repeatQueue: Boolean;
    initMessage: Message;
    options: PlayerOptions;
}

class Song {
    constructor(video: Video, queue: Queue, requestedBy: String) {}
    name: String;
    duration: String|Number;
    author: String;
    url: String;
    thumbnail: String;
    queue: Queue;
    isLive: Boolean;
    requestedBy: Object|String;
    seekTime: Number;
}

class Playlist {
    constructor(playlist: Playlist, queue: Queue, requestedBy: String) {}
    name: String;
    author: String;
    url: String;
    videos: Song[];
    videoCount: Number;
}

export const Player:Player
export const Utils:Util
export const version:String
