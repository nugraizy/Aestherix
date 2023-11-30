import { S_WHATSAPP_NET } from '../../helper/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'kick',
	minifiedDescription: 'Kick User',
	description: 'Kick member from group.',
	usage: '!kick <reply/tag member>',
	aliases: ['remove', 'rem', 'rm'],
	category: 'Moderation',
	cooldown: 12,
	limit: 6,
	status: 'enable',
	restrict: true,
	async run({ mediaData, isBotAdmin, type, message, from, mention, query, bodyQuoted, adminGroups, groupMetadata }, client) {
		if (!isBotAdmin) {
			return await client.instance.reply('Bot is not admin, Please promote admin before using moderation commands.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		if (type === 'buttonsResponseMessage') {
			return await client.instance.updateGroup(from, 'REMOVE', mention.length ? mention : query.parseNumber(), adminGroups, {
				force: /--?(force|F)/.test(query),
				message
			});
		} else if (!query && !mention.length && !bodyQuoted) {
			return await client.instance.reply('Please reply people message or mention people.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		const myJid = client.instance.decodeJid(instance);

		if (message?.mention?.includes(myJid) || mediaData?.participant?.includes(myJid)) {
			return await client.instance.reply('You can not kick me by myself.', { from, quoted: message, groupMetadata });
		}

		if (query || mention.length) {
			await client.instance.updateGroup(from, 'REMOVE', mention.length ? mention : query.parseNumber(), adminGroups, {
				force: /--?(force|F)/.test(query),
				message
			});
		}

		if (bodyQuoted) {
			await client.instance.updateGroup(from, 'REMOVE', [mediaData.participant], adminGroups, {
				force: /--?(force|F)/.test(query),
				message
			});
		}
	}
};
