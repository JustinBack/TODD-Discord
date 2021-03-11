import { Command, messageObj, Permissions } from '../models';
import { postModlog } from '../utils/modlog';
import { Client, MessageEmbed } from 'discord.js';

module.exports = {
    name: 'unwarn',
    description: `Unwarns a user`,
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
            return message.message.reply("You did not mention a user for the unwarning!");
        }

        if (message.arguments.length < 2) {
            return message.message.reply("You did not mention a reason for the unwarning!");
        }

        let shiftedargs = message.arguments;

        shiftedargs.shift();

        let warnreason = shiftedargs.join(" ");

        if (user) {
            const member = message.message.guild.member(user);
            if (member) {
                if (member.roles.cache.has(WarningOneRole.id)) {
                    member.roles.remove(WarningOneRole).then(() => {

                        message.message.channel.send(`${user} has no more warnings`);
                        postModlog(message, message.message.author, `Removed warnings for ${user}\n\n${warnreason}`);
                        user.send(`Hi there, just a heads up: Your warnings on ${message.message.guild.name} have been removed.\n\nreason:\n${warnreason}`);
                    }).catch((err) => {
                        throw Error(err.message);
                    });
                } else if (member.roles.cache.has(WarningTwoRole.id)) {
                    member.roles.remove(WarningTwoRole).then(() => {
                        member.roles.add(WarningOneRole).then(() => {
                            message.message.channel.send(`${user}: Lowered warning`);
                            postModlog(message, message.message.author, `Lowered Warning of ${user} from ${WarningTwoRole} to ${WarningOneRole}\n\n${warnreason}`);

                            user.send(`Hi there, just a heads up: Your Tier Two warning on ${message.message.guild.name} has been lowered to Tier One.\n\nreason:\n${warnreason}`);
                        }).catch((err) => {
                            throw Error(err.message);
                        });
                    }).catch((err) => {
                        throw Error(err.message);
                    });
                } else if (member.roles.cache.has(WarningThreeRole.id)) {
                    member.roles.remove(WarningThreeRole).then(() => {
                        member.roles.add(WarningTwoRole).then(() => {
                            message.message.channel.send(`${user}: Lowered warning`);
                            postModlog(message, message.message.author, `Lowered Warning of ${user} from ${WarningThreeRole} to ${WarningTwoRole}\n\n${warnreason}`);

                            user.send(`Hi there, just a heads up: Your Tier Three warning on ${message.message.guild.name} has been lowered to Tier Two.\n\nreason:\n${warnreason}`);
                        }).catch((err) => {
                            throw Error(err.message);
                        });
                    }).catch((err) => {
                        throw Error(err.message);
                    });
                } else {
                    message.message.channel.send("This user has no warnings!");
                }
            } else {
                message.message.reply("That user is not on this server.");
            }
        } else {
            message.message.reply("You didn't mention the user to warn!");
        }
    },
} as Command;