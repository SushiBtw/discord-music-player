/**
 * Specific errors.
 */
const customErrors = {
    'SearchIsNull': 'No Song was found with that query.',
    'VoiceChannelTypeInvalid': 'Voice Channel must be a type of VoiceChannel.',
    'SongTypeInvalid': 'Song must be a type of String.',
    'QueueIsNull': 'The Guild Queue is NULL.',
    'OptionsTypeInvalid': 'The Search Options must be a type of Object.',
    'NotANumber': 'The provided argument is not a Number.'
}

/**
 * Represents a Music Error.
 */
class MusicPlayerError {
    /**
     * @param {string} error Error.
     * @param {object} nullObject Object.
     */
    constructor(error, nullObject) {
        /**
         * Error type.
         * @type {string}
        */

        this.error = {};

        this.error.type = error;

        /**
         * Error message.
         * @type {string}
         */
        this.error.message = customErrors[error];

        if (nullObject)
            this[nullObject] = null;
    }
}

module.exports = MusicPlayerError;