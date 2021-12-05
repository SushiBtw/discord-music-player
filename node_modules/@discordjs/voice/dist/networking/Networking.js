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
exports.Networking = exports.NetworkingStatusCode = exports.SUPPORTED_ENCRYPTION_MODES = void 0;
const VoiceUDPSocket_1 = require("./VoiceUDPSocket");
const VoiceWebSocket_1 = require("./VoiceWebSocket");
const secretbox = __importStar(require("../util/Secretbox"));
const util_1 = require("../util/util");
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
// The number of audio channels required by Discord
const CHANNELS = 2;
const TIMESTAMP_INC = (48000 / 100) * CHANNELS;
const MAX_NONCE_SIZE = 2 ** 32 - 1;
exports.SUPPORTED_ENCRYPTION_MODES = ['xsalsa20_poly1305_lite', 'xsalsa20_poly1305_suffix', 'xsalsa20_poly1305'];
/**
 * The different statuses that a networking instance can hold. The order
 * of the states between OpeningWs and Ready is chronological (first the
 * instance enters OpeningWs, then it enters Identifying etc.)
 */
var NetworkingStatusCode;
(function (NetworkingStatusCode) {
    NetworkingStatusCode[NetworkingStatusCode["OpeningWs"] = 0] = "OpeningWs";
    NetworkingStatusCode[NetworkingStatusCode["Identifying"] = 1] = "Identifying";
    NetworkingStatusCode[NetworkingStatusCode["UdpHandshaking"] = 2] = "UdpHandshaking";
    NetworkingStatusCode[NetworkingStatusCode["SelectingProtocol"] = 3] = "SelectingProtocol";
    NetworkingStatusCode[NetworkingStatusCode["Ready"] = 4] = "Ready";
    NetworkingStatusCode[NetworkingStatusCode["Resuming"] = 5] = "Resuming";
    NetworkingStatusCode[NetworkingStatusCode["Closed"] = 6] = "Closed";
})(NetworkingStatusCode = exports.NetworkingStatusCode || (exports.NetworkingStatusCode = {}));
/**
 * An empty buffer that is reused in packet encryption by many different networking instances.
 */
const nonce = Buffer.alloc(24);
/**
 * Manages the networking required to maintain a voice connection and dispatch audio packets
 */
class Networking extends tiny_typed_emitter_1.TypedEmitter {
    /**
     * Creates a new Networking instance.
     */
    constructor(options, debug) {
        super();
        this.onWsOpen = this.onWsOpen.bind(this);
        this.onChildError = this.onChildError.bind(this);
        this.onWsPacket = this.onWsPacket.bind(this);
        this.onWsClose = this.onWsClose.bind(this);
        this.onWsDebug = this.onWsDebug.bind(this);
        this.onUdpDebug = this.onUdpDebug.bind(this);
        this.onUdpClose = this.onUdpClose.bind(this);
        this.debug = debug ? (message) => this.emit('debug', message) : null;
        this._state = {
            code: NetworkingStatusCode.OpeningWs,
            ws: this.createWebSocket(options.endpoint),
            connectionOptions: options,
        };
    }
    /**
     * Destroys the Networking instance, transitioning it into the Closed state.
     */
    destroy() {
        this.state = {
            code: NetworkingStatusCode.Closed,
        };
    }
    /**
     * The current state of the networking instance.
     */
    get state() {
        return this._state;
    }
    /**
     * Sets a new state for the networking instance, performing clean-up operations where necessary.
     */
    set state(newState) {
        var _a;
        const oldWs = Reflect.get(this._state, 'ws');
        const newWs = Reflect.get(newState, 'ws');
        if (oldWs && oldWs !== newWs) {
            // The old WebSocket is being freed - remove all handlers from it
            oldWs.off('debug', this.onWsDebug);
            oldWs.on('error', util_1.noop);
            oldWs.off('error', this.onChildError);
            oldWs.off('open', this.onWsOpen);
            oldWs.off('packet', this.onWsPacket);
            oldWs.off('close', this.onWsClose);
            oldWs.destroy();
        }
        const oldUdp = Reflect.get(this._state, 'udp');
        const newUdp = Reflect.get(newState, 'udp');
        if (oldUdp && oldUdp !== newUdp) {
            oldUdp.on('error', util_1.noop);
            oldUdp.off('error', this.onChildError);
            oldUdp.off('close', this.onUdpClose);
            oldUdp.off('debug', this.onUdpDebug);
            oldUdp.destroy();
        }
        const oldState = this._state;
        this._state = newState;
        this.emit('stateChange', oldState, newState);
        /**
         * Debug event for Networking.
         *
         * @event Networking#debug
         * @type {string}
         */
        (_a = this.debug) === null || _a === void 0 ? void 0 : _a.call(this, `state change:\nfrom ${stringifyState(oldState)}\nto ${stringifyState(newState)}`);
    }
    /**
     * Creates a new WebSocket to a Discord Voice gateway.
     *
     * @param endpoint - The endpoint to connect to
     * @param debug - Whether to enable debug logging
     */
    createWebSocket(endpoint) {
        const ws = new VoiceWebSocket_1.VoiceWebSocket(`wss://${endpoint}?v=4`, Boolean(this.debug));
        ws.on('error', this.onChildError);
        ws.once('open', this.onWsOpen);
        ws.on('packet', this.onWsPacket);
        ws.once('close', this.onWsClose);
        ws.on('debug', this.onWsDebug);
        return ws;
    }
    /**
     * Propagates errors from the children VoiceWebSocket and VoiceUDPSocket.
     *
     * @param error - The error that was emitted by a child
     */
    onChildError(error) {
        this.emit('error', error);
    }
    /**
     * Called when the WebSocket opens. Depending on the state that the instance is in,
     * it will either identify with a new session, or it will attempt to resume an existing session.
     */
    onWsOpen() {
        if (this.state.code === NetworkingStatusCode.OpeningWs) {
            const packet = {
                op: 0 /* Identify */,
                d: {
                    server_id: this.state.connectionOptions.serverId,
                    user_id: this.state.connectionOptions.userId,
                    session_id: this.state.connectionOptions.sessionId,
                    token: this.state.connectionOptions.token,
                },
            };
            this.state.ws.sendPacket(packet);
            this.state = {
                ...this.state,
                code: NetworkingStatusCode.Identifying,
            };
        }
        else if (this.state.code === NetworkingStatusCode.Resuming) {
            const packet = {
                op: 7 /* Resume */,
                d: {
                    server_id: this.state.connectionOptions.serverId,
                    session_id: this.state.connectionOptions.sessionId,
                    token: this.state.connectionOptions.token,
                },
            };
            this.state.ws.sendPacket(packet);
        }
    }
    /**
     * Called when the WebSocket closes. Based on the reason for closing (given by the code parameter),
     * the instance will either attempt to resume, or enter the closed state and emit a 'close' event
     * with the close code, allowing the user to decide whether or not they would like to reconnect.
     *
     * @param code - The close code
     */
    onWsClose({ code }) {
        const canResume = code === 4015 || code < 4000;
        if (canResume && this.state.code === NetworkingStatusCode.Ready) {
            this.state = {
                ...this.state,
                code: NetworkingStatusCode.Resuming,
                ws: this.createWebSocket(this.state.connectionOptions.endpoint),
            };
        }
        else if (this.state.code !== NetworkingStatusCode.Closed) {
            this.destroy();
            this.emit('close', code);
        }
    }
    /**
     * Called when the UDP socket has closed itself if it has stopped receiving replies from Discord
     */
    onUdpClose() {
        if (this.state.code === NetworkingStatusCode.Ready) {
            this.state = {
                ...this.state,
                code: NetworkingStatusCode.Resuming,
                ws: this.createWebSocket(this.state.connectionOptions.endpoint),
            };
        }
    }
    /**
     * Called when a packet is received on the connection's WebSocket
     * @param packet - The received packet
     */
    onWsPacket(packet) {
        if (packet.op === 8 /* Hello */ && this.state.code !== NetworkingStatusCode.Closed) {
            this.state.ws.setHeartbeatInterval(packet.d.heartbeat_interval);
        }
        else if (packet.op === 2 /* Ready */ && this.state.code === NetworkingStatusCode.Identifying) {
            const { ip, port, ssrc, modes } = packet.d;
            const udp = new VoiceUDPSocket_1.VoiceUDPSocket({ ip, port });
            udp.on('error', this.onChildError);
            udp.on('debug', this.onUdpDebug);
            udp.once('close', this.onUdpClose);
            udp
                .performIPDiscovery(ssrc)
                .then((localConfig) => {
                if (this.state.code !== NetworkingStatusCode.UdpHandshaking)
                    return;
                this.state.ws.sendPacket({
                    op: 1 /* SelectProtocol */,
                    d: {
                        protocol: 'udp',
                        data: {
                            address: localConfig.ip,
                            port: localConfig.port,
                            mode: chooseEncryptionMode(modes),
                        },
                    },
                });
                this.state = {
                    ...this.state,
                    code: NetworkingStatusCode.SelectingProtocol,
                };
            })
                .catch((error) => this.emit('error', error));
            this.state = {
                ...this.state,
                code: NetworkingStatusCode.UdpHandshaking,
                udp,
                connectionData: {
                    ssrc,
                },
            };
        }
        else if (packet.op === 4 /* SessionDescription */ &&
            this.state.code === NetworkingStatusCode.SelectingProtocol) {
            const { mode: encryptionMode, secret_key: secretKey } = packet.d;
            this.state = {
                ...this.state,
                code: NetworkingStatusCode.Ready,
                connectionData: {
                    ...this.state.connectionData,
                    encryptionMode,
                    secretKey: new Uint8Array(secretKey),
                    sequence: randomNBit(16),
                    timestamp: randomNBit(32),
                    nonce: 0,
                    nonceBuffer: Buffer.alloc(24),
                    speaking: false,
                    packetsPlayed: 0,
                },
            };
        }
        else if (packet.op === 9 /* Resumed */ && this.state.code === NetworkingStatusCode.Resuming) {
            this.state = {
                ...this.state,
                code: NetworkingStatusCode.Ready,
            };
            this.state.connectionData.speaking = false;
        }
    }
    /**
     * Propagates debug messages from the child WebSocket.
     *
     * @param message - The emitted debug message
     */
    onWsDebug(message) {
        var _a;
        (_a = this.debug) === null || _a === void 0 ? void 0 : _a.call(this, `[WS] ${message}`);
    }
    /**
     * Propagates debug messages from the child UDPSocket.
     *
     * @param message - The emitted debug message
     */
    onUdpDebug(message) {
        var _a;
        (_a = this.debug) === null || _a === void 0 ? void 0 : _a.call(this, `[UDP] ${message}`);
    }
    /**
     * Prepares an Opus packet for playback. This includes attaching metadata to it and encrypting it.
     * It will be stored within the instance, and can be played by dispatchAudio().
     *
     * @remarks
     * Calling this method while there is already a prepared audio packet that has not yet been dispatched
     * will overwrite the existing audio packet. This should be avoided.
     *
     * @param opusPacket - The Opus packet to encrypt
     *
     * @returns The audio packet that was prepared.
     */
    prepareAudioPacket(opusPacket) {
        const state = this.state;
        if (state.code !== NetworkingStatusCode.Ready)
            return;
        state.preparedPacket = this.createAudioPacket(opusPacket, state.connectionData);
        return state.preparedPacket;
    }
    /**
     * Dispatches the audio packet previously prepared by prepareAudioPacket(opusPacket). The audio packet
     * is consumed and cannot be dispatched again.
     */
    dispatchAudio() {
        const state = this.state;
        if (state.code !== NetworkingStatusCode.Ready)
            return false;
        if (typeof state.preparedPacket !== 'undefined') {
            this.playAudioPacket(state.preparedPacket);
            state.preparedPacket = undefined;
            return true;
        }
        return false;
    }
    /**
     * Plays an audio packet, updating timing metadata used for playback.
     *
     * @param audioPacket - The audio packet to play
     */
    playAudioPacket(audioPacket) {
        const state = this.state;
        if (state.code !== NetworkingStatusCode.Ready)
            return;
        const { connectionData } = state;
        connectionData.packetsPlayed++;
        connectionData.sequence++;
        connectionData.timestamp += TIMESTAMP_INC;
        if (connectionData.sequence >= 2 ** 16)
            connectionData.sequence = 0;
        if (connectionData.timestamp >= 2 ** 32)
            connectionData.timestamp = 0;
        this.setSpeaking(true);
        state.udp.send(audioPacket);
    }
    /**
     * Sends a packet to the voice gateway indicating that the client has start/stopped sending
     * audio.
     *
     * @param speaking - Whether or not the client should be shown as speaking
     */
    setSpeaking(speaking) {
        const state = this.state;
        if (state.code !== NetworkingStatusCode.Ready)
            return;
        if (state.connectionData.speaking === speaking)
            return;
        state.connectionData.speaking = speaking;
        state.ws.sendPacket({
            op: 5 /* Speaking */,
            d: {
                speaking: speaking ? 1 : 0,
                delay: 0,
                ssrc: state.connectionData.ssrc,
            },
        });
    }
    /**
     * Creates a new audio packet from an Opus packet. This involves encrypting the packet,
     * then prepending a header that includes metadata.
     *
     * @param opusPacket - The Opus packet to prepare
     * @param connectionData - The current connection data of the instance
     */
    createAudioPacket(opusPacket, connectionData) {
        const packetBuffer = Buffer.alloc(12);
        packetBuffer[0] = 0x80;
        packetBuffer[1] = 0x78;
        const { sequence, timestamp, ssrc } = connectionData;
        packetBuffer.writeUIntBE(sequence, 2, 2);
        packetBuffer.writeUIntBE(timestamp, 4, 4);
        packetBuffer.writeUIntBE(ssrc, 8, 4);
        packetBuffer.copy(nonce, 0, 0, 12);
        return Buffer.concat([packetBuffer, ...this.encryptOpusPacket(opusPacket, connectionData)]);
    }
    /**
     * Encrypts an Opus packet using the format agreed upon by the instance and Discord.
     *
     * @param opusPacket - The Opus packet to encrypt
     * @param connectionData - The current connection data of the instance
     */
    encryptOpusPacket(opusPacket, connectionData) {
        const { secretKey, encryptionMode } = connectionData;
        if (encryptionMode === 'xsalsa20_poly1305_lite') {
            connectionData.nonce++;
            if (connectionData.nonce > MAX_NONCE_SIZE)
                connectionData.nonce = 0;
            connectionData.nonceBuffer.writeUInt32BE(connectionData.nonce, 0);
            return [
                secretbox.methods.close(opusPacket, connectionData.nonceBuffer, secretKey),
                connectionData.nonceBuffer.slice(0, 4),
            ];
        }
        else if (encryptionMode === 'xsalsa20_poly1305_suffix') {
            const random = secretbox.methods.random(24, connectionData.nonceBuffer);
            return [secretbox.methods.close(opusPacket, random, secretKey), random];
        }
        return [secretbox.methods.close(opusPacket, nonce, secretKey)];
    }
}
exports.Networking = Networking;
/**
 * Returns a random number that is in the range of n bits.
 *
 * @param n - The number of bits
 */
function randomNBit(n) {
    return Math.floor(Math.random() * 2 ** n);
}
/**
 * Stringifies a NetworkingState
 *
 * @param state - The state to stringify
 */
function stringifyState(state) {
    return JSON.stringify({
        ...state,
        ws: Reflect.has(state, 'ws'),
        udp: Reflect.has(state, 'udp'),
    });
}
/**
 * Chooses an encryption mode from a list of given options. Chooses the most preferred option.
 *
 * @param options - The available encryption options
 */
function chooseEncryptionMode(options) {
    const option = options.find((option) => exports.SUPPORTED_ENCRYPTION_MODES.includes(option));
    if (!option) {
        throw new Error(`No compatible encryption modes. Available include: ${options.join(', ')}`);
    }
    return option;
}
//# sourceMappingURL=Networking.js.map