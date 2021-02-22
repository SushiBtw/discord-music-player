import { Client, VoiceChannel } from "discord.js";
import ytsr from "ytsr";
import MusicPlayerError from "../src/MusicPlayerError";
import Queue from "../src/Queue";
import Song from "../src/Song";
import Util from "../src/Util";

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
    play(voiceChannel:VoiceChannel, songName:String, options:Object, requestedBy:String):Promise<Song|MusicPlayerError>
    addToQueue(guildID:String, songName:String, options:Object, requestedBy:String):Promise<Song|MusicPlayerError>
    seek(guildID:String, seek:Number):Promise<Song|MusicPlayerError>
    playlist(guildID:String, playlistLink:String, voiceChannel:VoiceChannel, maxSongs:Number, requestedBy:String):Promise<{song:null|Song, playlist:Playlist}>
    pause(guildID:String):Song
    resume(guildID:String):Song
    stop(guildID:String):Song
    setVolume(guildID:String, percent:Number):Song
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
