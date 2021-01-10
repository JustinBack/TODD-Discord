import { Command, messageObj } from '../models';
import { Client, MessageEmbed } from 'discord.js';
import request = require('request');
import { stat } from 'fs/promises';

module.exports = {
    name: 'status',
    description: 'Retrieve the status of our services',
    syntax: "status",
    priviliged: false,
    RLPointsConsume: 80,
    execute: (message: messageObj, bot: Client) => {
        message.message.channel.send("Hold on... Loading!").then((msg) => {
            var twirlTimer = (function () {
                var P = ["|", "/", "—", "\\"];
                var x = 0;
                return setInterval(function () {
                    msg.edit("Hold on... Loading! " + P[x++]);
                    x &= 3;
                }, 1000);
            })();

            request(process.env.CACHET_URL + "/api/v1/components", function (error, response, body) {
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

                if (json.errors) {
                    throw Error(json.errors)
                }


                const OperationalColor = "#28a745";
                const PerformanceColor = "#3498db";
                const PartialColor = "#ffc107";
                const MajorColor = "#dc3545";
                const UnknownColor = "#6c757d";

                const OperationalEmoji = "👍";
                const PerformanceEmoji = "🐌";
                const PartialEmoji = "🤕";
                const MajorEmoji = "❌";
                const UnknownEmoji = "❓";
                let isMajor = false;
                let isPerformance = false;
                let isPartial = false


                const embed = new MessageEmbed();

                embed.setTitle("Terms of Service; Didn't Read Service Status");
                embed.setDescription("We monitor " + json.meta.pagination.total + " of our services in total!");
                embed.setURL(process.env.CACHET_URL);

                for (var index in json.data) {


                    let Service = json.data[index];
                    let Status = UnknownEmoji;

                    switch (Service.status) {
                        case 0:
                            Status = UnknownEmoji;
                            break;
                        case 1:
                            Status = OperationalEmoji;
                            break;
                        case 2:
                            Status = PerformanceEmoji;
                            isPerformance = true;
                            break;
                        case 3:
                            Status = PartialEmoji;
                            isPartial = true;
                            break;
                        case 4:
                            Status = MajorEmoji;
                            isMajor = true;
                            break;
                    }
                    embed.addField(Status + " " + Service.name, Service.status_name);
                }
                embed.addField("----", "----");

                if (isMajor) {
                    embed.addField("Major Outage", "It seems we have a major outage");
                } else if (isPartial) {
                    embed.addField("Partial Outage", "Some of our services are not working.");
                } else if (isPerformance) {
                    embed.addField("Performance Issues", "Our servers seem to be a little bit overloaded!");
                } else {
                    embed.addField("Operational", "All is working fine, maybe it's an issue on your end?");
                }


                msg.edit(embed);
            });
        });
    },
} as Command;