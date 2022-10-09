/* global botNum */
import PhoneNumber from 'awesome-phonenumber';

import { removeDuplicatesArray } from '../../helper/modules/index.js';

Array.prototype.parser = function () {
	return (
		removeDuplicatesArray(this)
			.filter((v) => PhoneNumber(`+${v.replace(/[A-Za-z-@\s+s.whatsapp.net]/g, '')}`).isValid())
			?.map((v) => `${v.replace(/[\s+-]/g, '')}@s.whatsapp.net`.trim()) || []
	);
};

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
	async run({ isAdmin, isBotAdmin, isOwner, from, query, mention, bodyQuoted, mediaData, message, adminGroups }, client) {
		if (!isAdmin && !isOwner) {
			return await client[botNum].reply({ from, quoted: message }, 'You are not admin. This commands is only for admins.');
		}

		if (!query && !bodyQuoted) {
			return await client[botNum].reply({ from, quoted: message }, "Please reply people message or reply people's ");
		}

		if (!isBotAdmin) {
			return await client[botNum].reply({ from, quoted: message }, 'Bot is not admin, Please promote admin before using moderation commands.');
		}

		if (mention?.includes(`${botNum.split(':')[0]}@s.whatsapp.net`) || mediaData?.participant?.includes(`${botNum.split(':')[0]}@s.whatsapp.net`)) {
			return await client[botNum].reply({ from, quoted: message }, "You can't add me by myself.");
		}

		if (query) {
			if (mention.length > 0) {
				return await client[botNum].reply({ from, quoted: message }, "Please reply people message or input people's number.");
			}

			await client[botNum].updateGroup(from, query.split(',').parser(), 'ADD', false, false, message, adminGroups);
		}

		if (bodyQuoted) {
			await client[botNum].updateGroup(from, [mediaData.participant], 'ADD', false, false, message, adminGroups);
		}
	},
};
