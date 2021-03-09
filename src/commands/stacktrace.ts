import { Command, messageObj, Permissions } from '../models';
import { Client } from 'discord.js';
import * as crypto from 'crypto';

module.exports = {
    name: 'stacktrace',
    description: 'Decrypt stacktraces',
    invisible: false,
    syntax: ["`[stacktrace:String]`"],
    RLPointsConsume: 0,
    Bitmask: Permissions.READ_STACKTRACE,
    execute: (message: messageObj, bot: Client) => {

        let Crypt = message.argument.split(".");



        try {

            const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(process.env.BOT_CRASH_SECRET), Buffer.from(Crypt[0], 'hex'));

            let decrypted = decipher.update(Crypt[1], 'hex') + decipher.final('utf8');

            message.message.channel.send(JSON.stringify(JSON.parse(decrypted), null, 4), { code: "js" });
        } catch (exception) {
            console.log(exception);
            message.message.channel.send("Sorry, that Stacktrace is invalid!");
        }
    },
} as Command;