"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVoiceConnection = exports.VoiceConnection = exports.VoiceConnectionDisconnectReason = exports.VoiceConnectionStatus = void 0;
const DataStore_1 = require("./DataStore");
const Networking_1 = require("./networking/Networking");
const util_1 = require("./util/util");
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const receive_1 = require("./receive");
/**
 * The various status codes a voice connection can hold at any one time.
 */
var VoiceConnectionStatus;
(function (VoiceConnectionStatus) {
    /**
     * Sending a packet to the main Discord gateway to indicate we want to change our voice state.
     */
    VoiceConnectionStatus["Signalling"] = "signalling";
    /**
     * The `VOICE_SERVER_UPDATE` and `VOICE_STATE_UPDATE` packets have been received, now attempting to establish a voice connection.
     */
    VoiceConnectionStatus["Connecting"] = "connecting";
    /**
     * A voice connection has been established, and is ready to be used
     */
    VoiceConnectionStatus["Ready"] = "ready";
    /**
     * The voice connection has either been severed or not established.
     */
    VoiceConnectionStatus["Disconnected"] = "disconnected";
    /**
     * The voice connection has been destroyed and untracked, it cannot be reused.
     */
    VoiceConnectionStatus["Destroyed"] = "destroyed";
})(VoiceConnectionStatus = exports.VoiceConnectionStatus || (exports.VoiceConnectionStatus = {}));
/**
 * The reasons a voice connection can be in the disconnected state.
 */
var VoiceConnectionDisconnectReason;
(function (VoiceConnectionDisconnectReason) {
    /**
     * When the WebSocket connection has been closed.
     */
    VoiceConnectionDisconnectReason[VoiceConnectionDisconnectReason["WebSocketClose"] = 0] = "WebSocketClose";
    /**
     * When the adapter was unable to send a message requested by the VoiceConnection.
     */
    VoiceConnectionDisconnectReason[VoiceConnectionDisconnectReason["AdapterUnavailable"] = 1] = "AdapterUnavailable";
    /**
     * When a VOICE_SERVER_UPDATE packet is received with a null endpoint, causing the connection to be severed.
     */
    VoiceConnectionDisconnectReason[VoiceConnectionDisconnectReason["EndpointRemoved"] = 2] = "EndpointRemoved";
    /**
     * When a manual disconnect was requested.
     */
    VoiceConnectionDisconnectReason[VoiceConnectionDisconnectReason["Manual"] = 3] = "Manual";
})(VoiceConnectionDisconnectReason = exports.VoiceConnectionDisconnectReason || (exports.VoiceConnectionDisconnectReason = {}));
/**
 * A connection to the voice server of a Guild, can be used to play audio in voice channels.
 */
class VoiceConnection extends tiny_typed_emitter_1.TypedEmitter {
    /**
     * Creates a new voice connection.
     *
     * @param joinConfig - The data required to establish the voice connection
     * @param options - The options used to create this voice connection
     */
    constructor(joinConfig, { debug, adapterCreator }) {
        super();
        this.debug = debug ? (message) => this.emit('debug', message) : null;
        this.rejoinAttempts = 0;
        this.receiver = new receive_1.VoiceReceiver(this);
        this.onNetworkingClose = this.onNetworkingClose.bind(this);
        this.onNetworkingStateChange = this.onNetworkingStateChange.bind(this);
        this.onNetworkingError = this.onNetworkingError.bind(this);
        this.onNetworkingDebug = this.onNetworkingDebug.bind(this);
        const adapter = adapterCreator({
            onVoiceServerUpdate: (data) => this.addServerPacket(data),
            onVoiceStateUpdate: (data) => this.addStatePacket(data),
            destroy: () => this.destroy(false),
        });
        this._state = { status: VoiceConnectionStatus.Signalling, adapter };
        this.packets = {
            server: undefined,
            state: undefined,
        };
        this.joinConfig = joinConfig;
    }
    /**
     * The current state of the voice connection
     */
    get state() {
        return this._state;
    }
    /**
     * Updates the state of the voice connection, performing clean-up operations where necessary.
     */
    set state(newState) {
        const oldState = this._state;
        const oldNetworking = Reflect.get(oldState, 'networking');
        const newNetworking = Reflect.get(newState, 'networking');
        const oldSubscription = Reflect.get(oldState, 'subscription');
        const newSubscription = Reflect.get(newState, 'subscription');
        if (oldNetworking !== newNetworking) {
            if (oldNetworking) {
                oldNetworking.on('error', util_1.noop);
                oldNetworking.off('debug', this.onNetworkingDebug);
                oldNetworking.off('error', this.onNetworkingError);
                oldNetworking.off('close', this.onNetworkingClose);
                oldNetworking.off('stateChange', this.onNetworkingStateChange);
                oldNetworking.destroy();
            }
            if (newNetworking)
                this.updateReceiveBindings(newNetworking.state, oldNetworking === null || oldNetworking === void 0 ? void 0 : oldNetworking.state);
        }
        if (newState.status === VoiceConnectionStatus.Ready) {
            this.rejoinAttempts = 0;
        }
        else if (newState.status === VoiceConnectionStatus.Destroyed) {
            for (const stream of this.receiver.subscriptions.values()) {
                if (!stream.destroyed)
                    stream.destroy();
            }
        }
        // If destroyed, the adapter can also be destroyed so it can be cleaned up by the user
        if (oldState.status !== VoiceConnectionStatus.Destroyed && newState.status === VoiceConnectionStatus.Destroyed) {
            oldState.adapter.destroy();
        }
        this._state = newState;
        if (oldSubscription && oldSubscription !== newSubscription) {
            oldSubscription.unsubscribe();
        }
        this.emit('stateChange', oldState, newState);
        if (oldState.status !== newState.status) {
            this.emit(newState.status, oldState, newState);
        }
    }
    /**
     * Registers a `VOICE_SERVER_UPDATE` packet to the voice connection. This will cause it to reconnect using the
     * new data provided in the packet.
     *
     * @param packet - The received `VOICE_SERVER_UPDATE` packet
     */
    addServerPacket(packet) {
        this.packets.server = packet;
        if (packet.endpoint) {
            this.configureNetworking();
        }
        else if (this.state.status !== VoiceConnectionStatus.Destroyed) {
            this.state = {
                ...this.state,
                status: VoiceConnectionStatus.Disconnected,
                reason: VoiceConnectionDisconnectReason.EndpointRemoved,
            };
        }
    }
    /**
     * Registers a `VOICE_STATE_UPDATE` packet to the voice connection. Most importantly, it stores the ID of the
     * channel that the client is connected to.
     *
     * @param packet - The received `VOICE_STATE_UPDATE` packet
     */
    addStatePacket(packet) {
        this.packets.state = packet;
        if (typeof packet.self_deaf !== 'undefined')
            this.joinConfig.selfDeaf = packet.self_deaf;
        if (typeof packet.self_mute !== 'undefined')
            this.joinConfig.selfMute = packet.self_mute;
        if (packet.channel_id)
            this.joinConfig.channelId = packet.channel_id;
        /*
            the channel_id being null doesn't necessarily mean it was intended for the client to leave the voice channel
            as it may have disconnected due to network failure. This will be gracefully handled once the voice websocket
            dies, and then it is up to the user to decide how they wish to handle this.
        */
    }
    /**
     * Called when the networking state changes, and the new ws/udp packet/message handlers need to be rebound
     * to the new instances.
     * @param newState - The new networking state
     * @param oldState - The old networking state, if there is one
     */
    updateReceiveBindings(newState, oldState) {
        var _a;
        const oldWs = Reflect.get(oldState !== null && oldState !== void 0 ? oldState : {}, 'ws');
        const newWs = Reflect.get(newState, 'ws');
        const oldUdp = Reflect.get(oldState !== null && oldState !== void 0 ? oldState : {}, 'udp');
        const newUdp = Reflect.get(newState, 'udp');
        if (oldWs !== newWs) {
            oldWs === null || oldWs === void 0 ? void 0 : oldWs.off('packet', this.receiver.onWsPacket);
            newWs === null || newWs === void 0 ? void 0 : newWs.on('packet', this.receiver.onWsPacket);
        }
        if (oldUdp !== newUdp) {
            oldUdp === null || oldUdp === void 0 ? void 0 : oldUdp.off('message', this.receiver.onUdpMessage);
            newUdp === null || newUdp === void 0 ? void 0 : newUdp.on('message', this.receiver.onUdpMessage);
        }
        this.receiver.connectionData = (_a = Reflect.get(newState, 'connectionData')) !== null && _a !== void 0 ? _a : {};
    }
    /**
     * Attempts to configure a networking instance for this voice connection using the received packets.
     * Both packets are required, and any existing networking instance will be destroyed.
     *
     * @remarks
     * This is called when the voice server of the connection changes, e.g. if the bot is moved into a
     * different channel in the same guild but has a different voice server. In this instance, the connection
     * needs to be re-established to the new voice server.
     *
     * The connection will transition to the Connecting state when this is called.
     */
    configureNetworking() {
        const { server, state } = this.packets;
        if (!server || !state || this.state.status === VoiceConnectionStatus.Destroyed || !server.endpoint)
            return;
        const networking = new Networking_1.Networking({
            endpoint: server.endpoint,
            serverId: server.guild_id,
            token: server.token,
            sessionId: state.session_id,
            userId: state.user_id,
        }, Boolean(this.debug));
        networking.once('close', this.onNetworkingClose);
        networking.on('stateChange', this.onNetworkingStateChange);
        networking.on('error', this.onNetworkingError);
        networking.on('debug', this.onNetworkingDebug);
        this.state = {
            ...this.state,
            status: VoiceConnectionStatus.Connecting,
            networking,
        };
    }
    /**
     * Called when the networking instance for this connection closes. If the close code is 4014 (do not reconnect),
     * the voice connection will transition to the Disconnected state which will store the close code. You can
     * decide whether or not to reconnect when this occurs by listening for the state change and calling reconnect().
     *
     * @remarks
     * If the close code was anything other than 4014, it is likely that the closing was not intended, and so the
     * VoiceConnection will signal to Discord that it would like to rejoin the channel. This automatically attempts
     * to re-establish the connection. This would be seen as a transition from the Ready state to the Signalling state.
     *
     * @param code - The close code
     */
    onNetworkingClose(code) {
        if (this.state.status === VoiceConnectionStatus.Destroyed)
            return;
        // If networking closes, try to connect to the voice channel again.
        if (code === 4014) {
            // Disconnected - networking is already destroyed here
            this.state = {
                ...this.state,
                status: VoiceConnectionStatus.Disconnected,
                reason: VoiceConnectionDisconnectReason.WebSocketClose,
                closeCode: code,
            };
        }
        else {
            this.state = {
                ...this.state,
                status: VoiceConnectionStatus.Signalling,
            };
            this.rejoinAttempts++;
            if (!this.state.adapter.sendPayload(DataStore_1.createJoinVoiceChannelPayload(this.joinConfig))) {
                this.state = {
                    ...this.state,
                    status: VoiceConnectionStatus.Disconnected,
                    reason: VoiceConnectionDisconnectReason.AdapterUnavailable,
                };
            }
        }
    }
    /**
     * Called when the state of the networking instance changes. This is used to derive the state of the voice connection.
     *
     * @param oldState - The previous state
     * @param newState - The new state
     */
    onNetworkingStateChange(oldState, newState) {
        this.updateReceiveBindings(newState, oldState);
        if (oldState.code === newState.code)
            return;
        if (this.state.status !== VoiceConnectionStatus.Connecting && this.state.status !== VoiceConnectionStatus.Ready)
            return;
        if (newState.code === Networking_1.NetworkingStatusCode.Ready) {
            this.state = {
                ...this.state,
                status: VoiceConnectionStatus.Ready,
            };
        }
        else if (newState.code !== Networking_1.NetworkingStatusCode.Closed) {
            this.state = {
                ...this.state,
                status: VoiceConnectionStatus.Connecting,
            };
        }
    }
    /**
     * Propagates errors from the underlying network instance.
     *
     * @param error - The error to propagate
     */
    onNetworkingError(error) {
        this.emit('error', error);
    }
    /**
     * Propagates debug messages from the underlying network instance.
     *
     * @param message - The debug message to propagate
     */
    onNetworkingDebug(message) {
        var _a;
        (_a = this.debug) === null || _a === void 0 ? void 0 : _a.call(this, `[NW] ${message}`);
    }
    /**
     * Prepares an audio packet for dispatch
     *
     * @param buffer - The Opus packet to prepare
     */
    prepareAudioPacket(buffer) {
        const state = this.state;
        if (state.status !== VoiceConnectionStatus.Ready)
            return;
        return state.networking.prepareAudioPacket(buffer);
    }
    /**
     * Dispatches the previously prepared audio packet (if any)
     */
    dispatchAudio() {
        const state = this.state;
        if (state.status !== VoiceConnectionStatus.Ready)
            return;
        return state.networking.dispatchAudio();
    }
    /**
     * Prepares an audio packet and dispatches it immediately
     *
     * @param buffer - The Opus packet to play
     */
    playOpusPacket(buffer) {
        const state = this.state;
        if (state.status !== VoiceConnectionStatus.Ready)
            return;
        state.networking.prepareAudioPacket(buffer);
        return state.networking.dispatchAudio();
    }
    /**
     * Destroys the VoiceConnection, preventing it from connecting to voice again.
     * This method should be called when you no longer require the VoiceConnection to
     * prevent memory leaks.
     * @param adapterAvailable - Whether the adapter can be used
     */
    destroy(adapterAvailable = true) {
        if (this.state.status === VoiceConnectionStatus.Destroyed) {
            throw new Error('Cannot destroy VoiceConnection - it has already been destroyed');
        }
        if (DataStore_1.getVoiceConnection(this.joinConfig.guildId) === this) {
            DataStore_1.untrackVoiceConnection(this);
        }
        if (adapterAvailable) {
            this.state.adapter.sendPayload(DataStore_1.createJoinVoiceChannelPayload({ ...this.joinConfig, channelId: null }));
        }
        this.state = {
            status: VoiceConnectionStatus.Destroyed,
        };
    }
    /**
     * Disconnects the VoiceConnection, allowing the possibility of rejoining later on.
     * @returns - true if the connection was successfully disconnected.
     */
    disconnect() {
        if (this.state.status === VoiceConnectionStatus.Destroyed ||
            this.state.status === VoiceConnectionStatus.Signalling) {
            return false;
        }
        this.joinConfig.channelId = null;
        if (!this.state.adapter.sendPayload(DataStore_1.createJoinVoiceChannelPayload(this.joinConfig))) {
            this.state = {
                adapter: this.state.adapter,
                subscription: this.state.subscription,
                status: VoiceConnectionStatus.Disconnected,
                reason: VoiceConnectionDisconnectReason.AdapterUnavailable,
            };
            return false;
        }
        this.state = {
            adapter: this.state.adapter,
            reason: VoiceConnectionDisconnectReason.Manual,
            status: VoiceConnectionStatus.Disconnected,
        };
        return true;
    }
    /**
     * Attempts to rejoin (better explanation soon:tm:)
     *
     * @remarks
     * Calling this method successfully will automatically increment the `rejoinAttempts` counter,
     * which you can use to inform whether or not you'd like to keep attempting to reconnect your
     * voice connection.
     *
     * A state transition from Disconnected to Signalling will be observed when this is called.
     */
    rejoin(joinConfig) {
        if (this.state.status === VoiceConnectionStatus.Destroyed) {
            return false;
        }
        const notReady = this.state.status !== VoiceConnectionStatus.Ready;
        if (notReady)
            this.rejoinAttempts++;
        Object.assign(this.joinConfig, joinConfig);
        if (this.state.adapter.sendPayload(DataStore_1.createJoinVoiceChannelPayload(this.joinConfig))) {
            if (notReady) {
                this.state = {
                    ...this.state,
                    status: VoiceConnectionStatus.Signalling,
                };
            }
            return true;
        }
        this.state = {
            adapter: this.state.adapter,
            subscription: this.state.subscription,
            status: VoiceConnectionStatus.Disconnected,
            reason: VoiceConnectionDisconnectReason.AdapterUnavailable,
        };
        return false;
    }
    /**
     * Updates the speaking status of the voice connection. This is used when audio players are done playing audio,
     * and need to signal that the connection is no longer playing audio.
     *
     * @param enabled - Whether or not to show as speaking
     */
    setSpeaking(enabled) {
        if (this.state.status !== VoiceConnectionStatus.Ready)
            return false;
        this.state.networking.setSpeaking(enabled);
    }
    /**
     * Subscribes to an audio player, allowing the player to play audio on this voice connection.
     *
     * @param player - The audio player to subscribe to
     * @returns The created subscription
     */
    subscribe(player) {
        if (this.state.status === VoiceConnectionStatus.Destroyed)
            return;
        // eslint-disable-next-line @typescript-eslint/dot-notation
        const subscription = player['subscribe'](this);
        this.state = {
            ...this.state,
            subscription,
        };
        return subscription;
    }
    /**
     * The latest ping (in milliseconds) for the WebSocket connection and audio playback for this voice
     * connection, if this data is available.
     *
     * @remarks
     * For this data to be available, the VoiceConnection must be in the Ready state, and its underlying
     * WebSocket connection and UDP socket must have had at least one ping-pong exchange.
     */
    get ping() {
        if (this.state.status === VoiceConnectionStatus.Ready &&
            this.state.networking.state.code === Networking_1.NetworkingStatusCode.Ready) {
            return {
                ws: this.state.networking.state.ws.ping,
                udp: this.state.networking.state.udp.ping,
            };
        }
        return {
            ws: undefined,
            udp: undefined,
        };
    }
    /**
     * Called when a subscription of this voice connection to an audio player is removed.
     *
     * @param subscription - The removed subscription
     */
    onSubscriptionRemoved(subscription) {
        if (this.state.status !== VoiceConnectionStatus.Destroyed && this.state.subscription === subscription) {
            this.state = {
                ...this.state,
                subscription: undefined,
            };
        }
    }
}
exports.VoiceConnection = VoiceConnection;
/**
 * Creates a new voice connection
 *
 * @param joinConfig - The data required to establish the voice connection
 * @param options - The options to use when joining the voice channel
 */
function createVoiceConnection(joinConfig, options) {
    const payload = DataStore_1.createJoinVoiceChannelPayload(joinConfig);
    const existing = DataStore_1.getVoiceConnection(joinConfig.guildId);
    if (existing && existing.state.status !== VoiceConnectionStatus.Destroyed) {
        if (existing.state.status === VoiceConnectionStatus.Disconnected) {
            existing.rejoin({
                channelId: joinConfig.channelId,
                selfDeaf: joinConfig.selfDeaf,
                selfMute: joinConfig.selfMute,
            });
        }
        else if (!existing.state.adapter.sendPayload(payload)) {
            existing.state = {
                ...existing.state,
                status: VoiceConnectionStatus.Disconnected,
                reason: VoiceConnectionDisconnectReason.AdapterUnavailable,
            };
        }
        return existing;
    }
    const voiceConnection = new VoiceConnection(joinConfig, options);
    DataStore_1.trackVoiceConnection(voiceConnection);
    if (voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) {
        if (!voiceConnection.state.adapter.sendPayload(payload)) {
            voiceConnection.state = {
                ...voiceConnection.state,
                status: VoiceConnectionStatus.Disconnected,
                reason: VoiceConnectionDisconnectReason.AdapterUnavailable,
            };
        }
    }
    return voiceConnection;
}
exports.createVoiceConnection = createVoiceConnection;
//# sourceMappingURL=VoiceConnection.js.map