/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
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
	async run({ isAdmin, isOwner, from, query, bodyQuoted, participantsGroups, isGroup, message, groupMetadata }, client) {
		if (!isGroup) {
			return await client[botNum].reply('This command only works in group.', { from, quoted: message, groupMetadata });
		}

		if (!isAdmin && !isOwner) {
			return await client[botNum].reply('You must be an admin to use this command.', { from, quoted: message, groupMetadata });
		}

		await client[botNum].send(from, { text: query || bodyQuoted || ':)', mentions: participantsGroups }, { groupMetadata });
	}
};
