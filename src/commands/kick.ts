import { Command, messageObj, Permissions } from '../models';
import { postModlog } from '../utils/modlog';
import { Client } from 'discord.js';

module.exports = {
    name: 'kick',
    description: 'Kicks a user',
    syntax: ["`[user:User Mention]` `[reason:string]`"],
    Bitmask: Permissions.KICK_USERS,
    RLPointsConsume: 2,
    HomeGuildOnly: true,
    execute: (message: messageObj, bot: Client) => {
        const user = message.message.mentions.users.first();

        if (message.arguments.length < 3) {
            return message.message.reply("You did not mention a reason for the kick!");
        }

        let shiftedargs = message.arguments;

        shiftedargs.shift();

        let banreason = shiftedargs.join(" ");

        if (user) {
            const member = message.message.guild.member(user);
            if (member) {
                member.kick(banreason)
                    .then(() => {
                        postModlog(message, message.message.author, `Kicked ${user}\nreason:\n${banreason}`);
                        message.message.reply(`${user.tag} has been kicked!`);
                    })
                    .catch(err => {
                        message.message.reply('I was unable to kicked the member');
                        console.error(err);
                    });
            } else {
                message.message.reply("That user is not on this server.");
            }
        } else {
            message.message.reply("You didn't mention the user to kick!");
        }
    },
} as Command;