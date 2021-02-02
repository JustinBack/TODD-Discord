import { loadCommands } from './utils/load-commands';
import * as process from 'process';
import * as mysql from 'mysql';
import * as dotenv from 'dotenv';
import * as redis from 'redis';
import * as color from 'chalk';
import { v4 as uuidv4 } from 'uuid';
import * as RateLimit from 'rate-limiter-flexible';
import * as Discord from 'discord.js';
import { messageObj } from './models';
import { exec } from 'child_process';
import { MessageEmbed } from 'discord.js';
import * as crypto from 'crypto';
import { serializeError } from 'serialize-error';


console.log(color.blue("********************** Initializing ************************"));

export const commands = loadCommands();
export const bot = new Discord.Client({ partials: ['CHANNEL', 'MESSAGE', 'REACTION'] });

dotenv.config({
    path: __dirname + "/.env"
});
console.log(color.green("Loaded environment variables!"));


var dbmaster = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});



const redisClient = redis.createClient(Number.parseInt(process.env.REDIS_PORT), process.env.REDIS_HOST, { enable_offline_queue: false });

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


bot.on('ready', () => {
    console.log(`Logged in as ${bot.user.tag}!`);
    bot.user.setPresence({
        status: 'online',
        activity: {
            name: 'in chat for ' + process.env.BOT_PREFIX + "help",
            type: 'WATCHING'
        }
    });
});


console.log(color.green(`Connection to Master MySQL Server established on DB ${color.cyan(process.env.MYSQL_HOST)}`));


bot.on('guildMemberAdd', async (member) => {
    if (member.guild.id == process.env.GUILD_HOME) {
        let role = member.guild.roles.cache.get(process.env.WELCOME_ROLE);

        if (!role) {
            console.error('Role not found');
            return;
        }
        member.roles.add(role);
    }
});

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

    dbmaster.query("SELECT * FROM Polls WHERE MessageID = ? AND ChannelID = ?", [reaction.message.id, reaction.message.channel.id], async function (err, rows) {

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

    dbmaster.query("SELECT * FROM Polls WHERE MessageID = ? AND ChannelID = ?", [reaction.message.id, reaction.message.channel.id], async function (err, Pollrows) {

        if (Pollrows.length == 0) {
            return;
        }

        if (new Date(Pollrows[0]["Until"]) < new Date()) {
            for (const reaction of userReactions.values()) {
                await reaction.users.remove(user.id);
            }
            return;
        }

        dbmaster.query("SELECT * FROM Reactions WHERE MessageID = ? AND UserID = ?", [reaction.message.id, user.id], async function (err, rows) {

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


bot.on('message', async message => {

    if (message.partial) {
        try {
            await message.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the message: ', error);
            return;
        }
    }

    if (!message.content.startsWith(process.env.BOT_PREFIX)) {
        return;
    }

    let _messageObj = new messageObj(message, commands);

    try {


        let execCommand = commands.get(_messageObj.command);

        if (!execCommand) {
            return _messageObj.message.channel.send("This command does not exist, try using our help for a list of available commands!");
        }


        if (execCommand.priviliged && message.channel.type == "dm") {
            message.channel.send("You cannot run this in DMs!");
            return;
        }

        if (execCommand.priviliged && message.guild.id != process.env.GUILD_HOME) {

            bot.guilds.fetch(process.env.GUILD_HOME)
                .then(guild => {

                    if (process.env.GUILD_INVITE_CHANNEL.length == 0) {
                        message.channel.send("No channel has been set in the homeserver");
                        return;
                    }
                    bot.channels.fetch(process.env.GUILD_INVITE_CHANNEL)
                        .then(channel => {
                            message.channel.send("This command can only be run in the ToS;DR Server!")
                                .then(() => {
                                    (channel as Discord.TextChannel).createInvite({
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
        } else if (execCommand.priviliged && !message.member.roles.cache.some(r => process.env.GUILD_PRIV_ROLES.split(",").includes(r.id))) {
            message.channel.send("You do not have permissions to run this command!");
            return;
        }



        rateLimiter.consume(_messageObj.message.author.id + "_" + _messageObj.command, execCommand.RLPointsConsume)
            .then(() => {
                execCommand.execute(_messageObj, bot, dbmaster);
            })
            .catch((exception) => {

                if (typeof exception._remainingPoints != "undefined") {
                    message.channel.send("Seems you hit the ratelimit, try again later, in like 30 secs");
                    return;
                }

                var pjson = require(__dirname + '/package.json');

                let iv = crypto.randomBytes(16);

                const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(process.env.BOT_CRASH_SECRET), iv);
                let StackTrace = cipher.update(JSON.stringify(serializeError(exception)));

                StackTrace = Buffer.concat([StackTrace, cipher.final()]);




                const embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setTitle("Woops! I crashed...")
                    .setDescription("```" + iv.toString('hex') + "." + StackTrace.toString('hex') + "```")
                    .addField("What to do?", "Report the bug using the string above")
                    .addField("Bugs", `[Report a Bug](${pjson.bugs.url})`, true)
                    .setTimestamp();
                message.channel.send(embed);

            });

    } catch (error) {

        message.channel.send("An error has occurred!");
        console.log(color.red("[ERROR]", color.magenta(`<${_messageObj.command}>`), color.yellow(error), error.stack));
    }
});



bot.login(process.env.BOT_TOKEN);