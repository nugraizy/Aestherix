/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'title',
	minifiedDescription: 'Group Title',
	description: 'Change the title of the group.',
	usage: '!title `<texts>`',
	aliases: ['subject', 'topic', 'name'],
	category: 'Moderation',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ isBotAdmin, from, query, bodyQuoted, message }, client) {
		if (!isBotAdmin) {
			return await client.instance.reply(
				from,
				'Bot is not admin, Please promote admin before using moderation commands.',
				message
			);
		}

		if (!query) {
			return await client.instance.reply(from, 'Please input the title.', message);
		}

		if (query) {
			return await client.instance.updateGroup(from, undefined, 'SUBJECT', query);
		} else if (bodyQuoted) {
			return await client.instance.updateGroup(from, undefined, 'SUBJECT', bodyQuoted);
		}
	}
};
