/**
 * Main of the code comes from the @discordjs/voice repo:
 * @link https://github.com/discordjs/voice/blob/main/examples/music-bot/src/music/subscription.ts
 */
/// <reference types="node" />
import { EventEmitter } from "events";
import { AudioPlayer, AudioResource, StreamType, VoiceConnection } from "@discordjs/voice";
import { StageChannel, VoiceChannel } from "discord.js";
import { Readable } from "stream";
import { StreamConnectionEvents, Song } from "..";
export declare class StreamConnection extends EventEmitter {
    readonly connection: VoiceConnection;
    readonly player: AudioPlayer;
    channel: VoiceChannel | StageChannel;
    resource?: AudioResource<Song>;
    paused: boolean;
    private readyLock;
    /**
     * StreamConnection constructor
     * @param {VoiceConnection} connection
     * @param {VoiceChannel|StageChannel} channel
     */
    constructor(connection: VoiceConnection, channel: VoiceChannel | StageChannel);
    /**
     *
     * @param {Readable | string} stream
     * @param {{ inputType: StreamType, metadata: any|undefined }} options
     * @returns {AudioResource<Song>}
     */
    createAudioStream(stream: string | Readable, options: {
        inputType: StreamType;
        metadata?: any;
    }): AudioResource<Song>;
    /**
     * @returns {void}
     * @private
     */
    _enterState(): Promise<void>;
    /**
     *
     * @param {AudioResource<Song>} resource
     * @returns {Promise<StreamConnection>}
     */
    playAudioStream(resource: AudioResource<Song>): Promise<this>;
    /**
     * Pauses/Resumes the connection
     * @param {boolean} state
     * @returns {boolean}
     */
    setPauseState(state: boolean): boolean;
    /**
     * Stops and ends the connection
     * @returns {boolean}
     */
    stop(): boolean;
    /**
     * Disconnect and leave from the voice channel
     * @returns {void}
     */
    leave(): void;
    /**
     * Gets the current volume
     * @type {number}
     */
    get volume(): number;
    /**
     * Gets the stream time
     * @type {number}
     */
    get time(): number;
    /**
     * Sets the current volume
     * @param {number} volume
     * @returns {boolean}
     */
    setVolume(volume: number): boolean;
    /**
     *
     * @param {number} volume
     * @returns {boolean}
     * @private
     */
    _invalidVolume(volume: number): boolean;
}
export declare interface StreamConnection {
    on<K extends keyof StreamConnectionEvents>(event: K, listener: (...args: StreamConnectionEvents[K]) => void): this;
}
