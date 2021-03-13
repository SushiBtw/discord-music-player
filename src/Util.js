const YouTubeClient = require("youtubei");
const YouTube = new YouTubeClient.Client();
const Playlist = require('./Playlist');
const Song = require('./Song');
const ytsr = require('ytsr');
const { getPreview, getData } = require("spotify-url-info");
const mergeOptions = require('merge-options').bind({ignoreUndefined: true});
const Discord = require('discord.js');

//RegEx Definitions
let VideoRegex = /^((?:https?:)\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))((?!channel)(?!user)\/(?:[\w\-]+\?v=|embed\/|v\/)?)((?!channel)(?!user)[\w\-]+)(\S+)?$/;
let VideoRegexID = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
let PlaylistRegex = /^((?:https?:)\/\/)?((?:www|m)\.)?((?:youtube\.com)).*(youtu.be\/|list=)([^#&?]*).*/;
let PlaylistRegexID = /[&?]list=([^&]+)/;
let SpotifyRegex = /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-){22})(?:(?=\?)(?:[?&]foo=(\d*)(?=[&#]|$)|(?![?&]foo=)[^#])+)?(?=#|$)/;
let SpotifyPlaylistRegex = /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:(album|playlist)\/|\?uri=spotify:playlist:)((\w|-){22})(?:(?=\?)(?:[?&]foo=(\d*)(?=[&#]|$)|(?![?&]foo=)[^#])+)?(?=#|$)/;

/**
 * Get ID from YouTube link.
 * @param {String} url
 * @returns {String}
 */
function youtube_parser(url) {
    const match = url.match(VideoRegexID);
    return (match && match[7].length === 11) ? match[7] : false;
}

/**
 * Get ID from Playlist link.
 * @param {String} url
 * @returns {String}
 */
function playlist_parser(url) {
    const match = url.match(PlaylistRegexID);
    return (match && match[1].length === 34) ? match[1] : false;
}
/**
 * Gets Video Duration from Int
 * @param {String|Number} d
 * @returns {String|Number}
 */
function getVideoDuration(d) {
    let date = new Date(null);
    date.setSeconds(parseInt(d));
    let duration = date.toISOString().substr(11, 8);
    return duration.replace(/^0(?:0:0?)?/, '');
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
 * @property {String} uploadDate Upload date [Options: 'hour', 'today', 'week', 'month', 'year'] | Default: none
 * @property {String} duration Duration [Options: 'short', 'long'] | Default: none
 * @property {String} sortBy Sort by [Options: 'relevance', 'date', 'view count', 'rating'] | Default: relevance
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
     * Player options.
     * @typedef {PlayerOptions}
     *
     * @property {Boolean} leaveOnEnd Whether the bot should leave the current voice channel when the queue ends.
     * @property {Boolean} leaveOnStop Whether the bot should leave the current voice channel when the stop() function is used.
     * @property {Boolean} leaveOnEmpty Whether the bot should leave the voice channel if there is no more member in it.
     * @property {Number} timeout After how much time the bot should leave the voice channel after the OnEnd & OnEmpty events. | Default: 0
     * @property {Number} volume The default playing volume of the player. | Default: 100
     * @property {String} quality Music quality ['high'/'low'] | Default: high
     */
    static PlayerOptions = {
        leaveOnEnd: true,
        leaveOnStop: true,
        leaveOnEmpty: true,
        timeout: 0,
        volume: 100,
        quality: 'high'
    };

    static PlayOptions = {
        search: '',
        uploadDate: null,
        duration: null,
        sortBy: 'relevance',
        requestedBy: null,
        index: null
    };

    static PlaylistOptions =  {
        search: '',
        maxSongs: -1,
        requestedBy: null,
    };

    static ProgressOptions =  {
        size: 20,
        arrow: '>',
        block: '=',
    };

    /**
     * Gets the first youtube results for your search.
     * @param {String} search The name of the video or the video URL.
     * @param {Object<defaultSearchOptions>} options Options.
     * @param {Queue} queue Queue.
     * @param {String} requestedBy User that requested the song.
     * @returns {Promise<Song>}
     */
    static getVideoBySearch(search, options = {}, queue, requestedBy) {
        return new Promise(async (resolve, reject) => {

            options = { ...defaultSearchOptions, ...options };
            options = pick(options, Object.keys(defaultSearchOptions))

            if(SpotifyRegex.test(search)) {
                search = await this.songFromSpotify(search).catch(err => {
                    return reject(err);
                });
            }

            let isVideoLink = VideoRegex.test(search);

            if (isVideoLink) {
                // Search is a Valid YouTube link - skip ytsr

                let VideoID = youtube_parser(search);
                if (!VideoID) return reject('SearchIsNull');

                let video = await YouTube.getVideo(VideoID);
                video['duration'] = getVideoDuration(video.duration || 0);
                video['url'] = search;

                return resolve(new Song(video, queue, requestedBy));
            } else {
                let filters;

                // Default Options - Type: Video
                let filtersType = await ytsr.getFilters(search);

                await Promise.all(filtersType);

                filters = filtersType.get('Type').get('Video');

                // Custom Options - Upload date: null
                if (options.uploadDate != null) {
                    let filtersUploadDate = await ytsr.getFilters(filters.url);

                    await Promise.all(filtersUploadDate);

                    filters = Array.from(filtersUploadDate.get('Upload date'), ([name, value]) => ({ name, url: value.url }))
                        .find(o => o.name.toLowerCase().includes(options.uploadDate)) || filters;
                }

                // Custom Options - Duration: null
                if (options.duration != null) {
                    let filtersDuration = await ytsr.getFilters(filters.url);

                    await Promise.all(filtersDuration);

                    filters = Array.from(filtersDuration.get('Duration'), ([name, value]) => ({ name, url: value.url }))
                        .find(o => o.name.toLowerCase().startsWith(options.duration)) || filters;
                }

                // Custom Options - Sort by: relevance
                if (options.sortBy != null && !options.sortBy.toLowerCase().includes('relevance')) {
                    let filtersSortBy = await ytsr.getFilters(filters.url);

                    await Promise.all(filtersSortBy);

                    filters = Array.from(filtersSortBy.get('Sort by'), ([name, value]) => ({ name, url: value.url }))
                        .find(o => o.name.toLowerCase().includes(options.sortBy)) || filters;
                }

                const searchOptions = {
                    limit: 2, // Safe 2 search - look down.
                    nextpageRef: filters.url,
                }

                ytsr(filters.url, searchOptions).then(searchResults => {

                    let items = searchResults.items;

                    if (!items || !items[0]) return reject('SearchIsNull');

                    if (items[0].type.toLowerCase() !== 'video')
                        items.shift();

                    if (!items || !items[0]) return reject('SearchIsNull');

                    Promise.all(items = items.map(vid => {
                        return {
                            title: vid.title,
                            duration: vid.duration,
                            channel: {
                                name: vid.author.name,
                            },
                            url: vid.url,
                            thumbnail: vid.bestThumbnail.url,
                            isLiveContent: vid.isLive
                        };
                    }));

                    return resolve(new Song(items[0], queue, requestedBy));
                }).catch(() => {
                    return reject('SearchIsNull');
                });

            }
        });
    }

    /**
     * Gets the videos from playlist.
     * @param {string} search Playlist URL.
     * @param {Number} max Max playlist songs.
     * @param {Queue} queue Queue.
     * @param {String} requestedBy User that requested the song.
     * @returns {Promise<Playlist>}
     */
    static getVideoFromPlaylist(search, max, queue, requestedBy) {
        return new Promise(async (resolve, reject) => {

            let isSpotifyPlaylist = SpotifyPlaylistRegex.test(search);
            let isPlaylistLink = PlaylistRegex.test(search);
            if(isSpotifyPlaylist) {
                // Spotify Playlist
                let playlist = await getData(search).catch(() => null);
                if(!playlist || !['playlist', 'album'].includes(playlist['type'])) return reject('InvalidPlaylist');
                playlist = {
                    title: playlist['name'],
                    channel: playlist['type'] === 'playlist' ? { name: playlist['owner']['display_name'] } : playlist['artists'][0],
                    url: search,
                    videos: playlist['tracks'] ? playlist['tracks'].items : [],
                    videoCount: 0,
                    type: playlist['type']
                }

                playlist.videos = await Promise.all(playlist.videos.map(async (track, index) => {
                    if (max !== -1 && index >= max) return null;
                    if(playlist['type'] === 'playlist')
                        track = track['track'];
                    return await this.getVideoBySearch(`${track['artists'][0].name} - ${track['name']}`, {}, queue, requestedBy).catch(() => null);
                }));
                playlist.videos = playlist.videos.filter(function (obj) { return obj });
                playlist.videoCount = playlist.videos.length;
                playlist.videoCount = max === -1 ? playlist.videoCount : playlist.videoCount > max ? max : playlist.videoCount;

                return resolve(new Playlist(playlist, queue, requestedBy));

            } else if(isPlaylistLink) {
                // YouTube Playlist
                let PlaylistID = playlist_parser(search);
                if (!PlaylistID) return reject('InvalidPlaylist');

                /**
                 * @type {YouTubeClient.Playlist}
                 */
                let playlist = await YouTube.getPlaylist(PlaylistID);
                if (Object.keys(playlist).length === 0) return reject('InvalidPlaylist');

                await Promise.all(playlist.videos = playlist.videos.map((video, index) => {
                    if (max !== -1 && index >= max) return null;
                    video.duration = getVideoDuration(video.duration || 0);
                    video.url = `http://youtube.com/watch?v=${video.id}`;
                    video.isLiveContent = video.isLive;

                    return new Song(video, queue, requestedBy);
                }));
                playlist.videos = playlist.videos.filter(function (obj) { return obj });
                playlist['url'] = search;
                playlist.videoCount = max === -1 ? playlist.videoCount : playlist.videoCount > max ? max : playlist.videoCount;

                resolve(new Playlist(playlist, queue, requestedBy));
            } else return reject('InvalidPlaylist');
        });
    }

    /**
     * Converts a spotify track URL to a string containing the artist and song name.
     * @param {String} query The spotify song URL.
     * @returns {Promise<String>} The artist and song name (e.g. "Rick Astley - Never Gonna Give You Up")
     */
    static songFromSpotify(query) {
        return new Promise(async (resolve, reject) => {
            try {
                let SpotifyResult = await getPreview(query);
                resolve(`${SpotifyResult['artist']} - ${SpotifyResult['title']}`);
            }
            catch(err) {
                reject('InvalidSpotify');
            }
        });
    }

    /**
     * Converts Milliseconds to Time (HH:MM:SS)
     * @param {Number} ms Milliseconds
     * @returns {String}
     */
    static MillisecondsToTime(ms) {
        const seconds = Math.floor(ms / 1000 % 60);
        const minutes = Math.floor(ms / 60000 % 60);
        const hours = Math.floor(ms / 3600000);

        const secondsT = `${seconds}`.padStart(2,'0');
        const minutesT = `${minutes}`.padStart(2,'0');
        const hoursT = `${hours}`.padStart(2,'0');

        return `${hours ? `${hoursT}:` : ''}${minutesT}:${secondsT}`;
    }

    /**
     * Converts Time (HH:MM:SS) to Milliseconds
     * @param {String} time Time
     * @returns {number}
     */
    static TimeToMilliseconds(time) {
        const items = time.split(':');
        return items.reduceRight(
            (prev,curr,i,arr) => prev + parseInt(curr) * 60**(arr.length-1-i),
            0
        ) * 1000;
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

        return `[${progressText}${emptyProgressText}][${this.MillisecondsToTime(value)}/${this.MillisecondsToTime(maxValue)}]`;
    };

    /**
     * @param {Partial<Util.PlayerOptions>} options
     * @returns {PlayerOptions}
     */
    static deserializeOptionsPlayer(options) {
        if(typeof options === 'object')
            return mergeOptions(this.PlayerOptions, options);
        else return mergeOptions(this.PlayerOptions);
    }

    /**
     * @param {Partial<Util.PlayOptions>|String} options
     * @returns {PlayOptions}
     */
    static deserializeOptionsPlay(options) {
        if(typeof options === 'object')
            return mergeOptions(this.PlayOptions, options);
        else if(typeof options === 'string')
            return mergeOptions(this.PlayOptions, { search: options })
        else return mergeOptions(this.PlayOptions);
    }

    /**
     * @param {Partial<Util.PlaylistOptions>|String} options
     * @returns {PlaylistOptions}
     */
    static deserializeOptionsPlaylist(options) {
        if(typeof options === 'object')
            return mergeOptions(this.PlaylistOptions, options);
        else if(typeof options === 'string')
            return mergeOptions(this.PlaylistOptions, { search: options })
        else return mergeOptions(this.PlaylistOptions);
    }

    /**
     * @param {Partial<Util.ProgressOptions>} options
     * @returns {ProgressOptions}
     */
    static deserializeOptionsProgress(options) {
        if(typeof options === 'object')
            return mergeOptions(this.ProgressOptions, options);
        else return mergeOptions(this.ProgressOptions);
    }

    /**
     * @param {Discord.Message} message
     * @return {Boolean}
     */
    static isMessage(message) {
        return message.constructor.name === Discord.Message.name;
    }

    /**
     * @param {Discord.VoiceState} voice
     * @return {Boolean}
     */
    static isVoice(voice) {
        if(voice.constructor.name !== Discord.VoiceState.name)
            return false;

        return voice.channel ? voice.channel.constructor.name === Discord.VoiceChannel.name : false;
    }

}

module.exports = Util;