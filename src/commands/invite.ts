import { Command, messageObj } from '../models';
import * as StripTags from 'striptags';
import * as fs from "fs";
import { Client, MessageEmbed, TextChannel } from 'discord.js';
import { loadCommands } from '../utils/load-commands';

module.exports = {
    name: 'invite',
    description: 'Get an invite to the ToS;DR Server',
    syntax: "invite",
    RLPointsConsume: 100,
    priviliged: false,
    execute: (message: messageObj, bot: Client) => {


        bot.guilds.fetch(process.env.GUILD_HOME)
            .then(guild => {
                if (process.env.GUILD_INVITE_CHANNEL.length == 0) {
                    message.message.channel.send("No channel has been set in the homeserver");
                    return;
                }
                bot.channels.fetch(process.env.GUILD_INVITE_CHANNEL)
                    .then(channel => {
                        (channel as TextChannel).createInvite({
                            reason: "Priviliged command executed",
                            unique: true
                        }).then(invite => {
                            (message.message.channel).send(invite.url);
                        });
                    }).catch((err) => {
                        throw Error(err.message);
                    });

            })
            .catch((err) => {
                throw Error(err.message);
            });
        return;



    },
} as Command;