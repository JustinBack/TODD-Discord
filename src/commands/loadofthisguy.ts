import { Command, messageObj, Permissions } from '../models';
import { Client, MessageEmbed } from 'discord.js';

module.exports = {
    name: 'galotg',
    description: 'Get a load of this guy!',
    syntax: ["- _Why_"],
    Bitmask: Permissions.NONE,
    RLPointsConsume: 2,
    execute: (message: messageObj, bot: Client) => {
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle("Get a load of this guy")
            .setImage("https://i.redd.it/jum9zr9dxz051.jpg");

        message.message.channel.send(embed).then(() => {
            return true;
        }).catch(() => {
            return false;
        });
    },
} as Command;