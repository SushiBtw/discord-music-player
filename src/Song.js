/**
 * Represents a song.
 */
class Song {
    /**
     * @param {Video} video The Youtube video
     * @param {Queue} queue The queue in which the song is
     * @param {String} requestedBy The request user
     */
    constructor(video, queue, requestedBy) {
        /**
         * Song name.
         * @type {string}
         */
        this.name = video.title;
        /**
         * Song duration.
         * @type {String}
         */
        this.duration = video.duration;
        /**
         * Author channel of the song.
         * @type {string}
         */
        this.author = video.channel.name;
        /**
         * Youtube video URL.
         * @type {string}
         */
        this.url = video.url;
        /**
         * Youtube video thumbnail.
         * @type {string}
         */
        this.thumbnail = video.thumbnail;
        /**
         * The queue in which the song is.
         * @type {Queue}
         */
        this.queue = queue;
        /**
         * The user who requested that song.
         * @type {User}
         */
        this.requestedBy = requestedBy;
    }
}

module.exports = Song;