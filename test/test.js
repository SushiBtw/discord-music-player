const ASSERT = require('assert-diff');
ASSERT.options.strict = true;
const Util = require('../src/Util');
const Queue = require('../src/Queue');
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
    let includedResult = await Util.best(testStrings.video, testSearchOptions, null, null);

    ASSERT.deepEqual(expectedResult, includedResult);
}, 10 * 1000);

it('Check for Playlist', async() => {
    let expectedResult = require('./files/playlist.json');
    let includedResult = await Util.playlist(testStrings.playlist, null, null, 10);

    ASSERT.deepEqual(expectedResult, includedResult);
}, 10 * 1000);