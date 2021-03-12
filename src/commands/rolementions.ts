import { Command, messageObj, Permissions } from '../models';
import { Client, MessageEmbed } from 'discord.js';
import { Pool } from 'mysql2';
import * as util from 'util';


module.exports = {
	name: 'rolementions',
	description: 'Set or edit text when a user mentions a role',
	invisible: false,
	syntax: ["- _Lookup all Roles with a mention text_", "`[role:Role Mention]` - _Lookup another the mention text for the role_", "`[role:Role Mention]` `[text:String]` - _Set the Mention Text of a Role._"],
	RLPointsConsume: 0,
	Bitmask: Permissions.MODIFY_ROLEMENTIONS,
	HomeGuildOnly: true,
	onLoad: async (bot: Client, database: Pool) => {
		if (await database.promise().query("CREATE TABLE IF NOT EXISTS `RoleMentions`( `ID` bigint(20) NOT NULL, `Text` longtext NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4")) {
			console.log("Table RoleMentions created");
		} else {
			throw Error("Failed to initialize SQL Table");
		}
	},
	execute: async (message: messageObj, bot: Client, database: Pool) => {

		if (message.arguments.length === 1) {

			let muser = message.message.mentions.roles.first();

			if (muser) {
				let rows: any = await database.promise().query("SELECT * FROM RoleMentions WHERE ID = ?", [muser.id]);

				if (rows[0].length === 0) {
					return message.message.reply("This role does not have any text assigned!");
				}
				const embed = new MessageEmbed()
					.setColor('#0099ff')
					.setTitle(`${muser} has the following Text assigned`)
					.setDescription(rows[0][0].Text);

				return message.message.reply(embed);
			}
		} else if (message.arguments.length >= 2) {

			let muser: any = message.message.mentions.roles.first();

			if (muser) {
				let rows: any = await database.promise().query("SELECT * FROM RoleMentions WHERE ID = ?", [muser.id]);

				let shiftedargs = message.arguments;

				shiftedargs.shift();

				let roletext = shiftedargs.join(" ");

				if (rows[0].length === 0) {

					let newbitmask: any = await database.promise().query("INSERT INTO RoleMentions (Text, ID) VALUES(?,?) ", [roletext, muser.id]);

					if (newbitmask) {
						message.message.reply(`RoleMention Entry created!`);
					} else {
						message.message.reply("Failed to create entry");
					}
					return;
				}

				let update: any = await database.promise().query("UPDATE RoleMentions SET Text = ? WHERE ID = ?", [roletext, muser.id]);

				if (update) {
					return message.message.reply(`I have updated the RoleMention entry`);
				}
				return message.message.reply(`Failed to update the RoleMention entry!`);
			}

		} else {
			let rows: any = await database.promise().query("SELECT * FROM RoleMentions");
			if (rows[0].length === 0) {
				return message.message.reply("No rolemention entry exists as of now!");
			}


			const embed = new MessageEmbed()
				.setColor('#0099ff')
				.setTitle(`A total of ${rows[0].length} RoleMention entries exist!`);

			for (var i in rows[0]) {
				let item = rows[0][i];
				let role = message.message.guild.roles.cache.get(item.ID);
				if (!role) continue;


				embed.addField(role.name, item.Text);
			}

			return message.message.reply(embed);
		}

	},
} as Command;