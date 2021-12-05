"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Song = void 0;
class Song {
    constructor(raw, queue, requestedBy) {
        this.player = queue.player;
        this.name = raw.name;
        this.author = raw.author;
        this.url = raw.url;
        this.thumbnail = raw.thumbnail;
        this.requestedBy = requestedBy;
        this.duration = raw.duration;
        this.isLive = raw.isLive;
        this.seekTime = 0;
    }
}
exports.Song = Song;
