import { Command, messageObj, Permissions } from '../models';
import { Client, MessageEmbed } from 'discord.js';
import * as fs from 'fs';

module.exports = {
    name: 'version',
    description: 'Get the current version of the bot',
    syntax: ["- _Prints useful info_"],
    Bitmask: Permissions.NONE,
    RLPointsConsume: 2,
    execute: (message: messageObj, bot: Client) => {

        let pathpackage = __dirname + '/../package.json';
        let pathmodules = __dirname + '/../node_modules';


        if (process.env.DEV_MODE) {
            pathpackage = __dirname + '/../../package.json';
            pathmodules = __dirname + '/../../node_modules';
        }

        var pjson = require(pathpackage);


        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle("T.O.D.D")
            .setDescription(`Hi, I am T.O.D.D your **TO**s;**D**r **D**iscord Bot!`)
            .addField("Version", pjson.version)
            .addField("GitHub Repository", pjson.repository.url.substr(pjson.repository.type.length + 1), true)
            .addField("Bugs", `[Report a Bug](${pjson.bugs.url})`, true)
            .addField("Dependencies", Object.keys(pjson.dependencies).length, true)
            .addField("node_modules", fs.readdirSync(pathmodules).length, true);
        if (process.env.DEV_MODE) {
            embed.addField("Debug Details", `__Below are some details due to ts-node compiling__`)
                .addField("DB_HOST", process.env.MYSQL_HOST, true)
                .addField("REDIS_HOST", process.env.REDIS_HOST, true)
                .addField("REDIS_INDEX", process.env.REDIS_INDEX, true)
                .addField("BOT_PREFIX", process.env.BOT_PREFIX, true)
                .addField("GUILD_HOME", process.env.GUILD_HOME, true)
                .addField("GUILD_MODLOG", `<#${process.env.GUILD_MODLOG}>`, true)
                .addField("GUILD_ANNOUNCEMENT", `<#${process.env.GUILD_ANNOUNCEMENT}>`, true)
                .addField("GUILD_INVITE_CHANNEL", `<#${process.env.GUILD_INVITE_CHANNEL}>`, true)
                .addField("GUILD_WARNING_ONE", `<@&${process.env.GUILD_WARNING_ONE}>`, true)
                .addField("GUILD_WARNING_TWO", `<@&${process.env.GUILD_WARNING_TWO}>`, true)
                .addField("GUILD_WARNING_THREE", `<@&${process.env.GUILD_WARNING_THREE}>`, true)
                .addField("PROCESS_VERSION", process.version, true)
                .addField("MESSAGE_ID", message.id, true)
        }

        return message.message.channel.send(embed).then(() => {
            return true;
        }).catch(() => {
            return false;
        });
    },
} as Command;