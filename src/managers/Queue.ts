import {Guild, GuildChannelResolvable, Snowflake, StageChannel, VoiceChannel} from "discord.js";
import {StreamConnection} from "../voice/StreamConnection";
import {AudioResource,
    createAudioResource,
    DiscordGatewayAdapterCreator, entersState, joinVoiceChannel, StreamType, VoiceConnectionStatus } from "@discordjs/voice";
import ytdl from "discord-ytdl-core";
import { Playlist, Song, Player, Utils, DefaultPlayerOptions, PlayerOptions, PlayOptions, PlaylistOptions, RepeatMode, ProgressBarOptions, ProgressBar, DMPError, DMPErrors, DefaultPlayOptions, DefaultPlaylistOptions } from "..";

export class Queue {
    public player: Player;
    public guild: Guild;
    public connection: StreamConnection;
    public songs: Song[] = [];
    public isPlaying: boolean = false;
    public data?: any = null;
    public options: PlayerOptions = DefaultPlayerOptions;
    public repeatMode: RepeatMode = RepeatMode.DISABLED;
    public destroyed: boolean = false;

    /**
     * Queue constructor
     * @param {Player} player
     * @param {Guild} guild
     * @param {PlayerOptions} options
     */
    constructor(player: Player, guild: Guild, options?: PlayerOptions) {

        /**
         * Player instance
         * @name Queue#player
         * @type {Player}
         * @readonly
         */

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

        this.options = Object.assign(
            {} as PlayerOptions,
            options
        );
    }

    /**
     * Joins a voice channel
     * @param {GuildChannelResolvable} _channel
     * @returns {Promise<Queue>}
     */
    async join(channelId: GuildChannelResolvable) {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        if(this.connection)
            return this;
        const channel = this.guild.channels.resolve(channelId) as StageChannel | VoiceChannel;
        if(!channel)
            throw new DMPError(DMPErrors.UNKNOWN_VOICE);
        if (!channel.isVoice())
            throw new DMPError(DMPErrors.CHANNEL_TYPE_INVALID);
        let connection = joinVoiceChannel({
            guildId: channel.guild.id,
            channelId: channel.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
            selfDeaf: this.options.deafenOnJoin
        });
        let _connection: StreamConnection;
        try {
            connection = await entersState(connection, VoiceConnectionStatus.Ready, 15 * 1000);
            _connection = new StreamConnection(connection, channel);
        } catch (err) {
            connection.destroy();
            throw new DMPError(DMPErrors.VOICE_CONNECTION_ERROR);
        }
        this.connection = _connection;

        if (channel.type === "GUILD_STAGE_VOICE") {
            await channel.guild.me!.voice.setSuppressed(false).catch(async _ => {
                return await channel!.guild.me!.voice.setRequestToSpeak(true).catch(() => null);
            });
        }

        this.connection
            .on('start', (resource) => {
                this.isPlaying = true;
                if (resource?.metadata?.isFirst && resource?.metadata?.seekTime === 0)
                    this.player.emit('songFirst', this, this.nowPlaying);
            })
            .on('end', async (resource) => {
                if(this.destroyed)
                    return;
                this.isPlaying = false;
                let oldSong = this.songs.shift();
                if (this.songs.length === 0 && this.repeatMode === RepeatMode.DISABLED) {

                    this.player.emit('queueEnd', this);
                    if(this.options.leaveOnEnd)
                        setTimeout(() => {
                            if(!this.isPlaying)
                                this.destroy();
                        }, this.options.timeout)
                    return;
                } else {
                    if (this.repeatMode === RepeatMode.SONG) {
                        this.songs.unshift(oldSong!);
                        this.songs[0]._setFirst(false);
                        this.player.emit('songChanged', this, this.songs[0], oldSong);
                        return this.play(this.songs[0] as Song, { immediate: true });
                    } else if (this.repeatMode === RepeatMode.QUEUE) {
                        this.songs.push(oldSong!);
                        this.songs[this.songs.length - 1]._setFirst(false);
                        this.player.emit('songChanged', this, this.songs[0], oldSong);
                        return this.play(this.songs[0] as Song, { immediate: true });
                    }

                    this.player.emit('songChanged', this, this.songs[0], oldSong);
                    return this.play(this.songs[0] as Song, { immediate: true });
                }
            })
            .on('error', (err) => this.player.emit('error', this, err.message));
        return this;
    }

    /**
     * Plays or Queues a song (in a VoiceChannel)
     * @param {Song | string} search
     * @param {PlayOptions} [options=DefaultPlayOptions]
     * @returns {Promise<Song>}
     */
    async play(search: Song | string, options: PlayOptions & { immediate?: boolean, seek?: number, data?: any } = DefaultPlayOptions): Promise<Song> {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if(!this.connection?.connection)
            throw new DMPError(DMPErrors.NO_VOICE_CONNECTION);
        options = Object.assign(
            {} as PlayOptions,
            DefaultPlayOptions,
            options
        );
        let { data } = options;
        delete options.data;
        let song = await Utils.best(search, options, this)
            .catch(error => {
                throw new DMPError(error);
            });
        if(!options.immediate)
            song.data = data;

        let songLength = this.songs.length;
        if(!options?.immediate && songLength !== 0) {
            this.songs.push(song);
            this.player.emit('songAdd', this, song);
            return song;
        } else if(!options?.immediate) {
            song._setFirst();
            this.songs.push(song);
            this.player.emit('songAdd', this, song);
        } else if(options.seek)
            this.songs[0].seekTime = options.seek;

        let quality = this.options.quality;
        if(song.seekTime)
            options.seek = song.seekTime;

        let stream = ytdl(song.url, {
            opusEncoded: false,
            seek: options?.seek ? options.seek / 1000 : 0,
            fmt: 's16le',
            encoderArgs: [],
            quality: quality!.toLowerCase() === 'low' ? 'lowestaudio' : 'highestaudio',
            highWaterMark: 1 << 25
        })
            .on('error', (error: { message: string; }) => {
                if(!error.message.toLowerCase().includes("premature close"))
                    this.player.emit('error', error.message === 'Video unavailable' ? 'VideoUnavailable' : error.message, this);
               return;
            });

        const resource: AudioResource<Song> = this.connection.createAudioStream(stream, {
           metadata: song,
           inputType: StreamType.Raw
        });

        setTimeout(_ => {
            this.connection.playAudioStream(resource)
                .then(__ => {
                    this.setVolume(this.options.volume!);
                })
        });

        return song;
    }

    /**
     * Plays or Queues a playlist (in a VoiceChannel)
     * @param {Playlist | string} search
     * @param {PlaylistOptions} [options=DefaultPlaylistOptions]
     * @returns {Promise<Playlist>}
     */
    async playlist(search: Playlist | string, options: PlaylistOptions & { data?: any } = DefaultPlaylistOptions): Promise<Playlist> {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if(!this.connection?.connection)
            throw new DMPError(DMPErrors.NO_VOICE_CONNECTION);
        options = Object.assign(
            {} as PlaylistOptions & { data?: any },
            DefaultPlaylistOptions,
            options
        );
        let playlist = await Utils.playlist(search, options, this)
            .catch(error => {
                throw new DMPError(error);
            });
        let songLength = this.songs.length;
        this.songs.push(...playlist.songs);
        this.player.emit('playlistAdd', this, playlist);

        if(songLength === 0) {
            playlist.songs[0]._setFirst();
            await this.play(playlist.songs[0], { immediate: true });
        }

        return playlist;
    }

    /**
     * Seeks the current playing Song
     * @param {number} time
     * @returns {boolean}
     */
    async seek(time: number) {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if(!this.isPlaying)
            throw new DMPError(DMPErrors.NOTHING_PLAYING);

        if(isNaN(time))
            return;
        if (time < 1)
            time = 0;
        if (time >= this.nowPlaying.millisecons)
            return this.skip();

        await this.play(this.nowPlaying, {
            immediate: true,
            seek: time
        });

        return true;
    }

    /**
     * Skip the current Song and returns it
     * @returns {Song}
     */
    skip(): Song {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        let skippedSong = this.songs[0];
        this.connection.stop();
        return skippedSong;
    }

    /**
     * Stops playing the Music and cleans the Queue
     * @returns {void}
     */
    stop(): void {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        return this.destroy();
    }

    /**
     * Shuffles the Queue
     * @returns {Song[]}
     */
    shuffle(): Song[]|undefined {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        let currentSong = this.songs.shift();
        this.songs = Utils.shuffle(this.songs);
        this.songs.unshift(currentSong!);

        return this.songs;
    }

    /**
     * Pause/resume the current Song
     * @param {boolean} [state=true] Pause state, if none it will pause the Song
     * @returns {boolean}
     */
    setPaused(state: boolean = true): boolean|undefined {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if(!this.isPlaying)
            throw new DMPError(DMPErrors.NOTHING_PLAYING);

        return this.connection.setPauseState(state);
    }

    /**
     * Remove a Song from the Queue
     * @param {number} index
     * @returns {Song|undefined}
     */
    remove(index: number): Song|undefined {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        let song = this.songs[index];
        if (song)
            this.songs = this.songs.filter((s) => s !== song);

        return song;
    }

    /**
     * Gets the current volume
     * @type {number}
     */
    get volume(): number {
        if (!this.connection)
            return DefaultPlayerOptions.volume!;
        return this.connection.volume;
    }

    /**
     * Sets the current volume
     * @param {number} volume
     * @returns {boolean}
     */
    setVolume(volume: number) {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        this.options.volume = volume;
        return this.connection.setVolume(volume);
    }

    /**
     * Returns current playing song
     * @type {Song}
     */
    get nowPlaying() {
        return this.connection.resource?.metadata ?? this.songs[0];
    }

    /**
     * Clears the Queue
     * @returns {void}
     */
    clearQueue() {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        let currentlyPlaying = this.songs.shift();
        this.songs = [ currentlyPlaying! ];
    }

    /**
     * Sets Queue repeat mode
     * @param {RepeatMode} repeatMode
     * @returns {boolean}
     */
    setRepeatMode(repeatMode: RepeatMode): boolean {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        if (![RepeatMode.DISABLED, RepeatMode.QUEUE, RepeatMode.SONG].includes(repeatMode))
            throw new DMPError(DMPErrors.UNKNOWN_REPEAT_MODE);
        if (repeatMode === this.repeatMode)
            return false;
        this.repeatMode = repeatMode;
        return true;
    }

    /**
     * Creates Progress Bar class
     * @param {ProgressBarOptions} [options]
     * @returns {ProgressBar}
     */
    createProgressBar(options?: ProgressBarOptions): ProgressBar {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if(!this.isPlaying)
            throw new DMPError(DMPErrors.NOTHING_PLAYING);

        return new ProgressBar(this, options);
    }

    /**
     * Set's custom queue data
     * @param {any} data
     * @returns {void}
     */
    setData(data: any): void {
        if(this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        this.data = data;
    }

    /**
     * Destroys the queue
     * @param {boolean} leaveOnStop
     * @returns {void}
     * @private
     */
    destroy(leaveOnStop = this.options.leaveOnStop) {
        if(this.destroyed) return;
        this.destroyed = true;
        if (this.connection)
            this.connection.stop();
        if (leaveOnStop)
            this.connection?.leave();
        this.player.deleteQueue(this.guild.id);
    }

}
