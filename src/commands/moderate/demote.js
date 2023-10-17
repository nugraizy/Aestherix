import { S_WHATSAPP_NET } from '../../helper/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'demote',
	description: 'Demote admin to member.',
	usage: '!demote <reply/tag member>',
	aliases: ['demt', 'member', 'mem', 'dmt'],
	category: 'Moderation',
	cooldown: 10,
	limit: 2,
	status: 'enable',
	restrict: true,
	async run({ isBotAdmin, mention, from, mediaData, query, bodyQuoted, message, adminGroups, groupMetadata }, client) {
		if (!query && mention.length === 0 && !bodyQuoted) {
			return await client[botNum].reply('Please reply people message or mention people.', {
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
			return await client[botNum].reply('You can not demote me by myself.', { from, quoted: message, groupMetadata });
		}

		if (query || mention.length > 0) {
			await client[botNum].updateGroup(from, 'DEMOTE', mention.length > 0 ? mention : query.split(',').parse(), adminGroups, {
				message
			});
		}

		if (bodyQuoted) {
			await client[botNum].updateGroup(from, 'DEMOTE', [mediaData.participant], adminGroups, { message });
		}
	}
};
