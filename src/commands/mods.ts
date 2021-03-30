import { Command, messageObj, Permissions } from '../models';
import { postModlog } from '../utils/modlog';
import { Client, MessageEmbed, TextChannel } from 'discord.js';

module.exports = {
    name: 'mods',
    description: `Send a help request to <#${process.env.GUILD_ERRORS}>`,
    syntax: ["`[text:String]`"],
    Bitmask: Permissions.CALL_MODS,
    RLPointsConsume: 2,
    RequiredEnvs: ["GUILD_HOME", "GUILD_ERRORS"],
    HomeGuildOnly: true,
    execute: (message: messageObj, bot: Client) => {
        if (message.arguments.length < 1) {
            return message.message.reply("You did not specify a text!");
        }

        const channel = (message.message.guild.channels.cache.get(process.env.GUILD_ERRORS) as TextChannel);

        if (!channel) {
            return message.message.reply("Could not find channel " + process.env.GUILD_ERRORS);
        }


        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle(`Mods unite! ✊`)
            .setDescription(message.arguments.join(" ")+`\n\nThe SOS has been sent from <#${message.message.channel.id}>`)
            .setTimestamp();
        channel.send(`@here`, { embed }).then(() => {
            message.message.delete();
        });

    },
} as Command;