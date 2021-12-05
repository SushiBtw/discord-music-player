"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAudioPlayer = exports.addAudioPlayer = exports.hasAudioPlayer = exports.trackVoiceConnection = exports.untrackVoiceConnection = exports.getVoiceConnection = exports.getVoiceConnections = exports.getGroups = exports.createJoinVoiceChannelPayload = void 0;
/**
 * Sends a voice state update to the main websocket shard of a guild, to indicate joining/leaving/moving across
 * voice channels.
 *
 * @param config - The configuration to use when joining the voice channel
 */
function createJoinVoiceChannelPayload(config) {
    return {
        op: 4 /* VoiceStateUpdate */,
        d: {
            guild_id: config.guildId,
            channel_id: config.channelId,
            self_deaf: config.selfDeaf,
            self_mute: config.selfMute,
        },
    };
}
exports.createJoinVoiceChannelPayload = createJoinVoiceChannelPayload;
// Voice Connections
const groups = new Map();
groups.set('default', new Map());
function getOrCreateGroup(group) {
    const existing = groups.get(group);
    if (existing)
        return existing;
    const map = new Map();
    groups.set(group, map);
    return map;
}
/**
 * Retrieves the map of group names to maps of voice connections. By default, all voice connections
 * are created under the 'default' group.
 * @returns The group map
 */
function getGroups() {
    return groups;
}
exports.getGroups = getGroups;
/**
 * Retrieves all the voice connections under the given group name. Defaults to the 'default' group.
 * @param group - The group to look up
 * @returns The map of voice connections
 */
function getVoiceConnections(group = 'default') {
    return groups.get(group);
}
exports.getVoiceConnections = getVoiceConnections;
/**
 * Finds a voice connection with the given guild ID and group. Defaults to the 'default' group.
 * @param guildId - The guild ID of the voice connection
 * @param group - the group that the voice connection was registered with
 * @returns The voice connection, if it exists
 */
function getVoiceConnection(guildId, group = 'default') {
    var _a;
    return (_a = getVoiceConnections(group)) === null || _a === void 0 ? void 0 : _a.get(guildId);
}
exports.getVoiceConnection = getVoiceConnection;
function untrackVoiceConnection(voiceConnection) {
    var _a;
    return (_a = getVoiceConnections(voiceConnection.joinConfig.group)) === null || _a === void 0 ? void 0 : _a.delete(voiceConnection.joinConfig.guildId);
}
exports.untrackVoiceConnection = untrackVoiceConnection;
function trackVoiceConnection(voiceConnection) {
    return getOrCreateGroup(voiceConnection.joinConfig.group).set(voiceConnection.joinConfig.guildId, voiceConnection);
}
exports.trackVoiceConnection = trackVoiceConnection;
// Audio Players
// Each audio packet is 20ms long
const FRAME_LENGTH = 20;
let audioCycleInterval;
let nextTime = -1;
/**
 * A list of created audio players that are still active and haven't been destroyed.
 */
const audioPlayers = [];
/**
 * Called roughly every 20 milliseconds. Dispatches audio from all players, and then gets the players to prepare
 * the next audio frame.
 */
function audioCycleStep() {
    if (nextTime === -1)
        return;
    nextTime += FRAME_LENGTH;
    const available = audioPlayers.filter((player) => player.checkPlayable());
    // eslint-disable-next-line @typescript-eslint/dot-notation
    available.forEach((player) => player['_stepDispatch']());
    prepareNextAudioFrame(available);
}
/**
 * Recursively gets the players that have been passed as parameters to prepare audio frames that can be played.
 * at the start of the next cycle.
 */
function prepareNextAudioFrame(players) {
    const nextPlayer = players.shift();
    if (!nextPlayer) {
        if (nextTime !== -1) {
            audioCycleInterval = setTimeout(() => audioCycleStep(), nextTime - Date.now());
        }
        return;
    }
    // eslint-disable-next-line @typescript-eslint/dot-notation
    nextPlayer['_stepPrepare']();
    // setImmediate to avoid long audio player chains blocking other scheduled tasks
    setImmediate(() => prepareNextAudioFrame(players));
}
/**
 * Checks whether or not the given audio player is being driven by the data store clock.
 *
 * @param target - The target to test for
 * @returns true if it is being tracked, false otherwise
 */
function hasAudioPlayer(target) {
    return audioPlayers.includes(target);
}
exports.hasAudioPlayer = hasAudioPlayer;
/**
 * Adds an audio player to the data store tracking list, if it isn't already there.
 *
 * @param player - The player to track
 */
function addAudioPlayer(player) {
    if (hasAudioPlayer(player))
        return player;
    audioPlayers.push(player);
    if (audioPlayers.length === 1) {
        nextTime = Date.now();
        setImmediate(() => audioCycleStep());
    }
    return player;
}
exports.addAudioPlayer = addAudioPlayer;
/**
 * Removes an audio player from the data store tracking list, if it is present there.
 */
function deleteAudioPlayer(player) {
    const index = audioPlayers.indexOf(player);
    if (index === -1)
        return;
    audioPlayers.splice(index, 1);
    if (audioPlayers.length === 0) {
        nextTime = -1;
        if (typeof audioCycleInterval !== 'undefined')
            clearTimeout(audioCycleInterval);
    }
}
exports.deleteAudioPlayer = deleteAudioPlayer;
//# sourceMappingURL=DataStore.js.map