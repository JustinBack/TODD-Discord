import { Command, messageObj } from '../models';
import { Client, MessageEmbed } from 'discord.js';

module.exports = {
    name: 'bugreport',
    description: 'Submit a bug to us!',
    syntax: "bugreport",
    priviliged: false,
    RLPointsConsume: 2,
    execute: (message: messageObj, bot: Client) => {
        var pjson = require(__dirname + '/../package.json');


        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle("Bugreport")
            .setDescription(`To submit a bug report, use the links below`)
            .addField("Phoenix (edit.tosdr.org)", "[Report a bug](https://github.com/tosdr/edit.tosdr.org/issues/new?labels=bug)\n[Report a feature](https://github.com/tosdr/edit.tosdr.org/issues/new?labels=request)")
            .addField("Crisp (tosdr.org)", "[Report a bug](https://github.com/tosdr/CrispCMS/issues/new?labels=bug)\n[Suggest a feature](https://github.com/tosdr/CrispCMS/discussions/new?category=ideas)")
            .addField("Browser Extensions", "[Report a general bug](https://github.com/tosdr/browser-extensions/issues/new?labels=bug)\n---\n[Report a bug for Firefox](https://github.com/tosdr/browser-extensions/issues/new?assignees=&labels=bug,firefox&template=bug-report-firefox.md&title=)\n[Report a bug for Edge](https://github.com/tosdr/browser-extensions/issues/new?assignees=&labels=bug,edge&template=bug-report-edge.md&title=)\n[Report a bug for Opera](https://github.com/tosdr/browser-extensions/issues/new?assignees=&labels=bug%2C+opera&template=bug-report-opera.md&title=)\n[Report a bug for Chrome](https://github.com/tosdr/browser-extensions/issues/new?assignees=&labels=bug%2C+chrome&template=bug-report-chrome.md&title=)\n[Report a bug for Safari](https://github.com/tosdr/browser-extensions/issues/new?assignees=&labels=bug%2C+safari&template=bug-report-safari.md&title=)\n---\n[Suggest a feature](https://github.com/tosdr/browser-extensions/discussions/new?category=ideas)")
            .addField("Me! T.O.D.D", "[Report a bug](https://github.com/JustinBack/TODD-Discord/issues/new?labels=bug)\n[Suggest a feature](https://github.com/JustinBack/TODD-Discord/discussions/new?category=ideas)")
            .addField("DocBot", "[Report a bug](https://github.com/JustinBack/DocBot-Server/issues/new?labels=bug)\n[Suggest a feature](https://github.com/JustinBack/DocBot-Server/discussions/new?category=ideas)")
            .setTimestamp();

        message.message.channel.send(embed).then(() => {
            return true;
        }).catch(() => {
            return false;
        });
    },
} as Command;