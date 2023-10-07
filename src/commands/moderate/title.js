/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'title',
	description: 'Change the title of the group.',
	usage: '!title <texts>',
	aliases: ['subject', 'topic', 'name'],
	category: 'Moderation',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ isAdmin, isBotAdmin, isOwner, from, query, bodyQuoted, message, groupMetadata }, client) {
		if (!isAdmin && !isOwner) {
			return await client[botNum].reply('You are not admin. This commands is only for admins.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		if (!isBotAdmin) {
			return await client[botNum].reply('Bot is not admin, Please promote admin before using moderation commands.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		if (!query) {
			return await client[botNum].reply('Please input the title.', { from, quoted: message, groupMetadata });
		}

		if (query) {
			return await client[botNum].updateGroup(from, undefined, 'SUBJECT', query);
		} else if (bodyQuoted) {
			return await client[botNum].updateGroup(from, undefined, 'SUBJECT', bodyQuoted);
		}
	}
};
