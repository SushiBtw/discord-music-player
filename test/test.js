let testStrings = [
    'Waiting For Love',
];

const testSearchOptions = {
    uploadDate: null,
    duration: 'short',
    sortBy: 'DontSoryByDueMisstypedError',
}

const Discord = require("discord.js");
const client = new Discord.Client();

const Util = require('../src/Util');
const { Player } = require('../index');
let player = new Player(client);
const ytsr = require('../src/node-ytsr-wip/main');

for (const str in testStrings) {

    console.log(`Running Song: ${testStrings[str]}`);

    Util.getFirstSearch(testStrings[str], ytsr, testSearchOptions).then(result => {
        console.log(`Found Song: ${result.title}`);
        process.exit(0);
    });

}