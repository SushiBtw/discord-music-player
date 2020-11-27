let VideoRegex = /^((?:https?:)\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))((?!channel)(?!user)\/(?:[\w\-]+\?v=|embed\/|v\/)?)((?!channel)(?!user)[\w\-]+)(\S+)?$/;
let VideoRegexID = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
const scrapeYT = require('scrape-yt');
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
 * Utilities.
 * @ignore
 */
class Util {

    constructor() { }

    /**
     * Gets the first youtube results for your search.
     * @param {string} search The name of the video or the video URL.
     * @param {ytsr} ytsr ytsr.
     * @returns {Promise<Video>}
     */
    static getFirstSearch(search, ytsr) {
        return new Promise(async (resolve, reject) => {

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
                // v6.0.0 Custom Filters - ToDo

                const filters = await ytsr.getFilters(search);
                const filterVideo = filters.get('Type').find(o => o.name === 'Video');

                const options = {
                    limit: 1,
                    nextpageRef: filterVideo.ref,
                }

                ytsr(filterVideo.query, options).then(searchResults => {
                    if (!searchResults.items || !searchResults.items[0]) return reject('SearchIsNull');
                    resolve(searchResults.items[0]);
                }).catch((error) => {
                    return reject('SearchIsNull');
                });

            }
        });
    }
};

module.exports = Util;