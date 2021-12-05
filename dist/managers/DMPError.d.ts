declare class DMPError extends Error {
    name: string;
    message: string;
    /**
     * DMPError constructor
     * @param {DMPErrors} code
     */
    constructor(code?: DMPErrors);
    /**
     * DMPError in JSON representation
     * @returns {{message: string, code: string}}
     */
    toJSON(): {
        message: string;
        code: string;
    };
    /**
     * DMPError in string representation
     * @returns {string}
     */
    toString(): string;
}
/**
 * The DMPErrors short messages.
 * Following modes exists:
 * - UNKNOWN = 'Unknown',
 * - QUEUE_DESTROYED = 'QueueDestroyed',
 * - NOTHING_PLAYING = 'NothingPlaying',
 * - UNKNOWN_VOICE = 'UnknownVoice',
 * - CHANNEL_TYPE_INVALID = 'ChannelTypeInvalid',
 * - VOICE_CONNECTION_ERROR = 'VoiceConnectionError',
 * - NO_VOICE_CONNECTION = 'NoVoiceConnection',
 * - UNKNOWN_REPEAT_MODE = 'UnknownRepeatMode',
 * - RESOURCE_NOT_READY = 'ResourceNotReady',
 * - INVALID_GUILD = 'InvalidGuild'
 * - INVALID_GUILD = 'InvalidGuild',
 * - SEARCH_NULL = 'SearchIsNull',
 * - INVALID_PLAYLIST = 'InvalidPlaylist',
 * - INVALID_SPOTIFY = 'InvalidSpotify'
 * - UNKNOWN_SONG = 'UnknownSong'
 * @typedef {string} DMPErrors
 */
export declare enum DMPErrors {
    UNKNOWN = "Unknown",
    QUEUE_DESTROYED = "QueueDestroyed",
    NOTHING_PLAYING = "NothingPlaying",
    UNKNOWN_VOICE = "UnknownVoice",
    CHANNEL_TYPE_INVALID = "ChannelTypeInvalid",
    VOICE_CONNECTION_ERROR = "VoiceConnectionError",
    NO_VOICE_CONNECTION = "NoVoiceConnection",
    UNKNOWN_REPEAT_MODE = "UnknownRepeatMode",
    RESOURCE_NOT_READY = "ResourceNotReady",
    INVALID_GUILD = "InvalidGuild",
    SEARCH_NULL = "SearchIsNull",
    INVALID_PLAYLIST = "InvalidPlaylist",
    INVALID_SPOTIFY = "InvalidSpotify",
    INVALID_APPLE = "InvalidApple",
    UNKNOWN_SONG = "UnknownSong"
}
/**
 * The DMPErrors short messages.
 * Following modes exists:
 * - Unknown: `There was an Unknown Error.`,
 * - QueueDestroyed: `The Queue was destroyed.`,
 * - NothingPlaying: `There is currently no Song playing in the Voice Channel.`,
 * - UnknownVoice: `The provided Member is not in a Voice Channel.`,
 * - ChannelTypeInvalid: `The provided Channel is not a Voice Channel.`,
 * - VoiceConnectionError: `There was an Error while starting the Voice Stream`,
 * - NoVoiceConnection: `There is no Queue#connection [you should use Queue#join()] first.`,
 * - UnknownRepeatMode: `The provided RepeatMode was not valid.`,
 * - ResourceNotReady: `The AudioResource was not ready.`,
 * - InvalidGuild: `The provided Guild was invalid.`,
 * - SearchIsNull: `The was no YouTube song found by that query.`,
 * - InvalidSpotify: `The was no Spotify song found with that link.`,
 * - InvalidPlaylist: `There was no Playlist found with that link.`
 * @typedef {DMPErrorMessages}
 */
export declare const DMPErrorMessages: {
    Unknown: string;
    QueueDestroyed: string;
    NothingPlaying: string;
    UnknownVoice: string;
    ChannelTypeInvalid: string;
    VoiceConnectionError: string;
    NoVoiceConnection: string;
    UnknownRepeatMode: string;
    ResourceNotReady: string;
    InvalidGuild: string;
    SearchIsNull: string;
    InvalidSpotify: string;
    InvalidPlaylist: string;
    InvalidApple: string;
    UnknownSong: string;
};
export { DMPError };
