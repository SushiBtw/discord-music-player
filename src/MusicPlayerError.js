/**
 * Specific errors.
 */
const customErrors = {
    'MessageTypeInvalid': 'Message must me a type of Message.',
    'SearchIsNull': 'No Song was found with that query.',
    'VoiceChannelTypeInvalid': 'Voice Channel must be a type of VoiceChannel.',
    'SongTypeInvalid': 'Song must be a type of String.',
    'QueueIsNull': 'The Guild Queue is NULL.',
    'OptionsTypeInvalid': 'The Search Options must be a type of Object.',
    'NotANumber': 'The provided argument is not a Number.',
    'InvalidPlaylist': 'No Playlist was found with that link.',
    'MaxSongsTypeInvalid': 'The provided argument (MaxSongsTypeInvalid) is not a Number.',
    'PlaylistTypeInvalid': 'The provided argument (PlaylistURL) was not a String.',
    'InvalidSpotify': 'No Spotify Song was found with that link.'
}

/**
 * Represents a Music Error.
 */
class MusicPlayerError {
    /**
     * @param {String} error Error message type.
     */
    constructor(error) {

        /**
         * Error message.
         * @type {String}
         */
        this.type = error;
        /**
         * Error message.
         * @type {String}
         */
        this.message = customErrors[error];
    }
}

module.exports = MusicPlayerError;