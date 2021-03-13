import { Command, messageObj, Permissions } from '../models';
import { Client } from 'discord.js';
import { imageHash } from 'image-hash';
import { Pool } from 'mysql2';
var compare = require('hamming-distance');
const AntiSpam = require('../utils/anti-spam');

module.exports = {
	name: 'phash',
	description: ':(',
	invisible: true,
	syntax: ["- _Generates the pHash out of an image_"],
	RLPointsConsume: 0,
	Bitmask: Permissions.EVAL,
	onLoad: async (bot: Client, database: Pool) => {
		if (await database.promise().query("CREATE TABLE IF NOT EXISTS `pHashes`( `ID` bigint(20) NOT NULL, `pHash` longtext NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4")) {
			console.log("Table pHashes created");
		} else {
			throw Error("Failed to initialize SQL Table");
		}
	},
	execute: async (message: messageObj, bot: Client, database: Pool) => {

		if (message.arguments[0] === "reindex") {
			let users = message.message.guild.members.cache;

			users.each(async (member: any) => {
				let user = member.user;

				let [rows]: any = await database.promise().query("SELECT * FROM pHashes WHERE ID = ?", [user.id]);

				if (rows.length === 0) {
					if (!user.avatarURL({ format: "jpg" })) return;
					imageHash(user.avatarURL({ format: "jpg" }), 16, true, async (error: any, pHash: any) => {
						if (error) return console.error;
						let [insert]: any = await database.promise().query("INSERT INTO pHashes (ID, pHash) VALUES (?, ?)", [user.id, pHash]);

						console.log(insert);
					});
				}

			});
			message.message.reply("Reindexed");
			return;
		}


		function getUserFromMention(mention: any) {
			if (!mention) return;

			if (mention.startsWith('<@') && mention.endsWith('>')) {
				mention = mention.slice(2, -1);

				if (mention.startsWith('!')) {
					mention = mention.slice(1);
				}

				return bot.users.cache.get(mention);
			}
		}

		let firstUser = getUserFromMention(message.arguments[0]);
		let secondUser = getUserFromMention(message.arguments[1]);

		if (!firstUser) {
			return message.message.reply("Could not find the first user!");
		}
		if (!secondUser) {
			return message.message.reply("Could not find the second user!");
		}
		if (!firstUser.avatarURL({ format: "jpg" })) {
			return message.message.reply("Could not find the avatar from the first user!");
		}

		if (!secondUser.avatarURL({ format: "jpg" })) {
			return message.message.reply("Could not find the avatar from the second user!");
		}


		imageHash(firstUser.avatarURL({ format: "jpg" }), 16, true, (error: any, hashFirst: any) => {
			if (error) throw error;
			imageHash(secondUser.avatarURL({ format: "jpg" }), 16, true, (error: any, hashSecond: any) => {
				if (error) throw error;
				let hemmingdistance = compare(new Buffer(hashFirst, 'hex'), new Buffer(hashSecond, 'hex'));
				message.message.reply(`First: ${hashFirst}\nSecond: ${hashSecond}\n\nHemming Distance: ${hemmingdistance}`, { code: true });
			});
		});
	},
} as Command;