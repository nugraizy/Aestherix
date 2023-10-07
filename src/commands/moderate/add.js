import { S_WHATSAPP_NET } from '../../helper/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'add',
	description: 'Add people to group',
	usage: '!add <reply/tag member>',
	aliases: ['addmem', 'invite'],
	category: 'Moderation',
	cooldown: 10,
	limit: 4,
	restrict: true,
	status: 'enable',
	async run({ isBotAdmin, from, query, mention, bodyQuoted, mediaData, message, adminGroups, groupMetadata }, client) {
		if (!query && !bodyQuoted) {
			return await client[botNum].reply('Please reply people message or reply people', {
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

		if (
			mention?.includes(`${botNum.split(':')[0]}${S_WHATSAPP_NET}`) ||
			mediaData?.participant?.includes(`${botNum.split(':')[0]}${S_WHATSAPP_NET}`)
		) {
			return await client[botNum].reply('You can not add me by myself.', { from, quoted: message, groupMetadata });
		}

		if (query) {
			if (mention.length > 0) {
				return await client[botNum].reply('Please reply people message or input people number.', {
					from,
					quoted: message,
					groupMetadata
				});
			}

			await client[botNum].updateGroup(from, 'ADD', query.split(',').parse(), adminGroups, { message });
		}

		if (bodyQuoted) {
			await client[botNum].updateGroup(from, 'ADD', [mediaData.participant], adminGroups, { message });
		}
	}
};
