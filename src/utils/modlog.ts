import { MessageEmbed, User, TextChannel } from 'discord.js';
import { messageObj } from '../models';


export function postModlog(User: User, Text: string) {

    const guild = (User.client.guilds.cache.get(process.env.GUILD_HOME));

    const channel = (guild.channels.cache.get(process.env.GUILD_MODLOG) as TextChannel);

    if (!channel) return;


    const embed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle("Mod Action")
        .setDescription(Text)
        .addField("Acting User", User)
        .setTimestamp();
    channel.send(embed);
}