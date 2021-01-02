"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = exports.commands = void 0;
const load_commands_1 = require("./utils/load-commands");
const process = require("process");
const mysql = require("mysql");
const dotenv = require("dotenv");
const redis = require("redis");
const color = require("chalk");
const RateLimit = require("rate-limiter-flexible");
const Discord = require("discord.js");
const models_1 = require("./models");
const discord_js_1 = require("discord.js");
console.log(color.blue("********************** Initializing ************************"));
exports.commands = load_commands_1.loadCommands();
exports.bot = new Discord.Client({ partials: ['CHANNEL', 'MESSAGE', 'REACTION'] });
dotenv.config({
    path: __dirname + "/.env"
});
console.log(color.green("Loaded environment variables!"));
var dbmaster = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});
const redisClient = redis.createClient(Number.parseInt(process.env.REDIS_PORT), process.env.REDIS_HOST, { enable_offline_queue: false });
if (process.env.REDIS_AUTH.length > 0) {
    redisClient.auth(process.env.REDIS_AUTH);
}
redisClient.on('error', (err) => {
    console.log(err);
});
const rateLimiter = new RateLimit.RateLimiterRedis({
    storeClient: redisClient,
    points: 100,
    duration: 30,
    execEvenly: false,
    blockDuration: 0,
    keyPrefix: 'toddbot',
});
console.log(color.green(`Started redis rate limiter`));
console.log(color.green(`Connection to Redis Server established on DB Index ${color.cyan(process.env.REDIS_INDEX)}`));
exports.bot.on('ready', () => {
    console.log(`Logged in as ${exports.bot.user.tag}!`);
    exports.bot.user.setPresence({
        status: 'online',
        activity: {
            name: 'in chat for ' + process.env.BOT_PREFIX + "help",
            type: 'WATCHING'
        }
    });
});
dbmaster.connect((err) => __awaiter(void 0, void 0, void 0, function* () {
    if (err) {
        if (parseInt(process.env.VERBOSITY) >= 3) {
            console.log(color.red("[ERROR]", color.magenta("<Exception Stacktrace>"), color.yellow(err.stack)));
        }
        else {
            console.log(color.red("[ERROR]", color.magenta("<Exception>"), color.yellow(err)));
        }
    }
    console.log(color.green(`Connection to Master MySQL Server established on DB ${color.cyan(process.env.MYSQL_HOST)}`));
    exports.bot.on('messageReactionRemove', (reaction, user) => __awaiter(void 0, void 0, void 0, function* () {
        if (reaction.partial) {
            try {
                yield reaction.fetch();
            }
            catch (error) {
                console.error('Something went wrong when fetching the message: ', error);
                return;
            }
        }
        if (reaction.message.guild.id != process.env.GUILD_HOME || user.bot) {
            return;
        }
        dbmaster.query("SELECT * FROM Polls WHERE MessageID = ? AND ChannelID = ?", [reaction.message.id, reaction.message.channel.id], function (err, rows) {
            return __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    console.log(err);
                    return;
                }
                if (rows.length == 0) {
                    return;
                }
                if (new Date(rows[0]["Until"]) < new Date()) {
                    return;
                }
                dbmaster.query("DELETE FROM Reactions WHERE MessageID = ? AND UserID = ? AND Reaction = ?", [reaction.message.id, user.id, reaction.emoji.toString()], function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    const embed = new discord_js_1.MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle("Server Poll")
                        .setFooter("Poll will run until " + rows[0]["Until"])
                        .setDescription(rows[0]["PollText"]);
                    embed.addField("**Votes**", "------");
                    reaction.message.reactions.cache.forEach(function (Reaction) {
                        embed.addField(Reaction.emoji.toString(), (Reaction.count == 1 ? 0 : Reaction.count - 1), true);
                    });
                    reaction.message.edit(embed);
                });
            });
        });
    }));
    exports.bot.on('messageReactionAdd', (reaction, user) => __awaiter(void 0, void 0, void 0, function* () {
        if (reaction.partial) {
            try {
                yield reaction.fetch();
            }
            catch (error) {
                console.error('Something went wrong when fetching the message: ', error);
                return;
            }
        }
        if (reaction.message.guild.id != process.env.GUILD_HOME || user.bot) {
            return;
        }
        const userReactions = reaction.message.reactions.cache.filter(reaction => reaction.users.cache.has(user.id));
        dbmaster.query("SELECT * FROM Polls WHERE MessageID = ? AND ChannelID = ?", [reaction.message.id, reaction.message.channel.id], function (err, Pollrows) {
            return __awaiter(this, void 0, void 0, function* () {
                if (Pollrows.length == 0) {
                    return;
                }
                if (new Date(Pollrows[0]["Until"]) < new Date()) {
                    for (const reaction of userReactions.values()) {
                        yield reaction.users.remove(user.id);
                    }
                    return;
                }
                dbmaster.query("SELECT * FROM Reactions WHERE MessageID = ? AND UserID = ?", [reaction.message.id, user.id], function (err, rows) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (err) {
                            console.log(err);
                            user.send("Sorry, I was unable to process your Reaction to the poll, please try again!");
                            for (const reaction of userReactions.values()) {
                                yield reaction.users.remove(user.id);
                            }
                            return;
                        }
                        if (rows.length > 0) {
                            for (const reaction of userReactions.values()) {
                                if (reaction.emoji.toString() != rows[0]["Reaction"]) {
                                    yield reaction.users.remove(user.id);
                                }
                            }
                            return;
                        }
                        dbmaster.query("INSERT INTO Reactions (MessageID, UserID, Reaction) VALUES (?,?,?)", [reaction.message.id, user.id, reaction.emoji.toString()], function (err) {
                            return __awaiter(this, void 0, void 0, function* () {
                                if (err) {
                                    console.log(err);
                                    user.send("Sorry, I was unable to process your Reaction to the poll, please try again!");
                                    for (const reaction of userReactions.values()) {
                                        yield reaction.users.remove(user.id);
                                    }
                                    return;
                                }
                                const embed = new discord_js_1.MessageEmbed()
                                    .setColor('#0099ff')
                                    .setTitle("Server Poll")
                                    .setFooter("Poll will run until " + Pollrows[0]["Until"])
                                    .setDescription(Pollrows[0]["PollText"]);
                                embed.addField("**Votes**", "------");
                                reaction.message.reactions.cache.forEach(function (Reaction) {
                                    embed.addField(Reaction.emoji.toString(), (Reaction.count == 1 ? 0 : Reaction.count - 1), true);
                                });
                                reaction.message.edit(embed);
                            });
                        });
                    });
                });
            });
        });
    }));
    exports.bot.on('message', (message) => __awaiter(void 0, void 0, void 0, function* () {
        if (message.partial) {
            try {
                yield message.fetch();
            }
            catch (error) {
                console.error('Something went wrong when fetching the message: ', error);
                return;
            }
        }
        if (!message.content.startsWith(process.env.BOT_PREFIX)) {
            return;
        }
        let _messageObj = new models_1.messageObj(message, exports.commands);
        try {
            let execCommand = exports.commands.get(_messageObj.command);
            if (!execCommand) {
                return _messageObj.message.channel.send("This command does not exist, try using our help for a list of available commands!");
            }
            if (execCommand.priviliged && message.channel.type == "dm") {
                message.channel.send("You cannot run this in DMs!");
                return;
            }
            if (execCommand.priviliged && message.guild.id != process.env.GUILD_HOME) {
                exports.bot.guilds.fetch(process.env.GUILD_HOME)
                    .then(guild => {
                    if (process.env.GUILD_INVITE_CHANNEL.length == 0) {
                        message.channel.send("No channel has been set in the homeserver");
                        return;
                    }
                    exports.bot.channels.fetch(process.env.GUILD_INVITE_CHANNEL)
                        .then(channel => {
                        message.channel.send("This command can only be run in the ToS;DR Server!")
                            .then(() => {
                            channel.createInvite({
                                reason: "Priviliged command executed outside of server",
                                unique: true
                            }).then(invite => {
                                (message.channel).send(invite.url);
                            });
                        });
                    }).catch(() => {
                        message.channel.send("Failed to fetch channel!");
                    });
                })
                    .catch(() => {
                    message.channel.send("No homeserver has been set!");
                });
                return;
            }
            else if (execCommand.priviliged && !message.member.roles.cache.some(r => process.env.GUILD_PRIV_ROLES.split(",").includes(r.id))) {
                message.channel.send("You do not have permissions to run this command!");
                return;
            }
            rateLimiter.consume(_messageObj.message.author.id + "_" + _messageObj.command, execCommand.RLPointsConsume)
                .then((rateLimiterRes) => {
                if (parseInt(process.env.VERBOSITY) >= 2) {
                    console.log(color.cyan("[Consumed RL Token]"), color.magenta(`<${_messageObj.message.author.id}>`), color.yellow(execCommand.RLPointsConsume), "consumed");
                }
                try {
                    execCommand.execute(_messageObj, exports.bot, dbmaster);
                }
                catch (exception) {
                    message.channel.send("An error has occurred!");
                }
            })
                .catch((rateLimiterRes) => {
                console.log(rateLimiterRes);
                message.channel.send("Sorry, you have exceeded the rate limit for this command!");
                console.log(color.red("[ERROR]", color.magenta(`<${_messageObj.command}>`), color.yellow("Rate Limit Exceeded!")));
            });
        }
        catch (error) {
            message.channel.send("An error has occurred!");
            console.log(color.red("[ERROR]", color.magenta(`<${_messageObj.command}>`), color.yellow(error), error.stack));
        }
    }));
}));
exports.bot.login(process.env.BOT_TOKEN);
//# sourceMappingURL=bot.js.map