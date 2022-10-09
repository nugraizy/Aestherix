/* global botNum */

export default {
	name: 'hidetag',
	description: 'Hide tag',
	usage: '!hidetag <?query>',
	aliases: ['tag', 'h'],
	category: 'Moderation',
	cooldown: 10,
	limit: 5,
	restrict: true,
	status: 'enable',
	async run({ isAdmin, isOwner, from, query, bodyQuoted, participantsGroups, isGroup, message }, client) {
		if (!isGroup) {
			return await client[botNum].reply({ from, quoted: message }, 'This command only works in group.');
		}

		if (!isAdmin && !isOwner) {
			return await client[botNum].reply({ from, quoted: message }, 'You must be an admin to use this command.');
		}

		await client[botNum].sendMessage(from, { text: query || bodyQuoted || ':)', mentions: participantsGroups });
	},
};
