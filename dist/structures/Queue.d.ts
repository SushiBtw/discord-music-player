import { Guild, GuildChannelResolvable } from "discord.js";
import { StreamConnection } from "../voice/StreamConnection";
import { Song } from "./Song";
import { PlayerOptions, PlayOptions, RepeatMode } from "../types/types";
import { Player } from "../Player";
import { AudioResource } from "@discordjs/voice";
export declare class Queue {
    player: Player;
    guild: Guild;
    connection: StreamConnection;
    songs: Song[];
    isPlaying: boolean;
    data?: any;
    options: PlayerOptions;
    repeatMode: RepeatMode;
    destroyed: boolean;
    constructor(player: Player, guild: Guild, options?: PlayerOptions);
    /**
     * Joins a voice channel
     * @param {GuildChannelResolvable} _channel
     * @returns {Promise<Queue>}
     */
    join(channelId: GuildChannelResolvable): Promise<this>;
    play(search: Song | string, options: PlayOptions): Promise<Song>;
    play_sc(search: Song | string, stream: AudioResource, options: PlayOptions): Promise<Song>;
    /**
     * Destroys the queue
     * @param {boolean} leaveOnStop
     * @returns {void}
     */
    destroy(leaveOnStop?: boolean | undefined): void;
    /**
     * Gets the current volume
     * @type {number}
     */
    get volume(): number;
    /**
     * Sets the current volume
     * @param {number} volume
     * @returns {boolean}
     */
    setVolume(volume: number): boolean;
    /**
     * Returns current track
     * @type {Song}
     */
    get nowPlaying(): Song;
    /**
     * Set's custom queue data
     * @param {any} data
     * @returns {void}
     */
    setData(data: any): void;
}
