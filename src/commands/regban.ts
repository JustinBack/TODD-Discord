import { Command, messageObj, Permissions } from '../models';
import { postModlog } from '../utils/modlog';
import { Client, MessageEmbed } from 'discord.js';
import { Pool } from 'mysql2';




module.exports = {
    name: 'regban',
    description: `Ban a user from a region channel`,
    syntax: ["`[user:User Mention]` `[reason:string]`"],
    Bitmask: Permissions.NONE,
    RequiredEnvs: ["GUILD_HOME", "GUILD_MODLOG", "REG_GERMAN", "REG_FRENCH", "REG_SPANISH", "REG_DUTCH", "REG_PORTUGESE"],
    RLPointsConsume: 2,
    HomeGuildOnly: true,
    execute: (message: messageObj, bot: Client) => {

        let German = process.env.REG_GERMAN.split(":");
        let French = process.env.REG_FRENCH.split(":");
        let Spanish = process.env.REG_SPANISH.split(":");
        let Dutch = process.env.REG_DUTCH.split(":");
        let Portugese = process.env.REG_PORTUGESE.split(":");

        let GermanChannel = message.message.guild.channels.cache.get(German[0]);
        let GermanMod = message.message.guild.roles.cache.get(German[1]);
        let GermanBan = message.message.guild.roles.cache.get(German[2]);

        let FrenchChannel = message.message.guild.channels.cache.get(French[0]);
        let FrenchMod = message.message.guild.roles.cache.get(French[1]);
        let FrenchBan = message.message.guild.roles.cache.get(French[2]);

        let SpanishChannel = message.message.guild.channels.cache.get(Spanish[0]);
        let SpanishMod = message.message.guild.roles.cache.get(Spanish[1]);
        let SpanishBan = message.message.guild.roles.cache.get(Spanish[2]);

        let DutchChannel = message.message.guild.channels.cache.get(Dutch[0]);
        let DutchMod = message.message.guild.roles.cache.get(Dutch[1]);
        let DutchBan = message.message.guild.roles.cache.get(Dutch[2]);

        let PortugeseChannel = message.message.guild.channels.cache.get(Portugese[0]);
        let PortugeseMod = message.message.guild.roles.cache.get(Portugese[1]);
        let PortugeseBan = message.message.guild.roles.cache.get(Portugese[2]);




        if (!GermanMod || !GermanBan || !FrenchMod || !FrenchBan || !SpanishMod || !SpanishBan || !DutchMod || !DutchBan || !PortugeseBan || !PortugeseMod) {
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('I cannot find a role for the regional channels on this server!');

            message.message.channel.send(embed).catch((err) => {
                throw Error(err.message);
            });
            return;
        }

        if (!GermanChannel || !FrenchChannel || !SpanishChannel || !DutchChannel || !PortugeseChannel) {
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('I cannot find a channel for the regional channels on this server!');

            message.message.channel.send(embed).catch((err) => {
                throw Error(err.message);
            });
            return;
        }

        let SelectedBan;
        let SelectedChannel;
        let SelectedMod;

        if (message.message.channel === GermanChannel && message.message.member.roles.cache.has(GermanMod.id)) {
            SelectedBan = GermanBan;
            SelectedChannel = GermanChannel;
            SelectedMod = GermanMod;
        } else if (message.message.channel === FrenchChannel && message.message.member.roles.cache.has(FrenchMod.id)) {
            SelectedBan = FrenchBan;
            SelectedChannel = FrenchChannel;
            SelectedMod = FrenchMod;
        } else if (message.message.channel === SpanishChannel && message.message.member.roles.cache.has(SpanishMod.id)) {
            SelectedBan = SpanishBan;
            SelectedChannel = SpanishChannel;
            SelectedMod = SpanishMod;
        } else if (message.message.channel === DutchChannel && message.message.member.roles.cache.has(DutchMod.id)) {
            SelectedBan = DutchBan;
            SelectedChannel = DutchChannel;
            SelectedMod = DutchMod;
        } else if (message.message.channel === PortugeseChannel && message.message.member.roles.cache.has(PortugeseMod.id)) {
            SelectedBan = PortugeseBan;
            SelectedChannel = PortugeseChannel;
            SelectedMod = PortugeseMod;
        } else {
            return message.message.reply("You do not have access to the command in this channel!");
        }


        const user = message.message.mentions.users.first();

        if (message.arguments.length < 1) {
            return message.message.reply("You did not mention a user for the ban!");
        }

        if (message.arguments.length < 2) {
            return message.message.reply("You did not mention a reason for the ban!");
        }

        let shiftedargs = message.arguments;

        shiftedargs.shift();

        let warnreason = shiftedargs.join(" ");

        if (user) {
            const member = message.message.guild.member(user);
            if (member) {

                if (member.roles.cache.has(SelectedBan.id)) {
                    member.roles.remove(SelectedBan.id);
                    message.message.reply(`${member} has been unbanned from this channel!`);
                    postModlog(message.message.author, `Banned ${user} from the regional channel ${SelectedChannel}\n\n${warnreason}`);
                } else {
                    member.roles.add(SelectedBan.id);
                    postModlog(message.message.author, `Unbanned ${user} from the regional channel ${SelectedChannel}\n\n${warnreason}`);
                }



            } else {
                message.message.reply("That user is not on this server.");
            }
        } else {
            message.message.reply("You didn't mention the user to warn!");
        }
    },
} as Command;