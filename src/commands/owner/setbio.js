/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'setbio',
	minifiedDescription: 'Change Bio',
	description: "Set the bot's bio" /* eslint-disable-line */,
	usage: '!setbio `<bio>`',
	aliases: ['setinfo'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, query, message }, client) {
		if (!query) {
			return await client.reply(from, 'You must provide a bio to set', message);
		}

		await client.setStatus(query);
	}
};
