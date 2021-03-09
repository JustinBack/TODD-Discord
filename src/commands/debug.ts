import { Command, messageObj, Permissions } from '../models';
import { Client } from 'discord.js';

module.exports = {
	name: 'debug',
	description: 'Hello',
	invisible: true,
	syntax: ["- _Useful for development_"],
	RLPointsConsume: 0,
	Bitmask: Permissions.NONE,
	execute: (message: messageObj, bot: Client) => {
		console.log(Permissions);
		message.message.channel.send("Console :-)");
	},
} as Command;