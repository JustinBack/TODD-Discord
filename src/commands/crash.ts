import { Command, messageObj } from '../models';
import * as StripTags from 'striptags';
import * as fs from "fs";
import { Client, MessageEmbed } from 'discord.js';
import { loadCommands } from '../utils/load-commands';

module.exports = {
	name: 'crash',
	description: ':(',
	invisible: true,
	syntax: "crash",
	RLPointsConsume: 0,
	priviliged: true,
	execute: (message: messageObj, bot: Client) => {
		throw Error("Big oof for this bot");
	},
} as Command;