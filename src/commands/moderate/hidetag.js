/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'hidetag',
	minifiedDescription: 'Hide tag',
	description: 'Hide tag everyone in the group.',
	usage: '!hidetag <?query>',
	aliases: ['tag', 'h'],
	category: 'Moderation',
	cooldown: 10,
	limit: 5,
	restrict: true,
	status: 'enable',
	async run({ isAdmin, isOwner, from, query, bodyQuoted, participantsGroups, isGroup, message, groupMetadata }, client) {
		if (!isGroup) {
			return await client.instance.reply('This command only works in group.', { from, quoted: message, groupMetadata });
		}

		if (!isAdmin && !isOwner) {
			return await client.instance.reply('You must be an admin to use this command.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		await client.instance.send(from, { text: query || bodyQuoted || ':)', mentions: participantsGroups }, { groupMetadata });
	}
};
