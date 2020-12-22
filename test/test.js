let testStrings = [
    'https://www.youtube.com/watch?v=iRYvuS9OxdA',
];

const testSearchOptions = {
    uploadDate: null,
    duration: 'short',
    sortBy: 'relevance',
}

const Discord = require("discord.js");
const client = new Discord.Client();

const Util = require('../src/Util');
const { Player, version } = require('../index');
let player = new Player(client);
const ytsr = require('ytsr');

console.log(version);

for (const str in testStrings) {

    console.log(`Running Song: ${testStrings[str]}`);

    Util.getVideoBySearch(testStrings[str], ytsr, testSearchOptions).then(result => {
        console.log(`Found Song: ${result.title} | ${result.link}`);
        process.exit(0);
    }).catch(err => {
        console.error(err);
        process.exit(0);
    });

}