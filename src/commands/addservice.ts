import { Command, messageObj } from '../models';
import { Client, MessageEmbed } from 'discord.js';

module.exports = {
    name: 'addservice',
    description: 'Add a new service.',
    syntax: "addservice",
    priviliged: false,
    RLPointsConsume: 2,
    execute: (message: messageObj, bot: Client) => {

        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle("Add new service")
            .setDescription(`To add a new service, refer to the links below`)
            .addField("Request a service", "https://to.tosdr.org/request")
            .addField("Guide: How-To Request a service", "https://jback.dev/x/CgBD")
            .setTimestamp();

        message.message.channel.send(embed).then(() => {
            return true;
        }).catch(() => {
            return false;
        });
    },
} as Command;