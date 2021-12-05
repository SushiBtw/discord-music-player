"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceReceiver = void 0;
const Secretbox_1 = require("../util/Secretbox");
const AudioReceiveStream_1 = require("./AudioReceiveStream");
const SpeakingMap_1 = require("./SpeakingMap");
const SSRCMap_1 = require("./SSRCMap");
/**
 * Attaches to a VoiceConnection, allowing you to receive audio packets from other
 * users that are speaking.
 *
 * @beta
 */
class VoiceReceiver {
    constructor(voiceConnection) {
        this.voiceConnection = voiceConnection;
        this.ssrcMap = new SSRCMap_1.SSRCMap();
        this.speaking = new SpeakingMap_1.SpeakingMap();
        this.subscriptions = new Map();
        this.connectionData = {};
        this.onWsPacket = this.onWsPacket.bind(this);
        this.onUdpMessage = this.onUdpMessage.bind(this);
    }
    /**
     * Called when a packet is received on the attached connection's WebSocket.
     *
     * @param packet The received packet
     * @internal
     */
    onWsPacket(packet) {
        var _a, _b, _c, _d, _e;
        if (packet.op === 13 /* ClientDisconnect */ && typeof ((_a = packet.d) === null || _a === void 0 ? void 0 : _a.user_id) === 'string') {
            this.ssrcMap.delete(packet.d.user_id);
        }
        else if (packet.op === 5 /* Speaking */ &&
            typeof ((_b = packet.d) === null || _b === void 0 ? void 0 : _b.user_id) === 'string' &&
            typeof ((_c = packet.d) === null || _c === void 0 ? void 0 : _c.ssrc) === 'number') {
            this.ssrcMap.update({ userId: packet.d.user_id, audioSSRC: packet.d.ssrc });
        }
        else if (packet.op === 12 /* ClientConnect */ &&
            typeof ((_d = packet.d) === null || _d === void 0 ? void 0 : _d.user_id) === 'string' &&
            typeof ((_e = packet.d) === null || _e === void 0 ? void 0 : _e.audio_ssrc) === 'number') {
            this.ssrcMap.update({
                userId: packet.d.user_id,
                audioSSRC: packet.d.audio_ssrc,
                videoSSRC: packet.d.video_ssrc === 0 ? undefined : packet.d.video_ssrc,
            });
        }
    }
    decrypt(buffer, mode, nonce, secretKey) {
        // Choose correct nonce depending on encryption
        let end;
        if (mode === 'xsalsa20_poly1305_lite') {
            buffer.copy(nonce, 0, buffer.length - 4);
            end = buffer.length - 4;
        }
        else if (mode === 'xsalsa20_poly1305_suffix') {
            buffer.copy(nonce, 0, buffer.length - 24);
            end = buffer.length - 24;
        }
        else {
            buffer.copy(nonce, 0, 0, 12);
        }
        // Open packet
        const decrypted = Secretbox_1.methods.open(buffer.slice(12, end), nonce, secretKey);
        if (!decrypted)
            return;
        return Buffer.from(decrypted);
    }
    /**
     * Parses an audio packet, decrypting it to yield an Opus packet.
     *
     * @param buffer The buffer to parse
     * @param mode The encryption mode
     * @param nonce The nonce buffer used by the connection for encryption
     * @param secretKey The secret key used by the connection for encryption
     * @returns The parsed Opus packet
     */
    parsePacket(buffer, mode, nonce, secretKey) {
        let packet = this.decrypt(buffer, mode, nonce, secretKey);
        if (!packet)
            return;
        // Strip RTP Header Extensions (one-byte only)
        if (packet[0] === 0xbe && packet[1] === 0xde && packet.length > 4) {
            const headerExtensionLength = packet.readUInt16BE(2);
            let offset = 4;
            for (let i = 0; i < headerExtensionLength; i++) {
                const byte = packet[offset];
                offset++;
                if (byte === 0)
                    continue;
                offset += 1 + (byte >> 4);
            }
            // Skip over undocumented Discord byte (if present)
            const byte = packet.readUInt8(offset);
            if (byte === 0x00 || byte === 0x02)
                offset++;
            packet = packet.slice(offset);
        }
        return packet;
    }
    /**
     * Called when the UDP socket of the attached connection receives a message.
     *
     * @param msg The received message
     * @internal
     */
    onUdpMessage(msg) {
        if (msg.length <= 8)
            return;
        const ssrc = msg.readUInt32BE(8);
        const userData = this.ssrcMap.get(ssrc);
        if (!userData)
            return;
        this.speaking.onPacket(userData.userId);
        const stream = this.subscriptions.get(userData.userId);
        if (!stream)
            return;
        if (this.connectionData.encryptionMode && this.connectionData.nonceBuffer && this.connectionData.secretKey) {
            const packet = this.parsePacket(msg, this.connectionData.encryptionMode, this.connectionData.nonceBuffer, this.connectionData.secretKey);
            if (packet) {
                stream.push(packet);
            }
            else {
                stream.destroy(new Error('Failed to parse packet'));
            }
        }
    }
    /**
     * Creates a subscription for the given user ID.
     *
     * @param target The ID of the user to subscribe to
     * @returns A readable stream of Opus packets received from the target
     */
    subscribe(userId, options) {
        const existing = this.subscriptions.get(userId);
        if (existing)
            return existing;
        const stream = new AudioReceiveStream_1.AudioReceiveStream({
            ...AudioReceiveStream_1.createDefaultAudioReceiveStreamOptions(),
            ...options,
        });
        stream.once('close', () => this.subscriptions.delete(userId));
        this.subscriptions.set(userId, stream);
        return stream;
    }
}
exports.VoiceReceiver = VoiceReceiver;
//# sourceMappingURL=VoiceReceiver.js.map