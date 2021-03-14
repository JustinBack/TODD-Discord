import { Command, messageObj, Permissions } from '../models';
import { Client } from 'discord.js';
import { bitmaskNames } from '../utils/bitmask-names';
import { Pool } from 'mysql2';
import { loadCommands } from '../utils/load-commands';

module.exports = {
	name: 'grant',
	description: 'Grant access to a list of commands (comma seperated).',
	invisible: false,
	syntax: ["`[user:User Mention]` `[command_comma_delimited:String]` - _Grant access to a command_"],
	RLPointsConsume: 0,
	Bitmask: Permissions.MODIFY_BITMASKS,
	HomeGuildOnly: false,
	onLoad: async (bot: Client, database: Pool) => {
		if (await database.promise().query("CREATE TABLE IF NOT EXISTS `Permissions` (`ID` bigint(20) NOT NULL,`Bitmask` bigint(20) NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4")) {
			console.log("Table Permissions created");
		} else {
			throw Error("Failed to initialize SQL Table");
		}
	},
	execute: async (message: messageObj, bot: Client, database: Pool) => {

		if (message.arguments.length === 2) {
			let muser: any = message.message.mentions.users.first();

			if (muser) {

				let rows: any = await database.promise().query("SELECT * FROM Permissions WHERE ID = ?", [muser.id]);

				if (rows[0].length === 0) {

					let newbitmask: any = await database.promise().query("INSERT INTO Permissions (Bitmask, ID) VALUES(?,?) ", [Permissions.NONE, muser.id]);

					if (!newbitmask) {
						throw new Error("Failed to create bitmask account");
					}
				}

				let Account: any = await database.promise().query("SELECT * FROM Permissions WHERE ID = ?", [muser.id]);
				Account = Account[0][0];


				let args = message.arguments;

				args.shift();

				let commandlist = args.join(" ").split(",");


				let processed = [];
				let errors = [];
				let newbitmask = Number.parseInt(Account["Bitmask"]);

				for (var command of commandlist) {
					command = command.trim();

					let execCommand = message.commands.get(command);


					if (!execCommand) {
						errors.push(command);
						continue;
					} else if (execCommand.Bitmask == Permissions.NONE) {
						errors.push(command);
						continue;
					} else if (Account["Bitmask"] & execCommand.Bitmask) {
						errors.push(command);
						continue;
					}
					newbitmask = (newbitmask + execCommand.Bitmask);
				}

				let update: any = await database.promise().query("UPDATE Permissions SET Bitmask = ? WHERE ID = ?", [newbitmask, muser.id]);

				if (update) {
					let newPerms = bitmaskNames(newbitmask);

					let removed = bitmaskNames(Account["Bitmask"]).filter((bit: any) => !newPerms.includes(bit));
					let added = newPerms.filter((bit: any) => !bitmaskNames(Account["Bitmask"]).includes(bit));
					let keep = newPerms.filter((bit: any) => !added.includes(bit) && !removed.includes(bit));

					let diff = '';

					for (var i in removed) {
						diff += `- ${removed[i]}\n`;
					}
					for (var i in added) {
						diff += `+ ${added[i]}\n`;
					}
					for (var i in keep) {
						diff += `@ ${keep[i]}\n`;
					}



					return message.message.reply(`I have updated the bitmask! \`\`\`diff\n${diff}\`\`\``);
				}
				return message.message.reply(`Failed to update the bitmask!`);

			}

		} else {
			message.message.reply("Invalid arguments");
		}
	},
} as Command;