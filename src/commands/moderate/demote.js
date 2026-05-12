/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'demote',
	minifiedDescription: 'Demote Admin',
	description: 'Demote admin to member.',
	usage: '!demote `<reply/tag member>`',
	aliases: ['demt', 'member', 'mem', 'dmt'],
	category: 'Moderation',
	cooldown: 10,
	limit: 2,
	status: 'enable',
	restrict: true,
	async run({ isBotAdmin, mention, from, mediaData, query, bodyQuoted, message, adminGroups }, client) {
		if (!query && !mention.length && !bodyQuoted) {
			return await client.reply(from, 'Please reply people message or mention people.', message);
		}

		const myJid = client.decodeJid(instance);

		if (mention?.includes(myJid) || mediaData?.id?.includes(myJid)) {
			return await client.reply(from, 'You can not demote me by myself.', message);
		}

		if (!isBotAdmin) {
			return await client.reply(
				from,
				'Bot is not admin, Please promote admin before using moderation commands.',
				message
			);
		}

		if (query) {
			await client.updateGroup(from, 'DEMOTE', mention.length ? mention : query.parseNumber(), adminGroups, {
				message
			});
		}

		if (bodyQuoted) {
			await client.updateGroup(from, 'DEMOTE', [mediaData.participant], adminGroups, { message });
		}
	}
};
