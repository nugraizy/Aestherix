/* global botNum */
import PhoneNumber from 'awesome-phonenumber';

import { removeDuplicatesArray, S_WHATSAPP_NET } from '../../helper/index.js';

Array.prototype.parse = function () {
	return (
		removeDuplicatesArray(this)
			.filter((v) => PhoneNumber(`+${v.replace(/[A-Za-z-@\s+s.whatsapp.net]/g, '')}`).isValid())
			?.map((v) => `${v}${S_WHATSAPP_NET}`.trim()) || []
	);
};

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
		{ mediaData, isAdmin, isOwner, isBotAdmin, type, message, from, mention, query, bodyQuoted, adminGroups },
		client,
	) {
		if (!isAdmin && !isOwner) {
			return await client[botNum].reply({ from, quoted: message }, 'You are not admin. This commands is only for admins.');
		}

		if (!isBotAdmin) {
			return await client[botNum].reply(
				{ from, quoted: message },
				'Bot is not admin, Please promote admin before using moderation commands.',
			);
		}

		if (type == 'buttonsResponseMessage') {
			return await client[botNum].updateGroup(
				from,
				mention.length > 0 ? mention : query.split(',').parse(),
				'REMOVE',
				false,
				/--?(force|F)/.test(query),
				message,
			);
		} else if (!query && mention.length == 0 && !bodyQuoted) {
			return await client[botNum].reply({ from, quoted: message }, 'Please reply people message or mention people.');
		}

		if (
			message?.mention?.includes(`${botNum.split(':')[0]}${S_WHATSAPP_NET}`) ||
			mediaData?.participant?.includes(`${botNum.split(':')[0]}${S_WHATSAPP_NET}`)
		) {
			return await client[botNum].reply({ from, quoted: message }, 'You can not kick me by myself.');
		}

		if (query || mention.length > 0) {
			await client[botNum].updateGroup(
				from,
				mention.length > 0 ? mention : query.split(',').parse(),
				'REMOVE',
				false,
				/--?(force|F)/.test(query),
				message,
				adminGroups,
			);
		}

		if (bodyQuoted) {
			await client[botNum].updateGroup(
				from,
				[mediaData.participant],
				'REMOVE',
				false,
				/--?(force|F)/.test(query),
				message,
				adminGroups,
			);
		}
	},
};
