import * as fs from 'fs';
import * as path from 'path';
import {Command} from '../models';
import {Pool} from "mysql2";
import {Client} from "discord.js";
import {Map} from '../models';
import * as color from 'chalk';
import * as cliProgress from 'cli-progress';

/**
 * Load all commands in the `commands/` folder and return a collection of
 * commands.
 */
export async function loadCommands(bot: Client, database: Pool) {
    const files = fs.readdirSync(path.join(__dirname, '../slash'));
    const commands = new Map<string, Command>();
    const errored: string[] = [];

    console.log(color.cyan("Loading slash commands..."));
    const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    bar1.start(files.length, 0);

    for (let file of files) {
        try {
            const command = require(`../slash/${file}`) as Command;

            if (!process.env.GUILD_HOME && command.HomeGuildOnly) throw Error("GUILD_MODLOG .env is not set.");

            for (var i in command.RequiredEnvs) {
                if (!process.env[command.RequiredEnvs[i]]) throw Error(command.RequiredEnvs[i] + " .env is not set.");
            }

            if (command.onLoad) {
                command.onLoad(bot, database);
            }

            commands.set(command.name, command);
            bar1.increment();

        } catch (ex) {
            errored.push(file);
            bar1.increment();
            console.log(color.red(`Failed to load command file`), color.cyan(file), color.red(ex));
        }
    }
    ;
    bar1.stop();
    if (errored.length > 0) {
        console.log(color.yellow('A few commands have failed to load: %s', color.cyan(errored.join(', '))));
        console.log(color.green(`Successfully loaded ${color.cyan(commands.size)} commands`));
    } else {
        console.log(color.green(`Successfully loaded all ${color.cyan(commands.size)} commands!\n`));
    }
    return commands;
}