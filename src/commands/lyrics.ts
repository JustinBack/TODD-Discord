import { Command, messageObj, Permissions } from '../models';
import { Client, MessageEmbed } from 'discord.js';
import { Pool } from 'mysql2';
const ftl = require("findthelyrics");
import * as util from 'util';

module.exports = {
    name: 'lyrics',
    description: 'Lookup the lyrics of a song',
    syntax: ["`[song_name:String]`"],
    RLPointsConsume: 0,
    Bitmask: Permissions.NONE,
    execute: async (message: messageObj, bot: Client, database: Pool) => {

        let wholechunk = message.arguments.join(" ").split("-");



        if (wholechunk.length !== 2) {
            return message.message.reply("Invalid input, the arguments should look like this `Artist - Song Name`");
        }

        let songname = wholechunk[1].trim();
        let artist = wholechunk[0].trim();

        message.message.channel.startTyping();
        ftl.find(artist, songname, function (err: any, resp: any) {
            if (err) {
                message.message.channel.stopTyping();
                return message.message.reply(util.inspect(err));
            }

            let split = resp.match(/(.|[\r\n]){1,2000}/g);


            for (var i in split) {
                let page = Number.parseInt(i) + 1;
                const embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle(`${message.arguments.join(" ")} | ${page}/${split.length}`)
                    .setDescription(split[i]);
                message.message.channel.send(embed)
            }

            message.message.channel.stopTyping();

        });
    },
} as Command;