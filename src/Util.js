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
 * A pure function to pick specific keys from object, similar to https://lodash.com/docs/4.17.4#pick
 * @param {Object}obj: The object to pick the specified keys from
 * @param {Array}keys: A list of all keys to pick from obj
 */
const pick = (obj, keys) =>
    Object.keys(obj)
        .filter(i => keys.includes(i))
        .reduce((acc, key) => {
            acc[key] = obj[key];
            return acc;
        }, {})

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

            options = { ...{ uploadDate: null, duration: null, sortBy: 'relevance' }, ...options};
            options = pick(options, ['uploadDate', 'duration', 'sortBy']);

            let isVideoLink = VideoRegex.test(search);

            if (isVideoLink) {
                // Search is a Valid YouTube link - skip ytsr

                let VideoID = youtube_parser(search);
                if (!VideoID) return reject('SearchIsNull');

                const video = await scrapeYT.getVideo(VideoID);

                var date = new Date(null);
                date.setSeconds(video.duration);
                var duration = date.toISOString().substr(11, 8);
                duration = duration.replace(/^0(?:0:0?)?/, '');

                return resolve({
                    title: video.title,
                    duration,
                    author: video.channel.name,
                    link: search,
                    thumbnail: video.channel.thumbnail
                });

            } else {
                var filters;

                // Default Options - Type: Video
                let filtersType = await ytsr.getFilters(search);
                filters = filtersType.get('Type').find(o => o.name === 'Video');

                // Custom Options - Upload date: null
                if (options.uploadDate) {
                    let filtersUploadDate = await ytsr.getFilters(filters.ref);
                    filters = filtersUploadDate.get('Upload date').find(o => o.name.toLowerCase().includes(options.uploadDate)) || filters;
                }

                // Custom Options - Duration: null
                if (options.duration) {
                    let filtersDuration = await ytsr.getFilters(filters.ref);
                    filters = filtersDuration.get('Duration').find(o => o.name.toLowerCase().startsWith(options.duration)) || filters;
                }

                // Custom Options - Sort by: relevance
                if (options.sortBy && !options.sortBy.toLowerCase().includes('relevance')) {
                    let filtersSortBy = await ytsr.getFilters(filters.ref);
                    filters = filtersSortBy.get('Sort by').find(o => o.name.toLowerCase().includes(options.sortBy)) || filters;
                }

                const searchOptions = {
                    limit: 2,
                    nextpageRef: filters.ref,
                }

                ytsr(filters.query, searchOptions).then(searchResults => {

                    let items = searchResults.items;

                    if (!items || !items[0]) return reject('SearchIsNull');

                    if (items[0].type != 'Video')
                        items.shift();

                    if (!items || !items[0]) return reject('SearchIsNull');

                    resolve(items[0]);
                }).catch((error) => {
                    return reject('SearchIsNull');
                });

            }
        });
    }
};

module.exports = Util;