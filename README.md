
# Discord Music Player

**Note**: this module uses recent discordjs features and requires discord.js version 12.

Discord Player is a powerful [Node.js](https://nodejs.org) module that allows you to easily implement music commands. **Everything** is customizable, and everything is done to simplify your work **without limiting you**!
**We support YouTube Videos, Playlist's, Spotify Songs and even more!**
*This package was made by **Androz2091** and rewritten by **SushiBtw** using the MIT License Rules.*

### *We support NodeJS 12-15.*

## **DMP v7.0.0 Update (IMPORTANT):**
- **All methods require now Message Object (easier to use),**
- **`Queue` is not longer a EventEmitter,**
- **`Player` is now a EventEmitter - [Check It Out](#events),**
- **Fixed issues with Livestreams,**,
- **Fixed issues with Client leaving without any specific reason,**
- **Added support for SPOTIFY PLAYLISTS - [Check It Out](#playlist),**
- **Fixed `setQueueRepeatMode` method,**
- **Fixed issues with Invalid URL while playing some songs,**
- **Added ``index: Int`` to [addToQueue Options](#documentation).**

# Page Sections
- **[Installation](#installation)**
- **[Getting Started](#getting-started)**
- **[Documentation](#documentation)**
- **[Methods](#methods)**
- **[Utils](#utils)**
- **[Events](#events)**
- **[Examples](#examples)**
- **[Example Bot's and Contribution](#contribution-and-info)**

# Installation
*Node.js 12.0.0 or newer is required to run this module.*
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

**options.timeout [number]**: If set to **milliseconds**, bot will leave onEnd & onEmpty after that amount of time.

**options.volume [number]**: Default music volume (percentage - can be >100%).

**options.quality ['high'/'low']**: Music quality (Default: 'high')

```js
new Player(client, {
    leaveOnEnd: false,
    leaveOnStop: false,
    leaveOnEmpty: true,
    timeout: 0,
    volume: 150,
    quality: 'high',
});
```

# Documentation
To create a **Guild Queue**, use the **play()** command, then you are able to manage the queue using the listed functions.
***VoiceChannel** object can be obtained from the Message object - ``message.member.voice.channel``.*

***Message** object is obtainable from the onMessage event.*

***SongID** is a Integer (starting from 0) of the Song in Queue [use i.e. ``parseInt(args[0])`` per Int].*

***Milliseconds** is a Milliseconds (Integer) of time [i.e. 5000 is 5 Seconds].*

### ***Options (Or String)** object can obtain the following data:*
```javascript
{
    search: 'This is the life', // [REQUIRED or use String instead of the Object]
    uploadDate: 'hour'|'today'|'week'|'month'|'year', // [OPTIONAL] Default - none
    duration: 'short'|'long', // [OPTIONAL] Default - none
    sortBy: 'relevance'|'date'|'view count'|'rating', // [OPTIONAL] Default - 'relevance'
    requestedBy: message.author.tag, // [OPTIONAL]
    index: 0 // [OPTIONAL] 0 means the last index
}
```
###**OR instead of the Options object you can use a String [Read More](#play).**

## Methods:
### Play Methods
- **[play(Message, OptionsOrString)](#play)** - Play a Song and init the Server Queue. | Returning: `Promise<Song>`
- **[addToQueue(Message, OptionsOrString)](#add-to-queue)** - Add a Song to the Server Queue. | Returning: `Promise<Song>`
- **[playlist(Message, OptionsOrString)](#playlist)** - Add a Playlist to the Server Queue | Returning: `Promise<Playlist>`
### Queue Methods
- **[isPlaying(GuildID)](#add-to-queue)** - Check if a Song is playing in the Guild. | Returning: `Boolean`
- **[nowPlaying(GuildID)](#now-playing)** - Get the currently playing Song in the Server Queue. | Returning: `Song`
- **[clearQueue(GuildID)](#clearqueue)** - Clear the Server Queue (without the Playing song). | Returning: `Boolean`
- **[getQueue(GuildID)](#getqueue)** - Get the Server Queue. | Returning: `Queue`
- **[setQueueRepeatMode(GuildID, boolean)](#repeat-queue)** - Repeat the full Queue indefinitely (if set to ``true``) *[true/false]*. | Returning: `Boolean`
- **[toggleQueueLoop(GuildID)](#toggle-queue-loop)** - Toggle to repeat or not the full Queue indefinitely | Returning: `Boolean`
### Song Methods
- **[seek(guildID, Milliseconds)](#seek)** - Seek to a current moment in a Song. | Returning: `Song`
- **[skip(GuildID)](#skip)** - Skip the current Song. | Returning: `Song`
- **[remove(GuildID, SongID)](#remove)** - Remove a Song from the Queue. | Returning: `Song`
- **[pause(GuildID)](#pause)** - Pause the current playing Song. | Returning: `Song`
- **[resume(GuildID)](#resume)** - Resume the Song that was paused. | Returning: `Song`
- **[stop(GuildID)](#stop)** - Stop playing the Music and clear the Server Queue. | Returning: `Boolean`
- **[shuffle(GuildID)](#shuffle)** - Shuffle the Server Queue. | Returning: `Song[]`
- **[setRepeatMode(GuildID, boolean)](#repeat)** - Repeat the current Song indefinitely (if set to ``true``) *[true/false]*. | Returning: `Boolean`
- **[toggleLoop(GuildID)](#toggle-loop)** - Toggle to repeat or not the current Song indefinitely | Returning: `Boolean`
### Other Methods
- **[setVolume(GuildID, Volume)](#setvolume)** - Set Music Volume. | Returning: `Boolean (was action compleated)`
- **[createProgressBar(GuildID, BarSize, ArrowIcon, LoadedIcon)](#create-progress-bar)** - Create a progress bar per current playing song. | Returning: `String`


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
```javascript
// Init the event listener only once (at the top of your code).
client.player
    // Emitted when channel was empty.
    .on('channelEmpty',  (message, queue) =>
        message.channel.send(`The **${queue.connection.channel}** was empty, music was removed!`))
    // Emitted when a song was added to the queue.
    .on('songAdd',  (message, queue, song) =>
        message.channel.send(`**${song.name}** has been added to the queue!`))
    // Emitted when a playlist was added to the queue.
    .on('playlistAdd',  (message, queue, playlist) =>
        message.channel.send(`${playlist.name} playlist with ${playlist.videoCount} songs has been added to the queue!`))
    // Emitted when there was no more music to play.
    .on('queueEnd',  (message, queue) =>
        message.channel.send(`The queue ended, nothing more to play!`))
    // Emitted when a song changed.
    .on('songChanged', (message, newSong, oldSong) =>
        message.channel.send(`**${newSong.name}** is now playing!`))
    // Emitted when a first song in the queue started playing (after play method).
    .on('songFirst',  (message, song) =>
        message.channel.send(`**${song.name}** is now playing!`))
    // Emitted when someone disconnected the bot from the channel.
    .on('clientDisconnect', (message, queue) =>
        message.channel.send(`I got disconnected from the channel, music was removed.`))
    // Emitted when there was an error with NonAsync functions.
    .on('error', (message, error) => {
        switch (error) {
            // Thrown when the YouTube search could not find any song with that query.
            case 'SearchIsNull':
                message.channel.send(`No song with that query was found.`);
                break;
            // Thrown when the provided YouTube Playlist could not be found.
            case 'InvalidPlaylist':
                message.channel.send(`No Playlist was found with that link.`);
                break;
            // Thrown when the provided Spotify Song could not be found.
            case 'InvalidSpotify':
                message.channel.send(`No Spotify Song was found with that link.`);
                break;
            // Thrown when the Guild Queue does not exist (no music is playing).
            case 'QueueIsNull':
                message.channel.send(`There is no music playing right now.`);
                break;
            // Thrown when the Members is not in a VoiceChannel.
            case 'VoiceChannelTypeInvalid':
                message.channel.send(`You need to be in a Voice Channel to play music.`);
                break;
            // Thrown when the current playing song was an live transmission (that is unsupported).
            case 'LiveUnsupported':
                message.channel.send(`We do not support YouTube Livestreams.`);
                break;
            // Thrown when the current playing song was unavailable.
            case 'VideoUnavailable':
                message.channel.send(`Something went wrong while playing the current song, skipping...`);
                break;
            // Thrown when provided argument was Not A Number.
            case 'NotANumber':
                message.channel.send(`The provided argument was Not A Number.`);
                break;
            // Thrown when the first method argument was not a Discord Message object.
            case 'MessageTypeInvalid':
                message.channel.send(`The Message object was not provided.`);
                break;
            // Thrown when the Guild Queue does not exist (no music is playing).
            default:
                message.channel.send(`**Unknown Error Ocurred:** ${error}`);
                break;
        }
    });
```

## Examples

### Play
Play a Song and init the Server Queue.

**Usage:**
```js
client.player.play(Message, OptionsOrString);
```
**Example**:
```js
client.player.on('songAdd',  (message, queue, song) =>
    message.channel.send(`**${song.name}** has been added to the queue!`))
    .on('songFirst',  (message, song) =>
        message.channel.send(`**${song.name}** is now playing!`));

client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // !play This is the Life
    // will play "This is the Life" in the Voice Channel
    // !play https://open.spotify.com/track/5rX6C5QVvvZB7XckETNych?si=WlrC_VZVRlOhuv55V357AQ
    // will play "All Summer Long" in the Voice Channel

    if(command === 'play'){
        let song = await client.player.play(message, args.join(' '));
        
        // If there were no errors the Player#songAdd event will fire and the song will not be null.
        if(song)
            console.log(`Started playing ${song.name}`);
        return;
    }
    
    // OR with the Options Object
    if(command === 'play'){
        let song = await client.player.play(message, {
            search: args.join(' '),
            requestedBy: message.author.tag
        });

        // If there were no errors the Player#songAdd event will fire and the song will not be null.
        if(song)
            console.log(`Started playing ${song.name}`);
        return;
    }
});
```

### Add To Queue
**This part is per isPlaying (``client.player.isPlaying(Message)``) too.**
Add a Song to the Server Queue if queue already exists.

**Usage:**
```js
client.player.isPlaying(Message);
client.player.addToQueue(Message, OptionsOrString);
```
**Example:**
*If there is an already playing song, add a new one to the queue.*
```js
client.player.on('songAdd',  (message, queue, song) =>
    message.channel.send(`**${song.name}** has been added to the queue!`))
    .on('songFirst',  (message, song) =>
        message.channel.send(`**${song.name}** is now playing!`));

client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // !play This is the Life
    // will play/addToQueue "This is the Life" in the Voice Channel
    // !play https://open.spotify.com/track/5rX6C5QVvvZB7XckETNych?si=WlrC_VZVRlOhuv55V357AQ
    // will play/addToQueue "All Summer Long" in the Voice Channel

    if(command === 'play'){
        if(client.player.isPlaying(message)) {
            let song = await client.player.addToQueue(message, args.join(' '));

            // If there were no errors the Player#songAdd event will fire and the song will not be null.
            if(song)
                console.log(`Added ${song.name} to the queue`);
            return;
        } else {
            let song = await client.player.play(message, args.join(' '));

            // If there were no errors the Player#songAdd event will fire and the song will not be null.
            if(song)
                console.log(`Started playing ${song.name}`);
            return;
        }
    }
});
```

### Playlist
Add a Playlist to the Server Queue.

**Usage:**
```js
client.player.playlist(Message, OptionsOrString);
```
**Example:**
```js
client.player
    .on('playlistAdd',  (message, queue, playlist) => 
        message.channel.send(`${playlist.name} playlist with ${playlist.videoCount} songs has been added to the queue!`));

client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === 'playlist') {
        // If maxSongs is -1, will be infinite.
        await client.player.playlist(message, {
            search: args.join(' '),
            maxSongs: 20
        });

        // If there were no errors the Player#playlistAdd event will fire and the playlist will not be null.
    }
});
```

### Now Playing
Get the currently playing Song in the Server Queue.

**Usage:**
```js
client.player.nowPlaying(Message);
```
**Example**:
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    if(command === 'song'){
        let song = await client.player.nowPlaying(message);
        if(song)
            message.channel.send(`Current song: ${song.name}`);
    }
});
```

### ClearQueue
Clear the Server Queue.

**Usage:**
```js
client.player.clearQueue(Message);
```
**Example:**
```js
client.on('message', (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'clearqueue'){
        let isDone = client.player.clearQueue(message);
        if(isDone)
            message.channel.send('Queue was cleared!');
    }
});
```

### Seek
Seek to a current moment in a Song.

**Usage:**
```js
client.player.seek(Message, Milliseconds);
```
**Example:**
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'seek'){
        // If provided 10 seconds, it would send the Milliseconds stamp (10 * 1000)
        let song = await client.player.seek(message, parseInt(message.args[0] * 1000)).catch(err => {
            return message.channel.send(error.message);
        });
        
        message.channel.send(`Seeked to ${message.args[0]} second of ${song.name}.`);
    }
});
```

### GetQueue
Get the Server Queue.

**Usage:**
```js
client.player.getQueue(Message);
```
**Example:**
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'queue'){
        let queue = client.player.getQueue(message);
        if(queue)
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
client.player.skip(Message);
```
**Example**:
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'skip'){
        let song = client.player.skip(message);
        if(song)
            message.channel.send(`${song.name} was skipped!`);
    }
});
```

### Remove
Remove a Song from the Queue.

**Usage:**
```js
client.player.remove(Message, Index);
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
        let song = client.player.remove(message, SongID);
        if(song)
            message.channel.send(`Removed song ${song.name} (${args[0]}) from the Queue!`);
    }
});
```

### Pause
Pause the current playing Song.
**Usage:**
```js
client.player.pause(Message);
```
**Example**:
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'pause'){
        let song = client.player.pause(message);
        if(song) 
            message.channel.send(`${song.name} was paused!`);
    }
});
```

### Resume
Resume the Song that was paused.

**Usage:**
```js
client.player.resume(Message);
```
**Example**:
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'resume'){
        let song = client.player.resume(message);
        if(song)
            message.channel.send(`${song.name} was resumed!`);
    }
});
```

### Stop
Stop playing the Music and clear the Server Queue.

**Usage:**
```js
client.player.stop(Message);
```
**Example**:
```js
client.on('message', (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'stop'){
        let isDone = client.player.stop(message);
        if(isDone)
            message.channel.send('Music stopped, the Queue was cleared!');
    }
});
```

### Shuffle
Shuffle the Server Queue.

**Usage:**
```js
client.player.shuffle(Message);
```
**Example**:
```js
client.on('message', (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'shuffle'){
        let songs = client.player.shuffle(message);
        if(songs)
            message.channel.send('Server Queue was shuffled.');
    }
});
```

### Repeat
Repeat the current Song indefinitely (if set to ``true``) *[true/false]*.

**Usage:**
```js
client.player.setRepeatMode(Message, Boolean);
```
**Example**:
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'enable-repeat'){
        // Enable repeat mode
        let status = client.player.setRepeatMode(message, true);
        if(status === null)
            return;
        // Get the current song
        let song = client.player.nowPlaying(message);
        if(song)
            message.channel.send(`${song.name} will be repeated indefinitely!`);
    }

    if(command === 'disable-repeat'){
        // Disable repeat mode
        let status = client.player.setRepeatMode(message, false);
        if(status === null)
            return;
        // Get the current song
        let song = client.player.nowPlaying(message);
        if(song)
            message.channel.send(`${song.name} will no longer be repeated indefinitely!`);
    }
});
```

### Toggle Loop
Toggle to repeat or not the current Song indefinitely.

**Usage:**
```js
client.player.toggleLoop(Message);
```
**Example**:
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === 'toggle') {
        let toggle = client.player.toggleLoop(message);
        
        if(toggle === null)
            return;
        // Send a message with the toggle information
        else if (toggle)
            message.channel.send('I will now repeat the current playing song.');
        else message.channel.send('I will not longer repeat the current playing song.');

    }
});
```

### Repeat Queue
Repeat the full queue indefinitely (if set to ``true``) *[true/false]*.

**Usage:**
```js
client.player.setQueueRepeatMode(Message, Boolean);
```
**Example**:
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'enable-queue-repeat'){
        // Enable repeat mode
        let status = client.player.setQueueRepeatMode(message, true);
        if(status === null)
            return;
        message.channel.send(`Queue will be repeated indefinitely!`);
    }

    if(command === 'disable-queue-repeat'){
        // Disable repeat mode
        let status = client.player.setQueueRepeatMode(message, false);
        if(status === null)
            return;
        message.channel.send(`Queue will not be longer repeated indefinitely!`);
    }
});
```

### Toggle Queue Loop
Toggle to repeat or not the full Queue indefinitely.

**Usage:**
```js
client.player.toggleQueueLoop(Message);
```
**Example**:
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === 'toggle') {
        let toggle = client.player.toggleQueueLoop(message);
        
        if(toggle === null)
            return;
        // Send a message with the toggle information
        else if (toggle)
            message.channel.send('I will now repeat the full queue indefinitely.');
        else message.channel.send('I will not longer repeat the full queue indefinitely.');

    }
});
```

### SetVolume
Set Music Volume.

**Usage:**
```js
client.player.setVolume(Message, Volume);
```
**Example**:
*Volume should be a % (from 0 to 200).*
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'setvolume'){
        let isDone = client.player.setVolume(message, parseInt(args[0]));
        if(isDone)
            message.channel.send(`Volume set to ${args[0]}%!`);
    }
});
```

### Create Progress Bar
Create a progress bar per current playing song.

**Usage:**
```js
createProgressBar(Message, Options);
```
**Example**:
```js
client.on('message', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'progress'){
        let progressBar = client.player.createProgressBar(message, {
            size: 15,
            block: '=',
            arrow: '>'
        });
        if(progressBar)
            message.channel.send(progressBar);
        // Example: [==>                  ][00:25/04:07]
    }
});
```

## Contribution and Info
**This module is used in the following Bots:**
- **[SsumBOT (550 guilds)](https://ssumbot.xyz/)** made by **[SushiBtw](https://github.com/SushiBtw)**.
- **[SpeckyBot (140 guilds)](https://github.com/SpeckyYT/SpeckyBot/)** made by **[SpeckyYT](https://github.com/SpeckyYT)**.

*Contribute with the module on [the GitHub module page](https://github.com/SushiBtw/discord-music-player/).*