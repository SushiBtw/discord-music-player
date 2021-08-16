import {Guild, GuildChannelResolvable, Snowflake, StageChannel, VoiceChannel} from "discord.js";
import {StreamConnection} from "../voice/StreamConnection";
import {Song} from "./Song";
import {DefaultPlayerOptions, PlayerOptions, RepeatMode} from "../types/types";
import { Player } from "../Player";
import {DiscordGatewayAdapterCreator, entersState, joinVoiceChannel, VoiceConnectionStatus } from "@discordjs/voice";

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
                if (resource?.metadata)
                    this.player.emit(resource?.metadata ? 'songFirst' : 'songChanged', this, resource?.metadata ?? this.nowPlaying);
            })
            .on('end', async (resource) => {
                this.isPlaying = false;
                this.player.emit('songEnd', this, resource.metadata);
                if (!this.songs.length && this.repeatMode === RepeatMode.DISABLED) {
                    if (this.options.leaveOnEnd)
                        this.destroy();
                    this.player.emit('queueEnd', this);
                } else {
                    if (this.repeatMode === RepeatMode.SONG) {
                        // Play Song again
                    } else if (this.repeatMode === RepeatMode.QUEUE) {
                        // Add Song to the end of the Queue
                    }
                    const nextTrack = this.songs.shift();
                    // Play Song
                    return;
                }
            })
            .on('error', (err) => this.player.emit('error', this, err.message));
        return this;
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
     * The current volume
     * @type {number}
     */
    get volume(): number {
        if (!this.connection)
            return DefaultPlayerOptions.volume!;
        return this.connection.volume;
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
