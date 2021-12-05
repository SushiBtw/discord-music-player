"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSRCMap = void 0;
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
/**
 * Maps audio SSRCs to data of users in voice connections.
 */
class SSRCMap extends tiny_typed_emitter_1.TypedEmitter {
    constructor() {
        super();
        this.map = new Map();
    }
    /**
     * Updates the map with new user data
     *
     * @param data The data to update with
     */
    update(data) {
        const existing = this.map.get(data.audioSSRC);
        const newValue = {
            ...this.map.get(data.audioSSRC),
            ...data,
        };
        this.map.set(data.audioSSRC, newValue);
        if (!existing)
            this.emit('create', newValue);
        this.emit('update', existing, newValue);
    }
    /**
     * Gets the stored voice data of a user.
     *
     * @param target The target, either their user ID or audio SSRC
     */
    get(target) {
        if (typeof target === 'number') {
            return this.map.get(target);
        }
        for (const data of this.map.values()) {
            if (data.userId === target) {
                return data;
            }
        }
    }
    /**
     * Deletes the stored voice data about a user.
     *
     * @param target The target of the delete operation, either their audio SSRC or user ID
     * @returns The data that was deleted, if any
     */
    delete(target) {
        if (typeof target === 'number') {
            const existing = this.map.get(target);
            if (existing) {
                this.map.delete(target);
                this.emit('delete', existing);
            }
            return existing;
        }
        for (const [audioSSRC, data] of this.map.entries()) {
            if (data.userId === target) {
                this.map.delete(audioSSRC);
                this.emit('delete', data);
                return data;
            }
        }
    }
}
exports.SSRCMap = SSRCMap;
//# sourceMappingURL=SSRCMap.js.map