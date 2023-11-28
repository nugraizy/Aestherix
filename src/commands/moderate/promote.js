import { S_WHATSAPP_NET } from '../../helper/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'promote',
	minifiedDescription: 'Promote User',
	description: 'Promote member to admin.',
	usage: '!promote <reply/tag member>',
	aliases: ['prmt', 'admin', 'adm'],
	category: 'Moderation',
	cooldown: 8,
	limit: 6,
	status: 'enable',
	restrict: true,
	async run({ isBotAdmin, query, from, bodyQuoted, mediaData, mention, message, adminGroups, groupMetadata }, client) {
		if (!query && mention.length === 0 && !bodyQuoted) {
			return await client.instance.reply('Please reply people message or mention people.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		if (!isBotAdmin) {
			return await client.instance.reply('Bot is not admin, Please promote admin before using moderation commands.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		if (
			mention?.includes(`${instance.split(':')[0]}${S_WHATSAPP_NET}`) ||
			mediaData?.participant?.includes(`${instance.split(':')[0]}${S_WHATSAPP_NET}`)
		) {
			return await client.instance.reply('You can not promote me by myself.', { from, quoted: message, groupMetadata });
		}

		if (query || mention.length > 0) {
			await client.instance.updateGroup(from, 'PROMOTE', mention.length > 0 ? mention : query.parseNumber(), adminGroups, {
				message
			});
		}

		if (bodyQuoted) {
			await client.instance.updateGroup(from, 'PROMOTE', [mediaData.participant], adminGroups, { message });
		}
	}
};
