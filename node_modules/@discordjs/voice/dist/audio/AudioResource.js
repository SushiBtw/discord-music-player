"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAudioResource = exports.inferStreamType = exports.NO_CONSTRAINT = exports.VOLUME_CONSTRAINT = exports.AudioResource = void 0;
const TransformerGraph_1 = require("./TransformerGraph");
const stream_1 = require("stream");
const util_1 = require("../util/util");
const prism_media_1 = require("prism-media");
const AudioPlayer_1 = require("./AudioPlayer");
/**
 * Represents an audio resource that can be played by an audio player.
 *
 * @template T - the type for the metadata (if any) of the audio resource.
 */
class AudioResource {
    constructor(edges, streams, metadata, silencePaddingFrames) {
        /**
         * The playback duration of this audio resource, given in milliseconds.
         */
        this.playbackDuration = 0;
        /**
         * Whether or not the stream for this resource has started (data has become readable)
         */
        this.started = false;
        /**
         * The number of remaining silence frames to play. If -1, the frames have not yet started playing.
         */
        this.silenceRemaining = -1;
        this.edges = edges;
        this.playStream = streams.length > 1 ? stream_1.pipeline(streams, util_1.noop) : streams[0];
        this.metadata = metadata;
        this.silencePaddingFrames = silencePaddingFrames;
        for (const stream of streams) {
            if (stream instanceof prism_media_1.VolumeTransformer) {
                this.volume = stream;
            }
            else if (stream instanceof prism_media_1.opus.Encoder) {
                this.encoder = stream;
            }
        }
        this.playStream.once('readable', () => (this.started = true));
    }
    /**
     * Whether this resource is readable. If the underlying resource is no longer readable, this will still return true
     * while there are silence padding frames left to play.
     */
    get readable() {
        if (this.silenceRemaining === 0)
            return false;
        const real = this.playStream.readable;
        if (!real) {
            if (this.silenceRemaining === -1)
                this.silenceRemaining = this.silencePaddingFrames;
            return this.silenceRemaining !== 0;
        }
        return real;
    }
    /**
     * Whether this resource has ended or not.
     */
    get ended() {
        return this.playStream.readableEnded || this.playStream.destroyed || this.silenceRemaining === 0;
    }
    /**
     * Attempts to read an Opus packet from the audio resource. If a packet is available, the playbackDuration
     * is incremented.
     * @internal
     * @remarks
     * It is advisable to check that the playStream is readable before calling this method. While no runtime
     * errors will be thrown, you should check that the resource is still available before attempting to
     * read from it.
     */
    read() {
        if (this.silenceRemaining === 0) {
            return null;
        }
        else if (this.silenceRemaining > 0) {
            this.silenceRemaining--;
            return AudioPlayer_1.SILENCE_FRAME;
        }
        const packet = this.playStream.read();
        if (packet) {
            this.playbackDuration += 20;
        }
        return packet;
    }
}
exports.AudioResource = AudioResource;
/**
 * Ensures that a path contains at least one volume transforming component
 *
 * @param path - The path to validate constraints on
 */
const VOLUME_CONSTRAINT = (path) => path.some((edge) => edge.type === TransformerGraph_1.TransformerType.InlineVolume);
exports.VOLUME_CONSTRAINT = VOLUME_CONSTRAINT;
const NO_CONSTRAINT = () => true;
exports.NO_CONSTRAINT = NO_CONSTRAINT;
/**
 * Tries to infer the type of a stream to aid with transcoder pipelining.
 *
 * @param stream - The stream to infer the type of
 */
function inferStreamType(stream) {
    if (stream instanceof prism_media_1.opus.Encoder) {
        return { streamType: TransformerGraph_1.StreamType.Opus, hasVolume: false };
    }
    else if (stream instanceof prism_media_1.opus.Decoder) {
        return { streamType: TransformerGraph_1.StreamType.Raw, hasVolume: false };
    }
    else if (stream instanceof prism_media_1.VolumeTransformer) {
        return { streamType: TransformerGraph_1.StreamType.Raw, hasVolume: true };
    }
    else if (stream instanceof prism_media_1.opus.OggDemuxer) {
        return { streamType: TransformerGraph_1.StreamType.Opus, hasVolume: false };
    }
    else if (stream instanceof prism_media_1.opus.WebmDemuxer) {
        return { streamType: TransformerGraph_1.StreamType.Opus, hasVolume: false };
    }
    return { streamType: TransformerGraph_1.StreamType.Arbitrary, hasVolume: false };
}
exports.inferStreamType = inferStreamType;
/**
 * Creates an audio resource that can be played be audio players.
 *
 * @remarks
 * If the input is given as a string, then the inputType option will be overridden and FFmpeg will be used.
 *
 * If the input is not in the correct format, then a pipeline of transcoders and transformers will be created
 * to ensure that the resultant stream is in the correct format for playback. This could involve using FFmpeg,
 * Opus transcoders, and Ogg/WebM demuxers.
 *
 * @param input - The resource to play.
 * @param options - Configurable options for creating the resource.
 *
 * @template T - the type for the metadata (if any) of the audio resource.
 */
function createAudioResource(input, options = {}) {
    var _a, _b, _c, _d;
    let inputType = options.inputType;
    let needsInlineVolume = Boolean(options.inlineVolume);
    // string inputs can only be used with FFmpeg
    if (typeof input === 'string') {
        inputType = TransformerGraph_1.StreamType.Arbitrary;
    }
    else if (typeof inputType === 'undefined') {
        const analysis = inferStreamType(input);
        inputType = analysis.streamType;
        needsInlineVolume = needsInlineVolume && !analysis.hasVolume;
    }
    const transformerPipeline = TransformerGraph_1.findPipeline(inputType, needsInlineVolume ? exports.VOLUME_CONSTRAINT : exports.NO_CONSTRAINT);
    if (transformerPipeline.length === 0) {
        if (typeof input === 'string')
            throw new Error(`Invalid pipeline constructed for string resource '${input}'`);
        // No adjustments required
        return new AudioResource([], [input], ((_a = options.metadata) !== null && _a !== void 0 ? _a : null), (_b = options.silencePaddingFrames) !== null && _b !== void 0 ? _b : 5);
    }
    const streams = transformerPipeline.map((edge) => edge.transformer(input));
    if (typeof input !== 'string')
        streams.unshift(input);
    return new AudioResource(transformerPipeline, streams, ((_c = options.metadata) !== null && _c !== void 0 ? _c : null), (_d = options.silencePaddingFrames) !== null && _d !== void 0 ? _d : 5);
}
exports.createAudioResource = createAudioResource;
//# sourceMappingURL=AudioResource.js.map