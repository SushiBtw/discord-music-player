/**
 * Specific errors.
 */
const customErrors = {
    'SearchIsNull': 'No Song was found with that query.',
    'VoiceChannelTypeInvalid': 'Voice Channel must be a type of VoiceChannel.',
    'SongTypeInvalid': 'Song must be a type of String.',
    'QueueIsNull': 'The Guild Queue is NULL.',
    'OptionsTypeInvalid': 'The Search Options must be a type of Object.',
    'NotANumber': 'The provided argument is not a Number.',
    'InvalidPlaylist': 'No Playlist was found with that link.',
    'MaxSongsTypeInvalid': 'The provided argument (MaxSongsTypeInvalid) is not a Number.',
    'PlaylistTypeInvalid': 'The provided argument (PlaylistURL) was not a String.'
}

/**
 * Represents a Music Error.
 */
class MusicPlayerError {
    /**
     * @param {string} error Error.
     * @param {object} nullObject Object.
     */
    constructor(error, nullObject, playlistNull) {
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
        if (playlistNull)
            this[playlistNull] = null;
    }
}

module.exports = MusicPlayerError;