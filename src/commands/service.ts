import { Command, messageObj, Permissions } from '../models';
import { Client, MessageEmbed } from 'discord.js';
import request = require('request');

module.exports = {
    name: 'service',
    description: 'Search for a service',
    syntax: ["`[service_id:Integer]` - _Lookup a service via ID_", "`[service_slug:String]` - _Lookup a service via Slug_"],
    RLPointsConsume: 40,
    Bitmask: Permissions.NONE,
    execute: (message: messageObj, bot: Client) => {


        function truncate(str: any, n: number, useWordBoundary: boolean = false) {
            if (str.length <= n) { return str; }
            const subString = str.substr(0, n - 1); // the original check
            return (useWordBoundary
                ? subString.substr(0, subString.lastIndexOf(" "))
                : subString) + "...";
        };

        message.message.channel.send("Hold on... Loading!").then((msg) => {
            var twirlTimer = (function () {
                var P = ["|", "/", "—", "\\"];
                var x = 0;
                return setInterval(function () {
                    msg.edit("Hold on... Loading! " + P[x++]);
                    x &= 3;
                }, 1000);
            })();

            request("https://tosdr.org/api/v2/service/" + message.argument + ".json", function (error, response, body) {
                if (error) {
                    throw Error(error.message);
                }
                if (response.statusCode !== 200) {
                    message.message.channel.send("Hmm I received a " + response.statusCode);
                    clearInterval(twirlTimer);
                    return;
                }

                clearInterval(twirlTimer);


                let json = JSON.parse(body);

                if (json.error) {
                    msg.edit("Hmm, seems that service does not exist!").then(() => {
                        return true;
                    }).catch((err) => {
                        throw Error(err.message);
                    });
                    return;
                }

                console.log(json.parameters.id);

                const embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(json.parameters.name)
                    .setURL('https://tosdr.org/en/service/' + json.parameters.id)
                    .setDescription(`${json.parameters.name} has \`${Object.keys(json.parameters.links).length}\` Documents and \`${json.parameters.points.length}\` Points`)
                    .setImage('https://shields.tosdr.org/' + json.parameters.slug + '.png')
                    .setThumbnail(json.parameters.image)
                    .setTimestamp()
                    .setFooter("https://tosdr.org/api/v2/service/" + message.argument + ".json");

                for (var index in json.parameters.points.slice(0, 10)) {


                    let pointData = json.parameters.pointsData[json.parameters.points[index]];

                    embed.addField(
                        truncate(pointData.title, 60),
                        "[" + truncate(pointData.tosdr.tldr, 100) + "](https://edit.tosdr.org/points/" + pointData.id + ")",
                        true
                    );
                }

                msg.edit("Here is your result!", embed);
            });

        });
    },
} as Command;