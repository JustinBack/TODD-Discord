import { Command, messageObj, Permissions } from '../models';
import { postModlog } from '../utils/modlog';
import { Client } from 'discord.js';

module.exports = {
    name: 'assignrole',
    description: 'Assigns a role to a user',
    syntax: ["`[user:User Mention]` `[role:Role Name]`"],
    Bitmask: Permissions.FORCE_ROLES,
    RequiredEnvs: ["GUILD_HOME", "GUILD_MODLOG"],
    RLPointsConsume: 2,
    HomeGuildOnly: true,
    execute: async (message: messageObj, bot: Client) => {
        const user = message.message.mentions.users.first();

        if (message.arguments.length < 2) {
            return message.message.reply("You did not mention a reason for the ban!");
        }

        let shiftedargs = message.arguments;

        shiftedargs.shift();

        let roleNames = shiftedargs.join(" ").split(",");

        if (roleNames.length === 0) {
            return message.message.reply("You didn't mention a role to assign!");
        }

        if (user) {
            const member = message.message.guild.member(user);
            if (member) {

                let errors = [];
                let processed = [];
                for (var i in roleNames) {
                    let roleName = roleNames[i].trim();
                    const role = message.message.guild.roles.cache.find(role => role.name === roleName)
                    if (!role) {
                        errors.push({ "role": roleName, "message": "Not found", "diff": "@" });
                        continue;
                    }
                    const userCanBeAssigned = (message.message.member.roles.highest.position > role.position);
                    const hasPermissions = message.message.guild.me.hasPermission('MANAGE_ROLES') && (message.message.guild.me.roles.highest.position > message.message.member.roles.highest.position)


                    if (!hasPermissions) {
                        return message.message.reply("I cannot assign roles to that user.");
                    }
                    if (!userCanBeAssigned) {
                        errors.push({ "role": roleName, "roleobj": role, "message": "Role higher", "diff": "@" });
                        continue;
                    }

                    if (member.roles.cache.has(role.id)) {
                        await member.roles.remove(role, 'Assign command');
                        processed.push({ "role": roleName, "roleobj": role, "message": "Removed", "diff": "-" });
                        continue;
                    }
                    await member.roles.add(role, 'Assign command');


                    processed.push({ "role": roleName, "roleobj": role, "message": "Added", "diff": "+" });
                }



                let diff = "";
                let diffembed = "";

                for (var i in processed) {
                    let processedRole = processed[i];
                    diff += `${processedRole.diff} ${processedRole.role}\n`;
                    diffembed += `${processedRole.message} ${processedRole.roleobj}\n`;
                }
                for (var i in errors) {
                    let processedRole = errors[i];
                    diff += `${processedRole.diff} ERROR: ${processedRole.role} - ${processedRole.message}\n`;
                }
                postModlog(message.message.author, `Roles for ${member} have been modified!\n\n${diffembed}`);

                message.message.reply(`${processed.length} Roles have been processed, where as ${errors.length} failed.\n\n\`\`\`diff\n${diff}\`\`\``);
            } else {
                message.message.reply("That user is not on this server.");
            }
        } else {
            message.message.reply("You didn't mention the user to assign a role to!");
        }
    },
} as Command;