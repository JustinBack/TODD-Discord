import { Command, messageObj } from '../models';
import * as StripTags from 'striptags';
import * as fs from "fs";
import { Client, MessageEmbed } from 'discord.js';
import { loadCommands } from '../utils/load-commands';

module.exports = {
	name: 'test_permissions',
	description: 'Test if you have priviliged permissions',
	invisible: true,
	syntax: "test_permissions",
	RLPointsConsume: 0,
	priviliged: true,
	execute: (message: messageObj, bot: Client) => {
		message.message.channel.send("Wohoo, you have permissions!");
	},
} as Command;