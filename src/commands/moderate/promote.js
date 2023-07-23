import { S_WHATSAPP_NET } from '../../helper/index.js';

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
			return await client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				'You are not admin. This commands is only for admins.'
			);
		}

		if (!query && mention.length === 0 && !bodyQuoted) {
			return await client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				'Please reply people message or mention people.'
			);
		}

		if (!isBotAdmin) {
			return await client[botNum].reply(
				{ groupMetadata, from, quoted: message },
				'Bot is not admin, Please promote admin before using moderation commands.'
			);
		}

		if (
			mention?.includes(`${botNum.split(':')[0]}${S_WHATSAPP_NET}`) ||
			mediaData?.participant?.includes(`${botNum.split(':')[0]}${S_WHATSAPP_NET}`)
		) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'You can not promote me by myself.');
		}

		if (query || mention.length > 0) {
			await client[botNum].updateGroup(
				from,
				mention.length > 0 ? mention : query.split(',').parse(),
				'PROMOTE',
				false,
				false,
				message,
				adminGroups
			);
		}

		if (bodyQuoted) {
			await client[botNum].updateGroup(from, [mediaData.participant], 'PROMOTE', false, false, message, adminGroups);
		}
	}
};
