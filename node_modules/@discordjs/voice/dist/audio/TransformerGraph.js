"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPipeline = exports.getNode = exports.Node = exports.TransformerType = exports.StreamType = void 0;
const prism = __importStar(require("prism-media"));
/*
    This module creates a Transformer Graph to figure out what the most efficient way
    of transforming the input stream into something playable would be.
*/
const FFMPEG_PCM_ARGUMENTS = ['-analyzeduration', '0', '-loglevel', '0', '-f', 's16le', '-ar', '48000', '-ac', '2'];
const FFMPEG_OPUS_ARGUMENTS = [
    '-analyzeduration',
    '0',
    '-loglevel',
    '0',
    '-acodec',
    'libopus',
    '-f',
    'opus',
    '-ar',
    '48000',
    '-ac',
    '2',
];
/**
 * The different types of stream that can exist within the pipeline
 *
 * @remarks
 * - `Arbitrary` - the type of the stream at this point is unknown.
 *
 * - `Raw` - the stream at this point is s16le PCM.
 *
 * - `OggOpus` - the stream at this point is Opus audio encoded in an Ogg wrapper.
 *
 * - `WebmOpus` - the stream at this point is Opus audio encoded in a WebM wrapper.
 *
 * - `Opus` - the stream at this point is Opus audio, and the stream is in object-mode. This is ready to play.
 */
var StreamType;
(function (StreamType) {
    StreamType["Arbitrary"] = "arbitrary";
    StreamType["Raw"] = "raw";
    StreamType["OggOpus"] = "ogg/opus";
    StreamType["WebmOpus"] = "webm/opus";
    StreamType["Opus"] = "opus";
})(StreamType = exports.StreamType || (exports.StreamType = {}));
/**
 * The different types of transformers that can exist within the pipeline
 */
var TransformerType;
(function (TransformerType) {
    TransformerType["FFmpegPCM"] = "ffmpeg pcm";
    TransformerType["FFmpegOgg"] = "ffmpeg ogg";
    TransformerType["OpusEncoder"] = "opus encoder";
    TransformerType["OpusDecoder"] = "opus decoder";
    TransformerType["OggOpusDemuxer"] = "ogg/opus demuxer";
    TransformerType["WebmOpusDemuxer"] = "webm/opus demuxer";
    TransformerType["InlineVolume"] = "volume transformer";
})(TransformerType = exports.TransformerType || (exports.TransformerType = {}));
/**
 * Represents a type of stream within the graph, e.g. an Opus stream, or a stream of raw audio.
 */
class Node {
    constructor(type) {
        /**
         * The outbound edges from this node
         */
        this.edges = [];
        this.type = type;
    }
    /**
     * Creates an outbound edge from this node
     *
     * @param edge - The edge to create
     */
    addEdge(edge) {
        this.edges.push({ ...edge, from: this });
    }
}
exports.Node = Node;
// Create a node for each stream type
const NODES = new Map();
for (const streamType of Object.values(StreamType)) {
    NODES.set(streamType, new Node(streamType));
}
/**
 * Gets a node from its stream type
 *
 * @param type - The stream type of the target node
 */
function getNode(type) {
    const node = NODES.get(type);
    if (!node)
        throw new Error(`Node type '${type}' does not exist!`);
    return node;
}
exports.getNode = getNode;
getNode(StreamType.Raw).addEdge({
    type: TransformerType.OpusEncoder,
    to: getNode(StreamType.Opus),
    cost: 1.5,
    transformer: () => new prism.opus.Encoder({ rate: 48000, channels: 2, frameSize: 960 }),
});
getNode(StreamType.Opus).addEdge({
    type: TransformerType.OpusDecoder,
    to: getNode(StreamType.Raw),
    cost: 1.5,
    transformer: () => new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 }),
});
getNode(StreamType.OggOpus).addEdge({
    type: TransformerType.OggOpusDemuxer,
    to: getNode(StreamType.Opus),
    cost: 1,
    transformer: () => new prism.opus.OggDemuxer(),
});
getNode(StreamType.WebmOpus).addEdge({
    type: TransformerType.WebmOpusDemuxer,
    to: getNode(StreamType.Opus),
    cost: 1,
    transformer: () => new prism.opus.WebmDemuxer(),
});
const FFMPEG_PCM_EDGE = {
    type: TransformerType.FFmpegPCM,
    to: getNode(StreamType.Raw),
    cost: 2,
    transformer: (input) => new prism.FFmpeg({
        args: typeof input === 'string' ? ['-i', input, ...FFMPEG_PCM_ARGUMENTS] : FFMPEG_PCM_ARGUMENTS,
    }),
};
getNode(StreamType.Arbitrary).addEdge(FFMPEG_PCM_EDGE);
getNode(StreamType.OggOpus).addEdge(FFMPEG_PCM_EDGE);
getNode(StreamType.WebmOpus).addEdge(FFMPEG_PCM_EDGE);
getNode(StreamType.Raw).addEdge({
    type: TransformerType.InlineVolume,
    to: getNode(StreamType.Raw),
    cost: 0.5,
    transformer: () => new prism.VolumeTransformer({ type: 's16le' }),
});
// Try to enable FFmpeg Ogg optimizations
function canEnableFFmpegOptimizations() {
    try {
        return prism.FFmpeg.getInfo().output.includes('--enable-libopus');
    }
    catch { }
    return false;
}
if (canEnableFFmpegOptimizations()) {
    const FFMPEG_OGG_EDGE = {
        type: TransformerType.FFmpegOgg,
        to: getNode(StreamType.OggOpus),
        cost: 2,
        transformer: (input) => new prism.FFmpeg({
            args: typeof input === 'string' ? ['-i', input, ...FFMPEG_OPUS_ARGUMENTS] : FFMPEG_OPUS_ARGUMENTS,
        }),
    };
    getNode(StreamType.Arbitrary).addEdge(FFMPEG_OGG_EDGE);
    // Include Ogg and WebM as well in case they have different sampling rates or are mono instead of stereo
    // at the moment, this will not do anything. However, if/when detection for correct Opus headers is
    // implemented, this will help inform the voice engine that it is able to transcode the audio.
    getNode(StreamType.OggOpus).addEdge(FFMPEG_OGG_EDGE);
    getNode(StreamType.WebmOpus).addEdge(FFMPEG_OGG_EDGE);
}
/**
 * Finds the shortest cost path from node A to node B.
 *
 * @param from - The start node
 * @param constraints - Extra validation for a potential solution. Takes a path, returns true if the path is valid.
 * @param goal - The target node
 * @param path - The running path
 * @param depth - The number of remaining recursions
 */
function findPath(from, constraints, goal = getNode(StreamType.Opus), path = [], depth = 5) {
    if (from === goal && constraints(path)) {
        return { cost: 0 };
    }
    else if (depth === 0) {
        return { cost: Infinity };
    }
    let currentBest = undefined;
    for (const edge of from.edges) {
        if (currentBest && edge.cost > currentBest.cost)
            continue;
        const next = findPath(edge.to, constraints, goal, [...path, edge], depth - 1);
        const cost = edge.cost + next.cost;
        if (!currentBest || cost < currentBest.cost) {
            currentBest = { cost, edge, next };
        }
    }
    return currentBest !== null && currentBest !== void 0 ? currentBest : { cost: Infinity };
}
/**
 * Takes the solution from findPath and assembles it into a list of edges
 *
 * @param step - The first step of the path
 */
function constructPipeline(step) {
    const edges = [];
    let current = step;
    while (current === null || current === void 0 ? void 0 : current.edge) {
        edges.push(current.edge);
        current = current.next;
    }
    return edges;
}
/**
 * Finds the lowest-cost pipeline to convert the input stream type into an Opus stream
 *
 * @param from - The stream type to start from
 * @param constraint - Extra constraints that may be imposed on potential solution
 */
function findPipeline(from, constraint) {
    return constructPipeline(findPath(getNode(from), constraint));
}
exports.findPipeline = findPipeline;
//# sourceMappingURL=TransformerGraph.js.map