"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
module.exports = {
    name: 'add',
    description: 'Add me to your server',
    syntax: "add",
    RLPointsConsume: 0,
    priviliged: false,
    execute: (message, bot) => {
        bot.generateInvite({
            permissions: ["SEND_MESSAGES"]
        })
            .then(link => {
            const embed = new discord_js_1.MessageEmbed()
                .setColor('#0099ff')
                .setTitle("Add me to your Discord Server")
                .setDescription("[Add me!](" + link + ")");
            message.message.channel.send(embed).then(() => {
                return true;
            }).catch(() => {
                return false;
            });
        }).catch(() => {
            message.message.channel.send("Failed to generate invite link :(");
        });
    },
};
//# sourceMappingURL=add.js.map