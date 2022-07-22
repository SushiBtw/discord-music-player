# Migrating to Discord Music Player v9

### Note: Version 8 and 9 has some breaking changes, your old code from Version 7 will no longer work.

The **Version 8 & 9** update brings support for [Discord.js v14 & v13](https://www.npmjs.com/package/discord.js), new features and better Queue management.
We use the new [@discordjs/voice](https://www.npmjs.com/package/@discordjs/voice) package, that makes the music even better!

## Code example

Every function related to Music is now a part of `Queue`.
You need to create a new `Queue` instance to interact with the Guild music.
```diff
- player.play(message, search);
+ let queue = player.createQueue(message.guild.id);
+ await queue.join(message.member.voice.channel);
+ let song = await queue.play(search);
```

## Event management

The **Version 8** removes `message` object, from the play parameters.
Discord Music Player methods accept now `GuildResolvable` (`Guild`/`GuildID`) discord.js object.

Instead of the `message` object, you can pass custom `<Queue>.data` or `<Song>.data` option to hold custom data.
```js
let queue = player.createQueue(interaction.guild.id, {
    data: interaction
});
await queue.join(message.member.voice.channel);
await queue.play('F1 music', {
    data: { custom: 'fields' }
});
```
The `data` object will be always accessible for you under the `<Queue>.data` prop.
```js
player.on('songAdd', (queue, song) => {
    queue.data.channel.send(`**${song}** has been added to the queue.`);
    console.log(`Song custom data: ${song.data}`); // { custom: 'fields' }
})
player.on('queueEnd', (queue) => {
    queue.data.channel.send(`Queue ended, there is nothing to play.`);
})
player.on('queueDestroyed', (queue) => {
    queue.data.channel.send(`Playback ended.`);
})
```

## Utils
From the Discord Music Player **Version 8**, you can access some Utils functions, such as `search()` or `best()`.

### Search
Search util allows you to search for songs, allow you to pick the best search and play it.
```js
const { Utils } = require('discord-music-player');

let queue = player.getQueue(message.guild);

// Search for songs
let search = await Utils.search(
    'F1 music',
    {
        sortBy: "view count", // Custom options
    },
    queue, // Queue object
    10 // Search limit
);

// Play the 3rd searched song
await queue.play(search[2]);
```

### Best
Best util allows you to search for the best song, use the method how you want.
```js
const { Utils } = require('discord-music-player');

let queue = player.getQueue(message.guild);

// Search for best song
let best = await Utils.best(
    'F1 music',
    {
        sortBy: "view count", // Custom options
    },
    queue, // Queue object
);

message.channel.send(`Best F1 music so far: ${best.name} (${best.url})`);
```

## Errors
The Discord Music Player **Version 8** added a custom `DMPError` object, that is thrown while an error occurred while calling a method.
While catching errors in async methods is easy, using the `.catch()` tag - you would need to use the `try...catch` statement in non-async methods.

**Every error will return a custom [DMPError](https://discord-music-player.js.org/docs/main/development/class/DMPError) object.**
List of Error Code's can be found [here](https://discord-music-player.js.org/docs/main/development/typedef/DMPErrors).
### Play (async)
```js
let queue = client.player.createQueue(message.guild.id);
await queue.join(message.member.voice.channel);
let song = await queue.play(args.join(' ')).catch(err => {
    console.log(err.name); // UnknownVoice
    console.log(err.message); // The provided Member is not in a Voice Channel.
});
```

### Skip (non-async)
The error shown here can exist while the Queue ended,
but due the `QueueOptions#timeout` - the bot did not leave (so the Queue existed, but was locally destroyed) at the time the method was not called.
```js
let queue = client.player.getQueue(message.guild.id);
if(!queue) return;
try {
    queue.skip();
}
catch(err) {
    console.log(err.name); // QueueDestroyed
    console.log(err.message); // The Queue was destroyed.
}
```

## Event Errors
The `play()/playlist()` error handling does not longer emit the `Player#error` event ([read here](#Errors)).
You need to handle Event Errors (happening in runtime) by yourself now.

Here is an example:
```js
player.on('error', (error, queue) => {
    queue.data.channel.send(`An error occurred: \`${error.message}\`.`);
})
```

## New Play Options
You can now pass few new Play options such as:
- `timecode: boolean` - If this option is true, it will seek to the url time param (?t=) moment,
- `localAddress: string` - If this option is provided, it will use the provided IP address to search and play the song.
```js
let queue = client.player.createQueue(message.guild.id);
await queue.join(message.member.voice.channel);
let song = await queue.play('F1 music', {
    timecode: true,
    localAddress: 'CustomIPv6YouOwn'
});
```

## Missing something? Found a Bug?
Feel free to join [Discord-Music-Player Discord Server](https://discord.gg/6fejZNsmFC) and ask us about DMP.

Create a Bug Report/Question Report via [Discord-Music-Player Github](https://github.com/SushiBtw/discord-music-player/issues).
