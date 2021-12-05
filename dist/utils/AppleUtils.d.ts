import { RawApplePlaylist } from '..';
/**
 * @param {string} url
 * @returns {Promise<{ artist: string, title: string }>}
 */
export declare function getSong(url: string): Promise<{
    artist: string;
    title: string;
}>;
/**
 * @param {string} url
 * @returns {Promise<?RawApplePlaylist>}
 */
export declare function getPlaylist(url: string): Promise<RawApplePlaylist | undefined>;
