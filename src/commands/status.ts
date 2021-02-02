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

            request(process.env.CACHET_URL + "/api/services", function (error, response, body) {
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

                const OperationalEmoji = "👍";
                const MajorEmoji = "❌";
                const UnknownEmoji = "❓";
                let isMajor = false;


                const embed = new MessageEmbed();

                embed.setTitle("Terms of Service; Didn't Read Service Status");
                embed.setDescription("We monitor " + json.length + " of our services in total!");
                embed.setURL(process.env.CACHET_URL);

                for (var index in json) {


                    let Service = json[index];
                    let Status = UnknownEmoji;

                    if (Service.online) {
                        Status = OperationalEmoji;
                    } else {
                        Status = MajorEmoji;
                        isMajor = true;
                    }

                    let Latency = Service.avg_response;
                    let LatencyUnit = 'µs';
                    if (Service.avg_response > 999) {
                        LatencyUnit = 'ms';
                        Latency = (Service.avg_response / 1000);
                    }

                    let ServiceText = `[Status Page](${process.env.CACHET_URL}/service/${Service.permalink})\n`;
                    ServiceText += `Status: ${(Service.online ? "Online" : "Offline")}\n`;
                    ServiceText += `Uptime: ${Service.online_24_hours}%\n`;
                    ServiceText += `Latency: ${Latency} ${LatencyUnit}\n`;
                    ServiceText += `Incidents: ${Service.incidents.length}\n`;
                    if (Service.incidents.length > 0) {
                        ServiceText += `**---**\n`;
                        ServiceText += `- Title: *${Service.incidents[0].title}*\n`;
                        ServiceText += `- Description: *${Service.incidents[0].description}*\n`;
                        ServiceText += `- Date: *${Service.incidents[0].created_at}*\n`;
                        if (Service.incidents[0].updates.length > 0) {
                            for (var updateIndex in Service.incidents[0].updates) {
                                let Update = Service.incidents[0].updates[updateIndex];

                                ServiceText += `--- **Incident Update ${(Number.parseInt(updateIndex) + 1)}** ---\n`;
                                ServiceText += `- **Status:** *${Update.type}*\n`;
                                ServiceText += `- **Message**: *${Update.message}*\n`;
                                ServiceText += `- **Date**: *${Update.created_at}*\n`;
                            }
                        }
                    }


                    embed.addField(`${Status} ${Service.name}`, ServiceText);
                }
                embed.addField("--Status--", "----");

                if (isMajor) {
                    embed.addField("Major Outage", "It seems we have a major outage");
                } else {
                    embed.addField("Operational", "All is working fine, maybe it's an issue on your end?");
                }


                msg.edit(embed);
            });
        });
    },
} as Command;