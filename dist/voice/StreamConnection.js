"use strict";
/**
 * Main of the code comes from the @discordjs/voice repo:
 * @link https://github.com/discordjs/voice/blob/main/examples/music-bot/src/music/subscription.ts
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamConnection = void 0;
const events_1 = require("events");
const voice_1 = require("@discordjs/voice");
const util_1 = require("util");
const __1 = require("..");
const wait = (0, util_1.promisify)(setTimeout);
class StreamConnection extends events_1.EventEmitter {
    /**
     * StreamConnection constructor
     * @param {VoiceConnection} connection
     * @param {VoiceChannel|StageChannel} channel
     */
    constructor(connection, channel) {
        super();
        this.paused = false;
        this.readyLock = false;
        /**
         * The VoiceConnection
         * @type {VoiceConnection}
         */
        this.connection = connection;
        /**
         * The AudioPlayer
         * @type {AudioPlayer}
         */
        this.player = (0, voice_1.createAudioPlayer)();
        /**
         * The VoiceChannel or StageChannel
         * @type {VoiceChannel | StageChannel}
         */
        this.channel = channel;
        this.connection.on('stateChange', (oldState, newState) => __awaiter(this, void 0, void 0, function* () {
            if (newState.status === voice_1.VoiceConnectionStatus.Disconnected) {
                if (newState.reason === voice_1.VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
                    try {
                        yield (0, voice_1.entersState)(this.connection, voice_1.VoiceConnectionStatus.Connecting, 5000);
                    }
                    catch (_a) {
                        this.leave();
                    }
                }
                else if (this.connection.rejoinAttempts < 5) {
                    yield wait((this.connection.rejoinAttempts + 1) * 5000);
                    this.connection.rejoin();
                }
                else {
                    this.leave();
                }
            }
            else if (newState.status === voice_1.VoiceConnectionStatus.Destroyed) {
                this.stop();
            }
            else if (!this.readyLock &&
                (newState.status === voice_1.VoiceConnectionStatus.Connecting || newState.status === voice_1.VoiceConnectionStatus.Signalling)) {
                this.readyLock = true;
                try {
                    yield this._enterState();
                }
                catch (_b) {
                    if (this.connection.state.status !== voice_1.VoiceConnectionStatus.Destroyed)
                        this.leave();
                }
                finally {
                    this.readyLock = false;
                }
            }
        }));
        this.player
            .on('stateChange', (oldState, newState) => {
            if (newState.status === voice_1.AudioPlayerStatus.Idle && oldState.status !== voice_1.AudioPlayerStatus.Idle) {
                if (!this.paused) {
                    this.emit('end', this.resource);
                    delete this.resource;
                    return;
                }
            }
            else if (newState.status === voice_1.AudioPlayerStatus.Playing) {
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
    createAudioStream(stream, options) {
        this.resource = (0, voice_1.createAudioResource)(stream, {
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
    _enterState() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, voice_1.entersState)(this.connection, voice_1.VoiceConnectionStatus.Ready, 20000);
        });
    }
    /**
     *
     * @param {AudioResource<Song>} resource
     * @returns {Promise<StreamConnection>}
     */
    playAudioStream(resource) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!resource)
                throw new __1.DMPError(__1.DMPErrors.RESOURCE_NOT_READY);
            if (!this.resource)
                this.resource = resource;
            if (this.connection.state.status !== voice_1.VoiceConnectionStatus.Ready)
                yield this._enterState();
            this.player.play(resource);
            return this;
        });
    }
    /**
     * Pauses/Resumes the connection
     * @param {boolean} state
     * @returns {boolean}
     */
    setPauseState(state) {
        if (state) {
            this.player.pause(true);
            this.paused = true;
            return true;
        }
        else {
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
        try {
            this.player.stop(true);
            this.connection.destroy();
        }
        catch (e) { }
    }
    /**
     * Gets the current volume
     * @type {number}
     */
    get volume() {
        var _a;
        if (!((_a = this.resource) === null || _a === void 0 ? void 0 : _a.volume))
            return 100;
        const currentVol = this.resource.volume.volume;
        return Math.round(Math.pow(currentVol, 1 / 1.661) * 200);
    }
    /**
     * Gets the stream time
     * @type {number}
     */
    get time() {
        if (!this.resource)
            return 0;
        return this.resource.playbackDuration;
    }
    /**
     * Sets the current volume
     * @param {number} volume
     * @returns {boolean}
     */
    setVolume(volume) {
        var _a;
        if (!this.resource || this._invalidVolume(volume))
            return false;
        (_a = this.resource.volume) === null || _a === void 0 ? void 0 : _a.setVolumeLogarithmic(volume / 200);
        return true;
    }
    /**
     *
     * @param {number} volume
     * @returns {boolean}
     * @private
     */
    _invalidVolume(volume) {
        return (isNaN(volume) ||
            volume >= Infinity ||
            volume < 0);
    }
}
exports.StreamConnection = StreamConnection;
