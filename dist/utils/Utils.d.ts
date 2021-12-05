import { Song, Queue, Playlist, PlayOptions, PlaylistOptions } from "..";
export declare class Utils {
    /**
     *
     */
    private constructor();
    static regexList: {
        YouTubeVideo: RegExp;
        YouTubeVideoID: RegExp;
        YouTubePlaylist: RegExp;
        YouTubePlaylistID: RegExp;
        Spotify: RegExp;
        SpotifyPlaylist: RegExp;
        Apple: RegExp;
        ApplePlaylist: RegExp;
    };
    /**
     * Get ID from YouTube link
     * @param {string} url
     * @returns {?string}
     */
    static parseVideo(url: string): string | null;
    /**
     * Get timecode from YouTube link
     * @param {string} url
     * @returns {?string}
     */
    static parseVideoTimecode(url: string): string | null;
    /**
     * Get ID from Playlist link
     * @param {string} url
     * @returns {?string}
     */
    static parsePlaylist(url: string): string | null;
    /**
     * Search for Songs
     * @param {string} Search
     * @param {PlayOptions} [SOptions=DefaultPlayOptions]
     * @param {Queue} Queue
     * @param {number} [Limit=1]
     * @return {Promise<Song[]>}
     */
    static search(Search: string, SOptions: PlayOptions | undefined, Queue: Queue, Limit?: number): Promise<Song[]>;
    /**
     * Search for Song via link
     * @param {string} Search
     * @param {PlayOptions} SOptions
     * @param {Queue} Queue
     * @return {Promise<Song>}
     */
    static link(Search: string, SOptions: PlayOptions | undefined, Queue: Queue): Promise<Song | null>;
    /**
     * Gets the best result of a Search
     * @param {Song|string} Search
     * @param {PlayOptions} SOptions
     * @param {Queue} Queue
     * @return {Promise<Song>}
     */
    static best(Search: Song | string, SOptions: PlayOptions | undefined, Queue: Queue): Promise<Song>;
    /**
     * Search for Playlist
     * @param {string} Search
     * @param {PlaylistOptions} SOptions
     * @param {Queue} Queue
     * @return {Promise<Playlist>}
     */
    static playlist(Search: Playlist | string, SOptions: (PlaylistOptions & {
        data?: any;
    }) | undefined, Queue: Queue): Promise<Playlist>;
    /**
     * Shuffles an array
     * @param {any[]} array
     * @returns {any[]}
     */
    static shuffle(array: any[]): any[];
    /**
     * Converts milliseconds to duration (HH:MM:SS)
     * @returns {string}
     */
    static msToTime(duration: number): string;
    /**
     * Converts duration (HH:MM:SS) to milliseconds
     * @returns {number}
     */
    static timeToMs(duration: string): number;
}
