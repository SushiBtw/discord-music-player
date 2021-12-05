"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLocalPacket = exports.VoiceUDPSocket = void 0;
const dgram_1 = require("dgram");
const net_1 = require("net");
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
/**
 * The interval in milliseconds at which keep alive datagrams are sent
 */
const KEEP_ALIVE_INTERVAL = 5e3;
/**
 * The maximum number of keep alive packets which can be missed
 */
const KEEP_ALIVE_LIMIT = 12;
/**
 * The maximum value of the keep alive counter
 */
const MAX_COUNTER_VALUE = 2 ** 32 - 1;
/**
 * Manages the UDP networking for a voice connection.
 */
class VoiceUDPSocket extends tiny_typed_emitter_1.TypedEmitter {
    /**
     * Creates a new VoiceUDPSocket.
     *
     * @param remote - Details of the remote socket
     */
    constructor(remote, debug = false) {
        super();
        /**
         * The counter used in the keep alive mechanism
         */
        this.keepAliveCounter = 0;
        this.socket = dgram_1.createSocket('udp4');
        this.socket.on('error', (error) => this.emit('error', error));
        this.socket.on('message', (buffer) => this.onMessage(buffer));
        this.socket.on('close', () => this.emit('close'));
        this.remote = remote;
        this.keepAlives = [];
        this.keepAliveBuffer = Buffer.alloc(8);
        this.keepAliveInterval = setInterval(() => this.keepAlive(), KEEP_ALIVE_INTERVAL);
        setImmediate(() => this.keepAlive());
        this.debug = debug ? (message) => this.emit('debug', message) : null;
    }
    /**
     * Called when a message is received on the UDP socket
     * @param buffer The received buffer
     */
    onMessage(buffer) {
        // Handle keep alive message
        if (buffer.length === 8) {
            const counter = buffer.readUInt32LE(0);
            const index = this.keepAlives.findIndex(({ value }) => value === counter);
            if (index === -1)
                return;
            this.ping = Date.now() - this.keepAlives[index].timestamp;
            // Delete all keep alives up to and including the received one
            this.keepAlives.splice(0, index);
        }
        // Propagate the message
        this.emit('message', buffer);
    }
    /**
     * Called at a regular interval to check whether we are still able to send datagrams to Discord
     */
    keepAlive() {
        var _a;
        if (this.keepAlives.length >= KEEP_ALIVE_LIMIT) {
            (_a = this.debug) === null || _a === void 0 ? void 0 : _a.call(this, 'UDP socket has not received enough responses from Discord - closing socket');
            this.destroy();
            return;
        }
        this.keepAliveBuffer.writeUInt32LE(this.keepAliveCounter, 0);
        this.send(this.keepAliveBuffer);
        this.keepAlives.push({
            value: this.keepAliveCounter,
            timestamp: Date.now(),
        });
        this.keepAliveCounter++;
        if (this.keepAliveCounter > MAX_COUNTER_VALUE) {
            this.keepAliveCounter = 0;
        }
    }
    /**
     * Sends a buffer to Discord.
     *
     * @param buffer - The buffer to send
     */
    send(buffer) {
        return this.socket.send(buffer, this.remote.port, this.remote.ip);
    }
    /**
     * Closes the socket, the instance will not be able to be reused.
     */
    destroy() {
        try {
            this.socket.close();
        }
        catch { }
        clearInterval(this.keepAliveInterval);
    }
    /**
     * Performs IP discovery to discover the local address and port to be used for the voice connection.
     *
     * @param ssrc - The SSRC received from Discord
     */
    performIPDiscovery(ssrc) {
        return new Promise((resolve, reject) => {
            const listener = (message) => {
                try {
                    if (message.readUInt16BE(0) !== 2)
                        return;
                    const packet = parseLocalPacket(message);
                    this.socket.off('message', listener);
                    resolve(packet);
                }
                catch { }
            };
            this.socket.on('message', listener);
            this.socket.once('close', () => reject(new Error('Cannot perform IP discovery - socket closed')));
            const discoveryBuffer = Buffer.alloc(74);
            discoveryBuffer.writeUInt16BE(1, 0);
            discoveryBuffer.writeUInt16BE(70, 2);
            discoveryBuffer.writeUInt32BE(ssrc, 4);
            this.send(discoveryBuffer);
        });
    }
}
exports.VoiceUDPSocket = VoiceUDPSocket;
/**
 * Parses the response from Discord to aid with local IP discovery.
 *
 * @param message - The received message
 */
function parseLocalPacket(message) {
    const packet = Buffer.from(message);
    const ip = packet.slice(8, packet.indexOf(0, 8)).toString('utf-8');
    if (!net_1.isIPv4(ip)) {
        throw new Error('Malformed IP address');
    }
    const port = packet.readUInt16BE(packet.length - 2);
    return { ip, port };
}
exports.parseLocalPacket = parseLocalPacket;
//# sourceMappingURL=VoiceUDPSocket.js.map