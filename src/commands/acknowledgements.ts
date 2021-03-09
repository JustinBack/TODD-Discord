import { Command, messageObj, Permissions } from '../models';
import { Client, MessageEmbed } from 'discord.js';

module.exports = {
    name: 'acknowledgements',
    description: 'Or as most people call, "credits"',
    syntax: ["- _All people who helped with the bot_"],
    Bitmask: Permissions.NONE,
    RLPointsConsume: 0,
    execute: (message: messageObj, bot: Client) => {
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle("T.O.D.D")
            .setDescription(`People improving the bot`)
            .addField("Chew", "Command suggestions", true)
            .addField("Azara", "Pentest stuff", true)
            .setTimestamp();

        message.message.channel.send(embed).then(() => {
            return true;
        }).catch(() => {
            return false;
        });
    },
} as Command;