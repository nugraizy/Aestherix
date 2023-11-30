/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'add',
	minifiedDescription: 'Invite User',
	description: 'Add people to group.',
	usage: '!add <reply/tag member>',
	aliases: ['addmem', 'invite'],
	category: 'Moderation',
	cooldown: 10,
	limit: 4,
	restrict: true,
	status: 'enable',
	async run({ isBotAdmin, from, query, mention, bodyQuoted, mediaData, message, adminGroups, groupMetadata }, client) {
		if (!query && !bodyQuoted) {
			return await client.instance.reply('Please reply people message or reply people', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		if (!isBotAdmin) {
			return await client.instance.reply('Bot is not admin, Please promote admin before using moderation commands.', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		const myJid = client.instance.decodeJid(instance);

		if (mention?.includes(myJid) || mediaData?.participant?.includes(myJid)) {
			return await client.instance.reply('You can not add me by myself.', { from, quoted: message, groupMetadata });
		}

		if (query) {
			if (mention.length) {
				return await client.instance.reply('Please reply people message or input people number.', {
					from,
					quoted: message,
					groupMetadata
				});
			}

			await client.instance.updateGroup(from, 'ADD', query.parseNumber(), adminGroups, { message });
		}

		if (bodyQuoted) {
			await client.instance.updateGroup(from, 'ADD', [mediaData.participant], adminGroups, { message });
		}
	}
};
