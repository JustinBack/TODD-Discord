import { Command, messageObj, Permissions } from '../models';
import { postModlog } from '../utils/modlog';
import { Client } from 'discord.js';

if(process.env.DO_NOT_LOAD_MOD_TOOLS){
    throw new Error("Not loading! DO_NOT_LOAD_MOD_TOOLS is true");
}

module.exports = {
    name: 'purge',
    description: 'Purge a user, delete all messages from the last 7 days',
    syntax: ["`[user:User Mention]` `[reason:string]`"],
    Bitmask: Permissions.PURGE_USERS,
    RLPointsConsume: 2,
    RequiredEnvs: ["GUILD_HOME", "GUILD_MODLOG"],
    HomeGuildOnly: true,
    execute: (message: messageObj, bot: Client) => {
        const user = message.message.mentions.users.first();

        if (message.arguments.length < 3) {
            return message.message.reply("You did not mention a reason for the ban and purge!");
        }

        let shiftedargs = message.arguments;

        shiftedargs.shift();

        let banreason = shiftedargs.join(" ");

        if (user) {
            const member = message.message.guild.members.cache.get(user.id);
            if (member) {
                member.ban({ days: 7, reason: banreason })
                    .then(() => {
                        postModlog(message.message.author, `Purged ${user}\nreason:\n${banreason}`);
                        message.message.reply(`${user.tag} has been banned and purged!`);
                    })
                    .catch((err: any) => {
                        message.message.reply('I was unable to purge and ban the member');
                        console.error(err);
                    });
            } else {
                message.message.reply("That user is not on this server.");
            }
        } else {
            message.message.reply("You didn't mention the user to ban and purge!");
        }
    },
} as Command;