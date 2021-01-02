import { Command, messageObj } from '../models';
import * as StripTags from 'striptags';
import * as fs from "fs";
import { Client, MessageEmbed } from 'discord.js';
import { loadCommands } from '../utils/load-commands';

module.exports = {
    name: 'add',
    description: 'Add me to your server',
    syntax: "add",
    RLPointsConsume: 0,
    priviliged: false,
    execute: (message: messageObj, bot: Client) => {

        bot.generateInvite({
            permissions: ["SEND_MESSAGES", "EMBED_LINKS", "READ_MESSAGE_HISTORY", "ADD_REACTIONS"]
        })
            .then(link => {
                const embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle("Add me to your Discord Server")
                    .setDescription("[Add me!](" + link + ")");

                message.message.channel.send(embed).then(() => {
                    return true;
                }).catch((err) => {
                    throw Error(err.message);
                });
            }).catch((err) => {
                throw Error(err.message);
            });

    },
} as Command;