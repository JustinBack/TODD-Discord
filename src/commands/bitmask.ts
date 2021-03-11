import { Command, messageObj, Permissions } from '../models';
import { Client } from 'discord.js';
import { bitmaskNames } from '../utils/bitmask-names';
import { Pool } from 'mysql2';


module.exports = {
	name: 'bitmask',
	description: 'Test if you have certain permissions or list them.',
	invisible: false,
	syntax: ["- _Lookup your bitmask_", "`[user:User Mention]` - _Lookup another users bitmask_", "`[user:User Mention]` `[bitmask:Integer64]` - _Set the bitmask of another user._"],
	RLPointsConsume: 0,
	Bitmask: Permissions.NONE,
	HomeGuildOnly: false,
	execute: async (message: messageObj, bot: Client, database: Pool) => {

		if (message.arguments.length === 1) {

			let muser = message.message.mentions.users.first();

			if (muser) {
				let rows: any = await database.promise().query("SELECT * FROM Permissions WHERE ID = ?", [muser.id]);

				if (rows[0].length === 0) {
					return message.message.reply("This user does not have any bitmask assigned!");
				}

				let perms = bitmaskNames(rows[0][0].Bitmask);

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

				return message.message.reply(`This user has a Bitmask of ${rows[0][0].Bitmask}!\n\n\`\`\`diff\n${diff}\`\`\``);
			}
		} else if (message.arguments.length === 2) {

			let CurrentUser: any = await database.promise().query("SELECT * FROM Permissions WHERE ID = ?", [message.message.author.id]);
			CurrentUser = CurrentUser[0][0];
			let muser: any = message.message.mentions.users.first();

			if (muser) {
				let rows: any = await database.promise().query("SELECT * FROM Permissions WHERE ID = ?", [muser.id]);

				if (rows[0].length === 0) {

					if (CurrentUser["Bitmask"] & Permissions.MODIFY_BITMASKS) {
						let newbitmask: any = await database.promise().query("INSERT INTO Permissions (Bitmask, ID) VALUES(?,?) ", [message.arguments[1], muser.id]);

						if (newbitmask) {
							let newPerms = bitmaskNames(message.arguments[1]);
							let diff = "";
							for (var i in newPerms) {
								diff += `+ ${newPerms[i]}\n`;
							}
							message.message.reply(`The bitmask account has been created!\n\`\`\`diff\n${diff}\`\`\``);
						}
					}
					return;
				}

				if (CurrentUser["Bitmask"] & Permissions.MODIFY_BITMASKS) {

					let Account: any = await database.promise().query("SELECT * FROM Permissions WHERE ID = ?", [muser.id]);
					Account = Account[0][0];

					let update: any = await database.promise().query("UPDATE Permissions SET Bitmask = ? WHERE ID = ?", [message.arguments[1], muser.id]);

					if (update) {
						let newPerms = bitmaskNames(message.arguments[1]);

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
				} else {
					return message.message.reply("Your account does not have the appropiate permission!");
				}
			}

		} else {
			let rows: any = await database.promise().query("SELECT * FROM Permissions WHERE ID = ?", [message.message.author.id]);
			if (rows[0].length === 0) {
				return message.message.reply("Your account does not have any bitmask assigned!");
			}
			let perms = bitmaskNames(rows[0][0].Bitmask);

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

			return message.message.reply(`You have a Bitmask of ${rows[0][0].Bitmask}!\`\`\`diff\n${diff}\`\`\``);
		}

	},
} as Command;