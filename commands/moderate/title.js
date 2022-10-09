/* global botNum */

export default {
	name: 'title',
	description: 'Change the title of the group.',
	usage: '!title <texts>',
	aliases: ['subject', 'topic', 'name'],
	category: 'Moderation',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ isAdmin, isBotAdmin, isOwner, from, query, bodyQuoted, message }, client) {
		if (!isAdmin && !isOwner) {
			return await client[botNum].reply({ from, quoted: message }, 'You are not admin. This commands is only for admins.');
		}

		if (!isBotAdmin) {
			return await client[botNum].reply({ from, quoted: message }, 'Bot is not admin, Please promote admin before using moderation commands.');
		}

		if (!query) {
			return await client[botNum].reply({ from, quoted: message }, 'Please input the title.');
		}

		if (query) {
			return await client[botNum].updateGroup(from, undefined, 'SUBJECT', query);
		}

		if (bodyQuoted) {
			return await client[botNum].updateGroup(from, undefined, 'SUBJECT', bodyQuoted);
		}
	},
};
