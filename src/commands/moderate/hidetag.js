import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'hidetag',
	minifiedDescription: 'Hide tag',
	description: 'Hide tag everyone in the group.',
	usage: '!hidetag `<?query>`',
	aliases: ['tag', 'h'],
	category: 'Moderation',
	cooldown: 10,
	limit: 5,
	restrict: true,
	status: 'enable',
	async run({ isAdmin, isOwner, from, query, bodyQuoted, participantsGroup, isGroup, message }, client) {
		if (!isGroup) {
			return await client.reply(from, 'This command only works in group.', message);
		}

		if (!isAdmin && !isOwner) {
			return await client.reply(from, 'You must be an admin to use this command.', message);
		}

		await client.send(from, { text: query || bodyQuoted || ':)', mentions: participantsGroup }, {});
	}
});
