/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'setbio',
	description: "Set the bot's bio" /* eslint-disable-line */,
	usage: '!setbio <bio>',
	aliases: ['setinfo'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, query, message, groupMetadata }, client) {
		if (!query) {
			return await client[botNum].reply('You must provide a bio to set', { from, quoted: message, groupMetadata });
		}

		await client[botNum].setStatus(query);
	}
};
