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
	name: 'demote',
	description: 'Demote admin to member.',
	usage: '!demote <reply/tag member>',
	aliases: ['demt', 'member', 'mem', 'dmt'],
	category: 'Moderation',
	cooldown: 10,
	limit: 2,
	status: 'enable',
	restrict: true,
	async run({ isAdmin, isBotAdmin, isOwner, mention, from, mediaData, query, bodyQuoted, message, adminGroups }, client) {
		if (!isAdmin && !isOwner) {
			return await client[botNum].reply({ from, quoted: message }, 'You are not admin. This commands is only for admins.');
		}

		if (!query && mention.length == 0 && !bodyQuoted) {
			return await client[botNum].reply({ from, quoted: message }, 'Please reply people message or mention people.');
		}

		if (!isBotAdmin) {
			return await client[botNum].reply(
				{ from, quoted: message },
				'Bot is not admin, Please promote admin before using moderation commands.',
			);
		}

		if (
			mention?.includes(`${botNum.split(':')[0]}${S_WHATSAPP_NET}`) ||
			mediaData?.participant?.includes(`${botNum.split(':')[0]}${S_WHATSAPP_NET}`)
		) {
			return await client[botNum].reply({ from, quoted: message }, 'You can not demote me by myself.');
		}

		if (query || mention.length > 0) {
			await client[botNum].updateGroup(
				from,
				mention.length > 0 ? mention : query.split(',').parse(),
				'DEMOTE',
				false,
				false,
				message,
				adminGroups,
			);
		}

		if (bodyQuoted) {
			await client[botNum].updateGroup(from, [mediaData.participant], 'DEMOTE', false, false, message, adminGroups);
		}
	},
};
