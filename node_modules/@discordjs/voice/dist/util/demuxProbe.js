"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demuxProbe = exports.validateDiscordOpusHead = void 0;
const stream_1 = require("stream");
const prism_media_1 = require("prism-media");
const util_1 = require("./util");
const __1 = require("..");
/**
 * Takes an Opus Head, and verifies whether the associated Opus audio is suitable to play in a Discord voice channel.
 * @param opusHead The Opus Head to validate
 * @returns true if suitable to play in a Discord voice channel, false otherwise
 */
function validateDiscordOpusHead(opusHead) {
    const channels = opusHead.readUInt8(9);
    const sampleRate = opusHead.readUInt32LE(12);
    return channels === 2 && sampleRate === 48000;
}
exports.validateDiscordOpusHead = validateDiscordOpusHead;
/**
 * Attempt to probe a readable stream to figure out whether it can be demuxed using an Ogg or WebM Opus demuxer.
 * @param stream The readable stream to probe
 * @param probeSize The number of bytes to attempt to read before giving up on the probe
 * @param validator The Opus Head validator function
 * @experimental
 */
function demuxProbe(stream, probeSize = 1024, validator = validateDiscordOpusHead) {
    return new Promise((resolve, reject) => {
        // Preconditions
        if (stream.readableObjectMode)
            reject(new Error('Cannot probe a readable stream in object mode'));
        if (stream.readableEnded)
            reject(new Error('Cannot probe a stream that has ended'));
        let readBuffer = Buffer.alloc(0);
        let resolved = undefined;
        const finish = (type) => {
            stream.off('data', onData);
            stream.off('close', onClose);
            stream.off('end', onClose);
            stream.pause();
            resolved = type;
            if (stream.readableEnded) {
                resolve({
                    stream: stream_1.Readable.from(readBuffer),
                    type,
                });
            }
            else {
                if (readBuffer.length > 0) {
                    stream.push(readBuffer);
                }
                resolve({
                    stream,
                    type,
                });
            }
        };
        const foundHead = (type) => (head) => {
            if (validator(head)) {
                finish(type);
            }
        };
        const webm = new prism_media_1.opus.WebmDemuxer();
        webm.once('error', util_1.noop);
        webm.on('head', foundHead(__1.StreamType.WebmOpus));
        const ogg = new prism_media_1.opus.OggDemuxer();
        ogg.once('error', util_1.noop);
        ogg.on('head', foundHead(__1.StreamType.OggOpus));
        const onClose = () => {
            if (!resolved) {
                finish(__1.StreamType.Arbitrary);
            }
        };
        const onData = (buffer) => {
            readBuffer = Buffer.concat([readBuffer, buffer]);
            webm.write(buffer);
            ogg.write(buffer);
            if (readBuffer.length >= probeSize) {
                stream.off('data', onData);
                stream.pause();
                process.nextTick(onClose);
            }
        };
        stream.once('error', reject);
        stream.on('data', onData);
        stream.once('close', onClose);
        stream.once('end', onClose);
    });
}
exports.demuxProbe = demuxProbe;
//# sourceMappingURL=demuxProbe.js.map