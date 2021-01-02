"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    name: 'invite',
    description: 'Get an invite to the ToS;DR Server',
    syntax: "invite",
    RLPointsConsume: 100,
    priviliged: false,
    execute: (message, bot) => {
        bot.guilds.fetch(process.env.GUILD_HOME)
            .then(guild => {
            if (process.env.GUILD_INVITE_CHANNEL.length == 0) {
                message.message.channel.send("No channel has been set in the homeserver");
                return;
            }
            bot.channels.fetch(process.env.GUILD_INVITE_CHANNEL)
                .then(channel => {
                channel.createInvite({
                    reason: "Priviliged command executed",
                    unique: true
                }).then(invite => {
                    (message.message.channel).send(invite.url);
                });
            }).catch(() => {
                message.message.channel.send("Failed to fetch channel!");
            });
        })
            .catch(() => {
            message.message.channel.send("No homeserver has been set!");
        });
        return;
    },
};
//# sourceMappingURL=invite.js.map