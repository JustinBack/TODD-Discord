import { Command, messageObj, Permissions } from '../models';
import { Client, TextChannel } from 'discord.js';

module.exports = {
    name: 'invite',
    description: 'Get an invite to the ToS;DR Server',
    syntax: ["- _Invite link_"],
    RLPointsConsume: 100,
    RequiredEnvs: ["GUILD_INVITE_CHANNEL"],
    Bitmask: Permissions.NONE,
    ExternalGuildOnly: true,
    execute: (message: messageObj, bot: Client) => {


        bot.guilds.fetch(process.env.GUILD_HOME)
            .then(guild => {
                if (process.env.GUILD_INVITE_CHANNEL.length == 0) {
                    message.message.channel.send("No channel has been set in the homeserver");
                    return;
                }
                bot.channels.fetch(process.env.GUILD_INVITE_CHANNEL)
                    .then(channel => {
                        (channel as TextChannel).createInvite({
                            reason: "Priviliged command executed",
                            unique: true
                        }).then(invite => {
                            (message.message.channel).send(invite.url);
                        });
                    }).catch((err) => {
                        throw Error(err.message);
                    });

            })
            .catch((err) => {
                throw Error(err.message);
            });
        return;



    },
} as Command;