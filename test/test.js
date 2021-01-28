const ASSERT = require('assert-diff');
ASSERT.options.strict = true;
const Util = require('../src/Util');
const ytsr = require('ytsr');
let testStrings = {
    video: 'https://www.youtube.com/watch?v=iRYvuS9OxdA',
    playlist: 'https://youtube.com/playlist?list=PLDLGxnP4y2mGKGEqwxWTRkd3HtrrVTMdU'
};
const testSearchOptions = {
    uploadDate: null,
    duration: 'short',
    sortBy: 'relevance',
}

it('Check for Video', async() => {
    let expectedResult = require('./files/video.json');
    let includedResult = await Util.getVideoBySearch(testStrings.video, ytsr, testSearchOptions);

    ASSERT.deepEqual(expectedResult, includedResult);
});

it('Check for Playlist', async() => {
    let expectedResult = require('./files/playlist.json');
    let includedResult = await Util.getVideoFromPlaylist(testStrings.playlist, ytsr, 10);

    ASSERT.deepEqual(expectedResult, includedResult);
});