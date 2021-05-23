import {Command, messageObj, Permissions} from '../models';
import {Client, CommandInteraction, Interaction, MessageEmbed} from 'discord.js';
import request = require('request');

module.exports = {
    name: "service",
    syntax: ["`[service_id:Integer]` - _Lookup a service via ID_", "`[service_slug:String]` - _Lookup a service via Slug_"],
    RLPointsConsume: 40,
    Bitmask: Permissions.NONE,
    commandData: [{
        name: "service",
        description: "Get service data",
        options: [{
            name: 'input',
            type: 'INTEGER',
            description: 'The service ID',
            required: true,
        }],
    }],
    execute: async (message: CommandInteraction, bot: Client) => {

        await message.defer();


        function truncate(str: any, n: number, useWordBoundary: boolean = false) {
            if (str.length <= n) {
                return str;
            }
            const subString = str.substr(0, n - 1); // the original check
            return (useWordBoundary
                ? subString.substr(0, subString.lastIndexOf(" "))
                : subString) + "...";
        }


        request("https://api.tosdr.org/v2/service/" + message.options[0].value.toString() + ".json", {headers: {"User-Agent": "Todd"}}, function (error, response, body) {
            if (error) {
                throw Error(error.message);
            }
            if (response.statusCode !== 200) {
                if (response.statusCode === 404) {
                    const embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle("Service does not exist")
                        .setDescription(`I haven't found any service with the ID ${message.options[0].value.toString()}`)
                        .setTimestamp();

                    return message.editReply(embed);
                }
                message.editReply("Hmm I received a " + response.statusCode);
                return;
            }


            let json = JSON.parse(body);

            if (!(json.error & 0x100)) {
                message.editReply("Hmm, seems that service does not exist! " + json.error).then(() => {
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
                .setFooter("https://api.tosdr.org/v2/service/" + message.options[0].value.toString() + ".json");

            for (var index in json.parameters.points.slice(0, 10)) {


                let pointData = json.parameters.pointsData[json.parameters.points[index]];

                embed.addField(
                    truncate(pointData.title, 60),
                    "[" + truncate(pointData.tosdr.tldr, 100) + "](https://edit.tosdr.org/points/" + pointData.id + ")",
                    true
                );
            }


            message.editReply(embed);
        });


    },
} as Command;