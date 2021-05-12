import { Command, messageObj, Permissions } from '../models';
import {Client, MessageEmbed, TextChannel} from 'discord.js';
import { Pool } from 'mysql2';
import { postModlog } from '../utils/modlog';

module.exports = {
    name: 'poll',
    description: 'Create a new poll',
    invisible: false,
    syntax: ["`[channel:Channel Mention]` `[text:String]`"],
    RLPointsConsume: 0,
    Bitmask: Permissions.MAKE_POLLS,
    RequiredEnvs: ["GUILD_HOME", "GUILD_MODLOG"],
    HomeGuildOnly: true,
    onLoad: async (bot: Client, database: Pool) => {
        if (await database.promise().query("CREATE TABLE IF NOT EXISTS `Polls`( `MessageID` bigint(20) DEFAULT NULL, `ChannelID` bigint(20) DEFAULT NULL, `Until` datetime DEFAULT NULL, `PollText` text DEFAULT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4")) {
            console.log("Table Polls created");
        } else {
            throw Error("Failed to initialize SQL Table");
        }

        if (await database.promise().query("CREATE TABLE IF NOT EXISTS `Reactions`( `MessageID` bigint(20) DEFAULT NULL, `UserID` bigint(20) DEFAULT NULL, `Reaction` text DEFAULT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4")) {
            console.log("Table Reactions created");
        } else {
            throw Error("Failed to initialize SQL Table");
        }
    },
    execute: (message: messageObj, bot: Client, database: Pool) => {

        if (message.message.channel.type == "dm") {
            message.message.channel.send("Nope, don't do this in a direct message!");
            return;
        }

        let channel = message.message.mentions.channels.first() as TextChannel;

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
            .then((msg: any) => {
                database.query("INSERT INTO Polls (MessageID, ChannelID, Until, PollText) VALUES (?,?,?,?)", [msg.id, channel.id, UntilDate, _args.join(" ")], function (err) {
                    if (err) {
                        msg.delete();
                        throw Error(err.message);
                    }
                    msg.react("<:GoodToS:815821338299072533>")
                        .then(() => msg.react("<:BadToS:815821341264838656>"))
                        .then(() => msg.react("<:NeutralToS:815821347074080799>"))
                        .catch((reacterror: any) => {
                            msg.delete().then(() => {
                                database.query("DELETE FROM Polls WHERE MessageID = ?", [msg.id]);
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
                            msg.reactions.cache.forEach(function (Reaction: any) {
                                embed.addField(`<:${Reaction.emoji.identifier}>`, Reaction.count - 1, true);
                            });
                            msg.edit(embed).catch((err: any) => {
                                throw Error(err.message);
                            });
                            postModlog(message.message.author, "Created A poll in <#" + channel.id + ">");
                        });
                });
            });

    },
} as Command;