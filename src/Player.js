const ytdl = require('ytdl-core');
const mergeOptions = require('merge-options');
const ytsr = require('ytsr');
const { VoiceChannel, version } = require("discord.js");
const Discord = require("discord.js");
if (Number(version.split('.')[0]) < 12) throw new Error("Only the master branch of discord.js library is supported for now. Install it using 'npm install discordjs/discord.js'.");
const Queue = require('./Queue');
const Util = require('./Util');
const Playlist = require('./Playlist');
const MusicPlayerError = require('./MusicPlayerError');

/**
 * Player options.
 * @typedef {PlayerOptions}
 * 
 * @property {Boolean} leaveOnEnd Whether the bot should leave the current voice channel when the queue ends.
 * @property {Boolean} leaveOnStop Whether the bot should leave the current voice channel when the stop() function is used.
 * @property {Boolean} leaveOnEmpty Whether the bot should leave the voice channel if there is no more member in it.
 * @property {Number} timeout After how much time the bot should leave the voice channel after the OnEnd & OnEmpty events. | Default: 0
 * @property {Number} volume The default playing volume of the player. | Default: 100
 * @property {String} quality Music quality ['high'/'low'] | Default: high
 */
const PlayerOptions = {
    leaveOnEnd: true,
    leaveOnStop: true,
    leaveOnEmpty: true,
    timeout: 0,
    volume: 100,
    quality: 'high'
};

class Player {

    /**
     * @param {Client} client Your Discord Client instance.
     * @param {PlayerOptions} options The PlayerOptions object.
     */
    constructor(client, options = {}) {
        if (!client) throw new SyntaxError('[Discord_Client_Invalid] Invalid Discord Client');
        if (!options || typeof options != 'object') throw new SyntaxError('[Options is not an Object] The Player constructor was updated in v5.0.2, please use: new Player(client, { options }) instead of new Player(client, token, { options })');
        if (typeof options.timeout != 'undefined' && (isNaN(options.timeout) || !isFinite(options.timeout))) throw new TypeError('[TimeoutInvalidType] Timeout should be a Number presenting a value in milliseconds.');
        if (typeof options.volume != 'undefined' && (isNaN(options.volume) || !isFinite(options.volume))) throw new TypeError('[VolumeInvalidType] Volume should be a Number presenting a value in percentual.');

        /**
         * Your Discord Client instance.
         * @type {Client}
         */
        this.client = client;
        /**
         * The guilds data.
         * @type {Map<string,Queue>}
         */
        this.queues = new Map();
        /**
         * Player options.
         * @type {PlayerOptions}
         */
        this.options = mergeOptions(PlayerOptions, options);
        /**
         * ytsr
         * @type {Function || ytsr}
         */
        this.ytsr = ytsr;

        // Listener to check if the channel is empty
        client.on('voiceStateUpdate', (oldState, newState) => {
            if (!this.options.leaveOnEmpty) return;
            // If message leaves the current voice channel
            if (oldState.channelID === newState.channelID) return;
            // Search for a queue for this channel
            let queue = this.queues.get(oldState.guild.id);
            if (queue) {
                // If the channel is not empty
                if (queue.connection.channel.members.size > 1) return;
                // Start timeout

                setTimeout(() => {
                    // If the channel is not empty
                    if (queue.connection.channel.members.size > 1) return;
                    // Disconnect from the voice channel
                    queue.connection.channel.leave();
                    // Delete the queue
                    this.queues.delete(queue.guildID);
                    // Emit end event
                    queue.emit('channelEmpty');
                }, this.options.timeout);
            }
        });
    }

    /**
     * Whether a guild is currently playing songs
     * @param {String} guildID The guild ID to check
     * @returns {Boolean} Whether the guild is currently playing songs
     */
    isPlaying(guildID) {
        return this.queues.has(guildID);
    }

    /**
     * Plays a song in a voice channel.
     * @param {Discord.Message} message The Discord Message object.
     * @param {Util.PlayOptions} options Search options.
     * @returns {Promise<Song>}
     */
    async play(message, options) {
        // Check for Message
        if(!message instanceof Discord.Message)
            throw new MusicPlayerError('MessageTypeInvalid');
        // Check for Voice Channel
        let _voiceState = message.member.voice;
        if(!_voiceState instanceof Discord.VoiceState ||
            !_voiceState.channel instanceof Discord.VoiceChannel)
            throw new MusicPlayerError('VoiceChannelTypeInvalid');
        // Delete the queue if already exists
        this.queues.delete(message.guild.id);
        options = Util.deserializeOptions(options);
        // Some last checks
        if (typeof options['search'] !== 'string' ||
            options['search'].length === 0)
            throw new MusicPlayerError('SongTypeInvalid');

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
            // Plays the song
            await this._playSong(queue.guildID, true);

            return song;
        }
        catch (err) {
            throw new MusicPlayerError(err.message || err);
        }
    }


    /**
     * Adds a song to the Guild Queue.
     * @param {Discord.Message} message The Discord Message object.
     * @param {Util.PlayOptions} options Search options.
     * @returns {Promise<Song>}
     */
    async addToQueue(message, options) {
        // Check for Message
        if(!message instanceof Discord.Message)
            throw new MusicPlayerError('MessageTypeInvalid');
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
            throw new MusicPlayerError('QueueIsNull');
        options = Util.deserializeOptions(options);
        // Some last checks
        if (typeof options['search'] !== 'string' ||
            options['search'].length === 0)
            throw new MusicPlayerError('SongTypeInvalid');

        try {
            // Searches the song
            let song = await Util.getVideoBySearch(options['search'], options, queue, options['requestedBy']);
            // Updates the queue
            queue.songs.push(song);

            return song;
        }
        catch (err) {
            throw new MusicPlayerError(err.message || err);
        }
    }


    /**
     * Seeks the current playing song.
     * @param {Discord.Message} message The Discord Message object.
     * @param {Number} seek Seek (in milliseconds) time.
     * @returns {Promise<Song>}
     */
    async seek(message, seek) {
        // Check for Message
        if(!message instanceof Discord.Message)
            throw new MusicPlayerError('MessageTypeInvalid');
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
            throw new MusicPlayerError('QueueIsNull');
        if(isNaN(seek)) throw new MusicPlayerError('NotANumber');

        queue.songs[0].seekTime = seek;
        await this._playSong(message.guild.id, true, seek);

        return queue.songs[0];
    }



    /**
     * Adds a song to the Guild Queue.
     * @param {Discord.Message} message The Discord Message object.
     * @param {Util.PlaylistOptions} options Search options.
     * @returns {Promise<Playlist>}
     */
    async playlist(message, options) {
        let _voiceState;
        // Check for Message
        if(!message instanceof Discord.Message)
            throw new MusicPlayerError('MessageTypeInvalid');
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue) {
            // Check for Voice Channel
            _voiceState = message.member.voice;
            if(!_voiceState instanceof Discord.VoiceState ||
                !_voiceState.channel instanceof Discord.VoiceChannel)
                throw new MusicPlayerError('VoiceChannelTypeInvalid');
        }

        options = Util.deserializeOptionsPlaylist(options);
        // Some last checks
        if (typeof options['search'] !== 'string' ||
            options['search'].length === 0)
            throw new MusicPlayerError('SongTypeInvalid');

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
            // Plays the song

            if (!isFirstPlay)
                await this._playSong(queue.guildID, !isFirstPlay);

            return playlist;
        }
        catch (err) {
            throw new MusicPlayerError(err.message || err);
        }
    }


    /**
     * Pauses the current playing song.
     * @param {Discord.Message} message The Discord Message object.
     * @returns {Song}
     */
    pause(message) {
        // Check for Message
        if(!message instanceof Discord.Message)
            throw new MusicPlayerError('MessageTypeInvalid');
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
            throw new MusicPlayerError('QueueIsNull');
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
        if(!message instanceof Discord.Message)
            throw new MusicPlayerError('MessageTypeInvalid');
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
            throw new MusicPlayerError('QueueIsNull');
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
     */
    stop(message) {
        // Check for Message
        if(!message instanceof Discord.Message)
            throw new MusicPlayerError('MessageTypeInvalid');
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
            throw new MusicPlayerError('QueueIsNull');

        // Stops the dispatcher
        queue.stopped = true;
        queue.songs = [];
        // Make sure dispatcher exists
        if(queue.dispatcher) queue.dispatcher.end();
    }

    /**
     * Updates the volume.
     * @param {Discord.Message} message The Discord Message object.
     * @param {Number} percentage
     */
    setVolume(message, percentage) {
        // Check for Message
        if(!message instanceof Discord.Message)
            throw new MusicPlayerError('MessageTypeInvalid');
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
            throw new MusicPlayerError('QueueIsNull');

        // Updates volume
        queue.volume = percentage;
        queue.dispatcher.setVolumeLogarithmic(percentage / 200);
    }

    /**
     * Gets the volume.
     * @param {Discord.Message} message The Discord Message object.
     * @returns {Number}
     */
    getVolume(message) {
        // Check for Message
        if(!message instanceof Discord.Message)
            throw new MusicPlayerError('MessageTypeInvalid');
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
            throw new MusicPlayerError('QueueIsNull');

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
        if(!message instanceof Discord.Message)
            throw new MusicPlayerError('MessageTypeInvalid');
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
        if(!message instanceof Discord.Message)
            throw new MusicPlayerError('MessageTypeInvalid');
        // Gets guild queue
        let queue = this.queues.get(message.guild.id);
        if (!queue)
            throw new MusicPlayerError('QueueIsNull');
        // Updates queue
        queue.songs = songs;
        // Resolves the queue
        return queue;
    }

    /**
     * Clears the guild queue, but not the current song.
     * @param {string} guildID
     * @returns {Queue || MusicPlayerError}
     */
    clearQueue(guildID) {
        // Gets guild queue
        let queue = this.queues.get(guildID);
        if (!queue) return new MusicPlayerError('QueueIsNull');
        // Clears queue
        let currentlyPlaying = queue.songs.shift();
        queue.songs = [currentlyPlaying];
        // Resolves guild queue
        return queue;
    }

    /**
     * Skips a song.
     * @param {string} guildID
     * @returns {Song || MusicPlayerError}
     */
    skip(guildID) {
        // Gets guild queue
        let queue = this.queues.get(guildID);
        if (!queue) return new MusicPlayerError('QueueIsNull');
        let currentSong = queue.songs[0];
        // Make sure dispatcher exists
        if(queue.dispatcher) queue.dispatcher.end();
        queue.skipped = true;
        // Resolves the current song
        return currentSong;
    }

    /**
     * Gets the currently playing song.
     * @param {string} guildID
     * @returns {Song || MusicPlayerError}
     */
    nowPlaying(guildID) {
        // Gets guild queue
        let queue = this.queues.get(guildID);
        if (!queue) return new MusicPlayerError('QueueIsNull');
        // Resolves the current song

        return queue.songs[0];
    }

    /**
     * Enable or disable the repeat mode
     * @param {string} guildID
     * @param {boolean} enabled Whether the repeat mode should be enabled
     */
    setQueueRepeatMode(guildID, enabled) {
        // Gets guild queue
        let queue = this.queues.get(guildID);
        if (!queue) return new MusicPlayerError('QueueIsNull');
        // Enable/Disable repeat mode
        queue.repeatQueue = enabled;
        if(queue.repeatQueue === true) queue.repeatMode = false;
    }

    /**
     * Enable or disable the Queue repeat loop
     * @param {string} guildID
     * @param {boolean} enabled Whether the repeat mode should be enabled
     */
    setRepeatMode(guildID, enabled) {
        // Gets guild queue
        let queue = this.queues.get(guildID);
        if (!queue) return new MusicPlayerError('QueueIsNull');
        // Enable/Disable repeat mode
        queue.repeatMode = enabled;
        if(queue.repeatMode === true) queue.repeatQueue = false;
    }


    /**
     * Toggle the repeat mode
     * @param {string} guildID
     * @returns {boolean || MusicPlayerError} Returns the current set state
     */
    toggleLoop(guildID) {
        // Gets guild queue
        let queue = this.queues.get(guildID);
        if (!queue) return new MusicPlayerError('QueueIsNull');
        // Enable/Disable repeat mode
        queue.repeatMode = !queue.repeatMode;
        if(queue.repeatMode === true) queue.repeatQueue = false;
        // Resolve
        return queue.repeatMode;
    }

    /**
     * Toggle the Queue repeat mode
     * @param {string} guildID
     * @returns {boolean || MusicPlayerError} Returns the current set state
     */
    toggleQueueLoop(guildID) {
        // Gets guild queue
        let queue = this.queues.get(guildID);
        if (!queue) return new MusicPlayerError('QueueIsNull');
        // Enable/Disable repeat mode
        queue.repeatQueue = !queue.repeatQueue;
        if(queue.repeatQueue === true) queue.repeatMode = false;
        // Resolve
        return queue.repeatQueue;
    }


    /**
     * Removes a song from the queue
     * @param {string} guildID 
     * @param {number} song The index of the song to remove or the song to remove object.
     * @returns {Song|MusicPlayerError}
     */
    remove(guildID, song) {
        // Gets guild queue
        let queue = this.queues.get(guildID);
        if (!queue) return new MusicPlayerError('QueueIsNull');
        // Remove the song from the queue
        let songFound = null;
        if (typeof song === "number") {
            songFound = queue.songs[song];
            if (songFound) {
                queue.songs = queue.songs.filter((s) => s !== songFound);
            }
        } else return new MusicPlayerError('NotANumber');
        // Resolve
        return songFound;
    }

    /**
     * Shuffles the guild queue.
     * @param {string} guildID 
     * @returns {Song[]}
     */
    shuffle(guildID) {
        // Gets guild queue
        let queue = this.queues.get(guildID);
        if (!queue) return new MusicPlayerError('QueueIsNull');

        let currentSong = queue.songs.shift();
        queue.songs = queue.songs.sort(() => Math.random() - 0.5);
        queue.songs.unshift(currentSong);

        return queue.songs;
    }


    /**
    * Creates a progress bar per current playing song.
    * @param {String} guildID Guild ID
    * @param {String} barSize Bar Size
    * @param {String} arrowIcon Arrow Icon
    * @param {String} loadedIcon Loaded Icon
    * @returns {String}
    */
    createProgressBar(guildID, barSize = 20, arrowIcon = '>', loadedIcon = '=') {
        let queue = this.queues.get(guildID);
        if (!queue) return new MusicPlayerError('QueueIsNull');

        let timePassed = queue.dispatcher.streamTime + queue.songs[0].seekTime;
        let timeEnd = Util.TimeToMilliseconds(queue.songs[0].duration);

        return `${Util.buildBar(timePassed, timeEnd, barSize, loadedIcon, arrowIcon)}`;
    }

    /**
     * Start playing songs in a guild.
     * @ignore
     * @param {string} guildID
     * @param {Boolean} firstPlay Whether the function was called from the play() one
     * @param {Number || null} seek Seek the song.
     */
    async _playSong(guildID, firstPlay, seek= null) {
        // Gets guild queue
        let queue = this.queues.get(guildID);
        // If there isn't any music in the queue
        if (queue.songs.length < 2 && !firstPlay && !queue.repeatMode && !queue.repeatQueue) {
            // Emits stop event
            if (queue.stopped) {
                // Remoces the guild from the guilds list
                this.queues.delete(guildID);

                if (this.options.leaveOnStop)
                    queue.connection.channel.leave();
                // Emits the stop event
                return queue.emit('stop');
            }
            // Emits end event
            if (this.options.leaveOnEnd) {
                // Emits the end event
                queue.emit('end');
                // Remoces the guild from the guilds list
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
        // Emit songChanged event
        if (!firstPlay) queue.emit('songChanged', (!queue.repeatMode ? queue.songs.shift() : queue.songs[0]), queue.songs[0], queue.skipped, queue.repeatMode, queue.repeatQueue);
        queue.skipped = false;
        let song = queue.songs[0];
        // Download the song
        let Quality = this.options.quality;
        Quality = Quality.toLowerCase() === 'low' ? 'lowestaudio' : 'highestaudio';

        const stream = ytdl(song.url, {
            filter: 'audioonly',
            quality: Quality,
            dlChunkSize: 0,
            highWaterMark: 1 << 25,
        }).on('error', err => {
            queue.emit('songError', (err.message === 'Video unavailable' ? 'VideoUnavailable' : err.message), queue.songs[0]);
            queue.repeatMode = false;
            return this._playSong(guildID, false);
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
                return this._playSong(guildID, false);
            });
        }, 1000);

    }

};

module.exports = Player;
