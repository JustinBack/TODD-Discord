import {loadCommands} from './utils/load-commands';
import * as loadSlashCommands from './utils/load-slash-commands';
import {postModlog} from './utils/modlog';
import * as process from 'process';
import * as mysql from 'mysql2';
import * as dotenv from 'dotenv';
import * as redis from 'redis';
import * as color from 'chalk';
import {v4 as uuidv4} from 'uuid';
import * as RateLimit from 'rate-limiter-flexible';
import * as Discord from 'discord.js';
import {Command, messageObj, Permissions} from './models';
import {exec} from 'child_process';
import {Intents, MessageEmbed, TextChannel} from 'discord.js';
import * as crypto from 'crypto';
import {serializeError} from 'serialize-error';
import * as util from 'util';
import * as fs from 'fs';
import {AntiSpamClient} from './utils/anti-spam';


let commands: Map<string, Command>;
let slashcommands: Map<string, Command>;

console.log(color.blue("********************** Initializing ************************"));

// @ts-ignore
if (process[Symbol.for("ts-node.register.instance")]) {
    process.env.DEV_MODE = "true";
    console.log(color.yellow("WARNING: Development Environment"));
} else {
    console.log("Compiled at", fs.readFileSync(__dirname + "/.compile_time", 'utf8'));
}


export const bot = new Discord.Client({
    partials: ['CHANNEL', 'MESSAGE', 'REACTION'],
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]
});

dotenv.config({
    path: __dirname + "/.env"
});
console.log(color.green("Loaded environment variables!"));

if (!process.env.BOT_TOKEN) throw new Error("BOT_TOKEN .env is not set.");
if (!process.env.BOT_PREFIX) throw new Error("BOT_PREFIX .env is not set.");
if (!process.env.MYSQL_HOST) throw new Error("MYSQL_HOST .env is not set.");
if (!process.env.MYSQL_USERNAME) throw new Error("MYSQL_USERNAME .env is not set.");
if (!process.env.MYSQL_PASSWORD) throw new Error("MYSQL_PASSWORD .env is not set.");
if (!process.env.MYSQL_DATABASE) throw new Error("MYSQL_DATABASE .env is not set.");
if (!process.env.REDIS_HOST) throw new Error("REDIS_HOST .env is not set.");
if (!process.env.REDIS_PORT) throw new Error("REDIS_PORT .env is not set.");
if (!process.env.REDIS_INDEX) throw new Error("REDIS_INDEX .env is not set.");

var dbmaster = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    supportBigNumbers: true,
    bigNumberStrings: true
});


const antiSpam = new AntiSpamClient(dbmaster);

const redisClient = redis.createClient(Number.parseInt(process.env.REDIS_PORT), process.env.REDIS_HOST, {enable_offline_queue: false});

if (process.env.REDIS_AUTH.length > 0) {
    redisClient.auth(process.env.REDIS_AUTH);
}
// It is recommended to process Redis errors and setup some reconnection strategy
redisClient.on('error', (err) => {
    console.log(err);
});


const rateLimiter = new RateLimit.RateLimiterRedis({
    // Basic options
    storeClient: redisClient,
    points: 100, // 6 points
    duration: 30, // Per second

    // Custom
    execEvenly: false, // Do not delay actions evenly
    blockDuration: 0, // Do not block if consumed more than points
    keyPrefix: 'toddbot', // must be unique for limiters with different purpose
});
console.log(color.green(`Started redis rate limiter`));

console.log(color.green(`Connection to Redis Server established on DB Index ${color.cyan(process.env.REDIS_INDEX)}`));

if (process.env.DO_NOT_LOAD_MOD_TOOLS !== "true") {
    bot.on("userUpdate", function (oldUser: any, newUser: any) {
        if (oldUser.avatarURL() != newUser.avatarURL()) {
            antiSpam.pHash(newUser, true);
        }
    });
}


if (process.env.DO_NOT_LOAD_MOD_TOOLS !== "true") {
    bot.on("guildMemberAdd", function (guildMember: any) {
        antiSpam.pHash(guildMember.user);
    });
    bot.on("guildMemberRemove", async function (guildMember: any) {
        await dbmaster.promise().query("DELETE FROM pHashes WHERE ID = ?", [guildMember.id]);
    });
}

bot.on('interaction', interaction => {
    if (!interaction.isCommand()) return;


    let execCommand = slashcommands.get(interaction.commandName);

    execCommand.execute(interaction, bot, dbmaster);


});

bot.on('ready', async () => {
    if (!bot.application?.owner) await bot.application?.fetch();

    bot.user.setPresence({
        status: 'online',
        activities: [{
            name: 'I am loading!',
            type: 'WATCHING'
        }]
    });


    slashcommands = await loadSlashCommands.loadCommands(bot, dbmaster);


    let cmddata = [];
    for (let command of slashcommands) {
        for(let subcommand of (command.pop() as Command).commandData){
            cmddata.push(subcommand);
        }
    }
    await bot.application?.commands.set([]);
    let cmdresponse = await bot.guilds.cache.get(process.env.GUILD_HOME)?.commands.set(cmddata);

    console.log(cmdresponse);


    commands = loadCommands(bot, dbmaster);

    console.log(`Logged in as ${bot.user.tag}!`);
    bot.user.setPresence({
        status: 'online',
        activities: [{
            name: 'in chat for ' + process.env.BOT_PREFIX + " help",
            type: 'WATCHING'
        }]
    });

    if (!process.env.GUILD_HOME) return;
    if (!process.env.GUILD_WARNING_ONE) return;
    if (!process.env.GUILD_WARNING_TWO) return;
    if (!process.env.GUILD_WARNING_THREE) return;
    if (!process.env.WARNING_ONE_EXPIRE) return;
    if (!process.env.WARNING_TWO_EXPIRE) return;
    if (!process.env.WARNING_THREE_EXPIRE) return;

    console.log("Starting WarningExpire job");

    let HomeGuild = bot.guilds.cache.get(process.env.GUILD_HOME);

    let WarningOneRole = HomeGuild.roles.cache.get(process.env.GUILD_WARNING_ONE);
    let WarningTwoRole = HomeGuild.roles.cache.get(process.env.GUILD_WARNING_TWO);
    let WarningThreeRole = HomeGuild.roles.cache.get(process.env.GUILD_WARNING_THREE);

    setInterval(async function () {
        let [rows, fields]: any = await dbmaster.promise().query("SELECT * FROM Warnings WHERE (Timestamp < DATE_SUB(NOW(),INTERVAL ? MINUTE) AND Tier = 1) OR (Timestamp < DATE_SUB(NOW(),INTERVAL ? MINUTE) AND Tier = 2) OR (Timestamp < DATE_SUB(NOW(),INTERVAL ? MINUTE) AND Tier = 3)", [process.env.WARNING_ONE_EXPIRE, process.env.WARNING_TWO_EXPIRE, process.env.WARNING_THREE_EXPIRE]);


        for (var i in rows) {
            let row = rows[i];

            if (row.Tier == 1) {
                const member = HomeGuild.members.cache.get(row.ID);

                if (!member) {
                    await dbmaster.promise().query("DELETE FROM Warnings WHERE ID = ?", [row.ID]);
                    continue;
                }


                postModlog(bot.user, `Tier 1 Warning for User <@${member.id}> expired, removed it.`);
                member.roles.remove(WarningOneRole);
            } else if (row.Tier == 2) {
                const member = HomeGuild.members.cache.get(row.ID);

                if (!member) {
                    await dbmaster.promise().query("DELETE FROM Warnings WHERE ID = ?", [row.ID]);
                    continue;
                }
                postModlog(bot.user, `Tier 2 Warning for User <@${member.id}> expired, removed it.`);
                member.roles.remove(WarningTwoRole);
            } else if (row.Tier == 3) {
                const member = HomeGuild.members.cache.get(row.ID);

                if (!member) {
                    await dbmaster.promise().query("DELETE FROM Warnings WHERE ID = ?", [row.ID]);
                    continue;
                }
                postModlog(bot.user, `Tier 3 Warning for User <@${member.id}> expired, removed it.`);
                member.roles.remove(WarningThreeRole);
            }
        }

    }, 5000);

});


console.log(color.green(`Connection to Master MySQL Server established on DB ${color.cyan(process.env.MYSQL_HOST)}`));


if (process.env.DO_NOT_LOAD_MOD_TOOLS !== "true") {
    bot.on('guildMemberUpdate', async (oldMember, newMember) => {


        const channel = (newMember.guild.channels.cache.get(process.env.GUILD_ERRORS) as TextChannel);

        if (!channel) return console.log("Cannot find channel!");

        let WarningOneRole = newMember.guild.roles.cache.get(process.env.GUILD_WARNING_ONE);
        let WarningTwoRole = newMember.guild.roles.cache.get(process.env.GUILD_WARNING_TWO);
        let WarningThreeRole = newMember.guild.roles.cache.get(process.env.GUILD_WARNING_THREE);
        if (oldMember.roles.cache.size < newMember.roles.cache.size) {
            if (!oldMember.roles.cache.has(WarningOneRole.id) && newMember.roles.cache.has(WarningOneRole.id)) {
                let inserted = await dbmaster.promise().query("INSERT INTO Warnings (ID, Tier) VALUES (?, ?)", [newMember.id, 1]);
                if (!inserted) {
                    newMember.roles.remove(WarningOneRole);
                    channel.send(`I failed to give <@${newMember.id}> The tier one warning due to a database error. I have removed it.`);
                }
            }
            if (!oldMember.roles.cache.has(WarningTwoRole.id) && newMember.roles.cache.has(WarningTwoRole.id)) {
                let inserted = await dbmaster.promise().query("INSERT INTO Warnings (ID, Tier) VALUES (?, ?)", [newMember.id, 2]);
                if (!inserted) {
                    newMember.roles.remove(WarningTwoRole);
                    channel.send(`I failed to give <@${newMember.id}> The tier two warning due to a database error. I have removed it.`);
                }
            }
            if (!oldMember.roles.cache.has(WarningThreeRole.id) && newMember.roles.cache.has(WarningThreeRole.id)) {
                let inserted = await dbmaster.promise().query("INSERT INTO Warnings (ID, Tier) VALUES (?, ?)", [newMember.id, 3]);
                if (!inserted) {
                    newMember.roles.remove(WarningThreeRole);
                    channel.send(`I failed to give <@${newMember.id}> The tier three warning due to a database error. I have removed it.`);
                }
            }
        }

        if (oldMember.roles.cache.size > newMember.roles.cache.size) {
            if (oldMember.roles.cache.has(WarningOneRole.id) && !newMember.roles.cache.has(WarningOneRole.id)) {
                let inserted = await dbmaster.promise().query("DELETE FROM Warnings WHERE ID = ? AND Tier = ?", [newMember.id, 1]);
                if (!inserted) {
                    newMember.roles.add(WarningOneRole);
                    channel.send(`I failed to remove <@${newMember.id}> The tier one warning due to a database error. I have added it.`);
                }
            }
            if (oldMember.roles.cache.has(WarningTwoRole.id) && !newMember.roles.cache.has(WarningTwoRole.id)) {
                let inserted = await dbmaster.promise().query("DELETE FROM Warnings WHERE ID = ? AND Tier = ?", [newMember.id, 2]);
                if (!inserted) {
                    newMember.roles.add(WarningTwoRole);
                    channel.send(`I failed to remove <@${newMember.id}> The tier two warning due to a database error. I have added it.`);
                }
            }
            if (oldMember.roles.cache.has(WarningThreeRole.id) && !newMember.roles.cache.has(WarningThreeRole.id)) {
                let inserted = await dbmaster.promise().query("DELETE FROM Warnings WHERE ID = ? AND Tier = ?", [newMember.id, 3]);
                if (!inserted) {
                    newMember.roles.add(WarningThreeRole);
                    channel.send(`I failed to remove <@${newMember.id}> The tier three warning due to a database error. I have added it.`);
                }
            }
        }

    });

    if (process.env.GUILD_HOME) {
        console.log("Started Poll Job");
        bot.on('messageReactionRemove', async (reaction, user) => {

            if (reaction.partial) {
                try {
                    await reaction.fetch();
                } catch (error) {
                    console.error('Something went wrong when fetching the message: ', error);
                    return;
                }
            }

            if (reaction.message.guild.id != process.env.GUILD_HOME || user.bot) {
                return;
            }

            dbmaster.query("SELECT * FROM Polls WHERE MessageID = ? AND ChannelID = ?", [reaction.message.id, reaction.message.channel.id], async function (err, rows: any) {

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


                dbmaster.query("DELETE FROM Reactions WHERE MessageID = ? AND UserID = ? AND Reaction = ?", [reaction.message.id, user.id, reaction.emoji.identifier], function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    const embed = new MessageEmbed()
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

        bot.on('messageReactionAdd', async (reaction, user) => {

            if (reaction.partial) {
                try {
                    await reaction.fetch();
                } catch (error) {
                    console.error('Something went wrong when fetching the message: ', error);
                    return;
                }
            }


            if (reaction.message.guild.id != process.env.GUILD_HOME || user.bot) {
                return;
            }
            const userReactions = reaction.message.reactions.cache.filter(reaction => reaction.users.cache.has(user.id));

            dbmaster.query("SELECT * FROM Polls WHERE MessageID = ? AND ChannelID = ?", [reaction.message.id, reaction.message.channel.id], async function (err, Pollrows: any) {

                if (Pollrows.length == 0) {
                    return;
                }

                if (new Date(Pollrows[0]["Until"]) < new Date()) {
                    for (const reaction of userReactions.values()) {
                        await reaction.users.remove(user.id);
                    }
                    return;
                }

                dbmaster.query("SELECT * FROM Reactions WHERE MessageID = ? AND UserID = ?", [reaction.message.id, user.id], async function (err, rows: any) {

                    if (err) {
                        console.log(err);
                        user.send("Sorry, I was unable to process your Reaction to the poll, please try again!");
                        for (const reaction of userReactions.values()) {
                            await reaction.users.remove(user.id);
                        }
                        return;
                    }
                    if (rows.length > 0) {
                        for (const reaction of userReactions.values()) {
                            if (reaction.emoji.identifier != rows[0]["Reaction"]) {
                                await reaction.users.remove(user.id);
                            }
                        }
                        return;
                    }

                    dbmaster.query("INSERT INTO Reactions (MessageID, UserID, Reaction) VALUES (?,?,?)", [reaction.message.id, user.id, reaction.emoji.identifier], async function (err) {
                        if (err) {
                            console.log(err);
                            user.send("Sorry, I was unable to process your Reaction to the poll, please try again!");
                            for (const reaction of userReactions.values()) {
                                await reaction.users.remove(user.id);
                            }
                            return;
                        }

                        const embed = new MessageEmbed()
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
    }
}


bot.on('message', async message => {
    antiSpam.message(message);
    if (message.author.bot) return;

    if (message.partial) {
        try {
            await message.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message: ', error);
            return;
        }
    }

    if (process.env.DO_NOT_LOAD_MOD_TOOLS !== "true") {
        if (process.env.GUILD_HOME && message.guild && message.guild.id === process.env.GUILD_HOME) {
            let Bitmasks: any = await dbmaster.promise().query("SELECT * FROM Permissions WHERE ID = ?", [message.author.id]);

            if (Bitmasks[0].length !== 0) {
                let Account = Bitmasks[0][0];

                if (Account["Bitmask"] & Permissions.USER_DISCOURAGED) {
                    message.delete();
                    return
                }
            }
        }
    }

    if (!message.content.startsWith(process.env.BOT_PREFIX)) {


        let Bitmasks: any = await dbmaster.promise().query("SELECT * FROM Permissions WHERE ID = ?", [message.author.id]);

        Bitmasks = (Bitmasks[0].length === 0 ? [[{"Bitmask": 0}]] : Bitmasks);

        if (Bitmasks[0].length !== 0) {
            let Account = Bitmasks[0][0];

            if (!(Account["Bitmask"] & Permissions.SKIP_ROLEMENTIONS)) {
                let RoleMentions: any = await dbmaster.promise().query("SELECT * FROM RoleMentions");
                if (RoleMentions[0].length > 0) {
                    if (message.mentions.roles.size > 0) {
                        let role: any = message.mentions.roles.first();

                        if (role) {
                            let roleRow = RoleMentions[0].filter(function (obj: any) {
                                return Object.keys(obj).some(function (key: any) {
                                    return obj[key].includes(role.id);
                                })
                            })[0];
                            if (roleRow) {
                                message.channel.send(roleRow.Text);
                            }

                        }
                    }
                }
            }

            if (process.env.DO_NOT_LOAD_MOD_TOOLS !== "true") {
                if (!(Account["Bitmask"] & Permissions.SKIP_CHATBOT)) {
                    let ChatBot: any = await dbmaster.promise().query("SELECT * FROM BotChat");
                    if (ChatBot[0].length > 0) {
                        if (process.env.GUILD_HOME && message.guild && message.guild.id === process.env.GUILD_HOME) {
                            for (var i in ChatBot[0]) {
                                let row = ChatBot[0][i];
                                if (message.content.includes(row.Keywords)) {
                                    const embed = new MessageEmbed()
                                        .setColor('#0099ff')
                                        .setTitle("Frequently Asked Questions")
                                        .setDescription(row.Response);
                                    return message.channel.send(embed);
                                }
                            }
                        }
                    }
                }
            }
        }


        return;
    }

    let _messageObj = new messageObj(message, commands);
    //_messageObj.message.channel.startTyping();

    try {


        let execCommand = commands.get(_messageObj.command);

        if (!execCommand) {
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle(process.env.BOT_PREFIX + " " + _messageObj.command)
                .setDescription(`This command does not exist, try using our \`${process.env.BOT_PREFIX} help\` command for a list of available commands`);
            return _messageObj.message.channel.send(embed);
        }

        if (execCommand.Bitmask !== 0) {
            let rows: any = await dbmaster.promise().query("SELECT * FROM Permissions WHERE ID = ?", [message.author.id]);

            if (rows[0].length === 0) {
                const embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle("Missing Bitmask Account")
                    .setDescription(`Your account does not have a bitmask assigned. Contact Staff`);
                return _messageObj.message.channel.send(embed);
            }

            let Account = rows[0][0];

            if (!(Account["Bitmask"] & execCommand.Bitmask)) {
                const embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle("Missing Permissions")
                    .setDescription(`\`\`\`${Object.keys(Permissions).find(key => Permissions[key] === execCommand.Bitmask)}: ${execCommand.Bitmask}\`\`\``);
                message.channel.send(embed);
                return;
            }
        }

        if (execCommand.HomeGuildOnly && _messageObj.message.guild.id !== process.env.GUILD_HOME) {
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle("Invalid Server")
                .setDescription(`This Command cannot be run on this server`);
            _messageObj.message.channel.send(embed);
            return;
        } else if (execCommand.ExternalGuildOnly && _messageObj.message.guild.id === process.env.GUILD_HOME) {
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle("Invalid Server")
                .setDescription(`This Command cannot be run on this server`);
            _messageObj.message.channel.send(embed);
            return;
        } else if (execCommand.DMOnly && _messageObj.message.channel.type !== "dm") {
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle("Invalid Channel Type")
                .setDescription(`This Command can only be run from DMs!`);
            _messageObj.message.channel.send(embed);
            return;
        } else if (execCommand.GuildOnly && _messageObj.message.channel.type !== "text") {
            const embed = new MessageEmbed()
                .setColor('#0099ff')
                .setTitle("Invalid Channel Type")
                .setDescription(`This Command can only be run from Guild Text Channels!`);
            _messageObj.message.channel.send(embed);
            return;
        }

        console.log("Received command");

        rateLimiter.consume(_messageObj.message.author.id + "_" + _messageObj.command, execCommand.RLPointsConsume)
            .then(() => {
                execCommand.execute(_messageObj, bot, dbmaster);
                //_messageObj.message.channel.stopTyping(true);
            })
            .catch((exception) => {

                if (typeof exception._remainingPoints != "undefined") {
                    message.channel.send("Seems you hit the ratelimit, try again later, in like 30 secs");
                    return;
                }

                var pjson = require(__dirname + '/package.json');

                const embed = new MessageEmbed();

                let iv = crypto.randomBytes(16);
                let StackTrace;
                if (process.env.BOT_CRASH_SECRET) {

                    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(process.env.BOT_CRASH_SECRET), iv);
                    StackTrace = cipher.update(JSON.stringify(serializeError(exception)));

                    StackTrace = Buffer.concat([StackTrace, cipher.final()]);

                    embed.setColor('#0099ff')
                        .setTitle("Woops! I crashed...")
                        .setDescription("```" + iv.toString('hex') + "." + StackTrace.toString('hex') + "```")
                        .addField("What to do?", "Report the bug using the string above")
                        .addField("Bugs", `[Report a Bug](${pjson.bugs.url})`, true)
                        .setTimestamp();
                } else {
                    StackTrace = JSON.stringify(serializeError(exception));
                    embed.setColor('#0099ff')
                        .setTitle("Woops! I crashed...")
                        .setDescription("```" + StackTrace + "```")
                        .addField("What to do?", "Report the bug using the string above")
                        .addField("Bugs", `[Report a Bug](${pjson.bugs.url})`, true)
                        .setTimestamp();
                }


                message.channel.send(embed);
                //_messageObj.message.channel.stopTyping(true);

            });

    } catch (error) {

        //_messageObj.message.channel.stopTyping(true);
        message.channel.send("An error has occurred!");
        console.log(color.red("[ERROR]", color.magenta(`<${_messageObj.command}>`), color.yellow(error), error.stack));
    }
});


bot.login(process.env.BOT_TOKEN);