/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'add',
	minifiedDescription: 'Invite User',
	description: 'Add people to group.',
	usage: '!add `<reply/tag member>`',
	aliases: ['addmem', 'invite'],
	category: 'Moderation',
	cooldown: 10,
	limit: 4,
	restrict: true,
	status: 'enable',
	async run({ isBotAdmin, from, query, mention, bodyQuoted, mediaData, message, adminGroups }, client) {
		if (!query && !bodyQuoted) {
			return await client.reply(from, 'Please reply people message or reply people', message);
		}

		const myJid = client.decodeJid(instance);

		if (mention?.includes(myJid) || mediaData?.id?.includes(myJid)) {
			return await client.reply(from, 'You can not add me by myself.', message);
		}

		if (!isBotAdmin) {
			return await client.reply(
				from,
				'Bot is not admin, Please promote admin before using moderation commands.',
				message
			);
		}

		if (query) {
			if (mention.length) {
				return await client.reply(from, 'Please reply people message or input people number.', message);
			}

			await client.updateGroup(from, 'ADD', query.parseNumber(), adminGroups, { message });
		}

		if (bodyQuoted) {
			await client.updateGroup(from, 'ADD', [mediaData.id], adminGroups, { message });
		}
	}
};
