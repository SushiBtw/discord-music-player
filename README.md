
# Discord Music Player

**Note**: this module uses recent discordjs features and requires discord.js version 12.

Discord Player is a powerful [Node.js](https://nodejs.org) module that allows you to easily implement music commands. **Everything** is customizable, and everything is done to simplify your work **without limiting you**!
*This package was made by **Androz2091** and rewritten by **SushiBtw** using the MIT License Rules.*

## **DMP v6.3.0 Update:**
- [x] **Fix YouTube issues with Vevo Music**,
- [x] **Add ``playlist`` method** - [Read More](#playlist),
- [x] **Add ``toggleLoop(GuildID)`` method** - [Read More](#toggle-loop),
- [x] **Bump NodeJS version to v14** - [READ MORE](https://github.com/discordjs/discord.js/pull/5067),
- [x] **Add ``timeout: int`` option [leaves the voice channel after X milliseconds]** - [Read More](#player-options).

# Page Sections
- **[Installation](#installation)**
- **[Getting Started](#getting-started)**
- **[Documentation](#documentation)**
- **[Methods](#methods)**
- **[Utils](#utils)**
- **[Events](#events)**
- **[Examples](#examples)**
- **[Info Messages](#info-messages)**
- **[Handle Errors](#handle-errors)**

# Installation
*Node.js 14.0.0 or newer is required to run this module.*
```sh
npm install --save discord-music-player
```
Install **opusscript** or **@discordjs/opus**:
*If something goes wrong use ``*@discordjs/opus``.*
```sh
npm install --save opusscript
```
**Install [FFMPEG](https://www.ffmpeg.org/download.html)!**

# Getting Started
**The code bellow, will show you how to use DMP in your code.**
*Please define your **Player** after the **client/bot** definition.*
```js
const Discord = require("discord.js");
const client = new Discord.Client();
const settings = {
    prefix: '!',
    token: 'YourBotTokenHere'
};

const { Player } = require("discord-music-player");
const player = new Player(client, {
    leaveOnEmpty: false, // This options are optional.
});
// You can define the Player as *client.player* to easly access it.
client.player = player;

client.on("ready", () => {
    console.log("I am ready to Play with DMP 🎶");
});

client.login(settings.token);
```
### Player Options
*You can pass a second parameter when instantiating the class Player, the **options** object:*
**options.leaveOnEnd: [true/false]** If set to **true**, the bot will leave the channel, when the queue would be empty.

**options.leaveOnStop [true/false]**: If set to **true**, the bot will leave the Voice Channel when the `stop()` function is used.

**options.leaveOnEmpty [true/false]**: If set to **true**, bot will automatically leave the Voice Channel when is empty.

**options.timeout [number]**: If set to **miliseconds**, bot will leave onEnd & onEmpty after that amount of time.

**options.quality ['high'/'low']**: Music quality (Default: 'high')

```js
new Player(client, {
    leaveOnEnd: false,
    leaveOnStop: false,
    leaveOnEmpty: true,
    timeout: 0,
    quality: 'high',
});
```

# Documentation

To create a **Guild Queue**, use the **play()** command, then you are able to manage the queue using the listed functions.
***VoiceChannel** object can be obtained from the Message object - ``message.member.voice.channel``.*

***GuildID** object can be obtained from the Message object - ``message.guild.id``.*

***SongName** is a Search String or a YouTube Video URL.*

***RequestedBy** is a String, that can be obtained from the Message object - ``message.author.tag``.*

***SongID** is a Intiger (starting from 0) of the Song in Queue [use i.e. ``parseInt(args[0])`` per Int].*

***Options (optional)** object can have the following options:*
```js
{
    uploadDate: 'hour/today/week/month/year', // Default - none
    duration: 'short/long', // Default - none
    sortBy: 'relevance/date/view count/rating' // Default - 'relevance'
}
```

## Methods:
### Play Methods
- **[play(VoiceChannel, SongName, Options, RequestedBy)](#play)** - Play a Song and init the Server Queue. | Returning: Song
- **[addToQueue(GuildID, SongName, Options, RequestedBy)](#add-to-queue)** - Add a Song to the Server Queue. | Returning: Song
- **[playlist(GuildID, PlaylistURL, VoiceChannel, MaxSongs, RequestedBy)](#playlist)** - Add a Playlist to the Server Queue | Returning: Playlist, Song?
### Queue Methods
- **[isPlaying(GuildID)](#add-to-queue)** - Check if a Song is playing in the Guild. | Returning: Boolean
- **[nowPlaying(GuildID)](#now-playing)** - Get the currenly playing Song in the Server Queue. | Returning: Song
- **[clearQueue(GuildID)](#clearqueue)** - Clear the Server Queue (without the Plaing song). | Returning: Queue
- **[getQueue(GuildID)](#getqueue)** - Get the Server Queue. | Returning: Queue
### Song Methods
- **[skip(GuildID)](#skip)** - Skip the current Song. | Returning: Song
- **[remove(GuildID, SongID)](#remove)** - Remove a Song from the Queue. | Returning: Song
- **[pause(GuildID)](#pause)** - Pause the current playing Song. | Returning: Song
- **[resume(GuildID)](#resume)** - Resume the Song that was paused. | Returning: Song
- **[stop(GuildID)](#stop)** - Stop playing the Music and clear the Server Queue. | Returning: Void
- **[shuffle(GuildID)](#shuffle)** - Shuffle the Server Queue. | Returning: Queue
- **[setRepeatMode(GuildID, boolean)](#repeat)** - Repeat the current Song indefinitely (if set to ``true``) *[true/false]*. | Returning: Void
- **[toggleLoop(GuildID)](#toggle-loop)** - Toggle to repeat or not the current Song indefinitely | Returning: Boolean
### Other Methods
- **[setVolume(GuildID, Volume)](#setvolume)** - Set Music Volume. | Returning: Void
- **[createProgressBar(GuildID, BarSize, ArrowIcon, LoadedIcon)](#create-progress-bar)** - Create a progress bar per current playing song. | Returning: String


## Utils
*Use the Utils to convert the Time (Hh:Mm:Ss) to Milliseconds or vice versa.*

- **MillisecondsToTime(Milliseconds)** - Convert Milliseconds to YouTube Time (Hh:Mm:Ss)
- **TimeToMilliseconds(Time)** - Convert YouTube Time (Hh:Mm:Ss) to Milliseconds
```js
const { Player, Utils } = require('discord-music-player');

// Convert YouTube Time (Hh:Mm:Ss) to Milliseconds
let MS = Utils.TimeToMilliseconds('33:22'); // Return: 2002000

// Convert Milliseconds to YouTube Time (Hh:Mm:Ss)
let TIME = Utils.MillisecondsToTime('2002000'); // Return: 33:22
```

## Events
*Listen to Events after the Play command (initialization) - more info can be found in the **[Info Messages](#info-messages)** section.*

- **getQueue(guildID).on('end')** - Called when the Queue is empty.
- **getQueue(guildID).on('songChanged')** - Called when the Song is changed.
- **getQueue(guildID).on('channelEmpty')** - Called when the Voice Channel is empty.
```js
client.player.getQueue(guildID)
.on('end', () => {
    message.channel.send('The queue is empty, there is nothing to play!');
})
.on('songChanged', (oldSong, newSong) => {
    message.channel.send(`Ended playing ${oldSong.name}! Now playing ${newSong.name}!`);
})
.on('channelEmpty', () => {
    message.channel.send('Everyone left the Voice Channel.');
});
```


## Examples

### Play
Play a Song and init the Server Queue.

**Usage:**
```js
client.player.play(VoiceChannel, SongName, Options, RequestedBy);
```
**Example**:
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // !play This is the Life
    // will play "This is the Life" in the Voice Channel

    if(command === 'play'){
        let song = await client.player.play(message.member.voice.channel, args.join(' '), {
            duration: 'long' // This is optional
        });
        song = song.song;
        message.channel.send(`Started playing ${song.name}.`);
    }
});
```

### Add To Queue
**This part is per isPlaying (``client.player.isPlaying(GuildID)``) too.**
Add a Song to the Server Queue if queue already exists.

**Usage:**
```js
client.player.isPlaying(GuildID);
client.player.addToQueue(GuildID, SongName, Options, RequestedBy);
```
**Example:**
*If there is a already playing song, add a new one to the queue.*
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'play'){
        let isPlaying = client.player.isPlaying(message.guild.id);
        // If there's already a song playing
        if(isPlaying){
            // Add the song to the queue
            let song = await client.player.addToQueue(message.guild.id, args.join(' '));
            song = song.song;
            message.channel.send(`Song ${song.name} was added to the queue!`);
        } else {
            // Else, play the song
            let song = await client.player.play(message.member.voice.channel, args.join(' '));
            song = song.song;
            message.channel.send(`Started playing ${song.name}!`);
        }
    }
});
```

### Playlist
Add a Playlist to the Server Queue.

**Usage:**
```js
client.player.playlist(GuildID, PlaylistURL, VoiceChannel, MaxSong, RequestedBy);
```
**Example:**
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === 'playlist') {
        let isPlaying = client.player.isPlaying(message.guild.id);
        // If MaxSongs is -1, will be infinite.
        let playlist = await client.player.playlist(message.guild.id, args.join(' '), message.member.voice.channel, 10, message.author.tag);

        // Determine the Song (only if the music was not playing previously)
        let song = playlist.song;
        // Get the Playlist
        playlist = playlist.playlist;

        // Send information about adding the Playlist to the Queue
        message.channel.send(`Added a Playlist to the queue with **${playlist.videoCount} songs**, that was **made by ${playlist.channel}**.`)

        // If there was no songs previously playing, send a message about playing one.
        if (!isPlaying) {

            message.channel.send(`Started playing ${song.name}!`);

            // Send a message, when Queue would be empty.
            song.queue.on('end', () => {
                message.channel.send('The queue is empty, please add new songs!');
            });

            // Send a message, when a Song would change.
            song.queue.on('songChanged', (oldSong, newSong, skipped, repeatMode) => {
                if (repeatMode) {
                    message.channel.send(`Playing ${newSong.name} again...`);
                } else {
                    message.channel.send(`Now playing ${newSong.name}...`);
                }
            });
        }

    }
});
```

### Now Playing
Get the currently playing Song in the Server Queue.

**Usage:**
```js
client.player.nowPlaying(GuildID);
```
**Example**:
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    if(command === 'song'){
        let song = await client.player.nowPlaying(message.guild.id);
        message.channel.send(`Current song: ${song.name}`);
    }
});
```

### ClearQueue
Clear the Server Queue.

**Usage:**
```js
client.player.clearQueue(GuildID);
```
**Example:**
```js
client.on('message', (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'clearqueue'){
        client.player.clearQueue(message.guild.id);
        message.channel.send('Queue was cleared!');
    }
});
```

### GetQueue
Get the Server Queue.

**Usage:**
```js
client.player.getQueue(GuildID);
```
**Example:**
```js
client.on('message', (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'queue'){
        let queue = await client.player.getQueue(message.guild.id);
        message.channel.send('Queue:\n'+(queue.songs.map((song, i) => {
            return `${i === 0 ? 'Now Playing' : `#${i+1}`} - ${song.name} | ${song.author}`
        }).join('\n')));
    }
    /**
     * Output:
     *
     * Queue:
     * Now Playing - Despacito | Luis Fonsi
     * #2 - Timber | Pitbull
     * #3 - Dance Monkey | Tones And I
     */
});
```

### Skip
Skip the current Song.

**Usage:**
```js
client.player.skip(GuildID);
```
**Example**:
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'skip'){
        let song = await client.player.skip(message.guild.id);
        message.channel.send(`${song.name} was skipped!`);
    }
});
```

### Remove
Remove a Song from the Queue.

**Usage:**

```js
client.player.remove(GuildID, Song);
```
**Example:**
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // !remove 2

    if(command === 'remove'){
        let SongID = parseInt(args[0])-1; // The index is starting from 0, so we subtract 1.
        // Removes a song from the queue
        client.player.remove(message.guild.id, SongID).then(() => {
            message.channel.send(`Removed song ${args[0]} from the Queue!`);
        });
    }
});
```

### Pause
Pause the current playing Song.
**Usage:**
```js
client.player.pause(GuildID);
```
**Example**:
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'pause'){
        let song = await client.player.pause(message.guild.id);
        message.channel.send(`${song.name} was paused!`);
    }
});
```

### Resume
Resume the Song that was paused.

**Usage:**
```js
client.player.resume(GuildID);
```
**Example**:
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'resume'){
        let song = await client.player.resume(message.guild.id);
        message.channel.send(`${song.name} was resumed!`);
    }
});
```

### Stop
Stop playing the Music and clear the Server Queue.

**Usage:**
```js
client.player.stop(GuildID);
```
**Example**:
```js
client.on('message', (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'stop'){
        client.player.stop(message.guild.id);
        message.channel.send('Music stopped, the Queue was cleared!');
    }
});
```

### Shuffle
Shuffle the Server Queue.

**Usage:**
```js
client.player.shuffle(GuildID);
```
**Example**:
```js
client.on('message', (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'shuffle'){
        client.player.shuffle(message.guild.id);
        message.channel.send('Server Queue was shuffled.');
    }
});
```

### Repeat
Repeat the current Song indefinitely (if set to ``true``) *[true/false]*.

**Usage:**
```js
client.player.setRepeatMode(GuildID, boolean);
```
**Example**:
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'enable-repeat'){
        // Enable repeat mode
        client.player.setRepeatMode(message.guild.id, true);
        // Get the current song
        let song = await client.player.nowPlaying(message.guild.id);
        message.channel.send(`${song.name} will be repeated indefinitely!`);
    }

    if(command === 'disable-repeat'){
        // Disable repeat mode
        client.player.setRepeatMode(message.guild.id, false);
        // Get the current song
        let song = await client.player.nowPlaying(message.guild.id);
        message.channel.send(`${song.name}  will no longer be repeated indefinitely!`);
    }
});
```

### Toggle Loop
Toggle to repeat or not the current Song indefinitely.

**Usage:**
```js
client.player.toggleLoop(GuildID);
```
**Example**:
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === 'toggle') {
        let toggle = client.player.toggleLoop(message.guild.id);

        // Send a message with the toggle information
        if (toggle)
            message.channel.send('I will now repeat the current playing song.');
        else message.channel.send('I will not longer repeat the current playing song.');

    }
});
```

### SetVolume
Set Music Volume.

**Usage:**
```js
client.player.setVolume(GuildID, Volume);
```
**Example**:
*Volume should be a % (from 0 to 200).*
```js
client.on('message', (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'setvolume'){
        client.player.setVolume(message.guild.id, parseInt(args[0]));
        message.channel.send(`Volume set to ${args[0]} !`);
    }
});
```

### Create Progress Bar
Create a progress bar per current playing song.

**Usage:**
```js
createProgressBar(GuildID, BarSize, ArrowIcon, LoadedIcon);
```
**Example**:
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'progress'){
        let progressBar = client.player.createProgressBar(message.guild.id, 20);

        message.channel.send(progressBar);
        // Example: [==>                  ][00:25/04:07]
    }
});
```

## Info Messages

**You can use Info Messages to send a information, when a event if performed.**
```js
client.on('message', (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'play'){
        let song = await client.player.play(message.member.voice.channel, args.join(''));

        // Send a message, when Queue would be empty.
        song.queue.on('end', () => {
            message.channel.send('The queue is empty, please add new songs!');
        });

        // Send a message, when a Song would change.
        song.queue.on('songChanged', (oldSong, newSong, skipped, repeatMode) => {
            if(repeatMode){
                message.channel.send(`Playing ${newSong.name} again...`);
            } else {
                message.channel.send(`Now playing ${newSong.name}...`);
            }
        });
    }
});
```

## Handle Errors
**Catching errors while using ``play`` and ``addToQueue``:**
```js
    play(message.member.voice.channel, args.join('')).then(async song => {
            // If Song won't be found - *body.error* will be NOT null and *body.song* null.
            // You should catch the error using .catch() method or use:
            if(!song.error) throw(error);
            let song = song.song;
        }).catch(err => {
            // Catch and Debug it, whatever you need.
            console.log(err);
            /**
            * Will Debug:
            * {
            *   error: {
            *      type: 'SearchIsNull',
            *      message: 'No Song was found with that query.'
            *   },
            *   song: null
            * }
            */
        });
```

### Example:
```js
client.on('message', async (message) => {

    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // Song not found
    if(command === 'play'){
        client.player.play(message.member.voice.channel, args.join(' ')).then(async song => {
            if(song.error) throw(song.error);

        }).catch(err => {
            // Catch and Debug it, whatever you need.
            console.log(err);
        });
    }
});
```

## Contribution and Info
**This module is used in the following Bots:**
- **[SsumBOT (500 guilds)](https://ssumbot.xyz/)** made by **[Me](https://github.com/SushiBtw)**.
- **[SpeckyBot (100 guilds)](https://github.com/SpeckyYT/SpeckyBot/)** made by **[SpeckyYT](https://github.com/SpeckyYT)**.

*Contribute with the module on [the GitHub module page](https://github.com/SushiBtw/discord-music-player/).*
