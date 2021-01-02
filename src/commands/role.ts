import { Command, messageObj } from '../models';
import * as StripTags from 'striptags';
import * as fs from "fs";
import { Client, MessageEmbed } from 'discord.js';
import { loadCommands } from '../utils/load-commands';

module.exports = {
    name: 'role',
    description: 'Assign yourself a role!',
    syntax: "role {RoleName}",
    RLPointsConsume: 0,
    priviliged: false,
    execute: (message: messageObj, bot: Client) => {
        let availableRoles = process.env.GUILD_ASSIGN_ROLES.split(",");


        if (message.message.channel.type == "dm") {
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Uhhhh')
                .setImage('https://justinback.jbcdn.net/captures/firefox_DWJSg0xmV2.png');

            message.message.channel.send(embed);
            return;
        }
        if (message.message.guild.id != process.env.GUILD_HOME) {
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Uhhhh, on the ToS;DR Server??')
                .setImage('https://justinback.jbcdn.net/captures/firefox_DWJSg0xmV2.png');

            message.message.channel.send(embed);
            return;
        }

        if (message.argument.length == 0) {
            function paginate(arr: Array<any>, size: number) {
                return arr.reduce((acc, val, i) => {
                    let idx = Math.floor(i / size)
                    let page = acc[idx] || (acc[idx] = [])
                    page.push(val)

                    return acc
                }, [])
            }

            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle("Available Roles")
                .setDescription(`Choose the roles below!`)
                .setTimestamp();

            let page = 0;
            if (/^\d+$/.test(message.argument)) {
                page = Number.parseInt(message.argument) - 1;
            }

            let pages = paginate(availableRoles, 6);

            if (page > (pages.length - 1) || page < 0) {
                message.message.channel.send("No dawg, invalid page!");
                return;
            }

            embed.setFooter(`Page ${page + 1}/${pages.length}`);


            pages[page].forEach(function (role: string) {
                embed.addField(role, process.env.BOT_PREFIX + "role " + role);
            });

            message.message.channel.send(embed).then(() => {
                return true;
            }).catch((err) => {
                throw Error(err.message);
            });
            return;
        }

        if (!availableRoles.includes(message.argument)) {
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('You cannot give yourself that role!')
                .setImage('https://justinback.jbcdn.net/captures/firefox_DWJSg0xmV2.png');

            message.message.channel.send(embed).catch((err) => {
                throw Error(err.message);
            });
            return;
        }


        let role = message.message.guild.roles.cache.find(role => role.name === message.argument);


        if (!role) {
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('I cannot find the ' + message.argument + ' role on this server!')
                .setImage('https://justinback.jbcdn.net/captures/firefox_DWJSg0xmV2.png');

            message.message.channel.send(embed).catch((err) => {
                throw Error(err.message);
            });
            return;
        }

        if (message.message.member.roles.cache.has(role.id)) {
            message.message.member.roles.remove(role).then(() => {
                message.message.channel.send("Hippity hoppity, your role is my property! *Wooooosh* **Your role has disappeared**");
            }).catch((err) => {
                throw Error(err.message);
            });
        } else {
            message.message.member.roles.add(role).then(() => {
                message.message.channel.send("Woop woop, new role for you!");
            }).catch((err) => {
                throw Error(err.message);
            });
        }

    },
} as Command;