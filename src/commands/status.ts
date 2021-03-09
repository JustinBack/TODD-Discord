import { Command, messageObj, Permissions } from '../models';
import { Client } from 'discord.js';

module.exports = {
	name: 'status',
	description: 'Modify the status of the bot, not persistent.',
	invisible: false,
	syntax: ["`[status_text:String]`"],
	RLPointsConsume: 0,
	Bitmask: Permissions.MODIFY_STATUS,
	execute: (message: messageObj, bot: Client) => {
		if (message.arguments.length < 1) {
			return message.message.reply("You need to specify a status!");
		}

		bot.user.setPresence({
			status: 'online',
			activity: {
				name: message.arguments.join(" "),
				type: 'WATCHING'
			}
		});

		message.message.reply("The status has been updated.");
	},
} as Command;