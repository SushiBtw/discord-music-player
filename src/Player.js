const { EventEmitter } = require('events');
const ytdl = require('ytdl-core');
const mergeOptions = require('merge-options');
const ytsr = require('ytsr');
const Discord = require("discord.js");
if (Number(Discord.version.split('.')[0]) < 12) throw new Error("Only the master branch of discord.js library is supported for now. Install it using 'npm install discordjs/discord.js'.");
const Queue = require('./Queue');
const Util = require('./Util');
const Playlist = require('./Playlist');
const MusicPlayerError = require('./MusicPlayerError');

class Player extends EventEmitter {

    /**
     * @param {Discord.Client} client Your Discord Client instance.
     * @param {Util.PlayerOptions|Partial<Util.PlayerOptions>} options The PlayerOptions object.
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
         * @type {Map<string,Queue>}
         */
        this.queues = new Map();
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
        return this.queues.has(message ? message.guild ? message.guild.id : null : null);
    }

    /**
     * Plays a song in a voice channel.
     * @param {Discord.Message} message The Discord Message object.
     * @param {Util.PlayOptions} options Search options.
     * @returns {Promise<Song>|Null}
     */
    async play(message, options) {
        // Check for Message
        if(!Util.isMessage(message))
        {
            this.emit('error', message, 'MessageTypeInvalid');
            return;
        }
        // Check for Voice Channel
        let _voiceState = message.member.voice;
        if(!Util.isVoice(_voiceState))
        {
            this.emit('error', message, 'VoiceChannelTypeInvalid');
            return;
        }
        // Delete the queue if already exists
        this.queues.delete(message.guild.id);
        options = Util.deserializeOptionsPlay(options);
        // Some last checks
        if (typeof options['search'] !== 'string' ||
            options['search'].length === 0)
        {
            this.emit('error', message, 'SongTypeInvalid');
            return;
        }

        try {
            // Creates a new guild with data
            let queue = new Queue(_voiceState.guild.id, this.options, message);
            // Searches the song
            let song = await Util.getVideoBySearch(options['search'], options, queue, options['requestedBy']);
            // Joins the voice channel
            queue.connection = await _voiceState.channel.join();
            queue.songs.push(song);
            // Add the queue to the list
            this.queues.set(_voiceState.guild.id, queue);
            /**
             * songAdd event.
             * @event Player#songAdd
             * @type {Object}
             * @property {Discord.Message} initMessage
             * @property {Queue} queue
             * @property {Song} song
             */
            this.emit('songAdd', queue.initMessage, queue, song);
            // Plays the song
            await this._playSong(queue.guildID, true);

            return song;
        }
        catch (err) {
            this.emit('error', message, err.message || err);
        }
    }


    /**
     * Adds a song to the Guild Queue.
     * @param {Discord.Message} message The Discord Message object.
     * @param {Util.PlayOptions} options Search options.
     * @returns {Promise<Song>|Null}
     */
    async addToQueue(message, options) {
        // Check for Message
        if(!Util.isMessage(message))
        {
            this.emit('error', message, 'MessageTypeInvalid');
            return;
        }
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', message, 'QueueIsNull');
            return null;
        }
        options = Util.deserializeOptionsPlay(options);
        // Some last checks
        if (typeof options['search'] !== 'string' ||
            options['search'].length === 0)
        {
            this.emit('error', message, 'SongTypeInvalid');
            return;
        }
        let index = options['index'];
        if (index !== null && typeof index !== 'number')
            index = null;

        try {
            // Searches the song
            let song = await Util.getVideoBySearch(options['search'], options, queue, options['requestedBy']);
            // Updates the queue
            if(!index)
                queue.songs.push(song);
            else queue.songs.splice(index, 0, song);
            /**
             * songAdd event.
             * @event Player#songAdd
             * @param {Discord.Message} queue.initMessage
             * @param {Queue} queue
             * @param {Song} song
             */
            this.emit('songAdd', queue.initMessage, queue, song);

            return song;
        }
        catch (err) {
            this.emit('error', message, err.message || err);
        }
    }


    /**
     * Seeks the current playing song.
     * @param {Discord.Message} message The Discord Message object.
     * @param {Number} seek Seek (in milliseconds) time.
     * @returns {Promise<Song>|Null}
     */
    async seek(message, seek) {
        // Check for Message
        if(!Util.isMessage(message))
        {
            this.emit('error', message, 'MessageTypeInvalid');
            return;
        }
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', message, 'QueueIsNull');
            return null;
        }
        if(isNaN(seek))
        {
            this.emit('error', message, 'NotANumber');
            return;
        }

        queue.songs[0].seekTime = seek;
        await this._playSong(message.guild.id, true, seek);

        return queue.songs[0];
    }



    /**
     * Adds a song to the Guild Queue.
     * @param {Discord.Message} message The Discord Message object.
     * @param {Util.PlaylistOptions} options Search options.
     * @returns {Promise<Playlist>|Null}
     */
    async playlist(message, options) {
        let _voiceState;
        // Check for Message
        if(!Util.isMessage(message))
        {
            this.emit('error', message, 'MessageTypeInvalid');
            return;
        }
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue) {
            // Check for Voice Channel
            _voiceState = message.member.voice;
            if(!Util.isVoice(_voiceState))
            {
                this.emit('error', message, 'VoiceChannelTypeInvalid');
                return;
            }
        }

        options = Util.deserializeOptionsPlaylist(options);
        // Some last checks
        if (typeof options['search'] !== 'string' ||
            options['search'].length === 0)
        {
            this.emit('error', message, 'SongTypeInvalid');
            return;
        }

        try {
            let connection = queue ? queue.connection : null;
            let isFirstPlay = !!queue;
            if (!queue) {
                // Joins the voice channel if needed
                connection = await _voiceState.channel.join();
                // Creates a new guild with data if needed
                queue = new Queue(_voiceState.guild.id, this.options, message);
                queue.connection = connection;
            }
            // Searches the playlist
            let playlist = await Util.getVideoFromPlaylist(options['search'], options['maxSongs'], queue, options['requestedBy']);
            // Add all songs to the GuildQueue
            queue.songs = queue.songs.concat(playlist.videos);
            // Updates the queue
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
            this.emit('error', message, err.message || err);
        }
    }


    /**
     * Pauses the current playing song.
     * @param {Discord.Message} message The Discord Message object.
     * @returns {Song}
     */
    pause(message) {
        // Check for Message
        if(!Util.isMessage(message))
        {
            this.emit('error', message, 'MessageTypeInvalid');
            return null;
        }
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', message, 'QueueIsNull');
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
        // Check for Message
        if(!Util.isMessage(message))
        {
            this.emit('error', message, 'MessageTypeInvalid');
            return null;
        }
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', message, 'QueueIsNull');
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
        // Check for Message
        if(!Util.isMessage(message))
        {
            this.emit('error', message, 'MessageTypeInvalid');
            return null;
        }
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', message, 'QueueIsNull');
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
        // Check for Message
        if(!Util.isMessage(message))
        {
            this.emit('error', message, 'MessageTypeInvalid');
            return null;
        }
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', message, 'QueueIsNull');
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
        // Check for Message
        if(!Util.isMessage(message))
        {
            this.emit('error', message, 'MessageTypeInvalid');
            return null;
        }
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', message, 'QueueIsNull');
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
        // Check for Message
        if(!Util.isMessage(message))
        {
            this.emit('error', message, 'MessageTypeInvalid');
            return null;
        }
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
        // Check for Message
        if(!Util.isMessage(message))
        {
            this.emit('error', message, 'MessageTypeInvalid');
            return null;
        }
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', message, 'QueueIsNull');
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
        // Check for Message
        if(!Util.isMessage(message))
        {
            this.emit('error', message, 'MessageTypeInvalid');
            return null;
        }
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', message, 'QueueIsNull');
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
        // Check for Message
        if(!Util.isMessage(message))
        {
            this.emit('error', message, 'MessageTypeInvalid');
            return null;
        }
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', message, 'QueueIsNull');
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
        // Check for Message
        if(!Util.isMessage(message))
        {
            this.emit('error', message, 'MessageTypeInvalid');
            return null;
        }
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', message, 'QueueIsNull');
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
        // Check for Message
        if(!Util.isMessage(message))
        {
            this.emit('error', message, 'MessageTypeInvalid');
            return null;
        }
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', message, 'QueueIsNull');
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
        // Check for Message
        if(!Util.isMessage(message))
        {
            this.emit('error', message, 'MessageTypeInvalid');
            return null;
        }
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', message, 'QueueIsNull');
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
        // Check for Message
        if(!Util.isMessage(message))
        {
            this.emit('error', message, 'MessageTypeInvalid');
            return null;
        }
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', message, 'QueueIsNull');
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
        // Check for Message
        if(!Util.isMessage(message))
        {
            this.emit('error', message, 'MessageTypeInvalid');
            return null;
        }
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', message, 'QueueIsNull');
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
        // Check for Message
        if(!Util.isMessage(message))
        {
            this.emit('error', message, 'MessageTypeInvalid');
            return null;
        }
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', message, 'QueueIsNull');
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
            this.emit('error', message, 'NotANumber');
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
        // Check for Message
        if(!Util.isMessage(message))
        {
            this.emit('error', message, 'MessageTypeInvalid');
            return null;
        }
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', message, 'QueueIsNull');
            return null;
        }

        let currentSong = queue.songs.shift();
        queue.songs = queue.songs.sort(() => Math.random() - 0.5);
        queue.songs.unshift(currentSong);

        return queue.songs;
    }


    /**
     * Creates a progress bar per current playing song.
     * @param {Discord.Message} message The Discord Message object.
     * @param {Util.ProgressOptions} options Progressbar options.
     * @returns {String}
     */
    createProgressBar(message, options) {
        // Check for Message
        if(!Util.isMessage(message))
        {
            this.emit('error', message, 'MessageTypeInvalid');
            return null;
        }
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
        {
            this.emit('error', message, 'QueueIsNull');
            return null;
        }

        let timePassed = queue.dispatcher.streamTime + queue.songs[0].seekTime;
        let timeEnd = Util.TimeToMilliseconds(queue.songs[0].duration);
        options = Util.deserializeOptionsProgress(options);

        return `${Util.buildBar(timePassed, timeEnd, options['size'], options['block'], options['arrow'])}`;
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
        let queue = this.queues.get(guildID);
        // If there isn't any music in the queue
        if (queue.stopped || queue.songs.length < 2 && !firstPlay && !queue.repeatMode && !queue.repeatQueue) {
            // Emits stop event
            if (queue.stopped) {
                // Removes the guild from the guilds list
                this.queues.delete(guildID);

                if (this.options.leaveOnStop)
                    queue.connection.channel.leave();
                /**
                 * queueEnd event.
                 * @event Player#queueEnd
                 */
                return this.emit('queueEnd', queue.initMessage, queue);
            }
            // Emits end event
            if (this.options.leaveOnEnd) {
                /**
                 * queueEnd event.
                 * @event Player#queueEnd
                 */
                this.emit('queueEnd', queue.initMessage, queue);

                // Removes the guild from the guilds list
                this.queues.delete(guildID);
                // Timeout
                let connectionChannel = queue.connection.channel;
                setTimeout(() => {
                    queue = this.queues.get(guildID);
                    if (!queue || queue.songs.length < 1) {
                        return connectionChannel.leave();
                    }
                }, this.options.timeout);
                return;
            }
        }
        // Add to the end if repeatQueue is enabled
        if(queue.repeatQueue && !seek) {
            if(queue.repeatMode) console.warn('[DMP] The song was not added at the end of the queue (repeatQueue was enabled) due repeatMode was enabled too.\n'
                + 'Please do not use repeatMode and repeatQueue together');
            else queue.songs.push(queue.songs[0]);
        }

        if (!firstPlay) {
            if(!queue.repeatMode) queue.songs.shift();
            /**
             * songChanged event.
             * @event Player#songChanged
             */
            this.emit('songChanged', queue.initMessage, queue.songs[0]);
        } else {
            /**
             * songFirst event.
             * @event Player#songFirst
             */
            this.emit('songFirst', queue.initMessage, queue.songs[0]);
        }

        queue.skipped = false;
        let thisHelper = this;
        setTimeout(function () {
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
                thisHelper.emit('error', queue.initMessage, err.message === 'Video unavailable' ? 'VideoUnavailable' : err.message);
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

        }, 0);

    }

    /**
     * Handle a VoiceUpdate
     * @ignore
     * @param {Discord.VoiceState} oldState
     * @param {Discord.VoiceState} newState
     */
    _voiceUpdate(oldState, newState) {
        if (!this.options.leaveOnEmpty) return;
        // If message leaves the current voice channel
        if (oldState.channelID === newState.channelID) return;
        // Search for a queue for this channel
        let queue = this.queues.get(oldState.guild.id);
        if (queue) {
            //
            if (!newState.channelID && this.client.user.id === newState.member.id) {
                // Disconnect from the voice channel and destroy the stream
                if(queue.stream) queue.stream.destroy();
                if(queue.connection.channel) queue.connection.channel.leave();
                // Delete the queue
                this.queues.delete(queue.guildID);

                /**
                 * clientDisconnect event.
                 * @event Player#clientDisconnect
                 */
                return this.emit('clientDisconnect', queue.initMessage, queue);
            }
            // If the channel is not empty
            if (queue.connection.channel.members.size > 1) return;
            // Start timeout

            setTimeout(() => {
                // If the channel is not empty
                if (queue.connection.channel.members.size > 1) return;
                // Disconnect from the voice channel and destroy the stream
                if(queue.stream) queue.stream.destroy();
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
