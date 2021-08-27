import {
    Song, Queue, Playlist,
    PlayerOptions, PlayOptions, PlaylistOptions, DMPErrors,
    DefaultPlayerOptions, DefaultPlayOptions, DefaultPlaylistOptions,
    RawSong, RawPlaylist,
} from "..";
import { User } from "discord.js";
import YTSR, { Video } from 'ytsr';
import {getData, getPreview } from "spotify-url-info";
import {Client, Video as IVideo, VideoCompact} from "youtubei";
const YouTube = new Client();

export class Utils {
    /**
     *
     */
    private constructor() {}

    static regexList = {
        YouTubeVideo: /^((?:https?:)\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))((?!channel)(?!user)\/(?:[\w\-]+\?v=|embed\/|v\/)?)((?!channel)(?!user)[\w\-]+)(((.*(\?|\&)t=(\d+))(\D?|\S+?))|\D?|\S+?)$/,
        YouTubeVideoID: /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/,
        YouTubePlaylist: /^((?:https?:)\/\/)?((?:www|m)\.)?((?:youtube\.com)).*(youtu.be\/|list=)([^#&?]*).*/,
        YouTubePlaylistID: /[&?]list=([^&]+)/,
        Spotify: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:track\/|\?uri=spotify:track:)((\w|-)+)(?:(?=\?)(?:[?&]foo=(\d*)(?=[&#]|$)|(?![?&]foo=)[^#])+)?(?=#|$)/,
        SpotifyPlaylist: /https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:(album|playlist)\/|\?uri=spotify:playlist:)((\w|-)+)(?:(?=\?)(?:[?&]foo=(\d*)(?=[&#]|$)|(?![?&]foo=)[^#])+)?(?=#|$)/,
    }

    /**
     * Get ID from YouTube link
     * @param {string} url
     * @returns {?string}
     */
    static parseVideo(url: string): string|null {
        const match = url.match(this.regexList.YouTubeVideoID);
        return match ? match[7] : null;
    }

    /**
     * Get timecode from YouTube link
     * @param {string} url
     * @returns {?string}
     */
    static parseVideoTimecode(url: string): string|null {
        const match = url.match(this.regexList.YouTubeVideo);
        return match ? match[10] : null;
    }

    /**
     * Get ID from Playlist link
     * @param {string} url
     * @returns {?string}
     */
    static parsePlaylist(url: string): string|null {
        const match = url.match(this.regexList.YouTubePlaylistID);
        return match ? match[1] : null;
    }

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

        try {
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
                    duration: item.duration,
                    author: item.author!.name,
                    isLive: item.isLive,
                    thumbnail: item.bestThumbnail.url!,
                } as RawSong, Queue, SOptions.requestedBy);
            }).filter(I => I);

            return songs as Song[];
        }
        catch (e) {
            throw DMPErrors.SEARCH_NULL;
        }
    }

    /**
     * Search for Song via link
     * @param {string} Search
     * @param {PlayOptions} SOptions
     * @param {Queue} Queue
     * @return {Promise<Song>}
     */
    static async link(Search: string, SOptions: PlayOptions = DefaultPlayOptions, Queue: Queue) {

        let SpotifyLink =
            this.regexList.Spotify.test(Search);
        let YouTubeLink =
            this.regexList.YouTubeVideo.test(Search);

        if(SpotifyLink) {
            try {
                let SpotifyResult = await getPreview(Search);
                let SearchResult = await this.search(
                    `${SpotifyResult.artist} - ${SpotifyResult.title}`,
                    SOptions,
                    Queue
                );
                return SearchResult[0];
            }
            catch(e) {
                throw DMPErrors.INVALID_SPOTIFY;
            }
        } else if(YouTubeLink) {
            let VideoID = this.parseVideo(Search);
            if (!VideoID) throw DMPErrors.SEARCH_NULL;

            YouTube.options.httpOptions.localAddress = SOptions.localAddress;
            let VideoResult = await YouTube.getVideo(VideoID) as IVideo;
            if(!VideoResult) throw DMPErrors.SEARCH_NULL;
            let VideoTimecode = this.parseVideoTimecode(Search);

            return new Song({
                name: VideoResult.title,
                url: Search,
                duration: this.msToTime((VideoResult.duration ?? 0) * 1000),
                author: VideoResult.channel.name,
                isLive: VideoResult.isLiveContent,
                thumbnail: VideoResult.thumbnails.best,
                seekTime: SOptions.timecode && VideoTimecode ? Number(VideoTimecode) * 1000 : null,
            } as RawSong, Queue, SOptions.requestedBy);
        } else return null;
    }

    /**
     * Gets the best result of a Search
     * @param {Song|string} Search
     * @param {PlayOptions} SOptions
     * @param {Queue} Queue
     * @return {Promise<Song>}
     */
    static async best(Search: Song|string, SOptions: PlayOptions = DefaultPlayOptions, Queue: Queue): Promise<Song> {
        let _Song;

        if(Search instanceof Song)
            return Search as Song;

        _Song = await this.link(
            Search,
            SOptions,
            Queue
        );

        if(!_Song)
            _Song = (await this.search(
                Search,
                SOptions,
                Queue
            ))[0];

        return _Song;
    }

    /**
     * Search for Playlist
     * @param {string} Search
     * @param {PlaylistOptions} SOptions
     * @param {Queue} Queue
     * @return {Promise<Playlist>}
     */
    static async playlist(Search: Playlist|string, SOptions: PlaylistOptions = DefaultPlaylistOptions, Queue: Queue): Promise<Playlist> {

        if(Search instanceof Playlist)
            return Search as Playlist;

        let Limit = SOptions.maxSongs ?? -1;
        let SpotifyPlaylistLink =
            this.regexList.SpotifyPlaylist.test(Search);
        let YouTubePlaylistLink =
            this.regexList.YouTubePlaylist.test(Search);

        if(SpotifyPlaylistLink) {
            let SpotifyResultData = await getData(Search).catch(() => null);
            if(!SpotifyResultData || !['playlist', 'album'].includes(SpotifyResultData.type))
                throw DMPErrors.INVALID_PLAYLIST;

            let SpotifyResult: RawPlaylist = {
                name: SpotifyResultData.name,
                author: SpotifyResultData.type === 'playlist' ? { name: SpotifyResultData.owner.display_name } : SpotifyResultData.artists[0].name,
                url: Search,
                songs: [],
                type: SpotifyResultData.type
            }

            SpotifyResult.songs = await Promise.all((SpotifyResultData.tracks ? SpotifyResultData.tracks.items : []).map(async (track: any, index: number) => {
                    if (Limit !== -1 && index >= Limit)
                        return null;
                    if(SpotifyResult.type === 'playlist')
                        track = track.track;
                    let Result = await this.search(
                        `${track.artists[0].name} - ${track.name}`,
                        SOptions as PlayOptions,
                        Queue
                    ).catch(() => null);
                    return Result ? Result[0] : null;
                })
                    .filter((V: any) => V) as Song[]
            )

            if(SOptions.shuffle)
                SpotifyResult.songs = this.shuffle(SpotifyResult.songs);

            return new Playlist(SpotifyResult, Queue, SOptions.requestedBy);
        } else if(YouTubePlaylistLink) {
            let PlaylistID = this.parsePlaylist(Search);
            if (!PlaylistID)
                throw DMPErrors.INVALID_PLAYLIST;

            YouTube.options.httpOptions.localAddress = SOptions.localAddress;
            let YouTubeResultData = await YouTube.getPlaylist(PlaylistID);
            if (!YouTubeResultData || Object.keys(YouTubeResultData).length === 0)
                throw DMPErrors.INVALID_PLAYLIST;

            let YouTubeResult: RawPlaylist = {
                name: YouTubeResultData.title,
                author: YouTubeResultData.channel!.name,
                url: Search,
                songs: [],
                type: 'playlist'
            }

            if(YouTubeResultData.videoCount > 100 && (Limit === -1 || Limit > 100))
                await YouTubeResultData.next(Math.floor((Limit === -1 || Limit > YouTubeResultData.videoCount ? YouTubeResultData.videoCount : Limit - 1) / 100));

            YouTubeResult.songs = YouTubeResultData.videos.map((video: VideoCompact, index: number) => {
                if (Limit !== -1 && index >= Limit)
                    return null;
                return new Song({
                    name: video.title,
                    url: `https://youtube.com/watch?v=${video.id}`,
                    duration: this.msToTime((video.duration ?? 0) * 1000),
                    author: video.channel!.name,
                    isLive: video.isLive,
                    thumbnail: video.thumbnails.best,
                } as RawSong, Queue, SOptions.requestedBy);
            })
                .filter((V: any) => V) as Song[];

            if(SOptions.shuffle)
                YouTubeResult.songs = this.shuffle(YouTubeResult.songs);

            return new Playlist(YouTubeResult, Queue, SOptions.requestedBy);
        }

        throw DMPErrors.INVALID_PLAYLIST;
    }

    /**
     * Shuffles an array
     * @param {any[]}
     * @returns {any[]}
     */
    static shuffle(array: any[]): any[] {
        if(!Array.isArray(array))
            return [];
        const clone = [...array];
        const shuffled = [];
        while(clone.length > 0)
            shuffled.push(
                clone.splice(
                    Math.floor(
                        Math.random() * clone.length
                    ), 1
                )[0]
            );
        return shuffled;
    }

    /**
     * Converts duration (HH:MM:SS) to millisecons
     * @returns {string}
     */
    static msToTime(duration: number): string {
        const seconds = Math.floor(duration / 1000 % 60);
        const minutes = Math.floor(duration / 60000 % 60);
        const hours = Math.floor(duration / 3600000);
        const secondsPad = `${seconds}`.padStart(2, '0');
        const minutesPad = `${minutes}`.padStart(2, '0');
        const hoursPad = `${hours}`.padStart(2, '0');

        return `${hours ? `${hoursPad}:` : ''}${minutesPad}:${secondsPad}`;
    }

    /**
     * Converts millisecons to duration (HH:MM:SS)
     * @returns {number}
     */
    static timeToMs(duration: string): number {
        return duration.split(':')
            .reduceRight(
                (prev, curr, i, arr) => prev + parseInt(curr) * 60**(arr.length-1-i), 0
            ) * 1000;
    }

}
