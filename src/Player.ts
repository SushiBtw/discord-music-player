import { Client, Collection, Snowflake, VoiceState } from "discord.js";
import EventEmitter from "events";
import { Queue } from "./managers/Queue";
import { PlayerOptions, DefaultPlayerOptions } from "./types/types";

class Player extends EventEmitter {
    public client: Client;
    public queues: Collection<Snowflake, Queue> = new Collection();
    public options: PlayerOptions = DefaultPlayerOptions;

    constructor(client: Client, options: PlayerOptions = {}) {
        super();

        /**
         * Client object (discord.js)
         * @type {Client}
         */
        this.client = client;

        /**
         * The player options
         * @type {PlayerOptions}
         */
        this.options = Object.assign(
            {} as PlayerOptions,
            this.options,
            options
        );

        this.client.on('voiceStateUpdate',
            (oldState, newState) =>
                this._voiceUpdate(oldState, newState)
        );
    }

    /**
     * Creates the guild queue.
     * @param {Snowflake} guildId
     * @param {PlayerOptions} options
     * @returns {Queue}
     */
    createQueue(guildId: Snowflake, options: PlayerOptions & { data?: any } = this.options): Queue {
        let guild = this.client.guilds.resolve(guildId);
        if(!guild)
            throw 'InvalidGuild';
        if(this.hasQueue(guildId))
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
            queue!.destroy(true);
            this.emit('channelEmpty', queue);
        }, timeout);
    }
}

export { Player };
