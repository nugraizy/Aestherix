import { S_WHATSAPP_NET } from '../../helper/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'promote',
	description: 'Promote member to admin.',
	usage: '!promote <reply/tag member>',
	aliases: ['prmt', 'admin', 'adm'],
	category: 'Moderation',
	cooldown: 8,
	limit: 6,
	status: 'enable',
	restrict: true,
	async run(
		{ isAdmin, isBotAdmin, isOwner, query, from, bodyQuoted, mediaData, mention, message, adminGroups, groupMetadata },
		client
	) {
		if (!isAdmin && !isOwner) {
			return await client[botNum].reply('You are not admin. This commands is only for admins.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

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
			return await client[botNum].reply('You can not promote me by myself.', { from, quoted: message, groupMetadata });
		}

		if (query || mention.length > 0) {
			await client[botNum].updateGroup(from, 'PROMOTE', mention.length > 0 ? mention : query.split(',').parse(), adminGroups, {
				message
			});
		}

		if (bodyQuoted) {
			await client[botNum].updateGroup(from, 'PROMOTE', [mediaData.participant], adminGroups, { message });
		}
	}
};
