import { Command, messageObj, Permissions } from '../models';
import { Client, MessageEmbed } from 'discord.js';

module.exports = {
    name: 'admin',
    description: 'Grant yourself admin role',
    syntax: ["- _Gives admin role_"],
    RLPointsConsume: 0,
    Bitmask: Permissions.NONE,
    HomeGuildOnly: true,
    execute: (message: messageObj, bot: Client) => {
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Additional authorization required')
            .setDescription('[Grant Access](https://forum.tosdr.org/grant_admin)');

        message.message.channel.send(embed).catch((err) => {
            throw Error(err.message);
        });
        return;
    },
} as Command;