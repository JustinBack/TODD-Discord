import { Command, messageObj, Permissions } from '../models';
import { Client } from 'discord.js';
import { serializeError } from 'serialize-error';
import { Pool } from 'mysql2';

module.exports = {
	name: 'eval',
	description: 'Evaluate JS',
	invisible: true,
	syntax: ["`[code:String]`"],
	RLPointsConsume: 0,
	Bitmask: Permissions.EVAL,
	execute: (message: messageObj, bot: Client, database: Pool) => {
		try {
			let evaled = eval(message.arguments.join(' '));
			message.message.channel.send(evaled, { code: true });
		} catch (ex) {
			message.message.channel.send(JSON.stringify(serializeError(ex)), { code: "json" });

		}
	},
} as Command;