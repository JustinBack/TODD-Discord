import { Command, messageObj } from '../models';
import * as StripTags from 'striptags';
import * as fs from "fs";
import { Client, MessageEmbed } from 'discord.js';
import { loadCommands } from '../utils/load-commands';
import { Connection, Pool } from 'mysql';

module.exports = {
    name: 'poll',
    description: 'Create a new poll',
    invisible: false,
    syntax: "poll {Channel} {PollName}",
    RLPointsConsume: 0,
    priviliged: true,
    execute: (message: messageObj, bot: Client, database: Pool) => {

        if (message.message.channel.type == "dm") {
            message.message.channel.send("Nope, don't do this in a direct message!");
            return;
        }

        let channel = message.message.mentions.channels.first();

        if (!channel) {
            message.message.channel.send("This channel does not exist!");
            return;
        }

        let _args = message.arguments;
        let UntilDate = new Date(new Date().getTime() + 60 * 60 * 24 * 1000).toISOString().slice(0, 19).replace('T', ' ');

        _args.shift();
        _args.shift();

        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle("Server Poll")
            .setFooter("Poll will run until " + UntilDate + " UTC")
            .setDescription(_args.join(" "));

        channel.send(embed)
            .then(msg => {
                database.query("INSERT INTO Polls (MessageID, ChannelID, Until, PollText) VALUES (?,?,?,?)", [msg.id, channel.id, UntilDate, _args.join(" ")], function (err) {
                    if (err) {
                        msg.delete();
                        throw Error(err.message);
                    }
                    msg.react("<:GoodToS:766156681649979423>")
                        .then(() => msg.react("<:BadToS:766156681997582376>"))
                        .then(() => msg.react("<:NeutralToS:766156682002300968>"))
                        .catch((reacterror) => {
                            msg.delete().then(() => {
                                database.query("DELETE FROM POLLS WHERE MessageID = ?", [msg.id]);
                                throw Error(reacterror.message);
                            });
                        })
                        .then(() => {

                            const embed = new MessageEmbed()
                                .setColor('#0099ff')
                                .setTitle("Server Poll")
                                .setFooter("Poll will run until " + UntilDate)
                                .setDescription(_args.join(" "));

                            embed.addField("**Votes**", "------");
                            msg.reactions.cache.forEach(function (Reaction) {
                                embed.addField(`<:${Reaction.emoji.identifier}>`, Reaction.count - 1, true);
                            });
                            msg.edit(embed).catch((err) => {
                                throw Error(err.message);
                            });
                        });
                });
            });

    },
} as Command;