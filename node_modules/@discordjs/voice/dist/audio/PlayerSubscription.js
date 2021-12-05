"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerSubscription = void 0;
/**
 * Represents a subscription of a voice connection to an audio player, allowing
 * the audio player to play audio on the voice connection.
 */
class PlayerSubscription {
    constructor(connection, player) {
        this.connection = connection;
        this.player = player;
    }
    /**
     * Unsubscribes the connection from the audio player, meaning that the
     * audio player cannot stream audio to it until a new subscription is made.
     */
    unsubscribe() {
        this.connection['onSubscriptionRemoved'](this);
        this.player['unsubscribe'](this);
    }
}
exports.PlayerSubscription = PlayerSubscription;
//# sourceMappingURL=PlayerSubscription.js.map