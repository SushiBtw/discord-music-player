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
         * @type {String}
         */
        this.name = video.title;
        /**
         * Song duration.
         * @type {String}
         */
        this.duration = video.duration;
        /**
         * Author channel of the song.
         * @type {String}
         */
        this.author = video.channel.name;
        /**
         * Youtube video URL.
         * @type {String}
         */
        this.url = video.url;
        /**
         * Youtube video thumbnail.
         * @type {String}
         */
        this.thumbnail = video.thumbnail;
        /**
         * The queue in which the song is.
         * @type {Queue}
         */
        this.queue = queue;
        /**
         * The user who requested that song.
         * @type {String}
         */
        this.requestedBy = requestedBy;
        /**
         * The song seek time.
         * @type {Number}
         */
        this.seekTime = 0;
    }
}

module.exports = Song;