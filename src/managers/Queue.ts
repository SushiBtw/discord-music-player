import {Guild, GuildChannelResolvable, Snowflake, StageChannel, VoiceChannel} from "discord.js";
import {StreamConnection} from "../voice/StreamConnection";
import {Song} from "./Song";
import {DefaultPlayerOptions, PlayerOptions, PlayOptions, RepeatMode} from "../types/types";
import { Player } from "../Player";
import {AudioResource,
    createAudioResource,
    DiscordGatewayAdapterCreator, entersState, joinVoiceChannel, StreamType, VoiceConnectionStatus } from "@discordjs/voice";
import { Utils } from "../utils/Utils";
import ytdl from "discord-ytdl-core";

export class Queue {
    public player: Player;
    public guild: Guild;
    public connection: StreamConnection;
    public songs: Song[] = [];
    public isPlaying: boolean = false;
    public data?: any = null;
    public options: PlayerOptions;
    public repeatMode: RepeatMode = RepeatMode.DISABLED;
    public destroyed: boolean = false;

    constructor(player: Player, guild: Guild, options?: PlayerOptions) {
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

        Object.assign(
            this.options,
            DefaultPlayerOptions,
            options
        );
    }

    /**
     * Joins a voice channel
     * @param {GuildChannelResolvable} _channel
     * @returns {Promise<Queue>}
     */
    async join(channelId: GuildChannelResolvable) {
        if(this.destroyed) throw 'QueueDestroyed';
        if(this.connection)
            return this;
        const channel = this.guild.channels.resolve(channelId) as StageChannel | VoiceChannel;
        if (!channel.isVoice())
            throw 'InvalidChannelType';
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
            throw 'VoiceConnectionError'
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
                if (resource?.metadata?.isFirst)
                    this.player.emit('songFirst', this, this.nowPlaying);
            })
            .on('end', async (resource) => {
                this.isPlaying = false;
                let oldSong = this.songs.shift();
                if (this.songs.length === 0 && this.repeatMode === RepeatMode.DISABLED) {
                    this.destroy();
                    return this.player.emit('queueEnd', this);
                } else {
                    if (this.repeatMode === RepeatMode.SONG) {
                        this.player.emit('songChanged', this, oldSong, oldSong);
                        return this.play(oldSong as Song, { immediate: true });
                    } else if (this.repeatMode === RepeatMode.QUEUE) {
                        this.songs.push(oldSong!);
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
     * @param {PlayOptions} options
     * @returns {Promise<Queue>}
     */
    async play(search: Song | string, options?: PlayOptions & { immediate?: boolean }): Promise<Song> {
        if(this.destroyed) throw 'QueueDestroyed';
        if(!this.connection?.connection)
            throw 'NoVoiceConnection';
        let song = await Utils.best(search, options, this);
        if(!options?.immediate) {
            this.player.emit('songAdd', this, song);
        }

        let songLength = this.songs.length;
        if(!options?.immediate && songLength !== 0) {
            this.songs.push(song);
            return song;
        } else if(!options?.immediate) {
            song._setFirst();
            this.songs.push(song);
        }

        let quality = this.options.quality;

        let stream = ytdl(song.url, {
            opusEncoded: false,
            fmt: 's16le',
            encoderArgs: [],
            quality: quality!.toLowerCase() === 'low' ? 'lowestaudio' : 'highestaudio',
            highWaterMark: 1 << 25
        })
            .on('error', (error: { message: string; }) => {
                if(!error.message.toLowerCase().includes("premature close"))
                    this.player.emit('error', error.message === 'Video unavailable' ? 'VideoUnavailable' : error.message, this);
               this.repeatMode = RepeatMode.DISABLED;
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
     * Destroys the queue
     * @param {boolean} leaveOnStop
     * @returns {void}
     */
    destroy(leaveOnStop = this.options.leaveOnStop) {
        if(this.destroyed) return;
        if (this.connection)
            this.connection.stop();
        if (leaveOnStop)
            this.connection?.leave();
        this.destroyed = true;
        this.player.deleteQueue(this.guild.id);
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
        if (!this.connection) return false;
        this.options.volume = volume;
        return this.connection.setVolume(volume);
    }

    /**
     * Returns current track
     * @type {Song}
     */
    get nowPlaying() {
        return this.connection.resource?.metadata ?? this.songs[0];
    }

    /**
     * Set's custom queue data
     * @param {any} data
     * @returns {void}
     */
    setData(data: any): void {
        this.data = data;
    }

}
