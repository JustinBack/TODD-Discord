import * as fs from 'fs';
import * as path from 'path';
import { Command } from '../models';
import { Pool } from "mysql2";
import { Client } from "discord.js";
import { Map } from '../models';
import * as color from 'chalk';
import * as cliProgress from 'cli-progress';

/**
 * Load all commands in the `commands/` folder and return a collection of
 * commands.
 */
export function loadCommands(bot: Client, database: Pool) {
	const files = fs.readdirSync(path.join(__dirname, '../commands'));
	const commands = new Map<string, Command>();
	const errored: string[] = [];

	console.log(color.cyan("Loading commands..."));
	const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
	bar1.start(files.length, 0);

	files.forEach((file) => {
		fs.lstat(path.join(__dirname, '../commands/' + file), (err: any, stats: any) => {
			if (err) {
				console.log(color.red(`[LSTAT ERROR]`), color.cyan(file));
				return;
			}


			if (stats.isFile()) {
				try {
					const command = require(`../commands/${file}`) as Command;

					if (!process.env.GUILD_HOME && command.HomeGuildOnly) throw Error("GUILD_MODLOG .env is not set.");

					for (var i in command.RequiredEnvs) {
						if (!process.env[command.RequiredEnvs[i]]) throw Error(command.RequiredEnvs[i] + " .env is not set.");
					}

					if (command.onLoad) {
						command.onLoad(bot, database);
					}
					//console.log(color.magenta(`Loaded command`), color.cyan(command.name));
					commands.set(command.name, command);
					bar1.increment();

				} catch (ex) {
					errored.push(file);
					bar1.increment();
					console.log(color.red(`Failed to load command file`), color.cyan(file), color.red(ex));
				}
			}

		});

		if (commands.size == files.length) {
			bar1.stop();
			if (errored.length > 0) {
				console.log(color.yellow('A few commands have failed to load: %s', color.cyan(errored.join(', '))));
				console.log(color.green(`Successfully loaded ${color.cyan(commands.size)} commands`));
			} else {
				console.log(color.green(`Successfully loaded all ${color.cyan(commands.size)} commands!\n`));
			}

		}
	});
	return commands;
}