import { Document } from 'domhandler';
import axios from "axios";
import { DomUtils, parseDocument } from 'htmlparser2';
import axiosRetry from 'axios-retry';

// apple will somtimes reject request due to overload this will retry each request up to 5 times
axiosRetry(axios, { retries: 5 });

//scraps apple webapge to get metatdat
// for each song in a playlist has to got song song url to get author
async function findJSONLD( document: Document ) {
    // Find JSON-LD scripts
    const scripts = DomUtils.findAll(element => {
        if (element.type !== 'script') {
            return false;
        }    

        return element.attribs.type === 'application/ld+json';
    }, document.children);

    // For every JS-LD script
    for (const script of scripts) {
        let data = JSON.parse(DomUtils.textContent(script));
        if ('@graph' in data) {
            data = data['@graph'];
        }
        
        
        if (data['@type'] === 'MusicAlbum') {
            const author = data.byArtist.name;
            return author;
            }
        
            
        if (data['@type'] === 'MusicPlaylist') {
            
            let setData: any = []
            setData.type = 'playlist'
            setData.name = data.name
            setData.author = data.author.name
            setData.tracks = await Promise.all(
                data.track.map((songData: any) => getSong(songData.url))
                ).catch((err) => {
                    console.log(err)
                })
            return setData            
        }
    }
}




export async function getSong( 
    url: string 
    ) {
    const res = await axios.get<string>(url);
    const document = parseDocument(res.data);
    let song: any | undefined = []
    song.artist = await findJSONLD( document );
    const regexName = new RegExp(/https?:\/\/music\.apple\.com\/.+?\/.+?\/(.+?)\//g);
    const title: any | undefined = regexName.exec(url);
    song.title = title[1]
    if (song.title){
        return song
    }
}


export async function getPlaylist(url: string) {
    const res = await axios.get<string>(url);
    const document = parseDocument(res.data);
    return await findJSONLD( document );
}



