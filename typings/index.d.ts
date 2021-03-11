import { Client, VoiceChannel, Message } from "discord.js";
import ytsr from "ytsr";
import MusicPlayerError from "../src/MusicPlayerError";
import Queue from "../src/Queue";
import Song from "../src/Song";
import Playlist from "../src/Playlist";
import Util from "../src/Util";

type PlayOptions = Util.PlayOptions;
type PlaylistOptions = Util.PlaylistOptions;
type PlayerOptions = {
    leaveOnEnd:Boolean
    leaveOnStop:Boolean
    leaveOnEmpty:Boolean
    timeout:Number
    volume:Number
    quality:'high'|'low'
}

class Player {
    constructor(client: Client, options:PlayerOptions) {}
    client:Client
    options:PlayerOptions
    queues:Map<String,Queue>
    ytsr:ytsr

    isPlaying(guildID:String):Boolean
    play(message:Message, options:PlayOptions):Promise<Song>
    addToQueue(message:Message, options:PlayOptions):Promise<Song>
    seek(message:Message, seek:Number):Promise<Song>
    playlist(message:Message, options:PlaylistOptions):Promise<Playlist>
    pause(guildID:String):Song
    resume(guildID:String):Song
    stop(guildID:String):Song
    setVolume(guildID:String, percent:Number):Song
    getVolume(guildID:String):Number
    getQueue(guildID:String):Queue
    setQueue(guildID:String, songs:Array<Song>):Queue
    clearQueue(guildID:String):Queue|MusicPlayerError
    skip(guildID:String):Song|MusicPlayerError
    nowPlaying(guildID:String):Song|MusicPlayerError
    setQueueRepeatMode(guildID:String, enabled:Boolean):void
    setRepeatMode(guildID:String, enabled:Boolean):void
    toggleLoop(guildID:String):Boolean|MusicPlayerError
    toggleQueueLoop(guildID:String):Boolean|MusicPlayerError
    remove(guildID:String, song:Number):Song|MusicPlayerError
    shuffle(guildID:String):Array<Song>
    createProgressBar(guildID:String, barSize:Number, arrowIcon:String, loadedIcon:String):String
    _playSong(guildID:String, firstPlay:Boolean, seek:null|Number):void
}

export const Player:Player
export const Util:Util
export const version:String
