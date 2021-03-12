/**
 * Improved Anti Spam module
 * https://www.npmjs.com/package/discord-anti-spam
 */

const Discord = require('discord.js')
const Bitmask = require('../models/permissions.model')
const modlog = require('./modlog');
const EventEmitter = require('events');

/**
 * Emitted when a member gets warned.
 * @event AntiSpamClient#warnAdd
 * @property {Discord.GuildMember} member The member that was warned.
 */

/**
 * Emitted when a member gets muted.
 * @event AntiSpamClient#muteAdd
 * @property {Discord.GuildMember} member The member that was muted.
 */
/**
 * Main AntiSpam class
 */
class AntiSpamClient extends EventEmitter {
	/**
	 * @param {AntiSpamClientOptions} options The options for this AntiSpam client instance
	 */
	constructor(options) {
		super()
		/**
		 * The options for this AntiSpam client instance
		 * @type {AntiSpamClientOptions}
		 */
		this.options = {

			warnThreshold: options.warnThreshold || 3,
			muteThreshold: options.muteThreshold || 4,

			maxInterval: options.maxInterval || 2000,
			maxDuplicatesInterval: options.maxDuplicatesInterval || 2000,

			maxDuplicatesWarn: options.maxDuplicatesWarn || 7,
			maxDuplicatesMute: options.maxDuplicatesMute || 9,

			muteRoleName: options.muteRoleName || 'Tier 2 Warning',
			TierOneRoleName: options.TierOneRoleName || 'Tier 1 Warning',

			modLogsChannelName: options.modLogsChannelName || 'public-mod-logs',
			modLogsEnabled: options.modLogsEnabled || true,

			warnMessage: options.warnMessage || '{@user}, Please stop spamming.',
			muteMessage: options.muteMessage || '**{user_tag}** has been given a Tier 2 Warning for spamming.',

			errorMessages: options.errorMessages || true,
			muteErrorMessage: options.muteErrorMessage || 'Could not mute **{user_tag}** because of improper permissions or the mute role couldn\'t be found.',

			ignoreBots: options.ignoreBots || true,

			exemptPermissions: options.exemptPermissions || Bitmask.Permissions.IGNORE_SPAM,
			exemptInvites: options.exemptInvites || Bitmask.Permissions.CAN_SEND_INVITES,

			warnEnabled: options.warnEnabled || true,
			muteEnabled: options.muteEnabled || true,

			mysql: options.mysql || null,

			verbose: options.verbose || false,
			debug: options.debug || false,
			removeMessages: options.removeMessages || true
		}

		/**
		 * The cache for this AntiSpam client instance
		 * @type {AntiSpamCache}
		 */
		this.cache = {
			messages: [],
			warnedUsers: [],
			mutedUsers: [],
		}
	}

	/**
	 * Format a string and returns it.
	 * @ignore
	 * @param {string|Discord.MessageEmbed} string The string to format.
	 * @param {Discord.Message} message Context message.
	 * @returns {string|Discord.MessageEmbed}
	 */
	format(string, message) {
		if (typeof string === 'string') {
			return string
				.replace(/{@user}/g, message.author.toString())
				.replace(/{user_tag}/g, message.author.tag)
				.replace(/{server_name}/g, message.guild.name)
		} else {
			const embed = new Discord.MessageEmbed(string)
			if (embed.description) embed.setDescription(this.format(embed.description, message))
			if (embed.title) embed.setTitle(this.format(embed.title, message))
			if (embed.footer && embed.footer.text) embed.footer.text = this.format(embed.footer.text, message)
			if (embed.author && embed.author.name) embed.author.name = this.format(embed.author.name, message)
			return embed
		}
	}

	/**
	 * Send a message to the logs channel
	 * @ignore
	 * @param {Discord.Message} msg The message to check the channel with
	 * @param {string} message The message to log
	 * @param {Discord.Client} client The Discord client that will send the message
	 */
	log(msg, message, client) {
		if (this.options.modLogsEnabled) {
			const modLogChannel = client.channels.cache.get(this.options.modLogsChannelName) ||
				msg.guild.channels.cache.find((channel) => channel.name === this.options.modLogsChannelName && channel.type === 'text')
			if (modLogChannel) {
				modLogChannel.send(message)
			}
		}
	}

	/**
	 * Delete spam messages
	 * @ignore
	 * @param {CachedMessage[]} messages The messages to delete
	 * @param {Discord.Client} client The Discord client that will delete the messages
	 * @returns {Promise<void>}
	 */
	async clearSpamMessages(messages, client) {
		messages.forEach((message) => {
			const channel = client.channels.cache.get(message.channelID)
			if (channel) {
				const msg = channel.messages.cache.get(message.messageID)
				if (msg && msg.deletable) msg.delete()
			}
		})
	}

	/**
	 * Mute a user.
	 * @ignore
	 * @param {Discord.Message} message Context message.
	 * @param {Discord.GuildMember} member The member to mute.
	 * @param {CachedMessage[]} [spamMessages] The spam messages.
	 * @returns {Promise<boolean>} Whether the member could be muted.
	 */
	async muteUser(message, member, spamMessages) {
		if (this.options.removeMessages && spamMessages) {
			this.clearSpamMessages(spamMessages, message.client)
		}
		this.cache.messages = this.cache.messages.filter((u) => u.authorID !== message.author.id)
		this.cache.mutedUsers.push(message.author.id)
		const role = message.guild.roles.cache.find(role => role.name === this.options.muteRoleName)
		const userCanBeMuted = role && message.guild.me.hasPermission('MANAGE_ROLES') && (message.guild.me.roles.highest.position > message.member.roles.highest.position)
		if (!userCanBeMuted) {
			if (this.options.verbose) {
				console.log(`DAntiSpam (kickUser#userNotMutable): ${message.author.tag} (ID: ${message.author.id}) could not be muted, improper permissions or the mute role couldn't be found.`)
			}
			if (this.options.errorMessages) {
				await message.channel
					.send(this.format(this.options.muteErrorMessage, message))
					.catch((e) => {
						if (this.options.verbose) {
							console.log(`DAntiSpam (muteUser#sendMissingPermMessage): ${e.message}`)
						}
					})
			}
			return false
		}
		if (message.member.roles.cache.has(role.id)) return true
		await message.member.roles.add(role, 'Spamming')
		if (this.options.muteMessage) {
			await message.channel.send(this.format(this.options.muteMessage, message)).catch(e => {
				if (this.options.verbose) {
					console.error(`DAntiSpam (kickUser#sendSuccessMessage): ${e.message}`)
				}
			})
		}
		if (this.options.modLogsEnabled) {
			this.log(message, `Spam detected: ${message.author} got **muted**`, message.client)
		}
		this.emit('muteAdd', member)
		return true
	}


	isDiscordInvite(invite) {
		let regex = new RegExp(/(https?:\/\/)?(www.)?(discord.(gg|io|me|li)|discordapp.com\/invite|discord.com\/invite)\/[^\s\/]+?(?=\b)/, "gi");
		return regex.test(invite);
	}

	isEmpty(content) {
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
	async warnUser(message, member, spamMessages) {
		if (this.options.removeMessages && spamMessages) {
			this.clearSpamMessages(spamMessages, message.client)
		}
		this.cache.warnedUsers.push(message.author.id)
		this.log(message, `Spam detected: ${message.author.tag} got **warned**`, message.client)
		if (this.options.warnMessage) {
			message.channel.send(this.format(this.options.warnMessage, message)).catch((e) => {
				if (this.options.verbose) {
					console.error(`DAntiSpam (warnUser#sendSuccessMessage): ${e.message}`)
				}
			})
		}
		this.emit('warnAdd', member)
		return true
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
	async message(message) {
		const { options } = this
		if (
			!message.guild ||
			message.author.id === message.client.user.id ||
			(options.ignoreBots && message.author.bot)
		) {
			return false
		}

		const member = message.member || await message.guild.members.fetch(message.author);
		let Bitmasks = await options.mysql.promise().query("SELECT * FROM Permissions WHERE ID = ?", [message.author.id]);
		Bitmasks = (Bitmasks[0].length === 0 ? [[{ "Bitmask": 0 }]] : Bitmasks);

		let Account = Bitmasks[0][0];


		if (this.isDiscordInvite(message.content)) {
			if (!(Account["Bitmask"] & options.exemptInvites)) {
				message.delete();
				const role = message.guild.roles.cache.find(role => role.name === this.options.TierOneRoleName);
				const roleMute = message.guild.roles.cache.find(role => role.name === this.options.muteRoleName);
				const userCanBeRoled = role && message.guild.me.hasPermission('MANAGE_ROLES') && (message.guild.me.roles.highest.position > message.member.roles.highest.position)
				if (!userCanBeRoled) {
					if (this.options.verbose) {
						console.log(`DAntiSpam (message#userNotRolable): ${message.author.tag} (ID: ${message.author.id}) could not be warned, improper permissions or the tier 1 warning role couldn't be found.`)
					}
					if (this.options.errorMessages) {
						await message.channel.send(this.format("Please refrain from posting Discord invite links, could not be warned, improper permissions or the tier 1 warning role couldn't be found.", message))
							.catch((e) => {
								if (this.options.verbose) {
									console.log(`DAntiSpam (muteUser#sendMissingPermMessage): ${e.message}`)
								}
							})
					}
					return false;
				}

				if (message.member.roles.cache.has(role.id)) {
					await message.member.roles.remove(role, 'Invite Link, Tier 1');
					await message.member.roles.add(roleMute, 'Invite Link, Tier 1');
					modlog.postModlog(message.client.user, `${message.author} is now on a ${roleMute} for spamming Discord Links.`);
					return await message.channel.send(this.format("Please refrain from posting Discord invite links, You are now on a Tier 2 Warning.", message));
				}
				await message.channel.send(this.format("Please refrain from posting Discord invite links, You are now on a Tier 1 Warning.", message));
				modlog.postModlog(message.client.user, `${message.author} is now on a ${role} for spamming Discord Links.`);
				return await message.member.roles.add(role, 'Invite Link');
			}
		} else if (this.isEmpty(message.content)) {

			if (Account["Bitmask"] & options.exemptPermissions) return;

			message.delete();
			console.log("Message is empty!");
			const role = message.guild.roles.cache.find(role => role.name === this.options.TierOneRoleName);
			const roleMute = message.guild.roles.cache.find(role => role.name === this.options.muteRoleName);
			const userCanBeRoled = role && message.guild.me.hasPermission('MANAGE_ROLES') && (message.guild.me.roles.highest.position > message.member.roles.highest.position)
			if (!userCanBeRoled) {
				if (this.options.verbose) {
					console.log(`DAntiSpam (message#userNotRolable): ${message.author.tag} (ID: ${message.author.id}) could not be warned, improper permissions or the tier 1 warning role couldn't be found.`)
				}
				if (this.options.errorMessages) {
					await message.channel.send(this.format("Please refrain from posting Empty messages, could not be warned, improper permissions or the tier 1 warning role couldn't be found.", message))
						.catch((e) => {
							if (this.options.verbose) {
								console.log(`DAntiSpam (muteUser#sendMissingPermMessage): ${e.message}`)
							}
						})
				}
				return false;
			}

			if (message.member.roles.cache.has(role.id)) {
				await message.member.roles.remove(role, 'Empty messages, Tier 1');
				await message.member.roles.add(roleMute, 'Empty messages, Tier 1');
				modlog.postModlog(message.client.user, `${message.author} is now on a ${roleMute} for spamming Empty messages.`);
				return await message.channel.send(this.format("Please refrain from posting Empty messages, You are now on a Tier 2 Warning.", message));
			}
			await message.channel.send(this.format("Please refrain from posting Empty messages, You are now on a Tier 1 Warning.", message));
			modlog.postModlog(message.client.user, `${message.author} is now on a ${role} for spamming Empty messages.`);
			return await message.member.roles.add(role, 'Empty messages');
		}

		if (Account["Bitmask"] & options.exemptPermissions) return;

		const currentMessage = {
			messageID: message.id,
			guildID: message.guild.id,
			authorID: message.author.id,
			channelID: message.channel.id,
			content: message.content,
			sentTimestamp: message.createdTimestamp
		}
		this.cache.messages.push(currentMessage)

		const cachedMessages = this.cache.messages.filter((m) => m.authorID === message.author.id && m.guildID === message.guild.id)

		const duplicateMatches = cachedMessages.filter((m) => m.content === message.content && (m.sentTimestamp > (currentMessage.sentTimestamp - options.maxDuplicatesInterval)))


		const spamOtherDuplicates = []
		if (duplicateMatches.length > 0) {
			let rowBroken = false
			cachedMessages.sort((a, b) => b.sentTimestamp - a.sentTimestamp).forEach(element => {
				if (rowBroken) return
				if (element.content !== duplicateMatches[0].content) rowBroken = true
				else spamOtherDuplicates.push(element)
			})
		}

		const spamMatches = cachedMessages.filter((m) => m.sentTimestamp > (Date.now() - options.maxInterval))

		let sanctioned = false

		const userCanBeMuted = options.muteEnabled && !this.cache.mutedUsers.includes(message.author.id) && !sanctioned
		if (userCanBeMuted && (spamMatches.length >= options.muteThreshold)) {
			this.muteUser(message, member, spamMatches)
			sanctioned = true
		} else if (userCanBeMuted && (duplicateMatches.length >= options.maxDuplicatesMute)) {
			this.muteUser(message, member, [...duplicateMatches, ...spamOtherDuplicates])
			sanctioned = true
		}

		const userCanBeWarned = options.warnEnabled && !this.cache.warnedUsers.includes(message.author.id) && !sanctioned
		if (userCanBeWarned && (spamMatches.length >= options.warnThreshold)) {
			this.warnUser(message, member, spamMatches)
			sanctioned = true
		} else if (userCanBeWarned && (duplicateMatches.length >= options.maxDuplicatesWarn)) {
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

module.exports = AntiSpamClient
