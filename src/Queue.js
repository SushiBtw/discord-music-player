const { EventEmitter } = require('events');

/**
 * Represents a guild queue.
 */
class Queue extends EventEmitter {

    /**
     * Represents a guild queue.
     * @param {string} guildID
     * @param {Object} options
     */
    constructor(guildID, options = {}){
        super();
        /**
         * The guild ID.
         * @type {Snowflake}
         */
        this.guildID = guildID;
        /**
         * The stream dispatcher.
         * @type {StreamDispatcher}
         */
        this.dispatcher = null;
        /**
         * The voice connection.
         * @type {VoiceConnection}
         */
        this.connection = null;
        /**
         * Songs. The first one is currently playing and the rest is going to be played.
         * @type {Song[]}
         */
        this.songs = [];
        /**
         * Whether the stream is currently stopped.
         * @type {Boolean}
         */
        this.stopped = false;
        /**
         * Whether the last song was skipped.
         * @type {Boolean}
         */
        this.skipped = false;
        /**
         * The stream volume.
         * @type {Number}
         */
        this.volume = options.volume || 100;
        /**
         * Whether the stream is currently playing.
         * @type {Boolean}
         */
        this.playing = true;
        /**
         * Whether the repeat mode is enabled.
         * @type {Boolean}
         */
        this.repeatMode = false;
        /**
         * Whether the full queue repeat mode is enabled.
         * @type {Boolean}
         */
        this.repeatQueue = false;

    }

}

module.exports = Queue;