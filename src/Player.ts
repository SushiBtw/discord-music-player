import { Client, Collection, Snowflake, VoiceState } from "discord.js";
import EventEmitter from "events";
import { DMPError, DMPErrors } from ".";
import { Queue } from "./managers/Queue";
import { PlayerOptions, DefaultPlayerOptions, PlayerEvents } from "./types/types";

export class Player extends EventEmitter {
    public client: Client;
    public queues: Collection<Snowflake, Queue> = new Collection();
    public options: PlayerOptions = DefaultPlayerOptions;

    /**
     * Player constructor
     * @param {Client} client
     * @param {PlayerOptions} [options={}]
     */
    constructor(client: Client, options: PlayerOptions = {}) {
        super();

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
        this.options = Object.assign(
            {} as PlayerOptions,
            this.options,
            options
        );

        /**
         * Player queues
         * @type {Collection<Snowflake, Queue>}
         */
        this.queues = new Collection<Snowflake, Queue>();

        this.client.on('voiceStateUpdate',
            (oldState, newState) =>
                this._voiceUpdate(oldState, newState)
        );
    }

    /**
     * Creates the guild queue.
     * @param {Snowflake} guildId
     * @param {PlayerOptions} [options=this.options]
     * @returns {Queue}
     */
    createQueue(guildId: Snowflake, options: PlayerOptions & { data?: any } = this.options): Queue {
        options = Object.assign(
            {} as PlayerOptions,
            this.options,
            options
        )

        let guild = this.client.guilds.resolve(guildId);
        if(!guild)
            throw new DMPError(DMPErrors.INVALID_GUILD);
        if(this.hasQueue(guildId) && !this.getQueue(guildId)?.destroyed)
            return this.getQueue(guildId) as Queue;

        let { data } = options;
        delete options.data;
        const queue = new Queue(this, guild, options);
        queue.data = data;
        this.setQueue(guildId, queue);

        return queue as Queue;
    }

    /**
     * Check if the guild has a queue.
     * @param {Snowflake} guildId
     * @returns {boolean}
     */
    hasQueue(guildId: Snowflake): boolean {
        return !!this.queues.get(guildId);
    }

    /**
     * Gets the guild queue.
     * @param {Snowflake} guildId
     * @returns {?Queue}
     */
    getQueue(guildId: Snowflake): Queue|undefined {
        return this.queues.get(guildId);
    }

    /**
     * Deletes the guild queue.
     * @param {Snowflake} guildId
     * @param {Queue} queue
     * @returns {void}
     */
    setQueue(guildId: Snowflake, queue: Queue): void {
        this.queues.set(guildId, queue);
    }

    /**
     * Deletes the guild queue.
     * @param {Snowflake} guildId
     * @returns {void}
     */
    deleteQueue(guildId: Snowflake): void {
        this.queues.delete(guildId);
    }

    /**
     * Handle a Voice State Update
     * @private
     * @param {VoiceState} oldState
     * @param {VoiceState} newState
     * @returns {void}
     */
    _voiceUpdate(oldState: VoiceState, newState: VoiceState): void {
        let queue = this.queues.get(oldState.guild.id);
        if(!queue || !queue.connection)
            return;

        let { deafenOnJoin, leaveOnEmpty, timeout } = queue.options;

        if (!newState.channelId && this.client.user?.id === oldState.member?.id) {
            queue.destroy();
            return void this.emit('clientDisconnect', queue);
        } else if(deafenOnJoin && oldState.serverDeaf && !newState.serverDeaf) {
            this.emit('clientUndeafen', queue);
        }

        if (oldState.channelId === newState.channelId) return;
        if (!leaveOnEmpty || queue.connection.channel.members.size > 1) return;
        setTimeout(() => {
            if (queue!.connection.channel.members.size > 1) return;
            if (queue!.connection.channel.members.has(this.client.user!.id)) {
                queue!.destroy(true);
                this.emit('channelEmpty', queue);
            }
        }, timeout);
    }
}

export declare interface Player {
    on<K extends keyof PlayerEvents>(event: K, listener: (...args: PlayerEvents[K]) => void): this;
}
