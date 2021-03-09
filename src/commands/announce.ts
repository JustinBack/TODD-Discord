import { Command, messageObj, Permissions } from '../models';
import { postModlog } from '../utils/modlog';
import { Client, MessageEmbed, TextChannel } from 'discord.js';

module.exports = {
    name: 'announce',
    description: `Send an announcement to <#${process.env.GUILD_ANNOUNCEMENT}>`,
    syntax: ["`[text:String]`"],
    Bitmask: Permissions.MAKE_ANNOUNCEMENTS,
    RLPointsConsume: 2,
    HomeGuildOnly: true,
    execute: (message: messageObj, bot: Client) => {
        if (message.arguments.length < 1) {
            return message.message.reply("You did not specify a text!");
        }

        const channel = (message.message.guild.channels.cache.get(process.env.GUILD_ANNOUNCEMENT) as TextChannel);

        if (!channel) {
            return message.message.reply("Could not find channel " + process.env.GUILD_ANNOUNCEMENT);
        }


        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle("Server Announcement")
            .setDescription(message.arguments.join(" "))
            .setTimestamp();
        channel.send(message.message.guild.roles.everyone.id, { embed }).then(() => {
            message.message.delete();
            postModlog(message, message.message.author, "Posted an announcement\n\ntext:\n" + message.arguments.join(" "))
        });

    },
} as Command;