import { Command, messageObj } from '../models';
import * as StripTags from 'striptags';
import * as fs from "fs";
import { Client } from 'discord.js';

module.exports = {
	name: 'version',
	description: 'Get the current version of the bot',
	syntax: "version",
	priviliged: false,
	RLPointsConsume: 2,
	execute: (message: messageObj, bot: Client) => {
		var pjson = require(__dirname + '/../../package.json');
		message.message.channel.send(`I am running on version ${pjson.version}!\n\nDetails:\nDB_HOST=${process.env.MYSQL_HOST}\nREDIS_HOST=${process.env.REDIS_HOST}\nMESSAGE_ID=${message.id}`).then(() => {
			return true;
		}).catch(() => {
			return false;
		});
	},
} as Command;