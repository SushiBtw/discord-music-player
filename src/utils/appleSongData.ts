import { Document } from 'domhandler';
import axios from "axios";
import { DomUtils, parseDocument } from 'htmlparser2';
import axiosRetry from 'axios-retry';

axiosRetry(axios, { retries: 5 });


function findJSONLD( document: Document ) {
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
            
            return Promise.all(
                data.track.map((songData: any) => getSong(songData.url))
            ).catch((err) => {
                console.log(err)
            })

        }
    }
}




export async function getSong( 
    url: string 
    ) {
    const res = await axios.get<string>(url);
    const document = parseDocument(res.data);
    let song: any | undefined = []
    song.artist = findJSONLD( document );
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
    const regexName = new RegExp(/https?:\/\/music\.apple\.com\/.+?\/.+?\/(.+?)\//g);
    const name: any | undefined = regexName.exec(url);
    let setData: any = []
    setData.songs = await findJSONLD( document );
    setData.name = name[1]
    console.log(setData)
}




