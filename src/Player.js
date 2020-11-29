const ytdl = require('ytdl-core');
const mergeOptions = require('merge-options');
const ytsr = require('./node-ytsr-wip/main');
const { VoiceChannel, version } = require("discord.js");
if (version.split('.')[0] !== '12') throw new Error("Only the master branch of discord.js library is supported for now. Install it using 'npm install discordjs/discord.js'.");
const Queue = require('./Queue');
const Util = require('./Util');
const Song = require('./Song');
const MusicPlayerError = require('./MusicPlayerError');

/**
 * Player options.
 * @typedef {PlayerOptions}
 * 
 * @property {Boolean} leaveOnEnd Whether the bot should leave the current voice channel when the queue ends.
 * @property {Boolean} leaveOnStop Whether the bot should leave the current voice channel when the stop() function is used.
 * @property {Boolean} leaveOnEmpty Whether the bot should leave the voice channel if there is no more member in it.
 * @property {string} quality Music quality ['high'/'low'] | Default: high
 */
const PlayerOptions = {
    leaveOnEnd: true,
    leaveOnStop: true,
    leaveOnEmpty: true,
    quality: 'high'
};

class Player {

    /**
     * @param {Client} client Your Discord Client instance.
     * @param {PlayerOptions} options The PlayerOptions object.
     */
    constructor(client, options = {}) {
        if (!client) throw new SyntaxError('[Discord_Client_Invalid] Invalid Discord Client');
        if (typeof options != 'object') throw new SyntaxError('[Options is not an Object] The Player constructor was updated in v5.0.2, please use: new Player(client, { options }) instead of new Player(client, token, { options })');
        /**
         * Your Discord Client instance.
         * @type {Client}
         */
        this.client = client;
        /**
         * The guilds data.
         * @type {Queue[]}
         */
        this.queues = [];
        /**
         * Player options.
         * @type {PlayerOptions}
         */
        this.options = mergeOptions(PlayerOptions, options);
        /**
         * ytsr
         * @type {ytsr}
         */
        this.ytsr = ytsr;

        // Listener to check if the channel is empty
        client.on('voiceStateUpdate', (oldState, newState) => {
            if (!this.options.leaveOnEmpty) return;
            // If the member leaves a voice channel
            if (!oldState.channelID || newState.channelID) return;
            // Search for a queue for this channel
            let queue = this.queues.find((g) => g.connection.channel.id === oldState.channelID);
            if (queue) {
                // If the channel is not empty
                if (queue.connection.channel.members.size > 1) return;
                // Disconnect from the voice channel
                queue.connection.channel.leave();
                // Delete the queue
                this.queues = this.queues.filter((g) => g.guildID !== queue.guildID);
                // Emit end event
                queue.emit('channelEmpty');
            }
        });
    }

    /**
     * Whether a guild is currently playing songs
     * @param {string} guildID The guild ID to check
     * @returns {Boolean} Whether the guild is currently playing songs
     */
    isPlaying(guildID) {
        return this.queues.some((g) => g.guildID === guildID);
    }

    /**
     * Plays a song in a voice channel.
     * @param {voiceChannel} voiceChannel The voice channel in which the song will be played.
     * @param {string} songName The name of the song to play.
     * @param {object} options Search options.
     * @param {User} requestedBy The user who requested the song.
     * @returns {Promise<Song>}
     */
    async play(voiceChannel, songName, options = {}, requestedBy) {
        this.queues = this.queues.filter((g) => g.guildID !== voiceChannel.id);

        if (!voiceChannel || typeof voiceChannel !== 'object') return new MusicPlayerError('VoiceChannelTypeInvalid', 'song');
        if (typeof songName !== 'string') return new MusicPlayerError('SongTypeInvalid', 'song');
        if (typeof options != 'object') return new MusicPlayerError('OptionsTypeInvalid', 'song');
        try {
            // Searches the song
            let video = await Util.getVideoBySearch(songName, ytsr, options);
            // Joins the voice channel
            let connection = await voiceChannel.join();
            // Creates a new guild with data
            let queue = new Queue(voiceChannel.guild.id);
            queue.connection = connection;
            let song = new Song(video, queue, requestedBy);
            queue.songs.push(song);
            // Add the queue to the list
            this.queues.push(queue);
            // Plays the song
            this._playSong(queue.guildID, true);

            return { error: null, song: song };
        }
        catch (err) {
            return new MusicPlayerError('SearchIsNull', 'song');
        }
    }

    /**
     * Pauses the current song.
     * @param {string} guildID
     * @returns {Song}
     */
    pause(guildID) {
        // Gets guild queue
        let queue = this.queues.find((g) => g.guildID === guildID);
        if (!queue) return new MusicPlayerError('QueueIsNull');
        // Pauses the dispatcher
        queue.dispatcher.pause();
        queue.playing = false;
        // Resolves the guild queue
        return queue.songs[0];
    }

    /**
     * Resumes the current song.
     * @param {string} guildID
     * @returns {Song}
     */
    resume(guildID) {
        // Gets guild queue
        let queue = this.queues.find((g) => g.guildID === guildID);
        if (!queue) return new MusicPlayerError('QueueIsNull');
        // Pauses the dispatcher
        queue.dispatcher.resume();
        queue.playing = true;
        // Resolves the guild queue
        return queue.songs[0];
    }

    /**
     * Stops playing music.
     * @param {string} guildID
     * @returns {Void}
     */
    stop(guildID) {
        // Gets guild queue
        let queue = this.queues.find((g) => g.guildID === guildID);
        if (!queue) return new MusicPlayerError('QueueIsNull');
        // Stops the dispatcher
        queue.stopped = true;
        queue.songs = [];
        queue.dispatcher.end();
        // Resolves
        return;
    }

    /**
     * Updates the volume.
     * @param {string} guildID 
     * @param {number} percent 
     * @returns {Void}
     */
    setVolume(guildID, percent) {
        // Gets guild queue
        let queue = this.queues.find((g) => g.guildID === guildID);
        if (!queue) return new MusicPlayerError('QueueIsNull');
        // Updates volume
        queue.dispatcher.setVolumeLogarithmic(percent / 200);
        // Resolves guild queue
        return;
    }

    /**
     * Gets the guild queue.
     * @param {string} guildID
     * @returns {?Queue}
     */
    getQueue(guildID) {
        // Gets guild queue
        let queue = this.queues.find((g) => g.guildID === guildID);
        return queue;
    }

    /**
     * Adds a song to the guild queue.
     * @param {string} guildID
     * @param {string} songName The name of the song to add to the queue.
     * @param {User} requestedBy The user who requested the song.
     * @returns {Promise<Song>}
     */
    async addToQueue(guildID, songName, options = {}, requestedBy) {
        // Gets guild queue
        let queue = this.queues.find((g) => g.guildID === guildID);
        if (!queue) return new MusicPlayerError('QueueIsNull', 'song');

        if (typeof songName !== 'string') throw new MusicPlayerError('SongTypeInvalid', 'song');
        if (typeof options != 'object') throw new MusicPlayerError('OptionsTypeInvalid', 'song');
        try {
            // Searches the song
            let video = await Util.getVideoBySearch(songName, ytsr, options);
            // Define the song
            let song = new Song(video, queue, requestedBy);
            // Updates queue
            queue.songs.push(song);
            // Resolves the song
            return { error: null, song: song };
        }
        catch (err) {

            return new MusicPlayerError('SearchIsNull', 'song');
        };
    }

    /**
     * Sets the queue for a guild.
     * @param {string} guildID
     * @param {Array<Song>} songs The songs list
     * @returns {Queue}
     */
    setQueue(guildID, songs) {
        // Gets guild queue
        let queue = this.queues.find((g) => g.guildID === guildID);
        if (!queue) return new MusicPlayerError('QueueIsNull');
        // Updates queue
        queue.songs = songs;
        // Resolves the queue
        return queue.songs;
    }

    /**
     * Clears the guild queue, but not the current song.
     * @param {string} guildID
     * @returns {Queue}
     */
    clearQueue(guildID) {
        // Gets guild queue
        let queue = this.queues.find((g) => g.guildID === guildID);
        if (!queue) return new MusicPlayerError('QueueIsNull');
        // Clears queue
        let currentlyPlaying = queue.songs.shift();
        queue.songs = [currentlyPlaying];
        // Resolves guild queue
        return queue.songs;
    }

    /**
     * Skips a song.
     * @param {string} guildID
     * @returns {Song}
     */
    skip(guildID) {
        // Gets guild queue
        let queue = this.queues.find((g) => g.guildID === guildID);
        if (!queue) return new MusicPlayerError('QueueIsNull');
        let currentSong = queue.songs[0];
        // Ends the dispatcher
        queue.dispatcher.end();
        queue.skipped = true;
        // Resolves the current song
        return currentSong;
    }

    /**
     * Gets the currently playing song.
     * @param {string} guildID
     * @returns {Song}
     */
    nowPlaying(guildID) {
        // Gets guild queue
        let queue = this.queues.find((g) => g.guildID === guildID);
        if (!queue) return new MusicPlayerError('QueueIsNull');
        let currentSong = queue.songs[0];
        // Resolves the current song

        return currentSong;
    }

    /**
     * Enable or disable the repeat mode
     * @param {string} guildID
     * @param {Boolean} enabled Whether the repeat mode should be enabled
     * @returns {Void}
     */
    setRepeatMode(guildID, enabled) {
        // Gets guild queue
        let queue = this.queues.find((g) => g.guildID === guildID);
        if (!queue) return new MusicPlayerError('QueueIsNull');
        // Enable/Disable repeat mode
        queue.repeatMode = enabled;
        // Resolve
        return;
    }

    /**
     * Removes a song from the queue
     * @param {string} guildID 
     * @param {number} song The index of the song to remove or the song to remove object.
     * @returns {Song|MusicPlayerError}
     */
    remove(guildID, song) {
        // Gets guild queue
        let queue = this.queues.find((g) => g.guildID === guildID);
        if (!queue) return new MusicPlayerError('QueueIsNull');
        // Remove the song from the queue
        let songFound = null;
        if (typeof song === "number") {
            songFound = queue.songs[song];
            if (songFound) {
                queue.songs = queue.songs.filter((s) => s !== songFound);
            }
        } return new MusicPlayerError('NotANumber');
        // Resolve
        return songFound;
    }

    /**
     * Shuffles the guild queue.
     * @param {string} guildID 
     * @returns {Songs}
     */
    shuffle(guildID) {
        // Gets guild queue
        let queue = this.queues.find((g) => g.guildID === guildID);
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
        let queue = this.queues.find((g) => g.guildID === guildID);
        if (!queue) return new MusicPlayerError('QueueIsNull');

        let timePassed = queue.dispatcher.streamTime;
        let timeEnd = Util.TimeToMiliseconds(queue.songs[0].duration);

        return `${Util.buildBar(timePassed, timeEnd, barSize, loadedIcon, arrowIcon)}`;
    }

    /**
     * Start playing songs in a guild.
     * @ignore
     * @param {string} guildID
     * @param {Boolean} firstPlay Whether the function was called from the play() one
     */
    async _playSong(guildID, firstPlay) {
        // Gets guild queue
        let queue = this.queues.find((g) => g.guildID === guildID);
        // If there isn't any music in the queue
        if (queue.songs.length < 2 && !firstPlay && !queue.repeatMode) {
            // Leaves the voice channel
            if (this.options.leaveOnEnd && !queue.stopped) queue.connection.channel.leave();
            // Remoces the guild from the guilds list
            this.queues = this.queues.filter((g) => g.guildID !== guildID);
            // Emits stop event
            if (queue.stopped) {
                if (this.options.leaveOnStop) queue.connection.channel.leave();
                return queue.emit('stop');
            }
            // Emits end event 
            return queue.emit('end');
        }
        // Emit songChanged event
        if (!firstPlay) queue.emit('songChanged', (!queue.repeatMode ? queue.songs.shift() : queue.songs[0]), queue.songs[0], queue.skipped, queue.repeatMode);
        queue.skipped = false;
        let song = queue.songs[0];
        // Download the song

        let Quality = this.options.quality;
        Quality = Quality.toLowerCase() == 'low' ? 'lowestaudio' : 'highestaudio';

        let dispatcher = queue.connection.play(ytdl(song.url, { filter: 'audioonly', quality: Quality, highWaterMark: 1 << 25 }));
        queue.dispatcher = dispatcher;
        // Set volume
        dispatcher.setVolumeLogarithmic(queue.volume / 200);
        // When the song ends
        dispatcher.on('finish', () => {
            // Play the next song
            return this._playSong(guildID, false);
        });
    }

};

module.exports = Player;