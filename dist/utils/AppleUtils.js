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
exports.getPlaylist = exports.getSong = void 0;
const axios_1 = __importDefault(require("axios"));
const htmlparser2_1 = require("htmlparser2");
const axios_retry_1 = __importDefault(require("axios-retry"));
axios_retry_1.default(axios_1.default, { retries: 3 });
/**
 * @param {Document} document
 * @param {boolean} forceAll
 * @returns {Promise<?RawApplePlaylist>}
 */
function findJSONLD(document, forceAll = false) {
    return __awaiter(this, void 0, void 0, function* () {
        const scripts = htmlparser2_1.DomUtils.findAll(el => {
            if (el.type !== 'script')
                return false;
            return el.attribs.type === 'application/ld+json';
        }, document.children);
        for (const script of scripts) {
            let data = JSON.parse(htmlparser2_1.DomUtils.textContent(script));
            if ('@graph' in data)
                data = data['@graph'];
            if (data['@type'] === 'MusicAlbum' && !forceAll)
                return data.byArtist.name;
            else if (data['@type'] === 'MusicAlbum') {
                let { name, byArtist, tracks } = data;
                return {
                    type: 'playlist',
                    name: name,
                    author: byArtist.name,
                    tracks: tracks.map((songData) => {
                        return {
                            artist: byArtist.name,
                            title: songData.name
                        };
                    })
                };
            }
            else if (data['@type'] === 'MusicPlaylist') {
                let { name, author, track } = data;
                return {
                    type: 'playlist',
                    name: name,
                    author: author.name,
                    tracks: yield Promise.all(track.map((songData) => __awaiter(this, void 0, void 0, function* () { return yield getSong(songData.url); }))).catch(() => [])
                };
            }
        }
    });
}
/**
 * @param {string} url
 * @returns {Promise<{ artist: string, title: string }>}
 */
function getSong(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield axios_1.default.get(url);
        const document = htmlparser2_1.parseDocument(res.data);
        let song = [];
        song.artist = yield findJSONLD(document);
        const regexName = new RegExp(/https?:\/\/music\.apple\.com\/.+?\/.+?\/(.+?)\//g);
        const title = regexName.exec(url);
        song.title = title[1];
        return song;
    });
}
exports.getSong = getSong;
/**
 * @param {string} url
 * @returns {Promise<?RawApplePlaylist>}
 */
function getPlaylist(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield axios_1.default.get(url);
        const document = htmlparser2_1.parseDocument(res.data);
        return yield findJSONLD(document, true);
    });
}
exports.getPlaylist = getPlaylist;
