/**
 * Represents a song.
 */
class Song {
    /**
     * @param {Video} video The Youtube video
     * @param {Queue} queue The queue in which the song is
     */
    constructor(video, queue, requestedBy) {
        /**
         * Song name.
         * @type {string}
         */
        this.name = video.title;
        /**
         * Song duration.
         * @type {Number}
         */
        this.duration = video.duration;
        /**
         * Author channel of the song.
         * @type {string}
         */
        this.author = video.author.name || video.author;
        /**
         * Youtube video URL.
         * @type {string}
         */
        this.url = video.link;
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
};

module.exports = Song;