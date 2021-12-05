"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressBar = void 0;
const __1 = require("..");
class ProgressBar {
    /**
     * ProgressBar constructor
     * @param {Queue} queue
     * @param {ProgressBarOptions} [options=DefaultProgressBarOptions]
     */
    constructor(queue, options = __1.DefaultProgressBarOptions) {
        /**
         * Guild instance
         * @name ProgressBar#guild
         * @type {Guild}
         * @private
         */
        this.options = __1.DefaultProgressBarOptions;
        /**
         * ProgressBar options
         * @name ProgressBar#options
         * @type {PlayerOptions}
         */
        /**
         * Progress Bar without timecodes
         * @name ProgressBar#bar
         * @type {string}
         */
        /**
         * Progress Bar timecodes
         * @name ProgressBar#times
         * @type {string}
         */
        if (queue.destroyed)
            throw new __1.DMPError(__1.DMPErrors.QUEUE_DESTROYED);
        if (!queue.connection)
            throw new __1.DMPError(__1.DMPErrors.NO_VOICE_CONNECTION);
        if (!queue.isPlaying)
            throw new __1.DMPError(__1.DMPErrors.NOTHING_PLAYING);
        this.queue = queue;
        this.options = Object.assign({}, this.options, options);
        this.create();
    }
    /**
     * Creates the Progress Bar
     * @private
     */
    create() {
        const { size, arrow, block } = this.options;
        const currentTime = this.queue.nowPlaying.seekTime + this.queue.connection.time;
        const progress = Math.round((size * currentTime / this.queue.nowPlaying.milliseconds));
        const emptyProgress = size - progress;
        const progressString = block.repeat(progress) + arrow + ' '.repeat(emptyProgress);
        this.bar = progressString;
        this.times = `${__1.Utils.msToTime(currentTime)}/${this.queue.nowPlaying.duration}`;
    }
    /**
     * Progress Bar in a prettier representation
     * @type {string}
     */
    get prettier() {
        return `[${this.bar}][${this.times}]`;
    }
    /**
     * Progress Bar in string representation
     * @returns {string}
     */
    toString() {
        return this.options.time ? this.prettier : `[${this.bar}]`;
    }
}
exports.ProgressBar = ProgressBar;
