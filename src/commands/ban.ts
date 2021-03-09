import { Command, messageObj, Permissions } from '../models';
import { postModlog } from '../utils/modlog';
import { Client } from 'discord.js';

module.exports = {
    name: 'ban',
    description: 'Bans a user',
    syntax: ["`[user:User Mention]` `[reason:string]`"],
    Bitmask: Permissions.BAN_USERS,
    RLPointsConsume: 2,
    HomeGuildOnly: true,
    execute: (message: messageObj, bot: Client) => {
        const user = message.message.mentions.users.first();

        if (message.arguments.length < 3) {
            return message.message.reply("You did not mention a reason for the ban!");
        }

        let shiftedargs = message.arguments;

        shiftedargs.shift();

        let banreason = shiftedargs.join(" ");

        if (user) {
            const member = message.message.guild.member(user);
            if (member) {
                member.ban({ reason: banreason })
                    .then(() => {
                        postModlog(message, message.message.author, `Banned ${user}\nreason:\n${banreason}`);
                        message.message.reply(`${user.tag} has been banned!`);
                    })
                    .catch(err => {
                        message.message.reply('I was unable to ban the member');
                        console.error(err);
                    });
            } else {
                message.message.reply("That user is not on this server.");
            }
        } else {
            message.message.reply("You didn't mention the user to ban!");
        }
    },
} as Command;