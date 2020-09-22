/**
 * Utilities.
 * @ignore
 */
class Util {

    constructor(){}


    /**
     * Gets the first youtube results for your search.
     * @param {string} search The name of the video or the video URL.
     * @param {ytsr} ytsr ytsr.
     * @returns {Promise<Video>}
     */
    static getFirstSearch(search, ytsr){
        return new Promise(async (resolve, reject) => {
            search = search.replace(/<(.+)>/g, "$1");
            let filter;

            ytsr.getFilters(search, function (err, filters) {
                if (err) return resolve('err');
                filter = filters.get('Type').find(o => o.name === 'Video');
                var options = {
                    limit: 1,
                    nextpageRef: filter.ref,
                }
                ytsr(null, options, function (err, searchResults) {
                    if (err) return resolve('err');
                    if (!searchResults.items || !searchResults.items[0]) return resolve('err');
                    resolve(searchResults.items[0]);
                });
            });
            
        });
    }


};

module.exports = Util;