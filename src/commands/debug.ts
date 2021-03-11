import { Command, messageObj, Permissions } from '../models';
import { Client } from 'discord.js';


if (!process.env.DEV_MODE) {
	throw new Error("DEV_MODE is false. Skipping");
}

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