import { Command, messageObj, Permissions } from '../models';
import { Client } from 'discord.js';

module.exports = {
	name: 'crash',
	description: ':(',
	invisible: true,
	syntax: ["- _Crashes me :-(_"],
	RLPointsConsume: 0,
	Bitmask: Permissions.CRASH_BOT,
	execute: (message: messageObj, bot: Client) => {
		throw Error("Big oof for this bot");
	},
} as Command;