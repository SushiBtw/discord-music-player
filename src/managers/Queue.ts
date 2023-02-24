import {Guild, GuildChannelResolvable, GuildMember, StageChannel, VoiceChannel} from "discord.js";
import {StreamConnection} from "../voice/StreamConnection";
import {AudioResource, entersState, joinVoiceChannel, StreamType, VoiceConnectionStatus} from "@discordjs/voice";
import ytdl from "discord-ytdl-core";
import {
    DefaultPlayerOptions,
    DefaultPlaylistOptions,
    DefaultPlayOptions,
    DMPError,
    DMPErrors,
    Player,
    PlayerOptions,
    Playlist,
    PlaylistOptions,
    PlayOptions,
    ProgressBar,
    ProgressBarOptions,
    RepeatMode,
    Song,
    Utils
} from "..";

export class Queue<T = unknown> {
    public player: Player;
    public guild: Guild;
    public connection: StreamConnection | undefined;
    public songs: Song[] = [];
    public isPlaying: boolean = false;
    public data?: T;
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
         * @type {?StreamConnection}
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

        this.options = {...DefaultPlayerOptions, ...options};
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
     * Gets the paused state of the player
     * @type {boolean}
     */
    get paused(): boolean {
        if (this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if (!this.connection)
            throw new DMPError(DMPErrors.NO_VOICE_CONNECTION);
        if (!this.isPlaying)
            throw new DMPError(DMPErrors.NOTHING_PLAYING);

        return this.connection.paused;
    }

    /**
     * Returns current playing song
     * @type {?Song}
     */
    get nowPlaying(): Song | undefined {
        return this.connection?.resource?.metadata ?? this.songs[0];
    }

    /**
     * Joins a voice channel
     * @param {GuildChannelResolvable} channelId
     * @returns {Promise<Queue>}
     */
    async join(channelId: GuildChannelResolvable) {
        if (this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        if (this.connection)
            return this;
        const channel = this.guild.channels.resolve(channelId) as StageChannel | VoiceChannel;
        if (!channel)
            throw new DMPError(DMPErrors.UNKNOWN_VOICE);
        if (!Utils.isVoiceChannel(channel))
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

        if (Utils.isStageVoiceChannel(channel)) {
            const _guild = channel.guild as Guild & {
                me?: GuildMember;
            };
            const me = _guild.me ? _guild.me : _guild.members.me!;
            await me.voice.setSuppressed(false).catch(async _ => {
                return await channel!.guild.members.me!.voice.setRequestToSpeak(true).catch(() => null);
            });
        }

        this.connection
            .on('start', (resource) => {
                this.isPlaying = true;
                if (resource?.metadata?.isFirst && resource?.metadata?.seekTime === 0)
                    this.player.emit('songFirst', this, this.nowPlaying);
            })
            .on('end', async (resource) => {
                if (this.destroyed) {
                    this.player.emit('queueDestroyed', this);
                    return;
                }
                this.isPlaying = false;
                let oldSong = this.songs.shift();
                if (this.songs.length === 0 && this.repeatMode === RepeatMode.DISABLED) {

                    this.player.emit('queueEnd', this);
                    if (this.options.leaveOnEnd)
                        setTimeout(() => {
                            if (!this.isPlaying)
                                this.leave();
                        }, this.options.timeout)
                    return;
                } else {
                    if (this.repeatMode === RepeatMode.SONG) {
                        this.songs.unshift(oldSong!);
                        this.songs[0]._setFirst(false);
                        this.player.emit('songChanged', this, this.songs[0], oldSong);
                        return this.play(this.songs[0] as Song, {immediate: true});
                    } else if (this.repeatMode === RepeatMode.QUEUE) {
                        this.songs.push(oldSong!);
                        this.songs[this.songs.length - 1]._setFirst(false);
                        this.player.emit('songChanged', this, this.songs[0], oldSong);
                        return this.play(this.songs[0] as Song, {immediate: true});
                    }

                    this.player.emit('songChanged', this, this.songs[0], oldSong);
                    return this.play(this.songs[0] as Song, {immediate: true});
                }
            })
            .on('error', (err) => this.player.emit('error', err.message, this));
        return this;
    }

    /**
     * Plays or Queues a song (in a VoiceChannel)
     * @param {Song | string} search
     * @param {PlayOptions} [options=DefaultPlayOptions]
     * @returns {Promise<Song>}
     */
    async play(search: Song | string, options: PlayOptions & { immediate?: boolean, seek?: number, data?: T } = DefaultPlayOptions): Promise<Song> {
        if (this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if (!this.connection)
            throw new DMPError(DMPErrors.NO_VOICE_CONNECTION);
        options = Object.assign(
            {} as PlayOptions,
            DefaultPlayOptions,
            options
        );
        let {data} = options;
        delete options.data;
        let song = await Utils.best(search, options, this)
            .catch(error => {
                throw new DMPError(error);
            });
        if (!options.immediate)
            song.data = data;

        if (options?.seek)
            song.seekTime = options.seek;

        let songLength = this.songs.length;
        if (!options?.immediate && songLength !== 0) {
            if (options?.index! >= 0 && ++options.index! <= songLength)
                this.songs.splice(options.index!, 0, song);
            else this.songs.push(song);
            this.player.emit('songAdd', this, song);
            return song;
        } else if (!options?.immediate) {
            song._setFirst();
            if (options?.index! >= 0 && ++options.index! <= songLength)
                this.songs.splice(options.index!, 0, song);
            else this.songs.push(song);
            this.player.emit('songAdd', this, song);
        }

        let quality = this.options.quality;
        song = this.songs[0];
        if (song.seekTime)
            options.seek = song.seekTime;

        let stream = ytdl(song.url, {
            requestOptions: this.player.options.ytdlRequestOptions ?? {},
            opusEncoded: false,
            seek: options.seek ? options.seek / 1000 : 0,
            fmt: 's16le',
            encoderArgs: [],
            quality: quality!.toLowerCase() === 'low' ? 'lowestaudio' : 'highestaudio',
            highWaterMark: 1 << 25,
            filter: !song.duration ? null : 'audioonly'
        })
            .on('error', (error: { message: string; }) => {
                if (!/Status code|premature close/i.test(error.message))
                    this.player.emit('error', error.message === 'Video unavailable' ? 'VideoUnavailable' : error.message, this);
                return;
            });

        const resource: AudioResource<Song> = this.connection.createAudioStream(stream, {
            metadata: song,
            inputType: StreamType.Raw
        });

        setTimeout(_ => {
            this.connection!.playAudioStream(resource)
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
    async playlist(search: Playlist | string, options: PlaylistOptions & { data?: T } = DefaultPlaylistOptions): Promise<Playlist> {
        if (this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if (!this.connection)
            throw new DMPError(DMPErrors.NO_VOICE_CONNECTION);
        options = Object.assign(
            {} as PlaylistOptions & { data?: T },
            DefaultPlaylistOptions,
            options
        );
        let playlist = await Utils.playlist(search, options, this)
            .catch(error => {
                throw new DMPError(error);
            });
        let songLength = this.songs.length;
        if (options?.index! >= 0 && ++options.index! <= songLength)
            this.songs.splice(options.index!, 0, ...playlist.songs);
        else this.songs.push(...playlist.songs);
        this.player.emit('playlistAdd', this, playlist);

        if (songLength === 0) {
            playlist.songs[0]._setFirst();
            await this.play(playlist.songs[0], {immediate: true});
        }

        return playlist;
    }

    /**
     * Seeks the current playing Song
     * @param {number} time
     * @returns {boolean}
     */
    async seek(time: number) {
        if (this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if (!this.isPlaying)
            throw new DMPError(DMPErrors.NOTHING_PLAYING);

        if (isNaN(time))
            return;
        if (time < 1)
            time = 0;
        if (time >= this.nowPlaying!.milliseconds)
            return this.skip();

        await this.play(this.nowPlaying!, {
            immediate: true,
            seek: time
        });

        return true;
    }

    /**
     * Skips the current playing Song and returns it
     * @param {number} [index=0]
     * @returns {Song}
     */
    skip(index: number = 0): Song {
        if (this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if (!this.connection)
            throw new DMPError(DMPErrors.NO_VOICE_CONNECTION);
        this.songs.splice(1, index);

        const skippedSong = this.songs[0];
        this.connection.stop();
        return skippedSong;
    }

    /**
     * Moves a Song to a new position.
     * The indices can't be the same or start with 0, because 0 is the current playing Song
     * @param {number} oldIndex - The old index of the Song
     * @param {number} [newIndex] - The new index of the Song, if not provided, the Song will be moved to the beginning
     * @returns {boolean}
     */
    move(oldIndex: number, newIndex?: number): boolean {
        if (this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        
        if (!this.connection)
            throw new DMPError(DMPErrors.NO_VOICE_CONNECTION);
        
        if (newIndex === undefined)
            newIndex = 1;
        
        if (oldIndex === undefined || oldIndex < 1 || oldIndex >= this.songs.length)
            throw new DMPError(DMPErrors.INVALID_INDEX);  
        
        if (newIndex < 1 || newIndex >= this.songs.length)
            throw new DMPError(DMPErrors.INVALID_INDEX);
        
        if (oldIndex === newIndex)
            throw new DMPError(DMPErrors.INVALID_INDEX);
        
        const song = this.songs[oldIndex];
        this.songs.splice(oldIndex, 1);
        this.songs.splice(newIndex, 0, song);

        this.player.emit('songMoved', this, song, oldIndex, newIndex);

        return true;
    }

    /**
     * Stops playing the Music and cleans the Queue
     * @returns {void}
     */
    stop(): void {
        if (this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        if (this.options.leaveOnStop) {
            setTimeout(() => {
                this.leave();
            }, this.options.timeout);
        } else {
            this.clearQueue()
            this.skip()
        }
    }

    /**
     * Shuffles the Queue
     * @returns {Song[]}
     */
    shuffle(): Song[] | undefined {
        if (this.destroyed)
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
    setPaused(state: boolean = true): boolean | undefined {
        if (this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if (!this.connection)
            throw new DMPError(DMPErrors.NO_VOICE_CONNECTION);
        if (!this.isPlaying)
            throw new DMPError(DMPErrors.NOTHING_PLAYING);

        return this.connection.setPauseState(state);
    }

    /**
     * Remove a Song from the Queue
     * @param {number} index
     * @returns {Song|undefined}
     */
    remove(index: number): Song | undefined {
        if (this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        return this.songs.splice(index, 1)[0];
    }

    /**
     * Sets the current volume
     * @param {number} volume
     * @returns {boolean}
     */
    setVolume(volume: number) {
        if (this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if (!this.connection)
            throw new DMPError(DMPErrors.NO_VOICE_CONNECTION);

        this.options.volume = volume;
        return this.connection.setVolume(volume);
    }

    /**
     * Clears the Queue
     * @returns {void}
     */
    clearQueue() {
        if (this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        let currentlyPlaying = this.songs.shift();
        this.songs = [currentlyPlaying!];
    }

    /**
     * Sets Queue repeat mode
     * @param {RepeatMode} repeatMode
     * @returns {boolean}
     */
    setRepeatMode(repeatMode: RepeatMode): boolean {
        if (this.destroyed)
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
        if (this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);
        if (!this.isPlaying)
            throw new DMPError(DMPErrors.NOTHING_PLAYING);

        return new ProgressBar(this, options);
    }

    /**
     * Set's custom queue data
     * @param {any} data
     * @returns {void}
     */
    setData(data: T): void {
        if (this.destroyed)
            throw new DMPError(DMPErrors.QUEUE_DESTROYED);

        this.data = data;
    }

    /**
     * Disconnects the player
     * @returns {void}
     */
    leave(): void {
        this.destroyed = true;
        this.connection?.leave();
        this.player.deleteQueue(this.guild.id);
    }

}
