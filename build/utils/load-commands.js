"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadCommands = void 0;
const fs = require("fs");
const path = require("path");
const color = require("chalk");
function loadCommands() {
    const files = fs.readdirSync(path.join(__dirname, '../commands'));
    const commands = new Map();
    const errored = [];
    files.forEach((file) => {
        fs.lstat(path.join(__dirname, '../commands/' + file), (err, stats) => {
            if (err) {
                console.log(color.red(`[LSTAT ERROR]`), color.cyan(file));
                return;
            }
            if (stats.isFile()) {
                const command = require(`../commands/${file}`);
                if (!command) {
                    errored.push(file);
                    console.log(color.red(`Failed to load command file`), color.cyan(file));
                }
                else {
                    console.log(color.magenta(`Loaded command`), color.cyan(command.name));
                    commands.set(command.name, command);
                }
            }
        });
    });
    if (errored.length >= 1) {
        console.log(color.yellow('A few commands have failed to load: %s', color.cyan(errored.join(', '))));
        console.log(color.green(`Successfully loaded ${color.cyan(commands.size)} commands`));
    }
    else {
        console.log(color.green(`Successfully loaded all ${color.cyan(commands.size)} commands!`));
    }
    return commands;
}
exports.loadCommands = loadCommands;
//# sourceMappingURL=load-commands.js.map