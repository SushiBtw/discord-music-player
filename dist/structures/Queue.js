"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = void 0;
const StreamConnection_1 = require("../voice/StreamConnection");
const types_1 = require("../types/types");
const voice_1 = require("@discordjs/voice");
const Utils_1 = require("../utils/Utils");
const discord_ytdl_core_1 = __importDefault(require("discord-ytdl-core"));
class Queue {
    constructor(player, guild, options) {
        this.songs = [];
        this.isPlaying = false;
        this.data = null;
        this.repeatMode = types_1.RepeatMode.DISABLED;
        this.destroyed = false;
        /**
         * The guild of the queue
         * @type {Guild}
         */
        this.player = player;
        /**
         * The guild of the queue
         * @type {Guild}
         */
        this.guild = guild;
        /**
         * The queue options
         * @type {PlayerOptions}
         */
        this.options = {};
        Object.assign(this.options, types_1.DefaultPlayerOptions, options);
    }
    /**
     * Joins a voice channel
     * @param {GuildChannelResolvable} _channel
     * @returns {Promise<Queue>}
     */
    join(channelId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.destroyed)
                throw 'QueueDestroyed';
            const channel = this.guild.channels.resolve(channelId);
            if (!channel.isVoice())
                throw 'InvalidChannelType';
            let connection = voice_1.joinVoiceChannel({
                guildId: channel.guild.id,
                channelId: channel.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfDeaf: this.options.deafenOnJoin
            });
            let _connection;
            try {
                connection = yield voice_1.entersState(connection, voice_1.VoiceConnectionStatus.Ready, 15 * 1000);
                _connection = new StreamConnection_1.StreamConnection(connection, channel);
            }
            catch (err) {
                connection.destroy();
                throw 'VoiceConnectionError';
            }
            this.connection = _connection;
            if (channel.type === "GUILD_STAGE_VOICE") {
                yield channel.guild.me.voice.setSuppressed(false).catch((_) => __awaiter(this, void 0, void 0, function* () {
                    return yield channel.guild.me.voice.setRequestToSpeak(true).catch(() => null);
                }));
            }
            this.connection
                .on('start', (resource) => {
                    this.isPlaying = true;
                    if (resource === null || resource === void 0 ? void 0 : resource.metadata)
                        this.player.emit((resource === null || resource === void 0 ? void 0 : resource.metadata) ? 'songFirst' : 'songChanged', this, this.nowPlaying);
                })
                .on('end', (resource) => __awaiter(this, void 0, void 0, function* () {
                    this.isPlaying = false;
                    this.player.emit('songEnd', this, resource.metadata);
                    if (!this.songs.length && this.repeatMode === types_1.RepeatMode.DISABLED) {
                        if (this.options.leaveOnEnd)
                            this.destroy();
                        this.player.emit('queueEnd', this);
                    }
                    else {
                        if (this.repeatMode === types_1.RepeatMode.SONG) {
                            // Play Song again
                        }
                        else if (this.repeatMode === types_1.RepeatMode.QUEUE) {
                            // Add Song to the end of the Queue
                        }
                        const nextTrack = this.songs.shift();
                        // Play Song
                        return;
                    }
                }))
                .on('error', (err) => this.player.emit('error', this, err.message));
            return this;
        });
    }
    play(search, options) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (this.destroyed)
                throw 'QueueDestroyed';
            if (!((_a = this.connection) === null || _a === void 0 ? void 0 : _a.connection))
                throw 'NoVoiceConnection';
            let song = yield Utils_1.Utils.best(search, options, this);
            let quality = this.options.quality;
            let stream = discord_ytdl_core_1.default(song.url, {
                opusEncoded: false,
                fmt: "s16le",
                encoderArgs: [],
                quality: quality.toLowerCase() === 'low' ? 'lowestaudio' : 'highestaudio',
                highWaterMark: 1 << 25
            })
                .on('error', (error) => {
                    this.player.emit('error', error.message === 'Video unavailable' ? 'VideoUnavailable' : error.message, this);
                    this.repeatMode = types_1.RepeatMode.DISABLED;
                    return;
                });
            const resource = this.connection.createAudioStream(stream, {
                metadata: song,
                inputType: voice_1.StreamType.Raw
            });
            setTimeout(_ => {
                this.connection.playAudioStream(resource)
                    .then(__ => {
                        this.setVolume(this.options.volume);
                    });
            });
            return song;
        });
    }
    /*
        play_sc(stream, options) {
            var _a;
            return __awaiter(this, void 0, void 0, function* () {
                if (this.destroyed)
                    throw 'QueueDestroyed';
                if (!((_a = this.connection) === null || _a === void 0 ? void 0 : _a.connection))
                    throw 'NoVoiceConnection';
    
                let quality = this.options.quality;
                const resource = this.connection.createAudioStream(stream, {
                    inputType: voice_1.StreamType.Raw
                });
                setTimeout(_ => {
                    this.connection.playAudioStream(resource)
                        .then(__ => {
                            this.setVolume(this.options.volume);
                        });
                });
                return song;
            });
        }
        */
    /**
     * Destroys the queue
     * @param {boolean} leaveOnStop
     * @returns {void}
     */
    destroy(leaveOnStop = this.options.leaveOnStop) {
        var _a;
        if (this.destroyed)
            return;
        if (this.connection)
            this.connection.stop();
        if (leaveOnStop)
            (_a = this.connection) === null || _a === void 0 ? void 0 : _a.leave();
        this.destroyed = true;
        this.player.deleteQueue(this.guild.id);
    }
    /**
     * Gets the current volume
     * @type {number}
     */
    get volume() {
        if (!this.connection)
            return types_1.DefaultPlayerOptions.volume;
        return this.connection.volume;
    }

    get connection() {
        return this.connection;
    }
    /**
     * Sets the current volume
     * @param {number} volume
     * @returns {boolean}
     */
    setVolume(volume) {
        if (!this.connection)
            return false;
        this.options.volume = volume;
        return this.connection.setVolume(volume);
    }
    /**
     * Returns current track
     * @type {Song}
     */
    get nowPlaying() {
        var _a, _b;
        return (_b = (_a = this.connection.resource) === null || _a === void 0 ? void 0 : _a.metadata) !== null && _b !== void 0 ? _b : this.songs[0];
    }
    /**
     * Set's custom queue data
     * @param {any} data
     * @returns {void}
     */
    setData(data) {
        this.data = data;
    }
}
exports.Queue = Queue;
