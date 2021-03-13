/**
 * Improved Anti Spam module
 * https://www.npmjs.com/package/discord-anti-spam
 */

import { Message, GuildMember, MessageEmbed, Client, User, TextChannel } from 'discord.js';
import { Permissions } from '../models/permissions.model';
import { postModlog } from './modlog';
const EventEmitter = require('events');
const compare = require('hamming-distance');
import { imageHash } from 'image-hash';
import { Pool } from 'mysql2';
/**
 * Emitted when a member gets warned.
 * @event AntiSpamClient#warnAdd
 * @property {GuildMember} member The member that was warned.
 */

/**
 * Emitted when a member gets muted.
 * @event AntiSpamClient#muteAdd
 * @property {GuildMember} member The member that was muted.
 */
/**
 * Main AntiSpam class
 */
export class AntiSpamClient extends EventEmitter {
	/**
	 * @param {AntiSpamClientOptions} options The options for this AntiSpam client instance
	 */

	cache: any = {
		messages: [],
		warnedUsers: [],
		mutedUsers: [],
	}

	mysql: Pool;

	constructor(database: Pool) {
		super();
		this.mysql = database;
	}

	format(string: any, message: Message) {
		return string
			.replace(/{@user}/g, message.author.toString())
			.replace(/{user_tag}/g, message.author.tag)
			.replace(/{server_name}/g, message.guild.name)
	}

	async clearSpamMessages(messages: any, client: Client) {
		messages.forEach((message: any) => {
			const channel = client.channels.cache.get(message.channelID) as TextChannel
			if (channel) {
				const msg = channel.messages.cache.get(message.messageID)
				if (msg && msg.deletable) msg.delete()
			}
		})
	}

	async muteUser(message: Message, member: GuildMember, spamMessages: any) {
		this.clearSpamMessages(spamMessages, message.client);
		this.cache.messages = this.cache.messages.filter((u: any) => u.authorID !== message.author.id)
		this.cache.mutedUsers.push(message.author.id)
		const role = message.guild.roles.cache.get(process.env.GUILD_WARNING_TWO);
		const userCanBeMuted = role && message.guild.me.hasPermission('MANAGE_ROLES') && (message.guild.me.roles.highest.position > message.member.roles.highest.position)
		if (!userCanBeMuted) {
			console.log(`DAntiSpam (kickUser#userNotMutable): ${message.author.tag} (ID: ${message.author.id}) could not be muted, improper permissions or the mute role couldn't be found.`)

			await message.channel
				.send(this.format('**{user_tag}** has been given a Tier 2 Warning for spamming.', message))
				.catch((e) => {
					console.log(`DAntiSpam (muteUser#sendMissingPermMessage): ${e.message}`)
				})

			return false
		}
		if (message.member.roles.cache.has(role.id)) return true
		await message.member.roles.add(role, 'Spamming')
		await message.channel.send(this.format('**{user_tag}** has been given a Tier 2 Warning for spamming.', message)).catch(e => {
			console.error(`DAntiSpam (kickUser#sendSuccessMessage): ${e.message}`)
		})
		this.log(message, `Spam detected: ${message.author} got **muted**`, message.client)

		this.emit('muteAdd', member)
		return true
	}


	isDiscordInvite(invite: string) {
		let regex = new RegExp(/(https?:\/\/)?(www.)?(discord.(gg|io|me|li)|discordapp.com\/invite|discord.com\/invite)\/[^\s\/]+?(?=\b)/, "gi");
		return regex.test(invite);
	}

	isEmpty(content: string) {
		content = content.replace(/\*\*((.*?)?)\*\*/gm, "$1");
		content = content.replace(/\*((.*?)?)\*/gm, "$1");
		content = content.replace(/\_((.*?)?)\_/gm, "$1");
		content = content.replace(/\~\~((.*?)?)\~\~/gm, "$1");
		content = content.replace(/\~((.*?)?)\~/gm, "$1");
		let regex = new RegExp(/^\s+$|^$/, "gi");
		return regex.test(content);
	}

	/**
	 * Warn a user.
	 * @ignore
	 * @param {Discord.Message} message Context message.
	 * @param {Discord.GuildMember} member The member to warn.
	 * @param {CachedMessage[]} [spamMessages] The spam messages.
	 * @returns {Promise<boolean>} Whether the member could be warned.
	 */
	async warnUser(message: Message, member: GuildMember, spamMessages: any) {
		this.clearSpamMessages(spamMessages, message.client);
		this.cache.warnedUsers.push(message.author.id);
		message.channel.send(this.format('{@user}, Please stop spamming.', message)).catch((e) => {
			console.error(`DAntiSpam (warnUser#sendSuccessMessage): ${e.message}`)

		});
		this.emit('warnAdd', member)
		return true
	}


	async pHash(user: User, update: Boolean = false) {
		if (user.id === user.client.user.id || user.bot || user.system || !user.avatarURL({ format: "jpg" })) {
			return false
		}
		let matches: any = [];
		const guild = (user.client.guilds.cache.get(process.env.GUILD_HOME));

		const channel = (guild.channels.cache.get(process.env.GUILD_ERRORS)) as TextChannel;

		if (!channel) return;
		let [rows]: any = await this.mysql.promise().query("SELECT * FROM pHashes", []);

		if (rows.length === 0) {
			console.error("New User detected, adding pHash");
			imageHash(user.avatarURL({ format: "jpg" }), 16, false, async (error: any, hashFirst: any) => {
				if (error) return console.error;
				await this.mysql.promise().query("INSERT INTO pHashes (ID, pHash) VALUES (?, ?)", [user.id, hashFirst]);
				this.pHash(user);
			});
			return;
		}

		imageHash(user.avatarURL({ format: "jpg" }), 16, false, async (error: any, hashUser: any) => {
			if (error) throw error;
			for (var row of rows) {
				if (row.ID === user.id) {
					if (!update) continue;
					await this.mysql.promise().query("UPDATE pHashes SET pHash = ? WHERE ID = ?", [hashUser, user.id]);
					continue;
				}
				let hemmingdistance = compare(new Buffer(row.pHash, 'hex'), new Buffer(hashUser, 'hex'));
				row.distance = hemmingdistance;
				if (hemmingdistance <= 50) {
					matches.push(row);
				}
				console.log(row);
			}
			if (matches.length > 0) {
				const embed = new MessageEmbed()
					.setColor('#0099ff')
					.setTitle("Similiar Avatar Detected!")
					.setDescription(`${user} has a similar avatar to ${matches.length} users. Please investigate!`);
				for (var match of matches) {
					const matcheduser = (guild.members.cache.get(match.ID));
					if (!matcheduser) {
						let [dlrow] = await this.mysql.promise().query("DELETE FROM pHashes WHERE ID = ?", [match.ID]);
						continue;
					}
					embed.addField(matcheduser.user.username, `Mention: ${matcheduser}\npHash: ${match.pHash}\nHemming distance: ${match.distance}\nDiscord ID: ${match.ID}`);
				}
				embed.setTimestamp();
				channel.send(embed);
			}
		});
	}

	/**
	 * Checks a message.
	 * @param {Discord.Message} message The message to check.
	 * @returns {Promise<boolean>} Whether the message has triggered a threshold.
	 * @example
	 * client.on('message', (msg) => {
	 * 	antiSpam.message(msg);
	 * });
	 */
	async message(message: Message) {
		if (!message.guild || message.author.id === message.client.user.id || message.author.bot || message.system) {
			return false
		}

		const member = message.member || await message.guild.members.fetch(message.author);
		let Bitmasks: any = await this.mysql.promise().query("SELECT * FROM Permissions WHERE ID = ?", [message.author.id]);
		Bitmasks = (Bitmasks[0].length === 0 ? [[{ "Bitmask": 0 }]] : Bitmasks);

		let Account = Bitmasks[0][0];


		if (this.isDiscordInvite(message.content)) {
			if (!(Account["Bitmask"] & Permissions.CAN_SEND_INVITES)) {
				message.delete();
				const role = message.guild.roles.cache.get(process.env.GUILD_WARNING_ONE);
				const roleMute = message.guild.roles.cache.get(process.env.GUILD_WARNING_ONE);
				const userCanBeRoled = role && message.guild.me.hasPermission('MANAGE_ROLES') && (message.guild.me.roles.highest.position > message.member.roles.highest.position)
				if (!userCanBeRoled) {
					console.log(`DAntiSpam (message#userNotRolable): ${message.author.tag} (ID: ${message.author.id}) could not be warned, improper permissions or the tier 1 warning role couldn't be found.`)

					await message.channel.send(this.format("Please refrain from posting Discord invite links, could not be warned, improper permissions or the tier 1 warning role couldn't be found.", message))
						.catch((e) => {
							console.log(`DAntiSpam (muteUser#sendMissingPermMessage): ${e.message}`)

						});
					return false;
				}

				if (message.member.roles.cache.has(role.id)) {
					await message.member.roles.remove(role, 'Invite Link, Tier 1');
					await message.member.roles.add(roleMute, 'Invite Link, Tier 1');
					postModlog(message.client.user, `${message.author} is now on a ${roleMute} for spamming Discord Links.`);
					return await message.channel.send(this.format("Please refrain from posting Discord invite links, You are now on a Tier 2 Warning.", message));
				}
				await message.channel.send(this.format("Please refrain from posting Discord invite links, You are now on a Tier 1 Warning.", message));
				postModlog(message.client.user, `${message.author} is now on a ${role} for spamming Discord Links.`);
				return await message.member.roles.add(role, 'Invite Link');
			}
		} else if (this.isEmpty(message.content) && message.attachments.size === 0) {

			if (Account["Bitmask"] & Permissions.IGNORE_SPAM) return;

			message.delete();
			console.log("Message is empty!");
			const role = message.guild.roles.cache.get(process.env.GUILD_WARNING_ONE);
			const roleMute = message.guild.roles.cache.get(process.env.GUILD_WARNING_ONE);
			const userCanBeRoled = role && message.guild.me.hasPermission('MANAGE_ROLES') && (message.guild.me.roles.highest.position > message.member.roles.highest.position);
			if (!userCanBeRoled) {
				console.log(`DAntiSpam (message#userNotRolable): ${message.author.tag} (ID: ${message.author.id}) could not be warned, improper permissions or the tier 1 warning role couldn't be found.`);

				await message.channel.send(this.format("Please refrain from posting Empty messages, could not be warned, improper permissions or the tier 1 warning role couldn't be found.", message))
					.catch((e) => {
						console.log(`DAntiSpam (muteUser#sendMissingPermMessage): ${e.message}`);
					})
				return false;
			}

			if (message.member.roles.cache.has(role.id)) {
				await message.member.roles.remove(role, 'Empty messages, Tier 1');
				await message.member.roles.add(roleMute, 'Empty messages, Tier 1');
				postModlog(message.client.user, `${message.author} is now on a ${roleMute} for spamming Empty messages.`);
				return await message.channel.send(this.format("Please refrain from posting Empty messages, You are now on a Tier 2 Warning.", message));
			}
			await message.channel.send(this.format("Please refrain from posting Empty messages, You are now on a Tier 1 Warning.", message));
			postModlog(message.client.user, `${message.author} is now on a ${role} for spamming Empty messages.`);
			return await message.member.roles.add(role, 'Empty messages');
		}

		if (Account["Bitmask"] & Permissions.IGNORE_SPAM) return;

		const currentMessage = {
			messageID: message.id,
			guildID: message.guild.id,
			authorID: message.author.id,
			channelID: message.channel.id,
			content: message.content,
			sentTimestamp: message.createdTimestamp
		}
		this.cache.messages.push(currentMessage)

		const cachedMessages = this.cache.messages.filter((m: any) => m.authorID === message.author.id && m.guildID === message.guild.id)

		const duplicateMatches = cachedMessages.filter((m: any) => m.content === message.content && (m.sentTimestamp > (currentMessage.sentTimestamp - 2000)))


		const spamOtherDuplicates: any = []
		if (duplicateMatches.length > 0) {
			let rowBroken = false
			cachedMessages.sort((a: any, b: any) => b.sentTimestamp - a.sentTimestamp).forEach((element: any) => {
				if (rowBroken) return
				if (element.content !== duplicateMatches[0].content) rowBroken = true
				else spamOtherDuplicates.push(element)
			})
		}

		const spamMatches = cachedMessages.filter((m: any) => m.sentTimestamp > (Date.now() - 2000))

		let sanctioned = false

		const userCanBeMuted = !this.cache.mutedUsers.includes(message.author.id) && !sanctioned
		if (userCanBeMuted && (spamMatches.length >= 4)) {
			this.muteUser(message, member, spamMatches)
			sanctioned = true
		} else if (userCanBeMuted && (duplicateMatches.length >= 9)) {
			this.muteUser(message, member, [...duplicateMatches, ...spamOtherDuplicates])
			sanctioned = true
		}

		const userCanBeWarned = !this.cache.warnedUsers.includes(message.author.id) && !sanctioned
		if (userCanBeWarned && (spamMatches.length >= 3)) {
			this.warnUser(message, member, spamMatches)
			sanctioned = true
		} else if (userCanBeWarned && (duplicateMatches.length >= 7)) {
			this.warnUser(message, member, [...duplicateMatches, ...spamOtherDuplicates])
			sanctioned = true
		}

		return sanctioned
	}

	/**
	 * Reset the cache of this AntiSpam client instance.
	 */
	reset() {
		this.cache = {
			messages: [],
			warnedUsers: [],
			mutedUsers: [],
		}
	}
}