/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'kick',
	minifiedDescription: 'Kick User',
	description: 'Kick member from group.',
	usage: '!kick `<reply/tag member>`',
	aliases: ['remove', 'rem', 'rm'],
	category: 'Moderation',
	cooldown: 12,
	limit: 6,
	status: 'enable',
	restrict: true,
	async run({ mediaData, isBotAdmin, type, message, from, mention, query, bodyQuoted, adminGroups }, client) {
		if (!isBotAdmin) {
			return await client.reply(
				from,
				'Bot is not admin, Please promote admin before using moderation commands.',
				message
			);
		}

		if (type === 'buttonsResponseMessage') {
			return await client.updateGroup(from, 'REMOVE', mention.length ? mention : query.parseNumber(), adminGroups, {
				force: /--?(force|F)/.test(query),
				message
			});
		} else if (!query && !mention.length && !bodyQuoted) {
			return await client.reply(from, 'Please reply people message or mention people.', message);
		}

		const myJid = client.decodeJid(instance);

		if (message?.mention?.includes(myJid) || mediaData?.participant?.includes(myJid)) {
			return await client.reply(from, 'You can not kick me by myself.', message);
		}

		if (query || mention.length) {
			await client.updateGroup(from, 'REMOVE', mention.length ? mention : query.parseNumber(), adminGroups, {
				force: /--?(force|F)/.test(query),
				message
			});
		}

		if (bodyQuoted) {
			await client.updateGroup(from, 'REMOVE', [mediaData.participant], adminGroups, {
				force: /--?(force|F)/.test(query),
				message
			});
		}
	}
};
