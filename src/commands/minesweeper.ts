import { Command, messageObj, Permissions } from '../models';
import { Client, MessageEmbed } from 'discord.js';
import { Pool } from 'mysql2';
import * as util from 'util';
const Minesweeper = require('discord.js-minesweeper');

module.exports = {
    name: 'minesweeper',
    description: 'Play Minesweeper',
    syntax: ["`[rows:Integer]` - How many rows should be used? Default is `9`", "`[rows:Integer]` `[columns:Integer]` - How many rows and columns should be used? Default is `9` `9`", "`[rows:Integer]` `[columns:Integer]` `[mines:Integer]` - How many rows, columns and mines should be used? Default is `9` `9` `10`"],
    RLPointsConsume: 0,
    Bitmask: Permissions.NONE,
    execute: async (message: messageObj, bot: Client, database: Pool) => {

        let rows = Number.parseInt(message.arguments[0]) || 9;
        let columns = Number.parseInt(message.arguments[1]) || 9;
        let mines = Number.parseInt(message.arguments[2]) || 10;


        if (rows > 12) return message.message.reply("The amount of rows is insane, go lower!");
        if (columns > 12) return message.message.reply("The amount of columns is insane, go lower!");
        if (columns > 15) return message.message.reply("The amount of mines is insane, go lower!");


        const minesweeper = new Minesweeper({ rows, columns, mines });
        const matrix = minesweeper.start();
        return (matrix ? message.message.channel.send(`rows: ${rows}\ncolumns: ${columns}\nmines: ${mines}\n${matrix}`).catch(() => message.message.reply("That is too long!")) : message.message.channel.send('Data you have provided is not valid. Check your parameters'));
    },
} as Command;