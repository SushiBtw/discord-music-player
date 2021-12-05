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
const voice_1 = require("@discordjs/voice");
const discord_ytdl_core_1 = __importDefault(require("discord-ytdl-core"));
const __1 = require("..");
const scdl = require('soundcloud-downloader').default;
const { StreamType } = require("@discordjs/voice");
class Queue {
    /**
     * Queue constructor
     * @param {Player} player
     * @param {Guild} guild
     * @param {PlayerOptions} options
     */
    constructor(player, guild, options) {
        /**
         * Player instance
         * @name Queue#player
         * @type {Player}
         * @readonly
         */
        this.songs = [];
        this.isPlaying = false;
        this.data = null;
        this.options = __1.DefaultPlayerOptions;
        this.repeatMode = __1.RepeatMode.DISABLED;
        this.destroyed = false;
        /**
         * Guild instance
         * @name Queue#guild
         * @type {Guild}
         * @readonly
         */
        /**
         * Queue connection
         * @name Queue#connection
         * @type {StreamConnection}
         * @readonly
         */
        /**
         * Queue songs
         * @name Queue#songs
         * @type {Song[]}
         */
        /**
         * If Song is playing on the Queue
         * @name Queue#isPlaying
         * @type {boolean}
         * @readonly
         */
        /**
         * Queue custom data
         * @name Queue#data
         * @type {any}
         */
        /**
         * Queue options
         * @name Queue#options
         * @type {PlayerOptions}
         */
        /**
         * Queue repeat mode
         * @name Queue#repeatMode
         * @type {RepeatMode}
         */
        /**
         * If the queue is destroyed
         * @name Queue#destroyed
         * @type {boolean}
         * @readonly
         */
        this.player = player;
        this.guild = guild;
        this.options = Object.assign({}, options);
    }
    /**
     * Joins a voice channel
     * @param {GuildChannelResolvable} _channel
     * @returns {Promise<Queue>}
     */


    join(channelId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.destroyed)
                throw new __1.DMPError(__1.DMPErrors.QUEUE_DESTROYED);
            if (this.connection)
                return this;
            const channel = this.guild.channels.resolve(channelId);
            if (!channel)
                throw new __1.DMPError(__1.DMPErrors.UNKNOWN_VOICE);
            if (!channel.isVoice())
                throw new __1.DMPError(__1.DMPErrors.CHANNEL_TYPE_INVALID);
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
                throw new __1.DMPError(__1.DMPErrors.VOICE_CONNECTION_ERROR);
            }
            this.connection = _connection;
            if (channel.type === "GUILD_STAGE_VOICE") {
                yield channel.guild.me.voice.setSuppressed(false).catch((_) => __awaiter(this, void 0, void 0, function* () {
                    return yield channel.guild.me.voice.setRequestToSpeak(true).catch(() => null);
                }));
            }
            this.connection
                .on('start', (resource) => {
                    var _a, _b;
                    this.isPlaying = true;
                    if (((_a = resource === null || resource === void 0 ? void 0 : resource.metadata) === null || _a === void 0 ? void 0 : _a.isFirst) && ((_b = resource === null || resource === void 0 ? void 0 : resource.metadata) === null || _b === void 0 ? void 0 : _b.seekTime) === 0) {
                        this.player.emit('songFirst', this, this.nowPlaying);
                        //this.player.emit("song_change", this, this.nowPlaying);
                    }

                })
                .on('end', (resource) => __awaiter(this, void 0, void 0, function* () {
                    if (this.destroyed) {
                        this.player.emit('queueDestroyed', this);
                        return;
                    }
                    this.isPlaying = false;
                    let oldSong = this.songs.shift();


                    //if (this.songs[0] && this.songs[0].song === undefined) {
                    //   oldSong = this.songs.shift();
                    //} else {
                    // var songDeleted = true;
                    //}


                    if (this.songs.length === 0 && this.repeatMode === __1.RepeatMode.DISABLED) {
                        this.player.emit('queueEnd', this);
                        if (this.options.leaveOnEnd)
                            setTimeout(() => {
                                if (!this.isPlaying)
                                    this.destroy();
                            }, this.options.timeout);
                        return;
                    }
                    else {
                        if (this.repeatMode === __1.RepeatMode.SONG) {
                            this.songs.unshift(oldSong);
                            //if (!this.songs.permalink_url.includes("soundcloud.com")) {
                            //this.songs[0]._setFirst(false);
                            //}
                            this.player.emit('songChanged', this, this.songs[0], oldSong);
                            //this.player.emit("songFirst", this, this.songs[0]);
                            return this.play(this.songs[0], { immediate: true });
                        }
                        else if (this.repeatMode === __1.RepeatMode.QUEUE) {
                            this.songs.push(oldSong);
                            //if (this.songs[this.songs.length - 1].title) {
                            //   this.songs[this.songs.length - 1]._setFirst//(false);
                            // }
                            this.player.emit('songChanged', this, this.songs[0], oldSong);
                            return this.play(this.songs[0], { immediate: true });
                        } else {
                            this.player.emit('songChanged', this, this.songs[0], oldSong);
                            return this.play(this.songs[0], { immediate: true });
                        }
                    }
                }))
                .on('error', (err) => this.player.emit('error', err.message, this));
            return this;
        });
    }
    /**
     * Plays or Queues a song (in a VoiceChannel)
     * @param {Song | string} search
     * @param {PlayOptions} [options=DefaultPlayOptions]
     * @returns {Promise<Song>}
     */
    async play(search, options = __1.DefaultPlayOptions) {
        var _a, _b, is_sc = false;

        let song;

        var is_sc = String(search).includes("soundcloud.com") || String(search.permalink_url).includes("soundcloud.com");

        //let search_str = search.toString();
        if (is_sc === true) {

            if (search.permalink_url !== undefined) {
                search = search.permalink_url;
            }
            song = await scdl.getInfo(search);
            song["isFirst"] = false; // scdl doesn't have this array, but it is necessary for this package
        }



        return __awaiter(this, void 0, void 0, function* () {
            if (this.destroyed)
                throw new __1.DMPError(__1.DMPErrors.QUEUE_DESTROYED);
            if (!((_a = this.connection) === null || _a === void 0 ? void 0 : _a.connection))
                throw new __1.DMPError(__1.DMPErrors.NO_VOICE_CONNECTION);
            options = Object.assign({}, __1.DefaultPlayOptions, options);
            let { data } = options;
            delete options.data;
            if (is_sc === false) {
                song = yield __1.Utils.best(search, options, this).catch(error => {
                    throw new __1.DMPError(error);
                });
            }

            if (!options.immediate)
                song.data = data;

            let songLength = this.songs.length;
            if (!(options === null || options === void 0 ? void 0 : options.immediate) && songLength !== 0) {
                console.log("first");

                if ((options === null || options === void 0 ? void 0 : options.index) >= 0 && ++options.index <= songLength)
                    this.songs.splice(options.index, 0, song);
                else
                    this.songs.push(song);
                this.player.emit("songAdd", this, song)
                return song;

            }
            else if (!(options === null || options === void 0 ? void 0 : options.immediate)) { // else if song is first
                console.log("second");
                if (!is_sc) {
                    song._setFirst();
                }
                //this.player.emit("songAdd", this, song)

                // fix this later. Make it so set first applies to soundcloud
                //} else {
                //    this.player.emit('songFirst', this, song);
                //}

                if ((options === null || options === void 0 ? void 0 : options.index) >= 0 && ++options.index <= songLength)
                    this.songs.splice(options.index, 0, song);
                else
                    this.songs.push(song);
                this.player.emit('songAdd', this, song);
            }
            else if (options.seek)
                this.songs[0].seekTime = options.seek;
            let quality = this.options.quality;
            song = this.songs[0];
            if (song.seekTime)
                options.seek = song.seekTime;
            if (!is_sc) {
                let stream = discord_ytdl_core_1.default(song.url, {
                    requestOptions: (_b = this.player.options.ytdlRequestOptions) !== null && _b !== void 0 ? _b : {},
                    opusEncoded: false,
                    seek: options.seek ? options.seek / 1000 : 0,
                    fmt: 's16le',
                    encoderArgs: [],
                    quality: quality.toLowerCase() === 'low' ? 'lowestaudio' : 'highestaudio',
                    highWaterMark: 1 << 25,
                    filter: 'audioonly'
                })
                    .on('error', (error) => {
                        if (!/Status code|premature close/i.test(error.message))
                            this.player.emit('error', error.message === 'Video unavailable' ? 'VideoUnavailable' : error.message, this);
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
            } else if (is_sc) {
                scdl.download(search).then(stream => {
                    console.log("Soundcloud file downloaded");
                    const resource = this.connection.createAudioStream(stream, StreamType.Raw, song);

                    setTimeout(async _ => {
                        await this.connection.playAudioStream(resource)
                            .then(async __ => {
                                this.setVolume(this.options.volume);
                            }).catch(error => {
                                return;
                            })
                    });
                    return song;
                });

            }

            return song;
        });
    }



    /**
     * Plays or Queues a playlist (in a VoiceChannel)
     * @param {Playlist | string} search
     * @param {PlaylistOptions} [options=DefaultPlaylistOptions]
     * @returns {Promise<Playlist>}
     */
    async playlist(search, options = __1.DefaultPlaylistOptions) {
        var _a;

        var is_sc = String(search).includes("soundcloud.com") || String(search.permalink_url).includes("soundcloud.com");
        let playlist;
        if (is_sc === true) {

            playlist = await scdl.getSetInfo(search).catch(error => {
                console.log("Failure fetching soundcloud song. Maybe the link is wrong?");
                return;
            });


        }
        return __awaiter(this, void 0, void 0, function* () {
            if (this.destroyed)
                throw new __1.DMPError(__1.DMPErrors.QUEUE_DESTROYED);
            if (!((_a = this.connection) === null || _a === void 0 ? void 0 : _a.connection))
                throw new __1.DMPError(__1.DMPErrors.NO_VOICE_CONNECTION);
            options = Object.assign({}, __1.DefaultPlaylistOptions, options);

            //if (is_sc === false) {

            if (!is_sc) {
                playlist = yield __1.Utils.playlist(search, options, this)
                    .catch(error => {
                        throw new __1.DMPError(error);
                    });
            }
            //}
            let songLength = this.songs.length;
            if (!is_sc) {
                this.songs.push(...playlist.songs);
            } else {
                // '...' allows for all playlist tracks to be pushed at once rather than using a loop to do it. Super useful
                this.songs.push(...playlist.tracks);
            }

            if (!is_sc) {
                this.player.emit('playlistAdd', this, playlist);
            }
            if (songLength === 0) {
                if (!is_sc) {
                    playlist.songs[0]._setFirst();
                    yield this.play(playlist.songs[0], { immediate: true });
                } else if (is_sc) {
                    //this.player.emit('songFirst', this, playlist);
                    yield this.play(this.songs[0], { immediate: true });
                    // if (playlist.track_count > 1) {
                    //   for (var x = 1; x < playlist.track_count; x++) {
                    //        this.play(playlist.tracks[x].permalink_url);
                    //    }
                    // }
                    //yield this.play(playlist.tracks[0].permalink_url, { immediate: true });
                } else {
                    return message.error("Error: Song is not a playlist")
                }
            }
            return playlist;
        });
    }
    /**
     * Seeks the current playing Song
     * @param {number} time
     * @returns {boolean}
     */
    seek(time) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.destroyed)
                throw new __1.DMPError(__1.DMPErrors.QUEUE_DESTROYED);
            if (!this.isPlaying)
                throw new __1.DMPError(__1.DMPErrors.NOTHING_PLAYING);
            if (isNaN(time))
                return;
            if (time < 1)
                time = 0;
            if (time >= this.nowPlaying.milliseconds)
                return this.skip();
            yield this.play(this.nowPlaying, {
                immediate: true,
                seek: time
            });
            return true;
        });
    }
    /**
     * Skips the current playing Song and returns it
     * @param {number} [index=0]
     * @returns {Song}
     */
    skip(index = 0) {
        if (this.destroyed)
            throw new __1.DMPError(__1.DMPErrors.QUEUE_DESTROYED);
        if (this.songs.length > 1) {
            console.log(this.songs.length)
            this.songs.splice(1, index);
            const skippedSong = this.songs[1];
            this.connection.stop();
            return skippedSong;
        } else { return; }
    }
    /**
     * Stops playing the Music and cleans the Queue
     * @returns {void}
     */
    stop() {
        if (this.destroyed)
            throw new __1.DMPError(__1.DMPErrors.QUEUE_DESTROYED);
        return this.destroy();
    }
    /**
     * Shuffles the Queue
     * @returns {Song[]}
     */
    shuffle() {
        if (this.destroyed)
            throw new __1.DMPError(__1.DMPErrors.QUEUE_DESTROYED);
        let currentSong = this.songs.shift();
        this.songs = __1.Utils.shuffle(this.songs);
        this.songs.unshift(currentSong);
        return this.songs;
    }
    /**
     * Pause/resume the current Song
     * @param {boolean} [state=true] Pause state, if none it will pause the Song
     * @returns {boolean}
     */
    setPaused(state = true) {
        if (this.destroyed)
            throw new __1.DMPError(__1.DMPErrors.QUEUE_DESTROYED);
        if (!this.isPlaying)
            throw new __1.DMPError(__1.DMPErrors.NOTHING_PLAYING);
        return this.connection.setPauseState(state);
    }
    /**
     * Remove a Song from the Queue
     * @param {number} index
     * @returns {Song|undefined}
     */
    remove(index) {
        if (this.destroyed)
            throw new __1.DMPError(__1.DMPErrors.QUEUE_DESTROYED);
        let song = this.songs[index];
        if (song)
            this.songs = this.songs.filter((s) => s !== song);
        return song;
    }
    /**
     * Gets the current volume
     * @type {number}
     */
    get volume() {
        if (!this.connection)
            return __1.DefaultPlayerOptions.volume;
        return this.connection.volume;
    }
    /**
     * Gets the paused state of the player
     * @type {boolean}
     */
    get paused() {
        if (this.destroyed)
            throw new __1.DMPError(__1.DMPErrors.QUEUE_DESTROYED);
        if (!this.isPlaying)
            throw new __1.DMPError(__1.DMPErrors.NOTHING_PLAYING);
        return this.connection.paused;
    }
    /**
     * Sets the current volume
     * @param {number} volume
     * @returns {boolean}
     */
    setVolume(volume) {
        if (this.destroyed)
            throw new __1.DMPError(__1.DMPErrors.QUEUE_DESTROYED);
        this.options.volume = volume;
        return this.connection.setVolume(volume);
    }
    /**
     * Returns current playing song
     * @type {Song}
     */
    get nowPlaying() {
        var _a, _b;
        return (_b = (_a = this.connection.resource) === null || _a === void 0 ? void 0 : _a.metadata) !== null && _b !== void 0 ? _b : this.songs[0];
    }
    /**
     * Clears the Queue
     * @returns {void}
     */
    clearQueue() {
        if (this.destroyed)
            throw new __1.DMPError(__1.DMPErrors.QUEUE_DESTROYED);
        let currentlyPlaying = this.songs.shift();
        this.songs = [currentlyPlaying];
    }
    /**
     * Sets Queue repeat mode
     * @param {RepeatMode} repeatMode
     * @returns {boolean}
     */
    setRepeatMode(repeatMode) {
        if (this.destroyed)
            throw new __1.DMPError(__1.DMPErrors.QUEUE_DESTROYED);
        if (![__1.RepeatMode.DISABLED, __1.RepeatMode.QUEUE, __1.RepeatMode.SONG].includes(repeatMode))
            throw new __1.DMPError(__1.DMPErrors.UNKNOWN_REPEAT_MODE);
        if (repeatMode === this.repeatMode)
            return false;
        this.repeatMode = repeatMode;
        return true;
    }

    getRepeatMode() {
        return this.repeatMode;
    }
    /**
     * Creates Progress Bar class
     * @param {ProgressBarOptions} [options]
     * @returns {ProgressBar}
     */
    createProgressBar(options) {
        if (this.destroyed)
            throw new __1.DMPError(__1.DMPErrors.QUEUE_DESTROYED);
        if (!this.isPlaying)
            throw new __1.DMPError(__1.DMPErrors.NOTHING_PLAYING);
        return new __1.ProgressBar(this, options);
    }
    /**
     * Set's custom queue data
     * @param {any} data
     * @returns {void}
     */
    setData(data) {
        if (this.destroyed)
            throw new __1.DMPError(__1.DMPErrors.QUEUE_DESTROYED);
        this.data = data;
    }
    /**
     * Destroys the queue
     * @param {boolean} leaveOnStop
     * @returns {void}
     * @private
     */
    destroy(leaveOnStop = this.options.leaveOnStop) {
        var _a;
        if (this.destroyed)
            return;
        this.destroyed = true;
        if (this.connection)
            this.connection.stop();
        if (leaveOnStop)
            setTimeout(() => {
                var _a;
                (_a = this.connection) === null || _a === void 0 ? void 0 : _a.leave();
            }, ((_a = this.options) === null || _a === void 0 ? void 0 : _a.timeout) ? this.options.timeout : 0);
        this.player.deleteQueue(this.guild.id);
    }
}
exports.Queue = Queue;
