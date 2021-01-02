import { Command, messageObj } from '../models';
import { Client, MessageEmbed } from 'discord.js';

module.exports = {
    name: 'version',
    description: 'Get the current version of the bot',
    syntax: "version",
    priviliged: false,
    RLPointsConsume: 2,
    execute: (message: messageObj, bot: Client) => {
        var pjson = require(__dirname + '/../package.json');


        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle("T.O.D.D")
            .setDescription(`Hi, I am T.O.D.D your **TO**s;**D**r **D**iscord Bot!`)
            .addField("Version", pjson.version)
            .addField("GitHub Repository", pjson.repository.url.substr(pjson.repository.type.length + 1), true)
            .addField("Bugs", `[Report a Bug](${pjson.bugs.url})`, true)
            .addField("Debug Details", `__Below are some details to include in a bug report__`)
            .addField("DB_HOST", process.env.MYSQL_HOST, true)
            .addField("REDIS_HOST", process.env.REDIS_HOST, true)
            .addField("REDIS_INDEX", process.env.REDIS_INDEX, true)
            .addField("MESSAGE_ID", message.id, true)
            .setTimestamp();

        message.message.channel.send(embed).then(() => {
            return true;
        }).catch(() => {
            return false;
        });
    },
} as Command;