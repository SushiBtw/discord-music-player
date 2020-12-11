const scrapeYT = require('scrape-yt');

//RegEx Definitions
let VideoRegex = /^((?:https?:)\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))((?!channel)(?!user)\/(?:[\w\-]+\?v=|embed\/|v\/)?)((?!channel)(?!user)[\w\-]+)(\S+)?$/;
let VideoRegexID = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;

/**
 * Get ID from YouTube link.
 * @param {string} url
 * @returns {string}
 */
function youtube_parser(url) {
    var match = url.match(VideoRegexID);
    return (match && match[7].length == 11) ? match[7] : false;
}

/**
 * A pure function to pick specific keys from object.
 * @param {Object} obj: The object to pick the specified keys from
 * @param {Array} keys: A list of all keys to pick from obj
 */
const pick = (obj, keys) =>
    Object.keys(obj)
        .filter(i => keys.includes(i))
        .reduce((acc, key) => {
            acc[key] = obj[key];
            return acc;
        }, {})

/**
 * Default search options
 * 
 * @property {string} uploadDate Upload date [Options: 'hour', 'today', 'week', 'month', 'year'] | Default: none
 * @property {string} duration Duration [Options: 'short', 'long'] | Default: none
 * @property {string} sortBy Sort by [Options: 'relevance', 'date', 'view count', 'rating'] | Default: relevance
 */
const defaultSearchOptions = {
    uploadDate: null,
    duration: null,
    sortBy: 'relevance',
}

/**
 * Utilities.
 * @ignore
 */
class Util {

    constructor() { }

    /**
     * Gets the first youtube results for your search.
     * @param {string} search The name of the video or the video URL.
     * @param {ytsr} ytsr ytsr.
     * @param {object} options Options.
     * @returns {Promise<Video>}
     */
    static getVideoBySearch(search, ytsr, options = {}) {
        return new Promise(async (resolve, reject) => {

            options = { ...defaultSearchOptions, ...options };
            options = pick(options, Object.keys(defaultSearchOptions))

            let isVideoLink = VideoRegex.test(search);

            if (isVideoLink) {
                // Search is a Valid YouTube link - skip ytsr

                let VideoID = youtube_parser(search);
                if (!VideoID) return reject('SearchIsNull');

                let video = await scrapeYT.getVideo(VideoID);

                if (Object.keys(video).length === 0)
                    console.warn('[DMP] YouTube returned a empty object, you are probably rate-limited (please wait some time) - The Author and Title are Unknown.');

                // Callback on invalid duration
                if (typeof video.duration != 'number') {
                    video.duration = parseInt(video.duration) || 0;
                }

                var date = new Date(null);
                date.setSeconds(video.duration);
                var duration = date.toISOString().substr(11, 8);
                duration = duration.replace(/^0(?:0:0?)?/, '');

                let defaultThumbnail = 'https://reactnativecode.com/wp-content/uploads/2018/02/Default_Image_Thumbnail.png';

                return resolve({
                    title: video.title || 'Unknown',
                    duration,
                    author: video.channel ? video.channel.name || 'Unknown' : 'Unknown',
                    link: search,
                    thumbnail: video.channel ? video.channel.thumbnail || defaultThumbnail : defaultThumbnail
                });

            } else {
                var filters;

                // Default Options - Type: Video
                let filtersType = await ytsr.getFilters(search);

                await Promise.all(filtersType);

                filters = filtersType.get('Type').find(o => o.name === 'Video');

                // Custom Options - Upload date: null
                if (options.uploadDate != null) {
                    let filtersUploadDate = await ytsr.getFilters(filters.ref);

                    await Promise.all(filtersUploadDate);

                    filters = filtersUploadDate.get('Upload date').find(o => o.name.toLowerCase().includes(options.uploadDate)) || filters;
                }

                // Custom Options - Duration: null
                if (options.duration != null) {
                    let filtersDuration = await ytsr.getFilters(filters.ref);

                    await Promise.all(filtersDuration);

                    filters = filtersDuration.get('Duration').find(o => o.name.toLowerCase().startsWith(options.duration)) || filters;
                }

                // Custom Options - Sort by: relevance
                if (options.sortBy != null && !options.sortBy.toLowerCase().includes('relevance')) {
                    let filtersSortBy = await ytsr.getFilters(filters.ref);

                    await Promise.all(filtersSortBy);

                    filters = filtersSortBy.get('Sort by').find(o => o.name.toLowerCase().includes(options.sortBy)) || filters;
                }

                const searchOptions = {
                    limit: 2,
                    nextpageRef: filters.ref,
                }

                ytsr(filters.query, searchOptions).then(searchResults => {

                    let items = searchResults.items;

                    if (!items || !items[0]) return reject('SearchIsNull');

                    if (items[0].type.toLowerCase() != 'video')
                        items.shift();

                    if (!items || !items[0]) return reject('SearchIsNull');

                    resolve(items[0]);
                }).catch((error) => {
                    return reject('SearchIsNull');
                });

            }
        });
    }

    /**
     * Convers Milisecords to Time (HH:MM:SS)
     * @param {String} ms Miliseconds
     * @returns {String}
     */
    static MilisecondsToTime(ms) {
        let seconds = ms / 1000;
        let hours = parseInt(seconds / 3600);
        seconds = seconds % 3600;
        let minutes = parseInt(seconds / 60);
        seconds = Math.ceil(seconds % 60);

        seconds = (`0${seconds}`).slice(-2);
        minutes = (`0${minutes}`).slice(-2);
        hours = (`0${hours}`).slice(-2);

        return `${hours == 0 ? '' : `${hours}:`}${minutes}:${seconds}`;
    }

    /**
     * Convers Time (HH:MM:SS) to Miliseconds
     * @param {String} time Time
     * @returns {String}
     */
    static TimeToMiliseconds(time) {
        let items = time.split(':'),
            s = 0, m = 1;

        while (items.length > 0) {
            s += m * parseInt(items.pop(), 10);
            m *= 60;
        }

        return s * 1000;
    }

    /**
     * Create a text progress bar
     * @param {Number} value - The value to fill the bar
     * @param {Number} maxValue - The max value of the bar
     * @param {Number} size - The bar size (in letters)
     * @param {String} loadedIcon - Loaded Icon
     * @param {String} arrowIcon - Arrow Icon
     * @return {String} - Music Bar
     */
    static buildBar(value, maxValue, size, loadedIcon, arrowIcon) {
        const percentage = value / maxValue;
        const progress = Math.round((size * percentage));
        const emptyProgress = size - progress;

        const progressText = loadedIcon.repeat(progress) + arrowIcon;
        const emptyProgressText = ' '.repeat(emptyProgress);

        return `[${progressText}${emptyProgressText}][${this.MilisecondsToTime(value)}/${this.MilisecondsToTime(maxValue)}]`;
    };


};

module.exports = Util;