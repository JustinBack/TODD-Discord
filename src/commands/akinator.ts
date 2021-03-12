import { Command, messageObj, Permissions } from '../models';
import { Client, MessageEmbed } from 'discord.js';
import { Pool } from 'mysql2';
import * as util from 'util';
const { Aki } = require("aki-api");

const emojis = ["👍", "👎", "❔", "🤔", "🙄", "❌"];
const isPlaying = new Set();
// https://github.com/TheMaestro0/Akinator-Bot/
module.exports = {
    name: 'akinator',
    description: 'Can he guess it?',
    syntax: ["`[answer:String]` - Answer Akinators questions"],
    RLPointsConsume: 0,
    Bitmask: Permissions.NONE,
    execute: async (message: messageObj, bot: Client, database: Pool) => {

        if (isPlaying.has(message.message.author.id)) {
            return message.message.channel.send(":x: | The game already started..");
        }

        isPlaying.add(message.message.author.id);

        const aki = new Aki("en"); // Full languages list at: https://github.com/jgoralcz/aki-api

        await aki.start();

        const msg = await message.message.channel.send(new MessageEmbed()
            .setTitle(`${message.message.author.username}, Question ${aki.currentStep + 1}`)
            .setColor("RANDOM")
            .setDescription(`**${aki.question}**\n${aki.answers.map((an: any, i: any) => `${an} | ${emojis[i]}`).join("\n")}`));

        for (const emoji of emojis) await msg.react(emoji);

        const collector = msg.createReactionCollector((reaction: any, user: any) => emojis.includes(reaction.emoji.name) && user.id == message.message.author.id, {
            time: 60000 * 6
        });

        collector
            .on("end", () => isPlaying.delete(message.message.author.id))
            .on("collect", async ({
                emoji,
                users
            }) => {
                users.remove(message.message.author).catch(() => null);

                if (emoji.name == "❌") return collector.stop();

                await aki.step(emojis.indexOf(emoji.name));

                if (aki.progress >= 70 || aki.currentStep >= 78) {

                    await aki.win();

                    collector.stop();

                    message.message.channel.send(new MessageEmbed()
                        .setTitle("Is this your character?")
                        .setDescription(`**${aki.answers[0].name}**\n${aki.answers[0].description}\nRanking as **#${aki.answers[0].ranking}**\n\n[yes (**y**) / no (**n**)]`)
                        .setImage(aki.answers[0].absolute_picture_path)
                        .setColor("RANDOM"));

                    const filter = (m: any) => /(yes|no|y|n)/i.test(m.content) && m.author.id == message.message.author.id;

                    message.message.channel.awaitMessages(filter, {
                        max: 1,
                        time: 30000,
                        errors: ["time"]
                    })
                        .then(collected => {
                            const isWinner = /yes|y/i.test(collected.first().content);
                            message.message.channel.send(new MessageEmbed()
                                .setTitle(isWinner ? "Great! Guessed right one more time." : "Uh. you win")
                                .setColor("RANDOM")
                                .setDescription("I love playing with you!"));
                        }).catch(() => null);

                } else {
                    msg.edit(new MessageEmbed()
                        .setTitle(`${message.message.author.username}, Question ${aki.currentStep + 1}`)
                        .setColor("RANDOM")
                        .setDescription(`**${aki.question}**\n${aki.answers.map((an: any, i: any) => `${an} | ${emojis[i]}`).join("\n")}`));
                }
            });
    },
} as Command;