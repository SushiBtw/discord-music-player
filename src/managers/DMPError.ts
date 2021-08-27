class DMPError extends Error {
    name: string;
    message: string;

    /**
     * DMPError constructor
     * @param {DMPErrors} code
     */
    constructor(code: DMPErrors = DMPErrors.UNKNOWN) {
        super();

        /**
         * DMPError short name (code)
         * @name DMPError#name
         * @type {string}
         */

        /**
         * DMPError long message
         * @name DMPError#message
         * @type {string}
         */

        this.name = code;
        this.message = DMPErrorMessages[code] ?? DMPErrorMessages[DMPErrors.UNKNOWN];
    }

    /**
     * DMPError in JSON representation
     * @returns {{message: string, code: string}}
     */
    toJSON() {
        return { message: this.message, code: this.name };
    }

    /**
     * DMPError in string representation
     * @returns {string}
     */
    toString() {
        return this.message;
    }
}

/**
 * The DMPErrors short messages.
 * Following modes exists:
 * - UNKNOWN = 'Unknown',
 * - QUEUE_DESTROYED = 'QueueDestroyed',
 * - UNKNOWN_VOICE = 'UnknownVoice',
 * - CHANNEL_TYPE_INVALID = 'ChannelTypeInvalid',
 * - VOICE_CONNECTION_ERROR = 'VoiceConnectionError',
 * - NO_VOICE_CONNECTION = 'NoVoiceConnection',
 * - UNKNOWN_REPEAT_MODE = 'UnknownRepeatMode',
 * - RESOURCE_NOT_READY = 'ResourceNotReady',
 * - INVALID_GUILD = 'InvalidGuild'
 * @typedef {string} DMPErrors
 */
export enum DMPErrors {
    UNKNOWN = 'Unknown',
    QUEUE_DESTROYED = 'QueueDestroyed',
    UNKNOWN_VOICE = 'UnknownVoice',
    CHANNEL_TYPE_INVALID = 'ChannelTypeInvalid',
    VOICE_CONNECTION_ERROR = 'VoiceConnectionError',
    NO_VOICE_CONNECTION = 'NoVoiceConnection',
    UNKNOWN_REPEAT_MODE = 'UnknownRepeatMode',
    RESOURCE_NOT_READY = 'ResourceNotReady',
    INVALID_GUILD = 'InvalidGuild'
}

/**
 * The DMPErrors short messages.
 * Following modes exists:
 * - Unknown: `There was an Unknown Error.`,
 * - QueueDestroyed: `The Queue was destroyed.`,
 * - UnknownVoice: `The provided Member is not in a Voice Channel.`,
 * - ChannelTypeInvalid: `The provided Channel is not a Voice Channel.`,
 * - VoiceConnectionError: `There was an Error while starting the Voice Stream`,
 * - NoVoiceConnection: `There is no Queue#connection [you should use Queue#join()] first.`,
 * - UnknownRepeatMode: `The provided RepeatMode was not valid.`,
 * - ResourceNotReady: `The AudioResource was not ready.`,
 * - InvalidGuild: `The provided Guild was invalid.`
 */
export const DMPErrorMessages = {
    Unknown: 'There was an Unknown Error.',
    QueueDestroyed: 'The Queue was destroyed.',
    UnknownVoice: 'The provided Member is not in a Voice Channel.',
    ChannelTypeInvalid: 'The provided Channel is not a Voice Channel.',
    VoiceConnectionError: 'There was an Error while starting the Voice Stream',
    NoVoiceConnection: 'There is no Queue#connection [you should use Queue#join()] first.',
    UnknownRepeatMode: 'The provided RepeatMode was not valid.',
    ResourceNotReady: 'The AudioResource was not ready.',
    InvalidGuild: 'The provided Guild was invalid.'
}

export { DMPError };
