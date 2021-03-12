process.env.YTDL_NO_UPDATE = 1;

module.exports = {
    version: require('./package.json').version,
    Player: require('./src/Player'),
    Utils: require('./src/Util')
};