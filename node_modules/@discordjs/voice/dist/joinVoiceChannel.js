"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinVoiceChannel = void 0;
const VoiceConnection_1 = require("./VoiceConnection");
/**
 * Creates a VoiceConnection to a Discord voice channel.
 *
 * @param voiceChannel - the voice channel to connect to
 * @param options - the options for joining the voice channel
 */
function joinVoiceChannel(options) {
    const joinConfig = {
        selfDeaf: true,
        selfMute: false,
        group: 'default',
        ...options,
    };
    return VoiceConnection_1.createVoiceConnection(joinConfig, {
        adapterCreator: options.adapterCreator,
        debug: options.debug,
    });
}
exports.joinVoiceChannel = joinVoiceChannel;
//# sourceMappingURL=joinVoiceChannel.js.map