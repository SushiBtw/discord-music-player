"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceWebSocket = void 0;
const ws_1 = __importDefault(require("ws"));
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
/**
 * An extension of the WebSocket class to provide helper functionality when interacting
 * with the Discord Voice gateway.
 */
class VoiceWebSocket extends tiny_typed_emitter_1.TypedEmitter {
    /**
     * Creates a new VoiceWebSocket
     *
     * @param address - The address to connect to
     */
    constructor(address, debug) {
        super();
        /**
         * The number of consecutively missed heartbeats.
         */
        this.missedHeartbeats = 0;
        this.ws = new ws_1.default(address);
        this.ws.onmessage = (e) => this.onMessage(e);
        this.ws.onopen = (e) => this.emit('open', e);
        this.ws.onerror = (e) => this.emit('error', e instanceof Error ? e : e.error);
        this.ws.onclose = (e) => this.emit('close', e);
        this.lastHeartbeatAck = 0;
        this.lastHeatbeatSend = 0;
        this.debug = debug ? (message) => this.emit('debug', message) : null;
    }
    /**
     * Destroys the VoiceWebSocket. The heartbeat interval is cleared, and the connection is closed.
     */
    destroy() {
        var _a;
        try {
            (_a = this.debug) === null || _a === void 0 ? void 0 : _a.call(this, 'destroyed');
            this.setHeartbeatInterval(-1);
            this.ws.close(1000);
        }
        catch (error) {
            this.emit('error', error);
        }
    }
    /**
     * Handles message events on the WebSocket. Attempts to JSON parse the messages and emit them
     * as packets.
     *
     * @param event - The message event
     */
    onMessage(event) {
        var _a;
        if (typeof event.data !== 'string')
            return;
        (_a = this.debug) === null || _a === void 0 ? void 0 : _a.call(this, `<< ${event.data}`);
        let packet;
        try {
            packet = JSON.parse(event.data);
        }
        catch (error) {
            this.emit('error', error);
            return;
        }
        if (packet.op === 6 /* HeartbeatAck */) {
            this.lastHeartbeatAck = Date.now();
            this.missedHeartbeats = 0;
            this.ping = this.lastHeartbeatAck - this.lastHeatbeatSend;
        }
        /**
         * Packet event.
         *
         * @event VoiceWebSocket#packet
         * @type {any}
         */
        this.emit('packet', packet);
    }
    /**
     * Sends a JSON-stringifiable packet over the WebSocket
     *
     * @param packet - The packet to send
     */
    sendPacket(packet) {
        var _a;
        try {
            const stringified = JSON.stringify(packet);
            (_a = this.debug) === null || _a === void 0 ? void 0 : _a.call(this, `>> ${stringified}`);
            return this.ws.send(stringified);
        }
        catch (error) {
            this.emit('error', error);
        }
    }
    /**
     * Sends a heartbeat over the WebSocket
     */
    sendHeartbeat() {
        this.lastHeatbeatSend = Date.now();
        this.missedHeartbeats++;
        const nonce = this.lastHeatbeatSend;
        return this.sendPacket({
            op: 3 /* Heartbeat */,
            d: nonce,
        });
    }
    /**
     * Sets/clears an interval to send heartbeats over the WebSocket
     *
     * @param ms - The interval in milliseconds. If negative, the interval will be unset.
     */
    setHeartbeatInterval(ms) {
        if (typeof this.heartbeatInterval !== 'undefined')
            clearInterval(this.heartbeatInterval);
        if (ms > 0) {
            this.heartbeatInterval = setInterval(() => {
                if (this.lastHeatbeatSend !== 0 && this.missedHeartbeats >= 3) {
                    // Missed too many heartbeats - disconnect
                    this.ws.close();
                    this.setHeartbeatInterval(-1);
                }
                this.sendHeartbeat();
            }, ms);
        }
    }
}
exports.VoiceWebSocket = VoiceWebSocket;
//# sourceMappingURL=VoiceWebSocket.js.map