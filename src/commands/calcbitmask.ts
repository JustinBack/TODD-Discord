import { Command, messageObj, Permissions } from '../models';
import { Client } from 'discord.js';
import { bitmaskNames } from '../utils/bitmask-names';
import { Pool } from 'mysql2';


module.exports = {
	name: 'calcbitmask',
	description: 'Show permissions associated with the bitmask',
	invisible: false,
	syntax: ["`[bitmask:Integer64]`"],
	RLPointsConsume: 0,
	Bitmask: Permissions.NONE,
	execute: async (message: messageObj, bot: Client, database: Pool) => {

		if (message.arguments.length === 1) {

			let perms = bitmaskNames(message.arguments[0]);

			let allperms = [];


			let added = perms.filter((bit: any) => bit in Permissions);

			for (var i in added) {
				allperms.push({ int: Permissions[added[i]], text: `+ ${added[i]}: 0x${Permissions[added[i]].toString(16)} (${Permissions[added[i]]})` });
			}
			for (var i in Permissions) {
				if (!added.includes(i)) {
					allperms.push({ int: Permissions[i], text: `- ${i}: 0x${Permissions[i].toString(16)} (${Permissions[i]})` });
				}
			}

			allperms.sort((a, b) => a.int - b.int);

			let diff = '';
			allperms.forEach((item) => {
				diff += item.text + "\n";
			});

			return message.message.reply(`Bitmask: ${message.arguments[0]}!\`\`\`diff\n${diff}\`\`\``);

		}

	},
} as Command;