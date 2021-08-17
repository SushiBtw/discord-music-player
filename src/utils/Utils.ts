import {
    Song, Queue,
    PlayerOptions, PlayOptions, PlaylistOptions,
    DefaultPlayerOptions, DefaultPlayOptions,
    RawSong
} from "..";
import { User } from "discord.js";
import YTSR, {Video} from 'ytsr';

export class Utils {
    constructor() {}

    /**
     * Search for Songs
     * @param {string} Search
     * @param {PlayOptions} SOptions
     * @param {Queue} Queue
     * @param {number} Limit
     * @return {Promise<Song[]>}
     */
    static async search(Search: string, SOptions: PlayOptions = DefaultPlayOptions, Queue: Queue, Limit: number = 1): Promise<Song[]> {
        SOptions = Object.assign({}, DefaultPlayOptions, SOptions);
        let Filters;

        // Default Options - Type: Video
        let FiltersTypes = await YTSR.getFilters(Search);
        Filters = FiltersTypes.get('Type')!.get('Video')!;

        // Custom Options - Upload date: null
        if (SOptions?.uploadDate !== null)
            Filters = Array.from(
                (
                    await YTSR.getFilters(Filters.url!)
                )
                    .get('Upload date')!, ([name, value]) => ({ name, url: value.url })
                )
                    .find(o => o.name.toLowerCase().includes(SOptions?.uploadDate!))
                ?? Filters;

        // Custom Options - Duration: null
        if (SOptions?.duration !== null)
            Filters = Array.from(
                (
                    await YTSR.getFilters(Filters.url!)
                )
                    .get('Duration')!, ([name, value]) => ({ name, url: value.url })
                )
                    .find(o => o.name.toLowerCase().startsWith(SOptions?.duration!))
                ?? Filters;

        // Custom Options - Sort by: relevance
        if (SOptions?.sortBy !== null && SOptions?.sortBy !== 'relevance')
            Filters = Array.from(
                (
                    await YTSR.getFilters(Filters.url!)
                )
                    .get('Sort by')!, ([name, value]) => ({ name, url: value.url })
                )
                    .find(o => o.name.toLowerCase().includes(SOptions?.sortBy!))
                ?? Filters;

        try {
            let Result = await YTSR(
                Filters.url!,
                {
                    limit: Limit,
                }
            );

            let items = Result.items as Video[];

            let songs: (Song|null)[] = items.map(item => {
                if(item?.type?.toLowerCase() !== 'video')
                    return null;
                return new Song({
                    name: item.title,
                    url: item.url,
                    duration: item.duration!,
                    author: item.author!.name,
                    isLive: item.isLive,
                    thumbnail: item.bestThumbnail.url!,
                } as RawSong, Queue, SOptions.requestedBy);
            }).filter(I => I);

            return songs as Song[];
        }
        catch (e) {
            console.log(e);
            throw 'SearchIsNull';
        }
    }

    /**
     * Gets the best result of a Search
     * @param {Song|string} Search
     * @param {PlayOptions} SOptions
     * @param {Queue} Queue
     * @param {Number} Limit
     * @return {Promise<Song>}
     */
    static async best(Search: Song|string, SOptions: PlayOptions = DefaultPlayOptions, Queue: Queue, Limit: number = 1): Promise<Song> {
        let _Song;

        if(Search instanceof Song)
            return Search as Song;

        // Song = await this.link(
        //     Search,
        //     Queue,
        //     Requester,
        //     SOptions?.localAddress
        // );

        if(!_Song)
            _Song = (await this.search(
                Search,
                SOptions,
                Queue,
                Limit
            ))[0];

        return _Song;
    }

}
