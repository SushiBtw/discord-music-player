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

            const filters = await ytsr.getFilters(search);
            const filterVideo = filters.get('Type').find(o => o.name === 'Video');

            const options = {
                limit: 1,
                nextpageRef: filterVideo.ref,
            }

            ytsr(filterVideo.query, options).then(searchResults => {
                if (!searchResults.items || !searchResults.items[0]) return resolve('err');
                resolve(searchResults.items[0]);
            }).catch((error) => {
                return resolve('err');
            });
        });
    }


};

module.exports = Util;