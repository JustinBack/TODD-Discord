import { Command, messageObj } from '../models';
import { Client, MessageEmbed } from 'discord.js';

module.exports = {
    name: 'bugreport',
    description: 'Submit a bug to us!',
    syntax: "bugreport",
    priviliged: false,
    RLPointsConsume: 2,
    execute: (message: messageObj, bot: Client) => {
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle("Bugreport")
            .setDescription(`To submit a bug report, use the links below`)
            .addField("Phoenix (edit.tosdr.org)", "[Report a bug](https://to.tosdr.org/phoenix-bug-report)\n[Suggest a feature](https://to.tosdr.org/phoenix-feature)")
            .addField("Crisp (tosdr.org)", "[Report a bug](https://to.tosdr.org/crisp-bug-report)\n[Suggest a feature](https://to.tosdr.org/crisp-feature)")
            .addField("Phoenix Crawler (crawler.tosdr.org)", "[Report a bug](https://to.tosdr.org/crawler-bug-report)\n[Suggest a feature](https://to.tosdr.org/crawler-feature)")
            .addField("Browser Extensions", "[Report a general bug](https://to.tosdr.org/extension-general-bug)\n---\n[Report a bug for Firefox](https://to.tosdr.org/extension-firefox-bug)\n[Report a bug for Edge](https://to.tosdr.org/extension-edge-bug)\n[Report a bug for Opera](https://to.tosdr.org/extension-opera-bug)\n[Report a bug for Chrome](https://to.tosdr.org/extension-chrome-bug)\n[Report a bug for Safari](https://to.tosdr.org/extension-safari-bug)\n---\n[Suggest a feature](https://to.tosdr.org/extension-feature)")
            .addField("Me! T.O.D.D", "[Report a bug](https://to.tosdr.org/todd-bug-report)\n[Suggest a feature](https://to.tosdr.org/todd-feature)")
            .addField("DocBot", "[Report a bug](https://to.tosdr.org/docbot-bug-report)\n[Suggest a feature](https://to.tosdr.org/docbot-feature)")
            .setTimestamp();

        message.message.channel.send(embed).then(() => {
            return true;
        }).catch(() => {
            return false;
        });
    },
} as Command;