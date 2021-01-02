import * as fs from 'fs';
import * as path from 'path';

import { Command } from '../models';
import { Map } from '../models';
import * as color from 'chalk';

/**
 * Load all commands in the `commands/` folder and return a collection of
 * commands.
 */
export function loadCommands() {
	const files = fs.readdirSync(path.join(__dirname, '../commands'));
	const commands = new Map<string, Command>();
	const errored: string[] = [];

	files.forEach((file) => {
		fs.lstat(path.join(__dirname, '../commands/' + file), (err: any, stats: any) => {
			if (err) {
				console.log(color.red(`[LSTAT ERROR]`), color.cyan(file));
				return;
			}


			if (stats.isFile()) {

				const command = require(`../commands/${file}`) as Command;

				if (!command) {
					errored.push(file);
					console.log(color.red(`Failed to load command file`), color.cyan(file));
				} else {
					console.log(color.magenta(`Loaded command`), color.cyan(command.name));
					commands.set(command.name, command);
				}

			}

		});
	});

	if (errored.length >= 1) {
		console.log(color.yellow('A few commands have failed to load: %s', color.cyan(errored.join(', '))));
		console.log(color.green(`Successfully loaded ${color.cyan(commands.size)} commands`));
	} else {
		console.log(color.green(`Successfully loaded all ${color.cyan(commands.size)} commands!`));
	}

	return commands;
}