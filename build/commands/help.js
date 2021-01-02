"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
module.exports = {
    name: 'help',
    description: 'This screen',
    syntax: "help {PageNumber}",
    RLPointsConsume: 0,
    priviliged: false,
    execute: (message, bot) => {
        function paginate(arr, size) {
            return arr.reduce((acc, val, i) => {
                let idx = Math.floor(i / size);
                let page = acc[idx] || (acc[idx] = []);
                page.push(val);
                return acc;
            }, []);
        }
        if (/^\d+$/.test(message.argument) || message.argument.length == 0) {
            const embed = new discord_js_1.MessageEmbed()
                .setColor('#0099ff')
                .setTitle("Bot Commands")
                .setDescription(`Hi, I am T.O.D.D your **TO**s;**D**r **D**iscord Bot!`)
                .setTimestamp();
            let page = 0;
            if (/^\d+$/.test(message.argument)) {
                page = Number.parseInt(message.argument) - 1;
            }
            let commandArray = Array();
            message.commands.forEach(function (command) {
                if (command.priviliged && !message.message.member.roles.cache.some(r => process.env.GUILD_PRIV_ROLES.split(",").includes(r.id))) {
                    return;
                }
                if (!command.invisible) {
                    commandArray.push(command);
                }
            });
            let pages = paginate(commandArray, 6);
            if (page > (pages.length - 1) || page < 0) {
                message.message.channel.send("No dawg, invalid page!");
                return;
            }
            embed.setFooter(`Page ${page + 1}/${pages.length}`);
            pages[page].forEach(function (command) {
                if (!command.invisible) {
                    if (command.priviliged && !message.message.member.roles.cache.some(r => process.env.GUILD_PRIV_ROLES.split(",").includes(r.id))) {
                        return;
                    }
                    if (command.priviliged) {
                        embed.addField("__" + process.env.BOT_PREFIX + command.name + "__", "**PRIVILIGED** " + command.description);
                    }
                    else {
                        embed.addField("__" + process.env.BOT_PREFIX + command.name + "__", command.description);
                    }
                }
            });
            message.message.channel.send(embed).then(() => {
                return true;
            }).catch(() => {
                return false;
            });
            return;
        }
        else {
            let command = message.commands.get(message.argument);
            if (!command) {
                message.message.channel.send("I was not able to find that command :/");
                return;
            }
            if (command.priviliged && !message.message.member.roles.cache.some(r => process.env.GUILD_PRIV_ROLES.split(",").includes(r.id))) {
                message.message.channel.send("You cannot access this command!");
                return;
            }
            const embed = new discord_js_1.MessageEmbed()
                .setColor('#0099ff')
                .setTitle(process.env.BOT_PREFIX + command.name)
                .setDescription(command.description)
                .addField("Usage", process.env.BOT_PREFIX + command.syntax);
            if (command.priviliged) {
                embed.addField("Privileged command", "This command can only be executed by predefined roles");
            }
            message.message.channel.send(embed).then(() => {
                return true;
            }).catch(() => {
                return false;
            });
        }
    },
};
//# sourceMappingURL=help.js.map