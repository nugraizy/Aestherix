/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'description',
	description: 'Change the description of the group.',
	usage: '!description <texts>',
	aliases: ['desc'],
	category: 'Moderation',
	cooldown: 4,
	limit: 2,
	status: 'enable',
	async run({ isAdmin, isBotAdmin, isOwner, query, bodyQuoted, from, message, groupMetadata }, client) {
		if (!isAdmin && !isOwner) {
			return await client[botNum].reply('You are not admin. This commands is only for admins.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		if (!query) {
			return await client[botNum].reply('Please input the description.', { from, quoted: message, groupMetadata });
		}

		if (!isBotAdmin) {
			return await client[botNum].reply('Bot is not admin, Please promote admin before using moderation commands.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		if (query) {
			return await client[botNum].updateGroup(from, 'DESCRIPTION', [], [], { texts: query });
		}

		if (bodyQuoted) {
			return await client[botNum].updateGroup(from, 'DESCRIPTION', [], [], { texts: bodyQuoted });
		}
	}
};
