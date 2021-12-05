"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
const __1 = require("..");
const ytsr_1 = __importDefault(require("ytsr"));
const spotify_url_info_1 = require("spotify-url-info");
const AppleUtils_1 = require("./AppleUtils");
const youtubei_1 = require("youtubei");
let YouTube = new youtubei_1.Client();
class Utils {
    /**
     *
     */
    constructor() { }
    /**
     * Get ID from YouTube link
     * @param {string} url
     * @returns {?string}
     */
    static parseVideo(url) {
        const match = url.match(this.regexList.YouTubeVideoID);
        return match ? match[7] : null;
    }
    /**
     * Get timecode from YouTube link
     * @param {string} url
     * @returns {?string}
     */
    static parseVideoTimecode(url) {
        const match = url.match(this.regexList.YouTubeVideo);
        return match ? match[10] : null;
    }
    /**
     * Get ID from Playlist link
     * @param {string} url
     * @returns {?string}
     */
    static parsePlaylist(url) {
        const match = url.match(this.regexList.YouTubePlaylistID);
        return match ? match[1] : null;
    }
    /**
     * Search for Songs
     * @param {string} Search
     * @param {PlayOptions} [SOptions=DefaultPlayOptions]
     * @param {Queue} Queue
     * @param {number} [Limit=1]
     * @return {Promise<Song[]>}
     */
    static search(Search, SOptions = __1.DefaultPlayOptions, Queue, Limit = 1) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            SOptions = Object.assign({}, __1.DefaultPlayOptions, SOptions);
            let Filters;
            try {
                // Default Options - Type: Video
                let FiltersTypes = yield ytsr_1.default.getFilters(Search);
                Filters = FiltersTypes.get('Type').get('Video');
                // Custom Options - Upload date: null
                if ((SOptions === null || SOptions === void 0 ? void 0 : SOptions.uploadDate) !== null)
                    Filters = (_a = Array.from((yield ytsr_1.default.getFilters(Filters.url))
                        .get('Upload date'), ([name, value]) => ({ name, url: value.url }))
                        .find(o => o.name.toLowerCase().includes(SOptions === null || SOptions === void 0 ? void 0 : SOptions.uploadDate))) !== null && _a !== void 0 ? _a : Filters;
                // Custom Options - Duration: null
                if ((SOptions === null || SOptions === void 0 ? void 0 : SOptions.duration) !== null)
                    Filters = (_b = Array.from((yield ytsr_1.default.getFilters(Filters.url))
                        .get('Duration'), ([name, value]) => ({ name, url: value.url }))
                        .find(o => o.name.toLowerCase().startsWith(SOptions === null || SOptions === void 0 ? void 0 : SOptions.duration))) !== null && _b !== void 0 ? _b : Filters;
                // Custom Options - Sort by: relevance
                if ((SOptions === null || SOptions === void 0 ? void 0 : SOptions.sortBy) !== null && (SOptions === null || SOptions === void 0 ? void 0 : SOptions.sortBy) !== 'relevance')
                    Filters = (_c = Array.from((yield ytsr_1.default.getFilters(Filters.url))
                        .get('Sort by'), ([name, value]) => ({ name, url: value.url }))
                        .find(o => o.name.toLowerCase().includes(SOptions === null || SOptions === void 0 ? void 0 : SOptions.sortBy))) !== null && _c !== void 0 ? _c : Filters;
                let Result = yield ytsr_1.default(Filters.url, {
                    limit: Limit,
                });
                let items = Result.items;
                let songs = items.map(item => {
                    var _a;
                    if (((_a = item === null || item === void 0 ? void 0 : item.type) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== 'video')
                        return null;
                    return new __1.Song({
                        name: item.title,
                        url: item.url,
                        duration: item.duration,
                        author: item.author.name,
                        isLive: item.isLive,
                        thumbnail: item.bestThumbnail.url,
                    }, Queue, SOptions.requestedBy);
                }).filter(I => I);
                return songs;
            }
            catch (e) {
                throw __1.DMPErrors.SEARCH_NULL;
            }
        });
    }
    /**
     * Search for Song via link
     * @param {string} Search
     * @param {PlayOptions} SOptions
     * @param {Queue} Queue
     * @return {Promise<Song>}
     */
    static link(Search, SOptions = __1.DefaultPlayOptions, Queue) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let SpotifyLink = this.regexList.Spotify.test(Search);
            let YouTubeLink = this.regexList.YouTubeVideo.test(Search);
            let AppleLink = this.regexList.Apple.test(Search);
            if (AppleLink) {
                try {
                    let AppleResult = yield AppleUtils_1.getSong(Search);
                    let SearchResult = yield this.search(`${AppleResult.artist} - ${AppleResult.title}`, SOptions, Queue);
                    return SearchResult[0];
                }
                catch (e) {
                    throw __1.DMPErrors.INVALID_APPLE;
                }
            }
            else if (SpotifyLink) {
                try {
                    let SpotifyResult = yield spotify_url_info_1.getPreview(Search);
                    let SearchResult = yield this.search(`${SpotifyResult.artist} - ${SpotifyResult.title}`, SOptions, Queue);
                    return SearchResult[0];
                }
                catch (e) {
                    throw __1.DMPErrors.INVALID_SPOTIFY;
                }
            }
            else if (YouTubeLink) {
                let VideoID = this.parseVideo(Search);
                if (!VideoID)
                    throw __1.DMPErrors.SEARCH_NULL;
                YouTube = new youtubei_1.Client({
                    requestOptions: {
                        localAddress: SOptions.localAddress
                    }
                });
                let VideoResult = yield YouTube.getVideo(VideoID);
                if (!VideoResult)
                    throw __1.DMPErrors.SEARCH_NULL;
                let VideoTimecode = this.parseVideoTimecode(Search);
                return new __1.Song({
                    name: VideoResult.title,
                    url: Search,
                    duration: this.msToTime(((_a = VideoResult.duration) !== null && _a !== void 0 ? _a : 0) * 1000),
                    author: VideoResult.channel.name,
                    isLive: VideoResult.isLiveContent,
                    thumbnail: VideoResult.thumbnails.best,
                    seekTime: SOptions.timecode && VideoTimecode ? Number(VideoTimecode) * 1000 : null,
                }, Queue, SOptions.requestedBy);
            }
            else
                return null;
        });
    }
    /**
     * Gets the best result of a Search
     * @param {Song|string} Search
     * @param {PlayOptions} SOptions
     * @param {Queue} Queue
     * @return {Promise<Song>}
     */
    static best(Search, SOptions = __1.DefaultPlayOptions, Queue) {
        return __awaiter(this, void 0, void 0, function* () {
            let _Song;
            if (Search instanceof __1.Song)
                return Search;
            _Song = yield this.link(Search, SOptions, Queue);
            if (!_Song)
                _Song = (yield this.search(Search, SOptions, Queue))[0];
            return _Song;
        });
    }
    /**
     * Search for Playlist
     * @param {string} Search
     * @param {PlaylistOptions} SOptions
     * @param {Queue} Queue
     * @return {Promise<Playlist>}
     */
    static playlist(Search, SOptions = __1.DefaultPlaylistOptions, Queue) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            if (Search instanceof __1.Playlist)
                return Search;
            let Limit = (_a = SOptions.maxSongs) !== null && _a !== void 0 ? _a : -1;
            let SpotifyPlaylistLink = this.regexList.SpotifyPlaylist.test(Search);
            let YouTubePlaylistLink = this.regexList.YouTubePlaylist.test(Search);
            let ApplePlaylistLink = this.regexList.ApplePlaylist.test(Search);
            if (ApplePlaylistLink) {
                let AppleResultData = yield AppleUtils_1.getPlaylist(Search).catch(() => null);
                if (!AppleResultData)
                    throw __1.DMPErrors.INVALID_PLAYLIST;
                let AppleResult = {
                    name: AppleResultData.name,
                    author: AppleResultData.author,
                    url: Search,
                    songs: [],
                    type: AppleResultData.type
                };
                AppleResult.songs = yield Promise.all((AppleResultData.tracks).map((track, index) => __awaiter(this, void 0, void 0, function* () {
                    if (Limit !== -1 && index >= Limit)
                        return null;
                    let Result = yield this.search(`${track.artist} - ${track.title}`, SOptions, Queue).catch(() => null);
                    if (Result && Result[0]) {
                        Result[0].data = SOptions.data;
                        return Result[0];
                    }
                    else
                        return null;
                }))
                    .filter((V) => V));
                if (AppleResult.songs.length === 0)
                    throw __1.DMPErrors.INVALID_PLAYLIST;
                if (SOptions.shuffle)
                    AppleResult.songs = this.shuffle(AppleResult.songs);
                return new __1.Playlist(AppleResult, Queue, SOptions.requestedBy);
            }
            else if (SpotifyPlaylistLink) {
                let SpotifyResultData = yield spotify_url_info_1.getData(Search).catch(() => null);
                if (!SpotifyResultData || !['playlist', 'album'].includes(SpotifyResultData.type))
                    throw __1.DMPErrors.INVALID_PLAYLIST;
                let SpotifyResult = {
                    name: SpotifyResultData.name,
                    author: SpotifyResultData.type === 'playlist' ? { name: SpotifyResultData.owner.display_name } : SpotifyResultData.artists[0].name,
                    url: Search,
                    songs: [],
                    type: SpotifyResultData.type
                };
                SpotifyResult.songs = yield Promise.all((SpotifyResultData.tracks ? SpotifyResultData.tracks.items : []).map((track, index) => __awaiter(this, void 0, void 0, function* () {
                    if (Limit !== -1 && index >= Limit)
                        return null;
                    if (SpotifyResult.type === 'playlist')
                        track = track.track;
                    let Result = yield this.search(`${track.artists[0].name} - ${track.name}`, SOptions, Queue).catch(() => null);
                    if (Result) {
                        Result[0].data = SOptions.data;
                        return Result[0];
                    }
                    else
                        return null;
                }))
                    .filter((V) => V));
                if (SpotifyResult.songs.length === 0)
                    throw __1.DMPErrors.INVALID_PLAYLIST;
                if (SOptions.shuffle)
                    SpotifyResult.songs = this.shuffle(SpotifyResult.songs);
                return new __1.Playlist(SpotifyResult, Queue, SOptions.requestedBy);
            }
            else if (YouTubePlaylistLink) {
                let PlaylistID = this.parsePlaylist(Search);
                if (!PlaylistID)
                    throw __1.DMPErrors.INVALID_PLAYLIST;
                YouTube = new youtubei_1.Client({
                    requestOptions: {
                        localAddress: SOptions.localAddress
                    }
                });
                let YouTubeResultData = yield YouTube.getPlaylist(PlaylistID);
                if (!YouTubeResultData || Object.keys(YouTubeResultData).length === 0)
                    throw __1.DMPErrors.INVALID_PLAYLIST;
                let YouTubeResult = {
                    name: YouTubeResultData.title,
                    author: YouTubeResultData instanceof youtubei_1.Playlist ? (_c = (_b = YouTubeResultData.channel) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : 'YouTube Mix' : 'YouTube Mix',
                    url: Search,
                    songs: [],
                    type: 'playlist'
                };
                if (YouTubeResultData instanceof youtubei_1.Playlist && YouTubeResultData.videoCount > 100 && (Limit === -1 || Limit > 100))
                    yield YouTubeResultData.next(Math.floor((Limit === -1 || Limit > YouTubeResultData.videoCount ? YouTubeResultData.videoCount : Limit - 1) / 100));
                YouTubeResult.songs = YouTubeResultData.videos.map((video, index) => {
                    var _a;
                    if (Limit !== -1 && index >= Limit)
                        return null;
                    let song = new __1.Song({
                        name: video.title,
                        url: `https://youtube.com/watch?v=${video.id}`,
                        duration: this.msToTime(((_a = video.duration) !== null && _a !== void 0 ? _a : 0) * 1000),
                        author: video.channel.name,
                        isLive: video.isLive,
                        thumbnail: video.thumbnails.best,
                    }, Queue, SOptions.requestedBy);
                    song.data = SOptions.data;
                    return song;
                })
                    .filter((V) => V);
                if (YouTubeResult.songs.length === 0)
                    throw __1.DMPErrors.INVALID_PLAYLIST;
                if (SOptions.shuffle)
                    YouTubeResult.songs = this.shuffle(YouTubeResult.songs);
                return new __1.Playlist(YouTubeResult, Queue, SOptions.requestedBy);
            }
            throw __1.DMPErrors.INVALID_PLAYLIST;
        });
    }
    /**
     * Shuffles an array
     * @param {any[]} array
     * @returns {any[]}
     */
    static shuffle(array) {
        if (!Array.isArray(array))
            return [];
        const clone = [...array];
        const shuffled = [];
        while (clone.length > 0)
            shuffled.push(clone.splice(Math.floor(Math.random() * clone.length), 1)[0]);
        return shuffled;
    }
    /**
     * Converts milliseconds to duration (HH:MM:SS)
     * @returns {string}
     */
    static msToTime(duration) {
        const seconds = Math.floor(duration / 1000 % 60);
        const minutes = Math.floor(duration / 60000 % 60);
        const hours = Math.floor(duration / 3600000);
        const secondsPad = `${seconds}`.padStart(2, '0');
        const minutesPad = `${minutes}`.padStart(2, '0');
        const hoursPad = `${hours}`.padStart(2, '0');
        return `${hours ? `${hoursPad}:` : ''}${minutesPad}:${secondsPad}`;
    }
    /**
     * Converts duration (HH:MM:SS) to milliseconds
     * @returns {number}
     */
    static timeToMs(duration) {
        return duration.split(':')
            .reduceRight((prev, curr, i, arr) => prev + parseInt(curr) * Math.pow(60, (arr.length - 1 - i)), 0) * 1000;
    }
}
exports.Utils = Utils;
Utils.regexList = {
    YouTubeVideo: /^((?:https?:)\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))((?!channel)(?!user)\/(?:[\w\-]+\?v=|embed\/|v\/)?)((?!channel)(?!user)[\w\-]+)(((.*(\?|\&)t=(\d+))(\D?|\S+?))|\D?|\S+?)$/,
    YouTubeVideoID: /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/,
    YouTubePlaylist: /^((?:https?:)\/\/)?((?:www|m)\.)?((?:youtube\.com)).*(youtu.be\/|list=)([^#&?]*).*/,
    YouTubePlaylistID: /[&?]list=([^&]+)/,
    Spotify: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-)+)(?:(?=\?)(?:[?&]foo=(\d*)(?=[&#]|$)|(?![?&]foo=)[^#])+)?(?=#|$)/,
    SpotifyPlaylist: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:(album|playlist)\/|\?uri=spotify:playlist:)((\w|-)+)(?:(?=\?)(?:[?&]foo=(\d*)(?=[&#]|$)|(?![?&]foo=)[^#])+)?(?=#|$)/,
    Apple: /https?:\/\/music\.apple\.com\/.+?\/.+?\/(.+?)\//,
    ApplePlaylist: /https?:\/\/music\.apple\.com\/.+?\/.+?\/(.+?)\//,
};
