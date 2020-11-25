let TestStrings = [
    'Never Gonna Give You Up',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
]


const Discord = require("discord.js");
const client = new Discord.Client();

const Util = require('../src/Util');
const { Player } = require('../index');
let player = new Player(client);

for (var String in TestStrings) {

    console.log(String);

    Util.getFirstSearch(TestStrings[String]).then(async result => {
        console.log(result.title);
    });

}