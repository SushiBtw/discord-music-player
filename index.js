if (process.version.split('.')[0].substring(1) < 14) throw new Error("Discord.js requires NodeJS version >= 14.0.0, for Music Handlers now. Please update your Node at https://nodejs.org/en/.");
module.exports = {
    version: require('./package.json').version,
    Player: require('./src/Player'),
    Utils: require('./src/Util')
};