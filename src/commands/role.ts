import { Command, messageObj, Permissions } from '../models';
import { Client, MessageEmbed } from 'discord.js';

module.exports = {
    name: 'role',
    description: 'Assign yourself a role!',
    syntax: ["- _List all Roles_", "`[role_name:String]` - de-/assign a role"],
    RLPointsConsume: 0,
    RequiredEnvs: ["GUILD_ASSIGN_ROLES"],
    Bitmask: Permissions.NONE,
    HomeGuildOnly: true,
    execute: (message: messageObj, bot: Client) => {
        let availableRoles = process.env.GUILD_ASSIGN_ROLES.split(",");

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
            embed.addField("ToS;DR Staff", process.env.BOT_PREFIX + " role admin");

            pages[page].forEach(function (role: string) {
                embed.addField(role, process.env.BOT_PREFIX + " role " + role);
            });

            message.message.channel.send(embed).then(() => {
                return true;
            }).catch((err) => {
                throw Error(err.message);
            });
            return;
        }

        if (message.argument == "admin") {
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle('Additional authorization required')
                .setDescription('[Grant Access](https://forum.tosdr.org/grant_admin)');

            message.message.channel.send(embed).catch((err) => {
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