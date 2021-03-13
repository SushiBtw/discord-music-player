const YouTubeClient = require("youtubei");
/**
 * Represents a song.
 */
class Song {
    /**
     * @param {YouTubeClient.Video|YouTubeClient.VideoCompact|YouTubeClient.LiveVideo} video The Youtube video
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
         * @type {String|Number}
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
        this.url = video['url'];
        /**
         * Youtube video thumbnail.
         * @type {String}
         */
        this.thumbnail = video['thumbnail'] || video.thumbnails.best;
        /**
         * The queue in which the song is.
         * @type {Queue}
         */
        this.queue = queue;
        /**
         * Whenever the song is a livestream.
         * @type {Boolean}
         */
        this.isLive = video.isLiveContent;
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