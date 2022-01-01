/**
 * Main of the code comes from the @discordjs/voice repo:
 * @link https://github.com/discordjs/voice/blob/main/examples/music-bot/src/music/subscription.ts
 */

import { EventEmitter } from "events";
import {
    AudioPlayer,
    AudioPlayerError,
    AudioPlayerStatus,
    AudioResource,
    createAudioPlayer,
    createAudioResource,
    entersState,
    StreamType,
    VoiceConnection,
    VoiceConnectionStatus,
    VoiceConnectionDisconnectReason
} from "@discordjs/voice";
import {StageChannel, VoiceChannel} from "discord.js";
import { promisify } from 'util';
import { Readable } from "stream";
import { StreamConnectionEvents, Song, DMPError, DMPErrors } from "..";
const wait = promisify(setTimeout);

export class StreamConnection extends EventEmitter {
    public readonly connection: VoiceConnection;
    public readonly player: AudioPlayer;
    public channel: VoiceChannel | StageChannel;
    public resource?: AudioResource<Song>;
    public paused: boolean = false;
    private readyLock = false;

    /**
     * StreamConnection constructor
     * @param {VoiceConnection} connection
     * @param {VoiceChannel|StageChannel} channel
     */
    constructor(connection: VoiceConnection, channel: VoiceChannel | StageChannel) {
        super();

        /**
         * The VoiceConnection
         * @type {VoiceConnection}
         */
        this.connection = connection;

        /**
         * The AudioPlayer
         * @type {AudioPlayer}
         */
        this.player = createAudioPlayer();

        /**
         * The VoiceChannel or StageChannel
         * @type {VoiceChannel | StageChannel}
         */
        this.channel = channel;

        this.connection.on('stateChange', async (oldState, newState) => {
            if (newState.status === VoiceConnectionStatus.Disconnected) {
                if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
                    try {
                        // Attempting to re-join the voice channel, after possibly changing channels
                        await entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000);
                    } catch {
                        // It was mannually disconnected and the connection is closed in Player.js _voiceUpdate
                    }
                } else if (this.connection.rejoinAttempts < 5) {
                    await wait((this.connection.rejoinAttempts + 1) * 5_000);
                    this.connection.rejoin();
                } else {
                    this.leave();
                }
            } else if (newState.status === VoiceConnectionStatus.Destroyed) {
                this.stop();
            } else if (
                !this.readyLock &&
                (newState.status === VoiceConnectionStatus.Connecting || newState.status === VoiceConnectionStatus.Signalling)
            ) {
                this.readyLock = true;
                try {
                    await this._enterState();
                } catch {
                    this.leave();
                } finally {
                    this.readyLock = false;
                }
            }
        });

        this.player
            .on('stateChange', (oldState, newState) => {
                if (newState.status === AudioPlayerStatus.Idle && oldState.status !== AudioPlayerStatus.Idle) {
                    if (!this.paused) {
                        this.emit('end', this.resource);
                        delete this.resource;
                        return;
                    }
                } else if (newState.status === AudioPlayerStatus.Playing) {
                    if (!this.paused) {
                        this.emit('start', this.resource);
                        return;
                    }
                }
            })
            .on('error', data => {
                this.emit('error', data);
            });

        this.connection.subscribe(this.player);
    }

    /**
     *
     * @param {Readable | string} stream
     * @param {{ inputType: StreamType, metadata: any|undefined }} options
     * @returns {AudioResource<Song>}
     */
    createAudioStream(stream: string | Readable , options: { inputType: StreamType, metadata?: any }): AudioResource<Song> {
        this.resource = createAudioResource(stream, {
            inputType: options.inputType,
            inlineVolume: true,
            metadata: options.metadata
        });

        return this.resource;
    }

    /**
     * @returns {void}
     * @private
     */
    async _enterState() {
        await entersState(this.connection, VoiceConnectionStatus.Ready, 20_000);
    }

    /**
     *
     * @param {AudioResource<Song>} resource
     * @returns {Promise<StreamConnection>}
     */
    async playAudioStream(resource: AudioResource<Song>): Promise<this> {
        if(!resource)
            throw new DMPError(DMPErrors.RESOURCE_NOT_READY);
        if(!this.resource)
            this.resource = resource;

        if (this.connection.state.status !== VoiceConnectionStatus.Ready)
            await this._enterState();

        this.player.play(resource);

        return this;
    }

    /**
     * Pauses/Resumes the connection
     * @param {boolean} state
     * @returns {boolean}
     */
    setPauseState(state: boolean) {
        if(state) {
            this.player.pause(true);
            this.paused = true;
            return true;
        } else {
            this.player.unpause();
            this.paused = false;
            return false;
        }
    }

    /**
     * Stops and ends the connection
     * @returns {boolean}
     */
    stop() {
        return this.player.stop();
    }

    /**
     * Disconnect and leave from the voice channel
     * @returns {void}
     */
    leave() {
        this.player.stop(true);
        if (this.connection.state.status !== VoiceConnectionStatus.Destroyed)
            this.connection.destroy();
    }

    /**
     * Gets the current volume
     * @type {number}
     */
    get volume() {
        if (!this.resource?.volume) return 100;
        const currentVol = this.resource.volume.volume;
        return Math.round(Math.pow(currentVol, 1 / 1.661) * 200);
    }

    /**
     * Gets the stream time
     * @type {number}
     */
    get time() {
        if (!this.resource) return 0;
        return this.resource.playbackDuration;
    }

    /**
     * Sets the current volume
     * @param {number} volume
     * @returns {boolean}
     */
    setVolume(volume: number) {
        if (!this.resource || this._invalidVolume(volume))
            return false;

        this.resource.volume?.setVolumeLogarithmic(volume / 200);
        return true;
    }

    /**
     *
     * @param {number} volume
     * @returns {boolean}
     * @private
     */
    _invalidVolume(volume: number) {
        return (
            isNaN(volume) ||
            volume >= Infinity ||
            volume < 0);
    }
}

export declare interface StreamConnection {
    on<K extends keyof StreamConnectionEvents>(event: K, listener: (...args: StreamConnectionEvents[K]) => void): this;
}
