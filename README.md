# Discord Music Player
![npm](https://img.shields.io/npm/dt/discord-music-player?style=for-the-badge)
![npm](https://img.shields.io/npm/v/discord-music-player?style=for-the-badge)
![CodeFactor Grade](https://img.shields.io/codefactor/grade/github/SushiBtw/discord-music-player?color=%2348aaf1&style=for-the-badge)

### Note: This is the v9 version of Discord Music Player for Discord.JS v14 & v13!

Discord Music Player is a powerful [Node.js](https://nodejs.org) module that allows you to easily implement music commands.
**Everything** is customizable, and everything can be done using this package - **there are no limitations!**

This package supports YouTube Videos & Playlists, Spotify Songs & Playlists, Apple Music Songs & Playlists.
Package from version v7.0.0 is fully maintained by [SushiBtw](https://github.com/SushiBtw).

### Requirements:
- [Discord.js v14 or v13](https://www.npmjs.com/package/discord.js),
- [Node.JS v16](https://nodejs.org/),

# Installation
*Node.JS v16 or newer is required to run this module.*
```sh
npm install --save discord-music-player
```
Install **@discordjs/opus**:
```sh
npm install --save @discordjs/opus
```
**Install [FFMPEG](https://www.ffmpeg.org/download.html)!**

# Documentation
**Discord Music Player documentation: [https://discord-music-player.js.org/](https://discord-music-player.js.org/)**

### **Need some help?**
Feel free to join [Discord-Music-Player Discord Server](https://discord.gg/6fejZNsmFC) and ask us about DMP.

# Getting Started
**The code bellow, will show you how to use DMP in your code.**

*Please define your **Player** after the **client/bot** definition.*

[!] Remember to include the related voice **Intents** at the client options. [!]
```js
const Discord = require("discord.js");
const client = new Discord.Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES]
});
const settings = {
    prefix: '!',
    token: 'YourBotTokenHere'
};

const { Player } = require("discord-music-player");
const player = new Player(client, {
    leaveOnEmpty: false, // This options are optional.
});
// You can define the Player as *client.player* to easily access it.
client.player = player;

client.on("ready", () => {
    console.log("I am ready to Play with DMP 🎶");
});

client.login(settings.token);
```

# Example Usage
```js
const { RepeatMode } = require('discord-music-player');

client.on('messageCreate', async (message) => {
    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift();
    let guildQueue = client.player.getQueue(message.guild.id);

    if(command === 'play') {
        let queue = client.player.createQueue(message.guild.id);
        await queue.join(message.member.voice.channel);
        let song = await queue.play(args.join(' ')).catch(err => {
            console.log(err);
            if(!guildQueue)
                queue.stop();
        });
    }

    if(command === 'playlist') {
        let queue = client.player.createQueue(message.guild.id);
        await queue.join(message.member.voice.channel);
        let song = await queue.playlist(args.join(' ')).catch(err => {
            console.log(err);
            if(!guildQueue)
                queue.stop();
        });
    }

    if(command === 'skip') {
        guildQueue.skip();
    }

    if(command === 'stop') {
        guildQueue.stop();
    }

    if(command === 'removeLoop') {
        guildQueue.setRepeatMode(RepeatMode.DISABLED); // or 0 instead of RepeatMode.DISABLED
    }

    if(command === 'toggleLoop') {
        guildQueue.setRepeatMode(RepeatMode.SONG); // or 1 instead of RepeatMode.SONG
    }

    if(command === 'toggleQueueLoop') {
        guildQueue.setRepeatMode(RepeatMode.QUEUE); // or 2 instead of RepeatMode.QUEUE
    }

    if(command === 'setVolume') {
        guildQueue.setVolume(parseInt(args[0]));
    }

    if(command === 'seek') {
        guildQueue.seek(parseInt(args[0]) * 1000);
    }

    if(command === 'clearQueue') {
        guildQueue.clearQueue();
    }

    if(command === 'shuffle') {
        guildQueue.shuffle();
    }

    if(command === 'getQueue') {
        console.log(guildQueue);
    }

    if(command === 'getVolume') {
        console.log(guildQueue.volume)
    }

    if(command === 'nowPlaying') {
        console.log(`Now playing: ${guildQueue.nowPlaying}`);
    }

    if(command === 'pause') {
        guildQueue.setPaused(true);
    }

    if(command === 'resume') {
        guildQueue.setPaused(false);
    }

    if(command === 'remove') {
        guildQueue.remove(parseInt(args[0]));
    }

    if(command === 'createProgressBar') {
        const ProgressBar = guildQueue.createProgressBar();
        
        // [======>              ][00:35/2:20]
        console.log(ProgressBar.prettier);
    }
})
```

### Events:
```js
// Init the event listener only once (at the top of your code).
client.player
    // Emitted when channel was empty.
    .on('channelEmpty',  (queue) =>
        console.log(`Everyone left the Voice Channel, queue ended.`))
    // Emitted when a song was added to the queue.
    .on('songAdd',  (queue, song) =>
        console.log(`Song ${song} was added to the queue.`))
    // Emitted when a playlist was added to the queue.
    .on('playlistAdd',  (queue, playlist) =>
        console.log(`Playlist ${playlist} with ${playlist.songs.length} was added to the queue.`))
    // Emitted when there was no more music to play.
    .on('queueDestroyed',  (queue) =>
        console.log(`The queue was destroyed.`))
    // Emitted when the queue was destroyed (either by ending or stopping).    
    .on('queueEnd',  (queue) =>
        console.log(`The queue has ended.`))
    // Emitted when a song changed.
    .on('songChanged', (queue, newSong, oldSong) =>
        console.log(`${newSong} is now playing.`))
    // Emitted when a first song in the queue started playing.
    .on('songFirst',  (queue, song) =>
        console.log(`Started playing ${song}.`))
    // Emitted when someone disconnected the bot from the channel.
    .on('clientDisconnect', (queue) =>
        console.log(`I was kicked from the Voice Channel, queue ended.`))
    // Emitted when deafenOnJoin is true and the bot was undeafened
    .on('clientUndeafen', (queue) =>
        console.log(`I got undefeanded.`))
    // Emitted when there was an error in runtime
    .on('error', (error, queue) => {
        console.log(`Error: ${error} in ${queue.guild.name}`);
    });
```

# Passing custom data

### Queue
While running the `Queue#createQueue()` method you can pass a `options#data` object to hold custom data.
This can be made in two ways:
```js
// Pass custom data
await player.createQueue(message.guild.id, {
    data: {
        queueInitMessage: message,
        myObject: 'this will stay with the queue :)',
        more: 'add more... there are no limitations...'
    }
});
// Or by using
queue.setData({
    whatever: 'you want :D'
});

// Access custom data
let queue = player.getQueue(message.guild.id);
let initMessage = queue.data.queueInitMessage;
await initMessage.channel.send(`This message object is hold in Queue :D`);
```

### Song or Playlist
While running the `Queue#play()`/Queue#playlist() method you can pass a `options#data` object to hold custom data.
This can be made in two ways:
```js
// Play the song
let song = await queue.play('Born in the USA!');
// Set song data
song.setData({
    initMessage: message
});

// Play the playlist
let playlist = await queue.playlist('https://www.youtube.com/playlist?list=PLDLGxnP4y2mGKGEqwxWTRkd3HtrrVTMdU');
// Set playlist data (will set data for each song in the playlist)
song.setData({
    initMessage: message
});

// Access custom data
let queue = player.getQueue(message.guild.id);
let { initMessage } = queue.nowPlaying.data;
await initMessage.channel.send(`This message object is hold in Song :D`);
```
