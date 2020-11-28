
# Discord Music Player

**Note**: this module uses recent discordjs features and requires discord.js version 12.

Discord Player is a powerful [Node.js](https://nodejs.org) module that allows you to easily implement music commands. **Everything** is customizable, and everything is done to simplify your work **without limiting you**!
*This package was made by **Androz2091** and rewritten by **SushiBtw** using the MIT License Rules.*

## **DMP v6.0.0 Update:**
- [x]   **YouTube Link Support** - [Read More](#),
- [x] **YouTube Filters** - [Read More](#),
- [ ]  **Shuffle Method** - [Not Ready](#),
- [ ] **Progress Bar** - [Not Ready](#),
- [ ] **Code Quality Fixes** - **Not Ready**,
- [ ] **Code Size Reduction** - **Not Ready**.

## Page Sections
- **[Installation](#installation)**
- **[Getting Started](#getting-started)**
- **[Installation](#installation)**
- **[Installation](#installation)**
- **[Installation](#installation)**

## Installation
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

## Getting Started
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

```js
new Player(client, {
	leaveOnEnd: false,
	leaveOnEmpty: false,
	leaveOnEmpty: true,
});
```

## Functions

You need to **init the guild queue using the play() function**, then you are able to manage the queue using the listed functions.
***VoiceChannel** object can be obtained from the Message object - ``message.member.voice.channel``.*
***GuildID** object can be obtained from the Message object - ``message.guild.id``.*
***SongName** is a Search String or a YouTube Video URL.*
***Options (optional)** object can have the following options:*
```json
{
	uploadDate: 'hour/today/week/month/year', // Default - none
	duration: 'short/long', // Default - none
	sortBy: 'relevance/date/view count/rating' // Default - 'relevance'
}
```

// Play a song in the voice channel and init the guild queue
client.player.play(VoiceChannel, songName, Options);

// Add a song to the queue
client.player.addToQueue(guildID, SongName);
// Clear the queue
client.player.clearQueue(guildID);
// Get the queue
client.player.getQueue(guildID);
// Skip the current song
client.player.skip(guildID);
// Remove a song from the queue using the index number
client.player.remove(guildID, song);


// Pause
client.player.pause(guildID);
// Resume
client.player.resume(guildID);
// Stop
client.player.stop(guildID);

// Check if music is playing in a guild
client.player.isPlaying(guildID);
// Get the currently playing song
client.player.nowPlaying(guildID);


// Current song will be repeated indefinitely
client.player.setRepeatMode(guildID, true);
// Current song will no longer be repeated indefinitely
client.player.setRepeatMode(guildID, false);


### Event messages

```js
client.player.getQueue(guildID)
.on('end', () => {
    message.channel.send('There is no more music in the queue!');
})
.on('songChanged', (oldSong, newSong) => {
    message.channel.send(`Now playing ${newSong.name}...`);
})
.on('channelEmpty', () => {
    message.channel.send('Stop playing, there is no more member in the voice channel...');
});
```

## Examples

### Play

To play a song, use the `client.player.play();` function.  

**Usage:**

```js
client.player.play(voiceChannel, songName, requestedBy);
```

**Example**:

```js
client.on('message', async (message) => {

    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // !play Despacito
    // will play "Despacito" in the member voice channel

    if(command === 'play'){
        let song = await client.player.play(message.member.voice.channel, args[0], message.member.user.tag);
        song = song.song;
        message.channel.send(`Currently playing ${song.name}! - Requested by ${song.requestedBy}`);
    }
});
```

### Pause

To pause the current song, use the `client.player.pause()` function.  

**Usage:**

```js
client.player.pause(guildID);
```

**Example**:

```js
client.on('message', async (message) => {

    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'pause'){
        let song = await client.player.pause(message.guild.id);
        message.channel.send(`${song.name} paused!`);
    }
});
```

### Resume

To resume the current song, use the `client.player.resume()` function.  

**Usage:**

```js
client.player.resume(guildID);
```

**Example**:

```js
client.on('message', async (message) => {

    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'resume'){
        let song = await client.player.resume(message.guild.id);
        message.channel.send(`${song.name} resumed!`);
    }
});
```

### Stop

To stop the music, use the `client.player.stop()` function.  

**Usage:**

```js
client.player.stop(guildID);
```

**Example**:

```js
client.on('message', (message) => {

    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'stop'){
        client.player.stop(message.guild.id);
        message.channel.send('Music stopped!');
    }
});
```

### SetVolume

To update the volume, use the `client.player.setVolume()` function.  

**Usage:**

```js
client.player.setVolume(guildID, percent);
```

**Example**:

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

### AddToQueue

To add a song to the queue, use the `client.player.addToQueue()` function.

**Usage:**

```js
client.player.addToQueue(guildID, songName);
```

**Example:**

In this example, you will see how to add a song to the queue if one is already playing.

```js
client.on('message', async (message) => {

    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'play'){
        let isPlaing = client.player.isPlaying(message.guild.id);
        // If there's already a song playing
        if(isPlaing){
            // Add the song to the queue
            let song = await client.player.addToQueue(message.guild.id, args[0]);
            song = song.song;
            message.channel.send(`${song.name} added to queue!`);
        } else {
            // Else, play the song
            let song = await client.player.play(message.member.voice.channel, args[0]);
            song = song.song;
            message.channel.send(`Currently playing ${song.name}!`);
        }
    }
});
```

### ClearQueue

To clear the queue, use the `client.player.clearQueue()` function.

**Usage:**

```js
client.player.clearQueue(guildID);
```

**Example:**

```js
client.on('message', (message) => {

    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'clear-queue'){
        client.player.clearQueue(message.guild.id);
        message.channel.send('Queue cleared!');
    }
});
```

### GetQueue

To get the server queue, use the `client.player.getQueue()` function.

**Usage:**

```js
client.player.getQueue(guildID);
```

**Example:**

```js
client.on('message', (message) => {

    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'queue'){
        let queue = await client.player.getQueue(message.guild.id);
        message.channel.send('Server queue:\n'+(queue.songs.map((song, i) => {
            return `${i === 0 ? 'Current' : `#${i+1}`} - ${song.name} | ${song.author}`
        }).join('\n')));
    }
    /**
     * Output:
     *
     * Server queue:
     * Current - Despacito | Luis Fonsi
     * #2 - Memories | Maroon 5
     * #3 - Dance Monkey | Tones And I
     * #4 - Circles | Post Malone
     */
});
```

### Skip

To skip the current song, use the `client.player.skip()` function.  

**Usage:**

```js
client.player.skip(guildID);
```

**Example**:

```js
client.on('message', async (message) => {

    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'skip'){
        let song = await client.player.skip(message.guild.id);
        message.channel.send(`${song.name} skipped!`);
    }
});
```

### Now Playing

To get the currently playing song, use the `client.player.nowPlaying()` function.  

**Usage:**

```js
client.player.nowPlaying(guildID);
```

**Example**:

```js
client.on('message', async (message) => {

    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'now-playing'){
        let song = await client.player.nowPlaying(message.guild.id);
        message.channel.send(`Currently playing ${song.name}...`);
    }
});
```

### Repeat

To repeat the current song, use the `client.player.setRepeatMode()` function.  

**Usage:**

```js
client.player.setRepeatMode(guildID, boolean);
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

### Remove

To remove a song from the queue, use the `client.player.remove()` function.

**Usage:**

```js
client.player.remove(guildID, song);
```

**Example:**

```js
client.on('message', async (message) => {

    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'remove'){
        // Removes a song from the queue
        client.player.remove(message.guild.id, args[0]).then(() => {
            message.channel.send('Removed song!');
        });
    }
});
```

## Info Messages

You can send a message when the queue ends or when the song changes:

```js
client.on('message', (message) => {

    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if(command === 'play'){
        let song = await client.player.play(message.member.voice.channel, args[0]);
        song.queue.on('end', () => {
            message.channel.send('The queue is empty, please add new songs!');
        });
        song.queue.on('songChanged', (oldSong, newSong, skipped, repeatMode) => {
            if(repeatMode){
                message.channel.send(`Playing ${newSong} again...`);
            } else {
                message.channel.send(`Now playing ${newSong}...`);
            }
        });
    }
});
```

## Handle errors

##### Catching errors while using ``play`` and ``addToQueue``:
```js
    play(message.member.voice.channel, args[0]).then(async body => {
            // If Song won't be found - *body.error* will be NOT null and *body.song* null.
            // You should catch the error using .catch() method or use:
            if(!body.error) throw(error);
            let song = body.song;
        
        }).catch(err => {
            // Catch and Debug it, whatever you need.
            console.log(err);
            /**
            * Will Debug:
            * {
            *   error: {
            *      type: 'YouTube_Not_Found',
            *      message: 'No Song was found with that query.'
            *   }
            *   song: null
            * }
            */
        });
        
    play(message.member.voice.channel, args[0]).then(async body => {
            // If your API Key will be rate-limited - *body.error* will be NOT null and *body.song* null.
            // You should catch the error using .catch() method or use:
            if(!body.error) throw(error);
            let song = body.song;
        
        }).catch(err => {
            // Catch and Debug it, whatever you need.
            console.log(err);
            /**
            * Will Debug:
            * {
            *   error: {
            *      type: 'YouTube_API_Error',
            *      message: 'Your API Key has been rate-limited.\nRead more: ' +
            *          'https://developers.google.com/youtube/v3/getting-started#quota.'
            *   },
            *   song: null
            * }
            */
        });
```

There are 2 main errors that you can handle like this:

```js
client.on('message', (message) => {

    const args = message.content.slice(settings.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // Error 1:
    // Song not found
    if(command === 'play'){
        client.player.play(message.member.voice.channel, args[0]).then(async body => {
            if(body.error) throw(body.error);
        
        }).catch(err => {
            // Catch and Debug it, whatever you need.
            console.log(err);
        });
    }

    // Error 2:
    // Not playing
    if(command === 'queue'){
        // Define if Music is playing:
        let playing = client.player.isPlaying(message.guild.id);
        // Now look into it, if music is not playing, Stop:
        if(!playing) return message.channel.send(':x: No songs currently playing!');
        // you are sure it works:
        client.player.getQueue(message.guild.id);
    }
});
```

### **Used to power [SsumBOT Discord Bot](https://ssumbot.xyz/) - one of the best Discord Bots**