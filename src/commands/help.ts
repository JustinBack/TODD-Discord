import { Command, messageObj, Permissions } from '../models';
import { Client, MessageEmbed } from 'discord.js';
import { Pool } from 'mysql2';

module.exports = {
    name: 'help',
    description: 'This screen',
    syntax: ["- _Overview of all commands_", "`[command:String]`", "`[page:Integer]`"],
    RLPointsConsume: 0,
    Bitmask: Permissions.NONE,
    execute: async (message: messageObj, bot: Client, database: Pool) => {


        let CurrentUser: any = await database.promise().query("SELECT * FROM Permissions WHERE ID = ?", [message.message.author.id]);
        CurrentUser = CurrentUser[0][0];

        function paginate(arr: Array<any>, size: number) {
            return arr.reduce((acc, val, i) => {
                let idx = Math.floor(i / size)
                let page = acc[idx] || (acc[idx] = [])
                page.push(val)

                return acc
            }, [])
        }
        if (/^\d+$/.test(message.argument) || message.argument.length == 0) {

            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle("Bot Commands")
                .setDescription(`Hi, I am T.O.D.D your **TO**s;**D**r **D**iscord Bot!`)
                .setTimestamp();

            let page = 0;
            if (/^\d+$/.test(message.argument)) {
                page = Number.parseInt(message.argument) - 1;
            }

            let commandArray = Array<any>();

            message.commands.forEach(function (command: Command) {
                if (command.invisible) return;
                if (command.Bitmask !== 0 && !CurrentUser) return;
                if (command.Bitmask !== 0 && !(CurrentUser["Bitmask"] & command.Bitmask)) return;
                if (command.HomeGuildOnly && message.message.guild.id !== process.env.GUILD_HOME) return;
                if (command.ExternalGuildOnly && message.message.guild.id === process.env.GUILD_HOME) return;
                if (command.GuildOnly && message.message.channel.type == "dm") return;
                if (command.DMOnly && message.message.channel.type != "dm") return;

                commandArray.push(command);

            });
            let pages = paginate(commandArray, 6);

            if (page > (pages.length - 1) || page < 0) {
                message.message.channel.send("No dawg, invalid page!");
                return;
            }

            embed.setFooter(`Page ${page + 1}/${pages.length}`);


            pages[page].forEach(function (command: Command) {
                if (!command.invisible) {
                    embed.addField(`0x${command.Bitmask.toString(16)} | __${process.env.BOT_PREFIX} ${command.name}__`, `${command.description}`);
                }
            });

            message.message.channel.send(embed).catch((err) => {
                throw Error(err.message);
            });
            return;
        } else {

            let command = message.commands.get(message.argument);

            if (!command) {
                message.message.channel.send("I was not able to find that command :/").catch((err) => {
                    throw Error(err.message);
                });
                return;
            }

            let usage = "";


            for (var i in command.syntax) {
                usage += `**${process.env.BOT_PREFIX}** __${command.name}__ ${command.syntax[i]}\n`;
            }

            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle(`0x${command.Bitmask.toString(16)} | ${process.env.BOT_PREFIX} ${command.name}`)
                .setDescription(command.description)
                .addField("Usage", usage)
                .addField("Bitmask", `\`${Object.keys(Permissions).find(key => Permissions[key] === command.Bitmask)}: 0x${command.Bitmask.toString(16)}\``);
            message.message.channel.send(embed).catch((err) => {
                throw Error(err.message);
            });
        }
    },
} as Command;