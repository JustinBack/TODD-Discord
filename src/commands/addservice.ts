import { Command, messageObj, Permissions } from '../models';
import { Client, MessageEmbed } from 'discord.js';

module.exports = {
    name: 'addservice',
    description: 'Add a new service.',
    syntax: ["- _Send our guides on how to add a service_"],
    Bitmask: Permissions.NONE,
    RLPointsConsume: 2,
    execute: (message: messageObj, bot: Client) => {

        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle("Add new service")
            .setDescription(`To add a new service, refer to the links below`)
            .addField("Request a service", "https://to.tosdr.org/request")
            .setTimestamp();

        message.message.channel.send(embed).then(() => {
            return true;
        }).catch(() => {
            return false;
        });
    },
} as Command;