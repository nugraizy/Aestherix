/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'promote',
	minifiedDescription: 'Promote User',
	description: 'Promote member to admin.',
	usage: '!promote `<reply/tag member>`',
	aliases: ['prmt', 'admin', 'adm'],
	category: 'Moderation',
	cooldown: 8,
	limit: 6,
	status: 'enable',
	restrict: true,
	async run({ isBotAdmin, query, from, bodyQuoted, mediaData, mention, message, adminGroups }, client) {
		if (!query && !mention.length && !bodyQuoted) {
			return await client.instance.reply(from, 'Please reply people message or mention people.', message);
		}

		if (!isBotAdmin) {
			return await client.instance.reply(
				from,
				'Bot is not admin, Please promote admin before using moderation commands.',
				message
			);
		}

		const myJid = client.instance.decodeJid(instance);

		if (mention?.includes(myJid) || mediaData?.participant?.includes(myJid)) {
			return await client.instance.reply(from, 'You can not promote me by myself.', message);
		}

		if (query || mention.length) {
			await client.instance.updateGroup(from, 'PROMOTE', mention.length ? mention : query.parseNumber(), adminGroups, {
				message
			});
		}

		if (bodyQuoted) {
			await client.instance.updateGroup(from, 'PROMOTE', [mediaData.participant], adminGroups, { message });
		}
	}
};
