import { S_WHATSAPP_NET } from '../../helper/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'kick',
	description: 'Kick member from group.',
	usage: '!kick <reply/tag member>',
	aliases: ['remove', 'rem', 'rm'],
	category: 'Moderation',
	cooldown: 12,
	limit: 6,
	status: 'enable',
	restrict: true,
	async run(
		{ mediaData, isAdmin, isOwner, isBotAdmin, type, message, from, mention, query, bodyQuoted, adminGroups, groupMetadata },
		client
	) {
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

		if (type === 'buttonsResponseMessage') {
			return await client[botNum].updateGroup(
				from,
				'REMOVE',
				mention.length > 0 ? mention : query.split(',').parse(),
				adminGroups,
				{
					force: /--?(force|F)/.test(query),
					message
				}
			);
		} else if (!query && mention.length === 0 && !bodyQuoted) {
			return await client[botNum].reply('Please reply people message or mention people.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		if (
			message?.mention?.includes(`${botNum.split(':')[0]}${S_WHATSAPP_NET}`) ||
			mediaData?.participant?.includes(`${botNum.split(':')[0]}${S_WHATSAPP_NET}`)
		) {
			return await client[botNum].reply('You can not kick me by myself.', { from, quoted: message, groupMetadata });
		}

		if (query || mention.length > 0) {
			await client[botNum].updateGroup(from, 'REMOVE', mention.length > 0 ? mention : query.split(',').parse(), adminGroups, {
				force: /--?(force|F)/.test(query),
				message
			});
		}

		if (bodyQuoted) {
			await client[botNum].updateGroup(from, 'REMOVE', [mediaData.participant], adminGroups, {
				force: /--?(force|F)/.test(query),
				message
			});
		}
	}
};
