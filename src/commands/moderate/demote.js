import { S_WHATSAPP_NET } from '../../helper/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'demote',
	minifiedDescription: 'Demote Admin',
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
			return await client.instance.reply('You can not demote me by myself.', { from, quoted: message, groupMetadata });
		}

		if (query || mention.length > 0) {
			await client.instance.updateGroup(from, 'DEMOTE', mention.length > 0 ? mention : query.parseNumber(), adminGroups, {
				message
			});
		}

		if (bodyQuoted) {
			await client.instance.updateGroup(from, 'DEMOTE', [mediaData.participant], adminGroups, { message });
		}
	}
};
