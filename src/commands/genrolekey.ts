import { Command, messageObj, Permissions } from '../models';
import { Client } from 'discord.js';
import { bitmaskNames } from '../utils/bitmask-names';
import { Pool } from 'mysql2';
import { rword } from 'rword';


module.exports = {
	name: 'genrolekey',
	description: 'Generate a role key to be claimed by the bot',
	invisible: false,
	syntax: ["`[role:Role Name]` `[amount:Integer64]` - _Generate `amount` of keys for the `role`._"],
	RLPointsConsume: 0,
	Bitmask: Permissions.GENERATE_ROLEKEY,
	HomeGuildOnly: false,
	onLoad: async (bot: Client, database: Pool) => {
		if (await database.promise().query("CREATE TABLE IF NOT EXISTS `RoleKey`( `ID` bigint(20) NOT NULL AUTO_INCREMENT, `RoleKey` varchar(2000) NOT NULL, `Role` bigint(20) NOT NULL, `Claimed` tinyint(1) NOT NULL DEFAULT 0, `ClaimedAt` datetime DEFAULT NULL ON UPDATE current_timestamp(), KEY `ID` (`ID`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4")) {
			console.log("Table RoleKey created");
		} else {
			throw Error("Failed to initialize SQL Table");
		}
	},
	execute: async (message: messageObj, bot: Client, database: Pool) => {
		if (message.arguments.length > 1) {

			let _args = message.arguments;
			_args.shift();
			let roleName = _args.join(" ");

			const role = message.message.guild.roles.cache.find(role => role.name === roleName)

			if (!role) {
				return message.message.reply("I was not able to find " + roleName);
			}

			let rolekeys: string[] = [];
			let origmsg = await message.message.channel.send("Generating role keys...");

			for (var i = 0; i < Number.parseInt(message.arguments[0]); i++) {
				let words: string = (rword.generate(5, { capitalize: 'first' }) as string[]).join(" ");
				rolekeys.push(words);
			}


			for(var roleKey of rolekeys){
				await database.promise().query("INSERT INTO RoleKey (RoleKey, Role) VALUES (?,?)", [roleKey, role.id]);
			}

			origmsg.edit("Generated " + rolekeys.length + " role keys. I'll send them to you via DM!");

			message.message.author.send("Here are your role keys!");
			message.message.author.send(rolekeys.join("\n"), { code: true, split: true });




		} else {
			message.message.reply("Insufficient parameters.");
		}
	},
} as Command;