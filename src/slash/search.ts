import {Command, messageObj, Permissions} from '../models';
import {Client, CommandInteraction, Interaction, MessageEmbed} from 'discord.js';
import request = require('request');

module.exports = {
    name: "search",
    syntax: [],
    RLPointsConsume: 40,
    Bitmask: Permissions.NONE,
    commandData: [{
        name: "search",
        description: "Search on search.tosdr.org",
        options: [{
            name: 'input',
            type: 'STRING',
            description: 'The query',
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

        request("https://search.tosdr.org/search?q=" + encodeURIComponent(message.options[0].value.toString()) + "&format=json", {headers: {"User-Agent": "Todd"}}, function (error, response, body) {
            if (error) {
                throw Error(error.message);
            }
            if (response.statusCode !== 200) {
                message.editReply("Hmm I received a " + response.statusCode);
                return;
            }


            let json = JSON.parse(body);

            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle(json.query)
                .setURL('https://search.tosdr.org/search?q='+ encodeURIComponent(json.query))
                .setTimestamp()
                .setFooter(json.number_of_results);

            for (const result of json.results.slice(0, 15)) {

                if(typeof result.content === 'undefined'){
                    result.content = 'No Description';
                }

                embed.addField(
                    truncate(result.title, 60, true),
                    `[${truncate(result.content, 140, true)}](${result.url})`,
                    true
                );
            }


            message.editReply(embed);
        });


    },
} as Command;