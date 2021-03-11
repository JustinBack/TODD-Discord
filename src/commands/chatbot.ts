import { Command, messageObj, Permissions } from '../models';
import { Client, MessageEmbed } from 'discord.js';
import { Pool } from 'mysql2';
import * as util from 'util';


module.exports = {
	name: 'chatbot',
	description: 'Set or edit text when a user mentions a keyword',
	invisible: false,
	syntax: ["- _Lookup all texts with a keyword", "`[keyword:String]` - _Lookup another the text for the keywords_", "`[keyword:String]` `[text:String]` - _Set the Mention Text of a Role._"],
	RLPointsConsume: 0,
	Bitmask: Permissions.MODIFY_CHATBOT,
	HomeGuildOnly: true,
	execute: async (message: messageObj, bot: Client, database: Pool) => {

		let args = message.arguments;
		args.shift();
		let keywords: Array<String> = [];
		if (message.arguments.length >= 2) {
			keywords = message.arguments[0].split(",");
		}
		let text = args.join(" ");

		if (message.arguments.length >= 2) {


			for (var i in keywords) {

				let keyword = keywords[i];

				let rows: any = await database.promise().query("SELECT * FROM BotChat WHERE Keywords = ?", [keyword]);

				if (rows[0].length === 0) {
					await database.promise().query("INSERT INTO BotChat (Response, Keywords) VALUES(?,?) ", [text, keyword]);
					continue;
				}

				let update: any = await database.promise().query("UPDATE BotChat SET Response = ? WHERE Keywords = ?", [text, keyword]);
			}
			message.message.reply("Entries updated!");

		} else {
			let rows: any = await database.promise().query("SELECT * FROM BotChat");
			if (rows[0].length === 0) {
				return message.message.reply("No ChatBot entry exists as of now!");
			}


			const embed = new MessageEmbed()
				.setColor('#0099ff')
				.setTitle(`A total of ${rows[0].length} ChatBot entries exist!`);

			for (var i in rows[0]) {
				var item = rows[0][i];
				embed.addField(item.Keywords, item.Response);
			}

			return message.message.reply(embed);
		}

	},
} as Command;