const { EventEmitter } = require('events');
const ytdl = require('@sushibtw/ytdl-core');
const ytsr = require('ytsr');
const Discord = require("discord.js");
if (Number(Discord.version.split('.')[0]) < 12) throw new Error("Only the master branch of discord.js library is supported for now. Install it using 'npm install discordjs/discord.js'.");
const Queue = require('./Queue');
const Util = require('./Util');
const Playlist = require('./Playlist');

class Player extends EventEmitter {

    /**
     * @param {Discord.Client} client Your Discord Client instance.
     * @param {Partial<Util.PlayerOptions>|Util.PlayerOptions} options The PlayerOptions object.
     */
    constructor(client, options = Util.PlayerOptions) {
        super();
        options = Util.deserializeOptionsPlayer(options);
        if (!client) throw new SyntaxError('[DMP] Invalid Discord Client');
        if (isNaN(options['timeout'])) throw new TypeError('[DMP] Timeout should be a Number presenting a value in milliseconds.');
        if (isNaN(options['volume'])) throw new TypeError('[DMP] Volume should be a Number presenting a value in percentage.');

        /**
         * Your Discord Client instance.
         * @type {Discord.Client}
         */
        this.client = client;
        /**
         * The guilds data.
         * @type {Discord.Collection}
         */
        this.queues = new Discord.Collection();
        /**
         * Player options.
         * @type {Util.PlayerOptions}
         */
        this.options = options;
        /**
         * ytsr
         * @type {Function || ytsr}
         */
        this.ytsr = ytsr;

        // Voice Updates Listener
        client.on('voiceStateUpdate',
            (oldState, newState)=>
                this._voiceUpdate(oldState, newState));
    }

    /**
     * Whether a guild is currently playing songs
     * @param {Discord.Message} message The Discord Message object.
     * @returns {Boolean} Whether the guild is currently playing songs
     */
    isPlaying(message) {
        return this.queues.has(message?.guild?.id);
    }

    /**
     * Plays a song in a voice channel.
     * @param {Discord.Message} message The Discord Message object.
     * @param {Partial<PlayOptions>} options Search options.
     * @returns {Promise<Song>|Null}
     */
    async play(message, options) {
        let _voiceState;
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue) {
            // Check for Voice Channel
            _voiceState = message.member.voice;
            if(!Util.isVoice(_voiceState))
            {
                this.emit('error', 'VoiceChannelTypeInvalid', message);
                return;
            }
        }

        options = Util.deserializeOptionsPlay(options);
        // Some last checks
        if (typeof options['search'] !== 'string' ||
            options['search'].length === 0)
        {
            this.emit('error', 'SongTypeInvalid', message);
            return;
        }

        try {
            let connection = queue ? queue.connection : null;
            let isFirstPlay = !!queue;
            if (!queue) {
                // Joins the voice channel if needed
                connection = await _voiceState.channel.join();
                if(this.options['deafenOnJoin'])
                    await connection.voice.setDeaf(true).catch(() => null);
                // Creates a new guild with data if needed
                queue = new Queue(_voiceState.guild.id, this.options, message);
                queue.connection = connection;
            }
            // Searches the song
            let song = await Util.best(options['search'], options, queue, options['requestedBy']);
            queue.songs.push(song);
            // Updates the queue
            if(!isFirstPlay)
                this.queues.set(_voiceState.guild.id, queue);

            this.emit('songAdd', queue.initMessage, queue, song);
            // Plays the song
            if (!isFirstPlay)
                await this._playSong(queue.guildID, !isFirstPlay);

            return song;
        }
        catch (err) {
            this.emit('error', err instanceof Error ? err.message : err, message);
        }
    }


    /**
     * Adds a song to the Guild Queue.
     * @deprecated Use play method instead.
     * @param {Discord.Message} message The Discord Message object.
     * @param {Partial<PlayOptions>} options Search options.
     * @returns {Promise<Song>|Null}
     */
    async addToQueue(message, options) {
        console.warn('[DMP] This function is deprecated and will be deleted in the future updates, use play() instead.');
        return this.play(message, options);
    }


    /**
     * Seeks the current playing song.
     * @param {Discord.Message} message The Discord Message object.
     * @param {Number} seek Seek (in milliseconds) time.
     * @returns {Promise<Song>|Null}
     */
    async seek(message, seek) {
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', 'QueueIsNull', message);
            return null;
        }
        if(isNaN(seek))
        {
            this.emit('error', 'NotANumber', message);
            return;
        }

        queue.songs[0].seekTime = seek;
        await this._playSong(message.guild.id, true, seek);

        return queue.songs[0];
    }


    /**
     * Adds a song to the Guild Queue.
     * @param {Discord.Message} message The Discord Message object.
     * @param {Partial<Util.PlayOptions>} options Search options.
     * @returns {Promise<Playlist>|Null}
     */
    async playlist(message, options) {
        let _voiceState;
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue) {
            // Check for Voice Channel
            _voiceState = message.member.voice;
            if(!Util.isVoice(_voiceState))
            {
                this.emit('error', 'VoiceChannelTypeInvalid', message);
                return;
            }
        }

        options = Util.deserializeOptionsPlaylist(options);
        // Some last checks
        if (typeof options['search'] !== 'string' ||
            options['search'].length === 0)
        {
            this.emit('error', 'SongTypeInvalid', message);
            return;
        }

        try {
            let connection = queue ? queue.connection : null;
            let isFirstPlay = !!queue;
            if (!queue) {
                // Joins the voice channel if needed
                connection = await _voiceState.channel.join();
                if(this.options['deafenOnJoin'])
                    await connection.voice.setDeaf(true).catch(() => null);
                // Creates a new guild with data if needed
                queue = new Queue(_voiceState.guild.id, this.options, message);
                queue.connection = connection;
            }
            // Searches the playlist
            let playlist = await Util.playlist(options['search'], queue, options['requestedBy'], options['maxSongs'], options['localAddress']);
            // Shuffles if shuffle option is true
            if (options['shuffle'])
                playlist.videos = Util.shuffle(playlist.videos);
            // Add all songs to the GuildQueue
            queue.songs = queue.songs.concat(playlist.videos);
            // Updates the queue
            if(!isFirstPlay)
                this.queues.set(_voiceState.guild.id, queue);
            /**
             * playlistAdd event.
             * @event Player#playlistAdd
             */
            this.emit('playlistAdd', queue.initMessage, queue, playlist);

            // Plays the song
            if (!isFirstPlay)
                await this._playSong(queue.guildID, !isFirstPlay);

            return playlist;
        }
        catch (err) {
            this.emit('error', err instanceof Error ? err.message : err, message);
        }
    }


    /**
     * Pauses the current playing song.
     * @param {Discord.Message} message The Discord Message object.
     * @returns {Song}
     */
    pause(message) {
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', 'QueueIsNull', message);
            return null;
        }
        // Pauses the dispatcher
        if(queue.dispatcher)
            queue.dispatcher.pause();
        queue.playing = false;
        // Resolves the guild queue
        return queue.songs[0];
    }

    /**
     * Resumes the current Song.
     * @param {Discord.Message} message The Discord Message object.
     * @returns {Song}
     */
    resume(message) {
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', 'QueueIsNull', message);
            return null;
        }
        // Resumes the dispatcher
        if(queue.dispatcher) {
            queue.dispatcher.resume();
            queue.dispatcher.pause();
            queue.dispatcher.resume();
        }
        queue.playing = true;
        // Resolves the guild queue
        return queue.songs[0];
    }

    /**
     * Stops playing music.
     * @param {Discord.Message} message The Discord Message object.
     * @returns {Boolean}
     */
    stop(message) {
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', 'QueueIsNull', message);
            return null;
        }

        // Stops the dispatcher
        queue.stopped = true;
        queue.songs = [];
        // Make sure dispatcher exists
        if(queue.dispatcher) queue.dispatcher.end();

        return true;
    }

    /**
     * Updates the volume.
     * @param {Discord.Message} message The Discord Message object.
     * @param {Number} percentage
     * @returns {Boolean}
     */
    setVolume(message, percentage) {
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', 'QueueIsNull', message);
            return null;
        }

        // Updates volume
        queue.volume = percentage;
        queue.dispatcher.setVolumeLogarithmic(percentage / 200);

        return true;
    }

    /**
     * Gets the volume.
     * @param {Discord.Message} message The Discord Message object.
     * @returns {Number}
     */
    getVolume(message) {
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', 'QueueIsNull', message);
            return null;
        }

        // Returns volume
        return queue.volume;
    }

    /**
     * Gets the guild queue.
     * @param {Discord.Message} message The Discord Message object.
     * @returns {?Queue}
     */
    getQueue(message) {
        // Gets & returns guild queue
        return this.queues.get(message.guild.id);
    }

    /**
     * Sets the queue for a guild.
     * @param {Discord.Message} message The Discord Message object.
     * @param {Song[]} songs Songs object
     * @returns {Queue}
     */
    setQueue(message, songs) {
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', 'QueueIsNull', message);
            return null;
        }
        // Updates queue
        queue.songs = songs;
        // Resolves the queue
        return queue;
    }

    /**
     * Clears the guild queue, but not the current song.
     * @param {Discord.Message} message The Discord Message object.
     * @returns {Boolean}
     */
    clearQueue(message) {
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', 'QueueIsNull', message);
            return null;
        }
        // Clears queue
        let currentlyPlaying = queue.songs.shift();
        queue.songs = [ currentlyPlaying ];

        return true;
    }

    /**
     * Skips a song.
     * @param {Discord.Message} message The Discord Message object.
     * @returns {Song}
     */
    skip(message) {
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', 'QueueIsNull', message);
            return null;
        }

        let currentSong = queue.songs[0];
        // Make sure dispatcher exists
        if(queue.dispatcher) queue.dispatcher.end();
        queue.skipped = true;
        // Resolves the current song
        return currentSong;
    }

    /**
     * Gets the currently playing song.
     * @param {Discord.Message} message The Discord Message object.
     * @returns {Song}
     */
    nowPlaying(message) {
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', 'QueueIsNull', message);
            return null;
        }

        // Resolves the current song
        return queue.songs[0];
    }

    /**
     * Enable or disable the repeat mode
     * @param {Discord.Message} message The Discord Message object.
     * @param {Boolean} enabled Whether the queue repeat mode should be enabled.
     * @returns {Boolean}
     */
    setQueueRepeatMode(message, enabled) {
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', 'QueueIsNull', message);
            return null;
        }

        // Enable/Disable repeat mode
        queue.repeatQueue = enabled;
        if(queue.repeatQueue)
            queue.repeatMode = false;

        return queue.repeatQueue;
    }

    /**
     * Enable or disable the Queue repeat loop
     * @param {Discord.Message} message The Discord Message object.
     * @param {Boolean} enabled Whether the repeat mode should be enabled.
     * @returns {Boolean}
     */
    setRepeatMode(message, enabled) {
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', 'QueueIsNull', message);
            return null;
        }

        // Enable/Disable repeat mode
        queue.repeatMode = enabled;
        if(queue.repeatMode)
            queue.repeatQueue = false;

        return queue.repeatMode;
    }


    /**
     * Toggle the repeat mode
     * @param {Discord.Message} message The Discord Message object.
     * @returns {Boolean} Returns the current set state
     * @returns {Boolean}
     */
    toggleLoop(message) {
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', 'QueueIsNull', message);
            return null;
        }

        // Enable/Disable repeat mode
        queue.repeatMode = !queue.repeatMode;
        if(queue.repeatMode)
            queue.repeatQueue = false;

        // Resolve
        return queue.repeatMode;
    }

    /**
     * Toggle the Queue repeat mode
     * @param {Discord.Message} message The Discord Message object.
     * @returns {Boolean} Returns the current set state
     */
    toggleQueueLoop(message) {
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', 'QueueIsNull', message);
            return null;
        }

        // Enable/Disable repeat mode
        queue.repeatQueue = !queue.repeatQueue;
        if(queue.repeatQueue)
            queue.repeatMode = false;

        // Resolve
        return queue.repeatQueue;
    }


    /**
     * Removes a song from the queue
     * @param {Discord.Message} message The Discord Message object.
     * @param {Number} index The index of the song to remove or the song to remove object.
     * @returns {?Song}
     */
    remove(message, index) {
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', 'QueueIsNull', message);
            return null;
        }

        // Remove the song from the queue
        let songFound = null;
        if (typeof index === "number") {
            songFound = queue.songs[index];
            if (songFound) {
                queue.songs = queue.songs.filter((s) => s !== songFound);
            }
        } else {
            this.emit('error', 'NotANumber', message);
            return null;
        }

        // Resolve
        return songFound;
    }

    /**
     * Shuffles the guild queue.
     * @param {Discord.Message} message The Discord Message object.
     * @returns {Song[]}
     */
    shuffle(message) {
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', 'QueueIsNull', message);
            return null;
        }

        let currentSong = queue.songs.shift();
        queue.songs = Util.shuffle(queue.songs);
        queue.songs.unshift(currentSong);

        return queue.songs;
    }


    /**
     * Creates a progress bar per current playing song.
     * @param {Discord.Message} message The Discord Message object.
     * @param {Partial<Util.ProgressOptions>} options Progressbar options.
     * @returns {String}
     */
    createProgressBar(message, options) {
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', 'QueueIsNull', message);
            return null;
        }

        let timePassed = queue.dispatcher.streamTime + queue.songs[0].seekTime;
        let timeEnd = Util.TimeToMilliseconds(queue.songs[0].duration);
        options = Util.deserializeOptionsProgress(options);

        return `${Util.buildBar(timePassed, timeEnd, options['size'], options['block'], options['arrow'])}`;
    }

    /**
     * Updates Queue Options
     * @param {Discord.Message} message The Discord Message object.
     * @param {Partial<Util.PlayerOptions>} options Player options.
     */
    updateQueueOptions(message, options= {}) {
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', 'QueueIsNull', message);
            return null;
        }

        queue.options = Object.assign({}, Util.PlayerOptions, options);
    }

    /**
     * Start playing songs in a guild.
     * @ignore
     * @param {Discord.Snowflake} guildID
     * @param {Boolean} firstPlay Whether this is the first playing song in the Queue.
     * @param {?Number} seek Seek time.
     */
    async _playSong(guildID, firstPlay, seek= null) {
        // Gets guild queue
        /**
         * @type {?Queue}
         */
        let queue = this.queues.get(guildID);
        // If there isn't any music in the queue
        if (queue.stopped || ((queue.songs.length < 2 && !firstPlay) && (!queue.repeatMode && !queue.repeatQueue))) {
            // Emits stop event
            if (queue.stopped) {
                // Removes the guild from the guilds list
                this.queues.delete(guildID);
                if (queue.options.leaveOnStop)
                    queue.connection.channel.leave();
                /**
                 * queueEnd event.
                 * @event Player#queueEnd
                 */
                return this.emit('queueEnd', queue.initMessage, queue);
            }
            // Emits end event
            this.emit('queueEnd', queue.initMessage, queue);
            if (queue.options.leaveOnEnd) {

                // Removes the guild from the guilds list
                this.queues.delete(guildID);
                // Timeout
                let connectionChannel = queue.connection.channel;
                setTimeout(() => {
                    queue = this.queues.get(guildID);
                    if (!queue || queue.songs.length < 1) {
                        return connectionChannel.leave();
                    }
                }, queue.options.timeout);
                return;
            }
            return;
        }
        // Add to the end if repeatQueue is enabled
        if(queue.repeatQueue && !seek) {
            if(queue.repeatMode) console.warn('[DMP] The song was not added at the end of the queue (repeatQueue was enabled) due repeatMode was enabled too.\n'
                + 'Please do not use repeatMode and repeatQueue together');
            else queue.songs.push(queue.songs[0]);
        }
        if (!firstPlay) {
            let _oldSong;
            if(!queue.repeatMode)
                _oldSong = queue.songs.shift();
            /**
             * songChanged event.
             * @event Player#songChanged
             */
            this.emit('songChanged', queue.initMessage, queue.songs[0], _oldSong);
        } else {
            /**
             * songFirst event.
             * @event Player#songFirst
             */
            this.emit('songFirst', queue.initMessage, queue.songs[0]);
        }

        queue.skipped = false;
        let thisHelper = this;
        let song = queue.songs[0];
        // Live Video is unsupported
        if(song.isLive) {
            thisHelper.emit('error', queue.initMessage, 'LiveUnsupported');
            queue.repeatMode = false;
            return thisHelper._playSong(guildID, false);
        }
        // Download the song
        let Quality = thisHelper.options.quality;
        Quality = Quality.toLowerCase() === 'low' ? 'lowestaudio' : 'highestaudio';

        const stream = ytdl(song.url, {
            filter: 'audioonly',
            quality: Quality,
            dlChunkSize: 0,
            highWaterMark: 1 << 25,
        }).on('error', err => {
            /**
             * error event.
             * @event Player#error
             */
            thisHelper.emit('error', err.message === 'Video unavailable' ? 'VideoUnavailable' : err.message, queue.initMessage);
            queue.repeatMode = false;
            return thisHelper._playSong(guildID, false);
        });

        setTimeout(() => {
            if (queue.dispatcher) queue.dispatcher.destroy();
            let dispatcher = queue.connection.play(stream, {
                seek: seek / 1000 || 0,
            });
            queue.dispatcher = dispatcher;
            // Set volume
            dispatcher.setVolumeLogarithmic(queue.volume / 200);
            // When the song ends
            dispatcher.on('finish', () => {
                // Play the next song
                return thisHelper._playSong(guildID, false);
            });
        }, 1000);
    }

    /**
     * Handle a VoiceUpdate
     * @private
     * @ignore
     * @param {Discord.VoiceState} oldState
     * @param {Discord.VoiceState} newState
     */
    _voiceUpdate(oldState, newState) {
        /**
         * Search for a queue for this channel
         * @type {?Queue}
         */
        let queue = this.queues.get(oldState.guild.id);
        if (queue) {
            if (!newState.channelID && this.client.user.id === oldState.member.id) {
                // Disconnect from the voice channel and destroy the stream
                if(queue?.stream) queue.stream.destroy();
                if(queue.connection.channel) queue.connection.channel.leave();
                // Delete the queue
                this.queues.delete(queue.guildID);

                /**
                 * clientDisconnect event.
                 * @event Player#clientDisconnect
                 */
                return this.emit('clientDisconnect', queue.initMessage, queue);
            } else if(queue.options.deafenOnJoin && oldState.serverDeaf && !newState.serverDeaf) {
                this.emit('clientUndeafen', queue.initMessage, queue);
            }
            // Handle same channels
            if (oldState.channelID === newState.channelID) return;
            // If the channel is not empty
            if (!queue.options.leaveOnEmpty || queue.connection.channel.members.size > 1) return;
            // Start timeout
            setTimeout(() => {
                // If the channel is not empty
                if (queue.connection.channel.members.size > 1) return;
                // Disconnect from the voice channel and destroy the stream
                if(queue?.stream) queue.stream.destroy();
                if(queue.connection.channel) queue.connection.channel.leave();
                // Delete the queue
                this.queues.delete(queue.guildID);

                /**
                 * channelEmpty event.
                 * @event Player#channelEmpty
                 */
                this.emit('channelEmpty', queue.initMessage, queue);
            }, this.options.timeout);
        }
    }

}

module.exports = Player;
