import { Command, messageObj, Permissions } from '../models';
import { Client } from 'discord.js';
import { bitmaskNames } from '../utils/bitmask-names';
import { Pool } from 'mysql2';
import { rword } from 'rword';

if(process.env.DO_NOT_LOAD_MOD_TOOLS){
	throw new Error("Not loading! DO_NOT_LOAD_MOD_TOOLS is true");
}

module.exports = {
	name: 'claimrole',
	description: 'Claim a role using a role key',
	invisible: false,
	syntax: ["`[rolekey:Your Role key]` - _Claim a role using the `rolekey`._"],
	RLPointsConsume: 50,
	Bitmask: Permissions.NONE,
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

			let roleKey = message.arguments.join(" ");

			let [results, fields]: any = await database.promise().query("SELECT * FROM RoleKey WHERE RoleKey = ?", [roleKey]);

			console.log(roleKey, results);
			if (results.length === 0) {
				return message.message.reply("Invalid Role Key!");
			}
			if(results[0].Claimed){
				return message.message.reply("The Role has already been claimed!");
			}
			const guild = (bot.guilds.cache.get(process.env.GUILD_HOME));

			const role = guild.roles.cache.get(results[0].Role);

			if (!role) {
				return message.message.reply("I was not able to find the role associated to the key, contact Staff.");
			}

			const member = guild.members.cache.get(message.message.author.id);

			if(member.roles.cache.has(role.id)){
				return message.message.reply("You seem to already have the role!");
			}


			member.roles.add(role.id);

			message.message.reply("Successfully claimed the Role Key!");

			await database.promise().query("UPDATE RoleKey SET Claimed = 1 WHERE RoleKey = ?", [roleKey])



		} else {
			message.message.reply("Insufficient parameters.");
		}
	},
} as Command;