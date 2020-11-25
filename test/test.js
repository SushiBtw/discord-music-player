let TestStrings = [
    'Never Gonna Give You Up',
]

const Discord = require("discord.js");
const client = new Discord.Client();

const Util = require('../src/Util');
const { Player } = require('../index');
let player = new Player(client);
const ytsr = require('../src/node-ytsr-wip/main');

for (var String in TestStrings) {

    console.log(`Running Song: ${TestStrings[String]}`);

    Util.getFirstSearch(TestStrings[String], ytsr).then(async result => {
        console.log(`Found Song: ${result.title}`);
        process.exit(0);
    });

}