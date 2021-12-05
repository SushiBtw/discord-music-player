"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
const discord_js_1 = require("discord.js");
const events_1 = __importDefault(require("events"));
const _1 = require(".");
const Queue_1 = require("./managers/Queue");
const types_1 = require("./types/types");
class Player extends events_1.default {
    /**
     * Player constructor
     * @param {Client} client
     * @param {PlayerOptions} [options={}]
     */
    constructor(client, options = {}) {
        super();
        this.queues = new discord_js_1.Collection();
        this.options = types_1.DefaultPlayerOptions;
        /**
         * Client object (discord.js)
         * @type {object}
         * @readonly
         */
        this.client = client;
        /**
         * Player options
         * @type {PlayerOptions}
         */
        this.options = Object.assign({}, this.options, options);
        /**
         * Player queues
         * @type {Collection<Snowflake, Queue>}
         */
        this.queues = new discord_js_1.Collection();
        this.client.on('voiceStateUpdate', (oldState, newState) => this._voiceUpdate(oldState, newState));
    }
    /**
     * Creates the guild queue.
     * @param {Snowflake} guildId
     * @param {PlayerOptions} [options=this.options]
     * @returns {Queue}
     */
    createQueue(guildId, options = this.options) {
        var _a;
        options = Object.assign({}, this.options, options);
        let guild = this.client.guilds.resolve(guildId);
        if (!guild)
            throw new _1.DMPError(_1.DMPErrors.INVALID_GUILD);
        if (this.hasQueue(guildId) && !((_a = this.getQueue(guildId)) === null || _a === void 0 ? void 0 : _a.destroyed))
            return this.getQueue(guildId);
        let { data } = options;
        delete options.data;
        const queue = new Queue_1.Queue(this, guild, options);
        queue.data = data;
        this.setQueue(guildId, queue);
        return queue;
    }
    /**
     * Check if the guild has a queue.
     * @param {Snowflake} guildId
     * @returns {boolean}
     */
    hasQueue(guildId) {
        return !!this.queues.get(guildId);
    }
    /**
     * Gets the guild queue.
     * @param {Snowflake} guildId
     * @returns {?Queue}
     */
    getQueue(guildId) {
        return this.queues.get(guildId);
    }
    /**
     * Deletes the guild queue.
     * @param {Snowflake} guildId
     * @param {Queue} queue
     * @returns {void}
     */
    setQueue(guildId, queue) {
        this.queues.set(guildId, queue);
    }
    /**
     * Deletes the guild queue.
     * @param {Snowflake} guildId
     * @returns {void}
     */
    deleteQueue(guildId) {
        this.queues.delete(guildId);
    }
    /**
     * Handle a Voice State Update
     * @private
     * @param {VoiceState} oldState
     * @param {VoiceState} newState
     * @returns {void}
     */
    _voiceUpdate(oldState, newState) {
        var _a, _b;
        let queue = this.queues.get(oldState.guild.id);
        if (!queue || !queue.connection)
            return;
        let { deafenOnJoin, leaveOnEmpty, timeout } = queue.options;
        if (!newState.channelId && ((_a = this.client.user) === null || _a === void 0 ? void 0 : _a.id) === ((_b = oldState.member) === null || _b === void 0 ? void 0 : _b.id)) {
            queue.destroy();
            return void this.emit('clientDisconnect', queue);
        }
        else if (deafenOnJoin && oldState.serverDeaf && !newState.serverDeaf) {
            this.emit('clientUndeafen', queue);
        }
        if (oldState.channelId === newState.channelId)
            return;
        if (!leaveOnEmpty || queue.connection.channel.members.size > 1)
            return;
        setTimeout(() => {
            if (queue.connection.channel.members.size > 1)
                return;
            if (queue.connection.channel.members.has(this.client.user.id)) {
                queue.destroy(true);
                this.emit('channelEmpty', queue);
            }
        }, timeout);
    }
}
exports.Player = Player;
