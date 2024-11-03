/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'description',
	minifiedDescription: 'Change Description',
	description: 'Change the description of the group.',
	usage: '!description <texts>',
	aliases: ['desc'],
	category: 'Moderation',
	cooldown: 4,
	limit: 2,
	status: 'enable',
	async run({ isBotAdmin, query, bodyQuoted, from, message }, client) {
		if (!query) {
			return await client.instance.reply('Please input the description.', { from, quoted: message });
		}

		if (!isBotAdmin) {
			return await client.instance.reply('Bot is not admin, Please promote admin before using moderation commands.', {
				from,
				quoted: message
			});
		}

		if (query) {
			return await client.instance.updateGroup(from, 'DESCRIPTION', [], [], { texts: query });
		}

		if (bodyQuoted) {
			return await client.instance.updateGroup(from, 'DESCRIPTION', [], [], { texts: bodyQuoted });
		}
	}
};
