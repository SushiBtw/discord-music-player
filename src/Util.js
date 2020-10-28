const ytsr = require('./ytsearch/main');
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
    static getFirstSearch(search) {
        return new Promise(async (resolve, reject) => {
            search = search.replace(/<(.+)>/g, "$1");
            console.log(search)
            ytsr(search).then(searchResults => {
                if (!searchResults.items || !searchResults.items[0]) return resolve('err');
                resolve(searchResults.items[0]);
            });
        });
    }


};

module.exports = Util;