import {Document} from 'domhandler';
import axios from 'axios';
import {DomUtils, parseDocument} from 'htmlparser2';
import axiosRetry from "axios-retry";
import { RawApplePlaylist } from '..';

axiosRetry(axios, {retries: 3});

/**
 * @param {Document} document
 * @param {boolean} forceAll
 * @returns {Promise<?RawApplePlaylist>}
 */
async function findJSONLD( document: Document , forceAll: boolean = false): Promise<RawApplePlaylist|undefined> {
    const scripts = DomUtils.findAll(el => {
        if (el.type !== 'script')
            return false;

        return el.attribs.type === 'application/ld+json';
    }, document.children);

    for (const script of scripts) {
        let data = JSON.parse(DomUtils.textContent(script));
        if ('@graph' in data)
            data = data['@graph'];
        if (data['@type'] === 'MusicAlbum' && !forceAll)
            return data.byArtist.name;
        else if(data['@type'] === 'MusicAlbum') {
            let { name, byArtist, tracks } = data;
            return {
                type: 'playlist',
                name: name as string,
                author: byArtist.name as string,
                tracks: tracks.map((songData: any) => {
                    return {
                        artist: byArtist.name as string,
                        title: songData.name as string
                    }
                })
            };
        } else if (data['@type'] === 'MusicPlaylist') {
            let { name, author, track } = data;
            return {
                type: 'playlist',
                name: name as string,
                author: author.name as string,
                tracks: await Promise.all(
                    track.map(async (songData: any) => await getSong(songData.url))
                ).catch(() => []) as any[]
            };
        }
    }
}

/**
 * @param {string} url
 * @returns {Promise<{ artist: string, title: string }>}
 */
export async function getSong(url: string): Promise<{ artist: string, title: string }> {
    const res = await axios.get(url);
    const document = parseDocument(res.data);
    let song: any = [];
    song.artist = await findJSONLD(document);
    const regexName = new RegExp(/https?:\/\/music\.apple\.com\/.+?\/.+?\/(.+?)\//g);
    const title: any = regexName.exec(url);
    song.title = title[1];
    return song;
}

/**
 * @param {string} url
 * @returns {Promise<?RawApplePlaylist>}
 */
export async function getPlaylist(url: string): Promise<RawApplePlaylist|undefined> {
    const res = await axios.get(url);
    const document = parseDocument(res.data);
    return await findJSONLD(document, true);
}



