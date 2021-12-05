import { ProgressBarOptions, Queue } from "..";
declare class ProgressBar {
    private queue;
    options: ProgressBarOptions;
    bar: string;
    times: string;
    /**
     * ProgressBar constructor
     * @param {Queue} queue
     * @param {ProgressBarOptions} [options=DefaultProgressBarOptions]
     */
    constructor(queue: Queue, options?: ProgressBarOptions);
    /**
     * Creates the Progress Bar
     * @private
     */
    private create;
    /**
     * Progress Bar in a prettier representation
     * @type {string}
     */
    get prettier(): string;
    /**
     * Progress Bar in string representation
     * @returns {string}
     */
    toString(): string;
}
export { ProgressBar };
