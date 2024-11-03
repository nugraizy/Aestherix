/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'demote',
	minifiedDescription: 'Demote Admin',
	description: 'Demote admin to member.',
	usage: '!demote <reply/tag member>',
	aliases: ['demt', 'member', 'mem', 'dmt'],
	category: 'Moderation',
	cooldown: 10,
	limit: 2,
	status: 'enable',
	restrict: true,
	async run({ isBotAdmin, mention, from, mediaData, query, bodyQuoted, message, adminGroups }, client) {
		if (!query && !mention.length && !bodyQuoted) {
			return await client.instance.reply('Please reply people message or mention people.', {
				from,
				quoted: message
			});
		}

		if (!isBotAdmin) {
			return await client.instance.reply('Bot is not admin, Please promote admin before using moderation commands.', {
				from,
				quoted: message
			});
		}

		const myJid = client.instance.decodeJid(instance);

		if (mention?.includes(myJid) || mediaData?.participant?.includes(myJid)) {
			return await client.instance.reply('You can not demote me by myself.', { from, quoted: message });
		}

		if (query) {
			await client.instance.updateGroup(from, 'DEMOTE', mention.length ? mention : query.parseNumber(), adminGroups, {
				message
			});
		}

		if (bodyQuoted) {
			await client.instance.updateGroup(from, 'DEMOTE', [mediaData.participant], adminGroups, { message });
		}
	}
};
