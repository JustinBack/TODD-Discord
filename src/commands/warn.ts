import { Command, messageObj, Permissions } from '../models';
import { postModlog } from '../utils/modlog';
import { Client, MessageEmbed } from 'discord.js';

module.exports = {
    name: 'warn',
    description: `Warn a user`,
    syntax: ["`[user:User Mention]` `[reason:string]`"],
    Bitmask: Permissions.WARN_USERS,
    RLPointsConsume: 2,
    HomeGuildOnly: true,
    execute: (message: messageObj, bot: Client) => {

        let WarningOneRole = message.message.guild.roles.cache.get(process.env.GUILD_WARNING_ONE);
        let WarningTwoRole = message.message.guild.roles.cache.get(process.env.GUILD_WARNING_TWO);
        let WarningThreeRole = message.message.guild.roles.cache.get(process.env.GUILD_WARNING_THREE);


        if (!WarningOneRole) {
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('I cannot find the Warning One role on this server!');

            message.message.channel.send(embed).catch((err) => {
                throw Error(err.message);
            });
            return;
        }

        if (!WarningTwoRole) {
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('I cannot find the Warning Two role on this server!');

            message.message.channel.send(embed).catch((err) => {
                throw Error(err.message);
            });
            return;
        }

        if (!WarningThreeRole) {
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('I cannot find the Warning Three role on this server!');

            message.message.channel.send(embed).catch((err) => {
                throw Error(err.message);
            });
            return;
        }

        const user = message.message.mentions.users.first();

        if (message.arguments.length < 1) {
            return message.message.reply("You did not mention a user for the warning!");
        }

        if (message.arguments.length < 2) {
            return message.message.reply("You did not mention a reason for the warning!");
        }

        let shiftedargs = message.arguments;

        shiftedargs.shift();

        let warnreason = shiftedargs.join(" ");

        if (user) {
            const member = message.message.guild.member(user);
            if (member) {
                if (member.roles.cache.has(WarningOneRole.id)) {
                    member.roles.remove(WarningOneRole).then(() => {
                        member.roles.add(WarningTwoRole).then(() => {
                            message.message.channel.send(`${user} is now on ${WarningTwoRole}`);
                            postModlog(message.message.author, `Warned ${user} on ${WarningTwoRole}\n\n${warnreason}`);
                            user.send(`Hi there, just a heads up: You have been warned on ${message.message.guild.name} at Tier 2.\n\nreason:\n${warnreason}`);
                        }).catch((err) => {
                            throw Error(err.message);
                        });
                    }).catch((err) => {
                        throw Error(err.message);
                    });
                } else if (member.roles.cache.has(WarningTwoRole.id)) {
                    member.roles.remove(WarningTwoRole).then(() => {
                        member.roles.add(WarningThreeRole).then(() => {
                            message.message.channel.send(`${user} is now on ${WarningThreeRole}`);
                            postModlog(message.message.author, `Warned ${user} on ${WarningThreeRole}\n\n${warnreason}`);
                            user.send(`Hi there, just a heads up: You have been warned on ${message.message.guild.name} at Tier 3.\n\nreason:\n${warnreason}`);
                        }).catch((err) => {
                            throw Error(err.message);
                        });
                    }).catch((err) => {
                        throw Error(err.message);
                    });
                } else {
                    member.roles.add(WarningOneRole).then(() => {
                        message.message.channel.send(`${user} is now on ${WarningOneRole}`);
                        postModlog(message.message.author, `Warned ${user} on ${WarningOneRole}\n\n${warnreason}`);
                        user.send(`Hi there, just a heads up: You have been warned on ${message.message.guild.name} at Tier 1.\n\nreason:\n${warnreason}`);
                    }).catch((err) => {
                        throw Error(err.message);
                    });
                }
            } else {
                message.message.reply("That user is not on this server.");
            }
        } else {
            message.message.reply("You didn't mention the user to warn!");
        }
    },
} as Command;